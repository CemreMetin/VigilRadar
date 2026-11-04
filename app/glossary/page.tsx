import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import ScrollToHash from "@/components/ScrollToHash";
import { GLOSSARY, TOPIC_LABEL, type GlossaryEntry, type GlossaryTopic } from "@/data/glossary";
import { PAGE_META } from "@/data/pages";
import WikiShell, { type WikiSection } from "@/components/WikiShell";
import { Ext, Int } from "@/components/ui";

export const metadata: Metadata = {
  title: "Glossary · Monitoring",
  description: "Plain-language definitions of the abbreviations and units used on this site, each with its primary source.",
};

export default function GlossaryPage() {
  const entries: readonly GlossaryEntry[] = GLOSSARY;
  // one section per topic: the terms are few, and a topic is how you would look one up
  const sections: WikiSection[] = (Object.keys(TOPIC_LABEL) as GlossaryTopic[]).map((topic) => ({
    id: topic,
    label: TOPIC_LABEL[topic],
    content: (
      <>
        <ScrollToHash />
        <dl className="mt-3 space-y-5">
          {entries
            .filter((e) => e.topic === topic)
            .map((e) => (
              <div key={e.id} id={e.id} className="scroll-mt-4 break-inside-avoid">
                <dt className="mono text-read font-bold">{e.term}</dt>
                <dd className="mt-1 text-read leading-relaxed">
                  {e.short} {e.long}
                  <span className="mono mt-1 block text-body text-dim">
                    Source: {e.source.url.startsWith("/") ? <Int href={e.source.url}>{e.source.label}</Int> : <Ext href={e.source.url}>{e.source.label} ↗</Ext>}
                  </span>
                </dd>
              </div>
            ))}
        </dl>
      </>
    ),
  }));

  return (
    <>
      <SiteNav />
      <WikiShell title="Glossary" intro="What the abbreviations and units on this site mean, in one sentence each, with the source of the definition." {...PAGE_META.glossary} sections={sections} />
    </>
  );
}
