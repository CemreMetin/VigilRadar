"use client";

import { useEffect, useState } from "react";

/** The current time, refreshed every `everyMs`. 0 until mounted, so the static page and the first client render agree. */
export function useNow(everyMs = 30_000): number {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = requestAnimationFrame(tick);
    const id = window.setInterval(tick, everyMs);
    return () => { cancelAnimationFrame(first); window.clearInterval(id); };
  }, [everyMs]);
  return now;
}
