import { describe, expect, it } from "vitest";
import { checkGdeltRow, chokepointFlow, gdeltUrls, latestGdeltStamp, parseGdeltTsv, resolveChokepoints, toDaily } from "../slow";

const row = (over: Record<number, string> = {}) => {
  const c = Array<string>(61).fill("");
  Object.assign(c, { 0: "1", 12: "MIL", 27: "190", 28: "19", 32: "4", 51: "3", 52: "Dnipro, Ukraine", 56: "48.46", 57: "35.04", 59: "20261119001500", 60: "https://a.test/x" }, over);
  return c.join("\t");
};

describe("GDELT", () => {
  it("reads the stamp from lastupdate.txt and lists 96 files back in 15 minute steps", () => {
    const stamp = latestGdeltStamp("72492 abc http://data.gdeltproject.org/gdeltv2/20261119004500.export.CSV.zip\n1 2 x.mentions.CSV.zip");
    expect(stamp).toBe("20261119004500");
    const urls = gdeltUrls(stamp!);
    expect(urls).toHaveLength(96);
    expect(urls[0]).toBe("https://data.gdeltproject.org/gdeltv2/20261119004500.export.CSV.zip");
    expect(urls[1]).toContain("20261119003000");
    expect(urls[95]).toContain("20261118010000");
    expect(latestGdeltStamp("nothing")).toBeNull();
  });
  it("keeps only conflict codes at city level with coordinates, and converts DATEADDED (UTC)", () => {
    const rows = parseGdeltTsv([row(), row({ 28: "04", 27: "040" }), row({ 51: "1" }), row({ 56: "", 57: "" }), row({ 27: "183", 28: "18" }), "short\tline"].join("\n"), true);
    expect(rows.map((r) => r.baseCode)).toEqual(["190", "183"]);
    expect(rows[0]).toMatchObject({ rootCode: "19", geoType: 3, lat: 48.46, lon: 35.04, numSources: 4, dateAddedMs: Date.UTC(2026, 10, 19, 0, 15) });
  });
  it("throws when the layout is not GDELT 2.0 Events", () => {
    expect(() => parseGdeltTsv("a\tb\tc", true)).toThrow(/layout changed/);
    expect(() => checkGdeltRow(row({ 56: "abc" }).split("\t"))).toThrow();
    expect(() => checkGdeltRow(row({ 28: "1" }).split("\t"))).toThrow();
    expect(() => checkGdeltRow(row().split("\t"))).not.toThrow();
  });
});

describe("PortWatch", () => {
  const f = (portid: string, portname: string) => ({ attributes: { portid, portname, lat: 1, lon: 2 } });
  it("resolves the chokepoints by name, never by id; a missing one is left out", () => {
    const sites = resolveChokepoints([f("p9", "Strait of Hormuz"), f("p1", "Suez Canal"), f("p4", "Bab el-Mandeb Strait"), f("p3", "Bosporus Strait"), f("p5", "Malacca Strait")]);
    expect(sites.map((s) => `${s.key}:${s.id}`)).toEqual(["hormuz:p9", "suez:p1", "mandeb:p4", "malacca:p5", "bosporus:p3"]);
  });
  it("builds the flow with the last 30 days oldest first", () => {
    const rows = Array.from({ length: 100 }, (_, i) => ({ attributes: { date: new Date(Date.UTC(2026, 10, 15) - i * 86_400_000).toISOString().slice(0, 10), n_total: i < 7 ? 5 : 10 } }));
    const flow = chokepointFlow({ key: "hormuz", id: "p9", name: "Strait of Hormuz", lat: 26, lon: 56 }, toDaily(rows), Date.UTC(2026, 10, 19));
    expect(flow).toMatchObject({ available: true, level: "severe", dataThrough: "2026-11-15", recent: 5, baseline: 10 });
    expect(flow.series).toHaveLength(30);
    expect(flow.series!.at(-1)).toBe(5);
    expect(toDaily([{ attributes: { date: "2026-11-15", n_total: null } }, { attributes: {} }])).toEqual([]);
  });
});

