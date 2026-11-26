import { SHOCKS } from "@/core/laplace/shocks";
import type { ChannelId, ImpactTier, ShockDef, SimulationResult } from "@/core/laplace/types";
import volcanoes from "@/data/supervolcanoes.json";
import { greatCircle } from "@/lib/arcs";
import { COLOR } from "@/lib/palette";
import straits from "@/public/data/static/chokepoints.json";
import type { FC, Feature } from "./geojson";

// Map data of the SIMULATE mode. Pure: the map component only hands these to MapLibre.

/** Matte choropleth scale; the legend uses the same values. Fills only: several are too dark to be text colours. */
export const TIER_FILL: Record<ImpactTier, string> = { none: COLOR.land, low: "#1d2b38", moderate: "#7a4a0b", high: "#b84309", severe: "#b51636" };
export const CHANNEL_COLOR: Record<ChannelId, string> = { energy: COLOR.geo, trade: COLOR.accent, food: COLOR.safe, digital: COLOR.space, macro: COLOR.conflict };
const ARC_STEPS = 48;
const GRID_LAT = 50;

const fc = (features: Feature[]): FC => ({ type: "FeatureCollection", features });
const point = (lon: number, lat: number, properties: Feature["properties"] = {}): Feature => ({ type: "Feature", properties, geometry: { type: "Point", coordinates: [lon, lat] } });

/** `fill-color` for the countries layer. Only the paint changes while the sliders move; the geometry is loaded once. */
export function fillExpression(result: SimulationResult): string | unknown[] {
  const byTier = new Map<ImpactTier, string[]>();
  for (const i of Object.values(result.byMapName)) if (i.tier !== "none") byTier.set(i.tier, [...(byTier.get(i.tier) ?? []), i.mapName]);
  if (byTier.size === 0) return TIER_FILL.none; // `match` needs at least one branch
  return ["match", ["get", "name"], ...[...byTier].flatMap(([tier, names]) => [names, TIER_FILL[tier]]), TIER_FILL.none];
}

/** Great-circle arcs from the shock to the most affected countries; `progress` (0..1] draws them out from the shock. */
export function arcFeatures(result: SimulationResult, progress = 1): FC {
  return fc(result.arcs.flatMap((a) => {
    const segments = greatCircle(a.from, a.to, ARC_STEPS);
    let left = Math.max(2, Math.ceil(segments.reduce((n, s) => n + s.length, 0) * progress));
    return segments.flatMap((s): Feature[] => {
      const part = s.slice(0, Math.max(0, left));
      left -= s.length;
      return part.length < 2 ? [] : [{ type: "Feature", geometry: { type: "LineString", coordinates: part }, properties: { color: CHANNEL_COLOR[a.channel], width: 1 + 1.5 * (a.score / 100) } }];
    });
  }));
}

export const shockPoint = (shock: ShockDef): FC => fc([point(shock.lon, shock.lat)]);

/** The six straits; the one the shock closes is marked. */
export function straitFeatures(shock: ShockDef): FC {
  return fc(straits.chokepoints.map((c) => point(c.lon, c.lat, { active: c.key === shock.chokepointKey, name: c.name })));
}
export const volcanoFeatures = (): FC => fc(volcanoes.volcanoes.map((v) => point(v.lon, v.lat, { name: v.name })));
export const gridFeatures = (): FC =>
  fc([GRID_LAT, -GRID_LAT].map((lat): Feature => ({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [[-180, lat], [0, lat], [180, lat]] } })));

/** The shock a chokepoint leads to ("Simulate in Laplace"); Bab el-Mandeb belongs to the Suez corridor, Malacca has none. */
export const shockForStrait = (key: string) => SHOCKS.find((s) => s.chokepointKey === (key === "mandeb" ? "suez" : key))?.id ?? null;
