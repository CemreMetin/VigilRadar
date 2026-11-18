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
  | "tide"
  | "bases"
  | "satellites"
  | "starlink"
  | "debris"
  | "cyclones"
  | "fires"
  | "targets"
  | "aurora"
  | "exposure"
  | "hubs"
  | "labs"
  | "cablesAll";

export const LAYER_INFO: Record<LayerId, { label: string; blurb: string; color: string }> = {
  quakes: { label: "Earthquakes", blurb: "Magnitude 4.5+ from USGS", color: "var(--geo)" },
  volcanoes: { label: "Supervolcanoes", blurb: "Six calderas, live status", color: "var(--geo)" },
  arsenals: { label: "Arsenals", blurb: "Warheads by country (SIPRI)", color: "var(--threat)" },
  plants: { label: "Nuclear plants", blurb: "Civil power reactors, ~2019 data", color: "var(--threat)" },
  dyads: { label: "Tension pairs", blurb: "Media tension between countries", color: "var(--threat)" },
  outbreaks: { label: "WHO reports", blurb: "Countries shaded by reports, last 90 days", color: "var(--bio)" },
  conflict: { label: "Conflict coverage", blurb: "Armed conflict in the news, 7 d", color: "var(--conflict)" },
  geomag: { label: "Geomagnetic latitude", blurb: "50° and 60° bands: storms hit hardest", color: "var(--space)" },
  cables: { label: "Cables at risk", blurb: "Submarine cables that cross the 50° band", color: "var(--accent)" },
  bases: { label: "Military bases", blurb: "Wikidata reference layer; not an order of battle", color: "#FFFF00" },
  satellites: { label: "Satellites", blurb: "Active, non-Starlink (CelesTrak)", color: "#00e5ff" },
  starlink: { label: "Starlink", blurb: "The largest constellation", color: "#7d8c97" },
  debris: { label: "Tracked debris", blurb: "Four major breakup events", color: "#ffb000" },
  targets: { label: "Possible target areas", blurb: "Illustrative reference sites, not a forecast", color: "var(--threat)" },
  aurora: { label: "Aurora oval", blurb: "NOAA OVATION nowcast, 30 min ahead", color: "var(--space)" },
  exposure: { label: "Grid exposure", blurb: "Share of power capacity at high geomagnetic latitude", color: "var(--space)" },
  hubs: { label: "Air-travel hubs", blurb: "How fast a new pathogen can travel", color: "var(--bio)" },
  labs: { label: "BSL-4 labs", blurb: "Partial reference list, not a risk ranking", color: "var(--bio)" },
  cablesAll: { label: "All other cables", blurb: "Those that do not cross the 50° band", color: "var(--accent)" },
  fires: { label: "Active fires", blurb: "NASA FIRMS hot pixels, 24 h, needs a key", color: "#ff6a00" },
  cyclones: { label: "Tropical cyclones", blurb: "Current position and wind (NHC)", color: "#2fd4b0" },
  tide: { label: "Tide gauges", blurb: "Relative sea-level trend, last 30 yr (PSMSL)", color: "var(--accent)" },
};

/** "none" = no instrument measures this; the readout says so instead of showing a level. */
export type Signal = { level: Tone | "none"; label: string; basis: string };

export type GroupId = "overview" | "human" | "earth" | "space";

/** Top-bar groups. Colours are CSS custom properties defined once in app/globals.css. */
export const GROUPS: { id: GroupId; title: string; color: string }[] = [
  { id: "overview", title: "Overview", color: "var(--grp-overview)" },
  { id: "human", title: "Human", color: "var(--grp-human)" },
  { id: "earth", title: "Earth", color: "var(--grp-earth)" },
  { id: "space", title: "Space", color: "var(--grp-space)" },
];
export const GROUP_BY_ID = Object.fromEntries(GROUPS.map((g) => [g.id, g])) as Record<GroupId, (typeof GROUPS)[number]>;

