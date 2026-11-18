import type { Metadata } from "next";
import CountryView from "@/components/CountryView";
import SiteNav from "@/components/SiteNav";

export const metadata: Metadata = {
  title: "Countries · VigilRadar",
  description: "One page per country: nuclear status, tension pairs, outbreak reports, conflict coverage, volcanoes, water and food.",
};

export default function CountryPage() {
  return (
    <>
      <SiteNav />
      <CountryView />
    </>
  );
}
