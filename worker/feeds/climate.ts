import type { Counter } from "../../lib/types";
import { fetchOpen } from "../http";

export const CO2_URL = "https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_mm_mlo.txt";
export const GISS_URL = "https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// One download per URL per run: the counters and the long series read the same files.
const textCache = new Map<string, Promise<string>>();
function getText(url: string): Promise<string> {
  let p = textCache.get(url);
  if (!p) {
    p = fetchOpen(url).then((r) => r.text());
    textCache.set(url, p);
    p.catch(() => textCache.delete(url));
  }
  return p;
}

/** NOAA GML Mauna Loa monthly mean CO2. Columns: year month decdate average deseasonalized ndays std unc */
export async function co2Counter(): Promise<Counter[]> {
  const text = await getText(CO2_URL);
  const rows = text
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"))
    .map((l) => l.trim().split(/\s+/).map(Number))
    .filter((c) => c.length >= 5 && c[3] > 0); // -9.99 marks missing
  if (rows.length < 14) throw new Error("unexpected CO2 file format");

  const last = rows[rows.length - 1];
  const [year, month, , avg] = last;
  const prev = rows.find((r) => r[0] === year - 1 && r[1] === month);
  const delta = prev ? avg - prev[3] : null;

  return [
    {
      id: "co2",
      label: "Atmospheric CO₂",
      domain: "climate",
      value: avg.toFixed(1),
      numeric: avg,
      unit: "ppm",
      tone: "elevated",
      trend: delta == null ? undefined : delta > 0 ? "up" : delta < 0 ? "down" : "flat",
      trendLabel:
        delta == null ? undefined : `${delta >= 0 ? "+" : ""}${delta.toFixed(1)} ppm vs ${MONTHS[month - 1]} ${year - 1}`,
      note: `Mauna Loa monthly mean for ${MONTHS[month - 1]} ${year}. It rises and falls with the seasons (lowest around September), so compare the same month across years. Deseasonalized trend value: ${last[4].toFixed(1)} ppm. Pre-industrial level was about 280 ppm.`,
      asOf: `${year}-${String(month).padStart(2, "0")}`,
      cadence: "monthly",
      source: {
        name: "NOAA Global Monitoring Laboratory (Mauna Loa)",
        url: "https://gml.noaa.gov/ccgg/trends/",
        license: "Public domain; cite NOAA GML",
      },
      history: rows.slice(-36).map((r) => r[4]), // deseasonalized, so the line is smooth
    },
  ];
}

/** NASA GISTEMP v4 land-ocean monthly anomalies, baseline 1951-1980. */
export async function warmingCounter(): Promise<Counter[]> {
  const text = await getText(GISS_URL);
  const lines = text.split("\n").filter((l) => /^\d{4},/.test(l));
  const series: { y: number; m: number; v: number }[] = [];
  for (const line of lines) {
    const c = line.split(",");
    const y = Number(c[0]);
    for (let m = 0; m < 12; m++) {
      const v = Number(c[m + 1]);
      if (c[m + 1] !== undefined && !c[m + 1].includes("*") && Number.isFinite(v)) series.push({ y, m: m + 1, v });
    }
  }
  if (series.length < 36) throw new Error("unexpected GISS file format");

  const mean = (a: { v: number }[]) => a.reduce((s, x) => s + x.v, 0) / a.length;
  const last12 = series.slice(-12);
  const prev12 = series.slice(-24, -12);
  const m12 = mean(last12);
  const p12 = mean(prev12);
  const latest = series[series.length - 1];
  const d = m12 - p12;

  return [
    {
      id: "warming",
      label: "Global temperature",
      domain: "climate",
      value: `${m12 >= 0 ? "+" : ""}${m12.toFixed(2)}`,
      numeric: m12,
      unit: "°C, 12-month mean",
      tone: "elevated",
      trend: d > 0.005 ? "up" : d < -0.005 ? "down" : "flat",
      trendLabel: `${d >= 0 ? "+" : ""}${d.toFixed(2)} °C vs the 12 months before`,
      note: `Anomaly relative to NASA's 1951-1980 baseline, NOT the pre-industrial baseline used for the 1.5 °C target (pre-industrial is cooler by roughly a quarter to a third of a degree, depending on dataset). Window: ${MONTHS[last12[0].m - 1]} ${last12[0].y} to ${MONTHS[latest.m - 1]} ${latest.y}. Latest single month: ${latest.v >= 0 ? "+" : ""}${latest.v.toFixed(2)} °C.`,
      asOf: `${latest.y}-${String(latest.m).padStart(2, "0")}`,
      cadence: "monthly",
      source: {
        name: "NASA GISS Surface Temperature Analysis (GISTEMP v4)",
        url: "https://data.giss.nasa.gov/gistemp/",
        license: "Public domain; cite GISTEMP Team",
      },
      history: series.slice(-120).map((x) => x.v),
    },
  ];
}


export type SeriesFile = {
  generatedAt: string;
  giss: { baseline: string; unit: string; annual: { y: number; v: number }[]; source: { name: string; url: string } };
  co2: { unit: string; annual: { y: number; v: number }[]; source: { name: string; url: string } };
};

/** Long observed series for /trajectory: GISS annual means (complete years) and Mauna Loa annual CO2. */
export async function climateSeries(): Promise<SeriesFile> {
  const [gissText, co2Text] = await Promise.all([getText(GISS_URL), getText(CO2_URL)]);

  const annual: { y: number; v: number }[] = [];
  for (const line of gissText.split("\n")) {
    if (!/^\d{4},/.test(line)) continue;
    const c = line.split(",");
    const jd = Number(c[13]); // J-D column: calendar-year mean
    if (c[13] && !c[13].includes("*") && Number.isFinite(jd)) annual.push({ y: Number(c[0]), v: jd });
  }
  if (annual.length < 100) throw new Error("unexpected GISS annual format");

  const byYear = new Map<number, number[]>();
  for (const l of co2Text.split("\n")) {
    if (!l.trim() || l.startsWith("#")) continue;
    const c = l.trim().split(/\s+/).map(Number);
    if (c.length >= 5 && c[3] > 0) byYear.set(c[0], [...(byYear.get(c[0]) ?? []), c[3]]);
  }
  const co2 = [...byYear.entries()]
    .filter(([, v]) => v.length === 12)
    .map(([y, v]) => ({ y, v: Math.round((v.reduce((a, b) => a + b, 0) / 12) * 100) / 100 }))
    .sort((a, b) => a.y - b.y);

  return {
    generatedAt: new Date().toISOString(),
    giss: {
      baseline: "1951-1980",
      unit: "°C anomaly",
      annual,
      source: { name: "NASA GISS GISTEMP v4", url: "https://data.giss.nasa.gov/gistemp/" },
    },
    co2: {
      unit: "ppm, annual mean at Mauna Loa",
      annual: co2,
      source: { name: "NOAA GML Mauna Loa", url: "https://gml.noaa.gov/ccgg/trends/" },
    },
  };
}
