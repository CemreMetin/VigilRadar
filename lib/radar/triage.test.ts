import { describe, expect, it } from "vitest";
import { buildState } from "@/core/build-state";
import { PROVINCES as P, KAHRAMANMARAS_2023 as KM, ev } from "@/core/__fixtures__/sites";
import { TR } from "@/core/content/tr";
import { EN } from "@/core/content/en";
import type { Province, State } from "@/core/types";
import { chokepointKey, linkRadiusKm, triageQuake } from "./triage";

const now = KM.timeMs + 600_000;
const mk = (events = [KM]): State =>
  buildState({ prev: null, nowMs: now, events, ok: { usgs: true, emsc: true, afad: true, kandilli: true }, tsunami: null, tsunamiOk: null, slow: null, fastMs: now });
const of = (s: State, p: Province | null) => triageQuake(s, s.quakes[0], p);

describe("triage (VIGIL.md 10.1)", () => {
  const s = mk();
  it("without a province no list is picked and the card asks for one", () => {
    const t = of(s, null);
    expect(t).toMatchObject({ needsProvince: true, nothingToDo: false, lists: [] });
    expect(t.links.map((l) => l.name)).toEqual(["Akkuyu"]);
  });
  it("P0 and P1 get 10.2, P2 gets 10.2-B, no level gets nothing to do", () => {
    expect(of(s, P.kahramanmaras).lists).toEqual(["afterQuake"]);
    expect(of(s, P.malatya)).toMatchObject({ severity: "P0", lists: ["afterQuake"] });
    expect(of(s, P.ankara)).toMatchObject({ severity: "P2", lists: ["feltMaybe"], nothingToDo: false });
    const far = of(mk([ev({ lat: 40, lon: 100, mag: 6.0, depthKm: 10, timeMs: now - 3600_000 })]), P.ankara);
    expect(far).toMatchObject({ severity: null, lists: [], nothingToDo: true });
  });
  it("a province within 100 km of a linked plant also gets 10.2-C", () => {
    const mersin: Province = { code: "TR-33", name: "Mersin", lat: 36.3, lon: 34.0, coastal: true }; // about 45 km from Akkuyu
    expect(of(s, mersin).lists).toContain("nearPlant");
    expect(of(s, P.kahramanmaras).lists).not.toContain("nearPlant");
  });
  it("a shallow strong quake off the coast puts the tsunami list first", () => {
    const off = mk([ev({ lat: 38.4, lon: 26.5, mag: 6.8, depthKm: 15, timeMs: now - 3600_000 })]);
    expect(of(off, P.izmir).lists[0]).toBe("tsunami");
    expect(of(off, P.konya).lists).not.toContain("tsunami");
  });
  it("rule text radius follows the link table", () => {
    const l = s.links[0];
    expect(linkRadiusKm(l, 7.8)).toBe(400);
    expect(linkRadiusKm(l, 7.1)).toBe(250);
    expect(linkRadiusKm({ ...l, toKind: "chokepoint" }, 6.6)).toBe(150);
  });
  it("chokepoints are told apart by name", () => {
    expect(chokepointKey("Strait of Hormuz")).toBe("hormuz");
    expect(chokepointKey("Bab el-Mandeb Strait")).toBe("mandeb");
    expect(chokepointKey("Bosporus Strait")).toBe("bosporus");
    expect(chokepointKey("Cape of Good Hope")).toBeNull();
  });
});

describe("fixed content", () => {
  it("both languages carry the same structure and the Turkish text is the one in VIGIL.md", () => {
    expect(EN.afterQuake).toHaveLength(TR.afterQuake.length);
    expect(Object.keys(EN.chokepointNotes)).toEqual(Object.keys(TR.chokepointNotes));
    expect(TR.afterQuake[1]).toBe("Gaz, elektrik ve su vanalarını kapat. Kibrit, çakmak yakma.");
    expect(TR.nothingToDo).toBe("Yapman gereken bir şey yok.");
  });
});
