import { describe, expect, it } from "vitest";
import type { MergedQuake, QuakeEvent, Severity } from "../../../core/types";
import { EMPTY_LOG, plan, type NotifyLog } from "../notify/policy";

const T0 = Date.UTC(2026, 10, 18, 12);
const ev = (o: Partial<QuakeEvent> = {}): QuakeEvent => ({ source: "afad", sourceId: "1", timeMs: T0, lat: 38.35, lon: 38.31, depthKm: 9, mag: 6.4, place: "Malatya", updatedMs: T0, ...o });
const quake = (o: Partial<MergedQuake> & { mag?: number } = {}): MergedQuake => {
  const { mag, ...rest } = o;
  const best = ev({ mag: mag ?? 6.4 });
  return { id: "afad:1", sources: [best, ev({ source: "emsc" })], best, firstSeenMs: T0, ...rest };
};
const lv = (q: MergedQuake, l: Record<string, Severity>) => ({ [q.id]: l });
const run = (q: MergedQuake, l: Record<string, Severity>, now: number, log: NotifyLog = EMPTY_LOG) =>
  plan({ nowMs: now, quakes: [q], levels: lv(q, l), tsunami: [], log });

describe("7. update on a magnitude revision", () => {
  it("6.9 -> 7.2 sends one UPDATE, the second revision sends none", () => {
    const q69 = quake({ mag: 6.9 });
    const a = run(q69, { "TR-44": "P0" }, T0 + 60_000);
    expect(a.notices.map((n) => n.kind)).toEqual(["new"]);
    const q72 = quake({ mag: 7.2 });
    const b = run(q72, { "TR-44": "P0" }, T0 + 3_600_000, a.log);
    expect(b.notices.filter((n) => n.scope === "TR").map((n) => n.kind)).toEqual(["update"]);
    const q75 = quake({ mag: 7.6 });
    expect(run(q75, { "TR-44": "P0" }, T0 + 7_200_000, b.log).notices.filter((n) => n.scope === "TR")).toEqual([]);
  });
  it("a change below 0.3 sends nothing; a changed province level sends an update", () => {
    const a = run(quake({ mag: 6.4 }), { "TR-44": "P0" }, T0 + 60_000);
    expect(run(quake({ mag: 6.6 }), { "TR-44": "P0" }, T0 + 600_000, a.log).notices).toEqual([]);
    expect(run(quake({ mag: 6.4 }), { "TR-44": "P1" }, T0 + 600_000, a.log).notices.map((n) => n.kind)).toEqual(["update"]);
  });
});

describe("8. retracted event", () => {
  it("sends one CANCEL to the targets that got the original, and only once", () => {
    const a = run(quake({ mag: 7.2 }), { "TR-44": "P0" }, T0 + 60_000);
    expect(a.notices.map((n) => `${n.scope}:${n.kind}`).sort()).toEqual(["GLOBAL:new", "TR:new"]);
    const gone = quake({ mag: 7.2, retracted: true });
    const b = run(gone, { "TR-44": "P0" }, T0 + 900_000, a.log);
    expect(b.notices.map((n) => `${n.scope}:${n.kind}`).sort()).toEqual(["GLOBAL:cancel", "TR:cancel"]);
    expect(run(gone, {}, T0 + 1_000_000, b.log).notices).toEqual([]);
  });
  it("an event that was never announced is not cancelled", () => {
    expect(run(quake({ retracted: true }), { "TR-44": "P0" }, T0 + 60_000).notices).toEqual([]);
  });
});

