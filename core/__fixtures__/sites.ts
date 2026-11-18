import type { Province, QuakeEvent, Site } from "../types";

// Hand-written test fixtures. Province centres and Daiichi are approximate public coordinates, Akkuyu is the value
// given in VIGIL.md 12. Faz 2 (places.tr.json, plants.json) and Faz 3 (probe samples) replace them with real data.
export const PROVINCES: Record<string, Province> = {
  kahramanmaras: { code: "TR-46", name: "Kahramanmaraş", lat: 37.58, lon: 36.94, coastal: false },
  gaziantep: { code: "TR-27", name: "Gaziantep", lat: 37.07, lon: 37.38, coastal: false },
  hatay: { code: "TR-31", name: "Hatay", lat: 36.2, lon: 36.16, coastal: true },
  malatya: { code: "TR-44", name: "Malatya", lat: 38.35, lon: 38.31, coastal: false },
  ankara: { code: "TR-06", name: "Ankara", lat: 39.93, lon: 32.86, coastal: false },
  istanbul: { code: "TR-34", name: "İstanbul", lat: 41.01, lon: 28.98, coastal: true },
  izmir: { code: "TR-35", name: "İzmir", lat: 38.42, lon: 27.14, coastal: true },
  konya: { code: "TR-42", name: "Konya", lat: 37.87, lon: 32.48, coastal: false },
};
export const ALL_PROVINCES = Object.values(PROVINCES);

export const AKKUYU: Site = { id: "akkuyu", name: "Akkuyu", lat: 36.14, lon: 33.54 };
export const FUKUSHIMA_DAIICHI: Site = { id: "fukushima-daiichi", name: "Fukushima Daiichi", lat: 37.42, lon: 141.03 };
export const PLANTS = [AKKUYU, FUKUSHIMA_DAIICHI];

export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;

export function ev(p: Partial<QuakeEvent> & Pick<QuakeEvent, "lat" | "lon" | "mag" | "depthKm" | "timeMs">): QuakeEvent {
  return { source: "usgs", sourceId: "x", place: "test", updatedMs: p.timeMs, ...p };
}

export const KAHRAMANMARAS_2023 = ev({ sourceId: "us6000jllz", lat: 37.23, lon: 37.01, mag: 7.8, depthKm: 10, timeMs: Date.UTC(2023, 1, 6, 1, 17, 34), place: "Pazarcik" });
export const TOHOKU_2011 = ev({ sourceId: "official20110311054624120_30", lat: 38.3, lon: 142.37, mag: 9.1, depthKm: 29, timeMs: Date.UTC(2011, 2, 11, 5, 46, 24), place: "Tohoku" });
