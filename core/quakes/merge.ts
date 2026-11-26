import { CONFIG } from "../config";
import { haversineKm } from "../geo";
import type { MergedQuake, QuakeEvent, QuakeSource } from "../types";
import { accept, inTrBox } from "./normalize";

const DAY = 86_400_000;
export const RETRACT_WINDOW_MS = 6 * 3_600_000;
const RETRACT_AFTER = 2;
const key = (e: QuakeEvent) => `${e.source}:${e.sourceId}`;
const sameEvent = (a: QuakeEvent, b: QuakeEvent) =>
  Math.abs(a.timeMs - b.timeMs) <= CONFIG.quake.merge.maxDtSec * 1000 && haversineKm(a, b) <= CONFIG.quake.merge.maxDistKm;

function pickBest(members: QuakeEvent[]): QuakeEvent {
  const order: readonly QuakeSource[] = inTrBox(members[0]) ? CONFIG.quake.sourcePriorityTR : CONFIG.quake.sourcePriorityWorld;
  const ranked = [...members].sort((a, b) => order.indexOf(a.source) - order.indexOf(b.source));
  return {
    ...ranked[0],
    magType: ranked.find((m) => m.magType)?.magType,
    pagerAlert: ranked.find((m) => m.pagerAlert)?.pagerAlert,
    usgsTsunami: ranked.some((m) => m.usgsTsunami) || undefined,
  };
}

/**
 * Folds new records into the known quakes. Two records are one event when they are within 60 s and 150 km.
 * Ids and firstSeenMs of known quakes never change. Records older than keepDays are dropped.
 * With `okSources` (the sources that answered this turn), a recent quake that all of its sources stopped listing for
 * two turns in a row is marked retracted. A source that failed is not in the set, so an outage retracts nothing.
 */
export function mergeQuakes(prev: readonly MergedQuake[], incoming: readonly QuakeEvent[], nowMs: number, okSources?: ReadonlySet<QuakeSource>): MergedQuake[] {
  const listed = new Set(incoming.map(key));
  const byKey = new Map<string, QuakeEvent>();
  const prevOf = new Map<string, MergedQuake>();
  for (const g of prev) for (const e of g.sources) { byKey.set(key(e), e); prevOf.set(key(e), g); }
  for (const e of incoming) {
    if (!accept(e)) continue;
    const old = byKey.get(key(e));
    if (!old || e.updatedMs >= old.updatedMs) byKey.set(key(e), e);
  }
  const events = [...byKey.values()].sort((a, b) => a.timeMs - b.timeMs);

  const parent = events.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const union = (i: number, j: number) => { parent[find(i)] = find(j); };
  const firstOfPrev = new Map<MergedQuake, number>();
  events.forEach((e, i) => {
    const g = prevOf.get(key(e));
    if (g) {
      const j = firstOfPrev.get(g);
      if (j === undefined) firstOfPrev.set(g, i);
      else union(i, j);
    }
    for (let j = 0; j < i; j++) if (sameEvent(e, events[j])) union(i, j);
  });

  const groups = new Map<number, QuakeEvent[]>();
  events.forEach((e, i) => { const r = find(i); groups.set(r, [...(groups.get(r) ?? []), e]); });

  const out: MergedQuake[] = [];
  for (const members of groups.values()) {
    const known = [...new Set(members.map((m) => prevOf.get(key(m))).filter((g): g is MergedQuake => !!g))].sort(
      (a, b) => a.firstSeenMs - b.firstSeenMs,
    );
    const best = pickBest(members);
    if (best.timeMs < nowMs - CONFIG.quake.keepDays * DAY) continue;
    let missed = known[0]?.missedTurns ?? 0;
    if (members.some((m) => listed.has(key(m)))) missed = 0;
    else if (okSources && best.timeMs >= nowMs - RETRACT_WINDOW_MS && members.every((m) => okSources.has(m.source)))
      missed = Math.min(missed + 1, RETRACT_AFTER); // capped, so a retracted quake does not change the state every turn
    out.push({
      id: known[0]?.id ?? key(members[0]), sources: members, best, firstSeenMs: known[0]?.firstSeenMs ?? nowMs,
      ...(missed ? { missedTurns: missed } : {}),
      ...(missed >= RETRACT_AFTER ? { retracted: true } : {}),
    });
  }
  return out.sort((a, b) => b.best.timeMs - a.best.timeMs);
}
