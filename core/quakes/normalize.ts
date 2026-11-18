import { CONFIG } from "../config";
import type { PagerAlert, QuakeEvent } from "../types";

export function inTrBox(p: { lat: number; lon: number }): boolean {
  const b = CONFIG.quake.trBox;
  return p.lat >= b.minLat && p.lat <= b.maxLat && p.lon >= b.minLon && p.lon <= b.maxLon;
}

// Time zones measured by scripts/probe/timezone.mjs on 2026-11-18 against EMSC (UTC): AFAD sends UTC without a zone
// marker (median difference 0.000 h), Kandilli sends UTC+3 local time (median 3.000 h). See docs/DECISIONS.md.
export const AFAD_UTC_OFFSET_H = 0;
export const KANDILLI_UTC_OFFSET_H = 3;
const H = 3_600_000;

const num = (v: unknown): number => (v === null || v === undefined || v === "" ? NaN : Number(v));
type Obj = Record<string, unknown>;
const str = (v: unknown): string => (typeof v === "string" ? v : "");

/** Keeps only well-formed records; a parser must never throw on a bad answer. */
const valid = (e: QuakeEvent) => [e.timeMs, e.lat, e.lon, e.depthKm, e.mag, e.updatedMs].every(Number.isFinite) && !!e.sourceId;

function safe(fn: () => QuakeEvent[]): QuakeEvent[] {
  try { return fn().filter(valid); } catch { return []; }
}

/** USGS summary GeoJSON. */
export function parseUsgs(json: unknown): QuakeEvent[] {
  return safe(() =>
    (json as { features: Obj[] }).features.map((f) => {
      const p = f.properties as Obj;
      const [lon, lat, depth] = (f.geometry as { coordinates: number[] }).coordinates;
      const alert = ["green", "yellow", "orange", "red"].includes(str(p.alert)) ? (p.alert as PagerAlert) : undefined;
      return {
        source: "usgs", sourceId: String(f.id), timeMs: num(p.time), lat: num(lat), lon: num(lon), depthKm: num(depth), mag: num(p.mag),
        magType: str(p.magType) || undefined, place: str(p.place), pagerAlert: alert, usgsTsunami: p.tsunami === 1 || undefined,
        updatedMs: num(p.updated ?? p.time),
      } as QuakeEvent;
    }),
  );
}

/** EMSC FDSN event service, format=json. */
export function parseEmsc(json: unknown): QuakeEvent[] {
  return safe(() =>
    (json as { features: Obj[] }).features.map((f) => {
      const p = f.properties as Obj;
      return {
        source: "emsc", sourceId: String(p.unid ?? f.id), timeMs: Date.parse(str(p.time)), lat: num(p.lat), lon: num(p.lon), depthKm: Math.abs(num(p.depth)),
        mag: num(p.mag), magType: str(p.magtype) || undefined, place: str(p.flynn_region), updatedMs: Date.parse(str(p.lastupdate ?? p.time)),
      } as QuakeEvent;
    }),
  );
}

/** AFAD apiv2/event/filter: an array with string fields, `date` is UTC without a zone marker. */
export function parseAfad(json: unknown): QuakeEvent[] {
  return safe(() =>
    (json as Obj[]).map((e) => {
      const timeMs = Date.parse(`${str(e.date)}Z`) - AFAD_UTC_OFFSET_H * H;
      return {
        source: "afad", sourceId: String(e.eventID), timeMs, lat: num(e.latitude), lon: num(e.longitude), depthKm: num(e.depth), mag: num(e.magnitude),
        magType: str(e.type) || undefined, place: str(e.location),
        updatedMs: e.lastUpdateDate ? Date.parse(`${str(e.lastUpdateDate)}Z`) - AFAD_UTC_OFFSET_H * H : timeMs,
      } as QuakeEvent;
    }),
  );
}

const KANDILLI_ROW = /^(\d{4})\.(\d\d)\.(\d\d) (\d\d):(\d\d):(\d\d)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(.*)$/;

/** Kandilli lst0.asp, already decoded from windows-1254. Magnitude: Mw, else ML, else MD. Rows without one are skipped. */
export function parseKandilli(text: string): QuakeEvent[] {
  return safe(() =>
    text.split("\n").flatMap((line) => {
      const m = line.trim().match(KANDILLI_ROW);
      if (!m) return [];
      const [, y, mo, d, h, mi, s, lat, lon, depth, md, ml, mw, rest] = m;
      const mag = [mw, ml, md].map((v) => (v === "-.-" ? NaN : Number(v))).find(Number.isFinite);
      if (mag === undefined) return [];
      const timeMs = Date.UTC(+y, +mo - 1, +d, +h, +mi, +s) - KANDILLI_UTC_OFFSET_H * H;
      return [{
        source: "kandilli", sourceId: `${y}${mo}${d}${h}${mi}${s}`, timeMs, lat: +lat, lon: +lon, depthKm: +depth, mag,
        magType: Number.isFinite(Number(mw)) ? "Mw" : Number.isFinite(Number(ml)) ? "ML" : "MD",
        place: rest.split(/\s{2,}/)[0].trim(), updatedMs: timeMs,
      } as QuakeEvent];
    }),
  );
}

/** Acceptance rule: M4.0 inside the Turkey box, M5.0 elsewhere; malformed records are refused. */
export function accept(e: QuakeEvent): boolean {
  if (![e.timeMs, e.lat, e.lon, e.depthKm, e.mag].every(Number.isFinite)) return false;
  return e.mag >= (inTrBox(e) ? CONFIG.quake.trMinMag : CONFIG.quake.globalMinMag);
}
