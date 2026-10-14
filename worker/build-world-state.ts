/**
 * Builds public/data/*.json from open feeds + hand-maintained values.
 *   npm run data        every feed (GDELT downloads missing days, ~7 MB each)
 *   npm run data:fast   skips the slow feeds (GDELT, World Bank) and carries their last values over
 * Cron the fast run every 5-15 min and the full run once or twice a day.
 *
 * Each feed is independent: if one fails we keep its previous events/counters and mark it not-ok,
 * so the site never goes blank because a source is down.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  Counter,
  DomainId,
  Dyad,
  FeedStatus,
  MonitorEvent,
  VolcanoStatus,
  WorldState,
} from "../lib/types";
import { climateSeries, co2Counter, CO2_URL, GISS_URL, warmingCounter } from "./feeds/climate";
import { gdeltFeed } from "./feeds/gdelt";
import { seaIceCounter, seaLevelCounter } from "./feeds/ice-sea";
import { asteroidFeed } from "./feeds/jpl";
import { portwatchCounter } from "./feeds/portwatch";
import { DON_URL, donFeed, KP_URL, kpCounter, solarFeed } from "./feeds/space-health";
import { USGS_URL, usgsQuakes } from "./feeds/usgs";
import { volcanoWatch } from "./feeds/volcanoes";
import { worldBankIndicators } from "./feeds/worldbank";
import { buildLinks } from "./links";
import arsenalsRaw from "../data/arsenals.json";
import { cycloneFeed } from "./feeds/cyclones";
import { fireFeed } from "./feeds/fires";
import { orbitFeed } from "./feeds/orbit";
import { overdueReviews } from "../lib/reviews";

const DATA_DIR = path.join(process.cwd(), "public", "data");
const OUT = path.join(DATA_DIR, "world_state.json");
const MANUAL = path.join(process.cwd(), "data", "manual-counters.json");
const FAST = process.argv.includes("--fast");

type FeedResult = {
  events?: MonitorEvent[];
  counters?: Counter[];
  volcanoes?: VolcanoStatus[];
  dyads?: Dyad[];
  /** extra JSON files to write under public/data/ (name without extension) */
  files?: Record<string, unknown>;
};

type Feed = {
  /** event ids from this feed start with "<prefix>:" (to keep old events on failure) */
  prefix?: string;
  counterIds?: string[];
  keeps?: ("volcanoes" | "dyads")[];
  slow?: boolean;
  meta: Omit<FeedStatus, "ok" | "fetchedAt" | "count" | "error">;
  run: () => Promise<FeedResult>;
};

