import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { DOMAIN_BY_ID } from "@/lib/domains";
import FreshnessTable from "@/components/FreshnessTable";
import SiteNav from "@/components/SiteNav";
import WikiShell, { type WikiSection } from "@/components/WikiShell";
import type { WorldState } from "@/lib/types";

export const metadata: Metadata = { title: "Sources · Monitoring" };

const PLANNED = [
  { name: "NASA EONET, FIRMS (storms, fires, floods) as a map layer", domain: "Climate & Water", phase: "later" },
  { name: "Drought Monitor, GRACE-FO", domain: "Climate & Water", phase: "later" },
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
  const sections: WikiSection[] = [
    { id: "freshness", label: "Data freshness", group: "Live", content: (
      <>
      <div className="mt-2 border border-line p-3">
        <FreshnessTable />
      </div>

      </>
    ) },
    { id: "feeds", label: "Live feeds", group: "Live", content: (
      <>
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

      </>
    ) },
    { id: "metrics", label: "Metrics", group: "Live", content: (
      <>
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

      </>
    ) },
    { id: "static", label: "Static datasets", group: "Reference", content: (
      <>
      <ul className="mt-2 divide-y divide-line border border-line text-sm">
        <li className="p-3">Possible target areas (illustrative reference list): site names from the FAS Nuclear Notebook editions (United States 2025, United Kingdom 2024, French 2023, Indian 2024), coordinates printed in the FAS Russian 2023 and Chinese 2025 editions, other coordinates from Wikidata (CC0), capitals from GeoNames (CC BY 4.0). Partial and uneven by country; built by <span className="mono">scripts/build-nuclear-targets.py</span>. Effect radii: Glasstone and Dolan scaling, see Methodology.</li>
        <li className="p-3">Military bases: Wikidata (CC0), military base, airbase and naval base items with coordinates; former states hidden by default. Coverage is uneven and entries can be historical.</li>
        <li className="p-3">Country outlines for the shaded layers: Natural Earth 1:110m (public domain), simplified. BSL-4 laboratories: a partial list from English Wikipedia articles that state BSL-4 containment (CC BY-SA 4.0); the Global BioLabs Report 2023 (King&apos;s College London) gives only totals.</li>
        <li className="p-3">Places for the map search box: GeoNames cities of 100,000+ people (CC BY 4.0) and country centres. Sun and Moon positions are computed in the browser from the clock; no data source.</li>
        <li className="p-3">Nuclear arsenals: SIPRI Yearbook 2026 (January 2026 estimates), hand-entered in data/arsenals.json.</li>
        <li className="p-3">Nuclear power plants: WRI Global Power Plant Database v1.3, CC BY 4.0. Vintage about 2019, so recent openings and closures are not reflected.</li>
        <li className="p-3">Countries (names, codes, centres): GeoNames countryInfo (CC BY 4.0) and gavinr/world-countries-centroids. Cities of 15,000+: GeoNames (CC BY 4.0).</li>
        <li className="p-3">Air-travel network for the pandemic explorer: OpenFlights (ODbL 1.0), mostly 2017 route data.</li>
        <li className="p-3">Submarine cables: TeleGeography Submarine Cable Map (CC BY-NC-SA 3.0, non-commercial use only). Power capacity by geomagnetic latitude: WRI GPPD.</li>
        <li className="p-3">Scenario references: each was checked against the Crossref record or opened; see the Methodology page.</li>
      </ul>

      </>
    ) },
    { id: "planned", label: "Planned", group: "Reference", content: (
      <>
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
      </>
    ) },
  ];
  return (
    <>
      <SiteNav />
      <WikiShell
        title="Sources"
        intro="Every number on this site comes from an open source listed here, with its licence. This is a personal, ad-free project. Observations, forecasts and expert estimates are always visually distinct."
        sections={sections}
      />
    </>
  );
}
