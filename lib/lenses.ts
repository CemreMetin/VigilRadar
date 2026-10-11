import type { Tone, WorldState } from "./types";

/**
 * The map view is organised in three strict zones:
 *   top bar   = which scenario am I looking at (mutually exclusive modes, defined here)
 *   left      = which layers of that scenario do I want on the map (LAYER_INFO / Mode.layers)
 *   right     = what does it mean and what can I do (read-only readouts, metrics, survival hub)
 * Switching mode changes the layers on offer, the camera, the colour theme and the readouts.
 */

export type LayerId =
  | "quakes"
  | "volcanoes"
  | "arsenals"
  | "plants"
  | "dyads"
  | "outbreaks"
  | "conflict"
  | "geomag"
  | "cables"
  | "tide";

export const LAYER_INFO: Record<LayerId, { label: string; blurb: string; color: string }> = {
  quakes: { label: "Earthquakes", blurb: "Magnitude 4.5+ from USGS", color: "var(--geo)" },
  volcanoes: { label: "Supervolcanoes", blurb: "Six calderas, live status", color: "var(--geo)" },
  arsenals: { label: "Arsenals", blurb: "Warheads by country (SIPRI)", color: "var(--threat)" },
  plants: { label: "Nuclear plants", blurb: "Civil power reactors, ~2019 data", color: "var(--threat)" },
  dyads: { label: "Tension pairs", blurb: "Media tension between countries", color: "var(--threat)" },
  outbreaks: { label: "WHO reports", blurb: "Marked at the country centre", color: "var(--bio)" },
  conflict: { label: "Conflict coverage", blurb: "Armed conflict in the news, 7 d", color: "var(--conflict)" },
  geomag: { label: "Geomagnetic latitude", blurb: "50° and 60° bands: storms hit hardest", color: "var(--space)" },
  cables: { label: "Submarine cables", blurb: "Cyan crosses the 50° band", color: "var(--accent)" },
  tide: { label: "Tide gauges", blurb: "Relative sea-level trend, last 30 yr (PSMSL)", color: "var(--accent)" },
};

/** "none" = no instrument measures this; the readout says so instead of showing a level. */
export type Signal = { level: Tone | "none"; label: string; basis: string };

export type Mode = {
  id: string;
  title: string;
  color: string; // CSS colour: tints the borders, the map vignette and the readout
  layers: LayerId[];
  camera: { center: [number, number]; zoom: number };
  page: string;
  pageLabel: string;
  blurb: string;
  counterIds: string[]; // metrics shown first; the first one opens by default
  stat: (w: WorldState | null) => string;
  signal: (w: WorldState | null) => Signal;
};

const counter = (w: WorldState | null, id: string) => w?.counters.find((c) => c.id === id);
const LEVEL_LABEL: Record<Tone, string> = { normal: "NOMINAL", elevated: "ELEVATED", high: "CRITICAL" };

/** One sentence built from a live metric: its value, and the threshold text its feed publishes (counter.basis). */
function describe(w: WorldState | null, id: string, fallback: string): string {
  const c = counter(w, id);
  if (!c) return fallback;
  return `${c.label} ${c.value}${c.unit ? ` ${c.unit}` : ""}. ${c.basis ?? c.trendLabel ?? ""}`.trim();
}

/** Highest status among a set of metrics. Thresholds live in the worker feeds; see /methodology. */
function fromCounters(w: WorldState | null, ids: string[], basis: (w: WorldState | null) => string): Signal {
  const order: Tone[] = ["normal", "elevated", "high"];
  let level: Tone = "normal";
  for (const id of ids) {
    const t = counter(w, id)?.tone ?? "normal";
    if (order.indexOf(t) > order.indexOf(level)) level = t;
  }
  return { level, label: LEVEL_LABEL[level], basis: basis(w) };
}

