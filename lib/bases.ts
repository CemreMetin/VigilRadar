import { distanceKm } from "./blast";
import type { MilitaryBasesFile, TargetsFile } from "./types";

type Base = MilitaryBasesFile["bases"][number];

/** Countries in the Wikidata base list that no longer exist (or were occupied territories): hidden unless "Show historical" is on. */
export const FORMER_STATES = new Set([
  "Soviet Union", "Yugoslavia", "East Germany", "West Germany", "Czechoslovakia", "Serbia and Montenegro",
  "German Reich", "Nazi Germany", "Empire of Japan", "Austria–Hungary", "Dutch East Indies", "French Indochina",
  "French West Africa", "French protectorate in Morocco", "Spanish protectorate in Morocco", "Italian Libya",
  "Kingdom of Italy", "Mandatory Palestine", "People's Democratic Republic of Ethiopia", "South Vietnam",
  "Southern Rhodesia", "United States occupation of the Ryukyu Islands", "Ancient Egypt",
]);

export type BaseFilter = { kinds: Set<string>; country: string; historical: boolean };

export function filterBases(bases: Base[], f: BaseFilter): Base[] {
  return bases.filter(
    ([, , , , country, kind]) => f.kinds.has(kind) && (f.historical || !FORMER_STATES.has(country)) && (f.country === "" || country === f.country),
  );
}

/** Ids of bases that sit within `radiusKm` of a named site in the nuclear reference list (capitals excluded). */
export function nuclearBaseIds(bases: Base[], sites: TargetsFile["sites"], radiusKm = 5): Set<string> {
  const named = sites.filter((s) => s[3] !== "capital");
  const ids = new Set<string>();
  for (const b of bases) {
    if (named.some((s) => Math.abs(s[1] - b[2]) < 0.1 && distanceKm(b[2], b[3], s[1], s[2]) <= radiusKm)) ids.add(b[0]);
  }
  return ids;
}
