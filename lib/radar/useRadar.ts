"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { CONFIG } from "@/core/config";
import { browserDeps, loadState, readCache, type Loaded } from "./load";

// read once per visit of a page, on its first client render after hydration; the server snapshot is empty
let first: Loaded | null | undefined;
const cachedState = () => (first === undefined ? (first = readCache(browserDeps())) : first);
const never = () => () => {};

/**
 * Shows the last good state at once (stale-while-revalidate), then polls every 60 s while the tab is visible;
 * a hidden tab pauses and refreshes on return.
 */
export function useRadar(): { loaded: Loaded | null; done: boolean } {
  const cached = useSyncExternalStore(never, cachedState, () => null);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [done, setDone] = useState(false);
  useEffect(() => {
    let alive = true;
    const run = async () => {
      const r = await loadState(browserDeps());
      if (!alive) return;
      if (r) setLoaded(r);
      setDone(true);
    };
    const tick = () => { if (document.visibilityState === "visible") void run(); };
    void run();
    const id = window.setInterval(tick, CONFIG.poll.clientSec * 1000);
    document.addEventListener("visibilitychange", tick);
    return () => { first = undefined; alive = false; window.clearInterval(id); document.removeEventListener("visibilitychange", tick); };
  }, []);
  return { loaded: loaded ?? cached, done };
}
