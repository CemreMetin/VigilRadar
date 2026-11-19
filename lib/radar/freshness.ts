import { CONFIG } from "@/core/config";
import type { QuakeSource, State } from "@/core/types";

// Data freshness (VIGIL.md Faz 8, /about): per source the last successful fetch, the newest event and a status.
// The fetch times come from the Worker's heartbeat (`state.sources`) and, for the slow lane, from its own timestamps.

export type FreshStatus = "ok" | "error" | "stale" | "none";
export interface FreshRow { key: string; name: string; fetchedMs: number | null; newestMs: number | null; status: FreshStatus }

const QUAKE_SOURCES: [QuakeSource, string][] = [["usgs", "USGS"], ["emsc", "EMSC"], ["afad", "AFAD"], ["kandilli", "Kandilli"]];
const max = (xs: number[]) => (xs.length ? Math.max(...xs) : null);

export function freshnessRows(state: State, nowMs: number): FreshRow[] {
  const rows: FreshRow[] = [];
  for (const [key, name] of QUAKE_SOURCES) {
    const s = state.sources[key];
    const events = state.quakes.flatMap((q) => q.sources.filter((e) => e.source === key).map((e) => e.timeMs));
    rows.push({ key, name, fetchedMs: s.ms || null, newestMs: max(events), status: s.ms === 0 && !s.ok ? "none" : s.ok ? "ok" : "error" });
  }
  const t = state.sources.tsunami;
  rows.push({ key: "tsunami", name: "NOAA tsunami", fetchedMs: t.ms || null, newestMs: max(state.tsunami.map((b) => b.timeMs)), status: t.ms === 0 && !t.ok ? "none" : t.ok ? "ok" : "error" });

  const g = state.conflictsMs;
  rows.push({
    key: "gdelt", name: "GDELT", fetchedMs: g, newestMs: max(state.conflicts.map((c) => c.lastSeenMs)),
    status: g === null ? "none" : nowMs - g > CONFIG.stale.conflictHours * 3_600_000 ? "stale" : "ok",
  });

  // PortWatch has no fetch time of its own in the state; its data runs a few days late, so only the newest day is shown
  const days = state.chokepoints.filter((c) => c.available && c.dataThrough).map((c) => Date.parse(c.dataThrough!)).filter(Number.isFinite);
  const newest = max(days);
  rows.push({ key: "portwatch", name: "IMF PortWatch", fetchedMs: null, newestMs: newest, status: newest === null ? "none" : nowMs - newest > CONFIG.chokepoint.staleDays * 86_400_000 ? "stale" : "ok" });
  return rows;
}
