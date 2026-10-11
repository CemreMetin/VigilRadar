import type { Counter, MonitorEvent, Tone } from "../../lib/types";
import { findCountry } from "../geo";
import { fetchOpen } from "../http";

/** WHO reports in 90 days from which the outbreaks metric reads as elevated. */
const OUTBREAK_ELEVATED_AT = 12;

export const KP_URL = "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json";
export const DON_URL =
  "https://www.who.int/api/news/diseaseoutbreaknews?sf_culture=en&$select=Title,PublicationDate,UrlName,DonId&$orderby=PublicationDate%20desc&$top=80";

async function getJson<T>(url: string): Promise<T> {
  return (await (await fetchOpen(url)).json()) as T;
}

/** NOAA scale: Kp 5 = G1 (minor) ... Kp 9 = G5 (extreme). */
function gScale(kp: number): string {
  if (kp >= 9) return "G5 extreme";
  if (kp >= 8) return "G4 severe";
  if (kp >= 7) return "G3 strong";
  if (kp >= 6) return "G2 moderate";
  if (kp >= 5) return "G1 minor";
  return "no storm";
}

export async function kpCounter(): Promise<Counter[]> {
  const rows = await getJson<{ time_tag: string; Kp: number }[]>(KP_URL);
  if (!Array.isArray(rows) || rows.length < 8) throw new Error("unexpected Kp format");
  const last = rows[rows.length - 1];
  const day = rows.slice(-8); // 3-hour values, last 24 h
  const max24 = Math.max(...day.map((r) => r.Kp));
  const tone: Tone = last.Kp >= 7 ? "high" : last.Kp >= 5 ? "elevated" : "normal";
  return [
    {
      id: "kp",
      label: "Geomagnetic activity",
      domain: "space",
      value: last.Kp.toFixed(1),
      numeric: last.Kp,
      unit: `Kp · ${gScale(last.Kp)}`,
      tone,
      basis: "Elevated from Kp 5 (NOAA G1 storm), critical from Kp 7 (G3)",
      trendLabel: `24 h peak Kp ${max24.toFixed(1)} (${gScale(max24)})`,
      note: "Planetary Kp index, 0-9, from NOAA SWPC (3-hour values). G1 starts at Kp 5. The 1859 Carrington event is estimated to have been beyond anything in the modern record.",
      asOf: new Date(last.time_tag + "Z").toISOString(),
      cadence: "3 hours",
      source: {
        name: "NOAA Space Weather Prediction Center",
        url: "https://www.swpc.noaa.gov/products/planetary-k-index",
        license: "Public domain (US Government work)",
      },
      history: rows.slice(-56).map((r) => r.Kp),
    },
  ];
}

type DonItem = { Title: string; PublicationDate: string; UrlName: string; DonId: string };

/** "Ebola disease caused by Bundibugyo virus - Democratic Republic of the Congo" -> country names */
function countriesInTitle(title: string): string[] {
  const parts = title.split(/\s[-–—]\s/);
  if (parts.length < 2) return [];
  return parts[parts.length - 1]
    .split(/,|\band\b/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export async function donFeed(): Promise<{ counters: Counter[]; events: MonitorEvent[] }> {
  const json = await getJson<{ value: DonItem[] }>(DON_URL);
  const items = json.value;
  if (!Array.isArray(items) || items.length === 0) throw new Error("unexpected DON format");
  const cutoff90 = Date.now() - 90 * 86_400_000;
  const cutoff120 = Date.now() - 120 * 86_400_000;
  const recent = items.filter((i) => new Date(i.PublicationDate).getTime() >= cutoff90);
  const latest = items[0];

  const source = {
    name: "WHO Disease Outbreak News",
    url: "https://www.who.int/emergencies/disease-outbreak-news",
    license: "CC BY-NC-SA 3.0 IGO (WHO); non-commercial use with attribution",
  };

  const events: MonitorEvent[] = [];
  for (const it of items) {
    const published = new Date(it.PublicationDate).getTime();
    if (published < cutoff120) continue;
    for (const name of countriesInTitle(it.Title)) {
      const c = findCountry(name);
      if (!c) continue;
      events.push({
        id: `who:${it.DonId || it.UrlName}:${c.iso3}`,
        domain: "health",
        kind: "outbreak",
        title: it.Title,
        severity: published >= Date.now() - 30 * 86_400_000 ? 2 : 1,
        lat: c.lat,
        lon: c.lon,
        countries: [c.iso3],
        startedAt: new Date(it.PublicationDate).toISOString(),
        updatedAt: new Date(it.PublicationDate).toISOString(),
        url: `https://www.who.int/emergencies/disease-outbreak-news/item/${it.UrlName}`,
        source,
      });
    }
  }

  const counters: Counter[] = [
    {
      id: "outbreaks",
      label: "WHO outbreak reports",
      domain: "health",
      value: String(recent.length),
      numeric: recent.length,
      unit: "reports in 90 days",
      tone: recent.length >= OUTBREAK_ELEVATED_AT ? "elevated" : "normal",
      basis: `Elevated from ${OUTBREAK_ELEVATED_AT} WHO reports in 90 days`,
      trendLabel: `Latest: ${latest.Title}`,
      note: "Count of WHO Disease Outbreak News publications, not a count of active outbreaks: WHO only publishes events it judges relevant for international attention, and one outbreak can have several reports. On the map, each report is placed at the centre of the country named in its title (not at the outbreak site).",
      asOf: new Date(latest.PublicationDate).toISOString(),
      cadence: "daily check",
      source,
      rows: items.slice(0, 5).map((i) => ({
        label: i.Title,
        value: i.PublicationDate.slice(0, 10),
      })),
    },
  ];
  return { counters, events };
}
