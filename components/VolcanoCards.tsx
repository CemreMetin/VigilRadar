"use client";

import { useJson } from "@/lib/useJson";
import type { LinksFile, VolcanoLevel, WorldState } from "@/lib/types";
import { Loading } from "./ui";

const LEVEL: Record<VolcanoLevel, { label: string; cls: string; mark: string }> = {
  normal: { label: "Normal", cls: "border-line-strong text-fg", mark: "○" },
  elevated: { label: "Above baseline", cls: "border-threat text-threat", mark: "▲" },
  unknown: { label: "No live feed", cls: "border-line text-dim", mark: "–" },
};

const n = (v: number) => v.toLocaleString("en-US");

/** Watchlist cards, shared by /supervolcanoes and the supervolcano scenario. */
export default function VolcanoCards() {
  const world = useJson<WorldState>("/data/world_state.json");
  const links = useJson<LinksFile>("/data/links.json");
  if (world.loading || world.error || !world.data) return <Loading error={world.error} />;

  return (
    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
      {world.data.volcanoes.map((v) => {
        const lv = LEVEL[v.level];
        const exp = links.data?.exposure[`volcano:${v.id}`];
        return (
          <li key={v.id} className="border border-line bg-panel-solid p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-read font-bold">{v.name}</h3>
              <span className={`mono shrink-0 border px-1.5 py-0.5 text-label ${lv.cls}`}>
                {lv.mark} {lv.label}
              </span>
            </div>
            <p className="mt-1 text-body text-dim">{v.levelLabel}</p>
            {v.detail && <p className="mt-2 text-body leading-relaxed text-dim">{v.detail}</p>}
            <dl className="mono mt-3 space-y-1 text-body">
              <div className="flex justify-between gap-3">
                <dt className="text-dim">Last super-eruption</dt>
                <dd className="text-right">
                  {v.lastSuperEruption.name}, ~{n(v.lastSuperEruption.yearsAgo)} yr ago (VEI {v.lastSuperEruption.vei})
                </dd>
              </div>
              {v.quakes30d && (
                <div className="flex justify-between gap-3">
                  <dt className="text-dim">Quakes, 30 days, within {v.quakes30d.radiusKm} km</dt>
                  <dd className="text-right">
                    {n(v.quakes30d.count)}
                    {v.quakes30d.maxMag != null ? ` (max M${v.quakes30d.maxMag.toFixed(1)})` : ""}
                  </dd>
                </div>
              )}
              {exp && (
                <div className="flex justify-between gap-3">
                  <dt className="text-dim">Residents of cities 15k+, within {exp.radiusKm} km</dt>
                  <dd className="text-right">{exp.population > 0 ? n(exp.population) : "none (towns and visitors not counted)"}</dd>
                </div>
              )}
            </dl>
            <p className="mono mt-3 text-body">
              <a href={v.source.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                {v.source.name} ↗
              </a>
              <span className="text-dim"> · {v.source.license}</span>
            </p>
          </li>
        );
      })}
    </ul>
  );
}
