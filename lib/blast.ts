/**
 * Reference rings for the "Possible target areas" layer. An ILLUSTRATIVE MODEL for one fixed example, not a
 * forecast: a single airburst at the height that maximises blast, on flat ground, with a clear atmosphere.
 *
 * Scaling laws and constants (yield W in kilotons, radius in km) follow Glasstone and Dolan, The Effects of
 * Nuclear Weapons (1977), as tabulated in the MIT 8.S271 lecture notes by J. Bele:
 *   fireball           R = 0.034 * W^0.40
 *   5 psi air blast    R = 0.71  * W^0.33
 *   3rd-degree burns   R = 0.67  * W^0.41
 * Real effects depend on burst height, terrain, buildings, weather and the weapon, so these radii are order-of-
 * magnitude guides only.
 */

export const EXAMPLE_YIELD_KT = 300;

export const BLAST_RINGS = [
  { id: "fireball", label: "Fireball", km: (w: number) => 0.034 * w ** 0.4, color: "#ffffff" },
  { id: "blast", label: "5 psi blast", km: (w: number) => 0.71 * w ** 0.33, color: "#ffb000" },
  { id: "burns", label: "3rd-degree burns", km: (w: number) => 0.67 * w ** 0.41, color: "#ff6a00" },
] as const;

const EARTH_KM = 6371;
const rad = (d: number) => (d * Math.PI) / 180;

export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(a));
}

/** Points of a circle of `km` radius around a place, as [lon, lat] pairs, closed. */
export function circle(lat: number, lon: number, km: number, steps = 90): [number, number][] {
  const d = km / EARTH_KM;
  const out: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const b = (i / steps) * 2 * Math.PI;
    const la = Math.asin(Math.sin(rad(lat)) * Math.cos(d) + Math.cos(rad(lat)) * Math.sin(d) * Math.cos(b));
    const lo = rad(lon) + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(rad(lat)), Math.cos(d) - Math.sin(rad(lat)) * Math.sin(la));
    out.push([((((lo * 180) / Math.PI + 540) % 360) - 180), (la * 180) / Math.PI]);
  }
  return out;
}

export function nearestSite<T extends { lat: number; lon: number }>(lat: number, lon: number, sites: T[]): { site: T; km: number } | null {
  let best: { site: T; km: number } | null = null;
  for (const site of sites) {
    const km = distanceKm(lat, lon, site.lat, site.lon);
    if (!best || km < best.km) best = { site, km };
  }
  return best;
}
