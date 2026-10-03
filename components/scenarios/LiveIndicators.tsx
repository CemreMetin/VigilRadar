"use client";

import { useJson } from "@/lib/useJson";
import type { WorldState } from "@/lib/types";
import CounterPanel from "@/components/CounterPanel";

/** The live counters that belong to a scenario (same component as the map's Metrics tab). */
export default function LiveIndicators({ ids }: { ids: string[] }) {
  const { data } = useJson<WorldState>("/data/world_state.json");
  const counters = data?.counters.filter((c) => ids.includes(c.id)) ?? [];
  if (counters.length === 0) return null;
  return (
    <div className="mt-6">
      <p className="label">Live indicators</p>
      <div className="mt-2 border border-line">
        <CounterPanel counters={counters} today={new Date().toISOString().slice(0, 10)} />
      </div>
    </div>
  );
}
