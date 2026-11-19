import { afterEach, describe, expect, it, vi } from "vitest";
import type { Env } from "../env";
import { handleRequest } from "../http";
import { runTurn } from "../index";
import { compose } from "../notify/message";
import type { Notice } from "../notify/policy";
import { MemKV } from "./memkv";

const T0 = Date.UTC(2026, 10, 18, 12);
const notice = (o: Partial<Notice> = {}): Notice => ({
  key: "afad:1:TR:new", eventId: "afad:1", scope: "TR", kind: "new", ms: T0, mag: 6.4, depthKm: 9, timeMs: T0, lat: 38.35, lon: 38.31,
  place: "Malatya", source: "afad", provinces: [{ code: "TR-44", sev: "P0" }, { code: "TR-23", sev: "P1" }], ...o,
});
const SITE = "https://site.test";
afterEach(() => vi.unstubAllGlobals());

describe("message templates (7.2)", () => {
  it("TR: title, meta line, P0 sentence, link, and the Telegram disclaimer last", () => {
    const m = compose(notice(), "tr", SITE, { province: "TR-44" });
    expect(m.title).toMatch(/^M6\.4 DEPREM — Malatya merkezine \d+ km$/);
    expect(m.body.split("\n")).toEqual(["15:00 · derinlik 9 km · kaynak: AFAD", "İlinde yıkıcı olabilir.", "Ne yapmalı: https://site.test/alert?e=afad%3A1"]);
    const tg = compose(notice(), "tr", SITE, { telegram: true });
    expect(tg.body.split("\n").at(-1)).toBe("Bu bir erken uyarı değildir; sarsıntı sonrası bilgilendirmedir.");
    expect(tg.body).toContain("Etkilenen iller: Malatya (P0), Elazığ (P1)");
  });
  it("EN mirrors the structure; update and cancel mark the title", () => {
    expect(compose(notice({ kind: "update" }), "en", SITE, { province: "TR-44" }).title).toMatch(/^UPDATE · M6\.4 EARTHQUAKE — \d+ km from Malatya$/);
    const c = compose(notice({ kind: "cancel" }), "tr", SITE, { province: "TR-44" });
    expect(c.title).toMatch(/^İPTAL · /);
    expect(c.body).toContain("geri çekildi");
  });
  it("lists at most 8 provinces and counts the rest", () => {
    const many = Array.from({ length: 11 }, (_, i) => ({ code: `TR-${String(i + 1).padStart(2, "0")}`, sev: "P1" as const }));
    expect(compose(notice({ provinces: many }), "tr", SITE, { telegram: true }).body).toContain("+3 il");
  });
  it("coastal advice only for a strong shallow quake near the coast", () => {
    const coast = [{ code: "TR-35", sev: "P0" as const }];
    expect(compose(notice({ mag: 7, depthKm: 10, provinces: coast }), "tr", SITE, { province: "TR-35" }).body).toContain("yüksek bir yere");
    expect(compose(notice({ mag: 6, depthKm: 10, provinces: coast }), "tr", SITE, { province: "TR-35" }).body).not.toContain("yüksek bir yere");
  });
});

