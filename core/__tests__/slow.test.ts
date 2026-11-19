import { describe, expect, it } from "vitest";
import { checkGdeltRow, chokepointFlow, gdeltUrls, latestGdeltStamp, parseGdeltTsv, resolveChokepoints, toDaily } from "../slow";

const row = (over: Record<number, string> = {}) => {
  const c = Array<string>(61).fill("");
  Object.assign(c, { 0: "1", 27: "190", 28: "19", 32: "4", 51: "3", 52: "Dnipro, Ukraine", 56: "48.46", 57: "35.04", 59: "20261119001500", 60: "https://a.test/x" }, over);
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
