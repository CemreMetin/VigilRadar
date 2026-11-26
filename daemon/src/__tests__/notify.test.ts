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
  it("TR: title, meta line in Turkey time, P0 sentence, a link that opens the quake on the map, and the disclaimer last", () => {
    const m = compose(notice({ provinces: [{ code: "TR-44", sev: "P0" }] }), "tr", SITE);
    expect(m.title).toMatch(/^M6\.4 DEPREM — Malatya merkezine \d+ km$/);
    expect(m.body.split("\n")).toEqual(["15:00 TRT · derinlik 9 km · kaynak: AFAD", "İlinde yıkıcı olabilir.", "Ne yapmalı: https://site.test/?q=afad%3A1", "Bu bir erken uyarı değildir; sarsıntı sonrası bilgilendirmedir."]);
    expect(compose(notice(), "tr", SITE).body).toContain("Etkilenen iller: Malatya (P0), Elazığ (P1)");
  });
  it("EN mirrors the structure; update and cancel mark the title; global messages use UTC", () => {
    expect(compose(notice({ kind: "update" }), "en", SITE).title).toMatch(/^UPDATE · M6\.4 EARTHQUAKE — \d+ km from Malatya$/);
    const c = compose(notice({ kind: "cancel" }), "tr", SITE);
    expect(c.title).toMatch(/^İPTAL · /);
    expect(c.body).toContain("geri çekildi");
    expect(compose(notice({ scope: "GLOBAL", provinces: [] }), "en", SITE).body.split("\n")[0]).toBe("12:00 UTC · depth 9 km · source: AFAD");
    expect(compose(notice({ scope: "GLOBAL", kind: "tsunami", provinces: [] }), "en", SITE).body.split("\n")[0]).toBe("12:00 UTC");
  });
  it("lists at most 8 provinces and counts the rest", () => {
    const many = Array.from({ length: 11 }, (_, i) => ({ code: `TR-${String(i + 1).padStart(2, "0")}`, sev: "P1" as const }));
    expect(compose(notice({ provinces: many }), "tr", SITE).body).toContain("+3 il");
  });
  it("coastal advice follows the shared tsunami rule: strong and shallow (or the USGS flag) within 100 km of a coast", () => {
    const izmir = { lat: 38.42, lon: 27.14, provinces: [{ code: "TR-35", sev: "P0" as const }] };
    const body = (o: Partial<Notice>) => compose(notice({ ...izmir, ...o }), "tr", SITE).body;
    expect(body({ mag: 7, depthKm: 10 })).toContain("yüksek bir yere");
    expect(body({ mag: 6, depthKm: 10 })).not.toContain("yüksek bir yere");
    expect(body({ mag: 6, depthKm: 10, usgsTsunami: true })).toContain("yüksek bir yere");
    expect(body({ mag: 7, depthKm: 10, lat: 38.35, lon: 38.31 })).not.toContain("yüksek bir yere"); // epicentre far inland
  });
});

describe("removed Web Push endpoints", () => {
  it("answer 404", async () => {
    const env = { VIGIL: new MemKV() } as unknown as Env;
    for (const [method, path] of [["GET", "/v1/vapid"], ["POST", "/v1/push/subscribe"], ["POST", "/v1/push/unsubscribe"]] as const)
      expect((await handleRequest(new Request(`https://w.test${path}`, { method }), env, T0)).status).toBe(404);
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
  const q = (id = "afad:1") => {
    const best = { source: "afad" as const, sourceId: "1", timeMs: T0, lat: 38.35, lon: 38.31, depthKm: 9, mag: 6.4, place: "Malatya", updatedMs: T0 };
    return { id, sources: [best, { ...best, source: "emsc" as const }], best, firstSeenMs: T0 };
  };
  const state = (levels: Record<string, "P0" | "P1">) => ({ quakes: [q()], provinceLevels: { "afad:1": levels }, tsunami: [] }) as never;
  const base = { SITE_URL: SITE, TELEGRAM_BOT_TOKEN: "TOK", TELEGRAM_CHAT_TR: "@tr", TELEGRAM_CHAT_GLOBAL: "@gl" };

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
});
