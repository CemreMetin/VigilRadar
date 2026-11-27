import { describe, expect, it } from "vitest";
import { buildState } from "@/core/build-state";
import { KAHRAMANMARAS_2023 as KM } from "@/core/__fixtures__/sites";
import { TR } from "@/core/content/tr";
import { EN } from "@/core/content/en";
import { chokepointKey, linkRadiusKm, namedLinks } from "./triage";

const now = KM.timeMs + 600_000;
const s = buildState({ prev: null, nowMs: now, events: [KM], ok: { usgs: true, emsc: true, afad: true, kandilli: true }, tsunami: null, tsunamiOk: null, slow: null, fastMs: now });

describe("triage helpers", () => {
  it("names the linked asset", () => {
    expect(namedLinks(s, s.links).map((l) => l.name)).toEqual(["Akkuyu"]);
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
  it("both languages carry the same structure, with no country-specific emergency text", () => {
    expect(Object.keys(EN)).toEqual(Object.keys(TR));
    expect(Object.keys(EN.chokepointNotes)).toEqual(Object.keys(TR.chokepointNotes));
    expect(JSON.stringify([EN, TR])).not.toMatch(/AFAD|\b112\b|TRT|Alert/);
  });
});
