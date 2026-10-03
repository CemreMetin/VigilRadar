/**
 * GDELT 1.0 daily event files -> (a) tension index for tracked country pairs,
 * (b) map of news-reported violent events, (c) a news-intensity counter.
 *
 * GDELT codes events automatically from news with CAMEO. It measures how media report relations,
 * not ground truth: it is noisy, over-represents English-language and wire coverage, and
 * mis-codes some events. Everything built from it is labelled accordingly in the UI.
 *
 * Daily aggregates are cached in .cache/gdelt/ so a normal run only downloads the missing day(s).
 * First run downloads ~30 files (~7 MB each).
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { strFromU8, unzipSync } from "fflate";
import dyadsFile from "../../data/dyads.json";
import type { ConflictFile, Counter, Dyad, DyadComponents } from "../../lib/types";
import { COUNTRIES } from "../geo";
import { USER_AGENT } from "../http";

const CACHE = path.join(process.cwd(), ".cache", "gdelt");
const WINDOW_DAYS = 30;

type DyadAgg = { n: number; m: number; g: number; t: number; q3: number; q4: number };
const CACHE_VERSION = 2; // bump when parseDay's rules change, to rebuild cached days

type DayAgg = {
  v: number;
  day: string;
  events: number;
  dyads: Record<string, DyadAgg>;
  cells: Record<string, [number, number]>; // "lat,lon" -> [events, mentions]
  viol: Record<string, [number, number]>; // FIPS -> [events, mentions]
};

// CAMEO actor types: MIL military, REB rebels, SEP separatists, INS insurgents; COP police, CRM criminals
const ARMED_TYPES = new Set(["MIL", "REB", "SEP", "INS"]);
const CIVIL_TYPES = new Set(["COP", "CRM"]);

const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
const TRACKED = new Map(dyadsFile.pairs.map((p) => [pairKey(p.a, p.b), p]));

function dayString(offsetDaysAgo: number): string {
  return new Date(Date.now() - offsetDaysAgo * 86_400_000).toISOString().slice(0, 10).replace(/-/g, "");
}

function parseDay(day: string, text: string): DayAgg {
  const agg: DayAgg = { v: CACHE_VERSION, day, events: 0, dyads: {}, cells: {}, viol: {} };
  let start = 0;
  while (start < text.length) {
    let end = text.indexOf("\n", start);
    if (end === -1) end = text.length;
    const line = text.slice(start, end);
    start = end + 1;
    const r = line.split("\t");
    if (r.length < 58) continue;
    agg.events++;
    const mentions = Number(r[31]) || 1;
    const root = r[28];
    const quad = r[29];

    const a1 = r[7];
    const a2 = r[17];
    if (a1 && a2 && a1 !== a2) {
      const key = pairKey(a1, a2);
      if (TRACKED.has(key)) {
        const d = (agg.dyads[key] ??= { n: 0, m: 0, g: 0, t: 0, q3: 0, q4: 0 });
        d.n++;
        d.m += mentions;
        d.g += (Number(r[30]) || 0) * mentions;
        d.t += (Number(r[34]) || 0) * mentions;
        if (quad === "3") d.q3 += mentions;
        else if (quad === "4") d.q4 += mentions;
      }
    }

    // Armed conflict only: fighting / mass violence involving military or armed groups, or between
    // different countries. Plain "assault" (root 18) and police/criminal events are excluded: they
    // are mostly crime reports and would drown out war coverage in countries with heavy news volume.
    const types = [r[12], r[13], r[14], r[22], r[23], r[24]];
    const armedActor = types.some((t) => ARMED_TYPES.has(t));
    const policeCrime = types.some((t) => CIVIL_TYPES.has(t));
    const interstate = !!a1 && !!a2 && a1 !== a2;
    const armed = (root === "19" || root === "20") && (armedActor || (interstate && !policeCrime));
    if (armed) {
      const fips = r[51];
      if (fips) {
        const v = (agg.viol[fips] ??= [0, 0]);
        v[0]++;
        v[1] += mentions;
      }
      const geoType = r[49];
      const lat = Number(r[53]);
      const lon = Number(r[54]);
      if ((geoType === "3" || geoType === "4") && r[53] && r[54] && Number.isFinite(lat) && Number.isFinite(lon)) {
        const key = `${(Math.round(lat * 4) / 4).toFixed(2)},${(Math.round(lon * 4) / 4).toFixed(2)}`;
        const c = (agg.cells[key] ??= [0, 0]);
        c[0]++;
        c[1] += mentions;
      }
    }
  }
  return agg;
}

async function loadDay(day: string): Promise<DayAgg | null> {
  const cacheFile = path.join(CACHE, `${day}.json`);
  try {
    const cached = JSON.parse(await readFile(cacheFile, "utf8")) as DayAgg;
    if (cached.v === CACHE_VERSION) return cached;
  } catch {
    /* not cached */
  }
  const url = `https://data.gdeltproject.org/events/${day}.export.CSV.zip`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(180_000) });
      if (res.status === 404) return null; // that day's file is not published (yet)
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const files = unzipSync(new Uint8Array(await res.arrayBuffer()));
      const name = Object.keys(files)[0];
      const agg = parseDay(day, strFromU8(files[name]));
      await mkdir(CACHE, { recursive: true });
      await writeFile(cacheFile, JSON.stringify(agg));
      return agg;
    } catch (err) {
      if (attempt === 3) throw err;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
  return null;
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

function computeDyad(
  pair: (typeof dyadsFile.pairs)[number],
  days: DayAgg[],
  recent: Set<string>,
  asOf: string,
): Dyad {
  const key = pairKey(pair.a, pair.b);
  let n = 0, m = 0, g = 0, t = 0, q3 = 0, q4 = 0, n7 = 0;
  for (const d of days) {
    const x = d.dyads[key];
    if (!x) continue;
    n += x.n; m += x.m; g += x.g; t += x.t; q3 += x.q3; q4 += x.q4;
    if (recent.has(d.day)) n7 += x.n;
  }
  const base = { a: pair.a, b: pair.b, label: pair.label, note: "note" in pair ? pair.note : undefined, asOf };
  if (n < 100 || m === 0) return { ...base, tension: null, lowData: true, components: null };

  const goldstein = g / m;
  const tone = t / m;
  const materialShare = q4 / m;
  const conflictShare = (q3 + q4) / m;
  const rate7 = n7 / 7;
  const rate30 = n / Math.max(1, days.length);
  const surge = rate30 > 0 ? clamp01(Math.log2(Math.max(rate7 / rate30, 1e-6)) / 2) : 0;

  // Documented in /methodology. A descriptive composite of how media report the pair, not a forecast.
  const gN = (1 - goldstein / 10) / 2;
  const mN = clamp01(materialShare / 0.5);
  const tN = (1 - tone / 10) / 2;
  const tension = Math.round(100 * (0.4 * gN + 0.3 * mN + 0.15 * tN + 0.15 * surge));

  const components: DyadComponents = {
    goldstein: Math.round(goldstein * 100) / 100,
    tone: Math.round(tone * 100) / 100,
    materialShare: Math.round(materialShare * 1000) / 1000,
    conflictShare: Math.round(conflictShare * 1000) / 1000,
    surge: Math.round(surge * 100) / 100,
    events30d: n,
    events7d: n7,
  };
  return { ...base, tension, lowData: false, components };
}

export type GdeltResult = { dyads: Dyad[]; conflict: ConflictFile; counters: Counter[] };

export async function gdeltFeed(): Promise<GdeltResult> {
  const wanted = Array.from({ length: WINDOW_DAYS }, (_, i) => dayString(i + 1)); // yesterday .. 30 days ago
  const loaded: (DayAgg | null)[] = new Array(wanted.length).fill(null);
  let next = 0;
  let lastError: unknown = null;
  const worker = async () => {
    while (next < wanted.length) {
      const i = next++;
      try {
        loaded[i] = await loadDay(wanted[i]);
      } catch (e) {
        lastError = e;
      }
    }
  };
  await Promise.all([worker(), worker(), worker()]);

  const days = loaded.filter((d): d is DayAgg => d !== null);
  if (days.length < 7) throw new Error(`only ${days.length} GDELT days available${lastError ? `: ${String(lastError)}` : ""}`);

  const newest = days[0].day;
  const asOf = `${newest.slice(0, 4)}-${newest.slice(4, 6)}-${newest.slice(6, 8)}`;
  const last7 = new Set(days.slice(0, 7).map((d) => d.day));
  const prev7 = new Set(days.slice(7, 14).map((d) => d.day));

  const dyads = dyadsFile.pairs.map((p) => computeDyad(p, days, last7, asOf));

  // conflict cells: last 7 days
  const cells = new Map<string, { n: number; m: number }>();
  const viol7 = new Map<string, number>();
  let violLast = 0;
  let violPrev = 0;
  for (const d of days) {
    const inLast = last7.has(d.day);
    const inPrev = prev7.has(d.day);
    for (const [fips, v] of Object.entries(d.viol)) {
      if (inLast) {
        viol7.set(fips, (viol7.get(fips) ?? 0) + v[0]);
        violLast += v[0];
      } else if (inPrev) violPrev += v[0];
    }
    if (!inLast) continue;
    for (const [k, v] of Object.entries(d.cells)) {
      const c = cells.get(k) ?? { n: 0, m: 0 };
      c.n += v[0];
      c.m += v[1];
      cells.set(k, c);
    }
  }
  const conflict: ConflictFile = {
    generatedAt: new Date().toISOString(),
    days: days.slice(0, 7).map((d) => d.day),
    source: {
      name: "GDELT Project (event database, automatically coded from news)",
      url: "https://www.gdeltproject.org/",
      license: "Open, attribution requested",
    },
    cells: [...cells.entries()]
      .filter(([, c]) => c.n >= 3)
      .map(([k, c]) => {
        const [lat, lon] = k.split(",").map(Number);
        return { lat, lon, n: c.n, m: c.m };
      })
      .sort((a, b) => b.n - a.n)
      .slice(0, 900),
    byFips: Object.fromEntries(viol7),
  };

  const byFips = new Map(COUNTRIES.map((c) => [c.fips, c.name]));
  const top = [...viol7.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([fips, n]) => ({ label: byFips.get(fips) ?? fips, value: n.toLocaleString("en-US") }));
  const change = violPrev > 0 ? ((violLast - violPrev) / violPrev) * 100 : null;
  const counters: Counter[] = [
    {
      id: "conflict-news",
      label: "Armed conflict in the news",
      domain: "conflict",
      value: violLast.toLocaleString("en-US"),
      numeric: violLast,
      unit: "armed-conflict events reported, 7 days",
      tone: "normal",
      trend: change == null ? undefined : change > 3 ? "up" : change < -3 ? "down" : "flat",
      trendLabel: change == null ? undefined : `${change >= 0 ? "+" : ""}${change.toFixed(0)}% vs the week before`,
      note: "Count of news-reported events that GDELT's automatic coding classed as fighting or mass violence involving military or armed groups, or between countries. It measures how much armed conflict is reported, not casualties, and it still contains coding errors and duplicates. Use it for relative hotspots, not for totals.",
      asOf: asOf,
      cadence: "daily",
      source: {
        name: "GDELT Project",
        url: "https://www.gdeltproject.org/",
        license: "Open, attribution requested",
      },
      rows: top,
    },
  ];

  return { dyads, conflict, counters };
}
