import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Env, KV } from "../env";
import { handleRequest, type EdgeCache } from "../http";
import { runTurn } from "../index";
import { Store } from "../store";

const sample = (f: string) => readFileSync(`core/__fixtures__/samples/${f}`);
const NOW = Date.parse("2026-11-18T13:00:00Z"); // minute 0: tsunami feeds are fetched and the heartbeat is written

class MemKV implements KV {
  data = new Map<string, { value: string; metadata: unknown }>();
  puts: string[] = [];
  gets = 0;
  async get(key: string) { this.gets++; return this.data.get(key)?.value ?? null; }
  async getWithMetadata<M>(key: string) { const e = this.data.get(key); return { value: e?.value ?? null, metadata: (e?.metadata ?? null) as M | null }; }
  async put(key: string, value: string, opts?: { metadata?: unknown }) { this.puts.push(key); this.data.set(key, { value, metadata: opts?.metadata }); }
}

function stubSources(failing: string[] = []) {
  vi.stubGlobal("fetch", async (url: string) => {
    if (failing.some((f) => url.includes(f))) throw new Error("down");
    const body = url.includes("usgs") ? sample("usgs.json") : url.includes("seismicportal") ? sample("emsc.json") : url.includes("afad") ? sample("afad.json")
      : url.includes("koeri") ? sample("kandilli.html") : sample("tsunami-ntwc.xml");
    return new Response(body, { status: 200 });
  });
}
afterEach(() => vi.unstubAllGlobals());

describe("store", () => {
  it("refuses writes over the per-turn budget", async () => {
    const s = new Store(new MemKV(), 3);
    const r = [await s.put("a", 1), await s.put("b", 2), await s.put("c", 3), await s.put("d", 4)];
    expect(r).toEqual([true, true, true, false]);
  });
});

describe("cron turn", () => {
  it("writes state and heartbeat, then skips an unchanged state", async () => {
    stubSources();
    const kv = new MemKV();
    const env = { VIGIL: kv } as Env;
    await runTurn(env, NOW);
    expect(kv.puts.sort()).toEqual(["hb", "state"]);
    await runTurn(env, NOW + 60_000);
    expect(kv.puts.filter((k) => k === "state")).toHaveLength(1);
    const state = JSON.parse((await kv.get("state"))!);
    expect(state.quakes.length).toBeGreaterThan(10);
    expect(Object.values(state.sources).every((s) => (s as { ok: boolean }).ok)).toBe(true);
  });
  it("a failing source does not stop the others", async () => {
    stubSources(["usgs", "koeri"]);
    const kv = new MemKV();
    await runTurn({ VIGIL: kv } as Env, NOW);
    const state = JSON.parse((await kv.get("state"))!);
    expect(state.sources.usgs.ok).toBe(false);
    expect(state.sources.emsc.ok).toBe(true);
    expect(state.quakes.length).toBeGreaterThan(0);
  });
  it("no source answering writes no heartbeat", async () => {
    stubSources(["usgs", "seismicportal", "afad", "koeri"]);
    const kv = new MemKV();
    await runTurn({ VIGIL: kv } as Env, NOW);
    expect(kv.puts).not.toContain("hb");
  });
});

class MemCache implements EdgeCache {
  m = new Map<string, Response>();
  async match(k: Request) { return this.m.get(k.url)?.clone(); }
  async put(k: Request, r: Response) { this.m.set(k.url, r); }
}

describe("state cache", () => {
  it("reads KV only on a miss and keeps CORS per origin", async () => {
    stubSources();
    const kv = new MemKV();
    const env = { VIGIL: kv, ALLOWED_ORIGINS: "https://a.test,https://b.test" } as Env;
    await runTurn(env, NOW);
    const cache = new MemCache();
    const call = (origin: string) => handleRequest(new Request("https://x.test/v1/state", { headers: { Origin: origin } }), env, NOW + 1000, cache);
    kv.gets = 0;
    const first = await call("https://a.test");
    const afterMiss = kv.gets;
    expect(afterMiss).toBeGreaterThan(0);
    const second = await call("https://b.test");
    expect(kv.gets).toBe(afterMiss); // served from the cache
    expect(first.headers.get("Access-Control-Allow-Origin")).toBe("https://a.test");
    expect(second.headers.get("Access-Control-Allow-Origin")).toBe("https://b.test");
    expect((await call("https://evil.test")).headers.get("Access-Control-Allow-Origin")).toBeNull();
    expect((await second.json()).quakes.length).toBeGreaterThan(0);
  });
  it("does not cache the 503 before the first turn", async () => {
    const env = { VIGIL: new MemKV() } as Env;
    const cache = new MemCache();
    expect((await handleRequest(new Request("https://x.test/v1/state"), env, NOW, cache)).status).toBe(503);
    expect(cache.m.size).toBe(0);
  });
});

