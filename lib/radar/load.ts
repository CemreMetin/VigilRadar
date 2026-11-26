import { buildState } from "@/core/build-state";
import { CONFIG } from "@/core/config";
import { parseEmsc, parseUsgs } from "@/core/quakes/normalize";
import type { QuakeEvent, State } from "@/core/types";

// VIGIL.md 8.5: the Worker first; when it is unreachable or stale USGS + EMSC straight from the browser; when that
// fails too the last good state from localStorage, marked stale.
export type DataSource = "worker" | "backup" | "stale";
export interface Loaded { state: State; source: DataSource; lastOkMs: number }

export interface Deps {
  workerUrl?: string;
  fetchJson: (url: string) => Promise<unknown>;
  now: () => number;
  storage: Pick<Storage, "getItem" | "setItem"> | null;
}

const CACHE_KEY = "vigil.lastState";
const FRESH_MS = CONFIG.stale.fastMinutes * 60_000;
const USGS_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson";
const emscUrl = (nowMs: number) => `https://www.seismicportal.eu/fdsnws/event/1/query?format=json&minmag=4&limit=200&orderby=time&start=${new Date(nowMs - 86_400_000).toISOString()}`;

const isState = (s: unknown): s is State => {
  const x = s as State | null;
  return !!x && x.v === 1 && Array.isArray(x.quakes) && typeof x.fastMs === "number" && !!x.global;
};

function save(d: Deps, loaded: Loaded): Loaded {
  try { d.storage?.setItem(CACHE_KEY, JSON.stringify(loaded)); } catch { /* storage full or blocked: the page works without it */ }
  return loaded;
}

/** The last good state. It keeps its source label while it is fresh and reads as stale after that. */
export function readCache(d: Deps): Loaded | null {
  try {
    const c = JSON.parse(d.storage?.getItem(CACHE_KEY) ?? "null") as Partial<Loaded> | null;
    if (c && isState(c.state) && typeof c.lastOkMs === "number") return { state: c.state, lastOkMs: c.lastOkMs, source: d.now() - c.lastOkMs <= FRESH_MS ? c.source ?? "stale" : "stale" };
  } catch { /* unreadable cache */ }
  return null;
}

async function fromBackup(d: Deps): Promise<Loaded | null> {
  const now = d.now();
  const [usgs, emsc] = await Promise.allSettled([d.fetchJson(USGS_URL).then(parseUsgs), d.fetchJson(emscUrl(now)).then(parseEmsc)]);
  const ok = { usgs: usgs.status === "fulfilled", emsc: emsc.status === "fulfilled", afad: false, kandilli: false };
  if (!ok.usgs && !ok.emsc) return null;
  const events: QuakeEvent[] = [...(usgs.status === "fulfilled" ? usgs.value : []), ...(emsc.status === "fulfilled" ? emsc.value : [])];
  const state = buildState({ prev: null, nowMs: now, events, ok, tsunami: null, tsunamiOk: null, slow: null, fastMs: now });
  return save(d, { state, source: "backup", lastOkMs: now });
}

export async function loadState(d: Deps): Promise<Loaded | null> {
  if (d.workerUrl) {
    try {
      const s = await d.fetchJson(`${d.workerUrl}/v1/state`);
      if (isState(s) && d.now() - s.fastMs <= FRESH_MS && s.global.level !== "STALE") return save(d, { state: s, source: "worker", lastOkMs: d.now() });
    } catch { /* fall through to the backup path */ }
  }
  try {
    const b = await fromBackup(d);
    if (b) return b;
  } catch { /* fall through to the cache */ }
  const c = readCache(d);
  return c && { ...c, source: "stale" };
}

export function browserDeps(): Deps {
  let storage: Storage | null = null;
  try { storage = window.localStorage; } catch { /* blocked */ }
  return {
    workerUrl: process.env.NEXT_PUBLIC_WORKER_URL,
    fetchJson: async (url) => {
      const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!r.ok) throw new Error(`${url} -> ${r.status}`);
      return r.json();
    },
    now: Date.now,
    storage,
  };
}
