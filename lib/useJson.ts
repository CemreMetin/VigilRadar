"use client";

import { useEffect, useState } from "react";

export type JsonState<T> = { data: T | null; error: string | null; loading: boolean };

/** Fetches a static JSON file from /data once on mount. Returns data, error and a loading flag. */
export function useJson<T>(url: string): JsonState<T> {
  const [state, setState] = useState<JsonState<T>>({ data: null, error: null, loading: true });
  useEffect(() => {
    let cancelled = false;
    fetch(url, { cache: "no-cache" })
      .then((r) => (r.ok ? (r.json() as Promise<T>) : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => !cancelled && setState({ data, error: null, loading: false }))
      .catch((e: unknown) =>
        !cancelled && setState({ data: null, error: e instanceof Error ? e.message : "load failed", loading: false }),
      );
    return () => {
      cancelled = true;
    };
  }, [url]);
  return state;
}
