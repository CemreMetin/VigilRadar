import { useCallback, useSyncExternalStore } from "react";
import { PROVINCES } from "@/core/build-state";
import type { Province } from "@/core/types";

export type Region = "GLOBAL" | string; // "GLOBAL" or a province code such as "TR-06"
const KEY = "vigil.region";
const HINT_KEY = "vigil.hintDismissed";
const listeners = new Set<() => void>();

/** Lower case with Turkish letters folded, so "istanbul", "İSTANBUL" and "Istanbul" all match. */
export function fold(s: string): string {
  return s.replace(/İ/g, "i").replace(/I/g, "i").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i").replace(/ğ/g, "g");
}

export function filterProvinces(query: string, list: readonly Province[] = PROVINCES): Province[] {
  const q = fold(query.trim());
  return q ? list.filter((p) => fold(p.name).includes(q) || p.code.toLowerCase().includes(q)) : [...list];
}

function read(key: string): string | null {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
function write(key: string, value: string) {
  try { window.localStorage.setItem(key, value); } catch { /* blocked: the choice lasts until reload */ }
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => { listeners.delete(cb); window.removeEventListener("storage", cb); };
}

/** The chosen region, from localStorage only; nothing about the choice leaves the browser. A stale or invented code falls back to GLOBAL. */
export function useRegion(): { region: Region; province: Province | null; setRegion: (r: Region) => void; showHint: boolean; dismissHint: () => void } {
  const raw = useSyncExternalStore(subscribe, () => read(KEY), () => null);
  const hintDone = useSyncExternalStore(subscribe, () => read(HINT_KEY), () => "1");
  const province = PROVINCES.find((p) => p.code === raw) ?? null;
  let istanbulZone = false;
  try { istanbulZone = Intl.DateTimeFormat().resolvedOptions().timeZone === "Europe/Istanbul"; } catch { /* no Intl zone */ }
  return {
    region: province ? province.code : "GLOBAL",
    province,
    setRegion: useCallback((r: Region) => write(KEY, r), []),
    showHint: istanbulZone && !province && !hintDone,
    dismissHint: useCallback(() => write(HINT_KEY, "1"), []),
  };
}
