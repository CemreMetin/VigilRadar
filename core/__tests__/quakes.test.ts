import { describe, expect, it } from "vitest";
import { mergeQuakes } from "../quakes/merge";
import { severityFor } from "../severity";
import { quakeLinks } from "../cascade";
import { globalStatus } from "../status";
import { ALL_PROVINCES, AKKUYU, FUKUSHIMA_DAIICHI, HOUR, KAHRAMANMARAS_2023 as KM, PLANTS, PROVINCES as P, TOHOKU_2011 as TH, ev } from "../__fixtures__/sites";
import { severityByProvince } from "../severity";
import type { MergedQuake } from "../types";

const state = (q: MergedQuake[], nowMs: number, links = quakeLinks(q, PLANTS, [], nowMs)) =>
  globalStatus({ nowMs, heartbeatMs: nowMs, quakes: q, links, tsunami: [], chokepoints: [] });

describe("1. Kahramanmaraş 2023-02-06", () => {
  const now = KM.timeMs + 10 * 60_000;
  const quakes = mergeQuakes([], [KM], now);
  it("Kahramanmaraş, Gaziantep, Hatay and Malatya are P0", () => {
    for (const p of [P.kahramanmaras, P.gaziantep, P.hatay, P.malatya]) expect(severityFor(p, KM), p.name).toBe("P0");
  });
  it("Ankara is exactly P2", () => {
    expect(severityFor(P.ankara, KM)).toBe("P2");
  });
  it("links to the Akkuyu site and the global status is CRITICAL", () => {
    expect(quakeLinks(quakes, PLANTS, [], now).map((l) => l.toId)).toEqual([AKKUYU.id]);
    expect(state(quakes, now).level).toBe("CRITICAL");
  });
});

describe("2. Tohoku 2011-03-11", () => {
  const now = TH.timeMs + HOUR;
  const quakes = mergeQuakes([], [TH], now);
  it("links to Fukushima Daiichi, global CRITICAL", () => {
    expect(quakeLinks(quakes, PLANTS, [], now).map((l) => l.toId)).toEqual([FUKUSHIMA_DAIICHI.id]);
    expect(state(quakes, now).level).toBe("CRITICAL");
  });
});

describe("3. M5.0 at 90 km from a plant", () => {
  const now = Date.UTC(2024, 0, 1);
  const q = mergeQuakes([], [ev({ lat: AKKUYU.lat + 90 / 111.195, lon: AKKUYU.lon, mag: 5.0, depthKm: 10, timeMs: now - HOUR })], now);
  it("no link, global NOMINAL", () => {
    expect(quakeLinks(q, PLANTS, [], now)).toEqual([]);
    expect(state(q, now).level).toBe("NOMINAL");
  });
});

describe("4. Fiji M7.0 at 550 km depth", () => {
  const now = Date.UTC(2024, 0, 1);
  const fiji = ev({ lat: -21, lon: -179, mag: 7.0, depthKm: 550, timeMs: now - HOUR });
  const q = mergeQuakes([], [fiji], now);
  it("global ELEVATED, no province level, no global channel notice", () => {
    expect(state(q, now).level).toBe("ELEVATED");
    expect(severityByProvince(ALL_PROVINCES, fiji)).toEqual({});
    // channel rule of 7.1 (maxDepthKm 100) is exercised by the notification policy tests in Faz 6
  });
});

describe("5. M5.8 twelve km below Istanbul", () => {
  it("Istanbul is P0", () => {
    expect(severityFor(P.istanbul, { lat: P.istanbul.lat, lon: P.istanbul.lon, mag: 5.8, depthKm: 12 })).toBe("P0");
  });
});

describe("6. one quake from four sources", () => {
  const t = Date.UTC(2024, 0, 1, 12);
  const base = { lat: 38.0, lon: 38.0, depthKm: 10 };
  const evs = [
    ev({ ...base, source: "usgs", sourceId: "u", mag: 6.9, timeMs: t - 20_000 }),
    ev({ ...base, source: "emsc", sourceId: "e", mag: 7.0, timeMs: t, lat: 38.18 }),
    ev({ ...base, source: "afad", sourceId: "a", mag: 7.1, timeMs: t + 20_000, lat: 37.82 }),
    ev({ ...base, source: "kandilli", sourceId: "k", mag: 7.0, timeMs: t + 10_000, lon: 38.22 }),
  ];
  it("merges into one MergedQuake and AFAD leads inside the Turkey box", () => {
    const m = mergeQuakes([], evs, t + 60_000);
    expect(m).toHaveLength(1);
    expect(m[0].sources).toHaveLength(4);
    expect(m[0].best.source).toBe("afad");
    expect(m[0].best.mag).toBe(7.1);
  });
  it("keeps the id and firstSeenMs on later runs", () => {
    const first = mergeQuakes([], evs.slice(0, 1), t + 60_000);
    const again = mergeQuakes(first, evs, t + 120_000);
    expect(again[0].id).toBe(first[0].id);
    expect(again[0].firstSeenMs).toBe(first[0].firstSeenMs);
  });
});

describe("7. to 10. notification policy", () => {
  it.todo("7. revision 6.9 to 7.2 sends one UPDATE (Faz 6)");
  it.todo("8. retracted event sends one CANCEL (Faz 6)");
  it.todo("9. P0 single source waits 90 s, second source sends at once (Faz 6)");
  it.todo("10. second P1 within 30 min is held, P0 goes (Faz 6)");
});