export const MODES: Mode[] = [
  {
    id: "overview",
    title: "Overview",
    color: "var(--accent)",
    layers: ["quakes", "volcanoes", "outbreaks"],
    camera: { center: [15, 22], zoom: 1.6 },
    page: "/scenarios",
    pageLabel: "All scenarios",
    blurb: "The live picture: earthquakes, the supervolcano watchlist and WHO outbreak reports. Pick a scenario above to focus.",
    counterIds: ["doomsday-clock", "warming"],
    stat: (w) => `${w?.feeds.filter((f) => f.ok).length ?? 0} feeds live`,
    signal: (w) => ({
      level: "normal",
      label: "SCANNING",
      basis: `${w?.counters.length ?? 0} metrics tracked across six domains`,
    }),
  },
  {
    id: "nuclear",
    title: "Nuclear",
    color: "var(--threat)",
    layers: ["arsenals", "plants", "dyads"],
    camera: { center: [48, 38], zoom: 1.9 },
    page: "/scenarios/nuclear-winter",
    pageLabel: "Nuclear war scenario",
    blurb: "Arsenals, power plants and the media tension between nuclear-armed pairs.",
    counterIds: ["doomsday-clock", "warheads"],
    stat: (w) => {
      const c = counter(w, "doomsday-clock");
      return c ? `${c.value} to midnight` : "Doomsday Clock";
    },
    signal: (w) => fromCounters(w, ["doomsday-clock", "warheads"], (x) => describe(x, "doomsday-clock", "Doomsday Clock")),
  },
  {
    id: "bio",
    title: "Bio",
    color: "var(--bio)",
    layers: ["outbreaks"],
    camera: { center: [20, 15], zoom: 1.5 },
    page: "/scenarios/pandemic-x",
    pageLabel: "Pandemic explorer",
    blurb: "WHO outbreak reports by country, and how a new pathogen could spread by air travel.",
    counterIds: ["outbreaks"],
    stat: (w) => {
      const c = counter(w, "outbreaks");
      return c ? `${c.value} WHO reports, 90 d` : "WHO reports";
    },
    signal: (w) => fromCounters(w, ["outbreaks"], (x) => describe(x, "outbreaks", "WHO outbreak reports")),
  },
  {
    id: "volcano",
    title: "Volcano",
    color: "var(--geo)",
    layers: ["volcanoes", "quakes"],
    camera: { center: [20, 25], zoom: 1.5 },
    page: "/scenarios/supervolcano",
    pageLabel: "Supervolcano scenario",
    blurb: "Earthquakes and the live status of six supereruption-capable calderas.",
    counterIds: [],
    stat: (w) => {
      const v = w?.volcanoes ?? [];
      const up = v.filter((x) => x.level === "elevated").length;
      return v.length ? `${up} of ${v.length} above baseline` : "Watchlist";
    },
    signal: (w) => {
      const v = w?.volcanoes ?? [];
      const up = v.filter((x) => x.level === "elevated");
      return {
        level: up.length ? "elevated" : "normal",
        label: up.length ? "ELEVATED" : "NOMINAL",
        basis: up.length ? `${up.map((x) => x.name).join(", ")} above its usual alert level` : "All watchlist calderas at their usual alert level",
      };
    },
  },
  {
    id: "conflict",
    title: "Conflict",
    color: "var(--conflict)",
    layers: ["conflict"],
    camera: { center: [42, 32], zoom: 2.2 },
    page: "/links",
    pageLabel: "How risks feed each other",
    blurb: "Armed conflict as reported in the news, and the shipping chokepoints it can disrupt.",
    counterIds: ["conflict-news", "chokepoints"],
    stat: (w) => {
      const c = counter(w, "chokepoints");
      return c ? `${c.value} chokepoints low` : "Chokepoints";
    },
    signal: (w) => fromCounters(w, ["chokepoints"], (x) => describe(x, "chokepoints", "Shipping chokepoints")),
  },
  {
    id: "solar",
    title: "Solar",
    color: "var(--space)",
    layers: ["geomag", "cables"],
    camera: { center: [-20, 52], zoom: 1.7 },
    page: "/scenarios/solar-superstorm",
    pageLabel: "Solar superstorm scenario",
    blurb: "Space weather right now. Storms are strongest near the magnetic poles, where much of the grid and many cables sit.",
    counterIds: ["kp"],
    stat: (w) => {
      const c = counter(w, "kp");
      return c ? `Kp ${c.value}` : "Space weather";
    },
    signal: (w) => fromCounters(w, ["kp"], (x) => describe(x, "kp", "Planetary Kp index")),
  },
  {
    id: "ice",
    title: "Ice & Sea",
    color: "var(--accent)",
    layers: ["tide"],
    camera: { center: [10, 30], zoom: 1.5 },
    page: "/scenarios/climate-tipping",
    pageLabel: "Tipping points",
    blurb: "Observed sea level, sea-ice extent, and published glacier and ice-sheet losses. Tide gauges show how fast the sea is rising against the land at each coast.",
    counterIds: ["sea-level", "sea-ice", "glaciers", "ice-sheets"],
    stat: (w) => {
      const c = counter(w, "sea-level");
      return c ? `${c.value} mm since 1993` : "Sea level";
    },
    signal: (w) => fromCounters(w, ["sea-level", "sea-ice"], (x) => `${describe(x, "sea-level", "Sea level")} ${counter(x, "sea-ice")?.basis ?? ""}`.trim()),
  },
  {
    id: "asteroid",
    title: "Asteroid",
    color: "var(--space)",
    layers: [],
    camera: { center: [15, 22], zoom: 1.6 },
    page: "/scenarios/asteroid",
    pageLabel: "Asteroid impact scenario",
    blurb: "Close approaches listed by NASA JPL for the next weeks, measured in Earth–Moon distances, and what the Sentry impact-monitoring table currently holds.",
    counterIds: ["asteroids"],
    stat: (w) => {
      const c = counter(w, "asteroids");
      return c ? `${c.value} ${c.unit ?? ""}`.trim() : "Close approaches";
    },
    signal: (w) => fromCounters(w, ["asteroids"], (x) => describe(x, "asteroids", "Close approaches")),
  },
];

export const MODE_BY_ID = Object.fromEntries(MODES.map((m) => [m.id, m])) as Record<string, Mode>;
