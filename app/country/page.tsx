import type { Metadata } from "next";
import CountryView from "@/components/CountryView";
import SiteNav from "@/components/SiteNav";
import { Page } from "@/components/ui";

export const metadata: Metadata = {
  title: "Countries · Monitoring",
  description: "One page per country: nuclear status, tension pairs, outbreak reports, conflict coverage, volcanoes, water and food.",
};

export default function CountryPage() {
  return (
    <>
      <SiteNav />
      <Page wide>
        <CountryView />
      </Page>
    </>
  );
}
