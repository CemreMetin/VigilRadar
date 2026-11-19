"use client";

import { useEffect } from "react";

/** Registers the service worker in production builds only (in dev it would cache stale chunks). */
export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    // The /alert page must open (and the Radar and /about open too, showing the last good data) with no connection, so it is saved on the first visit (once per version of this list).
    const FLAG = "vigil.precached.v1";
    navigator.serviceWorker.register("/sw.js").then(async () => {
      try {
        if (window.localStorage.getItem(FLAG)) return;
        const reg = await navigator.serviceWorker.ready;
        reg.active?.postMessage({ type: "CACHE_PAGES", pages: ["/alert", "/", "/about", "/manifest.webmanifest"] });
        window.localStorage.setItem(FLAG, "1");
      } catch { /* storage blocked: it is tried again next visit */ }
    }).catch(() => {
      /* not fatal: the site works the same without offline support */
    });
  }, []);
  return null;
}
