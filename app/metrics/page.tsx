import type { Metadata } from "next";
import MetricsView from "@/components/MetricsView";
import SiteNav from "@/components/SiteNav";

export const metadata: Metadata = {
  title: "Metrics · Vigil",
  description: "The live counters: clocks, climate, ice, space, conflict news and shipping chokepoints.",
};

export default function MetricsPage() {
  return (
    <>
      <SiteNav />
      <MetricsView />
    </>
  );
}
