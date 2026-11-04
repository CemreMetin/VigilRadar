import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import { PAGE_META } from "@/data/pages";
import WikiShell, { type WikiSection } from "@/components/WikiShell";
import { Card, Term } from "@/components/ui";
import VolcanoCards from "@/components/VolcanoCards";

export const metadata: Metadata = {
  title: "Supervolcanoes · Monitoring",
  description: "A watchlist of six calderas that have produced supereruptions, with live status where public feeds exist.",
};

export default function SupervolcanoesPage() {
  const sections: WikiSection[] = [
    { id: "watchlist", label: "Watchlist", group: "Status", content: (<>
        <VolcanoCards />
        <p className="mt-6 text-read">
          What a supereruption could do:{" "}
          <Link href="/scenarios/supervolcano" className="text-accent hover:underline">Supervolcano scenario →</Link>
          {" · "}
          <Link href="/?sc=volcano" className="text-accent hover:underline">Show on the map →</Link>
        </p>
    </>) },
    { id: "reading", label: "Reading the watchlist", group: "Context", content: (<>
        <Card className="mt-3">
          <ul className="list-disc space-y-2 pl-5 text-read leading-relaxed">
            <li>
              <span className="text-fg">Unrest is not an eruption.</span> Earthquake swarms, ground uplift and gas release happen at
              many calderas for years or decades without erupting. Campi Flegrei has been at a yellow alert level since 2012.
            </li>
            <li>
              <span className="text-fg">A long gap is not a countdown.</span> Yellowstone&apos;s three big eruptions came roughly 2.1
              million, 1.3 million and 0.63 million years ago, but the intervals vary and the system does not run on a clock. The USGS
              Yellowstone Volcano Observatory says as much on its site.
            </li>
            <li>
              <span className="text-fg">Counts of people are lower bounds.</span> They include only cities of 15,000 or more within 100 km.
              Yellowstone shows none because the nearest such cities are further away, though millions of visitors pass through each year.
            </li>
            <li>
              Toba and Aira (Sakurajima) have no live feed on this site. Monitoring exists (Sakurajima is watched by the Japan
              Meteorological Agency); it is just not ingested here.
            </li>
          </ul>
        </Card>

    </>) },
  ];
  return (
    <>
      <SiteNav />
      <WikiShell
        title="Supervolcanoes"
        accent="var(--geo)"
        intro={<>
          Six <Term id="caldera">calderas</Term> that have each produced at least one supereruption (<Term id="vei">VEI</Term> 7 or larger). Status comes from the official
          observatories where they publish an open feed. &quot;Normal&quot; is the usual state and nearly every volcano is normal nearly
          all the time.
        </>}
        {...PAGE_META.supervolcanoes}
        sections={sections}
      />
    </>
  );
}
