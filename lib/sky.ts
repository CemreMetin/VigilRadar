/**
 * Where the Sun and the Moon are, computed in the browser from the clock: no feed, no network.
 * Low-precision formulas (the Astronomical Almanac solar position; Meeus' truncated lunar series), good to
 * about 0.01 degrees for the Sun and 0.3 degrees for the Moon. Plenty for a map marker and a day/night edge;
 * not for eclipses or navigation.
 */

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;
const wrap360 = (d: number) => ((d % 360) + 360) % 360;
const wrap180 = (d: number) => wrap360(d + 180) - 180;

/** Days since J2000.0 (2000-01-01 12:00 UT) for a time in milliseconds. */
const daysSinceJ2000 = (ms: number) => ms / 86_400_000 - 10_957.5;

/** Greenwich mean sidereal time in degrees. */
const gmst = (n: number) => wrap360(280.46061837 + 360.98564736629 * n);

export type SkyPoint = {
  /** right ascension and declination, degrees (equator of date, close enough to J2000 for a plot) */
  ra: number;
  dec: number;
  /** the point on Earth where the object is straight overhead */
  lat: number;
  lon: number;
};

function toPoint(lambda: number, beta: number, n: number): SkyPoint {
  const eps = (23.439 - 0.0000004 * n) * D2R;
  const l = lambda * D2R;
  const b = beta * D2R;
  const ra = wrap360(Math.atan2(Math.sin(l) * Math.cos(eps) - Math.tan(b) * Math.sin(eps), Math.cos(l)) * R2D);
  const dec = Math.asin(Math.sin(b) * Math.cos(eps) + Math.cos(b) * Math.sin(eps) * Math.sin(l)) * R2D;
  return { ra, dec, lat: dec, lon: wrap180(ra - gmst(n)) };
}

function sunLongitude(n: number): number {
  const L = 280.46 + 0.9856474 * n;
  const g = (357.528 + 0.9856003 * n) * D2R;
  return wrap360(L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g));
}

export function sun(ms: number): SkyPoint {
  const n = daysSinceJ2000(ms);
  return toPoint(sunLongitude(n), 0, n);
}

export function moon(ms: number): SkyPoint {
  const n = daysSinceJ2000(ms);
  const Lm = 218.316 + 13.176396 * n;
  const M = (134.963 + 13.064993 * n) * D2R; // lunar mean anomaly
  const F = (93.272 + 13.22935 * n) * D2R; // argument of latitude
  return toPoint(wrap360(Lm + 6.289 * Math.sin(M)), 5.128 * Math.sin(F), n);
}

/** Phase from the Moon-Sun elongation: the lit fraction (0..1) and its name. */
export function moonPhase(ms: number): { lit: number; name: string } {
  const n = daysSinceJ2000(ms);
  const Lm = 218.316 + 13.176396 * n;
  const M = (134.963 + 13.064993 * n) * D2R;
  const elong = wrap360(Lm + 6.289 * Math.sin(M) - sunLongitude(n)); // 0 new, 180 full
  const lit = (1 - Math.cos(elong * D2R)) / 2;
  const waxing = elong < 180;
  const name =
    lit < 0.03 ? "New moon" : lit > 0.97 ? "Full moon" : Math.abs(lit - 0.5) < 0.04 ? (waxing ? "First quarter" : "Last quarter") : lit < 0.5 ? (waxing ? "Waxing crescent" : "Waning crescent") : waxing ? "Waxing gibbous" : "Waning gibbous";
  return { lit, name };
}

/**
 * The night side of the Earth as one polygon ([lon, lat] rings, GeoJSON order): the terminator is the great circle
 * 90 degrees from the subsolar point; the polygon closes through the pole that is in darkness.
 */
export function nightPolygon(subsolarLat: number, subsolarLon: number): [number, number][] {
  const lat0 = Math.abs(subsolarLat) < 0.01 ? 0.01 : subsolarLat; // avoid tan(0) at the equinox
  const ring: [number, number][] = [];
  for (let lon = -180; lon <= 180; lon += 2) {
    ring.push([lon, Math.atan(-Math.cos((lon - subsolarLon) * D2R) / Math.tan(lat0 * D2R)) * R2D]);
  }
  const pole = lat0 > 0 ? -90 : 90; // the Sun is north of the equator: the south pole is in the dark
  return [...ring, [180, pole], [-180, pole], ring[0]];
}
