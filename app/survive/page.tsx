import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import SurvivalHub from "@/components/SurvivalHub";

export const metadata: Metadata = {
  title: "What can you do? · VigilRadar",
  description:
    "A calm, offline-capable preparedness guide: checklist, family plan, radiation shelter basics, communication when networks fail, offline maps and official guides.",
};

export default function SurvivePage() {
  return (
    <>
      <SiteNav />
      <SurvivalHub />
    </>
  );
}
