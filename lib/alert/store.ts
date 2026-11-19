"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

// JSON values in localStorage for the Alert page (bag ticks, radio frequency, family plan). Nothing here leaves the browser.
const listeners = new Set<() => void>();
const read = (key: string): string | null => { try { return window.localStorage.getItem(key); } catch { return null; } };
function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => { listeners.delete(cb); window.removeEventListener("storage", cb); };
}

export function useStored<T>(key: string, fallback: T): [T, (v: T) => void] {
  const raw = useSyncExternalStore(subscribe, () => read(key), () => null);
  const value = useMemo(() => { try { return raw === null ? fallback : (JSON.parse(raw) as T); } catch { return fallback; } }, [raw, fallback]);
  const set = useCallback((v: T) => {
    try { window.localStorage.setItem(key, JSON.stringify(v)); } catch { /* blocked: the change lasts until reload */ }
    listeners.forEach((l) => l());
  }, [key]);
  return [value, set];
}

export interface Plan { meet1: string; meet2: string; contact: string; who: string; where: string; name: string; rel1: string; rel2: string; blood: string; meds: string; allergy: string }
export const EMPTY_PLAN: Plan = { meet1: "", meet2: "", contact: "", who: "", where: "", name: "", rel1: "", rel2: "", blood: "", meds: "", allergy: "" };
export const NO_TICKS: string[] = [];
