import { PROVINCES } from "../../core/build-state";
import type { Env } from "./env";

// Push subscription endpoints (VIGIL.md 6.3). Stored: the endpoint, its keys, the region and the language, nothing else:
// no IP address, no request headers, and nothing is logged.

export const PUSH_HOSTS = ["fcm.googleapis.com", "push.services.mozilla.com", "push.apple.com", "notify.windows.com"];
const MAX_BODY = 2048;
const B64URL = /^[A-Za-z0-9_-]{8,200}$/;
const REGIONS = new Set<string>([...PROVINCES.map((p) => p.code), "GLOBAL"]);

export interface StoredSub { endpoint: string; keys: { p256dh: string; auth: string }; region: string; lang: "tr" | "en" }

export const subKey = (region: string, hash: string) => `sub:${region}:${hash}`;
const epKey = (hash: string) => `ep:${hash}`;

/** SHA-256 of the endpoint, first 16 bytes as hex: a stable key that does not expose the endpoint URL. */
async function endpointHash(endpoint: string): Promise<string> {
  const d = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(endpoint)));
  return [...d.slice(0, 16)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function allowedEndpoint(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length > 600) return null;
  let u: URL;
  try { u = new URL(raw); } catch { return null; }
  if (u.protocol !== "https:" || u.username || u.password) return null;
  return PUSH_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`)) ? u.href : null;
}

async function readBody(request: Request): Promise<unknown | null> {
  if (Number(request.headers.get("Content-Length") ?? 0) > MAX_BODY) return null;
  const text = await request.text();
  if (text.length > MAX_BODY) return null;
  try { return JSON.parse(text); } catch { return null; }
}

const reply = (body: unknown, status: number, headers: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers } });

export function vapid(env: Env, headers: Record<string, string>): Response {
  return env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY ? reply({ publicKey: env.VAPID_PUBLIC_KEY }, 200, headers) : reply({ error: "not found" }, 404, headers);
}

export async function subscribe(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return reply({ error: "not found" }, 404, headers);
  const b = (await readBody(request)) as { subscription?: { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } }; region?: unknown; lang?: unknown } | null;
  const endpoint = allowedEndpoint(b?.subscription?.endpoint);
  const { p256dh, auth } = b?.subscription?.keys ?? {};
  if (!b || !endpoint || typeof p256dh !== "string" || typeof auth !== "string" || !B64URL.test(p256dh) || !B64URL.test(auth)) return reply({ error: "bad subscription" }, 400, headers);
  if (typeof b.region !== "string" || !REGIONS.has(b.region) || (b.lang !== "tr" && b.lang !== "en")) return reply({ error: "bad region or lang" }, 400, headers);

  const hash = await endpointHash(endpoint);
  const old = await env.VIGIL.get(epKey(hash));
  if (old && old !== b.region) await env.VIGIL.delete(subKey(old, hash)); // the region changed
  const sub: StoredSub = { endpoint, keys: { p256dh, auth }, region: b.region, lang: b.lang };
  await env.VIGIL.put(subKey(b.region, hash), JSON.stringify(sub));
  if (old !== b.region) await env.VIGIL.put(epKey(hash), b.region);
  return reply({ ok: true }, 200, headers);
}

export async function unsubscribe(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const b = (await readBody(request)) as { endpoint?: unknown } | null;
  const endpoint = allowedEndpoint(b?.endpoint);
  if (!endpoint) return reply({ error: "bad endpoint" }, 400, headers);
  const hash = await endpointHash(endpoint);
  const region = await env.VIGIL.get(epKey(hash));
  if (region) { await env.VIGIL.delete(subKey(region, hash)); await env.VIGIL.delete(epKey(hash)); }
  return reply({ ok: true }, 200, headers);
}
