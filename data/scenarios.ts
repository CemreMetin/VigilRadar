import type { Tier } from "@/components/ui";
import type { ScenarioTag } from "./survival";

/**
 * The scenario catalogue. Tiers rate the QUALITY OF EVIDENCE (is the mechanism known, is there a
 * historical precedent, is there a published model), not how likely the event is.
 *   A  documented: precedent and published scenario/model
 *   B  plausible: known mechanism, high uncertainty
 *   C  thought experiment: weak evidence, disputed, or mostly curiosity
 * Wording rules: say what happened, what models say, and who says it. No invented probabilities;
 * every number has a reference id from data/references.ts.
 */

export type Evidence = "strong" | "moderate" | "speculative";
export type ScenarioModule = "supervolcano" | "pandemic" | "nuclear" | "solar" | "asteroid" | "tipping" | "foodwater";
export type Group = "Geophysical" | "Nuclear" | "Health" | "Climate & ocean" | "Space" | "Technology" | "Food & water" | "Physics";

export type Scenario = {
  id: string;
  title: string;
  tier: Tier;
  group: Group;
  summary: string;
  chain: { step: string; evidence: Evidence }[];
  analogs: string[];
  estimates: { who: string; what: string; kind: "expert" | "observed" | "projection"; ref: string }[];
  /** counter ids from world_state to show live */
  indicators?: string[];
  module?: ScenarioModule;
  doNow: string[];
  tag?: ScenarioTag;
  caveat?: string;
  refs: string[];
  related?: string[];
};

