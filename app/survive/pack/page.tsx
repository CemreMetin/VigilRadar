import type { Metadata } from "next";
import PackView from "@/components/PackView";
import SiteNav from "@/components/SiteNav";

export const metadata: Metadata = {
  title: "Preparedness pack · Monitoring",
  description: "A printable pack: household plan, checklist, wallet card, shelter guidance and a map of your country.",
};

export default function PackPage() {
  return (
    <>
      <SiteNav />
      <PackView />
    </>
  );
}
