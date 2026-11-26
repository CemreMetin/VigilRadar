import type { WorldFeature } from "@/core/laplace/countries";

export interface World { type: "FeatureCollection"; features: WorldFeature[] }
let pending: Promise<World> | null = null;

/** world.json, fetched once and shared by the map and the simulator (app/layout.tsx preloads it). */
export function loadWorld(): Promise<World> {
  return (pending ??= fetch("/data/static/world.json")
    .then((r) => (r.ok ? (r.json() as Promise<World>) : Promise.reject(new Error(String(r.status)))))
    .catch((e) => { pending = null; throw e; }));
}
