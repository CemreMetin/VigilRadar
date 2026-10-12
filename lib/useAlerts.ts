"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Alert, AlertsFile } from "./alerts";

/**
 * Live alerts for an open dashboard: plain polling (no server push needed, no database).
 * Two sources are merged: the site's own /data/alerts.json (refreshed with every deploy) and, when
 * NEXT_PUBLIC_ALERTS_URL is set, the fast feed the alerts workflow publishes every 5 minutes.
 * Polling is paused while the tab is hidden and runs at once when it becomes visible again.
 * Acknowledged ids are kept in localStorage, on this device only.
 */

const POLL_MS = 60_000;
const ACK_KEY = "monitoring.alerts.ack.v1";
const URLS = [process.env.NEXT_PUBLIC_ALERTS_URL, "/data/alerts.json"].filter((u): u is string => !!u);

function loadAck(): Set<string> {
  try {
    return new Set(JSON.parse(window.localStorage.getItem(ACK_KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

export function useAlerts(now: number | null) {
  const [all, setAll] = useState<Alert[]>([]);
  const [ack, setAck] = useState<Set<string>>(new Set());
  const stopped = useRef(false);

  const poll = useCallback(async () => {
    const results = await Promise.all(
      URLS.map((u) =>
        fetch(u, { cache: "no-cache" })
          .then((r) => (r.ok ? (r.json() as Promise<AlertsFile>) : null))
          .catch(() => null),
      ),
    );
    if (stopped.current) return;
    const merged = new Map<string, Alert>();
    for (const f of results) for (const a of f?.active ?? []) merged.set(a.id, a);
    // if every source failed, keep what we had rather than clearing a live alarm
    if (results.some((f) => f !== null)) setAll([...merged.values()]);
  }, []);

  useEffect(() => {
    stopped.current = false;
    /* eslint-disable react-hooks/set-state-in-effect */
    setAck(loadAck());
    poll();
    /* eslint-enable react-hooks/set-state-in-effect */
    const timer = setInterval(() => document.visibilityState === "visible" && poll(), POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && poll();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped.current = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [poll]);

  const live = useMemo(
    () => (now === null ? [] : all.filter((a) => Date.parse(a.expiresAt) > now && !ack.has(a.id)).sort((a, b) => b.at.localeCompare(a.at))),
    [all, ack, now],
  );

  const acknowledge = useCallback((ids: string[]) => {
    setAck((prev) => {
      const next = new Set([...prev, ...ids]);
      try {
        window.localStorage.setItem(ACK_KEY, JSON.stringify([...next].slice(-200)));
      } catch {
        /* storage unavailable: the acknowledgement lasts until reload */
      }
      return next;
    });
  }, []);

  return {
    critical: live.filter((a) => a.level === "critical"),
    notices: live.filter((a) => a.level === "notice"),
    acknowledge,
  };
}
