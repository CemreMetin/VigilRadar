import type { DomainId } from "./types";

export type DomainInfo = {
  id: DomainId;
  label: string;
  blurb: string;
  color: string; // keep in sync with --color-* in globals.css
  live: boolean; // has a toggleable map layer in this build
  metrics: boolean; // has live counters in the Metrics panel
  phase?: string; // when the map layer arrives
};

export const DOMAINS: DomainInfo[] = [
  {
    id: "nuclear",
    label: "Nuclear",
    blurb: "Arsenals, plants, tension pairs",
    color: "#ff003c",
    live: true,
    metrics: true,
  },
  {
    id: "conflict",
    label: "Conflict",
    blurb: "Armed conflict in the news, chokepoints",
    color: "#ff6a00",
    live: true,
    metrics: true,
  },
  {
    id: "health",
    label: "Pandemic & Health",
    blurb: "WHO outbreak reports",
    color: "#b026ff",
    live: true,
    metrics: true,
  },
  {
    id: "climate",
    label: "Climate & Water",
    blurb: "Warming, CO₂, drought",
    color: "#00e5ff",
    live: false,
    metrics: true,
    phase: "map: Phase 5",
  },
  {
    id: "geophysical",
    label: "Geophysical",
    blurb: "Quakes, supervolcano watchlist",
    color: "#ffb000",
    live: true,
    metrics: false,
  },
  {
    id: "space",
    label: "Space",
    blurb: "Solar storms, asteroids",
    color: "#c9d1ff",
    live: false,
    metrics: true,
    phase: "map: Phase 5",
  },
];

export const DOMAIN_BY_ID = Object.fromEntries(
  DOMAINS.map((d) => [d.id, d]),
) as Record<DomainId, DomainInfo>;
