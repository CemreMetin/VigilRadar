import { PLANTS } from "@/core/build-state";
import { CONFIG } from "@/core/config";
import type { Link, State } from "@/core/types";
import type { Content } from "@/core/content/tr";

export type ChokepointKey = keyof Content["chokepointNotes"];
export interface NamedLink { link: Link; name: string }

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

/** The radius a quake link was made with, for the rule text ("within 250 km for M7.1"). */
export function linkRadiusKm(l: Link, mag: number): number {
  if (l.toKind === "chokepoint") return CONFIG.chokepointQuake.radiusKm;
  return [...CONFIG.plantLinkTable].reverse().find((r) => r[0] <= mag)?.[1] ?? 0;
}
