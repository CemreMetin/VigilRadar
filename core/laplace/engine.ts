import { STEP_COPY, dayRange } from "./copy";
import { CHANNEL_IDS, SHOCK_IDS, shockById } from "./shocks";
import type { CascadeArc, ChannelId, Country, CountryImpact, DominoStep, ImpactTier, ShockDef, ShockId, SimQuery, SimulationResult } from "./types";

const EARLY = 0.08; // market anticipation before the physical effect arrives
const DECAY_DAYS = 90;
const TOP = 12;
const ARCS = 14;
const ARC_MIN = 18;
export const MAX_DAY = 180;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Share of a channel's full effect on a given day: a faint early signal, an S-curve to the peak, then repair or persistence. */
export function waveFactor(day: number, onsetDay: number, peakDay: number, persistence: number): number {
  if (day < onsetDay) return EARLY * (day / Math.max(1, onsetDay));
  if (day <= peakDay) {
    const x = peakDay > onsetDay ? (day - onsetDay) / (peakDay - onsetDay) : 1;
    return EARLY + (1 - EARLY) * x * x * (3 - 2 * x);
  }
  return persistence + (1 - persistence) * Math.exp(-(day - peakDay) / DECAY_DAYS);
}

export const tierOf = (total: number): ImpactTier => (total >= 75 ? "severe" : total >= 55 ? "high" : total >= 30 ? "moderate" : total >= 12 ? "low" : "none");

/** Structural exposure of a country to one channel of a shock: its own figure, never below the global floor. */
const exposure = (c: Country, s: ShockDef, ch: ChannelId) => Math.max(c.shocks[s.id]?.[ch] ?? 0, s.globalSpillover[ch] ?? 0);

/** Channels from the most to the least affected, by structure alone (day and severity do not change the order). */
const ranked = (c: Country, s: ShockDef) =>
  CHANNEL_IDS.map((ch) => ({ ch, strength: exposure(c, s, ch) * s.channels[ch].weight })).sort((a, b) => b.strength - a.strength);

function orderOf(c: Country, s: ShockDef): 1 | 2 | 3 {
  const strongest = Math.max(...CHANNEL_IDS.map((ch) => exposure(c, s, ch)));
  return strongest >= 0.65 ? 1 : strongest >= 0.4 ? 2 : 3;
}

function impact(c: Country, s: ShockDef, severity: number, day: number): CountryImpact {
  const channels = {} as Record<ChannelId, number>;
  for (const ch of CHANNEL_IDS) {
    const d = s.channels[ch];
    channels[ch] = Math.round(100 * clamp(exposure(c, s, ch) * d.weight * severity * waveFactor(day, d.onsetDay, d.peakDay, d.persistence), 0, 1));
  }
  const sorted = [...CHANNEL_IDS].sort((a, b) => channels[b] - channels[a]);
  const top3 = (channels[sorted[0]] + channels[sorted[1]] + channels[sorted[2]]) / 3;
  // the worst channel leads, so a country hit very hard through one channel is not averaged away
  const total = Math.round(0.55 * channels[sorted[0]] + 0.45 * top3);
  const peaks = ranked(c, s).slice(0, 3).map(({ ch }) => s.channels[ch].peakDay);
  return {
    iso3: c.iso3, mapName: c.mapName, name: c.name, lat: c.lat, lon: c.lon,
    total, channels, dominant: sorted[0], tier: tierOf(total), order: orderOf(c, s),
    peakWindowDays: [Math.min(...peaks), Math.max(...peaks)], profiled: c.profiled,
  };
}

export function simulate(input: { shock: ShockId; severity: number; day: number }, countries: readonly Country[]): SimulationResult {
  const shock = shockById(input.shock);
  const severity = clamp(input.severity, 0.1, 1);
  const day = clamp(Math.round(input.day), 1, MAX_DAY);
  const all = countries.map((c) => impact(c, shock, severity, day));
  const sorted = [...all].sort((a, b) => b.total - a.total || a.iso3.localeCompare(b.iso3));
  const arcs: CascadeArc[] = sorted.filter((i) => i.total >= ARC_MIN).slice(0, ARCS).map((i) => ({
    iso3: i.iso3, mapName: i.mapName, from: [shock.lon, shock.lat], to: [i.lon, i.lat], score: i.total, channel: i.dominant, order: i.order,
  }));
  const key = all.filter((i) => i.profiled); // the world index is the mean over the profiled key economies
  return {
    shock, severity, day,
    byIso3: Object.fromEntries(all.map((i) => [i.iso3, i])),
    byMapName: Object.fromEntries(all.map((i) => [i.mapName, i])),
    topAffected: sorted.slice(0, TOP),
    arcs,
    globalIndex: key.length ? Math.round(key.reduce((sum, i) => sum + i.total, 0) / key.length) : 0,
  };
}

/** The three channels that matter most to this country, told in the order in which they arrive. */
export function dominoChain(shockId: ShockId, c: Country): DominoStep[] {
  const shock = shockById(shockId);
  const chosen = ranked(c, shock).slice(0, 3).map((r) => r.ch)
    .sort((a, b) => shock.channels[a].onsetDay - shock.channels[b].onsetDay || shock.channels[a].peakDay - shock.channels[b].peakDay);
  const note = c.notes?.[shockId];
  return chosen.map((channel, i): DominoStep => {
    const { onsetDay, peakDay } = shock.channels[channel];
    const [en, tr, source] = STEP_COPY[shockId][channel];
    const documented = i === 0 && note; // a documented structural fact opens the chain and is the only grade A text
    return {
      step: (i + 1) as 1 | 2 | 3,
      timing: dayRange(onsetDay, peakDay),
      evidence: documented ? "A" : c.profiled ? "B" : "C",
      channel,
      text: documented ? { en: `${note.en} ${en}`, tr: `${note.tr} ${tr}` } : { en, tr },
      source: documented && note.source !== source ? `${note.source} · ${source}` : source,
    };
  });
}

const DEFAULTS = { shock: "hormuz" as ShockId, severity: 0.75, day: 30 };

export function encodeSimQuery(q: SimQuery): string {
  const p = new URLSearchParams({ mode: "sim", shock: q.shock, sev: String(Math.round(q.severity * 100)), day: String(q.day) });
  if (q.country) p.set("country", q.country);
  return `?${p}`;
}

/** Reads the query string; anything missing or out of range falls back to the safe default. */
export function decodeSimQuery(search: string): SimQuery {
  const p = new URLSearchParams(search);
  const int = (key: string, lo: number, hi: number, fallback: number) => {
    const v = Number(p.get(key) || NaN);
    return Number.isInteger(v) && v >= lo && v <= hi ? v : fallback;
  };
  const shock = p.get("shock") as ShockId;
  const country = p.get("country")?.toUpperCase() ?? "";
  return {
    shock: SHOCK_IDS.includes(shock) ? shock : DEFAULTS.shock,
    severity: int("sev", 10, 100, DEFAULTS.severity * 100) / 100,
    day: int("day", 1, MAX_DAY, DEFAULTS.day),
    country: /^[A-Z]{3}$/.test(country) ? country : null,
  };
}