// ---- 17. subscription validation ----
const VAPID_ENV = { VAPID_PUBLIC_KEY: "pub", VAPID_PRIVATE_KEY: "{}", VAPID_SUBJECT: "mailto:a@b.test" };
const post = (env: Env, path: string, body: unknown) => handleRequest(new Request(`https://w.test${path}`, { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) }), env, T0);
const good = { subscription: { endpoint: "https://fcm.googleapis.com/fcm/send/abc", keys: { p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u", auth: "tBHItJI5svbpez7KI4CCXg" } }, region: "TR-06", lang: "tr" };

describe("17. subscribe validation", () => {
  const env = () => ({ VIGIL: new MemKV(), ...VAPID_ENV }) as unknown as Env;
  it("accepts a valid subscription and stores it; unsubscribe removes it", async () => {
    const e = env();
    expect((await post(e, "/v1/push/subscribe", good)).status).toBe(200);
    const kv = e.VIGIL as unknown as MemKV;
    expect([...kv.data.keys()].filter((k) => k.startsWith("sub:TR-06:"))).toHaveLength(1);
    expect((await post(e, "/v1/push/subscribe", { ...good, region: "GLOBAL" })).status).toBe(200); // region change moves it
    expect([...kv.data.keys()].filter((k) => k.startsWith("sub:"))).toHaveLength(1);
    expect((await post(e, "/v1/push/unsubscribe", { endpoint: good.subscription.endpoint })).status).toBe(200);
    expect([...kv.data.keys()].filter((k) => k.startsWith("sub:") || k.startsWith("ep:"))).toHaveLength(0);
  });
  it("http, an unknown host, a bad province and a bad body answer 400 and store nothing", async () => {
    const e = env();
    const bad = [
      { ...good, subscription: { ...good.subscription, endpoint: "http://fcm.googleapis.com/x" } },
      { ...good, subscription: { ...good.subscription, endpoint: "https://evil.example/fcm.googleapis.com" } },
      { ...good, subscription: { ...good.subscription, endpoint: "https://notfcm.googleapis.com.evil.test/x" } },
      { ...good, region: "TR-99" },
      { ...good, region: "tr-06" },
      { ...good, lang: "de" },
      { ...good, subscription: { ...good.subscription, keys: { p256dh: "x y", auth: "z" } } },
      "not json",
      { ...good, pad: "x".repeat(3000) },
    ];
    for (const b of bad) expect((await post(e, "/v1/push/subscribe", b)).status).toBe(400);
    expect((e.VIGIL as unknown as MemKV).data.size).toBe(0);
  });
  it("without VAPID keys the endpoints are closed (404) and /v1/vapid answers the public key when set", async () => {
    const off = { VIGIL: new MemKV() } as unknown as Env;
    expect((await post(off, "/v1/push/subscribe", good)).status).toBe(404);
    expect((await handleRequest(new Request("https://w.test/v1/vapid"), off, T0)).status).toBe(404);
    const r = await handleRequest(new Request("https://w.test/v1/vapid"), env(), T0);
    expect(await r.json()).toEqual({ publicKey: "pub" });
  });
  it("CORS preflight allows POST and Content-Type for an allowed origin", async () => {
    const e = { ...env(), ALLOWED_ORIGINS: "https://site.test" } as Env;
    const r = await handleRequest(new Request("https://w.test/v1/push/subscribe", { method: "OPTIONS", headers: { Origin: "https://site.test" } }), e, T0);
    expect(r.headers.get("Access-Control-Allow-Methods")).toContain("POST");
    expect(r.headers.get("Access-Control-Allow-Headers")).toContain("Content-Type");
  });
});

// ---- dispatcher ----
describe("dispatcher", () => {
  it("channels without secrets stay closed: no notif document, no outgoing call, no error", async () => {
    const kv = new MemKV();
    const calls: string[] = [];
    vi.stubGlobal("fetch", async (u: string) => { calls.push(u); return new Response("{}", { status: 200 }); });
    await runTurn({ VIGIL: kv } as unknown as Env, T0);
    expect(kv.data.has("notif")).toBe(false);
    expect(calls.some((u) => u.includes("telegram"))).toBe(false);
  });
});

describe("dispatcher delivery", () => {
  const b64 = (u: Uint8Array) => Buffer.from(u).toString("base64url");
  async function keys() {
    const v = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign"]);
    const jwk = await crypto.subtle.exportKey("jwk", v.privateKey);
    const k = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
    const p256dh = b64(new Uint8Array(await crypto.subtle.exportKey("raw", k.publicKey)));
    return { jwk: JSON.stringify(jwk), p256dh, auth: b64(crypto.getRandomValues(new Uint8Array(16))) };
  }
  const q = (id = "afad:1") => {
    const best = { source: "afad" as const, sourceId: "1", timeMs: T0, lat: 38.35, lon: 38.31, depthKm: 9, mag: 6.4, place: "Malatya", updatedMs: T0 };
    return { id, sources: [best, { ...best, source: "emsc" as const }], best, firstSeenMs: T0 };
  };
  const state = (levels: Record<string, "P0" | "P1">) => ({ quakes: [q()], provinceLevels: { "afad:1": levels }, tsunami: [] }) as never;
  const base = { SITE_URL: SITE, VAPID_SUBJECT: "mailto:a@b.test", TELEGRAM_BOT_TOKEN: "TOK", TELEGRAM_CHAT_TR: "@tr", TELEGRAM_CHAT_GLOBAL: "@gl" };

  it("Telegram: one message per event to the TR channel, none again, a failed send is retried once then dropped", async () => {
    const { dispatch } = await import("../notify/dispatch");
    const { Store } = await import("../store");
    const kv = new MemKV();
    const sent: { chat: string; text: string }[] = [];
    let fail = false;
    vi.stubGlobal("fetch", async (_u: string, init: { body: string }) => { const b = JSON.parse(init.body); if (fail) return new Response("{}", { status: 500 }); sent.push({ chat: b.chat_id, text: b.text }); return new Response("{}", { status: 200 }); });
    const env = { VIGIL: kv, ...base } as unknown as Env;
    await dispatch(env, new Store(kv), state({ "TR-44": "P0", "TR-23": "P1" }), T0 + 60_000);
    expect(sent).toHaveLength(1);
    expect(sent[0].chat).toBe("@tr");
    expect(sent[0].text).toContain("Etkilenen iller: Malatya (P0), Elazığ (P1)");
    await dispatch(env, new Store(kv), state({ "TR-44": "P0", "TR-23": "P1" }), T0 + 120_000);
    expect(sent).toHaveLength(1);

    fail = true;
    const kv2 = new MemKV(); sent.length = 0;
    const env2 = { VIGIL: kv2, ...base } as unknown as Env;
    let calls = 0;
    vi.stubGlobal("fetch", async () => { calls++; return new Response("{}", { status: 500 }); });
    await dispatch(env2, new Store(kv2), state({ "TR-44": "P0" }), T0 + 60_000);
    await dispatch(env2, new Store(kv2), state({ "TR-44": "P0" }), T0 + 120_000);
    await dispatch(env2, new Store(kv2), state({ "TR-44": "P0" }), T0 + 180_000);
    expect(calls).toBe(2);
  });

  it("Web Push: encrypted request with VAPID, 20 subscribers per turn with a cursor, a 410 removes the subscription", async () => {
    const { dispatch } = await import("../notify/dispatch");
    const { Store } = await import("../store");
    const { jwk, p256dh, auth } = await keys();
    const kv = new MemKV();
    for (let i = 0; i < 25; i++) {
      const name = String(i).padStart(2, "0");
      kv.data.set(`sub:TR-44:${name}`, { value: JSON.stringify({ endpoint: `https://fcm.googleapis.com/fcm/send/${name}`, keys: { p256dh, auth }, region: "TR-44", lang: i % 2 ? "en" : "tr" }), metadata: undefined });
      kv.data.set(`ep:${name}`, { value: "TR-44", metadata: undefined });
    }
    const seen: { url: string; headers: Headers; len: number }[] = [];
    vi.stubGlobal("fetch", async (u: string, init: { headers: Headers; body: ArrayBuffer }) => {
      seen.push({ url: u, headers: new Headers(init.headers), len: init.body.byteLength });
      return new Response(null, { status: u.endsWith("/03") ? 410 : 201 });
    });
    const env = { VIGIL: kv, ...base, TELEGRAM_BOT_TOKEN: undefined, VAPID_PUBLIC_KEY: "pub", VAPID_PRIVATE_KEY: jwk } as unknown as Env;
    await dispatch(env, new Store(kv), state({ "TR-44": "P0" }), T0 + 60_000);
    expect(seen).toHaveLength(20);
    const h = seen[0].headers;
    expect(h.get("Content-Encoding")).toBe("aes128gcm");
    expect(h.get("TTL")).toBe("3600");
    expect(h.get("Urgency")).toBe("high");
    expect(h.get("Authorization")).toMatch(/^vapid t=[\w-]+\.[\w-]+\.[\w-]+, k=pub$/);
    expect(seen[0].len).toBeGreaterThan(100);
    expect(kv.data.has("sub:TR-44:03")).toBe(false); // 410: removed
    expect(kv.data.has("ep:03")).toBe(false);
    await dispatch(env, new Store(kv), state({ "TR-44": "P0" }), T0 + 120_000);
    expect(seen).toHaveLength(25); // the 5 left over, no repeats
    await dispatch(env, new Store(kv), state({ "TR-44": "P0" }), T0 + 180_000);
    expect(seen).toHaveLength(25);
  });
});
