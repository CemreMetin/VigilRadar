import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseAfad, parseEmsc, parseKandilli, parseUsgs } from "../quakes/normalize";
import { parseTsunami } from "../tsunami";

const sample = (f: string) => readFileSync(`core/__fixtures__/samples/${f}`);
const json = (f: string) => JSON.parse(sample(f).toString("utf8"));
const kandilliText = () => new TextDecoder("windows-1254").decode(sample("kandilli.html"));

// 16. Adapters: a real sample answer gives the expected QuakeEvent[]; a broken answer gives [] and never throws.
describe("16. adapters", () => {
  it("USGS", () => {
    const raw = json("usgs.json").features;
    const q = parseUsgs(json("usgs.json"));
    expect(q).toHaveLength(raw.length);
    expect(q[0]).toMatchObject({ source: "usgs", sourceId: raw[0].id, mag: raw[0].properties.mag, lon: raw[0].geometry.coordinates[0], lat: raw[0].geometry.coordinates[1], depthKm: raw[0].geometry.coordinates[2], timeMs: raw[0].properties.time });
  });
  it("EMSC takes unid as id and a positive depth", () => {
    const raw = json("emsc.json").features;
    const q = parseEmsc(json("emsc.json"));
    expect(q).toHaveLength(raw.length);
    expect(q[0]).toMatchObject({ source: "emsc", sourceId: raw[0].properties.unid, mag: raw[0].properties.mag, timeMs: Date.parse(raw[0].properties.time) });
    expect(q.every((e) => e.depthKm >= 0)).toBe(true);
  });
  it("AFAD reads the date as UTC", () => {
    const q = parseAfad(json("afad.json"));
    expect(q).toHaveLength(3);
    expect(q[2]).toMatchObject({ source: "afad", sourceId: "734442", mag: 4.3, lat: 38.48533, lon: 42.93383, depthKm: 13.61, timeMs: Date.UTC(2026, 10, 17, 15, 57, 45) });
  });
  it("Kandilli reads the local time as UTC+3 and picks Mw, then ML, then MD", () => {
    const q = parseKandilli(kandilliText());
    expect(q.length).toBeGreaterThan(100);
    expect(q[0]).toMatchObject({ source: "kandilli", sourceId: "20261118152246", lat: 40.3882, lon: 23.9872, depthKm: 9.1, mag: 1.3, place: "YUNANISTAN", timeMs: Date.UTC(2026, 10, 18, 12, 22, 46) });
    expect(parseKandilli("2024.01.01 00:00:00  40.0000   30.0000   5.0  4.4  4.1  4.3   TEST (BOLU)   İlksel")[0].mag).toBe(4.3);
    expect(parseKandilli("2024.01.01 00:00:00  40.0000   30.0000   5.0  4.4  -.-  -.-   TEST (BOLU)   İlksel")[0].mag).toBe(4.4);
  });
  it("tsunami: the category decides, not the words in the text", () => {
    const xml = sample("tsunami-ntwc.xml").toString("utf8");
    const info = parseTsunami(xml);
    expect(info).toHaveLength(1);
    expect(info[0]).toMatchObject({ level: "info", lat: 58.4, lon: -151, timeMs: Date.parse("2026-11-13T23:30:02Z") });
    expect(parseTsunami(xml.replace("</strong> Information", "</strong> Warning"))[0].level).toBe("warning");
    expect(parseTsunami(xml.replace("</strong> Information", "</strong> Watch"))[0].level).toBe("watch");
  });
  it("broken answers give an empty list", () => {
    for (const bad of [null, undefined, 42, "x", {}, { features: null }, { features: [{}] }, [{}], [null]]) {
      expect(parseUsgs(bad)).toEqual([]);
      expect(parseEmsc(bad)).toEqual([]);
      expect(parseAfad(bad)).toEqual([]);
    }
    expect(parseKandilli("<html>error</html>")).toEqual([]);
    expect(parseKandilli(undefined as unknown as string)).toEqual([]);
    expect(parseTsunami("not xml")).toEqual([]);
    expect(parseTsunami(undefined as unknown as string)).toEqual([]);
  });
  it("the measured zone offsets are the ones in the saved probe result", () => {
    const z = json("timezone-result.json");
    expect(Math.abs(Math.round(z.afad.medianHours))).toBe(0);
    expect(Math.round(z.kandilli.medianHours)).toBe(3);
  });
});
