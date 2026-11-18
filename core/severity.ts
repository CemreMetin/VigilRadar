import { CONFIG } from "./config";
import { haversineKm } from "./geo";
import type { Province, QuakeEvent, Severity } from "./types";

type Hypo = Pick<QuakeEvent, "lat" | "lon" | "depthKm" | "mag">;

/** P0 / P1 / P2 for one province (VIGIL.md 5.3), or null when the quake is too small or too far. */
export function severityFor(p: Province, q: Hypo): Severity | null {
  const row = [...CONFIG.severityTable].reverse().find((r) => r[0] <= q.mag);
  if (!row) return null;
  const d = Math.max(0, haversineKm(p, q) - CONFIG.provinceExtentKm);
  const r = Math.hypot(d, q.depthKm);
  const levels: [Severity, number | null][] = [["P0", row[1]], ["P1", row[2]], ["P2", row[3]]];
  return levels.find(([, km]) => km !== null && r <= km)?.[0] ?? null;
}

export function severityByProvince(provinces: readonly Province[], q: Hypo): Record<string, Severity> {
  const out: Record<string, Severity> = {};
  for (const p of provinces) { const s = severityFor(p, q); if (s) out[p.code] = s; }
  return out;
}
