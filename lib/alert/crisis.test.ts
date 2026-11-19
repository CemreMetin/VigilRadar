import { describe, expect, it } from "vitest";
import { PROVINCES } from "@/core/build-state";
import type { MergedQuake, State } from "@/core/types";
import { pickCrisis, recentFelt } from "./crisis";
import { SOS_UNITS } from "./tools";

const T0 = Date.UTC(2026, 10, 18, 12);
const malatya = PROVINCES.find((p) => p.code === "TR-44")!;
const ankara = PROVINCES.find((p) => p.code === "TR-06")!;
const quake = (id: string, mag: number, ageMin: number, lat = 38.35, lon = 38.31): MergedQuake => {
  const best = { source: "afad" as const, sourceId: id, timeMs: T0 - ageMin * 60_000, lat, lon, depthKm: 9, mag, place: "Malatya", updatedMs: T0 };
  return { id, sources: [best], best, firstSeenMs: best.timeMs };
};
const stateOf = (...quakes: MergedQuake[]) => ({ quakes, links: [], chokepoints: [] }) as unknown as State;
const pick = (o: Partial<Parameters<typeof pickCrisis>[0]>) => pickCrisis({ state: null, province: malatya, nowMs: T0, eventId: null, drill: false, ...o });

describe("crisis mode trigger (VIGIL.md 9.2)", () => {
  it("a P0 event for the chosen province in the last 60 minutes opens crisis mode; 61 minutes does not", () => {
    expect(pick({ state: stateOf(quake("a", 6.4, 59)) })?.severity).toBe("P0");
    expect(pick({ state: stateOf(quake("a", 6.4, 61)) })).toBeNull();
  });
  it("no province, a retracted event or a P2 event does not", () => {
    expect(pick({ state: stateOf(quake("a", 6.4, 5)), province: null })).toBeNull();
    expect(pick({ state: stateOf({ ...quake("a", 6.4, 5), retracted: true }) })).toBeNull();
    expect(pick({ state: stateOf(quake("a", 6.4, 5)), province: ankara })).toBeNull();
  });
  it("?e=<id> opens it whatever the age; a quake the data does not hold still gives the general list", () => {
    const old = pick({ state: stateOf(quake("a", 6.4, 600)), eventId: "a" });
    expect(old?.quake?.id).toBe("a");
    expect(old?.lists).toContain("afterQuake");
    const missing = pick({ state: stateOf(), eventId: "zzz" });
    expect(missing?.quake).toBeNull();
    expect(missing?.lists).toEqual(["afterQuake"]);
    expect(pick({ state: null, province: null, eventId: "zzz" })?.lists).toEqual(["afterQuake"]);
  });
  it("the drill always opens, with a fixed M7.2 about 44 km away, even with no province or no data", () => {
    const d = pick({ drill: true, province: null });
    expect(d?.drill).toBe(true);
    expect(d?.quake?.best.mag).toBe(7.2);
    expect(Math.round(d!.distanceKm!)).toBe(44);
    expect(d?.severity).toBe("P0");
    expect(d?.lists).toContain("afterQuake");
  });
});

describe("recent events for the province", () => {
  it("lists the last 7 days felt in the province (P2 and above), newest first", () => {
    const s = stateOf(quake("a", 6.4, 60), quake("b", 6.0, 3 * 1440), quake("c", 6.4, 9 * 1440), quake("far", 6.0, 10, 35, 28));
    expect(recentFelt(s, malatya, T0).map((x) => x.quake.id)).toEqual(["a", "b"]);
    expect(recentFelt(s, null, T0)).toEqual([]);
  });
});

describe("whistle pattern", () => {
  it("is 3 short, 3 long, 3 short in sound/silence pairs, then a pause", () => {
    const sound = SOS_UNITS.filter((_, i) => i % 2 === 0);
    expect(sound).toEqual([1, 1, 1, 3, 3, 3, 1, 1, 1]);
    expect(SOS_UNITS.length % 2).toBe(0);
  });
});
