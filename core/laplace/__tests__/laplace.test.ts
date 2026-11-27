import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PROFILES, buildCountries, solarExposure, type CountryFactsFile, type WorldFeature } from "../countries";
import { decodeSimQuery, dominoChain, encodeSimQuery, simulate, tierOf, waveFactor } from "../engine";
import { CHANNEL_IDS, SHOCKS, SHOCK_IDS } from "../shocks";
import type { ChannelId, ShockId } from "../types";

const read = (f: string) => JSON.parse(readFileSync(f, "utf8"));
const world = read("public/data/static/world.json") as { features: WorldFeature[] };
const facts = read("public/data/country_profiles.json") as CountryFactsFile;
const countries = buildCountries(world, facts);
const run = (shock: ShockId, severity: number, day: number) => simulate({ shock, severity, day }, countries);

describe("1. map integrity", () => {
  it("has 49 profiles and every mapName is a feature of world.json", () => {
    const names = new Set(world.features.map((f) => f.properties.name));
    expect(PROFILES).toHaveLength(49);
    expect(PROFILES.filter((p) => !names.has(p.mapName))).toEqual([]);
  });
});

describe("2. full coverage", () => {
  it("covers all 176 countries with unique codes, with and without the lazily loaded facts", () => {
    for (const list of [countries, buildCountries(world, null)]) {
      expect(list).toHaveLength(176);
      expect(new Set(list.map((c) => c.iso3)).size).toBe(176);
      expect(list.every((c) => Number.isFinite(c.lat) && Math.abs(c.lat) <= 90 && Math.abs(c.lon) <= 180 && c.name.en && c.name.tr)).toBe(true);
    }
  });
  it("gives every country, for every shock, scores of 0..100 and a three step domino chain", () => {
    for (const shock of SHOCK_IDS) {
      const r = run(shock, 1, 45);
      expect(Object.keys(r.byMapName)).toHaveLength(176);
      for (const c of countries) {
        const i = r.byIso3[c.iso3];
        for (const v of [i.total, ...CHANNEL_IDS.map((ch) => i.channels[ch])]) expect(Number.isInteger(v) && v >= 0 && v <= 100, `${shock} ${c.iso3} ${v}`).toBe(true);
        const chain = dominoChain(shock, c);
        expect(chain.map((s) => s.step)).toEqual([1, 2, 3]);
        expect(new Set(chain.map((s) => s.channel)).size).toBe(3);
        for (const s of chain) expect(s.text.en && s.text.tr && s.timing.en && s.timing.tr && s.source, `${shock} ${c.iso3}`).toBeTruthy();
        if (!c.profiled) expect(chain.every((s) => s.evidence === "C")).toBe(true);
      }
    }
  });
  it("uses hunger to raise food exposure in the fallback model", () => {
    const hungry = buildCountries(world, { countries: { AFG: { lat: 34, lon: 66, hunger: { value: 30 } } } }).find((c) => c.iso3 === "AFG")!;
    const fed = buildCountries(world, { countries: { AFG: { lat: 34, lon: 66, hunger: { value: 2 } } } }).find((c) => c.iso3 === "AFG")!;
    expect(hungry.shocks.blacksea!.food!).toBeGreaterThan(fed.shocks.blacksea!.food!);
  });
});

describe("3. monotonicity and time", () => {
  it("never lowers a total when severity rises", () => {
    for (const shock of SHOCK_IDS) {
      let prev = run(shock, 0.1, 30);
      for (const sev of [0.25, 0.5, 0.75, 1]) {
        const next = run(shock, sev, 30);
        for (const c of countries) expect(next.byIso3[c.iso3].total).toBeGreaterThanOrEqual(prev.byIso3[c.iso3].total);
        prev = next;
      }
    }
  });
  it("builds the Hormuz energy wave and lets cable damage heal", () => {
    expect(run("hormuz", 0.8, 14).byIso3.JPN.channels.energy).toBeGreaterThan(run("hormuz", 0.8, 1).byIso3.JPN.channels.energy);
    expect(run("redsea-cables", 0.8, 7).byIso3.EGY.channels.digital).toBeGreaterThan(run("redsea-cables", 0.8, 150).byIso3.EGY.channels.digital);
  });
  it("shapes the wave: early signal, peak of 1, decay towards the persistence, and no division by zero", () => {
    expect(waveFactor(1, 10, 20, 0.5)).toBeCloseTo(0.008);
    expect(waveFactor(10, 10, 20, 0.5)).toBeCloseTo(0.08);
    expect(waveFactor(20, 10, 20, 0.5)).toBeCloseTo(1);
    expect(waveFactor(2000, 10, 20, 0.5)).toBeCloseTo(0.5);
    expect(waveFactor(5, 5, 5, 0.5)).toBe(1);
  });
  it("cuts the tiers at 12, 30, 55 and 75", () => {
    expect([11, 12, 29, 30, 54, 55, 74, 75].map(tierOf)).toEqual(["none", "low", "low", "moderate", "moderate", "high", "high", "severe"]);
  });
});

