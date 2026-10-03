/**
 * Link engine: derives relationships between entities from data we already have.
 * Computed links only claim what the data shows (nearness, shared country, shared time).
 * Causal links (e.g. soot -> famine) are hand-curated and cited in data/causal.json; this
 * file never creates them.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import arsenalsRaw from "../data/arsenals.json";
import citiesRaw from "../data/cities.json";
import type {
  Arsenals,
  ConflictFile,
  CountryProfile,
  Link,
  LinksFile,
  PlantsFile,
  ProfilesFile,
  WorldState,
} from "../lib/types";
import { COUNTRIES, haversineKm } from "./geo";

const arsenals = arsenalsRaw as unknown as Arsenals;
const cities = citiesRaw as [number, number, number][];

const QUAKE_TO_PLANT_KM = 100;
const QUAKE_TO_VOLCANO_KM = 150;
const VIOLENCE_TO_PLANT_KM = 50;
const EXPOSURE_KM = 100;
const MIN_QUAKE_MAG = 5;
const MIN_CELL_EVENTS = 15;
const HIGH_TENSION = 60;
const HIGH_WATER_STRESS = 75; // SDG 6.4.2 "high" class

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path.join(process.cwd(), file), "utf8")) as T;
  } catch {
    return null;
  }
}

function populationWithin(lat: number, lon: number, radiusKm: number): number {
  // cheap bounding-box prefilter, then exact distance
  const dLat = radiusKm / 111;
  const dLon = radiusKm / (111 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
  let sum = 0;
  for (const [clat, clon, pop] of cities) {
    if (Math.abs(clat - lat) > dLat || Math.abs(clon - lon) > dLon) continue;
    if (haversineKm(lat, lon, clat, clon) <= radiusKm) sum += pop;
  }
  return sum;
}

type Indicators = {
  water: { iso3: string; value: number; year: number }[];
  hunger: { iso3: string; value: number; year: number }[];
};

export async function buildLinks(
  state: WorldState,
  conflict: ConflictFile | null,
): Promise<{ links: LinksFile; profiles: ProfilesFile }> {
  const plantsFile = await readJson<PlantsFile>("public/data/nuclear_plants.json");
  const indicators = await readJson<Indicators>("public/data/indicators.json");
  const plants = plantsFile?.plants ?? [];
  const links: Link[] = [];
  const exposure: LinksFile["exposure"] = {};

  const quakes = state.events.filter((e) => e.kind === "quake" && (e.magnitude ?? 0) >= MIN_QUAKE_MAG);

  // --- spatial: quake <-> plant, quake <-> supervolcano
  for (const q of quakes) {
    for (const p of plants) {
      const d = haversineKm(q.lat, q.lon, p.lat, p.lon);
      if (d <= QUAKE_TO_PLANT_KM) {
        links.push({
          id: `${q.id}>plant:${p.id}`,
          from: q.id,
          to: `plant:${p.id}`,
          type: "spatial",
          computed: true,
          label: `M${q.magnitude?.toFixed(1)} quake ${Math.round(d)} km from ${p.name} nuclear plant (${p.country})`,
          distanceKm: Math.round(d),
        });
      }
    }
    for (const v of state.volcanoes) {
      const d = haversineKm(q.lat, q.lon, v.lat, v.lon);
      if (d <= QUAKE_TO_VOLCANO_KM) {
        links.push({
          id: `${q.id}>volcano:${v.id}`,
          from: q.id,
          to: `volcano:${v.id}`,
          type: "spatial",
          computed: true,
          label: `M${q.magnitude?.toFixed(1)} quake ${Math.round(d)} km from ${v.name}`,
          distanceKm: Math.round(d),
        });
      }
    }
  }

  // --- spatial: reported violence <-> plant
  for (const c of conflict?.cells ?? []) {
    if (c.n < MIN_CELL_EVENTS) continue;
    for (const p of plants) {
      const d = haversineKm(c.lat, c.lon, p.lat, p.lon);
      if (d <= VIOLENCE_TO_PLANT_KM) {
        links.push({
          id: `cell:${c.lat},${c.lon}>plant:${p.id}`,
          from: `cell:${c.lat},${c.lon}`,
          to: `plant:${p.id}`,
          type: "spatial",
          computed: true,
          label: `${c.n} armed-conflict reports in 7 days within ${Math.round(d)} km of ${p.name} nuclear plant (${p.country})`,
          distanceKm: Math.round(d),
        });
      }
    }
  }

  // --- actor: outbreak -> country, volcano -> country, dyad -> countries
  for (const e of state.events) {
    if (e.domain !== "health") continue;
    for (const iso of e.countries) {
      links.push({ id: `${e.id}>country:${iso}`, from: e.id, to: `country:${iso}`, type: "actor", computed: true, label: "WHO report names this country" });
    }
  }
  for (const v of state.volcanoes) {
    links.push({ id: `volcano:${v.id}>country:${v.country}`, from: `volcano:${v.id}`, to: `country:${v.country}`, type: "actor", computed: true, label: "Located in" });
  }
  for (const d of state.dyads) {
    const id = `dyad:${d.a}|${d.b}`;
    links.push({ id: `${id}>country:${d.a}`, from: id, to: `country:${d.a}`, type: "actor", computed: true, label: d.label });
    links.push({ id: `${id}>country:${d.b}`, from: id, to: `country:${d.b}`, type: "actor", computed: true, label: d.label });
  }

  // --- exposure: residents of cities 15k+ within 100 km (lower bound)
  for (const q of quakes) {
    exposure[q.id] = { radiusKm: EXPOSURE_KM, population: populationWithin(q.lat, q.lon, EXPOSURE_KM) };
  }
  for (const v of state.volcanoes) {
    exposure[`volcano:${v.id}`] = { radiusKm: EXPOSURE_KM, population: populationWithin(v.lat, v.lon, EXPOSURE_KM) };
  }
  for (const p of plants) {
    exposure[`plant:${p.id}`] = { radiusKm: EXPOSURE_KM, population: populationWithin(p.lat, p.lon, EXPOSURE_KM) };
  }

  // --- country profiles (also the source of temporal co-occurrence)
  const violenceByIso = new Map<string, number>();
  const byFips = new Map(COUNTRIES.map((c) => [c.fips, c.iso3]));
  for (const [fips, n] of Object.entries(conflict?.byFips ?? {})) {
    const iso = byFips.get(fips);
    if (iso) violenceByIso.set(iso, (violenceByIso.get(iso) ?? 0) + n);
  }
  const violenceRank = [...violenceByIso.entries()].sort((a, b) => b[1] - a[1]).map(([iso]) => iso);
  const topViolent = new Set(violenceRank.slice(0, 15));

  const plantAgg = new Map<string, { count: number; mw: number }>();
  for (const p of plants) {
    const a = plantAgg.get(p.iso3) ?? { count: 0, mw: 0 };
    a.count++;
    a.mw += p.mw;
    plantAgg.set(p.iso3, a);
  }
  const waterBy = new Map((indicators?.water ?? []).map((r) => [r.iso3, r]));
  const hungerBy = new Map((indicators?.hunger ?? []).map((r) => [r.iso3, r]));

  const profiles: Record<string, CountryProfile> = {};
  for (const c of COUNTRIES) {
    const arsenal = arsenals.countries.find((a) => a.iso3 === c.iso3);
    const dyads = state.dyads
      .filter((d) => d.a === c.iso3 || d.b === c.iso3)
      .map((d) => {
        const other = d.a === c.iso3 ? d.b : d.a;
        return { other, label: d.label, tension: d.tension };
      });
    const outbreaks = state.events
      .filter((e) => e.domain === "health" && e.countries.includes(c.iso3))
      .slice(0, 5)
      .map((e) => ({ title: e.title, date: e.startedAt.slice(0, 10), url: e.url }));
    const volcs = state.volcanoes
      .filter((v) => v.country === c.iso3)
      .map((v) => ({ id: v.id, name: v.name, level: v.level }));
    const pl = plantAgg.get(c.iso3);
    const water = waterBy.get(c.iso3);
    const hunger = hungerBy.get(c.iso3);

    const signals: string[] = [];
    if (outbreaks.length) signals.push("WHO outbreak report");
    if (topViolent.has(c.iso3)) signals.push("among the 15 countries with the most armed-conflict reports this week");
    if (dyads.some((d) => (d.tension ?? 0) >= HIGH_TENSION)) signals.push(`in a tracked tension pair at ${HIGH_TENSION}+`);
    if (volcs.some((v) => v.level === "elevated")) signals.push("supervolcano above baseline");
    if (water && water.value >= HIGH_WATER_STRESS) signals.push("high water stress");

    const has = arsenal || dyads.length || pl || outbreaks.length || violenceByIso.get(c.iso3) || volcs.length || water || hunger;
    if (!has) continue;

    profiles[c.iso3] = {
      iso3: c.iso3,
      name: c.name,
      population: c.population,
      lat: c.lat,
      lon: c.lon,
      arsenal: arsenal ? { stockpile: arsenal.stockpile, inventory: arsenal.inventory, deployed: arsenal.deployed } : undefined,
      dyads,
      plants: pl,
      outbreaks,
      violence7d: violenceByIso.get(c.iso3),
      volcanoes: volcs,
      water: water ? { value: water.value, year: water.year } : undefined,
      hunger: hunger ? { value: hunger.value, year: hunger.year } : undefined,
      signals,
    };
  }

  const generatedAt = new Date().toISOString();
  return {
    links: {
      generatedAt,
      rules: {
        spatial: [
          `Earthquake M${MIN_QUAKE_MAG}+ within ${QUAKE_TO_PLANT_KM} km of a nuclear plant`,
          `Earthquake M${MIN_QUAKE_MAG}+ within ${QUAKE_TO_VOLCANO_KM} km of a watchlist supervolcano`,
          `Cell with ${MIN_CELL_EVENTS}+ armed-conflict reports in 7 days within ${VIOLENCE_TO_PLANT_KM} km of a nuclear plant`,
        ],
        exposure: `Residents of cities with 15,000+ people within ${EXPOSURE_KM} km. A lower bound: villages and rural population are not counted.`,
        temporal: `Signals listed on a country profile happen in the same country in the same period. This is co-occurrence, not cause.`,
      },
      links,
      exposure,
    },
    profiles: {
      generatedAt,
      note: "Signals are co-occurrence of independent indicators, not causal claims.",
      countries: profiles,
    },
  };
}
