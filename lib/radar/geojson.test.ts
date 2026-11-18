import { describe, expect, it } from "vitest";
import { buildState } from "@/core/build-state";
import { HOUR, KAHRAMANMARAS_2023 as KM, ev } from "@/core/__fixtures__/sites";
import type { Link, State } from "@/core/types";
import { assetFeatures, assetStates, chronicRings, conflictBoxes, linkArcs, quakeFeatures } from "./geojson";

const now = KM.timeMs + 10 * 60_000;
const base = (events = [KM], at = now): State =>
  buildState({ prev: null, nowMs: at, events, ok: { usgs: true, emsc: true, afad: true, kandilli: true }, tsunami: null, tsunamiOk: null, slow: null, fastMs: at });

describe("radar geojson", () => {
  it("quakes: depth and age fade the opacity, small ones come first, last 24 h are marked recent", () => {
    const old = ev({ lat: 10, lon: 10, mag: 5.0, depthKm: 300, timeMs: now - 6 * 24 * HOUR });
    const s = base([KM, old], now);
    const f = quakeFeatures(s, now).features;
    expect(f.map((x) => x.properties.mag)).toEqual([5, 7.8]);
    const big = f[1].properties;
    expect(big.recent).toBe(true);
    expect(big.op).toBeCloseTo((0.9 - 0.55 * (10 / 300)) * (1 - 0.72 * (10 / 60 / 24 / 7)), 2);
    expect(f[0].properties.recent).toBe(false);
    expect(f[0].properties.op).toBeLessThan(0.35);
  });
  it("assets: Akkuyu turns active after the Kahramanmaras quake, the others stay idle", () => {
    const { plants, marked } = assetFeatures(base());
    const akkuyu = plants.features.find((p) => p.properties.name === "Akkuyu")!;
    expect(akkuyu.properties.state).toBe("active");
    expect(plants.features.filter((p) => p.properties.state === "idle").length).toBe(plants.features.length - 1);
    expect(marked).toHaveLength(1);
  });
  it("arcs run from the epicentre to the plant with 65 points", () => {
    const arcs = linkArcs(base()).features;
    expect(arcs).toHaveLength(1);
    expect(arcs[0].geometry.type).toBe("LineString");
    const c = (arcs[0].geometry as { coordinates: number[][] }).coordinates;
    expect(c).toHaveLength(65);
    expect(c[0][0]).toBeCloseTo(KM.lon, 1);
  });
  it("a chronic link gives a dashed ring and no active state", () => {
    const link: Link = { id: "l", fromKind: "conflict", fromId: "c", toKind: "plant", toId: "tr-akkuyu", distanceKm: 1, rule: "conflict→plant", startedMs: 0, chronic: true };
    const s = { ...base([]), links: [link] };
    expect(assetStates(s.links).get("tr-akkuyu")).toBe("chronic");
    expect(chronicRings(s).features).toHaveLength(1);
    expect(assetStates([{ ...link, chronic: false }, link]).get("tr-akkuyu")).toBe("active");
  });
  it("conflict boxes grow in three steps and chokepoints are two lines", () => {
    const cl = (events: number) => ({ id: String(events), lat: 0, lon: 0, label: "x", events, domains: 3, lastSeenMs: now, sampleUrls: [] });
    const cp = { id: "hormuz", name: "Hormuz", lat: 26.5, lon: 56.3, recent: 1, baseline: 1, dev: 0, level: "normal" as const, dataThrough: null, available: true };
    const s = { ...base([]), conflicts: [cl(3), cl(8), cl(20)], chokepoints: [cp] };
    const sizes = conflictBoxes(s).features.map((f) => (f.geometry as { coordinates: number[][][] }).coordinates[0][1][0]);
    expect(sizes).toEqual([0.15, 0.25, 0.4]);
    const lines = assetFeatures(s).chokepoints.features[0].geometry as { coordinates: unknown[] };
    expect(lines.coordinates).toHaveLength(2);
  });
});
