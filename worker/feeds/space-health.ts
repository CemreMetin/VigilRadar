import type { AuroraFile, Counter, MonitorEvent, SolarNow, Tone } from "../../lib/types";
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

// ---------------------------------------------------------------------------------------------------------------
// Solar: aurora oval, NOAA scales, solar wind, X-ray flares, Kp forecast. All NOAA SWPC JSON products.

const SWPC = "https://services.swpc.noaa.gov";
const SCALE_NAME: Record<string, string> = { "0": "none", "1": "minor", "2": "moderate", "3": "strong", "4": "severe", "5": "extreme" };

/** GOES X-ray class from flux in W/m2: A, B, C, M or X with a number (M1.2, X2.8). */
export function flareClass(flux: number): string {
  if (!(flux > 0)) return "n/a";
  const bands: [string, number][] = [["X", 1e-4], ["M", 1e-5], ["C", 1e-6], ["B", 1e-7], ["A", 1e-8]];
  const [letter, base] = bands.find(([, b]) => flux >= b) ?? ["A", 1e-8];
  return `${letter}${(flux / base).toFixed(1)}`;
}

const finite = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);
const byTime = <T extends { time_tag: string }>(rows: T[]) => [...rows].sort((a, b) => a.time_tag.localeCompare(b.time_tag));

/** Each product is independent: one that fails leaves its own part null, the rest still publish. */
export async function solarFeed(): Promise<{ counters: Counter[]; files: { aurora?: AuroraFile; solar_now: SolarNow } }> {
  const source = { name: "NOAA Space Weather Prediction Center", url: "https://www.swpc.noaa.gov/", license: "Public domain (US Government work)" };
  const get = async <T>(p: string): Promise<T> => (await (await fetchOpen(`${SWPC}/${p}`, 60_000)).json()) as T;
  const [scalesR, windR, magR, xrayR, kpR, auroraR] = await Promise.allSettled([
    get<Record<string, { G: { Scale: string }; S: { Scale: string }; R: { Scale: string } }>>("products/noaa-scales.json"),
    get<{ time_tag: string; active: boolean; proton_speed: number | null; proton_density: number | null }[]>("json/rtsw/rtsw_wind_1m.json"),
    get<{ time_tag: string; active: boolean; bz_gsm: number | null; bt: number | null }[]>("json/rtsw/rtsw_mag_1m.json"),
    get<{ time_tag: string; flux: number; energy: string }[]>("json/goes/primary/xrays-1-day.json"),
    get<{ time_tag: string; kp: number; observed: string }[]>("products/noaa-planetary-k-index-forecast.json"),
    get<{ "Observation Time": string; "Forecast Time": string; coordinates: [number, number, number][] }>("json/ovation_aurora_latest.json"),
  ]);
  if ([scalesR, windR, magR, xrayR, kpR, auroraR].every((r) => r.status === "rejected")) throw new Error("no SWPC product answered");

  const scaleOf = (s?: { Scale: string }) => ({ n: Number(s?.Scale ?? 0), text: SCALE_NAME[s?.Scale ?? "0"] ?? "none" });
  const scales = scalesR.status === "fulfilled" && scalesR.value["0"] ? { G: scaleOf(scalesR.value["0"].G), S: scaleOf(scalesR.value["0"].S), R: scaleOf(scalesR.value["0"].R) } : null;

  let wind: SolarNow["wind"] = null;
  if (windR.status === "fulfilled") {
    const rows = byTime(windR.value).filter((r) => finite(r.proton_speed));
    const last = rows[rows.length - 1];
    if (last) {
      wind = {
        speed: Math.round(last.proton_speed as number),
        density: finite(last.proton_density) ? last.proton_density : null,
        speedHistory: rows.slice(-180).filter((_, i) => i % 6 === 0).map((r) => Math.round(r.proton_speed as number)),
        asOf: last.time_tag + "Z",
      };
    }
  }
  let bz: SolarNow["bz"] = null;
  if (magR.status === "fulfilled") {
    const rows = byTime(magR.value).filter((r) => finite(r.bz_gsm));
    const last = rows[rows.length - 1];
    if (last) {
      bz = { value: last.bz_gsm as number, bt: finite(last.bt) ? last.bt : null, history: rows.slice(-180).filter((_, i) => i % 6 === 0).map((r) => r.bz_gsm as number), asOf: last.time_tag + "Z" };
    }
  }
  let xray: SolarNow["xray"] = null;
  if (xrayR.status === "fulfilled") {
    const rows = byTime(xrayR.value.filter((r) => r.energy === "0.1-0.8nm" && finite(r.flux)));
    const last = rows[rows.length - 1];
    const peak = rows.reduce((m, r) => (r.flux > m.flux ? r : m), rows[0]);
    if (last && peak) xray = { current: flareClass(last.flux), peak24h: flareClass(peak.flux), peakAt: peak.time_tag, asOf: last.time_tag };
  }
  let kpForecast: SolarNow["kpForecast"] = null;
  if (kpR.status === "fulfilled") {
    const cutoff = Date.now() - 24 * 3_600_000;
    kpForecast = kpR.value.filter((r) => Date.parse(r.time_tag + "Z") >= cutoff).map((r) => ({ time: r.time_tag + "Z", kp: r.kp, kind: r.observed }));
  }
  let aurora: AuroraFile | undefined;
  if (auroraR.status === "fulfilled") {
    // 1-degree grid thinned to every second degree, keeping cells with a probability of 5% or more
    const points = auroraR.value.coordinates
      .filter(([lo, la, a]) => a >= 5 && lo % 2 === 0 && la % 2 === 0)
      .map(([lo, la, a]): [number, number, number] => [lo > 180 ? lo - 360 : lo, la, a]);
    aurora = { generatedAt: new Date().toISOString(), observed: auroraR.value["Observation Time"], forecast: auroraR.value["Forecast Time"], points, source };
  }

  const now = new Date().toISOString();
  const worst = scales ? Math.max(scales.G.n, scales.S.n, scales.R.n) : 0;
  const tone: Tone = worst >= 3 ? "high" : worst >= 1 ? "elevated" : "normal";
  const rowTone = (n: number): Tone => (n >= 3 ? "high" : n >= 1 ? "elevated" : "normal");
  const counters: Counter[] = scales
    ? [
        {
          id: "space-scales",
          label: "NOAA space weather scales",
          domain: "space",
          value: `G${scales.G.n} S${scales.S.n} R${scales.R.n}`,
          tone,
          basis: "Elevated when any of the three scales is 1 or more, critical from 3 (strong)",
          trendLabel: `Geomagnetic ${scales.G.text}, radiation storm ${scales.S.text}, radio blackout ${scales.R.text}`,
          note: "The current levels on the NOAA 1 to 5 scales: G for geomagnetic storms, S for solar radiation storms, R for radio blackouts from flares. 0 means none.",
          asOf: now,
          cadence: "minutes",
          source,
          rows: [
            { label: "G geomagnetic storm", value: `G${scales.G.n} ${scales.G.text}`, tone: rowTone(scales.G.n) },
            { label: "S solar radiation storm", value: `S${scales.S.n} ${scales.S.text}`, tone: rowTone(scales.S.n) },
            { label: "R radio blackout", value: `R${scales.R.n} ${scales.R.text}`, tone: rowTone(scales.R.n) },
          ],
        },
      ]
    : [];
  return { counters, files: { ...(aurora ? { aurora } : {}), solar_now: { generatedAt: now, scales, wind, bz, xray, kpForecast, source } } };
}
