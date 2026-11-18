export type QuakeSource = "usgs" | "emsc" | "afad" | "kandilli";
export type PagerAlert = "green" | "yellow" | "orange" | "red";

export interface QuakeEvent {
  source: QuakeSource;
  sourceId: string;
  timeMs: number; // UTC
  lat: number;
  lon: number;
  depthKm: number;
  mag: number;
  magType?: string;
  place: string;
  pagerAlert?: PagerAlert;
  usgsTsunami?: boolean;
  updatedMs: number;
}

export interface MergedQuake {
  id: string; // source:sourceId of the first seen member, never changes
  sources: QuakeEvent[]; // latest record per source
  best: QuakeEvent; // fields taken by source priority
  firstSeenMs: number;
  retracted?: boolean;
}

export interface Province { code: string; name: string; lat: number; lon: number; coastal: boolean }
export interface Site { id: string; name: string; lat: number; lon: number } // nuclear plant or chokepoint

export type Severity = "P0" | "P1" | "P2";
export type LinkKind = "quake" | "conflict";
export type LinkTarget = "plant" | "chokepoint";
export interface Link {
  id: string;
  fromKind: LinkKind;
  fromId: string;
  toKind: LinkTarget;
  toId: string;
  distanceKm: number;
  rule: `${LinkKind}→${LinkTarget}`;
  startedMs: number;
  chronic: boolean;
}

export type TsunamiLevel = "warning" | "advisory" | "watch" | "info";
export interface TsunamiBulletin { level: TsunamiLevel; timeMs: number; lat: number; lon: number; title: string }

/** One row of a GDELT 2.0 export, already picked apart by the slow-lane script. */
export interface GdeltRow {
  id: string;
  rootCode: string;
  baseCode: string;
  geoType: number;
  lat: number;
  lon: number;
  fullName: string;
  sourceUrl: string;
  numSources: number;
  dateAddedMs: number;
}
export interface ConflictCluster {
  id: string; // grid cell
  lat: number;
  lon: number;
  label: string;
  events: number;
  domains: number;
  lastSeenMs: number;
  sampleUrls: string[];
}

export interface DailyCount { date: string; count: number } // date: YYYY-MM-DD
export type FlowState = "normal" | "deviation" | "severe" | "stale";
export interface FlowResult { state: FlowState; dev: number | null; recent: number | null; baseline: number | null; lastDate: string | null }

export type Level = "STALE" | "CRITICAL" | "ELEVATED" | "NOMINAL";
export type StatusReason =
  | { kind: "stale"; lastHeartbeatMs: number | null }
  | { kind: "quake"; quakeId: string; mag: number; place: string; timeMs: number }
  | { kind: "pager"; quakeId: string; alert: PagerAlert; mag: number; place: string; timeMs: number }
  | { kind: "tsunami"; level: TsunamiLevel; title: string; timeMs: number }
  | { kind: "link"; linkId: string; rule: Link["rule"] }
  | { kind: "chokepoint"; id: string; state: FlowState }
  | { kind: "province-severity"; quakeId: string; severity: Severity; mag: number; place: string; timeMs: number }
  | { kind: "province-tsunami"; quakeId: string; mag: number; place: string; timeMs: number };
export interface StatusResult { level: Level; reason: StatusReason | null }

export interface ChokepointFlow {
  id: string; name: string; lat: number; lon: number;
  recent: number | null; baseline: number | null; dev: number | null;
  level: FlowState; dataThrough: string | null; available: boolean;
}
export type SourceKey = QuakeSource | "tsunami";
export interface SourceStatus { ok: boolean; ms: number } // ms: last successful fetch

/** What GET /v1/state returns (VIGIL.md 6.4). `reasonDetail` is an addition: the structured form of `reason`. */
export interface State {
  v: 1;
  generatedMs: number;
  fastMs: number;
  sources: Record<SourceKey, SourceStatus>;
  quakes: MergedQuake[];
  tsunami: TsunamiBulletin[];
  conflicts: ConflictCluster[];
  conflictsMs: number | null;
  chokepoints: ChokepointFlow[];
  links: Link[];
  global: { level: Level; reason: string | null; reasonDetail?: StatusReason | null };
  provinceLevels: Record<string, Record<string, Severity>>;
}
