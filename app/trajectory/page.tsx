import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import TrajectoryView from "@/components/TrajectoryView";

export const metadata: Metadata = {
  title: "Trajectory · VigilRadar",
  description:
    "Observed warming and CO2, IPCC scenarios to 2100, and expert estimates of existential risk, each marked as observation, projection or judgement.",
};

export default function TrajectoryPage() {
  return (
    <>
      <SiteNav />
      <TrajectoryView />
    </>
  );
}
