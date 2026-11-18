import { PLANTS } from "@/core/build-state";
import { CONFIG } from "@/core/config";
import { haversineKm } from "@/core/geo";
import { severityFor } from "@/core/severity";
import { provinceTsunamiAdvice } from "@/core/tsunami";
import type { Link, MergedQuake, Province, Severity, State } from "@/core/types";
import type { Content } from "@/core/content/tr";

export type ListKey = "tsunami" | "afterQuake" | "feltMaybe" | "nearPlant";
export type ChokepointKey = keyof Content["chokepointNotes"];
export interface NamedLink { link: Link; name: string }

export interface QuakeTriage {
  severity: Severity | null;
  distanceKm: number | null; // from the province centre to the epicentre
  lists: ListKey[]; // in the order they are shown
  links: NamedLink[];
  chokepoints: ChokepointKey[]; // impact notes for linked chokepoints
  needsProvince: boolean; // no region chosen: no list can be picked for the user
  nothingToDo: boolean; // a province is chosen and no list applies
}

const KEYS: [RegExp, ChokepointKey][] = [[/hormuz/i, "hormuz"], [/suez/i, "suez"], [/mandeb/i, "mandeb"], [/malacca/i, "malacca"], [/panama/i, "panama"], [/bosph?orus|istanbul/i, "bosporus"]];
/** Chokepoints are told apart by name, as in VIGIL.md 4.2. */
export const chokepointKey = (name: string): ChokepointKey | null => KEYS.find(([re]) => re.test(name))?.[1] ?? null;

export function namedLinks(state: State, links: readonly Link[]): NamedLink[] {
  const names = new Map<string, string>();
  for (const p of PLANTS) names.set(p.id, p.name);
  for (const c of state.chokepoints) names.set(c.id, c.name);
  return links.map((link) => ({ link, name: names.get(link.toId) ?? link.toId }));
}

export const chokepointKeys = (state: State, links: readonly NamedLink[]): ChokepointKey[] => {
  const known = new Map(state.chokepoints.map((c) => [c.id, c.name]));
  return [...new Set(links.filter((l) => l.link.toKind === "chokepoint").map((l) => chokepointKey(known.get(l.link.toId) ?? l.name)).filter((k): k is ChokepointKey => !!k))];
};

/** Which list the user gets (VIGIL.md 10.1) and what the card says about them. */
export function triageQuake(state: State, q: MergedQuake, province: Province | null): QuakeTriage {
  const links = namedLinks(state, state.links.filter((l) => l.fromKind === "quake" && l.fromId === q.id));
  const chokepoints = chokepointKeys(state, links);
  if (!province) return { severity: null, distanceKm: null, lists: [], links, chokepoints, needsProvince: true, nothingToDo: false };

  const severity = severityFor(province, q.best);
  const lists: ListKey[] = [];
  if (provinceTsunamiAdvice(province, q.best)) lists.push("tsunami");
  if (severity === "P0" || severity === "P1") lists.push("afterQuake");
  else if (severity === "P2") lists.push("feltMaybe");
  const nearPlant = links.some((l) => l.link.toKind === "plant" && PLANTS.some((p) => p.id === l.link.toId && haversineKm(province, p) <= 100));
  if (nearPlant) lists.push("nearPlant");
  return { severity, distanceKm: haversineKm(province, q.best), lists, links, chokepoints, needsProvince: false, nothingToDo: lists.length === 0 };
}

/** The radius a quake link was made with, for the rule text ("within 250 km for M7.1"). */
export function linkRadiusKm(l: Link, mag: number): number {
  if (l.toKind === "chokepoint") return CONFIG.chokepointQuake.radiusKm;
  return [...CONFIG.plantLinkTable].reverse().find((r) => r[0] <= mag)?.[1] ?? 0;
}
