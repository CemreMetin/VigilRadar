import { SHOCKS } from "@/core/laplace/shocks";
import type { ChannelId, ImpactTier, ShockDef, SimulationResult } from "@/core/laplace/types";
import volcanoes from "@/data/supervolcanoes.json";
import { greatCircle } from "@/lib/arcs";
import { MAP } from "@/lib/palette";
import straits from "@/public/data/static/chokepoints.json";
import type { FC, Feature } from "./geojson";

// Map data of the SIMULATE mode. Pure: the map component only hands these to MapLibre.

/** One warm ramp, dark to terracotta; the legend uses the same values. Fills only. */
export const TIER_FILL: Record<ImpactTier, string> = {
  none: "#1D1B18",
  low: "#2B2722",
  moderate: "#523B29",
  high: "#964628",
  severe: "#CC4B2A",
};
export const CHANNEL_COLOR: Record<ChannelId, string> = {
  energy: MAP.gold,
  trade: MAP.cream,
  food: "#78C996",
  digital: MAP.steel,
  macro: "#F28A63",
};
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
      return part.length < 2 ? [] : [{
        type: "Feature",
        geometry: { type: "LineString", coordinates: part },
        properties: { color: CHANNEL_COLOR[a.channel], width: 1.2 + 1.4 * (a.score / 100), order: a.order },
      }];
    });
  }));
}

/** Destination telemetry pins at the landing point of every active domino arc. */
export function landingFeatures(result: SimulationResult): FC {
  return fc(result.arcs.map((a) => point(a.to[0], a.to[1], { iso3: a.iso3, order: a.order })));
}

/** Subtle 30-degree cartographic graticule behind the continents. */
export function graticuleFeatures(): FC {
  const lines: Feature[] = [];
  for (let lat = -60; lat <= 60; lat += 30) {
    lines.push({ type: "Feature", properties: { major: lat === 0 }, geometry: { type: "LineString", coordinates: [[-180, lat], [0, lat], [180, lat]] } });
  }
  for (let lon = -150; lon <= 180; lon += 30) {
    lines.push({ type: "Feature", properties: { major: lon === 0 }, geometry: { type: "LineString", coordinates: [[lon, -80], [lon, 0], [lon, 80]] } });
  }
  return fc(lines);
}

export const shockPoint = (shock: ShockDef): FC => fc([point(shock.lon, shock.lat)]);

/** The six straits; the one the shock closes is marked. */
export function straitFeatures(shock: ShockDef): FC {
  return fc(straits.chokepoints.map((c) => point(c.lon, c.lat, { active: c.key === shock.chokepointKey, icon: c.key === shock.chokepointKey ? "strait-active" : "strait-idle", name: c.name })));
}
export const volcanoFeatures = (): FC => fc(volcanoes.volcanoes.map((v) => point(v.lon, v.lat, { name: v.name })));
export const gridFeatures = (): FC =>
  fc([GRID_LAT, -GRID_LAT].map((lat): Feature => ({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [[-180, lat], [0, lat], [180, lat]] } })));

/** The shock a chokepoint leads to ("Run impact simulation"); Bab el-Mandeb belongs to the Suez corridor, Malacca has none. */
export const shockForStrait = (key: string) => SHOCKS.find((s) => s.chokepointKey === (key === "mandeb" ? "suez" : key))?.id ?? null;
