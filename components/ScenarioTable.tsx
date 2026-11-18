"use client";

import Link from "next/link";
import { useState } from "react";
import { SCENARIOS, SCENARIO_TR } from "@/data/scenarios";
import { useLang } from "@/lib/lang";
import { TierBadge } from "./ui";

type SortKey = "title" | "tier" | "group";

/** Sortable comparison of the scenarios, built only from text that is already in data/scenarios.ts. Tier C is off until asked for. */
export default function ScenarioTable() {
  const [sort, setSort] = useState<SortKey>("tier");
  const tr = useLang()[0] === "tr";
  const t = SCENARIO_TR.table;
  const [withC, setWithC] = useState(false);
  const rows = SCENARIOS.filter((s) => withC || s.tier !== "C").sort((a, b) => a[sort].localeCompare(b[sort]) || a.title.localeCompare(b.title));
  const head = (key: SortKey, label: string) => (
    <th scope="col" aria-sort={sort === key ? "ascending" : "none"} className="p-2 font-normal">
      <button type="button" onClick={() => setSort(key)} className={`label ${sort === key ? "text-fg" : ""}`}>
        {label}
        {sort === key ? " ▲" : ""}
      </button>
    </th>
  );
  return (
    <>
      <label className="mono mt-3 flex items-center gap-2 text-body text-dim">
        <input type="checkbox" checked={withC} onChange={(e) => setWithC(e.target.checked)} style={{ accentColor: "var(--accent)" }} />
        {tr ? t.include : "Include tier C thought experiments"}
      </label>
      <div className="mt-3 overflow-x-auto border border-line">
        <table className="w-full min-w-[760px] text-left text-body">
          <caption className="sr-only">Scenarios compared by evidence tier, the largest effect in their cause chain, and the first preparedness step. Sortable by name, tier and group.</caption>
          <thead>
            <tr className="border-b border-line">
              {head("title", tr ? t.scenario : "Scenario")}
              {head("tier", tr ? t.tier : "Tier")}
              {head("group", tr ? t.group : "Group")}
              <th scope="col" className="label p-2 font-normal">{tr ? t.effect : "Largest effect in the chain"}</th>
              <th scope="col" className="label p-2 font-normal">{tr ? t.step : "First step"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line align-top">
            {rows.map((s) => (
              <tr key={s.id}>
                <th scope="row" className="p-2 text-left font-bold">
                  <Link href={`/library/${s.id}`} className="text-accent hover:underline">{tr ? SCENARIO_TR.titles[s.id] ?? s.title : s.title}</Link>
                </th>
                <td className="p-2"><TierBadge tier={s.tier} /></td>
                <td className="p-2 text-dim">{s.group}</td>
                <td className="p-2 text-dim">{s.chain[s.chain.length - 1]?.step}</td>
                <td className="p-2 text-dim">
                  {s.doNow[0]} <Link href={s.tag ? `/survive?for=${s.tag}` : "/survive"} className="text-accent hover:underline">{tr ? t.checklist : "Checklist →"}</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-label text-dim">{tr ? t.note : "Tiers rate the quality of evidence, not how likely a scenario is."} {rows.length} {tr ? t.shown : "shown"}.</p>
    </>
  );
}