export type Mode = {
  id: string;
  title: string;
  group: GroupId;
  color: string; // the group's colour: tints the tab, the panel borders, the map frame and the readout
  layers: LayerId[];
  /** layers on offer but switched off when the scenario opens */
  defaultOff?: LayerId[];
  camera: { center: [number, number]; zoom: number; minZoom?: number };
  /** the scenario only makes sense on the 3D globe: the map switches to it and the 2D/3D button has no effect */
  globe?: boolean;
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

/** Zoom at which the globe is small enough to leave room for the Earth-Moon plot drawn around it. */
export const ASTEROID_ZOOM = -0.6;

const RAW_MODES: Omit<Mode, "color">[] = [
  {
    id: "overview",
    title: "Overview",
    group: "overview",
    layers: ["quakes", "volcanoes", "outbreaks"],
    camera: { center: [15, 22], zoom: 1.6 },
    page: "/library",
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
    group: "human",
    layers: ["arsenals", "plants", "dyads", "targets"],
    defaultOff: ["targets"],
    camera: { center: [48, 38], zoom: 1.9 },
    page: "/library/nuclear-winter",
    pageLabel: "Nuclear war scenario",
    blurb: "Arsenals, power plants and the media tension between nuclear-armed pairs. An opt-in layer shows illustrative reference sites and the reach of one fixed example explosion; it is a model, not a forecast.",
    counterIds: ["doomsday-clock", "warheads"],
    stat: (w) => {
      const c = counter(w, "doomsday-clock");
      return c ? `${c.value} to midnight` : "Doomsday Clock";
    },
    signal: (w) => fromCounters(w, ["doomsday-clock", "warheads"], (x) => describe(x, "doomsday-clock", "Doomsday Clock")),
  },
  {
    id: "conflict",
    title: "Conflict",
    group: "human",
    layers: ["conflict", "bases"],
    camera: { center: [42, 32], zoom: 2.2 },
    page: "/links",
    pageLabel: "How risks feed each other",
    blurb: "Armed conflict as reported in the news, the shipping chokepoints it can disrupt, and a reference layer of military bases. Fleet positions are not public data and are not shown.",
    counterIds: ["conflict-news", "chokepoints"],
    stat: (w) => {
      const c = counter(w, "chokepoints");
      return c ? `${c.value} chokepoints low` : "Chokepoints";
    },
    signal: (w) => fromCounters(w, ["chokepoints"], (x) => describe(x, "chokepoints", "Shipping chokepoints")),
  },
  {
    id: "bio",
    title: "Bio",
    group: "human",
    layers: ["outbreaks", "hubs", "labs"],
    defaultOff: ["labs"],
    camera: { center: [20, 15], zoom: 1.5 },
    page: "/library/pandemic-x",
    pageLabel: "Pandemic explorer",
    blurb: "WHO outbreak reports by country, and how a new pathogen could spread by air travel.",
    counterIds: ["outbreaks", "pheic"],
    stat: (w) => {
      const c = counter(w, "outbreaks");
      return c ? `${c.value} WHO reports, 90 d` : "WHO reports";
    },
    signal: (w) => fromCounters(w, ["outbreaks"], (x) => describe(x, "outbreaks", "WHO outbreak reports")),
  },
  {
    id: "volcano",
    title: "Volcano",
    group: "earth",
    layers: ["volcanoes", "quakes"],
    camera: { center: [20, 25], zoom: 1.5 },
    page: "/library/supervolcano",
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
    id: "weather",
    title: "Weather",
    group: "earth",
    layers: ["cyclones", "fires"],
    camera: { center: [-60, 18], zoom: 1.5 },
    page: "/library/climate-tipping",
    pageLabel: "Climate tipping points",
    blurb: "Active tropical cyclones as the US National Hurricane Center reports them right now: position, sustained wind and pressure. Its forecast tracks are not drawn, and storms outside the Atlantic and East and Central Pacific are not covered.",
    counterIds: ["cyclones", "fires"],
    stat: (w) => {
      const c = counter(w, "cyclones");
      return c ? `${c.value} active ${c.numeric === 1 ? "storm" : "storms"}` : "Cyclones";
    },
    signal: (w) => fromCounters(w, ["cyclones"], (x) => describe(x, "cyclones", "Active tropical cyclones")),
  },
  {
    id: "ice",
    title: "Ice & Sea",
    group: "earth",
    layers: ["tide"],
    camera: { center: [10, 30], zoom: 1.5 },
    page: "/library/climate-tipping",
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
    id: "solar",
    title: "Solar",
    group: "space",
    layers: ["aurora", "exposure", "geomag", "cables", "cablesAll"],
    defaultOff: ["cablesAll"],
    camera: { center: [-20, 52], zoom: 1.7 },
    page: "/library/solar-superstorm",
    pageLabel: "Solar superstorm scenario",
    blurb: "Space weather right now: the aurora oval NOAA nowcasts, the current G, S and R scales, solar wind and flares. Storms are strongest near the magnetic poles, where much of the grid and many long cables sit.",
    counterIds: ["kp", "space-scales"],
    stat: (w) => {
      const c = counter(w, "kp");
      return c ? `Kp ${c.value}` : "Space weather";
    },
    signal: (w) => fromCounters(w, ["kp"], (x) => describe(x, "kp", "Planetary Kp index")),
  },
  {
    id: "orbit",
    title: "Orbit",
    group: "space",
    layers: ["satellites", "starlink", "debris"],
    camera: { center: [0, 15], zoom: 1.4 },
    globe: true,
    page: "/library/kessler",
    pageLabel: "Kessler syndrome scenario",
    blurb: "Catalogued satellites and tracked debris, positioned from published orbital elements at the snapshot time. Starlink is drawn dim because it would otherwise hide everything else.",
    counterIds: ["satellites"],
    stat: (w) => {
      const c = counter(w, "satellites");
      return c ? `${c.value} satellites` : "Orbit";
    },
    signal: (w) => ({ level: "none", label: "TRACKING", basis: describe(w, "satellites", "Catalogue counts only.") }),
  },
  {
    id: "asteroid",
    title: "Asteroid",
    group: "space",
    layers: [],
    camera: { center: [0, 15], zoom: ASTEROID_ZOOM, minZoom: -2 },
    globe: true,
    page: "/library/asteroid",
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

/** The scenario tab colour is its group's colour. */
export const MODES: Mode[] = RAW_MODES.map((m) => ({ ...m, color: GROUP_BY_ID[m.group].color }));

/** The layers that are on when a scenario opens. */
export const defaultLayers = (m: Mode): LayerId[] => m.layers.filter((l) => !m.defaultOff?.includes(l));

export const MODE_BY_ID = Object.fromEntries(MODES.map((m) => [m.id, m])) as Record<string, Mode>;
