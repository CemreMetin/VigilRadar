import type { DomainId, WorldState } from "./types";

/**
 * A "lens" is a one-click preset shown as a card at the top of the map: it switches on the map layers
 * that belong to a scenario family, opens the matching metric, and links to the scenario page.
 */
export type Lens = {
  id: string;
  title: string;
  color: string; // CSS colour, same hues as the domain palette
  layers: DomainId[];
  page: string;
  pageLabel: string;
  blurb: string;
  counterId?: string; // metric to open in the right panel
  stat: (w: WorldState | null) => string;
};

const counter = (w: WorldState | null, id: string) => w?.counters.find((c) => c.id === id);

export const LENSES: Lens[] = [
  {
    id: "nuclear",
    title: "Nuclear",
    color: "var(--threat)",
    layers: ["nuclear"],
    page: "/scenarios/nuclear-winter",
    pageLabel: "Nuclear war scenario",
    blurb: "Arsenals, power plants and the media tension between nuclear-armed pairs.",
    counterId: "doomsday-clock",
    stat: (w) => {
      const c = counter(w, "doomsday-clock");
      return c ? `${c.value} to midnight` : "Doomsday Clock";
    },
  },
  {
    id: "bio",
    title: "Bio",
    color: "var(--bio)",
    layers: ["health"],
    page: "/scenarios/pandemic-x",
    pageLabel: "Pandemic explorer",
    blurb: "WHO outbreak reports by country, and how a new pathogen could spread by air travel.",
    counterId: "outbreaks",
    stat: (w) => {
      const c = counter(w, "outbreaks");
      return c ? `${c.value} WHO reports, 90 d` : "WHO reports";
    },
  },
  {
    id: "volcano",
    title: "Volcano",
    color: "var(--geo)",
    layers: ["geophysical"],
    page: "/scenarios/supervolcano",
    pageLabel: "Supervolcano scenario",
    blurb: "Earthquakes and the live status of six supereruption-capable calderas.",
    stat: (w) => {
      const v = w?.volcanoes ?? [];
      const up = v.filter((x) => x.level === "elevated").length;
      return v.length ? `${up} of ${v.length} above baseline` : "Watchlist";
    },
  },
  {
    id: "conflict",
    title: "Conflict",
    color: "var(--conflict)",
    layers: ["conflict"],
    page: "/links",
    pageLabel: "How risks feed each other",
    blurb: "Armed conflict as reported in the news, and the shipping chokepoints it can disrupt.",
    counterId: "chokepoints",
    stat: (w) => {
      const c = counter(w, "chokepoints");
      return c ? `${c.value} chokepoints low` : "Chokepoints";
    },
  },
  {
    id: "solar",
    title: "Solar",
    color: "var(--space)",
    layers: [],
    page: "/scenarios/solar-superstorm",
    pageLabel: "Solar superstorm scenario",
    blurb: "Space weather right now. Storms are strongest near the magnetic poles; the scenario page maps the exposure.",
    counterId: "kp",
    stat: (w) => {
      const c = counter(w, "kp");
      return c ? `Kp ${c.value}` : "Space weather";
    },
  },
  {
    id: "asteroid",
    title: "Asteroid",
    color: "var(--fg)",
    layers: [],
    page: "/scenarios/asteroid",
    pageLabel: "Impact calculator",
    blurb: "Known near-Earth objects passing close in the next 60 days, and what an impact's energy would be.",
    counterId: "asteroids",
    stat: (w) => {
      const c = counter(w, "asteroids");
      return c ? `${c.value} close passes, 60 d` : "Close approaches";
    },
  },
];

export const LENS_BY_ID = Object.fromEntries(LENSES.map((l) => [l.id, l])) as Record<string, Lens>;
