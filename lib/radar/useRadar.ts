"use client";

import { useEffect, useState } from "react";
import { CONFIG } from "@/core/config";
import { browserDeps, loadState, type Loaded } from "./load";

/** Polls the state every 60 s while the tab is visible; a hidden tab pauses and refreshes on return. */
export function useRadar(): { loaded: Loaded | null; done: boolean } {
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
    return () => { alive = false; window.clearInterval(id); document.removeEventListener("visibilitychange", tick); };
  }, []);
  return { loaded, done };
}
