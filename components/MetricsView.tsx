"use client";

import { useJson } from "@/lib/useJson";
import type { WorldState } from "@/lib/types";
import { Loading } from "./ui";
import CounterPanel from "./CounterPanel";

/** Every counter of the old main screen, in one list. */
export default function MetricsView() {
  const { data, error, loading } = useJson<WorldState>("/data/world_state.json");
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mono text-title">Metrics</h1>
      {loading || error || !data ? (
        <Loading error={error} />
      ) : (
        <div className="mt-4 border border-line">
          <CounterPanel counters={data.counters} today={new Date().toISOString().slice(0, 10)} />
        </div>
      )}
    </main>
  );
}
