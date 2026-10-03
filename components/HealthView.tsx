"use client";

import Link from "next/link";
import { useJson } from "@/lib/useJson";
import type { WorldState } from "@/lib/types";
import { Card, Ext, H1, H2, KindTag, Lead, Loading } from "./ui";
import CounterPanel from "./CounterPanel";

export default function HealthView() {
  const { data, error, loading } = useJson<WorldState>("/data/world_state.json");

  const reports = (data?.events ?? []).filter((e) => e.domain === "health");
  // a report that names several countries appears once per country: merge by id prefix
  const unique = [...new Map(reports.map((e) => [e.id.split(":").slice(0, 2).join(":"), e])).values()];
  const counter = data?.counters.filter((c) => c.id === "outbreaks") ?? [];

  return (
    <>
      <H1 color="var(--bio)">Health</H1>
      <Lead>
        The World Health Organization publishes a Disease Outbreak News (DON) report when it judges an event worth international
        attention. This page lists the recent ones. It is a window onto what WHO is flagging, not a count of every outbreak in the world.
      </Lead>

      {loading || error ? <Loading error={error} /> : (
        <>
          <div className="mt-6 border border-line">
            <CounterPanel counters={counter} today={new Date().toISOString().slice(0, 10)} />
          </div>

          <H2>Recent reports (last 120 days)</H2>
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

      <H2>How to read this</H2>
      <Card className="mt-3">
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
          <li>A report means WHO thinks an event matters internationally. Many outbreaks are never published here, and one outbreak can produce several reports.</li>
          <li>Reports do not give an outbreak&apos;s infectiousness (R₀) or fatality rate, and this site does not guess them. For those, read the report itself.</li>
          <li>On the map, each country with a report gets one marker at the country&apos;s centre, not at the outbreak location.</li>
          <li>Animal disease and wider surveillance sit in other systems: see the links below.</li>
        </ul>
      </Card>

      <H2>Other outbreak sources</H2>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
        <li><Ext href="https://www.ecdc.europa.eu/en/threats-and-outbreaks">ECDC: threats and outbreaks</Ext> <span className="text-dim">· Europe</span></li>
        <li><Ext href="https://wahis.woah.org/">WOAH WAHIS</Ext> <span className="text-dim">· animal diseases, including avian influenza</span></li>
        <li><Ext href="https://www.who.int/emergencies/disease-outbreak-news">WHO Disease Outbreak News</Ext></li>
      </ul>
      <p className="mt-6 text-sm">
        What a fast-spreading new pathogen could do: <Link href="/scenarios/pandemic-x" className="text-accent hover:underline">Pandemic X explorer →</Link>
      </p>
    </>
  );
}
