export type DomainId =
  | "nuclear"
  | "health"
  | "climate"
  | "geophysical"
  | "space"
  | "conflict";

export type SourceRef = { name: string; url: string; license: string };

export type MonitorEvent = {
  id: string; // "<source>:<native_id>"
  domain: DomainId;
  kind: string; // 'quake', 'outbreak', ...
  title: string;
  severity: 0 | 1 | 2 | 3 | 4;
  magnitude?: number;
  depthKm?: number;
  lat: number;
  lon: number;
  countries: string[]; // ISO3, filled by the link engine later
  startedAt: string; // ISO UTC
  updatedAt: string;
  url?: string;
  source: SourceRef;
};

export type FeedStatus = {
  id: string;
  name: string;
  domain: DomainId;
  url: string;
  license: string;
  cadence: string;
  ok: boolean;
  fetchedAt: string | null; // last successful fetch
  /** newest observation time in the data this feed produced (ISO, UTC); month data is end of month */
  dataAsOf?: string | null;
  /** how precisely the source states its time */
  asOfPrecision?: "time" | "day" | "month";
  /** data older than this is "late" for this feed (hours); monthly sources lag by design */
  maxAgeHours?: number;
  count: number;
  error?: string;
};

export type Tone = "normal" | "elevated" | "high";

export type CounterRow = { label: string; value: string; tone?: Tone };

export type Counter = {
  id: string;
  label: string;
  domain: DomainId;
  value: string; // display value, e.g. "427.6"
  unit?: string; // e.g. "ppm"
  numeric?: number;
  tone?: Tone;
  trend?: "up" | "down" | "flat";
  trendLabel?: string; // e.g. "+2.4 ppm vs a year ago"
  note?: string; // honest caveat shown when expanded
  basis?: string; // how the tone is decided (thresholds), shown next to the scenario signal
  asOf: string; // ISO date/time or YYYY-MM
  cadence: string;
  manual?: boolean; // hand-maintained annual value
  reviewBy?: string; // manual counters: when to re-check the source
  eventDate?: string; // manual counters about a dated event: the readout shows the days since
  source: SourceRef;
  history?: number[]; // optional sparkline
  rows?: CounterRow[]; // optional expandable detail list
  href?: string; // internal page with more detail
};

export type VolcanoLevel = "normal" | "elevated" | "unknown";

export type VolcanoStatus = {
  id: string;
  name: string;
  country: string; // ISO3
  lat: number;
  lon: number;
  lastSuperEruption: { name: string; yearsAgo: number; vei: string };
  level: VolcanoLevel;
  levelLabel: string; // e.g. "Normal (USGS: GREEN)"
  detail?: string;
  asOf?: string;
  live: boolean; // true when status comes from a live feed
  quakes30d?: { count: number; maxMag: number | null; radiusKm: number; minMag: number };
  source: SourceRef;
};

export type DyadComponents = {
  goldstein: number; // mention-weighted mean, -10 (hostile) .. +10 (cooperative)
  tone: number; // mention-weighted mean media tone
  materialShare: number; // share of mentions that are material conflict (CAMEO quad 4)
  conflictShare: number; // verbal + material conflict
  surge: number; // 0..1, last-7-day event rate vs 30-day average
  events30d: number;
  events7d: number;
};

/** Why a pair is on the map at all. Shown wherever the edge is drawn. */
export type DyadBasis = "both-nuclear" | "nuclear-vs-neighbour" | "war-with-nuclear-state" | "threshold-state";

export type Dyad = {
  a: string; // ISO3
  b: string;
  label: string;
  note?: string;
  basis?: DyadBasis;
  why?: string; // one sentence: the inclusion reason
  sensitive?: boolean; // politically sensitive: inclusion is contestable, read the reason

  tension: number | null; // 0-100, null when too little data
  lowData: boolean;
  components: DyadComponents | null;
  asOf: string;
};

export type WorldState = {
  schema: 1;
  generatedAt: string;
  feeds: FeedStatus[];
  events: MonitorEvent[];
  counters: Counter[];
  volcanoes: VolcanoStatus[];
  dyads: Dyad[];
};

export type Country = {
  iso2: string;
  iso3: string;
  fips: string;
  name: string;
  continent: string;
  population: number;
  lat: number;
  lon: number;
};

export type ConflictCell = { lat: number; lon: number; n: number; m: number };
export type ConflictFile = {
  generatedAt: string;
  days: string[];
  source: SourceRef;
  cells: ConflictCell[];
  /** armed-conflict events reported in the last 7 days, by GDELT (FIPS) country code */
  byFips: Record<string, number>;
};

export type LinkType = "spatial" | "actor" | "exposure" | "temporal" | "causal";
export type EvidenceLevel = "strong" | "moderate" | "speculative";

export type Link = {
  id: string;
  from: string; // entity id: event id, "plant:<id>", "volcano:<id>", "country:<ISO3>", "dyad:<A>|<B>", "cell:<lat>,<lon>"
  to: string;
  type: LinkType;
  computed: boolean; // true = produced by the link engine, false = hand-curated
  label: string;
  distanceKm?: number;
};

export type LinksFile = {
  generatedAt: string;
  rules: { spatial: string[]; exposure: string; temporal: string };
  links: Link[];
  /** residents of cities of 15,000+ within radiusKm of an event or volcano (a lower bound) */
  exposure: Record<string, { radiusKm: number; population: number }>;
};

