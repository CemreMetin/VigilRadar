import type { Metadata } from "next";
import AboutView from "@/components/radar/AboutView";

export const metadata: Metadata = {
  title: "About · VigilRadar",
  description: "What VigilRadar is and is not, where the data comes from, and what it stores in your browser.",
};

export default function AboutPage() {
  return <AboutView />;
}
