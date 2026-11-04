"use client";

import { useJson } from "@/lib/useJson";
import type { WorldState } from "@/lib/types";
import { KindTag, Loading } from "@/components/ui";

type Row = { iso3: string; name: string; value: number; year: number };
type Indicators = { generatedAt: string; water: Row[]; hunger: Row[]; sources: { water: string; hunger: string } };

function Bars({ rows, unit, color, max }: { rows: Row[]; unit: string; color: string; max: number }) {
  return (
    <ul className="mt-2 divide-y divide-line border border-line">
      {rows.map((r) => (
        <li key={r.iso3} className="flex items-center gap-3 px-3 py-1.5 text-body">
          <span className="w-40 shrink-0 truncate" title={r.name}>{r.name}</span>
          <span className="relative h-2 flex-1 bg-line" role="img" aria-label={`${r.name}: ${r.value}${unit}`}>
            <span className="absolute inset-y-0 left-0" style={{ width: `${Math.min(100, (r.value / max) * 100)}%`, background: color }} />
          </span>
          <span className="mono w-16 shrink-0 text-right">{r.value}{unit}</span>
          <span className="mono w-10 shrink-0 text-right text-dim">{r.year}</span>
        </li>
      ))}
    </ul>
  );
}

export default function FoodWaterModule() {
  const ind = useJson<Indicators>("/data/indicators.json");
  const world = useJson<WorldState>("/data/world_state.json");
  const choke = world.data?.counters.find((c) => c.id === "chokepoints");

  if (ind.loading || ind.error || !ind.data) return <Loading error={ind.error} />;
  const water = ind.data.water.slice(0, 12);
  const hunger = ind.data.hunger.slice(0, 12);

  return (
    <section className="mt-6" aria-label="Water and food stress">
      <div className="flex flex-wrap items-center gap-3">
        <KindTag kind="observed" />
        <span className="text-body text-dim">Most recent national figures from the World Bank (years shown). These move slowly.</span>
      </div>

      <h3 className="label mt-6">Freshwater withdrawal as % of available freshwater</h3>
      <Bars rows={water} unit="%" color="var(--accent)" max={Math.max(...water.map((r) => r.value))} />
      <p className="mt-2 text-body leading-relaxed text-dim">
        A value above 100% means withdrawals exceed renewable supply, which is possible when a country uses desalinated or
        fossil groundwater. {ind.data.sources.water}.
      </p>

      <h3 className="label mt-8">Prevalence of undernourishment (% of population)</h3>
      <Bars rows={hunger} unit="%" color="var(--conflict)" max={Math.max(...hunger.map((r) => r.value))} />
      <p className="mt-2 text-body leading-relaxed text-dim">{ind.data.sources.hunger}.</p>

      {choke && (
        <>
          <h3 className="label mt-8">Shipping chokepoints: transits vs the past year</h3>
          <ul className="mt-2 divide-y divide-line border border-line">
            {choke.rows?.map((r) => (
              <li key={r.label} className="flex items-baseline justify-between gap-3 px-3 py-1.5 text-body">
                <span>{r.label}</span>
                <span className="mono" style={{ color: r.tone === "high" ? "var(--threat)" : r.tone === "elevated" ? "var(--geo)" : "var(--fg)" }}>{r.value}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-body leading-relaxed text-dim">{choke.note}</p>
        </>
      )}
    </section>
  );
}
