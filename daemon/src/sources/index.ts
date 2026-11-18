import { parseAfad, parseEmsc, parseKandilli, parseUsgs } from "../../../core/quakes/normalize";
import { parseTsunami } from "../../../core/tsunami";
import type { QuakeEvent, QuakeSource, TsunamiBulletin } from "../../../core/types";

const TIMEOUT_MS = 8000;
const UA = "VigilRadar/1.0";

async function get(url: string): Promise<Response> {
  const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r;
}
const iso = (ms: number) => new Date(ms).toISOString();
const afadTime = (ms: number) => encodeURIComponent(iso(ms).slice(0, 19).replace("T", " "));

export interface QuakeSourceDef {
  id: QuakeSource;
  // false leaves the source out without touching the rest (VIGIL.md 0.5); the reason is in docs/DECISIONS.md
  enabled: boolean;
  fetch: (nowMs: number) => Promise<QuakeEvent[]>;
}

export const QUAKE_SOURCES: QuakeSourceDef[] = [
  { id: "usgs", enabled: true, fetch: async () => parseUsgs(await (await get("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson")).json()) },
  {
    id: "emsc", enabled: true,
    fetch: async (now) => parseEmsc(await (await get(`https://www.seismicportal.eu/fdsnws/event/1/query?format=json&minmag=4&limit=200&orderby=time&start=${iso(now - 86_400_000)}`)).json()),
  },
  {
    // Primary endpoint only: the backup POST answered 401 on 2026-11-18 (scripts/probe/fast-sources.mjs).
    id: "afad", enabled: true,
    fetch: async (now) => parseAfad(await (await get(`https://deprem.afad.gov.tr/apiv2/event/filter?start=${afadTime(now - 86_400_000)}&end=${afadTime(now)}&minmag=3.5&orderby=timedesc`)).json()),
  },
  {
    // The page is windows-1254. http first (it works), https as the fallback (it timed out on 2026-11-18).
    id: "kandilli", enabled: true,
    fetch: async () => {
      let res: Response;
      try { res = await get("http://www.koeri.boun.edu.tr/scripts/lst0.asp"); } catch { res = await get("https://www.koeri.boun.edu.tr/scripts/lst0.asp"); }
      return parseKandilli(new TextDecoder("windows-1254").decode(await res.arrayBuffer()));
    },
  },
];

export const TSUNAMI_FEEDS = ["https://www.tsunami.gov/events/xml/PAAQAtom.xml", "https://www.tsunami.gov/events/xml/PHEBAtom.xml"];

export async function fetchTsunami(): Promise<TsunamiBulletin[]> {
  const parts = await Promise.all(TSUNAMI_FEEDS.map(async (u) => parseTsunami(await (await get(u)).text())));
  return parts.flat();
}
