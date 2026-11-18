import { CONFIG } from "./config";
import { haversineKm } from "./geo";
import type { ConflictCluster, Link, LinkKind, LinkTarget, MergedQuake, Site } from "./types";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

const pairKey = (l: Pick<Link, "fromKind" | "toId">) => `${l.fromKind}:${l.toId}`;
const mk = (fromKind: LinkKind, fromId: string, toKind: LinkTarget, s: Site, distanceKm: number, startedMs: number): Link => ({
  id: `${fromKind}:${fromId}>${toKind}:${s.id}`,
  fromKind, fromId, toKind, toId: s.id, distanceKm,
  rule: `${fromKind}→${toKind}`,
  startedMs,
  chronic: false,
});

/** Quake links (VIGIL.md 5.4): only quakes of the last 24 hours, never retracted ones. */
export function quakeLinks(quakes: readonly MergedQuake[], plants: readonly Site[], chokepoints: readonly Site[], nowMs: number): Link[] {
  const out: Link[] = [];
  for (const q of quakes) {
    const b = q.best;
    if (q.retracted || nowMs - b.timeMs > CONFIG.status.quakeWindowHours * HOUR) continue;
    const row = [...CONFIG.plantLinkTable].reverse().find((r) => r[0] <= b.mag);
    if (row) for (const p of plants) { const d = haversineKm(b, p); if (d <= row[1]) out.push(mk("quake", q.id, "plant", p, d, b.timeMs)); }
    if (b.mag >= CONFIG.chokepointQuake.minMag)
      for (const c of chokepoints) { const d = haversineKm(b, c); if (d <= CONFIG.chokepointQuake.radiusKm) out.push(mk("quake", q.id, "chokepoint", c, d, b.timeMs)); }
  }
  return out;
}

export function conflictLinks(clusters: readonly ConflictCluster[], plants: readonly Site[], chokepoints: readonly Site[], nowMs: number): Link[] {
  const out: Link[] = [];
  for (const c of clusters) {
    for (const p of plants) { const d = haversineKm(c, p); if (d <= CONFIG.conflict.plantRadiusKm) out.push(mk("conflict", c.id, "plant", p, d, nowMs)); }
    for (const s of chokepoints) { const d = haversineKm(c, s); if (d <= CONFIG.conflict.chokepointRadiusKm) out.push(mk("conflict", c.id, "chokepoint", s, d, nowMs)); }
  }
  return out;
}

/**
 * A (fromKind, toId) pair that has been continuously active for more than 7 days is chronic: it stays on the map
 * but never raises the status. `prev` is the link list of the previous run; a pair missing from it starts over.
 */
export function markChronic(links: readonly Link[], prev: readonly Link[], nowMs: number): Link[] {
  const since = new Map<string, number>();
  for (const l of prev) since.set(pairKey(l), Math.min(l.startedMs, since.get(pairKey(l)) ?? Infinity));
  return links.map((l) => {
    const startedMs = Math.min(l.startedMs, since.get(pairKey(l)) ?? Infinity);
    return { ...l, startedMs, chronic: nowMs - startedMs > CONFIG.status.chronicDays * DAY };
  });
}
