import type { Metadata } from "next";
import { SCENARIOS } from "@/data/scenarios";
import ScenarioIndex from "@/components/scenarios/ScenarioIndex";
import SiteNav from "@/components/SiteNav";
import { H1, Lead, Page } from "@/components/ui";

export const metadata: Metadata = {
  title: "Scenarios · Monitoring",
  description:
    "Twenty-three ways things could go badly wrong, each rated by the quality of evidence behind it, with sources, historical anchors and what you can do.",
};

export default function ScenariosPage() {
  return (
    <>
      <SiteNav />
      <Page>
        <H1>Scenarios</H1>
        <Lead>
          How things could go badly wrong, and how well we actually know it. Each scenario is rated on the quality of the evidence
          behind it (not on how likely it is), says what has already happened, what models and experts estimate, and what you can
          do. Seven have interactive explorers.
        </Lead>
        <ScenarioIndex scenarios={SCENARIOS} />
      </Page>
    </>
  );
}
