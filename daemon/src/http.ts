import { CONFIG } from "../../core/config";
import type { State } from "../../core/types";
import type { Env } from "./env";
import { type Slow } from "../../core/build-state";
import { Store } from "./store";

interface Hb { fastMs: number; sources: State["sources"] }

function cors(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get("Origin");
  const allowed = (env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return origin && allowed.includes(origin) ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {};
}

const json = (body: unknown, status: number, headers: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...headers } });

/** The state with the heartbeat applied: an old heartbeat turns the global status into STALE, whatever the cron last wrote. */
async function load(env: Env, nowMs: number) {
  const store = new Store(env.VIGIL);
  const [state, hb, slow] = await Promise.all([store.getJson<State>("state"), store.getJson<Hb>("hb"), store.getJson<Slow>("slow")]);
  const fastMs = hb?.fastMs ?? null;
  const fastAgeSec = fastMs === null ? null : Math.max(0, Math.round((nowMs - fastMs) / 1000));
  const stale = fastAgeSec === null || fastAgeSec > CONFIG.stale.fastMinutes * 60;
  return { state, hb, slow, fastAgeSec, stale };
}

/** The slice of the Workers Cache API used here (`caches.default`). */
export interface EdgeCache { match(key: Request): Promise<Response | undefined>; put(key: Request, res: Response): Promise<void> }
const STATE_TTL_SEC = 30;

const MAX_INGEST_BYTES = 512 * 1024;

/** Equal-length compare without an early exit, so the response time does not tell how many characters matched. */
function sameToken(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

/** POST /v1/ingest/slow: the slow lane's output, stored under `slow`; the next cron turn builds it into the state. */
async function ingestSlow(request: Request, env: Env): Promise<Response> {
  const none = {};
  if (!env.INGEST_TOKEN) return json({ error: "not found" }, 404, none);
  const bearer = /^Bearer (.+)$/.exec(request.headers.get("Authorization") ?? "")?.[1] ?? "";
  if (!sameToken(bearer, env.INGEST_TOKEN)) return json({ error: "unauthorized" }, 401, none);
  if (Number(request.headers.get("Content-Length") ?? 0) > MAX_INGEST_BYTES) return json({ error: "too large" }, 413, none);
  const text = await request.text();
  if (text.length > MAX_INGEST_BYTES) return json({ error: "too large" }, 413, none);
  let body: Partial<Slow>;
  try { body = JSON.parse(text); } catch { return json({ error: "bad json" }, 400, none); }
  const okMs = body.conflictsMs === null || Number.isFinite(body.conflictsMs);
  const okUrl = (u: unknown) => typeof u === "string" && /^https?:\/\//i.test(u);
  const okConflicts = Array.isArray(body.conflicts) && body.conflicts.length <= 500 && body.conflicts.every((x) => Number.isFinite(x?.lat) && Number.isFinite(x?.lon) && typeof x?.id === "string" && (x.sampleUrls === undefined || (Array.isArray(x.sampleUrls) && x.sampleUrls.length <= 10 && x.sampleUrls.every(okUrl))));
  const okFlows = Array.isArray(body.chokepoints) && body.chokepoints.length <= 40 && body.chokepoints.every((x) => typeof x?.id === "string" && typeof x?.available === "boolean");
  if (!okMs || !okConflicts || !okFlows) return json({ error: "bad shape" }, 400, none);
  const slow: Slow = { conflicts: body.conflicts!, conflictsMs: body.conflictsMs ?? null, chokepoints: body.chokepoints! };
  await new Store(env.VIGIL).put("slow", slow);
  return json({ ok: true, conflicts: slow.conflicts.length, chokepoints: slow.chokepoints.length }, 200, { "Cache-Control": "no-store" });
}

export async function handleRequest(request: Request, env: Env, nowMs: number, cache?: EdgeCache): Promise<Response> {
  const c = cors(request, env);
  const url = new URL(request.url);
  if (request.method === "POST" && url.pathname === "/v1/ingest/slow") return ingestSlow(request, env);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { ...c, "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Max-Age": "86400" } });
  if (request.method !== "GET") return json({ error: "not found" }, 404, c);

  if (url.pathname === "/v1/health") {
    const { hb, fastAgeSec, stale } = await load(env, nowMs);
    return json({ ok: !stale, fastAgeSec, sources: hb?.sources ?? null }, 200, { ...c, "Cache-Control": "no-store" });
  }

  if (url.pathname === "/v1/state") {
    // Cached without CORS headers (they differ per Origin); they are added on the way out. KV is read only on a miss.
    const key = new Request(`${url.origin}/v1/state`);
    const withCors = (r: Response) => { const h = new Headers(r.headers); for (const [k, v] of Object.entries(c)) h.set(k, v); return new Response(r.body, { status: r.status, headers: h }); };
    const hit = await cache?.match(key);
    if (hit) return withCors(hit);

    const { state, hb, slow, fastAgeSec, stale } = await load(env, nowMs);
    if (!state) return json({ error: "no state yet" }, 503, { ...c, "Cache-Control": "no-store" });
    const global = stale ? { level: "STALE", reason: "fast lane heartbeat is older than 15 minutes", reasonDetail: { kind: "stale", lastHeartbeatMs: hb?.fastMs ?? null } } : state.global;
    const body = { ...state, global, fastMs: hb?.fastMs ?? state.fastMs, sources: hb?.sources ?? state.sources, fastAgeSec, slow };
    const res = json(body, 200, { "Cache-Control": `public, max-age=${STATE_TTL_SEC}` });
    await cache?.put(key, res.clone());
    return withCors(res);
  }
  return json({ error: "not found" }, 404, c);
}
