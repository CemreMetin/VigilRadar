"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { ScenarioModule } from "@/data/scenarios";

const Loading = () => <p className="mt-6 text-read text-dim">Loading…</p>;

// Map-based modules are client-only (they need WebGL), so skip server rendering for them.
const MODULES: Record<ScenarioModule, ComponentType> = {
  supervolcano: dynamic(() => import("./SupervolcanoModule"), { loading: Loading }),
  pandemic: dynamic(() => import("./PandemicModule"), { ssr: false, loading: Loading }),
  nuclear: dynamic(() => import("./NuclearModule"), { loading: Loading }),
  solar: dynamic(() => import("./SolarModule"), { ssr: false, loading: Loading }),
  asteroid: dynamic(() => import("./AsteroidModule"), { loading: Loading }),
  tipping: dynamic(() => import("./TippingModule"), { loading: Loading }),
  foodwater: dynamic(() => import("./FoodWaterModule"), { loading: Loading }),
};

export default function ModuleLoader({ module }: { module: ScenarioModule }) {
  const Module = MODULES[module];
  return <Module />;
}
