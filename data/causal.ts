import type { Evidence } from "./scenarios";

/**
 * Hand-curated causal links between risks. This is the only place the site claims "A can cause B".
 * Everything computed automatically (nearness, same country, same time) is NOT causal and lives in
 * worker/links.ts. Rules: every strong or moderate link has at least one citation; speculative
 * links are hidden by default; each note says what the evidence does and does not show.
 */

export type CausalNode = { id: string; label: string; col: 0 | 1 | 2; y: number; domain: string };

export const NODES: CausalNode[] = [
  // drivers
  { id: "nuclear", label: "Nuclear war", col: 0, y: 40, domain: "nuclear" },
  { id: "volcano", label: "Supereruption", col: 0, y: 105, domain: "geophysical" },
  { id: "impact", label: "Large impact", col: 0, y: 170, domain: "space" },
  { id: "solar", label: "Solar superstorm", col: 0, y: 235, domain: "space" },
  { id: "climate", label: "Climate change", col: 0, y: 300, domain: "climate" },
  { id: "permafrost", label: "Permafrost thaw", col: 0, y: 365, domain: "climate" },
  // mechanisms
  { id: "aerosols", label: "Stratospheric soot / aerosols", col: 1, y: 70, domain: "climate" },
  { id: "cooling", label: "Cooling, short growing seasons", col: 1, y: 135, domain: "climate" },
  { id: "water", label: "Water stress, drought", col: 1, y: 200, domain: "climate" },
  { id: "grid", label: "Grid and comms failure", col: 1, y: 265, domain: "space" },
  { id: "health", label: "Health-system collapse", col: 1, y: 330, domain: "health" },
  { id: "conflict", label: "Armed conflict", col: 1, y: 395, domain: "conflict" },
  // outcomes
  { id: "famine", label: "Crop failure, famine", col: 2, y: 105, domain: "climate" },
  { id: "pandemic", label: "Pandemic spread", col: 2, y: 235, domain: "health" },
  { id: "instability", label: "Political instability", col: 2, y: 300, domain: "conflict" },
  { id: "displacement", label: "Mass displacement", col: 2, y: 395, domain: "conflict" },
];

export type CausalEdge = {
  id: string;
  from: string;
  to: string;
  evidence: Evidence;
  note: string;
  refs: string[];
};

export const EDGES: CausalEdge[] = [
  { id: "nuclear>aerosols", from: "nuclear", to: "aerosols", evidence: "moderate",
    note: "Firestorms in burning cities could lift soot into the stratosphere. This rests on climate-model studies; it has never been observed, and how much soot a war would make is debated.",
    refs: ["robock2007", "coupe2019"] },
  { id: "volcano>aerosols", from: "volcano", to: "aerosols", evidence: "strong",
    note: "Observed directly: sulfur from Pinatubo (1991) and Tambora (1815) formed a stratospheric haze.",
    refs: ["robock2000", "raible2016"] },
  { id: "impact>aerosols", from: "impact", to: "aerosols", evidence: "moderate",
    note: "For an object of several kilometres (Chicxulub) the geological evidence is strong. Small impacts do not do this.",
    refs: ["alvarez1980"] },
  { id: "aerosols>cooling", from: "aerosols", to: "cooling", evidence: "strong",
    note: "A stratospheric haze reflects sunlight and cools the surface for one to several years. Measured after Pinatubo.",
    refs: ["robock2000"] },
  { id: "cooling>famine", from: "cooling", to: "famine", evidence: "strong",
    note: "The 1816 harvest failures after Tambora are well documented. Modern-scale projections (nuclear soot) are models, not observations.",
    refs: ["raible2016", "xia2022"] },
  { id: "climate>water", from: "climate", to: "water", evidence: "strong",
    note: "Warming changes rainfall patterns and raises evaporation, increasing drought and water stress in many regions (IPCC AR6).",
    refs: ["ar6wg1"] },
  { id: "climate>famine", from: "climate", to: "famine", evidence: "moderate",
    note: "Heat and drought reduce yields of major crops in many regions; the net global effect depends on adaptation.",
    refs: ["ar6wg1"] },
  { id: "climate>permafrost", from: "climate", to: "permafrost", evidence: "strong",
    note: "Abrupt permafrost thaw is among the elements assessed as possibly already at risk at today's warming.",
    refs: ["armstrongMcKay2022"] },
  { id: "water>conflict", from: "water", to: "conflict", evidence: "moderate",
    note: "Contested. A systematic expert assessment found climate to be a real but comparatively minor driver of armed conflict, well behind factors such as low development and weak governance.",
    refs: ["mach2019"] },
  { id: "solar>grid", from: "solar", to: "grid", evidence: "strong",
    note: "Quebec's grid collapsed in the March 1989 storm. How bad a Carrington-size storm would be today is uncertain.",
    refs: ["boteler2019", "cliver2013"] },
  { id: "conflict>health", from: "conflict", to: "health", evidence: "strong",
    note: "WHO documents attacks on health care in conflicts, which destroy facilities and drive out staff.",
    refs: ["whoSsa"] },
  { id: "famine>instability", from: "famine", to: "instability", evidence: "moderate",
    note: "Food-price spikes preceded unrest in 2008 and 2011. This is a correlation with other drivers present, not proof of cause.",
    refs: ["lagi2011"] },
  { id: "conflict>displacement", from: "conflict", to: "displacement", evidence: "strong",
    note: "Armed conflict is a leading cause of forced displacement (UNHCR reports annually).",
    refs: ["unhcr"] },
  { id: "grid>health", from: "grid", to: "health", evidence: "speculative",
    note: "Hospitals depend on power and many have backup for only a limited time; the effect of long outages on health systems has not been studied systematically at continental scale.",
    refs: [] },
  { id: "health>pandemic", from: "health", to: "pandemic", evidence: "speculative",
    note: "Outbreaks are harder to detect and contain where health systems are damaged, but the size of the effect is uncertain.",
    refs: [] },
  { id: "pandemic>instability", from: "pandemic", to: "instability", evidence: "speculative",
    note: "Severe pandemics strain economies and governments; the evidence for lasting instability is thin and mixed.",
    refs: [] },
  { id: "permafrost>pandemic", from: "permafrost", to: "pandemic", evidence: "speculative",
    note: "Old microbes can survive in permafrost (an anthrax outbreak in 2016; revived amoeba viruses), but no human pandemic has been traced to it.",
    refs: ["timofeev2019", "legendre2014"] },
];
