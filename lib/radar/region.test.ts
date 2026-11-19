import { describe, expect, it } from "vitest";
import { PROVINCES } from "@/core/build-state";
import { agoText, reasonText } from "./format";
import { filterProvinces, fold } from "./region";
import { UI } from "@/core/content/ui";

const t = (k: keyof typeof UI.tr) => UI.tr[k];

describe("region filter", () => {
  it("folds Turkish letters both ways", () => {
    expect(fold("İSTANBUL")).toBe("istanbul");
    expect(fold("Iğdır")).toBe("igdir");
    expect(fold("Şanlıurfa")).toBe("sanliurfa");
    expect(fold("ELAZIĞ")).toBe("elazig");
  });
  it("finds provinces without typing the Turkish characters", () => {
    expect(filterProvinces("istanbul").map((p) => p.name)).toEqual(["İstanbul"]);
    expect(filterProvinces("sanliurfa")[0].name).toBe("Şanlıurfa");
    expect(filterProvinces("igdir")[0].name).toBe("Iğdır");
    expect(filterProvinces("").length).toBe(81);
    expect(filterProvinces("zzz")).toEqual([]);
    expect(PROVINCES.length).toBe(81);
  });
});

describe("reason text", () => {
  const now = Date.UTC(2026, 10, 18, 12);
  it("shows magnitude, place and age", () => {
    const r = { kind: "quake" as const, quakeId: "x", mag: 6.8, place: "Kamchatka", timeMs: now - 3 * 3_600_000 };
    expect(reasonText(r, now, t)).toBe("M6.8 · Kamchatka · 3 sa önce");
    expect(agoText(5 * 60_000, t)).toBe("5 dk önce");
    expect(agoText(3 * 86_400_000, t)).toBe("3 gün önce");
  });
  it("a link reason names the asset, not its id", () => {
    const r = { kind: "link" as const, linkId: "conflict:79:-151>plant:us-limerick", rule: "conflict→plant" as const };
    expect(reasonText(r, now, t, undefined, (id) => (id === "us-limerick" ? "Limerick" : undefined))).toBe("conflict → plant · Limerick");
    expect(reasonText(r, now, t)).toBe("conflict → plant · us-limerick");
  });
  it("a stale status names the time of the last data", () => {
    expect(reasonText({ kind: "stale", lastHeartbeatMs: Date.UTC(2026, 10, 18, 9, 5) }, now, t)).toBe("son veri 09:05 UTC");
  });
});