const FEEDS: Feed[] = [
  {
    prefix: "usgs",
    meta: {
      id: "usgs-quakes",
      name: "USGS Earthquakes (M4.5+, past 7 days)",
      domain: "geophysical",
      url: USGS_URL,
      license: "Public domain (US Government work)",
      cadence: "5 min",
    },
    run: async () => ({ events: await usgsQuakes() }),
  },
  {
    counterIds: ["co2"],
    meta: { id: "noaa-co2", name: "NOAA GML Mauna Loa CO₂ (monthly)", domain: "climate", url: CO2_URL, license: "Public domain; cite NOAA GML", cadence: "monthly" },
    run: async () => ({ counters: await co2Counter() }),
  },
  {
    counterIds: ["warming"],
    meta: { id: "nasa-giss", name: "NASA GISTEMP v4 global temperature (monthly)", domain: "climate", url: GISS_URL, license: "Public domain; cite GISTEMP Team", cadence: "monthly" },
    run: async () => ({ counters: await warmingCounter() }),
  },
  {
    meta: { id: "climate-series", name: "Long climate series for /trajectory (GISS annual, CO₂ annual)", domain: "climate", url: GISS_URL, license: "Public domain; cite GISTEMP Team and NOAA GML", cadence: "monthly" },
    run: async () => ({ files: { series: await climateSeries() } }),
  },
  {
    counterIds: ["kp"],
    meta: { id: "swpc-kp", name: "NOAA SWPC planetary Kp index", domain: "space", url: KP_URL, license: "Public domain (US Government work)", cadence: "3 hours" },
    run: async () => ({ counters: await kpCounter() }),
  },
  {
    prefix: "who",
    counterIds: ["outbreaks"],
    meta: {
      id: "who-don",
      name: "WHO Disease Outbreak News",
      domain: "health",
      url: DON_URL.split("?")[0],
      license: "CC BY-NC-SA 3.0 IGO (non-commercial, attribution)",
      cadence: "daily",
    },
    run: async () => donFeed(),
  },
  {
    counterIds: ["chokepoints"],
    meta: { id: "imf-portwatch", name: "IMF PortWatch chokepoint transits", domain: "conflict", url: "https://portwatch.imf.org/", license: "Open data with attribution", cadence: "weekly" },
    run: async () => ({ counters: await portwatchCounter() }),
  },
  {
    counterIds: ["asteroids"],
    meta: { id: "jpl-cneos", name: "NASA/JPL close approaches, Sentry and Horizons directions", domain: "space", url: "https://cneos.jpl.nasa.gov/", license: "Public domain (NASA)", cadence: "daily" },
    run: async () => {
      const a = await asteroidFeed();
      return { counters: a.counters, files: { asteroids: a.file } };
    },
  },
  // fires need a free NASA FIRMS MAP_KEY in the FIRMS_MAP_KEY secret; without it the feed is not registered
  ...(process.env.FIRMS_MAP_KEY
    ? [
        {
          counterIds: ["fires"],
          meta: { id: "nasa-firms", name: "NASA FIRMS: active fire detections (VIIRS)", domain: "climate" as const, url: "https://firms.modaps.eosdis.nasa.gov/", license: "Free; acknowledge NASA FIRMS", cadence: "about every 3 hours" },
          run: async () => {
            const f = await fireFeed(process.env.FIRMS_MAP_KEY as string);
            return { counters: f.counters, files: { fires: f.file } };
          },
        },
      ]
    : []),
  {
    counterIds: ["space-scales"],
    meta: { id: "swpc-solar", name: "NOAA SWPC: aurora oval, scales, solar wind, X-rays, Kp forecast", domain: "space", url: "https://www.swpc.noaa.gov/", license: "Public domain (US Government work)", cadence: "minutes" },
    run: async () => {
      const f = await solarFeed();
      return { counters: f.counters, files: f.files };
    },
  },
  {
    counterIds: ["cyclones"],
    meta: { id: "nhc-cyclones", name: "NOAA National Hurricane Center: active tropical cyclones", domain: "climate", url: "https://www.nhc.noaa.gov/", license: "Public domain (US Government work)", cadence: "about every 6 hours" },
    run: async () => {
      const c = await cycloneFeed();
      return { counters: c.counters, files: { cyclones: c.file } };
    },
  },
  {
    counterIds: ["satellites"],
    meta: { id: "celestrak-orbit", name: "CelesTrak satellite catalogue (SGP4 positions)", domain: "space", url: "https://celestrak.org/", license: "Free; attribution, one download per group per 2 hours", cadence: "elements about every 2 hours" },
    run: async () => {
      const o = await orbitFeed();
      return { counters: o.counters, files: { orbit: o.file, orbit_elements: o.elementsFile } };
    },
  },
  {
    counterIds: ["sea-level"],
    meta: { id: "noaa-sea-level", name: "NOAA satellite altimetry: global mean sea level", domain: "climate", url: "https://www.star.nesdis.noaa.gov/socd/lsa/SeaLevelRise/", license: "Free; acknowledge NOAA Laboratory for Satellite Altimetry", cadence: "weeks, lags the present" },
    run: async () => ({ counters: await seaLevelCounter() }),
  },
  {
    counterIds: ["sea-ice"],
    meta: { id: "nsidc-sea-ice", name: "NSIDC Sea Ice Index (Arctic and Antarctic extent)", domain: "climate", url: "https://nsidc.org/data/g02135", license: "Free; cite Fetterer et al.", cadence: "daily" },
    run: async () => ({ counters: await seaIceCounter() }),
  },
  {
    keeps: ["volcanoes"],
    meta: {
      id: "volcano-watch",
      name: "Supervolcano watchlist (USGS HANS, GeoNet, INGV)",
      domain: "geophysical",
      url: "https://volcanoes.usgs.gov/",
      license: "USGS public domain; GeoNet and INGV CC BY 4.0",
      cadence: "hourly",
    },
    run: async () => ({ volcanoes: await volcanoWatch() }),
  },
  {
    slow: true,
    counterIds: ["conflict-news"],
    keeps: ["dyads"],
    meta: {
      id: "gdelt-events",
      name: "GDELT event database (tension pairs, violence in the news)",
      domain: "conflict",
      url: "https://www.gdeltproject.org/",
      license: "Open, attribution requested",
      cadence: "daily",
    },
    run: async () => {
      const g = await gdeltFeed();
      return { counters: g.counters, dyads: g.dyads, files: { conflict_cells: g.conflict } };
    },
  },
  {
    slow: true,
    meta: {
      id: "worldbank",
      name: "World Bank indicators (water stress, undernourishment)",
      domain: "climate",
      url: "https://data.worldbank.org/",
      license: "CC BY 4.0",
      cadence: "yearly data, checked daily",
    },
    run: async () => ({ files: { indicators: await worldBankIndicators() } }),
  },
  {
    counterIds: ["doomsday-clock", "warheads", "overshoot-day"],
    meta: {
      id: "manual-annual",
      name: "Hand-maintained annual values (Doomsday Clock, SIPRI, Overshoot Day)",
      domain: "nuclear",
      url: "/sources#metrics",
      license: "Cited with attribution; see each counter",
      cadence: "annual",
    },
    run: async () => {
      const raw = JSON.parse(await readFile(MANUAL, "utf8")) as {
        counters: (Omit<Counter, "manual" | "domain"> & { domain: DomainId })[];
      };
      return { counters: raw.counters.map((c) => ({ ...c, manual: true })) };
    },
  },
];

