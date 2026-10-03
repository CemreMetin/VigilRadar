import type { Metadata } from "next";
import Link from "next/link";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { DOMAIN_BY_ID } from "@/lib/domains";
import type { WorldState } from "@/lib/types";

export const metadata: Metadata = { title: "Sources · Monitoring" };

const PLANNED = [
  { name: "NASA EONET, FIRMS (storms, fires, floods) as a map layer", domain: "Climate & Water", phase: "later" },
  { name: "NSIDC sea ice, NASA sea level, Drought Monitor, GRACE-FO", domain: "Climate & Water", phase: "later" },
  { name: "ECDC and WOAH feeds (currently linked, not ingested)", domain: "Pandemic & Health", phase: "later" },
  { name: "IAEA PRIS (current reactor status, to replace the older plant dataset)", domain: "Nuclear", phase: "later" },
  { name: "ACLED and UCDP (need a registered key or token; GDELT is used meanwhile)", domain: "Conflict", phase: "if a key is added" },
  { name: "JMA alert level for Sakurajima / Aira, Toba monitoring", domain: "Geophysical", phase: "later" },
];

async function loadWorld(): Promise<WorldState | null> {
  try {
    const raw = await readFile(path.join(process.cwd(), "public", "data", "world_state.json"), "utf8");
    return JSON.parse(raw) as WorldState;
  } catch {
    return null;
  }
}

export default async function SourcesPage() {
  const world = await loadWorld();
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/" className="mono text-xs text-dim hover:text-accent">
        ← back to map
      </Link>
      <h1 className="mono mt-4 text-xl font-bold tracking-wide text-accent">Sources</h1>
      <p className="mt-2 text-sm leading-relaxed text-dim">
        Every number on this site comes from an open source listed here, with its license. This is a
        personal, ad-free project. Observations, forecasts and expert estimates will always be
        visually distinct.
      </p>

      <h2 className="label mt-8">Live feeds (as of last build)</h2>
      <div className="mt-2 divide-y divide-line border border-line">
        {world?.feeds.map((f) => (
          <div key={f.id} className="p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-block h-2 w-2"
                style={{ background: DOMAIN_BY_ID[f.domain].color }}
                aria-hidden
              />
              <a href={f.url} className="text-sm font-medium hover:text-accent" target="_blank" rel="noopener noreferrer">
                {f.name}
              </a>
              <span className={`mono text-[11px] ${f.ok ? "text-safe" : "text-threat"}`}>
                {f.ok ? "ok" : `failed: ${f.error}`}
              </span>
            </div>
            <p className="mono mt-1 text-[11px] text-dim">
              cadence {f.cadence} · {f.count} items · license: {f.license}
              {f.fetchedAt ? ` · last success ${f.fetchedAt.slice(0, 16).replace("T", " ")} UTC` : ""}
            </p>
          </div>
        )) ?? <p className="p-3 text-sm text-dim">No world_state.json found. Run npm run data.</p>}
      </div>

      <h2 id="metrics" className="label mt-8">Metrics shown in the right panel</h2>
      <div className="mt-2 divide-y divide-line border border-line">
        {world?.counters?.map((c) => (
          <div key={c.id} className="p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-block h-2 w-2"
                style={{ background: DOMAIN_BY_ID[c.domain].color }}
                aria-hidden
              />
              <span className="text-sm font-medium">{c.label}</span>
              {c.manual && <span className="label">manual</span>}
            </div>
            <p className="mono mt-1 text-[11px] text-dim">
              <a href={c.source.url} className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">
                {c.source.name} ↗
              </a>{" "}
              · {c.source.license} · as of {c.asOf.slice(0, 16).replace("T", " ")} · {c.cadence}
              {c.reviewBy ? ` · next review ${c.reviewBy}` : ""}
            </p>
          </div>
        )) ?? <p className="p-3 text-sm text-dim">No counters found.</p>}
      </div>

      <h2 className="label mt-8">Static datasets</h2>
      <ul className="mt-2 divide-y divide-line border border-line text-sm">
        <li className="p-3">Nuclear arsenals: SIPRI Yearbook 2026 (January 2026 estimates), hand-entered in data/arsenals.json.</li>
        <li className="p-3">Nuclear power plants: WRI Global Power Plant Database v1.3, CC BY 4.0. Vintage about 2019, so recent openings and closures are not reflected.</li>
        <li className="p-3">Countries (names, codes, centres): GeoNames countryInfo (CC BY 4.0) and gavinr/world-countries-centroids. Cities of 15,000+: GeoNames (CC BY 4.0).</li>
        <li className="p-3">Air-travel network for the pandemic explorer: OpenFlights (ODbL 1.0), mostly 2017 route data.</li>
        <li className="p-3">Submarine cables: TeleGeography Submarine Cable Map (CC BY-NC-SA 3.0, non-commercial use only). Power capacity by geomagnetic latitude: WRI GPPD.</li>
        <li className="p-3">Scenario references: each was checked against the Crossref record or opened; see the Methodology page.</li>
      </ul>

      <h2 className="label mt-8">Planned</h2>
      <ul className="mt-2 divide-y divide-line border border-line">
        {PLANNED.map((p) => (
          <li key={p.name} className="flex items-baseline justify-between gap-3 p-3 text-sm">
            <span>
              {p.name} <span className="text-dim">· {p.domain}</span>
            </span>
            <span className="label shrink-0">{p.phase}</span>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-xs text-dim">
        Basemap: © CARTO, © OpenStreetMap contributors. Licenses are verified per source before a
        feed goes live.
      </p>
    </div>
  );
}
