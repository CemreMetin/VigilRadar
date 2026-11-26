import type { ChannelId, ShockDef, ShockId } from "./types";

export const CHANNEL_IDS: readonly ChannelId[] = ["energy", "trade", "food", "digital", "macro"];

/** weight (0..1), onset day, peak day, share that stays after the peak */
const ch = (weight: number, onsetDay: number, peakDay: number, persistence: number) => ({ weight, onsetDay, peakDay, persistence });

/** The eight canonical shocks (VIGIL_V2_SPEC.md 2.3). Weights and timings are model constants, not measurements. */
export const SHOCKS: readonly ShockDef[] = [
  {
    id: "hormuz", lat: 26.56, lon: 56.25, infra: "chokepoint", chokepointKey: "hormuz",
    channels: { energy: ch(1, 1, 14, 0.7), trade: ch(0.7, 3, 21, 0.55), food: ch(0.6, 21, 60, 0.7), digital: ch(0.1, 7, 30, 0.3), macro: ch(0.85, 5, 30, 0.65) },
    globalSpillover: { energy: 0.3, macro: 0.3, trade: 0.15, food: 0.15 },
    sources: ["EIA", "IMF PortWatch", "IEA"],
  },
  {
    id: "suez", lat: 30.0, lon: 32.55, infra: "chokepoint", chokepointKey: "suez",
    channels: { energy: ch(0.65, 5, 25, 0.55), trade: ch(0.9, 2, 21, 0.6), food: ch(0.55, 14, 45, 0.55), digital: ch(0.05, 5, 20, 0.3), macro: ch(0.7, 10, 45, 0.6) },
    globalSpillover: { trade: 0.2, macro: 0.2, food: 0.1, energy: 0.1 },
    sources: ["IMF PortWatch", "UNCTAD", "EIA"],
  },
  {
    id: "taiwan", lat: 23.7, lon: 120.96, infra: "cables",
    channels: { energy: ch(0.15, 5, 30, 0.4), trade: ch(0.9, 2, 30, 0.7), food: ch(0.15, 30, 90, 0.5), digital: ch(1, 3, 45, 0.8), macro: ch(0.85, 7, 60, 0.75) },
    globalSpillover: { digital: 0.35, trade: 0.25, macro: 0.3 },
    sources: ["SIA", "UN Comtrade", "TeleGeography"],
  },
  {
    id: "redsea-cables", lat: 12.6, lon: 43.3, infra: "cables", chokepointKey: "mandeb",
    channels: { energy: ch(0.1, 3, 14, 0.3), trade: ch(0.35, 2, 14, 0.35), food: ch(0.05, 7, 30, 0.3), digital: ch(0.95, 1, 7, 0.35), macro: ch(0.55, 1, 14, 0.35) },
    globalSpillover: { digital: 0.15, macro: 0.1, trade: 0.05 },
    sources: ["TeleGeography", "ICPC"],
  },
  {
    id: "blacksea", lat: 41.12, lon: 29.07, infra: "chokepoint", chokepointKey: "bosporus",
    channels: { energy: ch(0.65, 3, 21, 0.6), trade: ch(0.6, 2, 18, 0.55), food: ch(1, 5, 30, 0.7), digital: ch(0.05, 5, 20, 0.3), macro: ch(0.7, 10, 45, 0.6) },
    globalSpillover: { food: 0.25, macro: 0.2, energy: 0.15, trade: 0.05 },
    sources: ["FAO", "IMF PortWatch", "UN Comtrade"],
  },
  {
    id: "panama", lat: 9.08, lon: -79.9, infra: "chokepoint", chokepointKey: "panama",
    channels: { energy: ch(0.5, 7, 30, 0.45), trade: ch(0.85, 3, 30, 0.5), food: ch(0.6, 10, 45, 0.5), digital: ch(0.02, 7, 30, 0.3), macro: ch(0.5, 14, 60, 0.5) },
    globalSpillover: { trade: 0.12, macro: 0.1, food: 0.08, energy: 0.05 },
    sources: ["Panama Canal Authority", "IMF PortWatch", "UNCTAD"],
  },
  {
    id: "volcano-vei7", lat: -8.25, lon: 118.0, infra: "volcano", libraryId: "supervolcano",
    channels: { energy: ch(0.6, 45, 150, 0.75), trade: ch(0.75, 1, 14, 0.3), food: ch(1, 30, 150, 0.85), digital: ch(0.2, 1, 14, 0.3), macro: ch(0.8, 21, 120, 0.8) },
    globalSpillover: { food: 0.4, macro: 0.35, energy: 0.25, trade: 0.2 },
    sources: ["Robock (2000)", "Raible et al. (2016)", "FAO"],
  },
  {
    id: "solar-g5", lat: 62.0, lon: 0.0, infra: "grid", libraryId: "solar-superstorm",
    channels: { energy: ch(1, 1, 7, 0.55), trade: ch(0.6, 1, 10, 0.35), food: ch(0.25, 7, 30, 0.4), digital: ch(0.95, 1, 3, 0.35), macro: ch(0.7, 3, 30, 0.55) },
    globalSpillover: { digital: 0.35, macro: 0.2, trade: 0.2, energy: 0.05, food: 0.05 },
    sources: ["NOAA SWPC", "Lloyd's / AER", "USGS Geomagnetism"],
  },
];

export const SHOCK_IDS: readonly ShockId[] = SHOCKS.map((s) => s.id);
export const shockById = (id: ShockId): ShockDef => SHOCKS.find((s) => s.id === id)!;