const ORDER = [
  "doomsday-clock",
  "warheads",
  "warming",
  "co2",
  "satellites",
  "cyclones",
  "space-scales",
  "fires",
  "sea-level",
  "sea-ice",
  "glaciers",
  "ice-sheets",
  "overshoot-day",
  "outbreaks",
  "pheic",
  "chokepoints",
  "conflict-news",
  "asteroids",
  "kp",
];

/** After this many hours without a newer observation a feed counts as "late". Monthly sources lag by design. */
const MAX_AGE_HOURS: Record<string, number> = {
  "usgs-quakes": 2,
  "swpc-kp": 8,
  "volcano-watch": 6,
  "jpl-cneos": 36,
  "nasa-firms": 24,
  "swpc-solar": 3,
  "nhc-cyclones": 24, // advisories come every 6 h; a quiet basin still answers
  "celestrak-orbit": 24, // elements are cached for 2 h; their epochs are typically a few hours to a day old
  "gdelt-events": 72,
  "nsidc-sea-ice": 72,
  "who-don": 24 * 30, // WHO publishes irregularly; weeks between reports are normal
  "imf-portwatch": 24 * 14,
  "noaa-co2": 24 * 75,
  "nasa-giss": 24 * 60,
  "climate-series": 24 * 60,
  "noaa-sea-level": 24 * 120,
};

type AsOf = { iso: string; precision: "time" | "day" | "month" };

/** Parse a counter's asOf ("2026-08", "2026-10-09", or a full ISO time). Month and day data count as complete at the end of the period. */
function parseAsOf(a: string): AsOf | null {
  if (/^\d{4}-\d{2}$/.test(a)) {
    const [y, m] = a.split("-").map(Number);
    return { iso: new Date(Date.UTC(y, m, 1) - 1000).toISOString(), precision: "month" };
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(a)) return { iso: `${a}T23:59:59.000Z`, precision: "day" };
  const t = new Date(a);
  return Number.isNaN(t.getTime()) ? null : { iso: t.toISOString(), precision: "time" };
}

/** Newest observation time in what a feed produced (oldest for the hand-entered feed, to be conservative). */
function freshness(feedId: string, r: FeedResult): AsOf | null {
  const found: AsOf[] = [];
  for (const e of r.events ?? []) found.push({ iso: e.updatedAt, precision: "time" });
  for (const c of r.counters ?? []) {
    const p = parseAsOf(c.asOf);
    if (p) found.push(p);
  }
  for (const v of r.volcanoes ?? []) if (v.asOf) found.push({ iso: v.asOf, precision: "time" });
  if (found.length === 0) return null;
  found.sort((a, b) => a.iso.localeCompare(b.iso));
  return feedId === "manual-annual" ? found[0] : found[found.length - 1];
}

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch {
    return null;
  }
}

