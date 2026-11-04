import type { Metadata } from "next";
import Link from "next/link";
import { SCENARIOS, type Scenario } from "@/data/scenarios";
import SiteNav from "@/components/SiteNav";
import { TierBadge, type Tier } from "@/components/ui";
import { PAGE_META } from "@/data/pages";
import WikiShell, { type WikiSection } from "@/components/WikiShell";
import ScenarioTable from "@/components/ScenarioTable";

export const metadata: Metadata = {
  title: "Scenarios · Monitoring",
  description:
    "Twenty-three ways things could go badly wrong, each rated by the quality of evidence behind it, with sources, historical anchors and what you can do.",
};

const TIER_INFO: Record<Tier, { title: string; blurb: string }> = {
  A: { title: "A · Documented", blurb: "Historical precedent and published scenarios or models." },
  B: { title: "B · Plausible", blurb: "Known mechanism, high uncertainty, models exist." },
  C: { title: "C · Thought experiments", blurb: "Conceivable but weakly supported or disputed. Included for curiosity and to say what science thinks. Not shown on the other tabs." },
};

const firstSentence = (t: string) => t.split(/(?<=\.)\s/)[0];

function Cards({ list }: { list: Scenario[] }) {
  return (
    <ul className="mt-3 grid gap-3 sm:grid-cols-2">
      {list.map((s) => (
        <li key={s.id}>
          <Link href={`/scenarios/${s.id}`} className="block h-full border border-line bg-panel-solid p-4 hover:border-line-strong">
            <div className="flex items-center justify-between gap-2">
              <span className="label">{s.group}</span>
              <TierBadge tier={s.tier} />
            </div>
            <h3 className="mt-2 text-read font-bold">{s.title}</h3>
            <p className="mt-1 text-body leading-relaxed text-dim">{firstSentence(s.summary)}</p>
            {s.module && <p className="mono mt-2 text-label text-accent">interactive</p>}
          </Link>
        </li>
      ))}
    </ul>
  );
}

const tierSections: WikiSection[] = (["A", "B", "C"] as Tier[]).map((t) => {
  const list = SCENARIOS.filter((s) => s.tier === t);
  return {
    id: `tier-${t.toLowerCase()}`,
    label: `${TIER_INFO[t].title} · ${list.length}`,
    content: (
      <>
        <p className="mt-2 text-body text-dim">{TIER_INFO[t].blurb}</p>
        <Cards list={list} />
      </>
    ),
  };
});

const sections: WikiSection[] = [{ id: "compare", label: "Compare", content: <ScenarioTable /> }, ...tierSections];

export default function ScenariosPage() {
  return (
    <>
      <SiteNav />
      <WikiShell
        title="Scenarios"
        intro="How things could go badly wrong, and how well we actually know it. Each scenario is rated on the quality of the evidence behind it (not on how likely it is), says what has already happened, what models and experts estimate, and what you can do. Seven have interactive explorers."
        {...PAGE_META.scenarios}
        translated
        sections={sections}
      />
    </>
  );
}
