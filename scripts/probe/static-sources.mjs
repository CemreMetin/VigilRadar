// Probe for the Faz 2 static sources: one live request each, a small real sample saved under scripts/probe/samples/.
// Usage: node scripts/probe/static-sources.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { unzipSync, strFromU8 } from "fflate";

const UA = "VigilRadar/1.0";
const OUT = "scripts/probe/samples";
mkdirSync(OUT, { recursive: true });
const get = async (url) => {
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
};

const plants = JSON.parse((await get("https://raw.githubusercontent.com/cristianst85/GeoNuclearData/master/data/json/denormalized/nuclear_power_plants.json")).toString("utf8"));
writeFileSync(`${OUT}/geonucleardata.sample.json`, JSON.stringify(plants.slice(0, 5), null, 1));
console.log("plants", plants.length, Object.keys(plants[0]), [...new Set(plants.map((p) => p.Status))]);

const zip = unzipSync(new Uint8Array(await get("https://download.geonames.org/export/dump/TR.zip")));
const rows = strFromU8(zip["TR.txt"]).split("\n").filter(Boolean).map((l) => l.split("\t"));
const adm1 = rows.filter((r) => r[7] === "ADM1");
writeFileSync(`${OUT}/geonames-TR-adm1.sample.tsv`, adm1.map((r) => r.join("\t")).join("\n"));
console.log("geonames rows", rows.length, "ADM1", adm1.length, adm1[0]);
