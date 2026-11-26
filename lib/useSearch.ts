import { useSyncExternalStore } from "react";

// The query string as a store. `useSearchParams` would put a static export behind a Suspense fallback.
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("popstate", onChange);
  };
}

/** Replaces the query string of the current page (no history entry, no navigation). */
export function writeSearch(search: string) {
  window.history.replaceState(null, "", `${window.location.pathname}${search}`);
  listeners.forEach((l) => l());
}

export const useSearch = () => useSyncExternalStore(subscribe, () => window.location.search, () => "");
