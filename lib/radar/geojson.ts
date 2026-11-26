import { PLANTS } from "@/core/build-state";
import type { Link, State } from "@/core/types";
import { greatCircle } from "@/lib/arcs";
import { circle } from "@/lib/blast";

// GeoJSON for the Radar map layers (VIGIL.md 8.2). Pure functions of the state, so they can be tested without a map.
type Geometry = { type: "Point"; coordinates: [number, number] } | { type: "LineString"; coordinates: [number, number][] } | { type: "MultiLineString"; coordinates: [number, number][][] } | { type: "Polygon"; coordinates: [number, number][][] };
export interface Feature { type: "Feature"; properties: Record<string, string | number | boolean>; geometry: Geometry }
export interface FC { type: "FeatureCollection"; features: Feature[] }
const fc = (features: Feature[]): FC => ({ type: "FeatureCollection", features });
const DAY = 86_400_000;
const KEEP_DAYS = 7;
const RING_KM = 60;

/** Quakes as points. Opacity falls with depth (0 km 0.9 to 300 km 0.35) and with age (7 days: a quarter). Small ones are drawn first. */
export function quakeFeatures(state: State, nowMs: number): FC {
  const quakes = state.quakes.filter((q) => !q.retracted).sort((a, b) => a.best.mag - b.best.mag);
  return fc(quakes.map((q) => {
    const b = q.best;
    const depth = 0.9 - 0.55 * Math.min(Math.max(b.depthKm, 0) / 300, 1);
    const age = Math.min(Math.max(nowMs - b.timeMs, 0) / (KEEP_DAYS * DAY), 1);
    return {
      type: "Feature", geometry: { type: "Point", coordinates: [b.lon, b.lat] },
      properties: { id: q.id, mag: b.mag, depth: b.depthKm, op: +(depth * (1 - 0.72 * age)).toFixed(3), recent: nowMs - b.timeMs <= DAY, place: b.place },
    };
  }));
}

export type AssetState = "idle" | "active" | "chronic";

/** For each linked asset: active when any live link points at it, chronic when all of them are chronic. */
export function assetStates(links: readonly Link[]): Map<string, AssetState> {
  const m = new Map<string, AssetState>();
  for (const l of links) if (m.get(l.toId) !== "active") m.set(l.toId, l.chronic ? "chronic" : "active");
  return m;
}

export function assetFeatures(state: State): { plants: FC; chokepoints: FC; marked: Feature[] } {
  const st = assetStates(state.links);
  const plants = PLANTS.map((p): Feature => ({ type: "Feature", geometry: { type: "Point", coordinates: [p.lon, p.lat] }, properties: { id: p.id, name: p.name, kind: "plant", state: st.get(p.id) ?? "idle" } }));
  const cps = state.chokepoints.filter((c) => c.available);
  // a chokepoint is a pair of short parallel lines
  const chokepoints = cps.map((c): Feature => ({
    type: "Feature", properties: { id: c.id, name: c.name, kind: "chokepoint", state: st.get(c.id) ?? "idle" },
    geometry: { type: "MultiLineString", coordinates: [[[c.lon - 0.4, c.lat + 0.12], [c.lon + 0.4, c.lat + 0.12]], [[c.lon - 0.4, c.lat - 0.12], [c.lon + 0.4, c.lat - 0.12]]] },
  }));
  return { plants: fc(plants), chokepoints: fc(chokepoints), marked: [...plants, ...chokepoints].filter((f) => f.properties.state !== "idle") };
}

/** Great-circle arcs from the cause to the asset, 64 steps. */
export function linkArcs(state: State): FC {
  const sites = new Map<string, { lat: number; lon: number }>();
  for (const p of PLANTS) sites.set(p.id, p);
  for (const c of state.chokepoints) sites.set(c.id, c);
  const quakes = new Map(state.quakes.map((q) => [q.id, q.best]));
  const clusters = new Map(state.conflicts.map((c) => [c.id, c]));
  const out: Feature[] = [];
  for (const l of state.links) {
    const from = l.fromKind === "quake" ? quakes.get(l.fromId) : clusters.get(l.fromId);
    const to = sites.get(l.toId);
    if (!from || !to) continue;
    for (const seg of greatCircle([from.lon, from.lat], [to.lon, to.lat], 64))
      out.push({ type: "Feature", geometry: { type: "LineString", coordinates: seg }, properties: { id: l.id, chronic: l.chronic } });
  }
  return fc(out);
}

/** Hollow squares for conflict clusters, three sizes by event count. */
export function conflictBoxes(state: State): FC {
  return fc(state.conflicts.map((c) => {
    const h = c.events < 6 ? 0.15 : c.events < 15 ? 0.25 : 0.4;
    return { type: "Feature", geometry: { type: "Polygon", coordinates: [[[c.lon - h, c.lat - h], [c.lon + h, c.lat - h], [c.lon + h, c.lat + h], [c.lon - h, c.lat + h], [c.lon - h, c.lat - h]]] }, properties: { id: c.id, events: c.events } };
  }));
}

/** Point centroids for conflict viewfinder glyphs, sized in three tiers. */
export function conflictPoints(state: State): FC {
  return fc(state.conflicts.map((c) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: [c.lon, c.lat] },
    properties: { id: c.id, events: c.events, icon: c.events < 6 ? "conflict-sm" : c.events < 15 ? "conflict-md" : "conflict-lg" },
  })));
}

/** Point centroids for maritime strait gate glyphs in LIVE mode. */
export function chokepointPoints(state: State): FC {
  const st = assetStates(state.links);
  return fc(state.chokepoints.filter((c) => c.available).map((c) => {
    const s = st.get(c.id) ?? "idle";
    return { type: "Feature", geometry: { type: "Point", coordinates: [c.lon, c.lat] }, properties: { id: c.id, name: c.name, state: s, icon: `strait-${s}` } };
  }));
}

/** Dashed frame around assets whose links are all chronic. */
export function chronicRings(state: State): FC {
  const st = assetStates(state.links);
  const sites = [...PLANTS, ...state.chokepoints.filter((c) => c.available)];
  return fc(sites.filter((s) => st.get(s.id) === "chronic").map((s) => ({ type: "Feature", geometry: { type: "Polygon", coordinates: [circle(s.lat, s.lon, RING_KM, 24)] }, properties: { id: s.id } })));
}
