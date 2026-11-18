// Builds public/data/static/world.json: country outlines as GeoJSON, geometry and name only (VIGIL.md 4.3).
// Source: npm world-atlas/countries-50m.json (Natural Earth, public domain), converted with topojson-client.
// Usage: node scripts/data/build-world.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { feature } from "topojson-client";

const topo = JSON.parse(readFileSync("node_modules/world-atlas/countries-50m.json", "utf8"));
const fc = feature(topo, topo.objects.countries);

const round = (c) => (typeof c[0] === "number" ? [+c[0].toFixed(3), +c[1].toFixed(3)] : c.map(round));
const features = fc.features.map((f) => ({
  type: "Feature",
  properties: { name: f.properties.name },
  geometry: { type: f.geometry.type, coordinates: round(f.geometry.coordinates) },
}));
if (features.length < 150 || features.some((f) => !f.properties.name)) throw new Error("world.json: unexpected country list");

mkdirSync("public/data/static", { recursive: true });
writeFileSync("public/data/static/world.json", JSON.stringify({ type: "FeatureCollection", features }));
console.log(`world.json: ${features.length} countries`);
