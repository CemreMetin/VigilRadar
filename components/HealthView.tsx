"use client";

import Link from "next/link";
import { useJson } from "@/lib/useJson";
import type { WorldState } from "@/lib/types";
import { Card, Ext, KindTag, Loading } from "./ui";
import { PAGE_META } from "@/data/pages";
import WikiShell, { type WikiSection } from "./WikiShell";
import CounterPanel from "./CounterPanel";

export default function HealthView() {
  const { data, error, loading } = useJson<WorldState>("/data/world_state.json");

  const reports = (data?.events ?? []).filter((e) => e.domain === "health");
  // a report that names several countries appears once per country: merge by id prefix
  const unique = [...new Map(reports.map((e) => [e.id.split(":").slice(0, 2).join(":"), e])).values()];
  const counter = data?.counters.filter((c) => c.id === "outbreaks") ?? [];

  const sections: WikiSection[] = [
    { id: "reports", label: "Recent reports", group: "WHO", content: (<>
      {loading || error ? <Loading error={error} /> : (
        <>
          <div className="mt-3 border border-line">
            <CounterPanel counters={counter} today={new Date().toISOString().slice(0, 10)} />
          </div>

          <p className="label mt-6">Last 120 days</p>
          <KindTag kind="observed" />
          <ul className="mt-3 divide-y divide-line border border-line">
            {unique.length === 0 && <li className="p-3 text-sm text-dim">No reports in this window.</li>}
            {unique.map((e) => (
              <li key={e.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-3 py-2">
                <span className="min-w-0 flex-1 text-[13px]">
                  {e.url ? <Ext href={e.url}>{e.title} ↗</Ext> : e.title}
                </span>
                <span className="mono shrink-0 text-[11px] text-dim">{e.startedAt.slice(0, 10)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-dim">
            Source: <Ext href="https://www.who.int/emergencies/disease-outbreak-news">WHO Disease Outbreak News</Ext> (CC BY-NC-SA 3.0 IGO).
          </p>
        </>
      )}

    </>) },
    { id: "read", label: "How to read this", group: "Context", content: (<>
      <Card className="mt-3">
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
          <li>A report means WHO thinks an event matters internationally. Many outbreaks are never published here, and one outbreak can produce several reports.</li>
          <li>Reports do not give an outbreak&apos;s infectiousness (R₀) or fatality rate, and this site does not guess them. For those, read the report itself.</li>
          <li>On the map, each country with a report gets one marker at the country&apos;s centre, not at the outbreak location.</li>
          <li>Animal disease and wider surveillance sit in other systems: see the links below.</li>
        </ul>
      </Card>

    </>) },
    { id: "related", label: "Related", group: "Context", content: (<>
      <p className="mt-3 text-sm">
        What a fast-spreading new pathogen could do: <Link href="/scenarios/pandemic-x" className="text-accent hover:underline">Pandemic X explorer →</Link>
      </p>
    </>) },
  ];
  return (
    <WikiShell
      title="Health"
      accent="var(--bio)"
      intro={<>The World Health Organization publishes a Disease Outbreak News (DON) report when it judges an event worth international
        attention. This page lists the recent ones. It is a window onto what WHO is flagging, not a count of every outbreak in the world.</>}
      {...PAGE_META.health}
      updated={data?.generatedAt.slice(0, 10) ?? PAGE_META.health.updated}
      sections={sections}
    />
  );
}
