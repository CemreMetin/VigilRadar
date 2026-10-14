import assert from "node:assert/strict";
import { BLAST_RINGS, EXAMPLE_YIELD_KT, circle, distanceKm, nearestSite } from "./blast";

// the example yield and the three radii the popups quote (300 kt)
assert.equal(EXAMPLE_YIELD_KT, 300);
const [fireball, blast, burns] = BLAST_RINGS.map((r) => r.km(EXAMPLE_YIELD_KT));
assert.ok(Math.abs(fireball - 0.333) < 0.01, `fireball ${fireball}`);
assert.ok(Math.abs(blast - 4.67) < 0.05, `5 psi ${blast}`);
assert.ok(Math.abs(burns - 6.95) < 0.1, `burns ${burns}`);
// radii grow with yield, and a 15 kt bomb stays close to the Hiroshima-scale figure (about 1.7 km at 5 psi)
assert.ok(BLAST_RINGS[1].km(15) > 1.6 && BLAST_RINGS[1].km(15) < 1.9);

// distance: Istanbul to Ankara is about 350 km
assert.ok(Math.abs(distanceKm(41.01, 28.98, 39.93, 32.86) - 350) < 15);
// a drawn circle sits at the requested radius from its centre, wherever the centre is (also across the date line)
for (const [lat, lon] of [[48.4, -101.4], [64, 179.5], [-33.9, 151.2]]) {
  for (const [lo, la] of circle(lat, lon, 7)) assert.ok(Math.abs(distanceKm(lat, lon, la, lo) - 7) < 0.05);
}
assert.equal(nearestSite(0, 0, [{ lat: 10, lon: 10 }, { lat: 1, lon: 1 }])?.site.lat, 1);

console.log("blast rings: all checks passed");
