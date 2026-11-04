import type { Metadata } from "next";
import Link from "next/link";
import CausalGraph from "@/components/CausalGraph";
import SiteNav from "@/components/SiteNav";
import { PAGE_META } from "@/data/pages";
import WikiShell, { type WikiSection } from "@/components/WikiShell";

export const metadata: Metadata = {
  title: "Links · Monitoring",
  description: "How risks feed each other: a hand-curated, sourced map of causal links, with the strength of evidence for each.",
};

const sections: WikiSection[] = [
  { id: "graph", label: "Causal map", group: "Links", content: <CausalGraph /> },
  {
    id: "kinds",
    label: "Causal vs computed",
    group: "Links",
    content: (
      <div className="mt-3 max-w-2xl space-y-3 text-sm leading-relaxed">
        <p>
          This map makes claims about <span className="text-fg">cause</span>. Each arrow is written by hand, rated by strength of evidence (strong, moderate,
          speculative) and cited. Speculative arrows are hidden by default.
        </p>
        <p>
          The links the main map draws automatically (things that are near each other, in the same country or at the same time) do not claim cause: they only say
          two things coincide. <Link href="/methodology?tab=links" className="text-accent hover:underline">How the two differ</Link>.
        </p>
      </div>
    ),
  },
];

export default function LinksPage() {
  return (
    <>
      <SiteNav />
      <WikiShell
        title="How the risks feed each other"
        intro="Risks rarely arrive alone: a volcano becomes a food problem, a war becomes a health problem. This map shows the links where research says one thing can cause another."
        {...PAGE_META.links}
        sections={sections}
      />
    </>
  );
}
