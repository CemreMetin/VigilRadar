// Run: npm run test:alerts (shares the runner). Uses a real ISS record, so it needs no network.
import assert from "node:assert/strict";
import { nextPasses } from "./passes";

const iss = {
  OBJECT_NAME: "ISS (ZARYA)", OBJECT_ID: "1998-067A", EPOCH: "2026-10-11T04:13:59.875680", MEAN_MOTION: 15.48821882, ECCENTRICITY: 0.00067135,
  INCLINATION: 51.6312, RA_OF_ASC_NODE: 86.0933, ARG_OF_PERICENTER: 248.1316, MEAN_ANOMALY: 111.8959, EPHEMERIS_TYPE: 0, CLASSIFICATION_TYPE: "U",
  NORAD_CAT_ID: 25544, ELEMENT_SET_NO: 999, REV_AT_EPOCH: 58973, BSTAR: 0.0001801405, MEAN_MOTION_DOT: 9.43e-5, MEAN_MOTION_DDOT: 0,
};
const from = Date.parse("2026-10-11T12:00:00Z");

// at 41 N the ISS (51.6 deg inclination) has several passes in 48 h, each ordered and shorter than ~12 minutes
const passes = nextPasses(iss, 41, 29, from, 48, 10);
assert.ok(passes.length >= 3, `expected several passes, got ${passes.length}`);
for (const p of passes) {
  assert.ok(p.rise <= p.peak && p.peak <= p.set);
  assert.ok(p.set - p.rise < 15 * 60_000);
  assert.ok(p.maxElevationDeg >= 10 && p.maxElevationDeg <= 90);
}
for (let i = 1; i < passes.length; i++) assert.ok(passes[i].rise > passes[i - 1].set);

// a latitude the orbit never reaches (inclination 51.6): no passes above 10 degrees at the pole
assert.equal(nextPasses(iss, 89, 0, from, 48, 10).length, 0);

console.log("pass finder: all checks passed");
