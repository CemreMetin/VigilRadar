import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (f: string) => JSON.parse(readFileSync(`public/data/static/${f}`, "utf8"));

// Guards the committed output of scripts/data/build-*.mjs (VIGIL.md 13, Faz 2 checks).
describe("static data", () => {
  it("81 provinces, 28 coastal, unique plate codes", () => {
    const { places } = read("places.tr.json");
    expect(places).toHaveLength(81);
    expect(places.filter((p: { coastal: boolean }) => p.coastal)).toHaveLength(28);
    expect(new Set(places.map((p: { code: string }) => p.code)).size).toBe(81);
  });
  it("at least 150 plant sites, Akkuyu listed", () => {
    const { plants } = read("plants.json");
    expect(plants.length).toBeGreaterThanOrEqual(150);
    expect(plants.some((p: { name: string }) => p.name === "Akkuyu")).toBe(true);
  });
  it("world outlines have a name each", () => {
    const { features } = read("world.json");
    expect(features.length).toBeGreaterThan(150);
    expect(features.every((f: { properties: { name?: string } }) => !!f.properties.name)).toBe(true);
  });
});