export type CountryProfile = {
  iso3: string;
  name: string;
  population: number;
  lat: number;
  lon: number;
  arsenal?: { stockpile: number; inventory: number; deployed: number };
  dyads: { other: string; label: string; tension: number | null }[];
  plants?: { count: number; mw: number };
  outbreaks: { title: string; date: string; url?: string }[];
  violence7d?: number;
  volcanoes: { id: string; name: string; level: VolcanoLevel }[];
  water?: { value: number; year: number };
  hunger?: { value: number; year: number };
  /** domains that show activity at the same time in this country: co-occurrence, not causation */
  signals: string[];
};

export type ProfilesFile = {
  generatedAt: string;
  note: string;
  countries: Record<string, CountryProfile>;
};

export type ArsenalCountry = {
  iso3: string;
  name: string;
  deployed: number;
  stored: number;
  stockpile: number;
  retired: number;
  inventory: number;
  centroid: [number, number]; // lon, lat of the country centroid (not a base location)
};

export type Arsenals = {
  asOf: string;
  reviewBy: string; // hand-entered: re-check the source after this date
  publishedAt: string;
  source: SourceRef;
  definitions: Record<string, string>;
  notes: string[];
  countries: ArsenalCountry[];
  totals: { deployed: number; stored: number; stockpile: number; retired: number; inventory: number };
};

export type Plant = {
  id: string;
  name: string;
  iso3: string;
  country: string;
  mw: number;
  lat: number;
  lon: number;
  year: number | null;
};

export type PlantsFile = { source: SourceRef; vintage: string; plants: Plant[] };

export type AsteroidApproach = {
  des: string;
  date: string; // "2026-Oct-31 12:01" (UTC), as JPL writes it
  ld: number; // miss distance in lunar distances
  kms: number; // relative speed, km/s
  h: number | null; // absolute magnitude
  dMinM: number | null; // rough diameter range in metres from H (albedo 0.25 .. 0.05)
  dMaxM: number | null;
  /** geocentric direction at closest approach from JPL Horizons (degrees); absent when Horizons did not answer */
  raDeg?: number;
  decDeg?: number;
};

export type AsteroidsFile = {
  generatedAt: string;
  windowDays: number;
  maxLd: number;
  approaches: AsteroidApproach[];
  sentry: { tracked: number; torinoAbove0: number } | null;
  source: SourceRef;
};

export type TideGaugesFile = {
  source: SourceRef;
  note: string;
  fields: string[];
  stations: [number, string, number, number, number, number, number][]; // id, name, lat, lon, mm/yr, years, last year
};

export type OrbitFile = {
  generatedAt: string; // the snapshot time: every position is for this instant
  kinds: string[];
  fields: string[];
  counts: { satellites: number; starlink: number; debris: number };
  stations: [string, number, number, number][]; // name, lon, lat, altitude km
  objects: ([number, number, number, number] | [number, number, number, number, string])[]; // lon, lat, altitude km, kind index, (name for stations)
  source: SourceRef;
};

export type OrbitElementsFile = {
  generatedAt: string;
  /** CelesTrak GP (OMM JSON) records for the few objects the pass finder offers */
  objects: Record<string, unknown>[];
  source: SourceRef;
};

export type FiresFile = {
  generatedAt: string;
  windowHours: number;
  total: number;
  cells: [number, number, number, number][]; // lat, lon, detections, strongest FRP (MW)
  source: SourceRef;
};

export type CyclonesFile = {
  generatedAt: string;
  storms: {
    id: string;
    name: string;
    cls: string; // NHC classification: TD, TS, HU, STD, STS, PTC ...
    windKt: number;
    pressureMb: number | null;
    lat: number;
    lon: number;
    dir: number | null; // movement direction, degrees
    speedKt: number | null;
    updated: string;
    url: string;
  }[];
  source: SourceRef;
};

export type MilitaryBasesFile = {
  source: SourceRef;
  retrieved: string;
  note: string;
  fields: string[];
  bases: [string, string, number, number, string, string][]; // id, name, lat, lon, country, kind
};

export type TargetsFile = {
  model: "illustrative";
  note: string;
  fields: string[];
  categories: string[];
  retrieved: string;
  sites: [string, number, number, string, string, string, string][]; // name, lat, lon, category, country, role, source
};

export type BslLabsFile = {
  source: SourceRef;
  context: { name: string; url: string; text: string };
  note: string;
  retrieved: string;
  fields: string[];
  labs: [string, number, number, string, string, string][]; // name, lat, lon, country, source url, statement
};

export type SolarNow = {
  generatedAt: string;
  scales: { G: { n: number; text: string }; S: { n: number; text: string }; R: { n: number; text: string } } | null;
  wind: { speed: number; density: number | null; speedHistory: number[]; asOf: string } | null;
  bz: { value: number; bt: number | null; history: number[]; asOf: string } | null;
  xray: { current: string; peak24h: string; peakAt: string; asOf: string } | null;
  kpForecast: { time: string; kp: number; kind: string }[] | null;
  source: SourceRef;
};

export type AuroraFile = { generatedAt: string; observed: string; forecast: string; points: [number, number, number][]; source: SourceRef };
