import { fetchOpen } from "../http";
import { BY_ISO3 } from "../geo";

type WbRow = { countryiso3code: string; country: { value: string }; value: number | null; date: string };

async function indicator(code: string) {
  const res = await fetchOpen(
    `https://api.worldbank.org/v2/country/all/indicator/${code}?format=json&per_page=400&mrnev=1`,
    40_000,
  );
  const json = (await res.json()) as [unknown, WbRow[]];
  const rows = json[1] ?? [];
  return rows
    .filter((r) => r.value != null && BY_ISO3.has(r.countryiso3code))
    .map((r) => ({ iso3: r.countryiso3code, name: BY_ISO3.get(r.countryiso3code)!.name, value: Math.round(r.value! * 10) / 10, year: Number(r.date) }));
}

export type IndicatorFile = {
  generatedAt: string;
  water: { iso3: string; name: string; value: number; year: number }[];
  hunger: { iso3: string; name: string; value: number; year: number }[];
  sources: { water: string; hunger: string };
};

export async function worldBankIndicators(): Promise<IndicatorFile> {
  const [water, hunger] = await Promise.all([indicator("ER.H2O.FWST.ZS"), indicator("SN.ITK.DEFC.ZS")]);
  if (water.length < 50 || hunger.length < 50) throw new Error("World Bank returned too few rows");
  return {
    generatedAt: new Date().toISOString(),
    water: water.sort((a, b) => b.value - a.value),
    hunger: hunger.sort((a, b) => b.value - a.value),
    sources: {
      water: "World Bank, ER.H2O.FWST.ZS: freshwater withdrawal as % of available freshwater resources (FAO AQUASTAT)",
      hunger: "World Bank, SN.ITK.DEFC.ZS: prevalence of undernourishment, % of population (FAO)",
    },
  };
}
