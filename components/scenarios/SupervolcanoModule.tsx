"use client";

import Link from "next/link";
import { KindTag } from "@/components/ui";
import VolcanoCards from "@/components/VolcanoCards";

const ANALOGS = [
  { name: "Pinatubo, Philippines", year: "1991", vei: "6", effect: "About 20 million tonnes of SO₂; global surface cooling of about 0.5 °C for roughly two years", kind: "observed" as const },
  { name: "Tambora, Indonesia", year: "1815", vei: "7", effect: "Global cooling of roughly 0.4–0.7 °C; the 1816 'year without a summer', harvest failures from Ireland to China", kind: "observed" as const },
  { name: "Toba, Indonesia", year: "~74,000 years ago", vei: "8", effect: "Climate and human-population effects are debated; there is no agreed figure", kind: "expert" as const },
];

export default function SupervolcanoModule() {
  return (
    <section className="mt-6" aria-label="Supervolcano watchlist and analogs">
      <div className="flex flex-wrap items-center gap-3">
        <KindTag kind="observed" />
        <span className="text-body text-dim">Live status of six calderas that have produced supereruptions. Normal is the usual state.</span>
      </div>
      <VolcanoCards />
      <p className="mt-3 text-body">
        <Link href="/supervolcanoes" className="text-accent hover:underline">More on the watchlist →</Link>
      </p>

      <h3 className="label mt-8">What the smaller eruptions tell us</h3>
      <div className="mt-2 overflow-x-auto border border-line">
        <table className="w-full min-w-[560px] text-left text-body">
          <thead>
            <tr className="label border-b border-line">
              <th className="p-2">Eruption</th>
              <th className="p-2">When</th>
              <th className="p-2">VEI</th>
              <th className="p-2">Effect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line align-top">
            {ANALOGS.map((a) => (
              <tr key={a.name}>
                <th scope="row" className="p-2">{a.name}</th>
                <td className="p-2 text-dim">{a.year}</td>
                <td className="mono p-2">{a.vei}</td>
                <td className="p-2 leading-relaxed text-dim">{a.effect}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-body leading-relaxed text-dim">
        VEI is the Volcanic Explosivity Index; each step is about ten times more material, and VEI 8 means more than 1,000 km³
        of erupted material. A VEI 8 eruption is roughly 1,000 times the volume of Pinatubo&apos;s VEI 6, so its effects cannot be
        read off these examples: they are what models and the geological record suggest.
      </p>
      <p className="mt-2 text-body leading-relaxed text-dim">
        <span className="text-fg">Why this site shows no ash-fall map:</span> a credible ash-thickness forecast needs the eruption
        size, vent height and the actual winds on the day, and the published scenarios differ widely. A made-up footprint would
        look more certain than the science is.
      </p>
    </section>
  );
}
