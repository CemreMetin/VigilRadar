import { describe, expect, it } from "vitest";
import { conflictLinks, markChronic } from "../cascade";
import { flowDeviation } from "../chokepoints";
import { clusterConflicts } from "../conflict";
import { mergeQuakes } from "../quakes/merge";
import { globalStatus, regionStatus } from "../status";
import { tsunamiAdviceProvinces } from "../tsunami";
import { AKKUYU, ALL_PROVINCES, DAY, HOUR, KAHRAMANMARAS_2023 as KM, PLANTS, PROVINCES as P, ev } from "../__fixtures__/sites";
import type { DailyCount, GdeltRow } from "../types";

const NOW = Date.UTC(2024, 0, 20, 12);

describe("11. chronic link", () => {
  const cluster = { id: "c", lat: AKKUYU.lat, lon: AKKUYU.lon, label: "x", events: 3, domains: 3, lastSeenMs: NOW, sampleUrls: [] };
  it("an 8 day old conflict to plant link does not raise the status", () => {
    const fresh = conflictLinks([cluster], PLANTS, [], NOW);
    expect(fresh).toHaveLength(1);
    const prev = fresh.map((l) => ({ ...l, startedMs: NOW - 8 * DAY }));
    const links = markChronic(fresh, prev, NOW);
    expect(links[0].chronic).toBe(true);
    expect(globalStatus({ nowMs: NOW, heartbeatMs: NOW, quakes: [], links, tsunami: [], chokepoints: [] }).level).toBe("NOMINAL");
  });
  it("the same link at 2 days is live, but a conflict link is capped at ELEVATED", () => {
    const fresh = conflictLinks([cluster], PLANTS, [], NOW);
    const links = markChronic(fresh, fresh.map((l) => ({ ...l, startedMs: NOW - 2 * DAY })), NOW);
    expect(links[0].chronic).toBe(false);
    expect(globalStatus({ nowMs: NOW, heartbeatMs: NOW, quakes: [], links, tsunami: [], chokepoints: [] }).level).toBe("ELEVATED");
  });
});

describe("12. conflict clusters", () => {
  const row = (i: number, domain: string, geoType = 3): GdeltRow => ({
    id: String(i), rootCode: "19", baseCode: "190", geoType, lat: 48.5, lon: 35.1, fullName: "Dnipro, Ukraine",
    sourceUrl: `https://${domain}/a${i}`, numSources: i, dateAddedMs: NOW - HOUR,
  });
  it("3 events and 2 domains is not a cluster", () => {
    expect(clusterConflicts([row(1, "a.com"), row(2, "a.com"), row(3, "b.com")], NOW)).toEqual([]);
  });
  it("3 events and 3 domains is a cluster", () => {
    const c = clusterConflicts([row(1, "a.com"), row(2, "www.b.com"), row(3, "c.com")], NOW);
    expect(c).toHaveLength(1);
    expect(c[0]).toMatchObject({ events: 3, domains: 3, label: "Dnipro, Ukraine" });
  });
  it("ActionGeo_Type 1 rows are ignored", () => {
    expect(clusterConflicts([row(1, "a.com"), row(2, "b.com"), row(3, "c.com", 1)], NOW)).toEqual([]);
  });
});

describe("13. chokepoint flow", () => {
  const series = (recent: number, lastAgeDays = 0): DailyCount[] =>
    Array.from({ length: 97 }, (_, i) => ({
      date: new Date(NOW - (i + lastAgeDays) * DAY).toISOString().slice(0, 10),
      count: i < 7 ? recent : 100,
    }));
  it("-30% is a deviation", () => expect(flowDeviation(series(70), NOW).state).toBe("deviation"));
  it("-55% is severe", () => expect(flowDeviation(series(45), NOW).state).toBe("severe"));
  it("no change is normal", () => expect(flowDeviation(series(100), NOW).state).toBe("normal"));
  it("last data 11 days ago is stale", () => expect(flowDeviation(series(45, 11), NOW).state).toBe("stale"));
});

describe("14. STALE", () => {
  it("a heartbeat 16 minutes old overrides a CRITICAL quake", () => {
    const quakes = mergeQuakes([], [ev({ ...KM, timeMs: NOW - HOUR })], NOW);
    const input = { nowMs: NOW, quakes, links: [], tsunami: [], chokepoints: [] };
    expect(globalStatus({ ...input, heartbeatMs: NOW - 16 * 60_000 }).level).toBe("STALE");
    expect(globalStatus({ ...input, heartbeatMs: NOW - 14 * 60_000 }).level).toBe("CRITICAL");
  });
});

describe("15. Turkey tsunami rule", () => {
  const offIzmir = ev({ lat: 38.4, lon: 26.5, mag: 6.8, depthKm: 15, timeMs: NOW - HOUR });
  it("advice for Izmir, none for Konya", () => {
    const codes = tsunamiAdviceProvinces(ALL_PROVINCES, offIzmir);
    expect(codes).toContain(P.izmir.code);
    expect(codes).not.toContain(P.konya.code);
  });
  it("the region status of Izmir is CRITICAL and Konya's is not", () => {
    const q = mergeQuakes([], [offIzmir], NOW);
    expect(regionStatus(P.izmir, q, NOW).level).toBe("CRITICAL");
    expect(regionStatus(P.konya, q, NOW).level).not.toBe("CRITICAL");
  });
  it("a deep quake gives no advice", () => {
    expect(tsunamiAdviceProvinces(ALL_PROVINCES, { ...offIzmir, depthKm: 90 })).toEqual([]);
  });
});
