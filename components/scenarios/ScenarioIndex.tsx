"use client";

import Link from "next/link";
import { useState } from "react";
import type { Scenario } from "@/data/scenarios";
import { TierBadge, type Tier } from "@/components/ui";

const TIER_INFO: Record<Tier, { title: string; blurb: string }> = {
  A: { title: "A · Documented", blurb: "Historical precedent and published scenarios or models." },
  B: { title: "B · Plausible", blurb: "Known mechanism, high uncertainty, models exist." },
  C: { title: "C · Thought experiments", blurb: "Conceivable but weakly supported or disputed. Included for curiosity and to say what science thinks." },
};

const firstSentence = (t: string) => t.split(/(?<=\.)\s/)[0];

export default function ScenarioIndex({ scenarios }: { scenarios: Scenario[] }) {
  const [showC, setShowC] = useState(false);
  const tiers: Tier[] = showC ? ["A", "B", "C"] : ["A", "B"];
  const hidden = scenarios.filter((s) => s.tier === "C").length;

  return (
    <>
      <label className="mt-6 flex cursor-pointer items-start gap-2 text-xs">
        <input type="checkbox" checked={showC} onChange={(e) => setShowC(e.target.checked)} className="mt-0.5" style={{ accentColor: "var(--geo)" }} />
        <span>
          <span className="font-medium">Show thought experiments ({hidden})</span>
          <span className="block text-dim">Hidden by default: they are interesting, but the evidence behind them is weak or disputed.</span>
        </span>
      </label>

      {tiers.map((t) => {
        const list = scenarios.filter((s) => s.tier === t);
        return (
          <section key={t} className="mt-8">
            <h2 className="label">{TIER_INFO[t].title} · {list.length}</h2>
            <p className="mt-1 text-xs text-dim">{TIER_INFO[t].blurb}</p>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {list.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/scenarios/${s.id}`}
                    className="block h-full border border-line bg-panel-solid p-4 hover:border-line-strong"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="label">{s.group}</span>
                      <TierBadge tier={s.tier} />
                    </div>
                    <h3 className="mt-2 text-sm font-semibold">{s.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-dim">{firstSentence(s.summary)}</p>
                    {s.module && <p className="mono mt-2 text-[10px] text-accent">interactive</p>}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
