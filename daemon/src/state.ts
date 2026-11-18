import { quakeLinks, conflictLinks, markChronic } from "../../core/cascade";
import { mergeQuakes } from "../../core/quakes/merge";
import { severityByProvince } from "../../core/severity";
import { globalStatus } from "../../core/status";
import type { ChokepointFlow, ConflictCluster, Province, QuakeEvent, QuakeSource, Severity, Site, SourceKey, State, StatusReason, TsunamiBulletin } from "../../core/types";
import placesJson from "../../public/data/static/places.tr.json";
import plantsJson from "../../public/data/static/plants.json";

const HOUR = 3_600_000;
export const PROVINCES = (placesJson as { places: Province[] }).places;
export const PLANTS: Site[] = (plantsJson as { plants: Site[] }).plants.map(({ id, name, lat, lon }) => ({ id, name, lat, lon }));

/** Output of the slow lane (Faz 5 writes it through /v1/ingest/slow); empty until then. */
export interface Slow { conflicts: ConflictCluster[]; conflictsMs: number | null; chokepoints: ChokepointFlow[] }
export const EMPTY_SLOW: Slow = { conflicts: [], conflictsMs: null, chokepoints: [] };

export const SOURCE_KEYS: SourceKey[] = ["usgs", "emsc", "afad", "kandilli", "tsunami"];

export function formatReason(r: StatusReason | null): string | null {
  if (!r) return null;
  switch (r.kind) {
    case "stale": return "fast lane heartbeat is older than 15 minutes";
    case "quake": case "pager": case "province-severity": case "province-tsunami": return `M${r.mag} · ${r.place}`;
    case "tsunami": return r.title;
    case "link": return r.linkId;
    case "chokepoint": return `${r.id} ${r.state}`;
  }
}

export interface TurnInput {
  prev: State | null;
  nowMs: number;
  events: QuakeEvent[]; // everything the quake sources returned this turn
  ok: Record<QuakeSource, boolean>;
  tsunami: TsunamiBulletin[] | null; // null: not fetched this turn or the fetch failed
  tsunamiOk: boolean | null; // null: not fetched this turn
  slow: Slow | null;
  fastMs: number; // the heartbeat to judge staleness by
}

/** One cron turn as a pure function: merge, links, status, province levels. */
export function buildState(i: TurnInput): State {
  const { prev, nowMs } = i;
  const slow = i.slow ?? EMPTY_SLOW;
  const sources = {} as State["sources"];
  for (const k of SOURCE_KEYS) {
    const was = prev?.sources[k] ?? { ok: false, ms: 0 };
    const ok = k === "tsunami" ? i.tsunamiOk : i.ok[k];
    sources[k] = ok === null ? was : { ok, ms: ok ? nowMs : was.ms };
  }
  const tsunami = (i.tsunami ?? prev?.tsunami ?? []).filter((b) => nowMs - b.timeMs <= 24 * HOUR);
  const quakes = mergeQuakes(prev?.quakes ?? [], i.events, nowMs);
  const cps: Site[] = slow.chokepoints.filter((c) => c.available);
  const links = markChronic([...quakeLinks(quakes, PLANTS, cps, nowMs), ...conflictLinks(slow.conflicts, PLANTS, cps, nowMs)], prev?.links ?? [], nowMs);
  const g = globalStatus({ nowMs, heartbeatMs: i.fastMs, quakes, links, tsunami, chokepoints: cps.length ? slow.chokepoints.filter((c) => c.available).map((c) => ({ id: c.id, state: c.level })) : [] });

  const provinceLevels: Record<string, Record<string, Severity>> = {};
  for (const q of quakes) {
    if (q.retracted) continue;
    const lv = severityByProvince(PROVINCES, q.best);
    if (Object.keys(lv).length) provinceLevels[q.id] = lv;
  }
  return {
    v: 1, generatedMs: nowMs, fastMs: i.fastMs, sources, quakes, tsunami,
    conflicts: slow.conflicts, conflictsMs: slow.conflictsMs, chokepoints: slow.chokepoints, links,
    global: { level: g.level, reason: formatReason(g.reason), reasonDetail: g.reason },
    provinceLevels,
  };
}

/** The part of the state that decides whether KV needs a write: no timestamps that change every minute. */
export function stableOf(s: State) {
  const { generatedMs, fastMs, sources, ...rest } = s;
  void generatedMs; void fastMs;
  return { ...rest, sourcesOk: Object.fromEntries(Object.entries(sources).map(([k, v]) => [k, v.ok])) };
}
