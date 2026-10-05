// Centred-dipole approximation of geomagnetic latitude (north geomagnetic pole at 80.7 N, 72.7 W).
// A rough proxy only; see scripts/build-solar-data.py and the solar scenario page for the caveats.
const POLE_LAT = 80.7;
const POLE_LON = -72.7;
const rad = Math.PI / 180;

export function geomagLat(lat: number, lon: number): number {
  const s =
    Math.sin(lat * rad) * Math.sin(POLE_LAT * rad) +
    Math.cos(lat * rad) * Math.cos(POLE_LAT * rad) * Math.cos((lon - POLE_LON) * rad);
  return Math.asin(Math.max(-1, Math.min(1, s))) / rad;
}

/** Geographic line where geomagnetic latitude equals `target` (found by scanning each meridian). */
export function contour(target: number): [number, number][] {
  const pts: [number, number][] = [];
  let prev: number | null = null;
  for (let lon = -180; lon <= 180; lon += 2) {
    const cross: number[] = [];
    let last = geomagLat(-89, lon) - target;
    for (let lat = -88.5; lat <= 89; lat += 0.5) {
      const f = geomagLat(lat, lon) - target;
      if (last * f < 0) cross.push(lat - 0.5 * (f / (f - last)));
      last = f;
    }
    if (cross.length === 0) continue;
    const want = Math.sign(target);
    const pool = cross.filter((c) => Math.sign(c) === want);
    const cand = pool.length ? pool : cross;
    const pick: number =
      prev == null ? cand[0] : cand.reduce((a, b) => (Math.abs(a - prev!) < Math.abs(b - prev!) ? a : b));
    pts.push([lon, pick]);
    prev = pick;
  }
  return pts;
}

/** The 50 and 60 degree geomagnetic-latitude lines (both hemispheres) as a GeoJSON collection. */
export function geomagLines() {
  return {
    type: "FeatureCollection" as const,
    features: [50, 60, -50, -60].map((t) => ({
      type: "Feature" as const,
      properties: { deg: Math.abs(t) },
      geometry: { type: "LineString" as const, coordinates: contour(t) },
    })),
  };
}
