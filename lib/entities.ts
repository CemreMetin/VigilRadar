import { utcStamp } from "./format";
import type {
  ArsenalCountry,
  ConflictCell,
  CountryProfile,
  Dyad,
  LinksFile,
  MonitorEvent,
  Plant,
  ProfilesFile,
  VolcanoStatus,
  WorldState,
} from "./types";

export type EntityKind = "event" | "plant" | "volcano" | "country" | "dyad" | "cell" | "outbreak";

export type Entity = {
  id: string;
  kind: EntityKind;
  title: string;
  lines: string[];
  lat: number;
  lon: number;
  link?: { href: string; text: string; external?: boolean };
  /** ISO3 of the country this entity belongs to, when known */
  iso3?: string;
};

export type OutbreakGroup = {
  id: string; // "health:<ISO3>"
  iso3: string;
  name: string;
  lat: number;
  lon: number;
  count: number;
  latest: MonitorEvent;
};

export type DyadLine = Dyad & { id: string; from: [number, number]; to: [number, number] };

const n = (v: number) => v.toLocaleString("en-US");

function exposureLine(links: LinksFile | null, id: string): string | null {
  const x = links?.exposure[id];
  if (!x) return null;
  return x.population > 0
    ? `About ${n(x.population)} residents of cities of 15,000+ within ${x.radiusKm} km (a lower bound)`
    : `No city of 15,000+ within ${x.radiusKm} km (smaller towns and visitors not counted)`;
}

export function groupOutbreaks(world: WorldState | null, profiles: ProfilesFile | null): OutbreakGroup[] {
  if (!world) return [];
  const byIso = new Map<string, MonitorEvent[]>();
  for (const e of world.events) {
    if (e.domain !== "health") continue;
    for (const iso of e.countries) byIso.set(iso, [...(byIso.get(iso) ?? []), e]);
  }
  const out: OutbreakGroup[] = [];
  for (const [iso, evs] of byIso) {
    const latest = evs.reduce((a, b) => (a.startedAt >= b.startedAt ? a : b));
    out.push({
      id: `health:${iso}`,
      iso3: iso,
      name: profiles?.countries[iso]?.name ?? iso,
      lat: latest.lat,
      lon: latest.lon,
      count: evs.length,
      latest,
    });
  }
  return out;
}

export function dyadLines(world: WorldState | null, profiles: ProfilesFile | null, arsenals: ArsenalCountry[]): DyadLine[] {
  if (!world) return [];
  const pos = (iso: string): [number, number] | null => {
    const a = arsenals.find((x) => x.iso3 === iso);
    if (a) return a.centroid;
    const p = profiles?.countries[iso];
    return p ? [p.lon, p.lat] : null;
  };
  const out: DyadLine[] = [];
  for (const d of world.dyads) {
    const from = pos(d.a);
    const to = pos(d.b);
    if (from && to) out.push({ ...d, id: `dyad:${d.a}|${d.b}`, from, to });
  }
  return out;
}

