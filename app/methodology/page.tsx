import type { Metadata } from "next";
import Link from "next/link";
import dyadsFile from "@/data/dyads.json";
import SiteNav from "@/components/SiteNav";
import { Card, Ext, H1, H2, KindTag, Lead, Page, TierBadge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Methodology · Monitoring",
  description: "How the tension index, links, counters and evidence tiers are computed, and what this site does not do.",
};

const P = ({ children }: { children: React.ReactNode }) => <p className="mt-3 text-sm leading-relaxed">{children}</p>;
const UL = ({ children }: { children: React.ReactNode }) => <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed">{children}</ul>;

export default function MethodologyPage() {
  return (
    <>
      <SiteNav />
      <Page>
        <H1>Methodology</H1>
        <Lead>
          How things on this site are made, so you can judge them. This is a personal, ad-free project; the aim is to be useful and honest
          about uncertainty rather than dramatic.
        </Lead>

        <H2 id="kinds">1 · Three kinds of statement</H2>
        <P>Every number or claim is one of these, and is labelled so they never blur together:</P>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed">
          <li><KindTag kind="observed" /> a measurement or a published record (an earthquake, CO₂ at Mauna Loa, a SIPRI warhead count).</li>
          <li><KindTag kind="projection" /> what a model or scenario says follows from stated assumptions (IPCC pathways, nuclear-soot food models). Not a prediction.</li>
          <li><KindTag kind="expert" /> a named person&apos;s or group&apos;s own judgement (Toby Ord&apos;s 1 in 6). Not a measurement.</li>
          <li><KindTag kind="model" /> an illustrative calculation made for this site from a published method (the pandemic-spread explorer).</li>
        </ul>
        <P>
          <span className="text-fg">This site never invents probabilities.</span> It shows other people&apos;s, with names and sources, side by side.
        </P>

        <H2 id="tiers">2 · Evidence tiers for scenarios</H2>
        <P>Tiers rate how good the evidence is, not how likely the event is. A very unlikely event can still have strong evidence for how it would work.</P>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed">
          <li><TierBadge tier="A" /> The mechanism is known, there is historical precedent, and there is a published scenario or model.</li>
          <li><TierBadge tier="B" /> The mechanism is known or plausible, but precedent is thin and uncertainty is high.</li>
          <li><TierBadge tier="C" /> Physically conceivable, but the evidence is weak, disputed or mostly folklore. Hidden by default.</li>
        </ul>

        <H2 id="tension">3 · The tension index for country pairs</H2>
        <P>
          For each tracked pair the site looks at how news reports their interactions over the last 30 days, using the GDELT event
          database (events coded automatically from news with the CAMEO scheme). It computes four things, weighted by how many articles
          mention each event:
        </P>
        <UL>
          <li><span className="text-fg">Cooperation vs conflict score</span> (Goldstein scale, −10 hostile to +10 cooperative). Weight 40%, using (1 − score/10)/2.</li>
          <li><span className="text-fg">Share of coverage that is material conflict</span> (force, attacks, as opposed to verbal conflict). Weight 30%, scaled so 50% or more counts as full.</li>
          <li><span className="text-fg">Average media tone</span>. Weight 15%, using (1 − tone/10)/2.</li>
          <li><span className="text-fg">Surge</span>: the last 7 days&apos; event rate against the 30-day average, on a log scale where a fourfold jump counts as full. Weight 15%.</li>
        </UL>
        <Card className="mt-4">
          <p className="mono text-xs leading-relaxed">
            tension = 100 × (0.40 × g + 0.30 × m + 0.15 × t + 0.15 × s)
            <br />
            g = (1 − Goldstein/10)/2 · m = min(1, material share/0.5) · t = (1 − tone/10)/2 · s = clamp(log₂(rate7/rate30)/2, 0, 1)
          </p>
        </Card>
        <P><span className="text-fg">What it is not.</span></P>
        <UL>
          <li>Not a forecast of war, and not a measure of anyone&apos;s intent. It is a description of how the pair is being covered.</li>
          <li>The weights are judgement calls, chosen to keep the components visible; different weights would reorder the pairs.</li>
          <li>Pairs with fewer than 100 events in 30 days are shown as &quot;low data&quot; rather than given a number.</li>
          <li>Media coverage reflects what is reported, not what happens: English-language and wire coverage dominate, and wars get more attention than quiet tension.</li>
        </UL>
        <P>
          Pairs tracked: {dyadsFile.pairs.map((p) => p.label).join("; ")}. Pairs are listed in <code className="mono">data/dyads.json</code>; the
          list is a judgement and can be changed.
        </P>

        <H2 id="gdelt">4 · About GDELT, and the conflict layer</H2>
        <UL>
          <li>GDELT codes events automatically from news text. It makes mistakes, double-counts, and misreads context.</li>
          <li>
            The conflict layer counts events coded as <em>fighting</em> or <em>mass violence</em> that involve military or armed groups, or two different
            countries, over the last 7 days. Ordinary assault and police or criminal events are left out; otherwise crime reports in high-coverage
            countries would swamp war coverage.
          </li>
          <li>
            Locations are where the article places the event: often a capital or a named city, not necessarily the front line. A bright dot
            over a capital can mean a government statement about a war elsewhere.
          </li>
          <li>Counts measure how much is reported. They are not casualties, and they over-represent countries with heavy English-language coverage.</li>
        </UL>

        <H2 id="links">5 · Links: computed versus causal</H2>
        <P>There are two kinds of link on this site and they claim different things.</P>
        <p className="mt-4 text-sm font-semibold">Computed links (automatic; show connection, not cause)</p>
        <UL>
          <li><span className="text-fg">Nearby:</span> an earthquake of magnitude 5+ within 100 km of a nuclear plant or 150 km of a watchlist supervolcano; a cell with 15+ armed-conflict reports in 7 days within 50 km of a plant.</li>
          <li><span className="text-fg">Same country:</span> an outbreak report, volcano or tension pair that names a country is linked to it.</li>
          <li><span className="text-fg">Exposure:</span> the residents of cities with 15,000+ people within 100 km (GeoNames). This is a lower bound: towns, villages and visitors are not counted, which is why Yellowstone shows none.</li>
          <li><span className="text-fg">Same time:</span> country profiles list indicators that are active in the same country now (an outbreak report, heavy conflict coverage, a tension pair at 60+, a volcano above baseline, high water stress at 75%+ withdrawal). This is co-occurrence, not cause.</li>
        </UL>
        <p className="mt-4 text-sm font-semibold">Causal links (hand-written, cited)</p>
        <P>
          The <Link href="/links" className="text-accent hover:underline">Links page</Link> is the only place the site says one thing can cause another. Each
          arrow has an evidence rating (strong, moderate, speculative) and at least one citation, except speculative arrows, which are hidden by default.
        </P>

        <H2 id="counters">6 · Counters</H2>
        <UL>
          <li>Each counter shows its value, the date of the data, how often it updates, its source and its licence. Tap one on the map for the caveats.</li>
          <li>Counters marked <span className="mono">manual</span> come from annual publications and are updated by hand. Each has a review date; a counter past its date says so.</li>
          <li>The temperature counter uses NASA&apos;s 1951-1980 baseline, so it reads about 0.3 °C lower than the same data against pre-industrial. The site shows no &quot;time to 1.5 °C&quot; for that reason.</li>
          <li>The WHO counter is a count of published reports, not of outbreaks. The Doomsday Clock is a symbolic setting, not a probability.</li>
          <li>If a source stops updating, its last value stays and the feed status turns amber; the site does not go blank.</li>
        </UL>

        <H2 id="limits">7 · What this site does not do</H2>
        <UL>
          <li>It makes no forecasts or probabilities of its own.</li>
          <li>It has no ash-fall, fallout or impact-damage maps. These need inputs (winds, targets, angle, yield) that nobody can know in advance, and a precise-looking map would claim more than the science does.</li>
          <li>It does not give medical doses or treatment advice. The preparedness pages link to the health authorities that issue them.</li>
          <li>It does not track you: there are no accounts, ads or analytics, and your checklist stays on your device.</li>
        </UL>

        <H2 id="data">8 · Data, licences, citations</H2>
        <P>
          Every source, its licence and its last update are on the <Link href="/sources" className="text-accent hover:underline">Sources page</Link>. Scholarly citations
          were checked against the Crossref record and web links were opened. The basemap is © CARTO and © OpenStreetMap contributors. This is a personal,
          non-commercial project; some datasets (such as the submarine-cable map, CC BY-NC-SA) permit only that use. Data come from{" "}
          <Ext href="https://www.gdeltproject.org/">GDELT</Ext>, USGS, NASA, NOAA, WHO, IMF PortWatch, SIPRI, the World Bank and others listed there.
        </P>
      </Page>
    </>
  );
}
