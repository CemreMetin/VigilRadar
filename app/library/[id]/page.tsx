import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PAGE_META } from "@/data/pages";
import { ref } from "@/data/references";
import { SCENARIOS, SCENARIO_BY_ID, type Evidence } from "@/data/scenarios";
import LiveIndicators from "@/components/scenarios/LiveIndicators";
import ModuleLoader from "@/components/scenarios/ModuleLoader";
import SiteNav from "@/components/SiteNav";
import WikiShell, { type WikiSection } from "@/components/WikiShell";
import { Card, Ext, KindTag, TierBadge } from "@/components/ui";

export const dynamicParams = false;

export function generateStaticParams() {
  return SCENARIOS.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: PageProps<"/library/[id]">): Promise<Metadata> {
  const { id } = await params;
  const s = SCENARIO_BY_ID[id];
  return s ? { title: `${s.title} · Monitoring`, description: s.summary.slice(0, 200) } : {};
}

const EVIDENCE: Record<Evidence, { label: string; cls: string; mark: string }> = {
  strong: { label: "strong evidence", cls: "border-safe text-safe", mark: "●" },
  moderate: { label: "moderate evidence", cls: "border-accent text-accent", mark: "◐" },
  speculative: { label: "speculative", cls: "border-geo text-geo border-dashed", mark: "○" },
};

export default async function ScenarioPage({ params }: PageProps<"/library/[id]">) {
  const { id } = await params;
  const s = SCENARIO_BY_ID[id];
  if (!s) notFound();

  const related = (s.related ?? []).map((r) => SCENARIO_BY_ID[r]).filter(Boolean);
  const surviveHref = s.tag ? `/survive?for=${s.tag}#bag` : "/survive";

  const sections: WikiSection[] = [
    { id: "overview", label: "Overview", group: "This scenario", content: (
      <>
        {s.tier === "C" && (
          <p className="mt-3 border border-dashed border-geo px-3 py-2 text-body leading-relaxed text-geo">
            Thought experiment: physically conceivable, but the evidence is weak or disputed. It is here for curiosity and to say what
            the science actually thinks.
          </p>
        )}
        <p className="mt-4 text-read leading-relaxed">{s.summary}</p>
        <p className="mt-2 text-body text-dim">The tier rates the quality of the evidence, not how likely the event is.</p>

        {s.indicators && <LiveIndicators ids={s.indicators} />}

        {s.module && <ModuleLoader module={s.module} />}

      </>
    ) },
    { id: "unfold", label: "How it could unfold", group: "This scenario", content: (
      <>
        <ol className="mt-3 space-y-2">
          {s.chain.map((c, i) => {
            const e = EVIDENCE[c.evidence];
            return (
              <li key={i} className="flex items-start gap-3 text-read">
                <span className="mono mt-0.5 w-5 shrink-0 text-right text-dim">{i + 1}</span>
                <span className="min-w-0 flex-1 leading-relaxed">{c.step}</span>
                <span className={`mono shrink-0 border px-1.5 py-0.5 text-label ${e.cls}`} title={e.label}>
                  {e.mark} {e.label}
                </span>
              </li>
            );
          })}
        </ol>

        <p className="label mt-6">Historical anchors</p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-read leading-relaxed">
          {s.analogs.map((a) => <li key={a}>{a}</li>)}
        </ul>

      </>
    ) },
    ...(s.estimates.length > 0 || s.caveat
      ? [{ id: "evidence", label: "What experts say", group: "Evidence", content: (
          <>
        {s.estimates.length > 0 && (
          <>
            <div className="mt-3 overflow-x-auto border border-line">
              <table className="w-full min-w-[520px] text-left text-body">
                <thead>
                  <tr className="label border-b border-line">
                    <th className="p-2">Source</th>
                    <th className="p-2">Statement</th>
                    <th className="p-2">Kind</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line align-top">
                  {s.estimates.map((e) => (
                    <tr key={e.who + e.what}>
                      <th scope="row" className="p-2">
                        <Ext href={ref(e.ref).url}>{e.who} ↗</Ext>
                      </th>
                      <td className="p-2 leading-relaxed text-dim">{e.what}</td>
                      <td className="p-2">
                        <KindTag kind={e.kind === "projection" ? "projection" : e.kind === "expert" ? "expert" : "observed"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-body text-dim">
              Expert estimates are personal judgements, not measurements, and experts disagree. This site never adds its own probabilities.
            </p>
          </>
        )}

        {s.caveat && (
          <Card className="mt-8">
            <p className="label">Caveat</p>
            <p className="mt-1 text-read leading-relaxed">{s.caveat}</p>
          </Card>
        )}

          </>
        ) }]
      : []),
    { id: "todo", label: "What you can do", group: "Action", content: (
      <>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-read leading-relaxed">
          {s.doNow.map((d) => <li key={d}>{d}</li>)}
        </ul>
        <p className="mt-3 text-read">
          <Link href={surviveHref} className="text-safe hover:underline">Open the preparedness checklist{s.tag ? " for this scenario" : ""} →</Link>
        </p>

        {related.length > 0 && (
          <>
            <p className="label mt-6">Related scenarios</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {related.map((r) => (
                <li key={r.id}>
                  <Link href={`/library/${r.id}`} className="mono border border-line px-2.5 py-1 text-body text-dim hover:border-accent hover:text-accent">
                    {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

      </>
    ) },
  ];

  return (
    <>
      <SiteNav />
      <WikiShell
        title={s.title}
        intro={
          <>
            <span className="flex flex-wrap items-center gap-3">
              <Link href="/library" className="mono text-body hover:text-accent">← all scenarios</Link>
              <TierBadge tier={s.tier} />
              <span className="label">{s.group}</span>
            </span>
          </>
        }
        updated={PAGE_META.scenarios.updated}
        keyPoints={s.keyPoints}
        sources={s.refs.map((rid) => ({ label: ref(rid).text, url: ref(rid).url }))}
        sections={sections}
      />
    </>
  );
}
