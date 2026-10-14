"use client";

import { useEffect, useState } from "react";

/**
 * Loads a static JSON file the first time `enabled` becomes true (a layer was switched on), then keeps it.
 * `failed` is true when the file could not be loaded, so the layer can say it is unavailable instead of staying blank.
 */
export function useLazyJson<T>(url: string, enabled: boolean): { data: T | null; failed: boolean } {
  const [state, setState] = useState<{ data: T | null; failed: boolean }>({ data: null, failed: false });
  useEffect(() => {
    if (!enabled || state.data || state.failed) return;
    let cancelled = false;
    fetch(url)
      .then((r) => (r.ok ? (r.json() as Promise<T>) : Promise.reject(new Error(String(r.status)))))
      .then((data) => !cancelled && setState({ data, failed: false }))
      .catch(() => !cancelled && setState({ data: null, failed: true }));
    return () => {
      cancelled = true;
    };
  }, [url, enabled, state.data, state.failed]);
  return state;
}
