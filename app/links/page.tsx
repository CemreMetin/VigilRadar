import type { Metadata } from "next";
import Link from "next/link";
import CausalGraph from "@/components/CausalGraph";
import SiteNav from "@/components/SiteNav";
import { H1, Lead, Page } from "@/components/ui";

export const metadata: Metadata = {
  title: "Links · Monitoring",
  description: "How risks feed each other: a hand-curated, sourced map of causal links, with the strength of evidence for each.",
};

export default function LinksPage() {
  return (
    <>
      <SiteNav />
      <Page>
        <H1>How the risks feed each other</H1>
        <Lead>
          Risks rarely arrive alone: a volcano becomes a food problem, a war becomes a health problem. This map shows the links
          where research says one thing can cause another. Each arrow is written by hand, rated by strength of evidence, and cited.
          It makes claims about <span className="text-fg">cause</span>; the links the map draws automatically (things that are
          near each other, in the same country or at the same time) do not.{" "}
          <Link href="/methodology#links" className="text-accent hover:underline">How the two differ</Link>.
        </Lead>
        <CausalGraph />
      </Page>
    </>
  );
}
