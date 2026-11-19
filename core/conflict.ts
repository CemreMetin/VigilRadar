import { CONFIG } from "./config";
import type { ConflictCluster, GdeltRow } from "./types";

const HOUR = 3_600_000;
const C = CONFIG.conflict;

function domainOf(url: string): string | null {
  try { return new URL(url).hostname.replace(/^www\./, "").toLowerCase() || null; } catch { return null; }
}

/** The three most reported links, one per news site, so the card shows three different sources. */
function distinctDomainUrls(sorted: readonly GdeltRow[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of sorted) {
    const d = domainOf(r.sourceUrl) ?? r.sourceUrl;
    if (seen.has(d)) continue;
    seen.add(d);
    out.push(r.sourceUrl);
    if (out.length === 3) break;
  }
  return out;
}

const accepted = (r: GdeltRow) =>
  (C.rootCodes.includes(r.rootCode as never) || C.extraBaseCodes.includes(r.baseCode as never)) &&
  C.geoTypes.includes(r.geoType as never) &&
  Number.isFinite(r.lat) && Number.isFinite(r.lon);

/** Grid clusters of city-level conflict reports from the last 24 hours (VIGIL.md 5.6). */
export function clusterConflicts(rows: readonly GdeltRow[], nowMs: number): ConflictCluster[] {
  const byId = new Map<string, GdeltRow>();
  for (const r of rows) if (accepted(r) && nowMs - r.dateAddedMs <= C.windowHours * HOUR) byId.set(r.id, r);

  const cells = new Map<string, GdeltRow[]>();
  for (const r of byId.values()) {
    const id = `${Math.floor(r.lat / C.cellDeg)}:${Math.floor(r.lon / C.cellDeg)}`;
    cells.set(id, [...(cells.get(id) ?? []), r]);
  }

  const out: ConflictCluster[] = [];
  for (const [id, list] of cells) {
    const domains = new Set(list.map((r) => domainOf(r.sourceUrl)).filter((d): d is string => !!d));
    if (list.length < C.minEvents || domains.size < C.minDistinctDomains) continue;
    const names = new Map<string, number>();
    for (const r of list) names.set(r.fullName, (names.get(r.fullName) ?? 0) + 1);
    out.push({
      id,
      lat: list.reduce((s, r) => s + r.lat, 0) / list.length,
      lon: list.reduce((s, r) => s + r.lon, 0) / list.length,
      label: [...names].sort((a, b) => b[1] - a[1])[0][0],
      events: list.length,
      domains: domains.size,
      lastSeenMs: Math.max(...list.map((r) => r.dateAddedMs)),
      sampleUrls: distinctDomainUrls([...list].sort((a, b) => b.numSources - a.numSources)),
    });
  }
  return out;
}

/** Fresh clusters replace the old ones; an old cluster that is not seen again lives on until 48 h after its last report. */
export function expireClusters(prev: readonly ConflictCluster[], fresh: readonly ConflictCluster[], nowMs: number): ConflictCluster[] {
  const ids = new Set(fresh.map((c) => c.id));
  return [...fresh, ...prev.filter((c) => !ids.has(c.id) && nowMs - c.lastSeenMs <= C.ttlHours * HOUR)];
}
