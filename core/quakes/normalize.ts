import { CONFIG } from "../config";
import type { QuakeEvent } from "../types";

export function inTrBox(p: { lat: number; lon: number }): boolean {
  const b = CONFIG.quake.trBox;
  return p.lat >= b.minLat && p.lat <= b.maxLat && p.lon >= b.minLon && p.lon <= b.maxLon;
}

/** Acceptance rule: M4.0 inside the Turkey box, M5.0 elsewhere; malformed records are refused. */
export function accept(e: QuakeEvent): boolean {
  if (![e.timeMs, e.lat, e.lon, e.depthKm, e.mag].every(Number.isFinite)) return false;
  return e.mag >= (inTrBox(e) ? CONFIG.quake.trMinMag : CONFIG.quake.globalMinMag);
}
