import { fetchOpen } from "../http";
import type { BulletinIn, KpIn, QuakeIn } from "./rules";

/** Only what the alert rules need: small and fast, so the alert job can run every few minutes. */

export async function fetchQuakes(): Promise<QuakeIn[]> {
  const res = await fetchOpen("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson");
  const json = (await res.json()) as {
    features: { id: string; properties: { mag: number; place: string; time: number; url: string; tsunami: number; type: string }; geometry: { coordinates: [number, number, number] } }[];
  };
  if (!Array.isArray(json.features)) throw new Error("unexpected USGS format");
  return json.features.map((f) => ({
    id: f.id,
    mag: f.properties.mag,
    place: f.properties.place,
    lat: f.geometry.coordinates[1],
    lon: f.geometry.coordinates[0],
    time: f.properties.time,
    url: f.properties.url,
    tsunami: f.properties.tsunami,
    type: f.properties.type,
  }));
}

export async function fetchKp(): Promise<KpIn[]> {
  const res = await fetchOpen("https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json");
  const rows = (await res.json()) as { time_tag: string; Kp: number }[];
  if (!Array.isArray(rows)) throw new Error("unexpected Kp format");
  return rows.slice(-8).map((r) => ({ time: new Date(r.time_tag + "Z").getTime(), kp: r.Kp }));
}

const tag = (xml: string, name: string) => xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`))?.[1]?.trim() ?? "";
const strong = (xml: string, label: string) => xml.match(new RegExp(`<strong>\\s*${label}:?\\s*</strong>\\s*([^<]*)`, "i"))?.[1]?.trim() ?? "";

/** NWS tsunami warning center Atom feed: one entry per bulletin, with a Category (Information, Advisory, Watch, Warning). */
export function parseBulletins(xml: string, feed: "PHEB" | "PAAQ"): BulletinIn[] {
  const center = tag(xml.split("<entry>")[0], "name") || "NWS Tsunami Warning Center";
  const out: BulletinIn[] = [];
  for (const entry of xml.split("<entry>").slice(1)) {
    const summary = tag(entry, "summary");
    const category = strong(summary, "Category");
    const stamp = strong(summary, "Bulletin Issue Time").replace(/^(\d{4})\.(\d{2})\.(\d{2}) (\d{2}:\d{2}:\d{2}).*$/, "$1-$2-$3T$4Z");
    const issued = Date.parse(stamp);
    if (!category || !Number.isFinite(issued)) continue;
    out.push({
      feed,
      center,
      category,
      region: strong(summary, "Affected Region") || tag(entry, "title"),
      mag: strong(summary, "Preliminary Magnitude"),
      lat: Number(tag(entry, "geo:lat")),
      lon: Number(tag(entry, "geo:long")),
      issued,
      url: "https://www.tsunami.gov/",
    });
  }
  return out;
}

export async function fetchBulletins(): Promise<BulletinIn[]> {
  const feeds = ["PHEB", "PAAQ"] as const;
  const parts = await Promise.all(
    feeds.map(async (f) => parseBulletins(await (await fetchOpen(`https://www.tsunami.gov/events/xml/${f}Atom.xml`)).text(), f)),
  );
  return parts.flat();
}
