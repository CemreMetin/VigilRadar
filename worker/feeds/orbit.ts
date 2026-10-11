import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { eciToGeodetic, degreesLat, degreesLong, gstime, json2satrec, propagate } from "satellite.js";
import type { Counter, OrbitFile } from "../../lib/types";
import { fetchOpen } from "../http";

/**
 * Where catalogued objects are right now, computed from published orbital elements (CelesTrak GP data,
 * SGP4 propagation). This is a position fix for the moment of the snapshot, not a prediction.
 * CelesTrak asks for at most one download per group every 2 hours, so the elements are cached.
 */

const BASE = "https://celestrak.org/NORAD/elements/gp.php";
const CACHE_DIR = path.join(process.cwd(), ".cache", "celestrak");
const CACHE_TTL_MS = 2 * 3_600_000;

const GROUPS = [
  { group: "active", kind: 0 }, // 0 = satellite, 1 = Starlink (split out below), 2 = debris, 3 = station
  { group: "cosmos-2251-debris", kind: 2 },
  { group: "iridium-33-debris", kind: 2 },
  { group: "fengyun-1c-debris", kind: 2 },
  { group: "cosmos-1408-debris", kind: 2 },
] as const;

type Omm = { OBJECT_NAME: string; NORAD_CAT_ID: number; EPOCH: string };

async function elements(group: string): Promise<Omm[]> {
  const file = path.join(CACHE_DIR, `${group}.json`);
  try {
    if (Date.now() - (await stat(file)).mtimeMs < CACHE_TTL_MS) return JSON.parse(await readFile(file, "utf8")) as Omm[];
  } catch {
    // no cache yet
  }
  const res = await fetchOpen(`${BASE}?GROUP=${group}&FORMAT=json`, 90_000);
  const text = await res.text();
  const rows = JSON.parse(text) as Omm[];
  if (!Array.isArray(rows) || rows.length === 0) throw new Error(`CelesTrak ${group}: empty`);
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(file, text);
  return rows;
}

export async function orbitFeed(): Promise<{ counters: Counter[]; file: OrbitFile }> {
  const now = new Date();
  const gmst = gstime(now);
  const objects: ([number, number, number, number] | [number, number, number, number, string])[] = [];
  const stations: [string, number, number, number][] = [];
  const counts = { satellites: 0, starlink: 0, debris: 0 };
  let newestEpoch = 0;
  const seen = new Set<number>();

  for (const g of GROUPS) {
    const rows = await elements(g.group);
    for (const omm of rows) {
      if (seen.has(omm.NORAD_CAT_ID)) continue;
      seen.add(omm.NORAD_CAT_ID);
      let pos;
      try {
        pos = propagate(json2satrec(omm as never), now);
      } catch {
        continue;
      }
      if (!pos || typeof pos.position === "boolean" || !pos.position) continue;
      const geo = eciToGeodetic(pos.position, gmst);
      const lon = degreesLong(geo.longitude);
      const lat = degreesLat(geo.latitude);
      if (!Number.isFinite(lon) || !Number.isFinite(lat) || !Number.isFinite(geo.height)) continue;
      const epoch = new Date(omm.EPOCH + "Z").getTime();
      if (epoch > newestEpoch) newestEpoch = epoch;

      const station = /^(ISS \(ZARYA\)|CSS \(TIANHE\)|CSS \(WENTIAN\)|CSS \(MENGTIAN\))/.test(omm.OBJECT_NAME);
      const kind = station ? 3 : g.kind === 0 && omm.OBJECT_NAME.startsWith("STARLINK") ? 1 : g.kind;
      if (station) stations.push([omm.OBJECT_NAME, +lon.toFixed(2), +lat.toFixed(2), Math.round(geo.height)]);
      if (kind === 2) counts.debris++;
      else if (kind === 1) counts.starlink++;
      else counts.satellites++;
      const row: [number, number, number, number] = [+lon.toFixed(1), +lat.toFixed(1), Math.round(geo.height), kind];
      objects.push(station ? [...row, omm.OBJECT_NAME] : row);
    }
  }
  if (objects.length < 1000) throw new Error(`only ${objects.length} objects propagated`);

  const source = {
    name: "CelesTrak GP data (US Space Force 18th Space Defense Squadron catalogue), SGP4 propagation",
    url: "https://celestrak.org/",
    license: "Free to use; CelesTrak asks for attribution and at most one download per group every 2 hours",
  };
  const file: OrbitFile = {
    generatedAt: now.toISOString(),
    kinds: ["satellite", "Starlink", "debris", "station"],
    fields: ["lon", "lat", "altKm", "kind"],
    counts,
    stations,
    objects,
    source,
  };
  const total = counts.satellites + counts.starlink;
  const counter: Counter = {
    id: "satellites",
    label: "Active satellites",
    domain: "space",
    value: total.toLocaleString("en-US"),
    numeric: total,
    unit: `in orbit, plus ${counts.debris.toLocaleString("en-US")} tracked debris`,
    tone: "normal",
    basis: "No threshold: a catalogue count, so the status stays nominal",
    trendLabel: `${counts.starlink.toLocaleString("en-US")} of them are Starlink`,
    note: "Objects in the public catalogue with current orbital elements, positioned by SGP4 at the time of the snapshot. Satellites move about 7 km/s, so the map shows where they were at the snapshot time, not where they are now. Debris counts cover only four major breakup events (Cosmos 2251, Iridium 33, Fengyun-1C, Cosmos 1408), not all debris. Many objects are too small to track.",
    asOf: new Date(newestEpoch || now.getTime()).toISOString(),
    cadence: "elements about every 2 hours",
    source,
    rows: [
      { label: "Other satellites", value: counts.satellites.toLocaleString("en-US") },
      { label: "Starlink", value: counts.starlink.toLocaleString("en-US") },
      { label: "Tracked debris (4 breakups)", value: counts.debris.toLocaleString("en-US") },
    ],
  };
  return { counters: [counter], file };
}
