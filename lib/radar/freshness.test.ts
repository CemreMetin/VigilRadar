import { describe, expect, it } from "vitest";
import type { State } from "@/core/types";
import { freshnessRows } from "./freshness";

const NOW = Date.UTC(2026, 10, 19, 12);
const ev = (source: string, timeMs: number) => ({ source, sourceId: "x", timeMs, lat: 0, lon: 0, depthKm: 10, mag: 5, place: "p", updatedMs: timeMs });
const state = (o: Partial<State> = {}) => ({
  sources: { usgs: { ok: true, ms: NOW - 60_000 }, emsc: { ok: false, ms: NOW - 3_600_000 }, afad: { ok: true, ms: NOW }, kandilli: { ok: false, ms: 0 }, tsunami: { ok: true, ms: NOW } },
  quakes: [{ id: "a", best: ev("afad", NOW - 600_000), sources: [ev("afad", NOW - 600_000), ev("usgs", NOW - 590_000)] }, { id: "b", best: ev("usgs", NOW - 5_000_000), sources: [ev("usgs", NOW - 5_000_000)] }],
  tsunami: [], conflicts: [{ lastSeenMs: NOW - 7_200_000 }], conflictsMs: NOW - 1_800_000, chokepoints: [{ available: true, dataThrough: "2026-11-15" }, { available: false, dataThrough: null }],
  ...o,
}) as unknown as State;
const by = (rows: ReturnType<typeof freshnessRows>) => Object.fromEntries(rows.map((r) => [r.key, r]));

describe("freshness rows (/about)", () => {
  it("quake sources: last fetch from the heartbeat, newest event among that source's events, ok or error", () => {
    const r = by(freshnessRows(state(), NOW));
    expect(r.usgs).toMatchObject({ fetchedMs: NOW - 60_000, newestMs: NOW - 590_000, status: "ok" });
    expect(r.afad.newestMs).toBe(NOW - 600_000);
    expect(r.emsc).toMatchObject({ newestMs: null, status: "error" });
    expect(r.kandilli).toMatchObject({ fetchedMs: null, status: "none" }); // never fetched
  });
  it("GDELT: its own timestamp; older than the stale limit is stale, never fetched is none", () => {
    expect(by(freshnessRows(state(), NOW)).gdelt).toMatchObject({ fetchedMs: NOW - 1_800_000, newestMs: NOW - 7_200_000, status: "ok" });
    expect(by(freshnessRows(state(), NOW + 3 * 3_600_000)).gdelt.status).toBe("stale");
    expect(by(freshnessRows(state({ conflictsMs: null, conflicts: [] }), NOW)).gdelt).toMatchObject({ fetchedMs: null, newestMs: null, status: "none" });
  });
  it("PortWatch: newest data day; older than the stale days is stale; unavailable ones are ignored", () => {
    expect(by(freshnessRows(state(), NOW)).portwatch).toMatchObject({ newestMs: Date.parse("2026-11-15"), status: "ok" });
    expect(by(freshnessRows(state(), NOW + 8 * 86_400_000)).portwatch.status).toBe("stale");
    expect(by(freshnessRows(state({ chokepoints: [] }), NOW)).portwatch.status).toBe("none");
  });
});

describe("read more bridge", () => {
  it("links only the pages that fit: Marmara and Cascadia quakes, nothing elsewhere", async () => {
    const { readMoreFor, READ_MORE } = await import("@/core/content/readmore");
    const { SCENARIO_BY_ID } = await import("@/data/scenarios");
    expect(readMoreFor(40.8, 29.0)?.id).toBe("marmara");
    expect(readMoreFor(47.0, -124.5)?.id).toBe("cascadia");
    expect(readMoreFor(38.35, 38.31)).toBeNull(); // Malatya
    for (const r of READ_MORE) expect(SCENARIO_BY_ID[r.id]).toBeDefined(); // every id is a real /library page
  });
});
