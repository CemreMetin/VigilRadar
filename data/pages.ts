import { arsenals } from "@/lib/arsenals";
import { EDGES } from "./causal";
import { ref } from "./references";
import { BAG_ITEMS, GUIDES, OFFLINE_READING, REGULATOR_LINKS } from "./survival";

/**
 * What every content page prints around its sections (see components/WikiShell.tsx): a "Last updated" date, at most
 * four key points, and the sources it cites, which become its last section. Edit the date when you edit the page's text.
 * Scenario pages carry their own key points in data/scenarios.ts and their sources are the scenario's references.
 */
export type Source = { label: string; url: string };
export type PageMeta = { updated: string; keyPoints: string[]; sources: Source[] };

const unique = (list: Source[]) => [...new Map(list.map((s) => [s.url, s])).values()];
const DATE = "2026-11-04";

export const PAGE_META = {
  survive: {
    updated: DATE,
    keyPoints: [
      "Preparation is dull and local: water, food, light, medicine, a way to get news and a plan your household has practised.",
      "The same kit covers an earthquake, a flood, a long power cut or a pandemic wave.",
      "For a radiation emergency official advice is three words: get inside, stay inside, stay tuned.",
      "Nothing here needs an account; your ticks never leave this device.",
    ],
    sources: unique([
      ...BAG_ITEMS.flatMap((i) => (i.source ? [i.source] : [])),
      ...GUIDES.map((g) => ({ label: `${g.org}: ${g.title}`, url: g.url })),
      ...REGULATOR_LINKS,
      ...OFFLINE_READING.map((o) => ({ label: o.label, url: o.url })),
    ]),
  },
  nuclear: {
    updated: `${arsenals.publishedAt} (SIPRI Yearbook)`,
    keyPoints: [
      "The Doomsday Clock is a symbolic setting by the Bulletin of the Atomic Scientists, not a measurement or a probability.",
      `SIPRI counts about ${arsenals.totals.stockpile.toLocaleString("en-US")} warheads in military stockpiles (${arsenals.asOf}).`,
      "Tension pairs describe how news reports each pair; they are not a forecast.",
      "Power plants are civil reactors, shown because a war, quake or flood near one is a risk of its own.",
    ],
    sources: [
      { label: arsenals.source.name, url: arsenals.source.url },
      { label: "Bulletin of the Atomic Scientists: Doomsday Clock", url: "https://thebulletin.org/doomsday-clock/" },
      { label: "Federation of American Scientists: Status of World Nuclear Forces", url: "https://fas.org/initiative/status-world-nuclear-forces/" },
      { label: "WRI Global Power Plant Database", url: "https://datasets.wri.org/dataset/globalpowerplantdatabase" },
      { label: "GDELT Project (media tension)", url: "https://www.gdeltproject.org/" },
    ],
  },
  health: {
    updated: DATE,
    keyPoints: [
      "WHO publishes a Disease Outbreak News report when it judges an event worth international attention.",
      "The list is a window onto what WHO flags, not a count of every outbreak.",
      "Reports do not give infectiousness or fatality rates, and this site does not guess them.",
    ],
    sources: [
      { label: "WHO Disease Outbreak News", url: "https://www.who.int/emergencies/disease-outbreak-news" },
      { label: "ECDC: threats and outbreaks (Europe)", url: "https://www.ecdc.europa.eu/en/threats-and-outbreaks" },
      { label: "WOAH WAHIS (animal diseases)", url: "https://wahis.woah.org/" },
    ],
  },
  supervolcanoes: {
    updated: DATE,
    keyPoints: [
      "Six calderas that have each produced a supereruption (VEI 7 or larger) are on the watchlist.",
      "Unrest is not an eruption, and nearly every volcano is normal nearly all the time.",
      "A long gap since the last eruption is not a countdown.",
      "Toba and Aira (Sakurajima) have no live feed on this site.",
    ],
    sources: [
      { label: "USGS Yellowstone Volcano Observatory", url: "https://www.usgs.gov/observatories/yvo" },
      { label: "USGS Volcano Hazards Program", url: "https://www.usgs.gov/programs/VHP" },
      { label: "INGV Osservatorio Vesuviano (Campi Flegrei)", url: "https://www.ov.ingv.it/" },
      { label: "GeoNet (Taupō, New Zealand)", url: "https://www.geonet.org.nz/volcano" },
      { label: "Smithsonian Global Volcanism Program (eruption history)", url: "https://volcano.si.edu/" },
    ],
  },
  trajectory: {
    updated: DATE,
    keyPoints: [
      "Observed: global surface temperature (NASA GISTEMP, against 1951-1980) and atmospheric CO₂ (Mauna Loa).",
      "IPCC scenarios are projections that depend on emission choices, not predictions.",
      "Expert estimates of existential risk are personal judgements and differ by orders of magnitude.",
    ],
    sources: [
      { label: "NASA GISTEMP v4", url: "https://data.giss.nasa.gov/gistemp/" },
      { label: "NOAA GML: Mauna Loa CO₂", url: "https://gml.noaa.gov/ccgg/trends/" },
      { label: "IPCC AR6 WGI Summary for Policymakers", url: "https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/" },
      { label: "WMO State of the Global Climate 2024", url: "https://wmo.int/files/state-of-global-climate-2024" },
      { label: ref("ord2020").text, url: ref("ord2020").url },
      { label: "Grace et al. (2024), Thousands of AI authors on the future of AI", url: "https://arxiv.org/abs/2401.02843" },
      { label: "Riley (2012), probability of extreme space weather", url: "https://doi.org/10.1029/2011SW000734" },
      { label: "USGS (2025), Cascadia earthquake probability", url: "https://pubs.usgs.gov/publication/fs20253050" },
    ],
  },
  country: {
    updated: DATE,
    keyPoints: [
      "One page per country: nuclear status, tension pairs, WHO reports, conflict coverage, supervolcanoes, water and food.",
      "Signals listed together happen at the same time; that is not one causing the other.",
      "High-coverage countries are over-represented in news-based counts.",
    ],
    sources: [
      { label: arsenals.source.name, url: arsenals.source.url },
      { label: "WHO Disease Outbreak News", url: "https://www.who.int/emergencies/disease-outbreak-news" },
      { label: "GDELT Project", url: "https://www.gdeltproject.org/" },
      { label: "World Bank open data", url: "https://data.worldbank.org/" },
      { label: "WRI Global Power Plant Database", url: "https://datasets.wri.org/dataset/globalpowerplantdatabase" },
      { label: "USGS Volcano Hazards Program", url: "https://www.usgs.gov/programs/VHP" },
    ],
  },
  links: {
    updated: DATE,
    keyPoints: [
      "Each arrow is written by hand, rated by strength of evidence and cited.",
      "This map claims cause; the automatic links on the main map (near, same country, same time) do not.",
      "Speculative arrows are hidden by default.",
    ],
    sources: unique([...new Set(EDGES.flatMap((e) => e.refs))].map((id) => ({ label: ref(id).text, url: ref(id).url }))),
  },
  methodology: {
    updated: DATE,
    keyPoints: [
      "Every claim is an observation, a projection, an expert estimate or an illustrative model, and is labelled so.",
      "The site never invents probabilities; it shows other people's, with names and sources.",
      "Tiers A, B and C rate the quality of evidence, not how likely an event is.",
      "Alerts fire when a published figure crosses a fixed line; there is no prediction engine.",
    ],
    sources: [
      { label: "GDELT Project", url: "https://www.gdeltproject.org/" },
      { label: "USGS Earthquake Hazards Program", url: "https://earthquake.usgs.gov/" },
      { label: "NOAA Space Weather Prediction Center", url: "https://www.swpc.noaa.gov/" },
      { label: "NASA/JPL Center for Near-Earth Object Studies", url: "https://cneos.jpl.nasa.gov/" },
      { label: "WHO Disease Outbreak News", url: "https://www.who.int/emergencies/disease-outbreak-news" },
      { label: "IMF PortWatch", url: "https://portwatch.imf.org/" },
      { label: arsenals.source.name, url: arsenals.source.url },
      { label: "World Bank open data", url: "https://data.worldbank.org/" },
    ],
  },
  sourcesPage: {
    updated: DATE,
    keyPoints: [
      "Every number on this site comes from an open source listed here, with its licence.",
      "The freshness table shows each feed's newest observation, its latency and when it was last fetched.",
      "Hand-entered figures carry a review date and are flagged when it passes.",
    ],
    sources: [],
  },
  scenarios: {
    updated: DATE,
    keyPoints: [
      "Twenty-three scenarios, each rated A, B or C by the quality of evidence behind it, not by how likely it is.",
      "Tier C thought experiments have their own tab and are not mixed into the others.",
      "Seven scenarios have interactive explorers.",
    ],
    sources: [],
  },
} satisfies Record<string, PageMeta>;
