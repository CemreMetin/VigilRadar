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

export async function handleRequest(request: Request, env: Env, nowMs: number, cache?: EdgeCache): Promise<Response> {
  const c = cors(request, env);
  const url = new URL(request.url);
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
