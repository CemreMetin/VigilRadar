import type { QuakeSource, State } from "../../core/types";
import type { Env } from "./env";
import { handleRequest } from "./http";
import { QUAKE_SOURCES, fetchTsunami } from "./sources";
import { EMPTY_SLOW, buildState, stableOf, type Slow } from "./state";
import { Store, hashOf } from "./store";

interface Hb { fastMs: number; sources: State["sources"] }
const HB_EVERY_MIN = 5;

/** One cron turn (VIGIL.md 6.1): fetch, merge, links, status, then write only what changed. */
export async function runTurn(env: Env, nowMs: number): Promise<void> {
  const store = new Store(env.VIGIL);
  const minute = new Date(nowMs).getUTCMinutes();
  const withTsunami = minute % 5 === 0;

  const [{ value: prev, hash: prevHash }, hb, slow] = await Promise.all([store.getWithHash<State>("state"), store.getJson<Hb>("hb"), store.getJson<Slow>("slow")]);

  const live = QUAKE_SOURCES.filter((s) => s.enabled);
  const [quakeRes, tsunamiRes] = await Promise.all([
    Promise.allSettled(live.map((s) => s.fetch(nowMs))),
    withTsunami ? Promise.allSettled([fetchTsunami()]) : Promise.resolve(null),
  ]);
  const ok = { usgs: false, emsc: false, afad: false, kandilli: false } as Record<QuakeSource, boolean>;
  const events = live.flatMap((s, n) => {
    const r = quakeRes[n];
    ok[s.id] = r.status === "fulfilled";
    return r.status === "fulfilled" ? r.value : [];
  });
  const tsunami = tsunamiRes && tsunamiRes[0].status === "fulfilled" ? tsunamiRes[0].value : null;
  const tsunamiOk = tsunamiRes ? tsunamiRes[0].status === "fulfilled" : null;

  // The fast lane counts as alive only when at least one quake source answered.
  const alive = Object.values(ok).some(Boolean);
  const fastMs = alive ? nowMs : hb?.fastMs ?? prev?.fastMs ?? 0;
  const state = buildState({ prev, nowMs, events, ok, tsunami, tsunamiOk, slow: slow ?? EMPTY_SLOW, fastMs });

  const hash = hashOf(stableOf(state));
  if (hash !== prevHash) await store.put("state", state, { hash });
  if (alive && (minute % HB_EVERY_MIN === 0 || !hb)) await store.put("hb", { fastMs, sources: state.sources } satisfies Hb);
}

const worker = {
  fetch: (request: Request, env: Env) => handleRequest(request, env, Date.now()),
  scheduled: (_event: unknown, env: Env, ctx: { waitUntil(p: Promise<unknown>): void }) => ctx.waitUntil(runTurn(env, Date.now())),
};
export default worker;
