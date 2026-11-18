import { CONFIG } from "./config";
import { severityFor } from "./severity";
import { activeTsunami, provinceTsunamiAdvice } from "./tsunami";
import type { FlowState, Level, Link, MergedQuake, Province, StatusReason, StatusResult, TsunamiBulletin } from "./types";

const HOUR = 3_600_000;
const S = CONFIG.status;

export interface StatusInput {
  nowMs: number;
  heartbeatMs: number | null; // last time the fast lane ran
  quakes: readonly MergedQuake[];
  links: readonly Link[];
  tsunami: readonly TsunamiBulletin[];
  chokepoints: readonly { id: string; state: FlowState }[];
}

const hit = (level: Level, reason: StatusReason): StatusResult => ({ level, reason });
const recent = (q: MergedQuake, nowMs: number, hours: number) => !q.retracted && nowMs - q.best.timeMs <= hours * HOUR;
const quakeReason = (q: MergedQuake): StatusReason => ({ kind: "quake", quakeId: q.id, mag: q.best.mag, place: q.best.place, timeMs: q.best.timeMs });

/** GLOBAL status (VIGIL.md 5.8). STALE beats everything; each level carries the reason that raised it. */
export function globalStatus(i: StatusInput): StatusResult {
  if (i.heartbeatMs === null || i.nowMs - i.heartbeatMs > CONFIG.stale.fastMinutes * 60_000)
    return hit("STALE", { kind: "stale", lastHeartbeatMs: i.heartbeatMs });

  const day = i.quakes.filter((q) => recent(q, i.nowMs, S.quakeWindowHours));
  const pager = (levels: string[]) =>
    i.quakes.find((q) => recent(q, i.nowMs, S.pagerWindowHours) && q.best.pagerAlert && levels.includes(q.best.pagerAlert));
  const tsunami = activeTsunami(i.tsunami, i.nowMs);
  const live = i.links.filter((l) => !l.chronic);
  const flow = (state: FlowState) => i.chokepoints.find((c) => c.state === state);

  const big = day.find((q) => q.best.mag >= S.criticalMag && q.best.depthKm <= S.criticalMaxDepthKm);
  if (big) return hit("CRITICAL", quakeReason(big));
  const red = pager(["orange", "red"]);
  if (red) return hit("CRITICAL", { kind: "pager", quakeId: red.id, alert: red.best.pagerAlert!, mag: red.best.mag, place: red.best.place, timeMs: red.best.timeMs });
  if (tsunami?.level === "warning") return hit("CRITICAL", { kind: "tsunami", level: tsunami.level, title: tsunami.title, timeMs: tsunami.timeMs });
  const plant = live.find((l) => l.toKind === "plant");
  if (plant) return hit("CRITICAL", { kind: "link", linkId: plant.id, rule: plant.rule });
  const severe = flow("severe");
  if (severe) return hit("CRITICAL", { kind: "chokepoint", id: severe.id, state: severe.state });

  const strong = day.find((q) => q.best.mag >= S.elevatedMag);
  if (strong) return hit("ELEVATED", quakeReason(strong));
  const yellow = pager(["yellow"]);
  if (yellow) return hit("ELEVATED", { kind: "pager", quakeId: yellow.id, alert: "yellow", mag: yellow.best.mag, place: yellow.best.place, timeMs: yellow.best.timeMs });
  if (tsunami) return hit("ELEVATED", { kind: "tsunami", level: tsunami.level, title: tsunami.title, timeMs: tsunami.timeMs });
  const choke = live.find((l) => l.toKind === "chokepoint");
  if (choke) return hit("ELEVATED", { kind: "link", linkId: choke.id, rule: choke.rule });
  const dev = flow("deviation");
  if (dev) return hit("ELEVATED", { kind: "chokepoint", id: dev.id, state: dev.state });
  return { level: "NOMINAL", reason: null };
}

/** YOUR REGION status for one province: P0 or tsunami advice is CRITICAL, P1 is ELEVATED (last 24 hours). */
export function regionStatus(p: Province, quakes: readonly MergedQuake[], nowMs: number): StatusResult {
  let elevated: StatusResult | null = null;
  for (const q of quakes) {
    if (!recent(q, nowMs, S.quakeWindowHours)) continue;
    const b = q.best;
    const sev = severityFor(p, b);
    if (sev === "P0") return hit("CRITICAL", { kind: "province-severity", quakeId: q.id, severity: sev, mag: b.mag, place: b.place, timeMs: b.timeMs });
    if (provinceTsunamiAdvice(p, b)) return hit("CRITICAL", { kind: "province-tsunami", quakeId: q.id, mag: b.mag, place: b.place, timeMs: b.timeMs });
    if (sev === "P1" && !elevated) elevated = hit("ELEVATED", { kind: "province-severity", quakeId: q.id, severity: sev, mag: b.mag, place: b.place, timeMs: b.timeMs });
  }
  return elevated ?? { level: "NOMINAL", reason: null };
}
