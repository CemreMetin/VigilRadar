// Builds public/data/static/places.tr.json: the 81 Turkish provinces (VIGIL.md 4.3).
// Source: GeoNames TR.zip, featureCode ADM1 (CC BY 4.0). Plate codes come from matching the province name.
// Usage: node scripts/data/build-places.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { strFromU8, unzipSync } from "fflate";

// Plate order 01..81. The names are only used to find each province in GeoNames; output names are these.
const PLATES = `Adana Adıyaman Afyonkarahisar Ağrı Amasya Ankara Antalya Artvin Aydın Balıkesir Bilecik Bingöl Bitlis Bolu Burdur Bursa Çanakkale Çankırı Çorum Denizli Diyarbakır Edirne Elazığ Erzincan Erzurum Eskişehir Gaziantep Giresun Gümüşhane Hakkari Hatay Isparta Mersin İstanbul İzmir Kars Kastamonu Kayseri Kırklareli Kırşehir Kocaeli Konya Kütahya Malatya Manisa Kahramanmaraş Mardin Muğla Muş Nevşehir Niğde Ordu Rize Sakarya Samsun Siirt Sinop Sivas Tekirdağ Tokat Trabzon Tunceli Şanlıurfa Uşak Van Yozgat Zonguldak Aksaray Bayburt Karaman Kırıkkale Batman Şırnak Bartın Ardahan Iğdır Yalova Karabük Kilis Osmaniye Düzce`.split(" ");

// The full list of coastal provinces from VIGIL.md 4.3.
const COASTAL = new Set(`Artvin Rize Trabzon Giresun Ordu Samsun Sinop Kastamonu Bartın Zonguldak Düzce Sakarya Kocaeli İstanbul Kırklareli Tekirdağ Edirne Çanakkale Balıkesir Bursa Yalova İzmir Aydın Muğla Antalya Mersin Adana Hatay`.split(" "));

const fold = (s) =>
  s.replace(/İ/g, "i").replace(/I/g, "i").toLowerCase().replace(/[ıİ]/g, "i").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ğ/g, "g");

const res = await fetch("https://download.geonames.org/export/dump/TR.zip", { headers: { "User-Agent": "VigilRadar/1.0" } });
if (!res.ok) throw new Error(`GeoNames ${res.status}`);
const files = unzipSync(new Uint8Array(await res.arrayBuffer()));
const rows = strFromU8(files["TR.txt"]).split("\n").filter(Boolean).map((l) => l.split("\t"));
const adm1 = rows.filter((r) => r[7] === "ADM1");

const byFold = new Map(PLATES.map((n, i) => [fold(n), i + 1]));
const found = new Map();
for (const r of adm1) {
  const plate = byFold.get(fold(r[1]));
  if (!plate) throw new Error(`no plate for GeoNames province "${r[1]}"`);
  if (found.has(plate)) throw new Error(`plate ${plate} matched twice`);
  found.set(plate, { lat: Number(r[4]), lon: Number(r[5]) });
}
if (found.size !== 81) throw new Error(`expected 81 provinces, got ${found.size}`);
for (const n of COASTAL) if (!PLATES.includes(n)) throw new Error(`coastal name not in the plate list: ${n}`);

const places = PLATES.map((name, i) => {
  const plate = i + 1;
  const { lat, lon } = found.get(plate);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error(`bad coordinates for ${name}`);
  return { code: `TR-${String(plate).padStart(2, "0")}`, plate, name, lat: +lat.toFixed(4), lon: +lon.toFixed(4), coastal: COASTAL.has(name) };
});
if (places.filter((p) => p.coastal).length !== 28) throw new Error("expected 28 coastal provinces");

mkdirSync("public/data/static", { recursive: true });
writeFileSync(
  "public/data/static/places.tr.json",
  JSON.stringify({ source: { name: "GeoNames (ADM1, TR)", url: "https://www.geonames.org/", license: "CC BY 4.0" }, places }),
);
console.log(`places.tr.json: ${places.length} provinces, ${places.filter((p) => p.coastal).length} coastal`);
