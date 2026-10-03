import countriesRaw from "../data/countries.json";
import type { Country } from "../lib/types";

export const COUNTRIES = countriesRaw as Country[];
export const BY_ISO3 = new Map(COUNTRIES.map((c) => [c.iso3, c]));
const BY_NAME = new Map(COUNTRIES.map((c) => [norm(c.name), c]));

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// WHO and press use official or alternative names; map the ones that differ from GeoNames.
const ALIASES: Record<string, string> = {
  "united states of america": "USA",
  "united kingdom of great britain and northern ireland": "GBR",
  "russian federation": "RUS",
  "iran (islamic republic of)": "IRN",
  "turkiye": "TUR",
  "viet nam": "VNM",
  "republic of korea": "KOR",
  "democratic people's republic of korea": "PRK",
  "lao people's democratic republic": "LAO",
  "syrian arab republic": "SYR",
  "bolivia (plurinational state of)": "BOL",
  "venezuela (bolivarian republic of)": "VEN",
  "united republic of tanzania": "TZA",
  "democratic republic of the congo": "COD",
  "congo": "COG",
  "republic of the congo": "COG",
  "cote d'ivoire": "CIV",
  "occupied palestinian territory": "PSE",
  "state of palestine": "PSE",
  "czechia": "CZE",
  "republic of moldova": "MDA",
  "myanmar": "MMR",
  "eswatini": "SWZ",
  "cabo verde": "CPV",
  "timor-leste": "TLS",
  "north macedonia": "MKD",
  "micronesia (federated states of)": "FSM",
  "brunei darussalam": "BRN",
};

/** Resolve a country name as written by WHO/press to a Country, or null. */
export function findCountry(name: string): Country | null {
  const n = norm(name);
  const iso = ALIASES[n];
  if (iso) return BY_ISO3.get(iso) ?? null;
  return BY_NAME.get(n) ?? null;
}

/** Great-circle distance in km. */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}
