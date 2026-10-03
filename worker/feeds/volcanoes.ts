import supervolcanoes from "../../data/supervolcanoes.json";
import type { SourceRef, VolcanoStatus } from "../../lib/types";
import { fetchOpen } from "../http";

type Base = (typeof supervolcanoes.volcanoes)[number];

const HANS = "https://volcanoes.usgs.gov/hans-public/api/volcano/getMonitoredVolcanoes";
const GEONET = "https://api.geonet.org.nz/volcano/val";

const USGS_SRC: SourceRef = {
  name: "USGS Volcano Hazards Program (HANS)",
  url: "https://volcanoes.usgs.gov/",
  license: "Public domain (US Government work)",
};

async function usgsQuakeCount(lat: number, lon: number, radiusKm: number, minMag: number) {
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const q = `latitude=${lat}&longitude=${lon}&maxradiuskm=${radiusKm}&starttime=${since}&minmagnitude=${minMag}`;
  const count = Number(await (await fetchOpen(`https://earthquake.usgs.gov/fdsnws/event/1/count?${q}`)).text());
  let maxMag: number | null = null;
  if (count > 0) {
    const top = (await (
      await fetchOpen(`https://earthquake.usgs.gov/fdsnws/event/1/query?${q}&orderby=magnitude&limit=1&format=geojson`)
    ).json()) as { features: { properties: { mag: number } }[] };
    maxMag = top.features[0]?.properties.mag ?? null;
  }
  return { count, maxMag, radiusKm, minMag };
}

async function ingvQuakes(lat: number, lon: number, radiusKm: number, minMag: number) {
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const url = `https://webservices.ingv.it/fdsnws/event/1/query?lat=${lat}&lon=${lon}&maxradiuskm=${radiusKm}&starttime=${since}&minmag=${minMag}&format=text&limit=2000`;
  const lines = (await (await fetchOpen(url)).text()).split("\n").filter((l) => l && !l.startsWith("#"));
  let maxMag: number | null = null;
  for (const l of lines) {
    const m = Number(l.split("|")[10]);
    if (Number.isFinite(m) && (maxMag === null || m > maxMag)) maxMag = m;
  }
  return { count: lines.length, maxMag, radiusKm, minMag };
}

export async function volcanoWatch(): Promise<VolcanoStatus[]> {
  const out: VolcanoStatus[] = [];
  const settled = async <T>(p: Promise<T>): Promise<T | null> => p.catch(() => null);

  const [hans, geonet] = await Promise.all([
    settled(fetchOpen(HANS).then((r) => r.json() as Promise<{ volcano_name: string; alert_level: string; color_code: string; sent_utc: string | null }[]>)),
    settled(fetchOpen(GEONET).then((r) => r.json() as Promise<{ features: { properties: { volcanoID: string; level: number; acc: string; activity: string } }[] }>)),
  ]);

  for (const v of supervolcanoes.volcanoes as Base[]) {
    const base = { id: v.id, name: v.name, country: v.country, lat: v.lat, lon: v.lon, lastSuperEruption: v.lastSuperEruption };

    if (v.id === "yellowstone" || v.id === "long-valley") {
      const key = v.id === "yellowstone" ? "Yellowstone" : "Long Valley Caldera";
      const h = hans?.find((x) => x.volcano_name === key);
      const radius = v.id === "yellowstone" ? 60 : 40;
      const quakes = await settled(usgsQuakeCount(v.lat, v.lon, radius, 0));
      out.push({
        ...base,
        level: h ? (h.alert_level === "NORMAL" ? "normal" : "elevated") : "unknown",
        levelLabel: h ? `${h.alert_level[0]}${h.alert_level.slice(1).toLowerCase()} (USGS: ${h.color_code})` : "Status unavailable",
        detail: h?.sent_utc ? `Latest USGS update ${h.sent_utc.slice(0, 10)}.` : undefined,
        asOf: h?.sent_utc ? new Date(h.sent_utc.replace(" ", "T") + "Z").toISOString() : undefined,
        live: !!h,
        quakes30d: quakes ? { ...quakes, minMag: 0 } : undefined,
        source: USGS_SRC,
      });
    } else if (v.id === "taupo") {
      const t = geonet?.features.find((f) => f.properties.volcanoID === "taupo")?.properties;
      out.push({
        ...base,
        level: t ? (t.level === 0 ? "normal" : "elevated") : "unknown",
        levelLabel: t ? `Level ${t.level} (GeoNet: ${t.acc})` : "Status unavailable",
        detail: t?.activity,
        asOf: new Date().toISOString(),
        live: !!t,
        source: { name: "GeoNet (GNS Science, New Zealand)", url: "https://www.geonet.org.nz/volcano", license: "CC BY 4.0" },
      });
    } else if (v.id === "campi-flegrei") {
      const quakes = await settled(ingvQuakes(v.lat, v.lon, 15, 1.0));
      out.push({
        ...base,
        // The Italian Civil Protection alert level has been yellow since 2012 (INGV-OV bulletins);
        // this is hand-entered, the quake counts below are live.
        level: "elevated",
        levelLabel: "Yellow alert level (Italian Civil Protection), unrest ongoing",
        detail:
          "Ground uplift and earthquake swarms continue. Yellow is the second of four levels and does not mean an eruption is expected.",
        asOf: quakes ? new Date().toISOString() : undefined,
        live: !!quakes,
        quakes30d: quakes ?? undefined,
        source: { name: "INGV Osservatorio Vesuviano", url: "https://www.ov.ingv.it/", license: "CC BY 4.0 (INGV web services)" },
      });
    } else {
      out.push({
        ...base,
        level: "unknown",
        levelLabel: "No public real-time feed used",
        detail:
          v.id === "toba"
            ? "Monitored locally; this site has no live status for Toba."
            : "Sakurajima is monitored by the Japan Meteorological Agency; this site does not ingest its alert level yet.",
        live: false,
        source: { name: "Smithsonian Global Volcanism Program", url: "https://volcano.si.edu/", license: "Reference data, cited" },
      });
    }
  }
  return out;
}
