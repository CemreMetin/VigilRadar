import type { Counter } from "../../lib/types";
import { fetchOpen } from "../http";

/**
 * Ice and sea level, observations only:
 *  - global mean sea level from satellite altimetry (NOAA Laboratory for Satellite Altimetry)
 *  - sea-ice extent, both poles (NSIDC Sea Ice Index, daily)
 * No projections are made. Trends are least-squares lines through the observed values.
 */

const SLR_URL = "https://www.star.nesdis.noaa.gov/socd/lsa/SeaLevelRise/slr/slr_sla_gbl_free_all_66.csv";
const ICE_N = "https://noaadata.apps.nsidc.org/NOAA/G02135/north/daily/data/N_seaice_extent_daily_v4.0.csv";
const ICE_S = "https://noaadata.apps.nsidc.org/NOAA/G02135/south/daily/data/S_seaice_extent_daily_v4.0.csv";

/** Elevated when the ice extent is this far below the 1981-2010 mean for the date; critical at the second value. */
const ICE_ELEVATED_PCT = -10;
const ICE_HIGH_PCT = -20;

async function text(url: string): Promise<string> {
  return (await fetchOpen(url, 60_000)).text();
}

function ols(points: { t: number; v: number }[]): number {
  const n = points.length;
  const mx = points.reduce((s, p) => s + p.t, 0) / n;
  const my = points.reduce((s, p) => s + p.v, 0) / n;
  let sxy = 0;
  let sxx = 0;
  for (const p of points) {
    sxy += (p.t - mx) * (p.v - my);
    sxx += (p.t - mx) ** 2;
  }
  return sxx === 0 ? 0 : sxy / sxx;
}

/** Decimal year (2025.1268) to an ISO date. */
function decimalYearToIso(t: number): string {
  const y = Math.floor(t);
  const start = Date.UTC(y, 0, 1);
  const end = Date.UTC(y + 1, 0, 1);
  return new Date(start + (t - y) * (end - start)).toISOString().slice(0, 10);
}

export async function seaLevelCounter(): Promise<Counter[]> {
  const lines = (await text(SLR_URL)).split("\n");
  const points: { t: number; v: number }[] = [];
  for (const line of lines) {
    if (!line.trim() || line.startsWith("#") || line.startsWith("year")) continue;
    const cols = line.split(",");
    const t = Number(cols[0]);
    const val = cols.slice(1).map(Number).find((x, i) => cols[i + 1]?.trim() !== "" && Number.isFinite(x));
    if (Number.isFinite(t) && val !== undefined) points.push({ t, v: val });
  }
  if (points.length < 200) throw new Error("unexpected sea level file format");

  const last = points[points.length - 1];
  const baseline = points.filter((p) => p.t < 1994);
  const base = baseline.reduce((s, p) => s + p.v, 0) / baseline.length;
  const change = last.v - base;

  const trendAll = ols(points);
  const recent = points.filter((p) => p.t >= last.t - 10);
  const trendRecent = ols(recent);

  // annual means for the sparkline
  const byYear = new Map<number, number[]>();
  for (const p of points) byYear.set(Math.floor(p.t), [...(byYear.get(Math.floor(p.t)) ?? []), p.v]);
  const history = [...byYear.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v.reduce((s, x) => s + x, 0) / v.length);

  const accelerating = trendRecent > trendAll;
  return [
    {
      id: "sea-level",
      label: "Global mean sea level",
      domain: "climate",
      value: `+${change.toFixed(0)}`,
      numeric: change,
      unit: "mm since 1993",
      tone: accelerating ? "elevated" : "normal",
      trend: "up",
      trendLabel: `${trendAll.toFixed(1)} mm/yr over the record · ${trendRecent.toFixed(1)} mm/yr over the last 10 years`,
      basis: "Elevated when the last 10 years rise faster than the full record (a comparison of two observed trends, not a forecast)",
      note: "Global mean sea level from satellite altimetry (TOPEX/Poseidon, Jason-1/2/3, Sentinel-6), 66°S to 66°N, annual signal removed, no glacial-isostatic correction. 'Since 1993' compares the latest value with the average of the first year of the record. The source publishes with a delay of many months.",
      asOf: decimalYearToIso(last.t),
      cadence: "source updates every few weeks, lags the present",
      source: {
        name: "NOAA Laboratory for Satellite Altimetry",
        url: "https://www.star.nesdis.noaa.gov/socd/lsa/SeaLevelRise/",
        license: "Free; acknowledge 'Altimetry data are provided by NOAA Laboratory for Satellite Altimetry'",
      },
      history,
    },
  ];
}