export function buildEntityIndex(input: {
  world: WorldState | null;
  plants: Plant[];
  arsenals: ArsenalCountry[];
  cells: ConflictCell[];
  links: LinksFile | null;
  profiles: ProfilesFile | null;
  outbreaks: OutbreakGroup[];
  dyads: DyadLine[];
}): Map<string, Entity> {
  const { world, plants, arsenals, cells, links, profiles, outbreaks, dyads } = input;
  const idx = new Map<string, Entity>();

  for (const e of world?.events ?? []) {
    if (e.kind === "outbreak") {
      idx.set(e.id, {
        id: e.id,
        kind: "event",
        title: e.title,
        lines: [`WHO Disease Outbreak News, ${e.startedAt.slice(0, 10)}`],
        lat: e.lat,
        lon: e.lon,
        iso3: e.countries[0],
        link: e.url ? { href: e.url, text: "WHO report ↗", external: true } : undefined,
      });
      continue;
    }
    if (e.kind !== "quake") continue;
    const exp = exposureLine(links, e.id);
    idx.set(e.id, {
      id: e.id,
      kind: "event",
      title: e.title,
      lines: [`${utcStamp(e.startedAt)} · depth ${Math.round(e.depthKm ?? 0)} km`, ...(exp ? [exp] : [])],
      lat: e.lat,
      lon: e.lon,
      link: e.url ? { href: e.url, text: `${e.source.name} ↗`, external: true } : undefined,
    });
  }

  for (const p of plants) {
    const id = `plant:${p.id}`;
    const exp = exposureLine(links, id);
    idx.set(id, {
      id,
      kind: "plant",
      title: p.name,
      lines: [
        `Nuclear power plant · ${p.country}`,
        `${n(p.mw)} MW${p.year ? ` · from ${p.year}` : ""}`,
        ...(exp ? [exp] : []),
        "Dataset vintage about 2019; openings and closures since are missing",
      ],
      lat: p.lat,
      lon: p.lon,
      iso3: p.iso3,
    });
  }

  for (const v of world?.volcanoes ?? []) {
    const id = `volcano:${v.id}`;
    const exp = exposureLine(links, id);
    const q = v.quakes30d;
    idx.set(id, volcanoEntity(id, v, exp, q));
  }

  for (const c of arsenals) {
    const id = `country:${c.iso3}`;
    const prof = profiles?.countries[c.iso3];
    idx.set(id, countryEntity(id, c.name, c.iso3, c.centroid[1], c.centroid[0], prof, c));
  }
  for (const [iso, prof] of Object.entries(profiles?.countries ?? {})) {
    const id = `country:${iso}`;
    if (!idx.has(id)) idx.set(id, countryEntity(id, prof.name, iso, prof.lat, prof.lon, prof, undefined));
  }

  for (const d of dyads) {
    const mid: [number, number] = [(d.from[0] + d.to[0]) / 2, (d.from[1] + d.to[1]) / 2];
    const c = d.components;
    idx.set(d.id, {
      id: d.id,
      kind: "dyad",
      title: d.label,
      lat: mid[1],
      lon: mid[0],
      lines: [
        d.tension != null
          ? `Media tension index ${d.tension}/100 (a description of how news reports the pair, not a forecast)`
          : "Too little data to compute an index",
        ...(c
          ? [
              `Cooperation/conflict score ${c.goldstein.toFixed(1)} (−10 hostile … +10 cooperative) · tone ${c.tone.toFixed(1)}`,
              `${(c.materialShare * 100).toFixed(0)}% of coverage is material conflict · ${n(c.events30d)} events in 30 days`,
            ]
          : []),
        ...(d.note ? [d.note] : []),
      ],
      link: { href: "/methodology#tension", text: "How this is computed" },
    });
  }

  for (const g of outbreaks) {
    idx.set(g.id, {
      id: g.id,
      kind: "outbreak",
      title: `${g.name}: ${g.count} WHO report${g.count > 1 ? "s" : ""}`,
      lines: [
        `Latest: ${g.latest.title} (${g.latest.startedAt.slice(0, 10)})`,
        "Marker sits at the country centre, not at the outbreak site",
      ],
      lat: g.lat,
      lon: g.lon,
      iso3: g.iso3,
      link: g.latest.url ? { href: g.latest.url, text: "WHO report ↗", external: true } : undefined,
    });
  }

  for (const c of cells) {
    const id = `cell:${c.lat},${c.lon}`;
    idx.set(id, {
      id,
      kind: "cell",
      title: `${c.n} armed-conflict reports in 7 days`,
      lines: [
        `${n(c.m)} media mentions`,
        "GDELT places an event where the article places it: often a capital or a city named in the story, not necessarily the fighting",
      ],
      lat: c.lat,
      lon: c.lon,
      link: { href: "https://www.gdeltproject.org/", text: "GDELT ↗", external: true },
    });
  }
  return idx;
}

function volcanoEntity(id: string, v: VolcanoStatus, exp: string | null, q: VolcanoStatus["quakes30d"]): Entity {
  const years = v.lastSuperEruption.yearsAgo;
  return {
    id,
    kind: "volcano",
    title: `${v.name} (supervolcano watchlist)`,
    lat: v.lat,
    lon: v.lon,
    iso3: v.country,
    lines: [
      `Status: ${v.levelLabel}`,
      ...(v.detail ? [v.detail] : []),
      ...(q
        ? [`${n(q.count)} earthquakes in 30 days within ${q.radiusKm} km${q.maxMag != null ? `, largest M${q.maxMag.toFixed(1)}` : ""}`]
        : []),
      `Last super-eruption: ${v.lastSuperEruption.name}, about ${n(years)} years ago (VEI ${v.lastSuperEruption.vei}). A long gap is not a countdown.`,
      ...(exp ? [exp] : []),
    ],
    link: { href: v.source.url, text: `${v.source.name} ↗`, external: true },
  };
}

function countryEntity(
  id: string,
  name: string,
  iso3: string,
  lat: number,
  lon: number,
  prof: CountryProfile | undefined,
  arsenal: ArsenalCountry | undefined,
): Entity {
  const lines: string[] = [];
  if (arsenal) {
    lines.push(
      `Military stockpile ${n(arsenal.stockpile)} · deployed ${n(arsenal.deployed)} · total inventory ${n(arsenal.inventory)} (SIPRI, Jan 2026)`,
    );
  }
  if (prof) {
    for (const d of prof.dyads) {
      lines.push(`${d.label}: ${d.tension != null ? `tension ${d.tension}/100` : "no index (low data)"}`);
    }
    if (prof.plants) lines.push(`${prof.plants.count} nuclear power plants (${n(prof.plants.mw)} MW)`);
    if (prof.signals.length) lines.push(`Active now: ${prof.signals.join("; ")} (co-occurrence, not cause)`);
  }
  return {
    id,
    kind: "country",
    title: name,
    lines,
    lat,
    lon,
    iso3,
    link: { href: `/country?c=${iso3}`, text: "Country profile" },
  };
}
