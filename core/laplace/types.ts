// Types of the Laplace cascade simulator (VIGIL_V2_SPEC.md 2.2). Pure data: no DOM, no fetch, no Node.
export type ShockId =
  | "hormuz"
  | "suez"
  | "taiwan"
  | "redsea-cables"
  | "blacksea"
  | "panama"
  | "volcano-vei7"
  | "solar-g5";

export type ChannelId = "energy" | "trade" | "food" | "digital" | "macro";
export type ImpactTier = "none" | "low" | "moderate" | "high" | "severe";
export type EvidenceGrade = "A" | "B" | "C";
export type Bilingual = { en: string; tr: string };

export interface ShockDef {
  id: ShockId;
  lat: number;
  lon: number;
  /** Which contextual infrastructure layer lights up on the map during this shock */
  infra: "chokepoint" | "cables" | "volcano" | "plants" | "grid";
  /** Optional link to existing /library/[id] deep-dive page */
  libraryId?: string;
  /** Optional link to live PortWatch chokepoint key */
  chokepointKey?: "hormuz" | "suez" | "mandeb" | "malacca" | "panama" | "bosporus";
  /** Relative channel weights (0..1) and timing in days */
  channels: Record<ChannelId, { weight: number; onsetDay: number; peakDay: number; persistence: number }>;
  /** Global spillover floor for non-direct countries (0..0.45) */
  globalSpillover: Partial<Record<ChannelId, number>>;
  sources: string[];
}

export type Region = "europe" | "mena" | "east-asia" | "south-asia" | "se-asia" | "north-america" | "latam" | "africa" | "oceania" | "eurasia";

export interface CountryExposure {
  iso3: string;
  /** Exact `properties.name` in `public/data/static/world.json` */
  mapName: string;
  name: Bilingual;
  region: Region;
  lat: number;
  lon: number;
  /** Calibrated structural exposure 0..1 per shock */
  shocks: Partial<Record<ShockId, Partial<Record<ChannelId, number>>>>;
  /** Concise grounded structural note per shock (optional override for top impacted countries) */
  notes?: Partial<Record<ShockId, { en: string; tr: string; source: string }>>;
}

/** A country as the engine sees it: the exposure plus whether it is one of the explicit profiles. */
export interface Country extends CountryExposure {
  profiled: boolean;
}

export interface CountryImpact {
  iso3: string;
  mapName: string;
  name: Bilingual;
  lat: number;
  lon: number;
  total: number; // 0..100
  channels: Record<ChannelId, number>; // 0..100
  dominant: ChannelId;
  tier: ImpactTier;
  order: 1 | 2 | 3; // 1 = direct physical/corridor, 2 = regional/supply, 3 = global price spillover
  peakWindowDays: [number, number];
  profiled: boolean; // true = explicit 44-country profile (Evidence B), false = universal fallback (Evidence C)
}

export interface DominoStep {
  step: 1 | 2 | 3;
  timing: Bilingual; // e.g. "Day 1–3" / "Gün 1–3"
  evidence: EvidenceGrade;
  channel: ChannelId;
  text: Bilingual;
  source: string;
}

export interface CascadeArc {
  iso3: string;
  mapName: string;
  from: [number, number]; // [lon, lat]
  to: [number, number];
  score: number; // 0..100
  channel: ChannelId;
  order: 1 | 2 | 3;
}

export interface SimulationResult {
  shock: ShockDef;
  severity: number; // 0.1..1.0
  day: number; // 1..180
  byIso3: Record<string, CountryImpact>;
  byMapName: Record<string, CountryImpact>;
  topAffected: CountryImpact[]; // sorted desc by total, top 12
  arcs: CascadeArc[]; // top 14 countries with total >= 18
  globalIndex: number; // 0..100 weighted summary
}

export interface SimQuery {
  shock: ShockId;
  severity: number; // 0.1..1.0, whole percent
  day: number; // 1..180
  country: string | null; // ISO 3166-1 alpha-3
}
