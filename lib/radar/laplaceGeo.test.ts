import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildCountries } from "@/core/laplace/countries";
import { simulate } from "@/core/laplace/engine";
import { SHOCKS } from "@/core/laplace/shocks";
import { TIER_FILL, arcFeatures, fillExpression, shockForStrait, straitFeatures } from "./laplaceGeo";

const countries = buildCountries(JSON.parse(readFileSync("public/data/static/world.json", "utf8")), null);
const result = simulate({ shock: "hormuz", severity: 0.8, day: 30 }, countries);

describe("simulation map data", () => {
  it("colours every affected country exactly once and nothing else", () => {
    const [, , ...branches] = fillExpression(result) as unknown[];
    expect(branches.pop()).toBe(TIER_FILL.none);
    const named = branches.filter(Array.isArray).flat();
    expect(new Set(named).size).toBe(named.length);
    expect(named.sort()).toEqual(Object.values(result.byMapName).filter((i) => i.tier !== "none").map((i) => i.mapName).sort());
  });
  it("is a plain colour when nothing is affected", () => {
    expect(fillExpression({ ...result, byMapName: {} })).toBe(TIER_FILL.none);
  });
  it("grows the arcs from the shock", () => {
    const length = (p: number) => arcFeatures(result, p).features.reduce((n, f) => n + (f.geometry.coordinates as unknown[]).length, 0);
    expect(length(0.1)).toBeLessThan(length(0.6));
    expect(length(0.6)).toBeLessThan(length(1));
    expect((arcFeatures(result, 0.1).features[0].geometry.coordinates as number[][])[0][0]).toBeCloseTo(result.shock.lon);
  });
  it("marks the closed strait and maps straits to shocks", () => {
    expect(straitFeatures(SHOCKS[0]).features.filter((f) => f.properties.active)).toHaveLength(1);
    expect(["hormuz", "suez", "mandeb", "bosporus", "panama", "malacca"].map(shockForStrait)).toEqual(["hormuz", "suez", "suez", "blacksea", "panama", null]);
  });
});