type IceRow = { y: number; m: number; d: number; ext: number };

function parseIce(csv: string): IceRow[] {
  const rows: IceRow[] = [];
  for (const line of csv.split("\n").slice(2)) {
    const c = line.split(",");
    if (c.length < 4) continue;
    const [y, m, d, ext] = [Number(c[0]), Number(c[1]), Number(c[2]), Number(c[3])];
    if ([y, m, d, ext].every(Number.isFinite)) rows.push({ y, m, d, ext });
  }
  return rows;
}

const doy = (r: IceRow) => Math.floor((Date.UTC(r.y, r.m - 1, r.d) - Date.UTC(r.y, 0, 0)) / 86_400_000);

/** Latest extent, and the 1981-2010 mean for the same time of year (+-3 days). */
function iceSummary(rows: IceRow[]) {
  const last = rows[rows.length - 1];
  const dd = doy(last);
  const ref = rows.filter((r) => r.y >= 1981 && r.y <= 2010 && Math.abs(doy(r) - dd) <= 3);
  const mean = ref.reduce((s, r) => s + r.ext, 0) / (ref.length || 1);
  return { last, mean, pct: ((last.ext - mean) / mean) * 100, date: `${last.y}-${String(last.m).padStart(2, "0")}-${String(last.d).padStart(2, "0")}` };
}

export async function seaIceCounter(): Promise<Counter[]> {
  const [n, s] = await Promise.all([text(ICE_N).then(parseIce), text(ICE_S).then(parseIce)]);
  if (n.length < 1000 || s.length < 1000) throw new Error("unexpected sea ice file format");
  const N = iceSummary(n);
  const S = iceSummary(s);
  const worst = Math.min(N.pct, S.pct);
  const tone = worst <= ICE_HIGH_PCT ? "high" : worst <= ICE_ELEVATED_PCT ? "elevated" : "normal";
  const fmtPct = (p: number) => `${p >= 0 ? "+" : "−"}${Math.abs(p).toFixed(0)}%`;
  return [
    {
      id: "sea-ice",
      label: "Sea-ice extent",
      domain: "climate",
      value: N.last.ext.toFixed(2),
      numeric: N.last.ext,
      unit: "million km², Arctic",
      tone,
      trend: N.pct < -1 ? "down" : N.pct > 1 ? "up" : "flat",
      trendLabel: `Arctic ${fmtPct(N.pct)} · Antarctic ${fmtPct(S.pct)} vs the 1981-2010 mean for this date`,
      basis: `Elevated when either pole is ${Math.abs(ICE_ELEVATED_PCT)}% or more below its 1981-2010 mean for the date, critical at ${Math.abs(ICE_HIGH_PCT)}%`,
      note: "Extent is the ocean area with at least 15% ice cover, from passive-microwave satellites (NSIDC Sea Ice Index). The latest daily values are preliminary and can be revised. Sea ice floats, so its melt barely changes sea level; it matters for climate feedbacks, ecosystems and shipping. Land ice (glaciers, ice sheets) is what raises sea level.",
      asOf: N.date,
      cadence: "daily",
      source: {
        name: "NSIDC Sea Ice Index v4 (NOAA@NSIDC)",
        url: "https://nsidc.org/data/g02135",
        license: "Free; cite Fetterer et al., Sea Ice Index",
      },
      history: n.slice(-90).map((r) => r.ext),
      rows: [
        { label: "Arctic", value: `${N.last.ext.toFixed(2)} (${fmtPct(N.pct)})`, tone: N.pct <= ICE_ELEVATED_PCT ? "elevated" : "normal" },
        { label: "Antarctic", value: `${S.last.ext.toFixed(2)} (${fmtPct(S.pct)})`, tone: S.pct <= ICE_ELEVATED_PCT ? "elevated" : "normal" },
      ],
    },
  ];
}