async function main() {
  const previous = await readJson<WorldState>(OUT);
  const feeds: FeedStatus[] = [];
  let events: MonitorEvent[] = [];
  let counters: Counter[] = [];
  let volcanoes: VolcanoStatus[] = [];
  let dyads: Dyad[] = [];
  const files: Record<string, unknown> = {};

  const carryOver = (feed: Feed) => {
    const evs = feed.prefix ? (previous?.events.filter((e) => e.id.startsWith(`${feed.prefix}:`)) ?? []) : [];
    const cs = previous?.counters?.filter((c) => feed.counterIds?.includes(c.id)) ?? [];
    events = events.concat(evs);
    counters = counters.concat(cs);
    if (feed.keeps?.includes("volcanoes")) volcanoes = previous?.volcanoes ?? [];
    if (feed.keeps?.includes("dyads")) dyads = previous?.dyads ?? [];
    return evs.length + cs.length;
  };

  for (const feed of FEEDS) {
    const prevStatus = previous?.feeds.find((f) => f.id === feed.meta.id);

    if (FAST && feed.slow) {
      const kept = carryOver(feed);
      feeds.push(
        prevStatus
          ? { ...prevStatus, count: kept || prevStatus.count }
          : { ...feed.meta, ok: false, fetchedAt: null, count: 0, error: "slow feed not run yet (npm run data)" },
      );
      console.log(`skip ${feed.meta.id} (fast mode, kept previous values)`);
      continue;
    }

    try {
      const r = await feed.run();
      const evs = r.events ?? [];
      const cs = r.counters ?? [];
      events = events.concat(evs);
      counters = counters.concat(cs);
      if (r.volcanoes) volcanoes = r.volcanoes;
      if (r.dyads) dyads = r.dyads;
      Object.assign(files, r.files ?? {});
      const fr = freshness(feed.meta.id, r);
      feeds.push({
        ...feed.meta,
        ok: true,
        fetchedAt: new Date().toISOString(),
        dataAsOf: fr?.iso ?? null,
        asOfPrecision: fr?.precision,
        maxAgeHours: MAX_AGE_HOURS[feed.meta.id],
        count: evs.length + cs.length + (r.volcanoes?.length ?? 0) + (r.dyads?.length ?? 0),
      });
      console.log(`ok   ${feed.meta.id}: ${evs.length} events, ${cs.length} counters`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const kept = carryOver(feed);
      feeds.push({
        ...feed.meta,
        ok: false,
        fetchedAt: prevStatus?.fetchedAt ?? null,
        dataAsOf: prevStatus?.dataAsOf ?? null,
        asOfPrecision: prevStatus?.asOfPrecision,
        maxAgeHours: MAX_AGE_HOURS[feed.meta.id],
        count: kept,
        error: message,
      });
      console.warn(`FAIL ${feed.meta.id}: ${message} (kept previous values)`);
    }
  }

  events.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  counters.sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));

  const state: WorldState = {
    schema: 1,
    generatedAt: new Date().toISOString(),
    feeds,
    events,
    counters,
    volcanoes,
    dyads,
  };

  // hand-entered figures past their review date: warn here and in the CI log (the site shows a warning too)
  const today = new Date().toISOString().slice(0, 10);
  for (const o of overdueReviews(counters, arsenalsRaw, today)) {
    const msg = `${o.label} was due for review on ${o.reviewBy}; re-check ${o.source}`;
    console.warn(`REVIEW DUE ${msg}`);
    if (process.env.GITHUB_ACTIONS) console.log(`::warning title=Manual data review due::${msg}`);
  }

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(OUT, JSON.stringify(state));
  for (const [name, content] of Object.entries(files)) {
    await writeFile(path.join(DATA_DIR, `${name}.json`), JSON.stringify(content));
  }

  // link engine: spatial / actor / exposure / temporal links + country profiles
  const conflict = (files.conflict_cells as unknown) ?? (await readJson(path.join(DATA_DIR, "conflict_cells.json")));
  const linked = await buildLinks(state, conflict as never);
  await writeFile(path.join(DATA_DIR, "links.json"), JSON.stringify(linked.links));
  await writeFile(path.join(DATA_DIR, "country_profiles.json"), JSON.stringify(linked.profiles));

  console.log(
    `wrote world_state (${events.length} events, ${counters.length} counters, ${volcanoes.length} volcanoes, ${dyads.length} dyads), ` +
      `links (${linked.links.links.length}), profiles (${Object.keys(linked.profiles.countries).length})`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