describe("4. real-world sense", () => {
  const score = (shock: ShockId, sev: number, day: number, ch: ChannelId) => {
    const r = run(shock, sev, day);
    return (iso: string) => r.byIso3[iso].channels[ch];
  };
  it("hormuz hits Asian importers' energy harder than the Americas", () => {
    const e = score("hormuz", 0.8, 20, "energy");
    for (const a of ["JPN", "KOR", "IND"]) for (const b of ["USA", "BRA"]) expect(e(a), `${a} > ${b}`).toBeGreaterThan(e(b));
  });
  it("suez hits Mediterranean and European trade", () => {
    const e = score("suez", 0.8, 25, "trade");
    for (const a of ["EGY", "DEU", "ITA", "TUR"]) expect(e(a), a).toBeGreaterThanOrEqual(45);
  });
  it("taiwan hits the digital channel of the chip users", () => {
    const e = score("taiwan", 0.8, 40, "digital");
    for (const a of ["USA", "CHN", "JPN", "KOR", "DEU"]) expect(e(a), a).toBeGreaterThanOrEqual(55);
  });
  it("the Black Sea hits importers' food harder than exporters'", () => {
    const e = score("blacksea", 0.8, 30, "food");
    for (const a of ["EGY", "TUR", "LBN"]) for (const b of ["CAN", "AUS"]) expect(e(a), `${a} > ${b}`).toBeGreaterThan(e(b));
  });
  it("a solar storm hits high latitudes harder than the tropics", () => {
    const energy = score("solar-g5", 0.9, 3, "energy"), digital = score("solar-g5", 0.9, 3, "digital");
    for (const a of ["NOR", "SWE", "CAN"]) for (const b of ["IDN", "BRA"]) {
      expect(energy(a), `energy ${a} > ${b}`).toBeGreaterThan(energy(b));
      expect(digital(a), `digital ${a} > ${b}`).toBeGreaterThan(digital(b));
    }
  });
  it("puts the directly hit country where the shock is", () => {
    expect(run("panama", 0.8, 30).topAffected[0].iso3).toBe("PAN");
    const hormuz = run("hormuz", 0.8, 30).byIso3;
    expect(["high", "severe"]).toContain(hormuz.KWT.tier);
    expect(["high", "severe"]).toContain(hormuz.OMN.tier);
    for (const sev of [0.75, 0.8]) expect(run("blacksea", sev, 30).topAffected.slice(0, 3).map((i) => i.iso3), `sev ${sev}`).toContain("UKR");
  });
  it("reaches severe: Taiwan at 0.8 near its peak, Taiwan and Egypt at full severity on the default day", () => {
    expect(run("taiwan", 0.8, 47).byIso3.TWN).toMatchObject({ tier: "severe" });
    expect(run("taiwan", 1, 30).byIso3.TWN.tier).toBe("severe");
    expect(run("suez", 1, 30).byIso3.EGY.tier).toBe("severe");
  });
  it("weighs the three strongest channels 70/20/10", () => {
    const i = run("hormuz", 0.8, 30).byIso3.JPN;
    const [a, b, c] = Object.values(i.channels).sort((x, y) => y - x);
    expect(i.total).toBe(Math.round(0.7 * a + 0.2 * b + 0.1 * c));
  });
  it("keeps the empty polar grids below the continental ones, whatever their latitude", () => {
    const r = run("solar-g5", 0.8, 3).byIso3;
    for (const sparse of ["GRL", "ATF", "FLK"]) for (const grid of ["CAN", "NOR"]) expect(r[sparse].total, `${sparse} < ${grid}`).toBeLessThan(r[grid].total);
    expect(countries.find((c) => c.iso3 === "USA")!.shocks["solar-g5"]).toEqual(solarExposure(54));
    expect(countries.find((c) => c.iso3 === "CAN")!.shocks["solar-g5"]).toEqual(solarExposure(58));
  });
  it("opens a documented chain with grade A, keeps the rest at B, and sorts the top list and the arcs", () => {
    const japan = countries.find((c) => c.iso3 === "JPN")!;
    expect(dominoChain("hormuz", japan).map((s) => s.evidence)).toEqual(["A", "B", "B"]);
    const r = run("hormuz", 0.8, 20);
    expect(r.topAffected).toHaveLength(12);
    expect(r.topAffected.map((i) => i.total)).toEqual([...r.topAffected.map((i) => i.total)].sort((a, b) => b - a));
    expect(r.arcs.length).toBeLessThanOrEqual(14);
    expect(r.arcs.every((a) => a.score >= 18 && a.from[0] === r.shock.lon)).toBe(true);
    expect(r.globalIndex).toBeGreaterThan(0);
  });
});

describe("5. URL", () => {
  it("round-trips", () => {
    for (const q of [{ shock: "hormuz", severity: 0.75, day: 30, country: "TUR" }, { shock: "solar-g5", severity: 0.29, day: 180, country: null }] as const)
      expect(decodeSimQuery(encodeSimQuery(q))).toEqual(q);
    expect(encodeSimQuery({ shock: "hormuz", severity: 0.75, day: 30, country: "TUR" })).toBe("?mode=sim&shock=hormuz&sev=75&day=30&country=TUR");
  });
  it("opens each shock on its own default day when the address names none", () => {
    for (const s of SHOCKS) expect(decodeSimQuery(`?mode=sim&shock=${s.id}`).day, s.id).toBe(s.defaultDay);
    expect(SHOCKS.map((s) => s.defaultDay)).toEqual([30, 30, 30, 7, 30, 30, 90, 3]);
    expect(decodeSimQuery("?mode=sim&shock=solar-g5&day=40").day).toBe(40);
  });
  it("falls back to safe defaults for a broken query", () => {
    const safe = { shock: "hormuz", severity: 0.75, day: 30, country: null };
    for (const q of ["", "?mode=sim", "?shock=moon&sev=abc&day=-4&country=<x>", "?sev=1000&day=181", "?sev=&day=2.5"]) expect(decodeSimQuery(q), q).toEqual(safe);
  });
});

// 6. The retraction test lives with the merge it tests: core/__tests__/quakes.test.ts ("retraction").
