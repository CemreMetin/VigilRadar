import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { State } from "@/core/types";
import { loadState, type Deps } from "./load";

const sample = (f: string) => JSON.parse(readFileSync(`core/__fixtures__/samples/${f}`, "utf8"));
const NOW = Date.parse("2026-11-18T13:00:00Z");

const mem = (): Deps["storage"] & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
};
const deps = (routes: Record<string, () => unknown>, extra: Partial<Deps> = {}): Deps => ({
  workerUrl: "https://w.test", now: () => NOW, storage: mem(),
  fetchJson: async (url) => {
    const hit = Object.entries(routes).find(([k]) => url.includes(k));
    if (!hit) throw new Error("down");
    return hit[1]();
  },
  ...extra,
});
const live = { "earthquake.usgs.gov": () => sample("usgs.json"), seismicportal: () => sample("emsc.json") };
const workerState = (over: Partial<State> = {}) => ({ v: 1, fastMs: NOW - 60_000, quakes: [], global: { level: "NOMINAL", reason: null }, ...over });

describe("loadState", () => {
  it("uses a fresh Worker state", async () => {
    const r = await loadState(deps({ "w.test": () => workerState() }));
    expect(r?.source).toBe("worker");
  });
  it("falls back to USGS + EMSC when the Worker is down, and computes a state with core/", async () => {
    const r = await loadState(deps(live));
    expect(r?.source).toBe("backup");
    expect(r!.state.quakes.length).toBeGreaterThan(5);
    expect(r!.state.global.level).toBe("NOMINAL");
  });
  it("falls back when the Worker state is older than 15 minutes or already STALE", async () => {
    for (const bad of [workerState({ fastMs: NOW - 16 * 60_000 }), workerState({ global: { level: "STALE", reason: null } })])
      expect((await loadState(deps({ "w.test": () => bad, ...live })))?.source).toBe("backup");
  });
  it("without a Worker address goes straight to the backup", async () => {
    expect((await loadState(deps(live, { workerUrl: undefined })))?.source).toBe("backup");
  });
  it("one backup source is enough", async () => {
    expect((await loadState(deps({ seismicportal: () => sample("emsc.json") })))?.source).toBe("backup");
  });
  it("when everything fails it serves the last good state, marked stale", async () => {
    const storage = mem();
    const first = await loadState(deps(live, { storage }));
    const second = await loadState(deps({}, { storage, now: () => NOW + 3_600_000 }));
    expect(second).toMatchObject({ source: "stale", lastOkMs: first!.lastOkMs });
  });
  it("nothing cached and nothing reachable gives null; a broken cache is ignored", async () => {
    expect(await loadState(deps({}))).toBeNull();
    const storage = mem();
    storage.setItem("vigil.state", "{not json");
    expect(await loadState(deps({}, { storage }))).toBeNull();
  });
  it("blocked storage does not break loading", async () => {
    const storage = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
    expect((await loadState(deps(live, { storage })))?.source).toBe("backup");
  });
});