export const SCENARIOS: Scenario[] = [
  // ======================= Tier A: documented =======================
  {
    id: "supervolcano",
    title: "Supervolcanic eruption",
    tier: "A",
    group: "Geophysical",
    summary:
      "A VEI 8 eruption throws out more than a thousand cubic kilometres of material. None has happened in human history; the largest recent one, Tambora in 1815, was a smaller VEI 7 and still cooled the planet for a year. The risk from a supereruption is dominated by what the ash and sulfur do to the climate and harvests, not by the blast.",
    chain: [
      { step: "Eruption and ashfall: thick ash over hundreds of kilometres, pyroclastic flows near the vent", evidence: "strong" },
      { step: "Sulfur gases reach the stratosphere and form a sulfate haze that reflects sunlight", evidence: "strong" },
      { step: "Global surface cooling for one to several years (about 0.5 °C after Pinatubo 1991, about 0.4–0.7 °C after Tambora)", evidence: "strong" },
      { step: "Failed harvests and price spikes (Europe's 'year without a summer', 1816)", evidence: "strong" },
      { step: "Food crisis and political instability for a VEI 8-sized event, extrapolated from smaller ones", evidence: "moderate" },
    ],
    analogs: [
      "Tambora, Indonesia, 1815 (VEI 7): the 1816 'year without a summer' and harvest failures across the northern hemisphere.",
      "Pinatubo, Philippines, 1991: about 20 million tonnes of sulfur dioxide, about 0.5 °C of global cooling for roughly two years.",
      "Past supereruptions: Yellowstone's Lava Creek about 631,000 years ago, Toba about 74,000, Taupō's Ōruanui about 25,500 years ago.",
    ],
    estimates: [
      { who: "Toby Ord", what: "1 in 10,000 chance, per century, of an existential catastrophe from a supervolcanic eruption (his own estimate)", kind: "expert", ref: "ord2020" },
    ],
    module: "supervolcano",
    doNow: [
      "For ashfall: dust masks, sealing a room, covering water supplies and keeping vehicles and roofs clear, per Ready.gov's volcano guidance.",
      "The longer-term risk is food prices, which a pantry and a household budget buffer soften.",
    ],
    tag: "ash",
    caveat:
      "Recurrence intervals are not a countdown: supereruptions are irregular and the system does not run on a clock. Unrest is common at calderas and almost never ends in an eruption; the live status above is the current picture.",
    refs: ["robock2000", "raible2016", "ord2020", "usgsYvo"],
    related: ["drought-breadbasket", "nuclear-winter"],
  },
  {
    id: "nuclear-winter",
    title: "Nuclear war and nuclear winter",
    tier: "A",
    group: "Nuclear",
    summary:
      "The immediate effects of nuclear weapons (blast, fire, fallout) are well understood. The larger uncertainty is the climate effect: burning cities could loft soot into the stratosphere, dim sunlight and shorten growing seasons worldwide. Climate-model studies agree the effect scales with the number of weapons used, and food production is the main way a regional war could become a global one.",
    chain: [
      { step: "Use of nuclear weapons against cities and industrial targets", evidence: "strong" },
      { step: "Firestorms inject soot into the stratosphere (how much depends on targets, fuel loads and fire behaviour)", evidence: "moderate" },
      { step: "Sunlight drops and the planet cools for years", evidence: "moderate" },
      { step: "Shorter growing seasons and disrupted fisheries cut global calories", evidence: "moderate" },
      { step: "Famine, trade collapse and political instability", evidence: "moderate" },
    ],
    analogs: [
      "No analog for the climate effect. Volcanic eruptions are used as a test of how models handle stratospheric dimming.",
      "Hiroshima and Nagasaki (1945) are the only wartime uses; modern arsenals and cities are very different.",
    ],
    estimates: [
      { who: "Xia et al. 2022 (Nature Food)", what: "A regional war between India and Pakistan injecting 5 Tg of soot: global average calorie production falls about 7%. Larger wars: far larger losses; the authors' summary states that most of the world's population would face starvation after a US–Russia war.", kind: "projection", ref: "xia2022" },
      { who: "Toby Ord", what: "1 in 1,000 chance, per century, of an existential catastrophe from nuclear war (his own estimate)", kind: "expert", ref: "ord2020" },
    ],
    indicators: ["doomsday-clock", "warheads"],
    module: "nuclear",
    doNow: [
      "Official guidance if a detonation or radiological release occurs: get inside, stay inside, stay tuned, for at least 24 hours (Ready.gov).",
      "Know your shelter room and keep a battery radio. Potassium iodide only on official advice.",
    ],
    tag: "nuclear",
    caveat:
      "The climate effect is modelled, not observed, and the soot estimates are debated. The Doomsday Clock is a symbolic setting, not a probability, and the tension index on this site describes media coverage, not intent.",
    refs: ["xia2022", "coupe2019", "robock2007", "sipri2026", "bulletin", "ord2020"],
    related: ["drought-breadbasket", "supervolcano"],
  },
  {
    id: "pandemic-x",
    title: "Pandemic X (natural)",
    tier: "A",
    group: "Health",
    summary:
      "A new respiratory pathogen that spreads before it is noticed. COVID-19 showed how quickly air travel carries a virus around the world and how much damage a pandemic does without being an extinction threat. The explorer on this page uses a published method to show the order in which cities might be reached.",
    chain: [
      { step: "Spillover from animals, or a mutation, into a pathogen that transmits between people", evidence: "strong" },
      { step: "Local outbreak goes unnoticed for weeks, then seeds new cities by air travel", evidence: "strong" },
      { step: "Health systems overwhelmed, supply chains disrupted", evidence: "strong" },
      { step: "Economic and political stress lasting years", evidence: "moderate" },
    ],
    analogs: [
      "COVID-19: WHO estimates 14.9 million excess deaths in 2020 and 2021.",
      "1918 influenza: about 50 million deaths, with a published range of 17 to 100 million.",
    ],
    estimates: [
      { who: "Toby Ord", what: "1 in 10,000 chance, per century, of an existential catastrophe from a naturally arising pandemic (his own estimate). COVID-19 was catastrophic but not an existential event.", kind: "expert", ref: "ord2020" },
    ],
    indicators: ["outbreaks"],
    module: "pandemic",
    doNow: [
      "Keep a few weeks of regular medicines, shelf-stable food and respirator masks.",
      "Follow national public-health guidance early; most of the protection comes from early, simple measures.",
    ],
    tag: "pandemic",
    caveat:
      "The spread model uses a crude flux proxy (airline routes, mostly 2017) and a single growth rate. Treat the order of arrival as informative and the absolute days as rough.",
    refs: ["brockmann2013", "whoExcess", "johnson2002", "ord2020"],
    related: ["engineered-pandemic", "amr", "dormant-pathogens"],
  },
  {
    id: "solar-superstorm",
    title: "Solar superstorm (Carrington-class)",
    tier: "A",
    group: "Space",
    summary:
      "A coronal mass ejection strong enough to induce damaging currents in long power lines and pipelines, disable satellites and disrupt navigation. The 1859 Carrington event disrupted telegraph systems worldwide, with reports of sparks and fires; a far weaker storm in 1989 blacked out Quebec for about nine hours. A repeat today would hit a much more electrified world.",
    chain: [
      { step: "A large coronal mass ejection hits Earth's magnetic field", evidence: "strong" },
      { step: "Geomagnetically induced currents flow through long conductors (power lines, pipelines)", evidence: "strong" },
      { step: "Transformer damage and regional blackouts (Quebec, 1989)", evidence: "strong" },
      { step: "Satellite damage, GNSS errors and radio blackouts", evidence: "strong" },
      { step: "Duration of a continental-scale outage depends on transformer replacement times", evidence: "moderate" },
    ],
    analogs: [
      "Carrington event, September 1859.",
      "Quebec blackout, March 1989: the Hydro-Québec grid collapsed in seconds.",
      "May 2024: an extreme (G5) storm, the first G5 since 2003, with no grid collapse.",
    ],
    estimates: [
      { who: "Riley 2012", what: "About a 12% chance of a Carrington-class event per decade, from a power-law fit. Later work by Riley and others puts it nearer 10%, and different methods give anywhere from about 1.5% to 85%.", kind: "expert", ref: "riley2012" },
    ],
    indicators: ["kp"],
    module: "solar",
    doNow: [
      "Prepare for a long power cut: radio, light, water, food that needs no cooking, paper maps.",
      "Do not rely on GPS alone for navigation.",
    ],
    tag: "blackout",
    caveat: "How bad a storm of this size would be for modern grids is uncertain: operators have improved protections since 1989, but exposure has grown.",
    refs: ["cliver2013", "boteler2019", "riley2012", "swpcStorms"],
    related: ["grid-cyber", "kessler"],
  },
  {
    id: "asteroid",
    title: "Asteroid or comet impact",
    tier: "A",
    group: "Space",
    summary:
      "Impacts shaped Earth's history: the Chicxulub impact about 66 million years ago is linked to the mass extinction that ended the dinosaurs. Small objects hit often and harmlessly; city-destroying ones are rare; civilisation-threatening ones are very rare. For the first time in history we can look for them, and in 2022 NASA's DART mission showed one can be nudged.",
    chain: [
      { step: "Impact or airburst releases energy (a 20 m object over Chelyabinsk released about 0.5 megatonnes)", evidence: "strong" },
      { step: "Regional blast damage, or tsunami for ocean impacts", evidence: "strong" },
      { step: "Only for objects of several kilometres: global dust and soot cooling and mass extinction", evidence: "strong" },
    ],
    analogs: [
      "Chicxulub, about 66 million years ago.",
      "Tunguska, 1908: an airburst that flattened forest over about 2,000 km².",
      "Chelyabinsk, 2013: an airburst that injured over a thousand people, mostly from shattered glass.",
      "DART, 2022: a spacecraft changed the orbital period of the asteroid Dimorphos by about 33 minutes.",
    ],
    estimates: [
      { who: "Toby Ord", what: "1 in 1,000,000 chance, per century, of an existential catastrophe from an asteroid or comet (his own estimate)", kind: "expert", ref: "ord2020" },
    ],
    indicators: ["asteroids"],
    module: "asteroid",
    doNow: ["Nothing specific: warning times for known objects are long and the response is official. Follow NASA's planetary-defense updates."],
    caveat:
      "The close-approach list shows known objects that miss Earth. NASA's Sentry system tracks objects with a non-zero impact chance over about a century; most have vanishingly small probabilities.",
    refs: ["alvarez1980", "popova2013", "thomas2023", "collins2005", "sentry", "nasaDefense"],
    related: ["supervolcano"],
  },
  {
    id: "cascadia",
    title: "Cascadia megathrust earthquake and tsunami",
    tier: "A",
    group: "Geophysical",
    summary:
      "The Cascadia subduction zone off the US and Canadian Pacific Northwest last ruptured on 26 January 1700, an earthquake of about magnitude 9 documented by Japanese tsunami records. It will rupture again. Coastal communities would have minutes, not hours, between the shaking and the tsunami.",
    chain: [
      { step: "A rupture of hundreds of kilometres of the plate boundary, magnitude about 9", evidence: "strong" },
      { step: "Minutes of violent shaking across the region", evidence: "strong" },
      { step: "A tsunami reaches the coast within minutes to under an hour", evidence: "strong" },
      { step: "Roads, ports and power lines fail; outside help takes days to arrive", evidence: "moderate" },
    ],
    analogs: ["Cascadia, 1700.", "Tōhoku, Japan, 11 March 2011 (magnitude 9.0-9.1): a tsunami killed about 18,000 people."],
    estimates: [
      { who: "USGS (2025)", what: "A 10–15% chance of a magnitude ~9 Cascadia earthquake in the next 50 years", kind: "projection", ref: "usgsCascadia" },
    ],
    doNow: ["Know the tsunami evacuation routes and walk them. Move to high ground on strong shaking: do not wait for a siren.", "Keep a grab-and-go bag and 2 weeks of supplies at home, as local authorities advise."],
    tag: "quake",
    refs: ["usgsCascadia"],
    related: ["marmara"],
  },
  {
    id: "marmara",
    title: "A large earthquake near Istanbul (Marmara)",
    tier: "A",
    group: "Geophysical",
    summary:
      "The North Anatolian Fault runs under the Sea of Marmara, close to Istanbul. Segments of it have broken one after another through the 20th century, and the stretch south of Istanbul has not produced a major rupture for a long time. Türkiye has lived through this: the 1999 İzmit earthquake and the 2023 Kahramanmaraş earthquakes.",
    chain: [
      { step: "A rupture of the Marmara segment, likely magnitude 7 or more", evidence: "strong" },
      { step: "Strong shaking in a metropolitan area of over 15 million", evidence: "strong" },
      { step: "Damage depends overwhelmingly on building quality and enforcement", evidence: "strong" },
      { step: "Fire, gas and infrastructure failures follow; the response is a test of preparation", evidence: "moderate" },
    ],
    analogs: [
      "İzmit, 17 August 1999 (magnitude 7.6): between about 17,000 and 18,000 deaths.",
      "Kahramanmaraş, 6 February 2023 (magnitudes 7.8 and 7.5, nine hours apart): at least 53,000 deaths in Türkiye by official figures.",
    ],
    estimates: [
      { who: "Parsons (2004)", what: "A published recalculation of the probability of an M ≥ 7 earthquake beneath the Sea of Marmara. Estimates are large, in the tens of percent over a few decades, and depend on the model; see the paper for ranges.", kind: "projection", ref: "parsons2004" },
    ],
    doNow: ["Secure heavy furniture; know your building's condition and your gathering point.", "Keep a grab-and-go bag by the door (AFAD and Kızılay publish checklists)."],
    tag: "quake",
    caveat: "Nobody can predict the date of an earthquake. Probabilities describe decades, not months.",
    refs: ["parsons2004"],
    related: ["cascadia"],
  },
  {
    id: "arkstorm",
    title: "Megaflood: the ARkStorm",
    tier: "A",
    group: "Climate & ocean",
    summary:
      "A scenario by the US Geological Survey based on a real event: the 1861-62 storm sequence that flooded California's Central Valley. A chain of atmospheric rivers would drop weeks of rain, flooding cities and farmland and triggering landslides. It is a good model of how a weather extreme becomes a long-lasting infrastructure disaster.",
    chain: [
      { step: "A sequence of strong atmospheric rivers lasting weeks", evidence: "strong" },
      { step: "River and levee failures flood the Central Valley; landslides cut roads", evidence: "strong" },
      { step: "Power, water and transport failures; evacuations of large populations", evidence: "moderate" },
    ],
    analogs: ["California's 1861-62 floods and geological evidence of repeated megafloods in the region."],
    estimates: [
      { who: "USGS (2010)", what: "Scenario losses up to $725 billion, mostly flooding and business interruption", kind: "projection", ref: "usgsArk" },
    ],
    doNow: ["Know your flood risk and evacuation route; keep documents in a waterproof bag.", "Keep a stock of drinking water; floods contaminate supplies."],
    tag: "flood",
    refs: ["usgsArk"],
    related: ["drought-breadbasket"],
  },
  {
    id: "wet-bulb",
    title: "Lethal heat and humidity (wet-bulb)",
    tier: "A",
    group: "Climate & ocean",
    summary:
      "Humans cool themselves by sweating, which stops working when the air is both hot and humid. The combined measure is wet-bulb temperature. A long-cited theoretical ceiling is 35 °C, but laboratory tests on healthy young adults found harm well below that, and older or ill people are more vulnerable. Heat waves are already among the deadliest weather events.",
    chain: [
      { step: "Rising temperature and humidity push wet-bulb readings up", evidence: "strong" },
      { step: "Heat stress and deaths rise, especially without cooling or at night", evidence: "strong" },
      { step: "Outdoor work becomes unsafe for parts of the year; power demand spikes", evidence: "moderate" },
      { step: "Heat plus blackout is the dangerous combination", evidence: "moderate" },
    ],
    analogs: ["Conditions approaching 35 °C wet-bulb have been recorded briefly in the Persian Gulf and South Asia."],
    estimates: [
      { who: "Sherwood & Huber (2010)", what: "A theoretical human limit near 35 °C wet-bulb", kind: "expert", ref: "sherwood2010" },
      { who: "Vecellio et al. (2022)", what: "Lab measurements found the limit for young healthy adults lower than 35 °C", kind: "observed", ref: "vecellio2022" },
    ],
    doNow: ["Know where a cool place is; check on older neighbours; drink water; avoid midday exertion."],
    tag: "heat",
    refs: ["sherwood2010", "raymond2020", "vecellio2022"],
    related: ["climate-tipping", "grid-cyber"],
  },
  {
    id: "amr",
    title: "Antibiotic resistance",
    tier: "A",
    group: "Health",
    summary:
      "Bacteria evolve resistance to the drugs that kill them, and overuse speeds it up. This is not a sudden event but a slow loss of an invention modern medicine relies on: surgery, cancer chemotherapy and caring for premature babies all depend on antibiotics that work.",
    chain: [
      { step: "Overuse and misuse of antibiotics in humans and animals", evidence: "strong" },
      { step: "Resistant strains spread between people, animals and the environment", evidence: "strong" },
      { step: "Routine infections become harder and costlier to treat", evidence: "strong" },
    ],
    analogs: ["Already happening: tuberculosis and other infections with drug-resistant forms."],
    estimates: [
      { who: "Murray et al. (2022)", what: "In 2019, an estimated 4.95 million deaths were associated with bacterial resistance, of which 1.27 million were directly attributable to it", kind: "observed", ref: "murray2022" },
    ],
    doNow: ["Use antibiotics only when prescribed and finish the course as directed; vaccines also reduce the need."],
    tag: "pandemic",
    refs: ["murray2022"],
    related: ["pandemic-x"],
  },
  {
    id: "drought-breadbasket",
    title: "Mega-drought and breadbasket failure",
    tier: "A",
    group: "Food & water",
    summary:
      "A large share of the world's grain comes from a handful of regions and a few shipping chokepoints. A simultaneous drought or heat wave in several of them, or a blockade, can push food prices up sharply. Price spikes, more than absolute shortages, have preceded unrest and hunger.",
    chain: [
      { step: "Extreme weather or a blockade hits several major grain regions or chokepoints at once", evidence: "moderate" },
      { step: "Export bans and price spikes (Russia banned wheat exports after its 2010 heat wave)", evidence: "strong" },
      { step: "Hunger rises in import-dependent countries, and unrest follows in some cases", evidence: "moderate" },
    ],
    analogs: ["The 2007-08 and 2010-11 food-price spikes.", "Lloyd's, with Anglia Ruskin University, modelled a 'food system shock' scenario in 2015: three simultaneous weather and crop events that quadruple grain prices."],
    estimates: [
      { who: "Lagi, Bertrand & Bar-Yam (2011)", what: "Food prices exceeding a threshold preceded the unrest of 2011 in North Africa and the Middle East (correlation, with other drivers present)", kind: "observed", ref: "lagi2011" },
    ],
    indicators: ["chokepoints"],
    module: "foodwater",
    doNow: ["Keep a few weeks of shelf-stable food you normally eat; a pantry also buffers price shocks."],
    tag: "blackout",
    caveat: "The link between food prices and conflict is real but contested; many other factors matter.",
    refs: ["lagi2011", "lloydsFood", "mach2019"],
    related: ["supervolcano", "nuclear-winter", "climate-tipping"],
  },
  {
    id: "kessler",
    title: "Kessler syndrome (orbital debris cascade)",
    tier: "A",
    group: "Space",
    summary:
      "Every collision in low Earth orbit makes fragments that can cause more collisions. Kessler and Cour-Palais described the risk in 1978. In 2009 two intact satellites collided for the first time. A runaway cascade would make some orbits unusable for years and take out services we rely on without noticing.",
    chain: [
      { step: "A collision or anti-satellite test creates a debris cloud", evidence: "strong" },
      { step: "Fragments raise the collision rate for nearby satellites", evidence: "moderate" },
      { step: "Loss of satellite services: navigation, weather, communications", evidence: "moderate" },
    ],
    analogs: ["The 2009 collision of Iridium 33 and Cosmos 2251."],
    estimates: [],
    doNow: ["Do not rely on satellite navigation alone: carry a paper map and a compass for outdoor trips."],
    tag: "blackout",
    caveat: "A full runaway cascade is a model result; the real question is how debris accumulates in specific orbits.",
    refs: ["kessler1978", "odqn2009"],
    related: ["solar-superstorm"],
  },

  // ======================= Tier B: plausible =======================
  {
    id: "climate-tipping",
    title: "Climate tipping cascade",
    tier: "B",
    group: "Climate & ocean",
    summary:
      "Parts of the climate system (ice sheets, ocean circulation, permafrost, rainforest) may have thresholds beyond which change becomes self-sustaining. Armstrong McKay and colleagues (2022) assessed 16 such elements; five may already be at risk at today's warming, and more become likely at 1.5-2 °C.",
    chain: [
      { step: "Warming crosses a threshold for an element (ice sheet, circulation, permafrost, reefs)", evidence: "moderate" },
      { step: "The change continues on its own for decades to millennia", evidence: "moderate" },
      { step: "Effects: sea-level rise, shifted rainfall, lost ecosystems; some feed back on warming", evidence: "moderate" },
    ],
    analogs: ["Past abrupt changes in the paleoclimate record."],
    estimates: [
      { who: "WMO (2025)", what: "2024 was about 1.55 ± 0.13 °C above 1850-1900; the long-term warming level is estimated at 1.34-1.41 °C", kind: "observed", ref: "wmo2024" },
      { who: "IPCC AR6", what: "Warming by 2081-2100 of about 1.4 °C (very low emissions) to 4.4 °C (very high emissions)", kind: "projection", ref: "ar6wg1" },
    ],
    indicators: ["warming", "co2"],
    module: "tipping",
    doNow: ["Personal preparedness helps with the effects (floods, heat, storms) but the cause is collective."],
    tag: "flood",
    caveat: "Thresholds and timescales are uncertain; each element has a wide range. Passing a threshold does not mean the change is instant.",
    refs: ["armstrongMcKay2022", "lenton2019", "wmo2024", "ar6wg1"],
    related: ["wet-bulb", "drought-breadbasket"],
  },
  {
    id: "engineered-pandemic",
    title: "Engineered pandemic",
    tier: "B",
    group: "Health",
    summary:
      "Advances in biotechnology make it cheaper to work with pathogens, which raises the worry that a deliberate or accidental release could be worse than a natural pandemic. This page deliberately gives no technical detail. It exists because expert estimates for this risk are among the highest in the existential-risk literature.",
    chain: [
      { step: "Biotechnology capabilities spread and costs fall", evidence: "moderate" },
      { step: "A release of an enhanced or engineered pathogen, deliberate or accidental", evidence: "speculative" },
      { step: "Spread as in any pandemic, with fewer natural limits on severity", evidence: "speculative" },
    ],
    analogs: ["No engineered pandemic has occurred. Historical state bioweapons programmes existed, and laboratory accidents have happened."],
    estimates: [
      { who: "Toby Ord", what: "1 in 30 chance, per century, of an existential catastrophe from engineered pandemics (his own estimate; widely discussed and debated)", kind: "expert", ref: "ord2020" },
    ],
    doNow: ["Public-health preparedness and surveillance are the shared defence. Personally: the same household preparation as for any pandemic."],
    tag: "pandemic",
    caveat: "These are subjective expert estimates with very wide uncertainty; other experts rate the risk much lower.",
    refs: ["ord2020"],
    related: ["pandemic-x"],
  },
  {
    id: "grid-cyber",
    title: "Grid or cyber collapse",
    tier: "B",
    group: "Technology",
    summary:
      "Modern life runs on tightly coupled systems: electricity, communications, water, fuel and payments all depend on each other. A cyberattack, a solar storm or a cascading technical failure could take out several at once. The cyberattack on Ukraine's grid in December 2015 showed the first part is possible.",
    chain: [
      { step: "An attack, storm or failure takes down part of the grid", evidence: "strong" },
      { step: "Dependent systems (telecoms, water pumping, fuel, payments) fail within hours or days", evidence: "moderate" },
      { step: "Duration depends on how long it takes to restore physical equipment and trust in systems", evidence: "moderate" },
    ],
    analogs: ["Ukraine, December 2015: attackers caused outages for about 225,000 customers at three distribution companies."],
    estimates: [],
    doNow: ["The same kit as for any long outage: water, food, light, radio, cash, paper contacts, and a plan for medicines that need refrigeration."],
    tag: "blackout",
    refs: ["cisa2016"],
    related: ["solar-superstorm", "kessler"],
  },
  {
    id: "ocean-anoxia",
    title: "Ocean deoxygenation and acidification",
    tier: "B",
    group: "Climate & ocean",
    summary:
      "The ocean absorbs about 30% of the CO₂ we emit, which makes seawater more acidic, and warmer water holds less oxygen. Together they stress corals, shellfish and fisheries. The worry is a slow loss of ocean life that people depend on for food, not a sudden event.",
    chain: [
      { step: "More CO₂ dissolves in the ocean, lowering pH", evidence: "strong" },
      { step: "Warming and layering of the ocean reduce oxygen (a decline of more than 2% over 1960-2010)", evidence: "strong" },
      { step: "Stress on coral reefs and shell-forming organisms; shifts in fish distribution", evidence: "moderate" },
      { step: "Effects on fisheries and coastal food security", evidence: "moderate" },
    ],
    analogs: ["Past ocean anoxic events in the geological record."],
    estimates: [
      { who: "Schmidtko et al. (2017)", what: "Global ocean oxygen content declined by more than 2% between 1960 and 2010", kind: "observed", ref: "schmidtko2017" },
    ],
    doNow: ["Little personal action applies. Sustainable seafood choices and coastal planning are collective."],
    refs: ["schmidtko2017", "noaaAcid"],
    related: ["climate-tipping"],
  },
  {
    id: "biodiversity",
    title: "Biodiversity and pollinator decline",
    tier: "B",
    group: "Food & water",
    summary:
      "The 2019 IPBES assessment estimated that around a million species are threatened with extinction. For food, the most direct link is pollination: a large share of crops benefits from animal pollinators. The risk is gradual loss of yield and resilience rather than a single event.",
    chain: [
      { step: "Habitat loss, climate change, pollution, invasive species", evidence: "strong" },
      { step: "Declines in pollinators and other ecosystem services", evidence: "moderate" },
      { step: "Lower or more volatile yields for some crops; weaker resilience to shocks", evidence: "moderate" },
    ],
    analogs: ["Local pollinator losses and the regional collapse of some fisheries."],
    estimates: [
      { who: "IPBES (2019)", what: "About 1 million species threatened with extinction", kind: "observed", ref: "ipbes2019" },
      { who: "Klein et al. (2007)", what: "Crops that depend on animal pollination account for about 35% of global crop production by volume", kind: "observed", ref: "klein2007" },
    ],
    doNow: ["Plant pollinator-friendly flowers; reduce pesticide use at home."],
    refs: ["ipbes2019", "klein2007"],
    related: ["drought-breadbasket"],
  },
  {
    id: "ai-risk",
    title: "Advanced AI risk",
    tier: "B",
    group: "Technology",
    summary:
      "Some researchers argue that increasingly capable AI systems could cause catastrophic harm, through misuse or through systems that pursue goals humans did not intend. Others consider this speculative. There is no live data to track, so this page only shows what experts say, and how much they disagree.",
    chain: [
      { step: "AI capability grows quickly", evidence: "moderate" },
      { step: "Misuse, accidents or misaligned goals cause serious harm", evidence: "speculative" },
      { step: "Harm at a scale that is hard to reverse", evidence: "speculative" },
    ],
    analogs: ["None for the extreme outcomes. Smaller harms (misinformation, fraud, automation) are already visible."],
    estimates: [
      { who: "Toby Ord", what: "1 in 10 chance, per century, of an existential catastrophe from unaligned AI (his own estimate, the highest in his table)", kind: "expert", ref: "ord2020" },
      { who: "Grace et al. (2024)", what: "In a survey of 2,778 AI researchers, between 38% and 51% (depending on the question) gave at least a 10% chance to outcomes as bad as human extinction; answers varied widely", kind: "expert", ref: "grace2024" },
    ],
    doNow: ["Nothing practical at household level. Following the policy debate is the main way to engage."],
    caveat: "These are opinions, not measurements. Wide disagreement among experts is the main finding.",
    refs: ["ord2020", "grace2024"],
    related: ["engineered-pandemic"],
  },

  // ======================= Tier C: thought experiments =======================
  {
    id: "dormant-pathogens",
    title: "Pathogens released by thawing permafrost",
    tier: "C",
    group: "Health",
    summary:
      "Frozen soil preserves microbes. As permafrost thaws, some old microbes can wake up. This has been shown for viruses that infect amoebae, and an anthrax outbreak in Siberia in 2016 was linked to a thawed carcass. A new human pandemic from permafrost is a thought experiment with no documented example.",
    chain: [
      { step: "Permafrost thaws and releases old organic material and microbes", evidence: "strong" },
      { step: "Some ancient microbes remain viable (shown for amoeba viruses and anthrax spores)", evidence: "moderate" },
      { step: "A pathogen that infects humans emerges and spreads", evidence: "speculative" },
    ],
    analogs: ["Yamal peninsula anthrax outbreak, 2016.", "Revived 30,000-year-old and 48,500-year-old amoeba viruses, which do not infect humans."],
    estimates: [],
    doNow: ["Nothing specific; the general pandemic preparation applies."],
    tag: "pandemic",
    caveat: "Hypothetical for humans. No human pandemic has been traced to permafrost.",
    refs: ["timofeev2019", "legendre2014", "alempic2023"],
    related: ["pandemic-x", "climate-tipping"],
  },
  {
    id: "cumbre-vieja",
    title: "Cumbre Vieja mega-tsunami",
    tier: "C",
    group: "Geophysical",
    summary:
      "A 2001 paper warned that a collapse of the Cumbre Vieja volcano on La Palma could send a giant tsunami across the Atlantic. Later modelling found much smaller waves, and geologists doubt a single huge collapse. It is mainly a cautionary tale about a worst-case model becoming a headline.",
    chain: [
      { step: "A large flank collapse of the volcano into the sea", evidence: "speculative" },
      { step: "A tsunami crosses the Atlantic", evidence: "speculative" },
    ],
    analogs: ["Real flank-collapse tsunamis exist (for example Krakatau 2018 locally), but not at the scale of the original scenario."],
    estimates: [
      { who: "Ward & Day (2001)", what: "Original scenario: a very large Atlantic-wide tsunami", kind: "projection", ref: "ward2001" },
      { who: "Løvholt et al. (2008)", what: "A re-analysis found the propagated waves much smaller", kind: "projection", ref: "lovholt2008" },
    ],
    doNow: ["Nothing: but coastal tsunami awareness is worthwhile anywhere near a coast."],
    caveat: "Treated as largely refuted, kept here because it is widely cited.",
    refs: ["ward2001", "lovholt2008"],
  },
  {
    id: "grb",
    title: "Gamma-ray burst or nearby supernova",
    tier: "C",
    group: "Space",
    summary:
      "A gamma-ray burst or supernova close enough and aimed at Earth could strip part of the ozone layer. It has been proposed as a cause of an ancient mass extinction, but the evidence is thin. The odds in any given century are extremely small.",
    chain: [
      { step: "A rare cosmic explosion within a few thousand light years, beamed toward Earth", evidence: "speculative" },
      { step: "Ozone depletion and increased ultraviolet at the surface", evidence: "speculative" },
    ],
    analogs: ["Proposed, not proven, for the late Ordovician extinction."],
    estimates: [
      { who: "Toby Ord", what: "1 in 1 billion chance, per century, of an existential catastrophe from a stellar explosion (his own estimate)", kind: "expert", ref: "ord2020" },
      { who: "Melott et al. (2004)", what: "Hypothesis that a gamma-ray burst triggered the late Ordovician extinction", kind: "expert", ref: "melott2004" },
    ],
    doNow: ["Nothing to do. It is a fun fact about the universe."],
    refs: ["ord2020", "melott2004"],
  },
  {
    id: "pole-reversal",
    title: "Magnetic pole reversal catastrophe",
    tier: "C",
    group: "Physics",
    summary:
      "Earth's magnetic poles have flipped many times, most recently about 780,000 years ago. Popular stories say a reversal would strip away the atmosphere or cause mass extinction. The scientific consensus is that there is no such link; the field weakens during a reversal, but life has survived many.",
    chain: [
      { step: "The magnetic field weakens and becomes complex during a reversal", evidence: "strong" },
      { step: "More charged particles reach the upper atmosphere", evidence: "moderate" },
      { step: "Catastrophic biological effects", evidence: "speculative" },
    ],
    analogs: ["The fossil record shows no consistent link between reversals and extinctions."],
    estimates: [],
    doNow: ["Nothing to do. A weaker field would increase some satellite and radiation risks, but not an apocalypse."],
    caveat: "Mostly a myth; included to say so.",
    refs: ["glassmeier2010"],
    related: ["solar-superstorm"],
  },
  {
    id: "vacuum-decay",
    title: "Vacuum decay and particle-physics accidents",
    tier: "C",
    group: "Physics",
    summary:
      "Measurements of the Higgs boson suggest our vacuum may be metastable: in principle it could decay into a lower-energy state, destroying everything. The estimated lifetime exceeds the age of the universe by many orders of magnitude. Before the Large Hadron Collider started, safety reviews also assessed hypothetical micro black holes and strangelets and found no danger.",
    chain: [
      { step: "A vacuum-decay bubble nucleates somewhere in the universe", evidence: "speculative" },
      { step: "It expands at nearly the speed of light, with no warning", evidence: "speculative" },
    ],
    analogs: ["Cosmic rays have been hitting matter with far higher energies than any collider for billions of years without incident, a main argument of the LHC safety review."],
    estimates: [],
    doNow: ["Nothing. There would be no warning and nothing to prepare for."],
    caveat: "Included as a physics curiosity, not a risk to plan for.",
    refs: ["buttazzo2013", "ellis2008"],
  },
];

export const SCENARIO_BY_ID = Object.fromEntries(SCENARIOS.map((s) => [s.id, s])) as Record<string, Scenario>;
