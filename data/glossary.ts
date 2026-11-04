export type GlossaryTopic = "space" | "earth" | "human" | "method";

export type GlossaryEntry = {
  id: string;
  term: string;
  topic: GlossaryTopic;
  /** one plain sentence, shown as the hover hint */
  short: string;
  /** two to four sentences for the Glossary page */
  long?: string;
  source: { label: string; url: string };
};

export const TOPIC_LABEL: Record<GlossaryTopic, string> = { space: "Space", earth: "Earth", human: "Human", method: "Method" };

const methodology = { label: "Methodology (this site)", url: "/methodology" };

/** Definitions follow the cited primary source. Terms with no source found are left out rather than guessed. */
export const GLOSSARY = [
  {
    id: "kp",
    term: "Kp index",
    topic: "space",
    short: "The planetary index of geomagnetic disturbance, from 0 (quiet) to 9 (extreme storm).",
    long: "Kp is computed from magnetometer stations around the world and reported in three-hour steps. A reading of 5 or more is a geomagnetic storm, which NOAA rates on its G scale (Kp 5 is G1, Kp 9 is G5).",
    source: { label: "NOAA SWPC: Planetary K-index", url: "https://www.swpc.noaa.gov/products/planetary-k-index" },
  },
  {
    id: "noaa-scales",
    term: "G, S and R scales",
    topic: "space",
    short: "NOAA's 1-to-5 space weather scales: G geomagnetic storms, S solar radiation storms, R radio blackouts.",
    long: "Each scale runs from 1 (minor) to 5 (extreme). G follows the Kp index, S the flux of energetic particles near Earth, and R the X-ray flux from solar flares.",
    source: { label: "NOAA SWPC: Space weather scales", url: "https://www.swpc.noaa.gov/noaa-scales-explanation" },
  },
  {
    id: "ld",
    term: "Lunar distance (LD)",
    topic: "space",
    short: "The average Earth-Moon distance, about 384,400 km, used to say how close an asteroid passes.",
    long: "1 LD is the mean distance from Earth to the Moon. A close approach of 0.5 LD is a flyby at half that distance; it is not an impact.",
    source: { label: "NASA/JPL CNEOS: Glossary", url: "https://cneos.jpl.nasa.gov/glossary/" },
  },
  {
    id: "torino",
    term: "Torino scale",
    topic: "space",
    short: "A 0-to-10 rating of the impact hazard of a near-Earth object; 0 means no hazard.",
    long: "The Torino scale combines the chance of an impact with the energy it would carry. Almost every object ever rated is 0.",
    source: { label: "NASA/JPL CNEOS: Torino scale", url: "https://cneos.jpl.nasa.gov/sentry/torino_scale.html" },
  },
  {
    id: "vei",
    term: "VEI",
    topic: "earth",
    short: "Volcanic Explosivity Index: a 0-to-8 scale of eruption size, each step about ten times larger.",
    long: "The VEI is based mainly on the volume of material an eruption throws out and how high the plume rises. A supereruption is VEI 8.",
    source: { label: "USGS Volcano Hazards Program: VEI", url: "https://volcanoes.usgs.gov/vsc/glossary/vei.html" },
  },
  {
    id: "caldera",
    term: "Caldera",
    topic: "earth",
    short: "A large basin-shaped depression left when a volcano's magma chamber empties and the ground collapses.",
    long: "Calderas are much bigger than craters, which are smaller depressions made by explosive excavation. The supervolcanoes on this site are calderas.",
    source: { label: "USGS Volcano Hazards Program: Caldera", url: "https://volcanoes.usgs.gov/vsc/glossary/caldera.html" },
  },
  {
    id: "ppm",
    term: "ppm",
    topic: "earth",
    short: "Parts per million: here, carbon dioxide molecules per million molecules of dry air.",
    source: { label: "NOAA GML: Trends in atmospheric CO₂", url: "https://gml.noaa.gov/ccgg/trends/" },
  },
  {
    id: "anomaly",
    term: "Anomaly and baseline",
    topic: "earth",
    short: "A difference from a reference average: here, global temperature against its 1951-1980 mean.",
    long: "NASA GISTEMP reports temperature as an anomaly, how much warmer or cooler a year is than the 1951-1980 baseline, because anomalies are more reliable than absolute temperatures.",
    source: { label: "NASA GISS: GISTEMP FAQ", url: "https://data.giss.nasa.gov/gistemp/faq/" },
  },
  {
    id: "don",
    term: "Disease Outbreak News (DON)",
    topic: "human",
    short: "WHO's public reports on acute health events it judges worth international attention.",
    long: "A DON report is a sign that WHO flagged an event, not a count of every outbreak and not a measure of how dangerous it is.",
    source: { label: "WHO: Disease Outbreak News", url: "https://www.who.int/emergencies/disease-outbreak-news" },
  },
  {
    id: "bsl4",
    term: "BSL-4",
    topic: "human",
    short: "Biosafety level 4: the highest laboratory containment level, for agents that pose a high risk of life-threatening disease.",
    source: { label: "CDC: Biosafety in Microbiological and Biomedical Laboratories (BMBL)", url: "https://www.cdc.gov/labs/BMBL.html" },
  },
  {
    id: "doomsday-clock",
    term: "Doomsday Clock",
    topic: "human",
    short: "A symbolic clock set each year by the Bulletin of the Atomic Scientists; a judgement, not a measurement.",
    long: "Midnight stands for global catastrophe. The setting is decided by the Bulletin's Science and Security Board and is not a probability.",
    source: { label: "Bulletin of the Atomic Scientists: Doomsday Clock", url: "https://thebulletin.org/doomsday-clock/" },
  },
  {
    id: "goldstein",
    term: "Goldstein scale",
    topic: "human",
    short: "A score from -10 (most hostile) to +10 (most cooperative) for a type of event between countries.",
    source: { label: "GDELT Project: data and documentation", url: "https://www.gdeltproject.org/data.html" },
  },
  {
    id: "gdelt",
    term: "GDELT",
    topic: "human",
    short: "An open database that codes news reports about events around the world.",
    long: "Its counts follow media coverage, so well-covered countries are over-represented.",
    source: { label: "GDELT Project", url: "https://www.gdeltproject.org/" },
  },
  {
    id: "tiers",
    term: "Evidence tiers A, B, C",
    topic: "method",
    short: "A, B or C rates how good the evidence behind a scenario is, not how likely it is.",
    source: methodology,
  },
  {
    id: "kinds",
    term: "Observed, projection, expert, model",
    topic: "method",
    short: "The four labels every claim carries: a measurement, a model's output, a named person's judgement, or an illustrative calculation.",
    source: methodology,
  },
] as const satisfies readonly GlossaryEntry[];

export type GlossaryId = (typeof GLOSSARY)[number]["id"];
