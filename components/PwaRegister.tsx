"use client";

import { useEffect } from "react";

/** Registers the service worker in production builds only (in dev it would cache stale chunks). */
export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    // The map, the scenarios and /about must open with no connection (showing the last good data), so they are saved on the first visit (once per version of this list).
    const FLAG = "vigil.precached.v3";
    const save = (worker: ServiceWorker | null) => worker?.postMessage({ type: "CACHE_PAGES", pages: ["/", "/library", "/about", "/manifest.webmanifest"] });
    // an update replaces the worker and drops its caches, so the new one saves the pages again
    const sw = navigator.serviceWorker;
    if (sw.controller) sw.addEventListener("controllerchange", () => save(sw.controller), { once: true });
    navigator.serviceWorker.register("/sw.js").then(async () => {
      try {
        if (window.localStorage.getItem(FLAG)) return;
        const reg = await navigator.serviceWorker.ready;
        save(reg.active);
        window.localStorage.setItem(FLAG, "1");
      } catch { /* storage blocked: it is tried again next visit */ }
    }).catch(() => {
      /* not fatal: the site works the same without offline support */
    });
  }, []);
  return null;
}
