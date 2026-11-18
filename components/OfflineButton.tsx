"use client";

import { useEffect, useState } from "react";
import { SCENARIOS } from "@/data/scenarios";
import { PAGE_GROUPS } from "./SiteNav";

const FLAG = "monitoring.offline.v1";
const PAGES_TO_SAVE = [
  ...PAGE_GROUPS.flatMap((g) => g.pages.map((p) => p.href)),
  ...SCENARIOS.map((s) => `/library/${s.id}`),
  "/survive/pack",
  "/search-index.json",
  "/data/world_state.json",
  "/data/links.json",
  "/data/country_profiles.json",
  "/data/nuclear_plants.json",
  "/data/asteroids.json",
  "/data/tide_gauges.json",
  "/data/cyclones.json",
  "/data/places.json",
  "/data/nuclear_targets.json",
  "/data/aurora.json",
  "/data/solar_now.json",
  "/data/bsl4_labs.json",
  "/data/countries.geo.json",
  "/data/conflict_cells.json",
  "/data/indicators.json",
  "/data/airports.json",
  "/data/series.json",
  "/manifest.webmanifest",
];

type State = "idle" | "working" | "done" | "error" | "unsupported";

export default function OfflineButton() {
  const [state, setState] = useState<State>("idle");
  const [detail, setDetail] = useState("");

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState("unsupported");
      return;
    }
    try {
      if (window.localStorage.getItem(FLAG)) setState("done");
    } catch {
      /* ignore */
    }
  }, []);

  const save = async () => {
    setState("working");
    setDetail("");
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const worker = reg.active ?? navigator.serviceWorker.controller;
      if (!worker) throw new Error("service worker not active yet, reload and try again");
      const result = await new Promise<{ count: number; failed: number }>((resolve, reject) => {
        const channel = new MessageChannel();
        const timer = setTimeout(() => reject(new Error("timed out")), 60_000);
        channel.port1.onmessage = (e) => {
          clearTimeout(timer);
          resolve(e.data as { count: number; failed: number });
        };
        worker.postMessage({ type: "CACHE_PAGES", pages: PAGES_TO_SAVE }, [channel.port2]);
      });
      try {
        window.localStorage.setItem(FLAG, new Date().toISOString());
      } catch {
        /* ignore */
      }
      setDetail(`${result.count} files saved${result.failed ? `, ${result.failed} could not be fetched` : ""}.`);
      setState("done");
    } catch (e) {
      setDetail(e instanceof Error ? e.message : "failed");
      setState("error");
    }
  };

  if (state === "unsupported") {
    return <p className="text-body text-dim">This browser cannot save the site for offline use.</p>;
  }

  return (
    <div className="border border-line p-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={state === "working"}
          className="mono border border-safe px-3 py-1.5 text-body text-safe hover:bg-safe/10 disabled:opacity-50"
        >
          {state === "working" ? "saving…" : state === "done" ? "update offline copy" : "save for offline use"}
        </button>
        <span className="text-body text-dim" role="status">
          {state === "done" && "Saved on this device. "}
          {state === "error" && `Could not save: ${detail}. `}
          {detail && state === "done" ? detail : ""}
        </span>
      </div>
      <p className="mt-2 text-body leading-relaxed text-dim">
        Stores this site, the checklist and the latest data on your device so they open with no connection (works after
        the site is served over HTTPS). The map background still needs internet. You can also install it as an app from
        your browser menu.
      </p>
    </div>
  );
}