describe("conflict samples", () => {
  it("lists links from different news sites, most reported first", async () => {
    const { clusterConflicts } = await import("../conflict");
    const now = Date.UTC(2026, 10, 19, 12);
    const r = (i: number, host: string, n: number) => ({ id: String(i), rootCode: "19", baseCode: "190", geoType: 3, lat: 30, lon: 50, fullName: "X", sourceUrl: `https://${host}/${i}`, numSources: n, dateAddedMs: now - 3_600_000 });
    const [c] = clusterConflicts([r(1, "a.test", 9), r(2, "a.test", 8), r(3, "b.test", 7), r(4, "c.test", 6), r(5, "d.test", 5)], now);
    expect(c.sampleUrls).toEqual(["https://a.test/1", "https://b.test/3", "https://c.test/4"]);
  });
});

describe("actor rule (VIGIL.md 5.6)", () => {
  // col 7/17 country, col 12/22 first actor type
  const act = (o: { c1?: string; c2?: string; t1?: string; t2?: string }) => row({ 7: o.c1 ?? "", 17: o.c2 ?? "", 12: o.t1 ?? "", 22: o.t2 ?? "" });
  const kept = (...lines: string[]) => parseGdeltTsv(lines.join("\n")).length;

  it("drops police and crime rows, even with a military or foreign counterpart", () => {
    expect(kept(act({ c1: "USA", c2: "USA", t1: "COP" }))).toBe(0); // Philadelphia style
    expect(kept(act({ c1: "USA", c2: "USA", t1: "CRM" }))).toBe(0);
    expect(kept(act({ c1: "USA", c2: "IRN", t1: "COP", t2: "MIL" }))).toBe(0);
  });
  it("drops same-country rows without an armed actor (Miami style) and rows with one side unknown (Beijing wire stories)", () => {
    expect(kept(act({ c1: "USA", c2: "USA", t1: "JUD" }))).toBe(0);
    expect(kept(act({ t1: "JUD" }))).toBe(0);
    expect(kept(act({ c2: "SEA", t2: "IGO" }))).toBe(0);
  });
  it("drops two different countries without an armed actor (Beijing CHN/USA diplomacy, Miami ISR/IRN)", () => {
    expect(kept(act({ c1: "CHN", c2: "USA", t1: "GOV" }))).toBe(0);
    expect(kept(act({ c1: "CHN", c2: "USA" }))).toBe(0);
    expect(kept(act({ c1: "ISR", c2: "IRN" }))).toBe(0);
  });
  it("keeps an armed actor", () => {
    expect(kept(act({ c1: "UKR", c2: "UKR", t2: "MIL" }))).toBe(1);
    expect(kept(act({ t1: "REB" }), act({ t1: "SEP" }), act({ t2: "INS" }))).toBe(3);
    expect(kept(act({ c1: "UKR", c2: "RUS", t1: "MIL" }))).toBe(1);
  });
  it("the first file's actor columns are checked", () => {
    expect(() => parseGdeltTsv(act({ c1: "usa-bad" }), true)).toThrow(/layout changed/);
  });
});

describe("evidence cap", () => {
  it("a conflict cluster at Zaporozhye links to the plant and lifts the status to ELEVATED, not CRITICAL", async () => {
    const { conflictLinks } = await import("../cascade");
    const { globalStatus } = await import("../status");
    const plants = [{ id: "ua-zaporozhye", name: "Zaporozhye", lat: 47.508, lon: 34.627 }];
    const now = Date.UTC(2026, 10, 19, 12);
    const cluster = { id: "c", lat: 47.55, lon: 34.6, label: "Enerhodar", events: 5, domains: 4, lastSeenMs: now, sampleUrls: [] };
    const links = conflictLinks([cluster], plants as never, [], now);
    expect(links).toHaveLength(1);
    const s = globalStatus({ nowMs: now, heartbeatMs: now, quakes: [], links, tsunami: [], chokepoints: [] });
    expect(s.level).toBe("ELEVATED");
    expect(s.reason).toMatchObject({ kind: "link" });
  });
});
