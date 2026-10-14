import type { Counter, CyclonesFile, Tone } from "../../lib/types";
import { fetchOpen } from "../http";

/**
 * Active tropical cyclones from the US National Hurricane Center (Atlantic, East and Central Pacific only).
 * Observations only: the current position, wind and pressure NHC reports in its latest advisory. NHC's
 * own forecast tracks and cones are not drawn here.
 */

const URL = "https://www.nhc.noaa.gov/CurrentStorms.json";

type Raw = {
  id: string;
  name: string;
  classification: string;
  intensity: string; // knots
  pressure: string; // mb
  latitudeNumeric: number;
  longitudeNumeric: number;
  movementDir: number | null;
  movementSpeed: number | null;
  lastUpdate: string;
  publicAdvisory?: { url: string };
};

/** Saffir-Simpson category from sustained wind in knots (hurricanes only). */
export function category(kt: number): number {
  return kt >= 137 ? 5 : kt >= 113 ? 4 : kt >= 96 ? 3 : kt >= 83 ? 2 : kt >= 64 ? 1 : 0;
}

export async function cycloneFeed(): Promise<{ counters: Counter[]; file: CyclonesFile }> {
  const json = (await (await fetchOpen(URL)).json()) as { activeStorms?: Raw[] };
  if (!Array.isArray(json.activeStorms)) throw new Error("unexpected NHC format");

  const storms = json.activeStorms
    .map((s) => ({
      id: s.id,
      name: s.name,
      cls: s.classification,
      windKt: Number(s.intensity),
      pressureMb: s.pressure ? Number(s.pressure) : null,
      lat: s.latitudeNumeric,
      lon: s.longitudeNumeric,
      dir: s.movementDir,
      speedKt: s.movementSpeed,
      updated: s.lastUpdate,
      url: s.publicAdvisory?.url ?? "https://www.nhc.noaa.gov/",
    }))
    .filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lon) && Number.isFinite(s.windKt));

  const strongest = storms.reduce((m, s) => Math.max(m, s.windKt), 0);
  const cat = category(strongest);
  const tone: Tone = cat >= 3 ? "high" : cat >= 1 ? "elevated" : "normal";
  const source = {
    name: "NOAA National Hurricane Center",
    url: "https://www.nhc.noaa.gov/",
    license: "Public domain (US Government work)",
  };
  const file: CyclonesFile = { generatedAt: new Date().toISOString(), storms, source };
  const counter: Counter = {
    id: "cyclones",
    label: "Active tropical cyclones",
    domain: "climate",
    value: String(storms.length),
    numeric: storms.length,
    unit: "in NHC's area",
    tone,
    basis: "Elevated while any storm is a hurricane (64 kt or more), critical at major hurricane strength (96 kt, category 3, or more)",
    trendLabel: storms.length ? `Strongest ${strongest} kt${cat ? `, category ${cat}` : ""}` : "None active",
    note: "Storms in NHC's advisories for the Atlantic, East Pacific and Central Pacific. Typhoons and cyclones in the West Pacific, Indian Ocean and Southern Hemisphere are not covered. Winds are NHC's sustained one-minute estimates in knots; they are updated about every six hours. Forecast tracks are not shown.",
    asOf: storms.map((s) => s.updated).sort().pop() ?? new Date().toISOString(),
    cadence: "about every 6 hours",
    source,
    rows: storms.map((s) => ({ label: s.name, value: `${s.windKt} kt`, tone: category(s.windKt) >= 3 ? "high" : category(s.windKt) >= 1 ? "elevated" : "normal" })),
  };
  return { counters: [counter], file };
}
