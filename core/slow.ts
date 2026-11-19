import { CONFIG } from "./config";
import { flowDeviation } from "./chokepoints";
import type { ChokepointFlow, DailyCount, GdeltRow } from "./types";

// Pure parts of the slow lane (VIGIL.md 4.2): GDELT file names and rows, PortWatch chokepoint matching.
// Network and zip handling live in scripts/data/slow.mjs.

const STEP_MS = 15 * 60_000;
export const GDELT_BASE = "https://data.gdeltproject.org/gdeltv2/"; // the http:// address answers 301 to this one

const stampToMs = (s: string) => Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8), +s.slice(8, 10), +s.slice(10, 12), +s.slice(12, 14));
const pad = (n: number) => String(n).padStart(2, "0");
const msToStamp = (ms: number) => { const d = new Date(ms); return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`; };

/** The export file stamp from the first line of lastupdate.txt, or null when the line is not an export file. */
export function latestGdeltStamp(lastupdate: string): string | null {
  return /(\d{14})\.export\.CSV\.zip/.exec(lastupdate.split(/\r?\n/)[0] ?? "")?.[1] ?? null;
}

/** The export files of the last 24 hours, newest first: 96 files in 15 minute steps. */
export function gdeltUrls(latestStamp: string, count = 96): string[] {
  const end = stampToMs(latestStamp);
  return Array.from({ length: count }, (_, i) => `${GDELT_BASE}${msToStamp(end - i * STEP_MS)}.export.CSV.zip`);
}

/** Column positions of GDELT 2.0 Events used here (0-based). */
const COL = { id: 0, base: 27, root: 28, sources: 32, geoType: 51, name: 52, lat: 56, lon: 57, added: 59, url: 60 } as const;
const COLUMNS = 61;

/** Throws when a row does not look like GDELT 2.0 Events, so a changed format stops the run instead of feeding bad rows. */
export function checkGdeltRow(cols: readonly string[]): void {
  const lat = Number(cols[COL.lat]), lon = Number(cols[COL.lon]);
  const ok = cols.length === COLUMNS && /^\d{2}$/.test(cols[COL.root]) && Number.isFinite(lat) && Math.abs(lat) <= 90 && Number.isFinite(lon) && Math.abs(lon) <= 180 && /^\d{14}$/.test(cols[COL.added]);
  if (!ok) throw new Error(`GDELT layout changed: ${cols.length} columns, root=${cols[COL.root]}, lat=${cols[COL.lat]}, lon=${cols[COL.lon]}`);
}

/** Rows that can matter for conflict clusters: the event codes and city-level places of CONFIG.conflict. Other rows are dropped early. */
export function parseGdeltTsv(text: string, check = false): GdeltRow[] {
  const C = CONFIG.conflict;
  const out: GdeltRow[] = [];
  let checked = !check;
  for (const line of text.split("\n")) {
    if (!line) continue;
    const c = line.split("\t");
    if (!checked) { checkGdeltRow(c); checked = true; }
    if (c.length !== COLUMNS) continue;
    const geoType = Number(c[COL.geoType]);
    const lat = Number(c[COL.lat]), lon = Number(c[COL.lon]);
    if (!(C.rootCodes as readonly string[]).includes(c[COL.root]) && !(C.extraBaseCodes as readonly string[]).includes(c[COL.base])) continue;
    if (!(C.geoTypes as readonly number[]).includes(geoType) || !c[COL.lat] || !c[COL.lon] || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    out.push({ id: c[COL.id], rootCode: c[COL.root], baseCode: c[COL.base], geoType, lat, lon, fullName: c[COL.name], sourceUrl: c[COL.url], numSources: Number(c[COL.sources]) || 0, dateAddedMs: stampToMs(c[COL.added]) });
  }
  return out;
}

// ---- PortWatch ----

export const CHOKEPOINT_KEYS = ["hormuz", "suez", "mandeb", "malacca", "panama", "bosporus"] as const;
export interface PwSite { key: string; id: string; name: string; lat: number; lon: number }
interface PwFeature { attributes: { portid?: string; portname?: string; fullname?: string; lat?: number; lon?: number } }

/** Resolves the six chokepoints by name ("contains", case-insensitive); the portid is never hard coded. Missing ones are left out. */
export function resolveChokepoints(features: readonly PwFeature[]): PwSite[] {
  const out: PwSite[] = [];
  for (const key of CHOKEPOINT_KEYS) {
    const f = features.find((x) => `${x.attributes.portname ?? ""} ${x.attributes.fullname ?? ""}`.toLowerCase().includes(key));
    const a = f?.attributes;
    if (a?.portid && Number.isFinite(a.lat) && Number.isFinite(a.lon)) out.push({ key, id: a.portid, name: a.portname ?? a.fullname ?? key, lat: a.lat as number, lon: a.lon as number });
  }
  return out;
}

/** Daily PortWatch rows ({date, n_total}) as DailyCount, dropping rows without a usable count. */
export function toDaily(features: readonly { attributes: { date?: string; n_total?: number | null } }[]): DailyCount[] {
  return features.flatMap(({ attributes: a }) => (typeof a.date === "string" && typeof a.n_total === "number" ? [{ date: a.date, count: a.n_total }] : []));
}

export function chokepointFlow(site: PwSite, daily: readonly DailyCount[], nowMs: number): ChokepointFlow {
  const f = flowDeviation(daily, nowMs);
  const series = [...daily].sort((a, b) => (a.date < b.date ? -1 : 1)).slice(-30).map((d) => d.count);
  return { id: site.id, name: site.name, lat: site.lat, lon: site.lon, recent: f.recent, baseline: f.baseline, dev: f.dev, level: f.state, dataThrough: f.lastDate, available: daily.length > 0, series };
}

export const unavailableChokepoint = (key: string): ChokepointFlow => ({ id: key, name: key, lat: 0, lon: 0, recent: null, baseline: null, dev: null, level: "stale", dataThrough: null, available: false });
