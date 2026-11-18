// Builds public/data/static/plants.json: nuclear plant sites (VIGIL.md 4.3).
// Source: GeoNuclearData (ODbL-1.0), denormalized JSON. Keeps Operational and Under Construction reactors and
// folds the reactors of one plant (same country, same name root, within 5 km) into one site.
// Usage: node scripts/data/build-plants.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const URL_ = "https://raw.githubusercontent.com/cristianst85/GeoNuclearData/master/data/json/denormalized/nuclear_power_plants.json";
const KEEP = new Set(["Operational", "Under Construction"]);
const SITE_KM = 5;
const rad = (d) => (d * Math.PI) / 180;
const haversineKm = (a, b) => {
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};

const res = await fetch(URL_, { headers: { "User-Agent": "VigilRadar/1.0" } });
if (!res.ok) throw new Error(`GeoNuclearData ${res.status}`);
const all = await res.json();

// "Barakah-1 (Braka)" -> "Barakah"; "Kursk II-2" -> "Kursk II"; "Hinkley Point C-1" -> "Hinkley Point C"
const root = (name) => name.replace(/\s*\(.*\)\s*$/, "").replace(/[\s-]*(unit\s*)?\d+[A-Za-z]?$/i, "").trim();
const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const reactors = all.filter((r) => KEEP.has(r.Status) && Number.isFinite(r.Latitude) && Number.isFinite(r.Longitude));
const sites = [];
for (const r of reactors) {
  const name = root(r.Name);
  const site = sites.find((s) => s.country === r.Country && s.name === name && haversineKm(s, { lat: r.Latitude, lon: r.Longitude }) <= SITE_KM);
  if (site) {
    site.reactors++;
    if (r.Status === "Operational") site.status = "Operational";
  } else {
    sites.push({ name, country: r.Country, cc: r.CountryCode, lat: r.Latitude, lon: r.Longitude, status: r.Status, reactors: 1 });
  }
}

const used = new Set();
const plants = sites
  .map((s) => {
    let id = `${s.cc.toLowerCase()}-${slug(s.name)}`;
    for (let n = 2; used.has(id); n++) id = `${s.cc.toLowerCase()}-${slug(s.name)}-${n}`;
    used.add(id);
    return { id, name: s.name, country: s.country, lat: +s.lat.toFixed(4), lon: +s.lon.toFixed(4), status: s.status, reactors: s.reactors };
  })
  .sort((a, b) => a.country.localeCompare(b.country) || a.name.localeCompare(b.name));

if (plants.length < 150) throw new Error(`expected at least 150 plant sites, got ${plants.length}`);
if (!plants.some((p) => /akkuyu/i.test(p.name))) throw new Error("Akkuyu is missing from the plant list");

mkdirSync("public/data/static", { recursive: true });
writeFileSync(
  "public/data/static/plants.json",
  JSON.stringify({
    source: { name: "GeoNuclearData", url: "https://github.com/cristianst85/GeoNuclearData", license: "ODbL-1.0" },
    note: "Coordinates are approximate.",
    plants,
  }),
);
console.log(`plants.json: ${plants.length} sites from ${reactors.length} reactors`);
