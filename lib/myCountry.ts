import { useSyncExternalStore } from "react";
import countries from "@/data/countries.json";

const KEY = "monitoring:my-country";
const known = new Set(countries.map((c) => c.iso3));
const listeners = new Set<() => void>();
let fallback: string | null = null; // used while storage is blocked, so the choice still lasts for the visit

function read(): string | null {
  try {
    const value = window.localStorage.getItem(KEY);
    return value && known.has(value) ? value : null;
  } catch {
    return fallback;
  }
}

function write(iso3: string | null) {
  fallback = iso3;
  try {
    if (iso3) window.localStorage.setItem(KEY, iso3);
    else window.localStorage.removeItem(KEY);
  } catch {
    /* storage blocked: the in-memory fallback above is all we have */
  }
  listeners.forEach((l) => l());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange); // other tabs
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** The visitor's country (ISO3) or null, and a setter. Kept only in this browser; nothing is sent anywhere. */
export function useMyCountry(): [string | null, (iso3: string | null) => void] {
  return [useSyncExternalStore(subscribe, read, () => null), write];
}
