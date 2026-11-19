import { PROVINCES } from "@/core/build-state";
import { severityFor } from "@/core/severity";
import type { MergedQuake, Province, Severity, State } from "@/core/types";
import { triageQuake, type ListKey } from "@/lib/radar/triage";

// Which mode /alert shows (VIGIL.md 9.2): opened with ?e=<id>, a P0/P1 event for the chosen province in the last 60 minutes, or a drill.

export const CRISIS_WINDOW_MS = 60 * 60_000;
export interface Crisis {
  quake: MergedQuake | null; // null: an event id from a notification that the data does not hold
  drill: boolean;
  province: Province | null;
  severity: Severity | null;
  distanceKm: number | null;
  lists: ListKey[];
}

/** A fixed example event for the drill: M7.2, 10 km deep, about 44 km north of the province centre. */
export function drillQuake(nowMs: number, province: Province): MergedQuake {
  const best = { source: "afad" as const, sourceId: "drill", timeMs: nowMs - 2 * 60_000, lat: province.lat + 0.4, lon: province.lon, depthKm: 10, mag: 7.2, place: province.name, updatedMs: nowMs };
  return { id: "drill", sources: [best, { ...best, source: "emsc" }], best, firstSeenMs: best.timeMs };
}

const EMPTY = { links: [], chokepoints: [] } as unknown as State;

interface In { state: State | null; province: Province | null; nowMs: number; eventId: string | null; drill: boolean }

export function pickCrisis(i: In): Crisis | null {
  const { state, nowMs } = i;
  if (i.drill) {
    const province = i.province ?? PROVINCES.find((p) => p.code === "TR-34") ?? PROVINCES[0];
    const quake = drillQuake(nowMs, province);
    const tri = triageQuake(EMPTY, quake, province);
    return { quake, drill: true, province, severity: tri.severity, distanceKm: tri.distanceKm, lists: tri.lists };
  }
  if (i.eventId) {
    const quake = state?.quakes.find((q) => q.id === i.eventId) ?? null;
    if (!quake) return { quake: null, drill: false, province: i.province, severity: null, distanceKm: null, lists: ["afterQuake"] };
    const tri = triageQuake(state ?? EMPTY, quake, i.province);
    // someone who tapped the notification gets the general list even when their province is unknown or only P2
    return { quake, drill: false, province: i.province, severity: tri.severity, distanceKm: tri.distanceKm, lists: tri.lists.length ? tri.lists : ["afterQuake"] };
  }
  if (!state || !i.province) return null;
  const recent = state.quakes
    .filter((q) => !q.retracted && nowMs - q.best.timeMs <= CRISIS_WINDOW_MS)
    .filter((q) => { const s = severityFor(i.province!, q.best); return s === "P0" || s === "P1"; })
    .sort((a, b) => b.best.timeMs - a.best.timeMs)[0];
  if (!recent) return null;
  const tri = triageQuake(state, recent, i.province);
  return { quake: recent, drill: false, province: i.province, severity: tri.severity, distanceKm: tri.distanceKm, lists: tri.lists };
}

/** The events of the last 7 days that were felt in the province (P2 and above), newest first. */
export function recentFelt(state: State | null, province: Province | null, nowMs: number): { quake: MergedQuake; severity: Severity }[] {
  if (!state || !province) return [];
  return state.quakes
    .filter((q) => !q.retracted && nowMs - q.best.timeMs <= 7 * 86_400_000)
    .flatMap((quake) => { const severity = severityFor(province, quake.best); return severity ? [{ quake, severity }] : []; })
    .sort((a, b) => b.quake.best.timeMs - a.quake.best.timeMs);
}