describe("9. P0 from a single source", () => {
  it("waits 90 seconds; a second source sends at once", () => {
    const one = quake({ sources: [ev()], firstSeenMs: T0 });
    expect(run(one, { "TR-44": "P0" }, T0 + 89_000).notices).toEqual([]);
    expect(run(one, { "TR-44": "P0" }, T0 + 90_000).notices.map((n) => n.kind)).toEqual(["new"]);
    expect(run(quake({ firstSeenMs: T0 }), { "TR-44": "P0" }, T0 + 5_000).notices.map((n) => n.kind)).toEqual(["new"]);
  });
  it("the wait does not hold P1 back", () => {
    const one = quake({ sources: [ev()], firstSeenMs: T0 });
    expect(run(one, { "TR-06": "P1" }, T0 + 1_000).notices[0].provinces).toEqual([{ code: "TR-06", sev: "P1" }]);
  });
});

describe("10. P1 cooldown", () => {
  it("a second P1 for the same province within 30 minutes is held back, a P0 still goes", () => {
    const a = quake({ id: "afad:1" });
    const first = run(a, { "TR-06": "P1" }, T0 + 60_000);
    expect(first.notices).toHaveLength(1);
    const b = { ...quake({ id: "afad:2" }), firstSeenMs: T0 + 10 * 60_000 };
    const second = plan({ nowMs: T0 + 11 * 60_000, quakes: [b], levels: lv(b, { "TR-06": "P1" }), tsunami: [], log: first.log });
    expect(second.notices).toEqual([]);
    const third = plan({ nowMs: T0 + 12 * 60_000, quakes: [b], levels: lv(b, { "TR-06": "P0" }), tsunami: [], log: first.log });
    expect(third.notices.map((n) => n.kind)).toEqual(["new"]);
    const later = plan({ nowMs: T0 + 31 * 60_000, quakes: [b], levels: lv(b, { "TR-06": "P1" }), tsunami: [], log: first.log });
    expect(later.notices).toHaveLength(1);
  });
});

describe("policy details", () => {
  it("P2 sends nothing; one TR notice per event lists P0 before P1", () => {
    expect(run(quake(), { "TR-06": "P2" }, T0 + 60_000).notices).toEqual([]);
    const n = run(quake(), { "TR-06": "P1", "TR-44": "P0", "TR-23": "P0" }, T0 + 60_000).notices;
    expect(n).toHaveLength(1);
    expect(n[0].provinces.map((p) => p.code)).toEqual(["TR-44", "TR-23", "TR-06"]);
  });
  it("global: M7.0 shallow, PAGER red, or a tsunami warning; deep M7.0 and M6.9 are not", () => {
    const g = (q: MergedQuake) => run(q, {}, T0 + 60_000).notices.filter((n) => n.scope === "GLOBAL").length;
    expect(g(quake({ mag: 7.0 }))).toBe(1);
    expect(g(quake({ mag: 6.9 }))).toBe(0);
    const deep = quake({ mag: 7.0 }); deep.best = { ...deep.best, depthKm: 550 };
    expect(g(deep)).toBe(0);
    const red = quake({ mag: 6.0 }); red.best = { ...red.best, pagerAlert: "red" };
    expect(g(red)).toBe(1);
    const t = plan({ nowMs: T0, quakes: [], levels: {}, tsunami: [{ level: "warning", timeMs: T0 - 60_000, lat: 0, lon: 0, title: "Tsunami Warning" }], log: EMPTY_LOG });
    expect(t.notices.map((n) => n.kind)).toEqual(["tsunami"]);
    expect(plan({ nowMs: T0 + 60_000, quakes: [], levels: {}, tsunami: [{ level: "warning", timeMs: T0 - 60_000, lat: 0, lon: 0, title: "x" }], log: t.log }).notices).toEqual([]);
  });
  it("an event first seen more than 3 hours ago never starts a notification", () => {
    expect(run(quake({ firstSeenMs: T0 - 4 * 3_600_000 }), { "TR-44": "P0" }, T0).notices).toEqual([]);
  });
  it("the same state twice sends nothing the second time", () => {
    const a = run(quake(), { "TR-44": "P0" }, T0 + 60_000);
    expect(run(quake(), { "TR-44": "P0" }, T0 + 120_000, a.log).notices).toEqual([]);
  });
});