describe("http", () => {
  const get = (env: Env, path: string, now = NOW, origin?: string) => handleRequest(new Request(`https://x.test${path}`, { headers: origin ? { Origin: origin } : {} }), env, now);
  it("503 before the first turn, then state with CORS only for allowed origins", async () => {
    stubSources();
    const env = { VIGIL: new MemKV(), ALLOWED_ORIGINS: "https://site.test" } as Env;
    expect((await get(env, "/v1/state")).status).toBe(503);
    await runTurn(env, NOW);
    const ok = await get(env, "/v1/state", NOW + 30_000, "https://site.test");
    expect(ok.status).toBe(200);
    expect(ok.headers.get("Cache-Control")).toBe("public, max-age=30");
    expect(ok.headers.get("Access-Control-Allow-Origin")).toBe("https://site.test");
    expect((await get(env, "/v1/state", NOW, "https://evil.test")).headers.get("Access-Control-Allow-Origin")).toBeNull();
    expect((await ok.json()).global.level).not.toBe("STALE");
  });
  it("a heartbeat older than 15 minutes makes the state STALE and health not ok", async () => {
    stubSources();
    const env = { VIGIL: new MemKV() } as Env;
    await runTurn(env, NOW);
    const later = NOW + 16 * 60_000;
    expect((await (await get(env, "/v1/state", later)).json()).global.level).toBe("STALE");
    const h = await (await get(env, "/v1/health", later)).json();
    expect(h).toMatchObject({ ok: false, fastAgeSec: 960 });
    expect((await (await get(env, "/v1/health", NOW + 60_000)).json()).ok).toBe(true);
  });
  it("unknown paths and non-GET answer 404", async () => {
    const env = { VIGIL: new MemKV() } as Env;
    expect((await get(env, "/v1/nope")).status).toBe(404);
    expect((await handleRequest(new Request("https://x.test/v1/state", { method: "POST" }), env, NOW)).status).toBe(404);
  });
});

describe("ingest slow", () => {
  const slow = { conflicts: [{ id: "c", lat: 48.5, lon: 35.1, label: "x", events: 3, domains: 3, lastSeenMs: NOW, sampleUrls: [] }], conflictsMs: NOW, chokepoints: [{ id: "chokepoint6", name: "Strait of Hormuz", lat: 26, lon: 56, recent: 1, baseline: 2, dev: -0.5, level: "severe", dataThrough: "2026-11-15", available: true }] };
  const post = (env: Env, body: unknown, token: string | null = "secret", extra: Record<string, string> = {}) =>
    handleRequest(new Request("https://x.test/v1/ingest/slow", { method: "POST", headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra }, body: typeof body === "string" ? body : JSON.stringify(body) }), env, NOW);

  it("stores a valid body under `slow` with the right token", async () => {
    const kv = new MemKV();
    const r = await post({ VIGIL: kv, INGEST_TOKEN: "secret" } as Env, slow);
    expect(r.status).toBe(200);
    expect(JSON.parse(kv.data.get("slow")!.value).chokepoints[0].id).toBe("chokepoint6");
  });
  it("refuses a missing or wrong token and writes nothing; without INGEST_TOKEN the endpoint does not exist", async () => {
    const kv = new MemKV();
    const env = { VIGIL: kv, INGEST_TOKEN: "secret" } as Env;
    expect((await post(env, slow, null)).status).toBe(401);
    expect((await post(env, slow, "secre")).status).toBe(401);
    expect((await post(env, slow, "secrett")).status).toBe(401);
    expect((await post({ VIGIL: kv } as Env, slow)).status).toBe(404);
    expect(kv.puts).toEqual([]);
  });
  it("rejects bad json, a wrong shape and a body over 512 KB", async () => {
    const kv = new MemKV();
    const env = { VIGIL: kv, INGEST_TOKEN: "secret" } as Env;
    expect((await post(env, "{nope")).status).toBe(400);
    expect((await post(env, { ...slow, conflicts: [{ id: "x" }] })).status).toBe(400);
    expect((await post(env, { ...slow, chokepoints: "no" })).status).toBe(400);
    expect((await post(env, "x".repeat(512 * 1024 + 1))).status).toBe(413);
    expect(kv.puts).toEqual([]);
  });
  it("the next cron turn builds the stored slow data into the state", async () => {
    stubSources();
    const kv = new MemKV();
    const env = { VIGIL: kv, INGEST_TOKEN: "secret" } as Env;
    await post(env, slow);
    await runTurn(env, NOW);
    const state = JSON.parse(kv.data.get("state")!.value);
    expect(state.chokepoints[0].id).toBe("chokepoint6");
    expect(state.conflicts).toHaveLength(1);
  });
});
