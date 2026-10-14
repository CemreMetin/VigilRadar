// Deep imports on purpose: the package index also pulls in its WebAssembly runtimes, which make the Next
// production build hang. These three files are the plain-JS SGP4 core the pass finder needs.
import { json2satrec } from "../node_modules/satellite.js/dist/io.js";
import { gstime, propagate } from "../node_modules/satellite.js/dist/propagation.js";
import { degreesToRadians, ecfToLookAngles, eciToEcf, radiansToDegrees } from "../node_modules/satellite.js/dist/transforms.js";

/**
 * When does a satellite rise above the horizon of a place? Geometry only: SGP4 positions from published orbital
 * elements, stepped through time. It says nothing about whether the object is lit by the Sun or whether the sky
 * is dark enough to see it. Runs in the browser, so the observer's position never leaves the device.
 */

export type Pass = { rise: number; peak: number; set: number; maxElevationDeg: number };

const STEP_MS = 30_000;

/** Passes above `minElevationDeg` within `hours` of `from`. `omm` is one CelesTrak GP (OMM JSON) record. */
export function nextPasses(omm: Record<string, unknown>, latDeg: number, lonDeg: number, from: number, hours = 48, minElevationDeg = 10): Pass[] {
  const satrec = json2satrec(omm as never);
  const observer = { latitude: degreesToRadians(latDeg), longitude: degreesToRadians(lonDeg), height: 0 };
  const out: Pass[] = [];
  let cur: Pass | null = null;
  for (let t = from; t <= from + hours * 3_600_000; t += STEP_MS) {
    const date = new Date(t);
    const pv = propagate(satrec, date);
    if (!pv || typeof pv.position === "boolean" || !pv.position) continue;
    const look = ecfToLookAngles(observer, eciToEcf(pv.position, gstime(date)));
    const el = radiansToDegrees(look.elevation);
    if (el > 0) {
      if (!cur) cur = { rise: t, peak: t, set: t, maxElevationDeg: el };
      cur.set = t;
      if (el > cur.maxElevationDeg) {
        cur.maxElevationDeg = el;
        cur.peak = t;
      }
    } else if (cur) {
      if (cur.maxElevationDeg >= minElevationDeg) out.push(cur);
      cur = null;
    }
  }
  if (cur && cur.maxElevationDeg >= minElevationDeg) out.push(cur);
  return out;
}
