import type { Metadata } from "next";
import Link from "next/link";
import dyadsFile from "@/data/dyads.json";
import SiteNav from "@/components/SiteNav";
import { PAGE_META } from "@/data/pages";
import WikiShell, { type WikiSection } from "@/components/WikiShell";
import { Card, Ext, KindTag, Term, TierBadge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Methodology · VigilRadar",
  description: "How the tension index, links, counters and evidence tiers are computed, and what this site does not do.",
};

const P = ({ children }: { children: React.ReactNode }) => <p className="mt-3 text-read leading-relaxed">{children}</p>;
const UL = ({ children }: { children: React.ReactNode }) => <ul className="mt-3 list-disc space-y-1.5 pl-5 text-read leading-relaxed">{children}</ul>;

export default function MethodologyPage() {
  const sections: WikiSection[] = [
    { id: "kinds", label: "Three kinds of statement", group: "Concepts", content: (
      <>
        <P>Every number or claim is one of these, and is labelled so they never blur together:</P>
        <ul className="mt-3 space-y-2 text-read leading-relaxed">
          <li><KindTag kind="observed" /> a measurement or a published record (an earthquake, CO₂ at Mauna Loa, a SIPRI warhead count).</li>
          <li><KindTag kind="projection" /> what a model or scenario says follows from stated assumptions (IPCC pathways, nuclear-soot food models). Not a prediction.</li>
          <li><KindTag kind="expert" /> a named person&apos;s or group&apos;s own judgement (Toby Ord&apos;s 1 in 6). Not a measurement.</li>
          <li><KindTag kind="model" /> an illustrative calculation made for this site from a published method (the pandemic-spread explorer).</li>
        </ul>
        <P>
          <span className="text-fg">This site never invents probabilities.</span> It shows other people&apos;s, with names and sources, side by side.
        </P>

      </>
    ) },
    { id: "tiers", label: "Evidence tiers for scenarios", group: "Concepts", content: (
      <>
        <P>Tiers rate how good the evidence is, not how likely the event is. A very unlikely event can still have strong evidence for how it would work.</P>
        <ul className="mt-3 space-y-2 text-read leading-relaxed">
          <li><TierBadge tier="A" /> The mechanism is known, there is historical precedent, and there is a published scenario or model.</li>
          <li><TierBadge tier="B" /> The mechanism is known or plausible, but precedent is thin and uncertainty is high.</li>
          <li><TierBadge tier="C" /> Physically conceivable, but the evidence is weak, disputed or mostly folklore. Hidden by default.</li>
        </ul>

      </>
    ) },
    { id: "tension", label: "The tension index for country pairs", group: "Computed values", content: (
      <>
        <P>
          For each tracked pair the site looks at how news reports their interactions over the last 30 days, using the <Term id="gdelt">GDELT</Term> event
          database (events coded automatically from news with the CAMEO scheme). It computes four things, weighted by how many articles
          mention each event:
        </P>
        <UL>
          <li><span className="text-fg">Cooperation vs conflict score</span> (<Term id="goldstein">Goldstein scale</Term>, −10 hostile to +10 cooperative). Weight 40%, using (1 − score/10)/2.</li>
          <li><span className="text-fg">Share of coverage that is material conflict</span> (force, attacks, as opposed to verbal conflict). Weight 30%, scaled so 50% or more counts as full.</li>
          <li><span className="text-fg">Average media tone</span>. Weight 15%, using (1 − tone/10)/2.</li>
          <li><span className="text-fg">Surge</span>: the last 7 days&apos; event rate against the 30-day average, on a log scale where a fourfold jump counts as full. Weight 15%.</li>
        </UL>
        <Card className="mt-4">
          <p className="mono text-body leading-relaxed">
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

      </>
    ) },
    { id: "gdelt", label: "About GDELT, and the conflict layer", group: "Computed values", content: (
      <>
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

      </>
    ) },
    { id: "links", label: "Links: computed versus causal", group: "Computed values", content: (
      <>
        <P>There are two kinds of link on this site and they claim different things.</P>
        <p className="mt-4 text-read font-bold">Computed links (automatic; show connection, not cause)</p>
        <UL>
          <li><span className="text-fg">Nearby:</span> an earthquake of magnitude 5+ within 100 km of a nuclear plant or 150 km of a watchlist supervolcano; a cell with 15+ armed-conflict reports in 7 days within 50 km of a plant.</li>
          <li><span className="text-fg">Same country:</span> an outbreak report, volcano or tension pair that names a country is linked to it.</li>
          <li><span className="text-fg">Exposure:</span> the residents of cities with 15,000+ people within 100 km (GeoNames). This is a lower bound: towns, villages and visitors are not counted, which is why Yellowstone shows none.</li>
          <li><span className="text-fg">Same time:</span> country profiles list indicators that are active in the same country now (an outbreak report, heavy conflict coverage, a tension pair at 60+, a volcano above baseline, high water stress at 75%+ withdrawal). This is co-occurrence, not cause.</li>
        </UL>
        <p className="mt-4 text-read font-bold">Causal links (hand-written, cited)</p>
        <P>
          The <Link href="/links" className="text-accent hover:underline">Links page</Link> is the only place the site says one thing can cause another. Each
          arrow has an evidence rating (strong, moderate, speculative) and at least one citation, except speculative arrows, which are hidden by default.
        </P>

      </>
    ) },
    { id: "pairs", label: "Why each pair is on the map", group: "Computed values", content: (
      <>
        <P>
          The tension map draws a line only for pairs listed in <span className="mono">data/dyads.json</span>. Each pair carries one of four reasons and a one-sentence explanation, shown in its popup and in the Nuclear readout:
        </P>
        <UL>
          <li><span className="mono">both-nuclear</span>: both states hold nuclear weapons.</li>
          <li><span className="mono">war-with-nuclear-state</span>: a nuclear-armed state is in a direct war with a state that has no such weapons.</li>
          <li><span className="mono">nuclear-vs-neighbour</span>: a nuclear-armed state shares a border or lies within range of a neighbour without such weapons.</li>
          <li><span className="mono">threshold-state</span>: a state that holds no weapons but whose enrichment programme is under international scrutiny (IAEA).</li>
        </UL>
        <P>
          Pairs whose inclusion is politically contestable are marked <span className="mono">sensitive</span> and carry an asterisk. Being listed is not an accusation and not a prediction; the index only describes how news reports the pair.
        </P>
      </>
    ) },
    { id: "counters", label: "Counters", group: "Computed values", content: (
      <>
        <UL>
          <li>Each counter shows its value, the date of the data, how often it updates, its source and its licence. Tap one on the map for the caveats.</li>
          <li>Counters marked <span className="mono">manual</span> come from annual publications and are updated by hand. Each has a review date; a counter past its date says so.</li>
          <li>The temperature counter uses NASA&apos;s 1951-1980 baseline, so it reads about 0.3 °C lower than the same data against pre-industrial. The site shows no &quot;time to 1.5 °C&quot; for that reason.</li>
          <li>The WHO counter is a count of published reports, not of outbreaks. The Doomsday Clock is a symbolic setting, not a probability.</li>
          <li>If a source stops updating, its last value stays and the feed status turns amber; the site does not go blank.</li>
        </UL>

      </>
    ) },
    { id: "alerts", label: "Alerts", group: "Computed values", content: (
      <>
        <P>
          An alert is a published observation that crossed a fixed line, nothing more. The rules are constants in <span className="mono">worker/alerts/rules.ts</span> and are checked by tests.
          The alert job runs about every 5 minutes (GitHub may delay it) and uses only primary sources.
        </P>
        <UL>
          <li><span className="text-fg">Critical:</span> earthquake of magnitude 7.0 or more (USGS, within 24 h); a tsunami bulletin of category Warning (NWS tsunami warning centers); planetary Kp of 8 or more (NOAA G4 or stronger).</li>
          <li><span className="text-fg">Notice:</span> magnitude 6.5 or more with the USGS tsunami flag; a tsunami Watch or Advisory; Kp 7 (G3).</li>
          <li>Critical alerts are sent to a Telegram channel (if configured) and make an open dashboard flash its top bar red and play a quiet tone, which can be muted. Acknowledging hides an alert on that device only.</li>
          <li>Alerts expire 6 hours after the event. A failed source keeps its previous alerts until they expire, so a feed outage never silently clears an alarm.</li>
          <li><span className="text-fg">Not covered:</span> DEFCON, because the US does not publish it and any figure would be unverifiable, and volcano alert levels, because the open feeds only report above or at the usual level.</li>
        </UL>
        <P>These messages are automatic and can be wrong or late. They are not an official warning system: follow your national authority.</P>
      </>
    ) },
    { id: "sky", label: "Sun and Moon", group: "Computed values", content: (
      <>
        <P>
          On the 3D globe the dark area is the night side and the two small markers are the Sun and the Moon straight overhead. They are computed in your browser from the clock once a minute, with no data feed.
        </P>
        <UL>
          <li><span className="text-fg">Sun:</span> the low-precision solar position of the Astronomical Almanac (mean longitude and anomaly, equation of centre), good to about 0.01°. The night edge is the great circle 90° from the subsolar point.</li>
          <li><span className="text-fg">Moon:</span> a truncated version of Meeus&apos; lunar series (mean longitude plus the main anomaly term, ecliptic latitude from the argument of latitude), good to about 0.3°. The phase comes from the Moon-Sun elongation: lit fraction = (1 − cos elongation) / 2, named waxing or waning by which side of full it is on.</li>
          <li>Right ascension is converted to a longitude with Greenwich mean sidereal time. It is accurate enough for a marker and a day/night edge, not for eclipses or navigation.</li>
          <li>On the Asteroid plot, directions of asteroids at closest approach come from JPL Horizons (geocentric right ascension), the Moon and Sun are drawn as they are now, and the angle is right ascension seen from above the North Pole. Objects Horizons cannot place are drawn hollow and positioned by date.</li>
        </UL>
      </>
    ) },
    { id: "targets", label: "Possible target areas (model)", group: "Computed values", content: (
      <>
        <P>
          The Nuclear tab has an opt-in layer of reference sites. It is an <span className="text-fg">illustrative model, not a forecast</span>: it exists so the scale of nuclear weapons can be seen on a map, and it says nothing about intentions, plans or likelihood. There is no ranking and no &quot;most likely&quot; anything.
        </P>
        <UL>
          <li><span className="text-fg">Sites:</span> bases named in the FAS Nuclear Notebook editions (strategic forces, weapons storage), coordinates as printed in the FAS Russian and Chinese tables or from Wikidata, one command site, and the capitals of the nine nuclear-armed states and the NATO nuclear-sharing hosts (GeoNames). The list is partial: some states have far more named sites in open sources than others, and Israel&apos;s capital is not classed as one in GeoNames, so it is not listed.</li>
          <li><span className="text-fg">Rings:</span> one fixed example, an airburst of 300 kt at the height that maximises blast, on flat ground in clear air. Radii follow Glasstone and Dolan, <em>The Effects of Nuclear Weapons</em> (1977), as tabulated in the MIT 8.S271 lecture notes (J. Bele), with W in kt and radius in km: fireball 0.034 W^0.40, 5 psi air blast 0.71 W^0.33, third-degree burns 0.67 W^0.41. For 300 kt that is about 0.3 km, 4.7 km and 7.0 km.</li>
          <li>Real effects depend on burst height, terrain, buildings, weather and the weapon, so the rings are order-of-magnitude guides. The example yield is not a prediction of what would be used. Distances to the nearest listed site are great-circle distances computed in your browser; your position is not sent anywhere.</li>
        </UL>
      </>
    ) },
    { id: "limits", label: "What this site does not do", group: "Boundaries", content: (
      <>
        <UL>
          <li>It makes no forecasts or probabilities of its own.</li>
          <li>It has no ash-fall, fallout or impact-damage maps. These need inputs (winds, targets, angle, yield) that nobody can know in advance, and a precise-looking map would claim more than the science does.</li>
          <li>It does not give medical doses or treatment advice. The preparedness pages link to the health authorities that issue them.</li>
          <li>It does not track you: there are no accounts, ads or analytics, and your checklist stays on your device.</li>
        </UL>

      </>
    ) },
    { id: "freshness", label: "Data freshness", group: "Computed values", content: (
      <>
        <UL>
          <li><span className="text-fg">Newest observation</span> is the timestamp of the newest value in a feed. Monthly series are shown as the month, daily series as the day, so no false precision is invented.</li>
          <li><span className="text-fg">Latency</span> is how old that observation is right now, which includes the source&apos;s own publishing delay.</li>
          <li><span className="text-fg">Fetched</span> is when this site last pulled the feed successfully (the data job runs twice an hour).</li>
          <li><span className="text-fg">LATE</span> means a feed failed or its newest observation is older than that feed&apos;s normal lag (for example 2 hours for earthquakes, 120 days for the sea-level series). A failed feed keeps its last value and is marked.</li>
          <li>Hand-entered figures carry a review date; past it, the status bar shows a warning and the data job logs one.</li>
        </UL>
        <P>The live table is on the <Link href="/sources" className="text-accent hover:underline">Sources page</Link> and behind the Freshness button on the map.</P>
      </>
    ) },
    { id: "data", label: "Data, licences, citations", group: "Boundaries", content: (
      <>
        <P>
          Every source, its licence and its last update are on the <Link href="/sources" className="text-accent hover:underline">Sources page</Link>. Scholarly citations
          were checked against the Crossref record and web links were opened. The basemap is © CARTO and © OpenStreetMap contributors. This is a personal,
          non-commercial project; some datasets (such as the submarine-cable map, CC BY-NC-SA) permit only that use. Data come from{" "}
          <Ext href="https://www.gdeltproject.org/">GDELT</Ext>, USGS, NASA, NOAA, WHO, IMF PortWatch, SIPRI, the World Bank and others listed there.
        </P>
      </>
    ) },
  ];
  return (
    <>
      <SiteNav />
      <WikiShell
        title="Methodology"
        intro={<>How things on this site are made, so you can judge them. This is a personal, ad-free project; the aim is to be useful and honest
          about uncertainty rather than dramatic.</>}
        {...PAGE_META.methodology}
        sections={sections}
      />
    </>
  );
}
