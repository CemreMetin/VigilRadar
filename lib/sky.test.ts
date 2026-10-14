import assert from "node:assert/strict";
import { moon, moonPhase, nightPolygon, sun } from "./sky";

const t = (s: string) => Date.parse(s);

// Sun at J2000.0: declination about -23.0, right ascension about 281.3
const s0 = sun(t("2000-01-01T12:00:00Z"));
assert.ok(Math.abs(s0.dec - -23.0) < 0.3, `sun dec ${s0.dec}`);
assert.ok(Math.abs(s0.ra - 281.3) < 0.5, `sun ra ${s0.ra}`);
// June solstice: the Sun is over the Tropic of Cancer; at 12:00 UT near the equation of time it is close to the Greenwich meridian
const s1 = sun(t("2026-06-21T12:00:00Z"));
assert.ok(Math.abs(s1.lat - 23.4) < 0.3, `solstice lat ${s1.lat}`);
assert.ok(Math.abs(s1.lon) < 3, `solstice lon ${s1.lon}`);

// Moon phases around the January 2000 new and full moons (new 2000-01-06 18:14 UT, full 2000-01-21 04:40 UT)
assert.ok(moonPhase(t("2000-01-06T18:14:00Z")).lit < 0.02);
assert.ok(moonPhase(t("2000-01-21T04:40:00Z")).lit > 0.98);
assert.equal(moonPhase(t("2000-01-06T18:14:00Z")).name, "New moon");
assert.equal(moonPhase(t("2000-01-21T04:40:00Z")).name, "Full moon");
assert.match(moonPhase(t("2000-01-17T00:00:00Z")).name, /Waxing gibbous/);
// a waning moon a week after full
assert.match(moonPhase(t("2000-01-28T00:00:00Z")).name, /Waning|Last/);

// the Moon stays within 28.7 degrees of the equator
for (let d = 0; d < 60; d++) assert.ok(Math.abs(moon(t("2026-01-01T00:00:00Z") + d * 86_400_000).dec) < 29.5);

// night polygon: closed, and the subsolar point is not inside it while the antipode is
const ring = nightPolygon(s1.lat, s1.lon);
assert.deepEqual(ring[0], ring[ring.length - 1]);
const inside = (pt: [number, number]) => {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
assert.equal(inside([s1.lon, s1.lat]), false);
assert.equal(inside([s1.lon + 180 > 180 ? s1.lon - 180 : s1.lon + 180, -s1.lat]), true);

console.log("sun and moon: all checks passed");
