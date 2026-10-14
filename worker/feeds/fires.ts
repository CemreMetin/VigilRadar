import type { Counter, FiresFile } from "../../lib/types";
import { fetchOpen } from "../http";

/**
 * Active fire detections from NASA FIRMS (VIIRS, last 24 hours), thinned to a 0.5 degree grid so the file stays small.
 * Needs a free MAP_KEY (https://firms.modaps.eosdis.nasa.gov/api/map_key/) in the FIRMS_MAP_KEY secret; without it
 * the feed is simply not registered. A detection is a hot pixel seen by a satellite, not a confirmed wildfire.
 */

const CELL = 0.5;

/** Parse the FIRMS CSV into grid cells: [lat, lon, detections, strongest fire radiative power in MW]. */
export function gridFires(csv: string): FiresFile["cells"] {
  const lines = csv.trim().split("\n");
  const head = lines[0].split(",");
  const iLat = head.indexOf("latitude");
  const iLon = head.indexOf("longitude");
  const iConf = head.indexOf("confidence");
  const iFrp = head.indexOf("frp");
  if ([iLat, iLon, iFrp].some((i) => i < 0)) throw new Error("unexpected FIRMS columns");
  const cells = new Map<string, [number, number, number, number]>();
  for (const line of lines.slice(1)) {
    const c = line.split(",");
    // VIIRS confidence is l (low), n (nominal) or h (high); low-confidence pixels are mostly noise
    if (iConf >= 0 && c[iConf] === "l") continue;
    const lat = Number(c[iLat]);
    const lon = Number(c[iLon]);
    const frp = Number(c[iFrp]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const gl = Math.floor(lat / CELL) * CELL + CELL / 2;
    const go = Math.floor(lon / CELL) * CELL + CELL / 2;
    const key = `${gl},${go}`;
    const cur = cells.get(key) ?? [+gl.toFixed(2), +go.toFixed(2), 0, 0];
    cur[2] += 1;
    if (Number.isFinite(frp) && frp > cur[3]) cur[3] = +frp.toFixed(1);
    cells.set(key, cur);
  }
  return [...cells.values()];
}

export async function fireFeed(key: string): Promise<{ counters: Counter[]; file: FiresFile }> {
  const res = await fetchOpen(`https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/VIIRS_SNPP_NRT/world/1`, 120_000);
  const csv = await res.text();
  if (!csv.startsWith("latitude")) throw new Error("FIRMS did not return CSV (check the key)");
  const cells = gridFires(csv);
  const total = cells.reduce((s, c) => s + c[2], 0);
  const source = { name: "NASA FIRMS (VIIRS S-NPP, near real time)", url: "https://firms.modaps.eosdis.nasa.gov/", license: "Free; acknowledge NASA FIRMS" };
  const file: FiresFile = { generatedAt: new Date().toISOString(), windowHours: 24, total, cells, source };
  const counter: Counter = {
    id: "fires",
    label: "Active fire detections",
    domain: "climate",
    value: total.toLocaleString("en-US"),
    numeric: total,
    unit: "hot pixels, last 24 h",
    tone: "normal",
    basis: "No threshold: a count of satellite detections, so the status stays nominal",
    trendLabel: `${cells.length.toLocaleString("en-US")} grid cells of ${CELL} degrees`,
    note: "Thermal anomalies seen by the VIIRS instrument on Suomi NPP in the last 24 hours, low-confidence pixels removed and the rest summed on a 0.5 degree grid. A detection is a hot spot, not a confirmed wildfire: it includes agricultural burns and gas flares. Counts vary with cloud cover and overpass times.",
    asOf: file.generatedAt,
    cadence: "about every 3 hours",
    source,
  };
  return { counters: [counter], file };
}
