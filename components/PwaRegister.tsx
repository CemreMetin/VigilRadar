"use client";

import { useEffect } from "react";

/** Registers the service worker in production builds only (in dev it would cache stale chunks). */
export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* not fatal: the site works the same without offline support */
    });
  }, []);
  return null;
}
