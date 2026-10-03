import type { Metadata } from "next";
import HealthView from "@/components/HealthView";
import SiteNav from "@/components/SiteNav";
import { Page } from "@/components/ui";

export const metadata: Metadata = {
  title: "Health · Monitoring",
  description: "Recent WHO Disease Outbreak News reports, with context on what they do and do not tell you.",
};

export default function HealthPage() {
  return (
    <>
      <SiteNav />
      <Page>
        <HealthView />
      </Page>
    </>
  );
}
