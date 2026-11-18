// Builds public/data/static/world.json: country outlines as GeoJSON, geometry and name only (VIGIL.md 4.3).
// Source: npm world-atlas/countries-110m.json (Natural Earth, public domain), converted with topojson-client.
// Usage: node scripts/data/build-world.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { feature } from "topojson-client";

const topo = JSON.parse(readFileSync("node_modules/world-atlas/countries-110m.json", "utf8"));
const fc = feature(topo, topo.objects.countries);

// Rings that cross the antimeridian (Russia, Fiji) jump by up to 360 degrees; unwrap them so no edge runs across the whole map.
// Antarctica encloses the pole and cannot be drawn in Mercator, so it is left out (no quake alerts there).
const unwrap = (ring) => {
  if (!ring.some((p, i) => i && Math.abs(p[0] - ring[i - 1][0]) > 180)) return ring;
  const out = [ring[0]];
  let off = 0;
  for (let i = 1; i < ring.length; i++) {
    let lon = ring[i][0] + off;
    while (lon - out[i - 1][0] > 180) { off -= 360; lon -= 360; }
    while (lon - out[i - 1][0] < -180) { off += 360; lon += 360; }
    out.push([lon, ring[i][1]]);
  }
  return out;
};
const polys = (g) => (g.type === "Polygon" ? [g.coordinates] : g.coordinates);
const fixed = (g) => ({ type: g.type, coordinates: g.type === "Polygon" ? g.coordinates.map(unwrap) : polys(g).map((p) => p.map(unwrap)) });

const round = (c) => (typeof c[0] === "number" ? [+c[0].toFixed(3), +c[1].toFixed(3)] : c.map(round));
const features = fc.features.filter((f) => f.properties.name !== "Antarctica").map((f) => ({
  type: "Feature",
  properties: { name: f.properties.name },
  geometry: { type: f.geometry.type, coordinates: round(fixed(f.geometry).coordinates) },
}));
if (features.length < 150 || features.some((f) => !f.properties.name)) throw new Error("world.json: unexpected country list");

mkdirSync("public/data/static", { recursive: true });
writeFileSync("public/data/static/world.json", JSON.stringify({ type: "FeatureCollection", features }));
console.log(`world.json: ${features.length} countries`);
