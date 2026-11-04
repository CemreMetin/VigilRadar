"use client";

import { COLOR, LAYER } from "@/lib/palette";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { arsenals } from "@/lib/arsenals";
import { FORMER_STATES, filterBases, nuclearBaseIds } from "@/lib/bases";
import { buildEntityIndex, dyadLines, groupOutbreaks, type Entity } from "@/lib/entities";
import { isStale } from "@/lib/format";
import { geomagLat, geomagLines } from "@/lib/geomag";
import { GROUPS, LAYER_INFO, MODES, MODE_BY_ID, defaultLayers, type GroupId, type LayerId } from "@/lib/lenses";
import { moon, moonPhase, nightPolygon, sun } from "@/lib/sky";
import { useLazyJson } from "@/lib/useLazyJson";
import { useAlarmSound } from "@/lib/alarmTone";
import type { Alert } from "@/lib/alerts";
import { overdueReviews } from "@/lib/reviews";
import { useAlerts } from "@/lib/useAlerts";
import type {
  AsteroidsFile,
  AuroraFile,
  BslLabsFile,
  SolarNow,
  TargetsFile,
  CyclonesFile,
  FiresFile,
  MilitaryBasesFile,
  OrbitFile,
  ConflictCell,
  ConflictFile,
  LinksFile,
  MonitorEvent,
  Plant,
  PlantsFile,
  ProfilesFile,
  TideGaugesFile,
  WorldState,
} from "@/lib/types";
import CounterPanel from "./CounterPanel";
import DashboardLayout from "./dashboard/DashboardLayout";
import FilterPanel from "./dashboard/FilterPanel";
import HubCard from "./dashboard/HubCard";
import MapHud from "./dashboard/MapHud";
import Readout from "./dashboard/Readout";
import StatusBar from "./dashboard/StatusBar";
import Ticker, { type TickerItem } from "./dashboard/Ticker";
import TopBar from "./dashboard/TopBar";
import { ScaleChips } from "./dashboard/ExtraReadouts";
import LinksPanel, { linksFor } from "./LinksPanel";
import FreshnessTable from "./FreshnessTable";
import AlarmBar from "./dashboard/AlarmBar";
import AsteroidOrbit from "./dashboard/AsteroidOrbit";
import ViewControls from "./dashboard/ViewControls";
import { useMyCountry } from "@/lib/myCountry";
import { Term } from "./ui";
import type { MiniPoint } from "./dashboard/MiniContext";
import MapView, { type MapControls, type MapData } from "./MapView";

type Range = "24h" | "7d";
type Tab = "readout" | "metrics" | "links";
const RANGE_MS: Record<Range, number> = { "24h": 86_400_000, "7d": 7 * 86_400_000 };
const REFRESH_MS = 5 * 60_000;
const MAX_CONNECTION_LINES = 40;
const ALL_LAYERS = Object.keys(LAYER_INFO) as LayerId[];

type Fc = { type: "FeatureCollection"; features: unknown[] };

function readUrl() {
  const p = new URLSearchParams(window.location.search);
  const sc = p.get("sc");
  const tab = p.get("tab");
  return {
    mode: sc && MODE_BY_ID[sc] ? sc : "overview",
    off: (p.get("off") ?? "").split(",").filter((l): l is LayerId => ALL_LAYERS.includes(l as LayerId)),
    on: (p.get("on") ?? "").split(",").filter((l): l is LayerId => ALL_LAYERS.includes(l as LayerId)),
    range: (p.get("range") === "24h" ? "24h" : "7d") as Range,
    minMag: p.get("mag") === "4.5" ? 4.5 : 5,
    globe: p.get("view") === "3d",
    tab: (tab === "metrics" || tab === "links" ? tab : "readout") as Tab,
    selected: p.get("sel"),
  };
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

export default function Dashboard() {
  const [world, setWorld] = useState<WorldState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [modeId, setModeId] = useState("overview");
  const [layersOn, setLayersOn] = useState<Set<LayerId>>(new Set(defaultLayers(MODE_BY_ID.overview)));
  const [range, setRange] = useState<Range>("7d");
  const [minMag, setMinMag] = useState<number>(5);
  const [globe, setGlobe] = useState(false);
  const [tab, setTab] = useState<Tab>("readout");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showConnections, setShowConnections] = useState(true);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [cells, setCells] = useState<ConflictCell[]>([]);
  const [cables, setCables] = useState<Fc | null>(null);
  const [links, setLinks] = useState<LinksFile | null>(null);
  const [profiles, setProfiles] = useState<ProfilesFile | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [tideFile, setTideFile] = useState<TideGaugesFile | null>(null);
  const [asteroids, setAsteroids] = useState<AsteroidsFile | null>(null);
  const [orbitFile, setOrbitFile] = useState<OrbitFile | null>(null);
  const [basesFile, setBasesFile] = useState<MilitaryBasesFile | null>(null);
  const [cycloneFile, setCycloneFile] = useState<CyclonesFile | null>(null);
  const [fireFile, setFireFile] = useState<FiresFile | null | "off">(null);
  const [freshnessOpen, setFreshnessOpen] = useState(false);
  const [baseKinds, setBaseKinds] = useState<Set<string>>(new Set(["air", "naval", "base"]));
  const [baseCountry, setBaseCountry] = useState("");
  const [showHistorical, setShowHistorical] = useState(false);
  const [userPlace, setUserPlace] = useState<{ lat: number; lon: number; label: string } | null>(null);
  const controlsRef = useRef<MapControls | null>(null);
  const [mapZoom, setMapZoom] = useState<number | null>(null);
  const [moreOpen, setMoreOpen] = useState(false); // the "More" disclosure in the right panel, opened by a scale chip
  const [scaleDetail, setScaleDetail] = useState<"G" | "S" | "R" | null>(null);
  const lastInGroup = useRef<Partial<Record<GroupId, string>>>({}); // the scenario last open in each group

  const mode = MODE_BY_ID[modeId];

  // URL state (shareable views), read once after mount. Done in an effect on purpose: the static HTML
  // is rendered without a query string, so reading it during render would cause a hydration mismatch.
  useEffect(() => {
    const u = readUrl();
    /* eslint-disable react-hooks/set-state-in-effect */
    setModeId(u.mode);
    lastInGroup.current[MODE_BY_ID[u.mode].group] = u.mode;
    setLayersOn(new Set([...defaultLayers(MODE_BY_ID[u.mode]).filter((l) => !u.off.includes(l)), ...u.on.filter((l) => MODE_BY_ID[u.mode].layers.includes(l))]));
    setRange(u.range);
    setMinMag(u.minMag);
    setGlobe(u.globe);
    setTab(u.tab);
    if (u.selected) setSelectedId(u.selected);
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);
  useEffect(() => {
    // Do not write until the URL has been read: React StrictMode runs effects twice in dev, and an
    // early write would erase the query string before the second read.
    if (!hydrated) return;
    const p = new URLSearchParams();
    if (modeId !== "overview") p.set("sc", modeId);
    const off = defaultLayers(MODE_BY_ID[modeId]).filter((l) => !layersOn.has(l));
    if (off.length) p.set("off", off.join(","));
    const on = (MODE_BY_ID[modeId].defaultOff ?? []).filter((l) => layersOn.has(l));
    if (on.length) p.set("on", on.join(","));
    if (range !== "7d") p.set("range", range);
    if (minMag !== 5) p.set("mag", String(minMag));
    if (globe) p.set("view", "3d");
    if (tab !== "readout") p.set("tab", tab);
    if (selectedId) p.set("sel", selectedId);
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [hydrated, modeId, layersOn, range, minMag, globe, tab, selectedId]);

  // clock (null until mounted so server and client HTML match)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // main data: static files from the CDN, refreshed every 5 min
  const load = useCallback(async () => {
    try {
      setWorld(await getJson<WorldState>("/data/world_state.json"));
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "load failed");
    }
    // link data is optional: the map works without it
    getJson<LinksFile>("/data/links.json").then(setLinks).catch(() => {});
    getJson<ProfilesFile>("/data/country_profiles.json").then(setProfiles).catch(() => {});
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  // heavier, rarely changing layers are fetched only when first switched on
  const plantsOn = layersOn.has("plants");
  const conflictOn = layersOn.has("conflict");
  const cablesOn = layersOn.has("cables") || layersOn.has("cablesAll");
  useEffect(() => {
    if (!plantsOn || plants.length > 0) return;
    let cancelled = false;
    getJson<PlantsFile>("/data/nuclear_plants.json").then((f) => !cancelled && setPlants(f.plants)).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [plantsOn, plants.length]);
  useEffect(() => {
    if (!conflictOn || cells.length > 0) return;
    let cancelled = false;
    getJson<ConflictFile>("/data/conflict_cells.json").then((f) => !cancelled && setCells(f.cells)).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [conflictOn, cells.length]);
  useEffect(() => {
    if (!cablesOn || cables) return;
    let cancelled = false;
    getJson<{ features: { properties: Record<string, unknown>; geometry: { coordinates: [number, number][][] } }[] }>("/data/cables.json")
      .then((fc) => {
        if (cancelled) return;
        // flag cables that reach 50 degrees geomagnetic latitude or more, for colouring
        for (const f of fc.features) {
          let max = 0;
          for (const line of f.geometry.coordinates) for (const [lo, la] of line) max = Math.max(max, Math.abs(geomagLat(la, lo)));
          f.properties.hi = max >= 50 ? 1 : 0;
        }
        setCables({ type: "FeatureCollection", features: fc.features });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [cablesOn, cables]);

  const tideOn = layersOn.has("tide");
  useEffect(() => {
    if (!tideOn || tideFile) return;
    let cancelled = false;
    getJson<TideGaugesFile>("/data/tide_gauges.json").then((f) => !cancelled && setTideFile(f)).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [tideOn, tideFile]);
  // the Ice readout summarises the gauges even when the layer is off
  useEffect(() => {
    if (modeId !== "ice" || tideFile) return;
    getJson<TideGaugesFile>("/data/tide_gauges.json").then(setTideFile).catch(() => {});
  }, [modeId, tideFile]);
  useEffect(() => {
    if (modeId !== "asteroid" || asteroids) return;
    getJson<AsteroidsFile>("/data/asteroids.json").then(setAsteroids).catch(() => {});
  }, [modeId, asteroids]);
  useEffect(() => {
    if (modeId !== "weather" || cycloneFile) return;
    getJson<CyclonesFile>("/data/cyclones.json").then(setCycloneFile).catch(() => {});
  }, [modeId, cycloneFile]);
  useEffect(() => {
    if (modeId !== "weather" || fireFile) return;
    // 404 means no FIRMS key is configured for the data job: remember that instead of retrying
    getJson<FiresFile>("/data/fires.json").then(setFireFile).catch(() => setFireFile("off"));
  }, [modeId, fireFile]);
  const fireFc = useMemo<Fc | null>(
    () =>
      fireFile && fireFile !== "off" && layersOn.has("fires")
        ? {
            type: "FeatureCollection",
            features: fireFile.cells.map(([lat, lon, n, frp]) => ({
              type: "Feature",
              properties: { n, frp },
              geometry: { type: "Point", coordinates: [lon, lat] },
            })),
          }
        : null,
    [fireFile, layersOn],
  );
  const cycloneFc = useMemo<Fc | null>(
    () =>
      cycloneFile && layersOn.has("cyclones")
        ? {
            type: "FeatureCollection",
            features: cycloneFile.storms.map((s) => ({
              type: "Feature",
              properties: { id: `cyclone:${s.id}`, name: s.name, cls: s.cls, wind: s.windKt, pressure: s.pressureMb, updated: s.updated },
              geometry: { type: "Point", coordinates: [s.lon, s.lat] },
            })),
          }
        : null,
    [cycloneFile, layersOn],
  );
  const basesOn = layersOn.has("bases");
  useEffect(() => {
    if (!basesOn || basesFile) return;
    let cancelled = false;
    getJson<MilitaryBasesFile>("/data/military_bases.json").then((f) => !cancelled && setBasesFile(f)).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [basesOn, basesFile]);
  useEffect(() => {
    if (modeId !== "orbit" || orbitFile) return;
    getJson<OrbitFile>("/data/orbit.json").then(setOrbitFile).catch(() => {});
  }, [modeId, orbitFile]);
  // reference sites for the nuclear scenario also mark the bases that sit on them
  const targetsOn = layersOn.has("targets");
  const targets = useLazyJson<TargetsFile>("/data/nuclear_targets.json", targetsOn || basesOn || modeId === "nuclear");
  const shownBases = useMemo(
    () => (basesFile ? filterBases(basesFile.bases, { kinds: baseKinds, country: baseCountry, historical: showHistorical }) : []),
    [basesFile, baseKinds, baseCountry, showHistorical],
  );
  const nuclearIds = useMemo(() => (basesFile && targets.data ? nuclearBaseIds(basesFile.bases, targets.data.sites) : new Set<string>()), [basesFile, targets.data]);
  const baseCountries = useMemo(
    () => (basesFile ? [...new Set(basesFile.bases.map((b) => b[4]).filter((c) => c && (showHistorical || !FORMER_STATES.has(c))))].sort() : []),
    [basesFile, showHistorical],
  );
  const basesFc = useMemo<Fc | null>(
    () =>
      basesOn && basesFile
        ? {
            type: "FeatureCollection",
            features: shownBases.map(([id, name, lat, lon, country, kind]) => ({
              type: "Feature",
              properties: { id: `base:${id}`, name, country, kind, nuc: nuclearIds.has(id) ? 1 : 0 },
              geometry: { type: "Point", coordinates: [lon, lat] },
            })),
          }
        : null,
    [basesOn, basesFile, shownBases, nuclearIds],
  );
  const orbitFc = useMemo<Fc | null>(() => {
    if (!orbitFile || modeId !== "orbit") return null;
    const on = [layersOn.has("satellites"), layersOn.has("starlink"), layersOn.has("debris")];
    const features = orbitFile.objects
      .filter((o) => ((k) => k === 3 ? on[0] : k === 1 ? on[1] : k === 2 ? on[2] : on[0])(o[3]))
      .map(([lon, lat, alt, kind, name]) => ({
        type: "Feature",
        properties: { kind, alt, name },
        geometry: { type: "Point", coordinates: [lon, lat] },
      }));
    return { type: "FeatureCollection", features };
  }, [orbitFile, modeId, layersOn]);
  const tideFc = useMemo<Fc | null>(
    () =>
      tideOn && tideFile
        ? {
            type: "FeatureCollection",
            features: tideFile.stations.map(([id, name, lat, lon, trend, years, last]) => ({
              type: "Feature",
              properties: { id: `tide:${id}`, name, trend, years, last },
              geometry: { type: "Point", coordinates: [lon, lat] },
            })),
          }
        : null,
    [tideOn, tideFile],
  );

  const targetsFc = useMemo<Fc | null>(
    () =>
      targetsOn && targets.data
        ? {
            type: "FeatureCollection",
            features: targets.data.sites.map(([name, lat, lon, cat, country, role, source]) => ({
              type: "Feature",
              properties: { name, cat, country, role, source },
              geometry: { type: "Point", coordinates: [lon, lat] },
            })),
          }
        : null,
    [targetsOn, targets.data],
  );

  // shaded countries: WHO reports (bio, overview) or grid exposure (solar)
  const fillMode: MapData["fill"]["mode"] = layersOn.has("outbreaks") ? "reports" : layersOn.has("exposure") ? "exposure" : null;
  const countries = useLazyJson<Fc>("/data/countries.geo.json", fillMode !== null);
  const exposure = useLazyJson<{ countries: { iso3: string; share: number }[] }>("/data/solar_exposure.json", layersOn.has("exposure"));
  const day = now === null ? 0 : Math.floor(now / 86_400_000);
  const reportsByIso = useMemo(() => {
    const out: Record<string, { title: string; date: string; url?: string }[]> = {};
    const since = (day - 90) * 86_400_000;
    for (const e of world?.events ?? []) {
      if (e.domain !== "health" || new Date(e.startedAt).getTime() < since) continue;
      for (const iso of e.countries) (out[iso] ??= []).push({ title: e.title, date: e.startedAt.slice(0, 10), url: e.url });
    }
    return out;
  }, [world, day]);
  const fill = useMemo<MapData["fill"]>(
    () =>
      fillMode === "reports"
        ? { mode: "reports", values: Object.fromEntries(Object.entries(reportsByIso).map(([k, v]) => [k, v.length])), reports: reportsByIso }
        : fillMode === "exposure" && exposure.data
          ? { mode: "exposure", values: Object.fromEntries(exposure.data.countries.map((c) => [c.iso3, c.share])), reports: {} }
          : { mode: null, values: {}, reports: {} },
    [fillMode, reportsByIso, exposure.data],
  );

  const aurora = useLazyJson<AuroraFile>("/data/aurora.json", layersOn.has("aurora"));
  const solarNow = useLazyJson<SolarNow>("/data/solar_now.json", modeId === "solar");
  const airports = useLazyJson<{ airports: [string, string, string, string, number, number, number][] }>("/data/airports.json", layersOn.has("hubs"));
  const labs = useLazyJson<BslLabsFile>("/data/bsl4_labs.json", layersOn.has("labs"));
  const auroraFc = useMemo<Fc | null>(
    () =>
      layersOn.has("aurora") && aurora.data
        ? { type: "FeatureCollection", features: aurora.data.points.map(([lon, lat, a]) => ({ type: "Feature", properties: { a }, geometry: { type: "Point", coordinates: [lon, lat] } })) }
        : null,
    [layersOn, aurora.data],
  );
  const hubsFc = useMemo<Fc | null>(
    () =>
      layersOn.has("hubs") && airports.data
        ? {
            type: "FeatureCollection",
            // the 50 airports with the most routes: the file is sorted by route count
            features: airports.data.airports.slice(0, 50).map(([iata, name, , , lat, lon, routes]) => ({ type: "Feature", properties: { iata, name, routes }, geometry: { type: "Point", coordinates: [lon, lat] } })),
          }
        : null,
    [layersOn, airports.data],
  );
  const labsFc = useMemo<Fc | null>(
    () =>
      layersOn.has("labs") && labs.data
        ? {
            type: "FeatureCollection",
            features: labs.data.labs.map(([name, lat, lon, country, , statement]) => ({ type: "Feature", properties: { name, country, source: `Source: Wikipedia. ${statement}` }, geometry: { type: "Point", coordinates: [lon, lat] } })),
          }
        : null,
    [layersOn, labs.data],
  );

  // Sun, Moon and the night side: computed from the clock, refreshed once a minute, drawn whenever the globe is on
  const globeEff = globe || !!mode.globe;
  const minute = now === null ? null : Math.floor(now / 60_000);
  const sky = useMemo(() => {
    if (minute === null || !globeEff) return null;
    const t = minute * 60_000;
    const s = sun(t);
    const m = moon(t);
    const ph = moonPhase(t);
    const at = (p: { lat: number; lon: number }) => `(${p.lat.toFixed(1)}°, ${p.lon.toFixed(1)}°)`;
    const night: Fc = { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [nightPolygon(s.lat, s.lon)] } }] };
    const points: Fc = {
      type: "FeatureCollection",
      features: [
        { type: "Feature", properties: { kind: "sun", title: "Sun: subsolar point", text: `The Sun is straight overhead at ${at(s)} now. Computed from the clock with a low-precision formula; the dark area is where it is night.` }, geometry: { type: "Point", coordinates: [s.lon, s.lat] } },
        { type: "Feature", properties: { kind: "moon", title: `Moon: ${ph.name}, ${Math.round(ph.lit * 100)}% lit`, text: `The Moon is straight overhead at ${at(m)} now. Computed from the clock with a low-precision formula (about 0.3 degrees).` }, geometry: { type: "Point", coordinates: [m.lon, m.lat] } },
      ],
    };
    return { night, points };
  }, [minute, globeEff]);

  // live alarms: poll the alert feeds, sound and flash while a CRITICAL alert is unacknowledged
  const { critical, notices, acknowledge } = useAlerts(now);
  const alarmOn = critical.length > 0;
  const sound = useAlarmSound(alarmOn);
  useEffect(() => {
    if (!alarmOn) return;
    const base = document.title.replace(/^CRITICAL · /, "");
    document.title = `CRITICAL · ${base}`;
    return () => {
      document.title = base;
    };
  }, [alarmOn]);

  const nowMs = now ?? 0;
  const today = now ? new Date(now).toISOString().slice(0, 10) : "0000-00-00";

  // all quakes passing the filters (the layer decides whether they are drawn)
  const quakesFiltered = useMemo<MonitorEvent[]>(() => {
    if (!world || now === null) return [];
    const since = now - RANGE_MS[range];
    return world.events.filter(
      (e) => e.kind === "quake" && (e.magnitude ?? 0) >= minMag && new Date(e.startedAt).getTime() >= since,
    );
  }, [world, now, range, minMag]);

  const outbreakGroups = useMemo(() => groupOutbreaks(world, profiles), [world, profiles]);
  const dyads = useMemo(() => dyadLines(world, profiles, arsenals.countries), [world, profiles]);

  const entities = useMemo(
    () =>
      buildEntityIndex({
        world,
        plants,
        arsenals: arsenals.countries,
        cells,
        links,
        profiles,
        outbreaks: outbreakGroups,
        dyads,
      }),
    [world, plants, cells, links, profiles, outbreakGroups, dyads],
  );

  const [myCountry] = useMyCountry();
  const myCountryEntity = (myCountry && entities.get(`country:${myCountry}`)) || null;
  const cameraStarted = useRef(false);
  useEffect(() => {
    // first load with no scenario or selection in the URL: start the camera on the stored country (centroid, same flyTo as place search)
    const url = new URLSearchParams(window.location.search);
    if (!myCountryEntity || cameraStarted.current || url.has("sc") || url.has("sel")) return;
    const wait = setInterval(() => {
      if (!controlsRef.current) return;
      cameraStarted.current = true;
      controlsRef.current.flyTo(myCountryEntity.lon, myCountryEntity.lat, 3);
      clearInterval(wait);
    }, 300);
    return () => clearInterval(wait);
  }, [myCountryEntity]);
  // volcanoes and recent events: what a keyboard user can choose instead of clicking a marker
  const pickList = useMemo(() => [...entities.values()].filter((e) => e.kind === "event" || e.kind === "volcano").slice(0, 80).map((e) => ({ id: e.id, title: e.title })), [entities]);
  const tickerItems = useMemo<TickerItem[]>(() => {
    if (!world || !now) return [];
    const quake = (e: MonitorEvent) => e.kind === "quake" && (e.magnitude ?? 0) >= 6 && now - Date.parse(e.startedAt) < 864e5;
    const who = (e: MonitorEvent) => e.kind === "outbreak" && now - Date.parse(e.startedAt) < 7 * 864e5;
    return [
      ...[...critical, ...notices].map((a) => ({ id: a.id, at: a.at, kind: a.level.toUpperCase(), text: a.title, source: a.sourceName, entityId: a.entityId })),
      ...world.events.filter(quake).map((e) => ({ id: e.id, at: e.startedAt, kind: `M${e.magnitude?.toFixed(1)}`, text: e.title, source: e.source.name, entityId: e.id })),
      ...world.events.filter(who).map((e) => ({ id: e.id, at: e.startedAt, kind: "WHO", text: e.title, source: e.source.name, entityId: e.id })),
    ]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 16);
  }, [world, now, critical, notices]);
  const selected: Entity | null = selectedId ? (entities.get(selectedId) ?? null) : null;

  // Connections: lines from the selected thing to what it is linked to
  const connections = useMemo(() => {
    if (!showConnections || !selected) return [];
    const out: MapData["connections"] = [];
    const from: [number, number] = [selected.lon, selected.lat];
    for (const l of linksFor(selected.id, links)) {
      const other = entities.get(l.otherId);
      if (!other || other.id === selected.id) continue;
      // markers at the same spot (a country marker and its reports) need no line
      if (Math.abs(other.lon - selected.lon) < 0.01 && Math.abs(other.lat - selected.lat) < 0.01) continue;
      out.push({ id: `${selected.id}>${other.id}`, from, to: [other.lon, other.lat] });
      if (out.length >= MAX_CONNECTION_LINES) break;
    }
    if (selected.kind === "country" && selected.iso3) {
      for (const d of dyads) {
        if (d.a !== selected.iso3 && d.b !== selected.iso3) continue;
        out.push({ id: `${d.id}-pair`, from: d.from, to: d.to });
      }
    }
    return out;
  }, [showConnections, selected, links, entities, dyads]);

  const geomagFc = useMemo(() => (layersOn.has("geomag") ? geomagLines() : null), [layersOn]);

  const mapData = useMemo<MapData>(
    () => ({
      quakes: layersOn.has("quakes") ? quakesFiltered : [],
      plants: plantsOn ? plants : [],
      arsenals: layersOn.has("arsenals") ? arsenals.countries : [],
      volcanoes: layersOn.has("volcanoes") ? (world?.volcanoes ?? []) : [],
      outbreaks: layersOn.has("outbreaks") ? outbreakGroups : [],
      cells: conflictOn ? cells : [],
      dyads: layersOn.has("dyads") ? dyads : [],
      connections,
      geomag: geomagFc,
      cables: cablesOn ? cables : null,
      tide: tideFc,
      bases: basesFc,
      orbit: orbitFc,
      cyclones: cycloneFc,
      fires: fireFc,
      night: sky?.night ?? null,
      sky: sky?.points ?? null,
      targets: targetsFc,
      aurora: auroraFc,
      hubs: hubsFc,
      labs: labsFc,
      countries: fillMode ? countries.data : null,
      fill,
      allCables: layersOn.has("cablesAll"),
    }),
    [layersOn, tideFc, basesFc, orbitFc, cycloneFc, fireFc, sky, targetsFc, auroraFc, hubsFc, labsFc, countries.data, fillMode, fill, quakesFiltered, plantsOn, plants, world, outbreakGroups, conflictOn, cells, dyads, connections, geomagFc, cablesOn, cables],
  );

  // left panel: live counts per layer, and every drawn point for the mini context map
  const counts: Partial<Record<LayerId, number>> = {
    quakes: quakesFiltered.length,
    volcanoes: world?.volcanoes.length,
    arsenals: arsenals.countries.length,
    plants: plants.length || undefined,
    dyads: dyads.length,
    outbreaks: outbreakGroups.length,
    conflict: cells.length || undefined,
    cables: cables?.features.length,
    tide: tideFile?.stations.length,
    bases: basesFile ? shownBases.length : undefined,
    targets: targets.data?.sites.length,
    aurora: aurora.data?.points.length,
    hubs: hubsFc?.features.length,
    labs: labs.data?.labs.length,
    satellites: orbitFile?.counts.satellites,
    starlink: orbitFile?.counts.starlink,
    debris: orbitFile?.counts.debris,
    cyclones: cycloneFile?.storms.length,
    fires: fireFile && fireFile !== "off" ? fireFile.cells.length : undefined,
  };
  const miniPoints = useMemo<MiniPoint[]>(() => {
    const out: MiniPoint[] = [];
    for (const e of mapData.quakes) out.push({ lon: e.lon, lat: e.lat, color: LAYER_INFO.quakes.color });
    for (const x of mapData.plants) out.push({ lon: x.lon, lat: x.lat, color: LAYER_INFO.plants.color });
    for (const x of mapData.arsenals) out.push({ lon: x.centroid[0], lat: x.centroid[1], color: LAYER_INFO.arsenals.color });
    for (const x of mapData.volcanoes) out.push({ lon: x.lon, lat: x.lat, color: LAYER_INFO.volcanoes.color });
    for (const x of mapData.outbreaks) out.push({ lon: x.lon, lat: x.lat, color: LAYER_INFO.outbreaks.color });
    for (const x of mapData.cells) out.push({ lon: x.lon, lat: x.lat, color: LAYER_INFO.conflict.color });
    for (const b of basesFile && basesOn ? basesFile.bases : []) out.push({ lon: b[3], lat: b[2], color: LAYER_INFO.bases.color });
    for (const f of (mapData.tide?.features ?? []) as { geometry: { coordinates: [number, number] } }[]) {
      out.push({ lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1], color: LAYER_INFO.tide.color });
    }
    return out;
  }, [mapData, basesFile, basesOn]);

  const liveFeeds = world?.feeds.filter((f) => f.ok && !isStale(f.fetchedAt, nowMs)).length ?? 0;
  const totalFeeds = world?.feeds.length ?? 0;
  const dataStale = world ? isStale(world.generatedAt, nowMs) : false;
  const overdue = useMemo(() => (world ? overdueReviews(world.counters, arsenals, today) : []), [world, today]);
  const failedFeeds = world?.feeds.filter((f) => !f.ok).map((f) => f.name) ?? [];

  const toggleLayer = (id: LayerId) =>
    setLayersOn((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  /** Browser location, only when asked for; it is used here in the page and never sent anywhere. */
  const useMyLocation = () =>
    navigator.geolocation?.getCurrentPosition(
      (p) => setUserPlace({ lat: p.coords.latitude, lon: p.coords.longitude, label: "your location" }),
      () => {},
      { timeout: 10_000 },
    );

  const select = (id: string | null) => {
    setSelectedId(id);
    if (id) setTab((t) => (t === "readout" ? "links" : t));
  };

  /** Top-bar tabs are mutually exclusive: switching resets the layers to that scenario's set. */
  const selectMode = useCallback((id: string) => {
    if (!MODE_BY_ID[id]) return;
    lastInGroup.current[MODE_BY_ID[id].group] = id;
    setModeId(id);
    setLayersOn(new Set(defaultLayers(MODE_BY_ID[id])));
    setSelectedId(null);
    setTab("readout");
    setMoreOpen(false);
    setScaleDetail(null);
  }, []);

  /** A group opens the scenario last used in it (its first one by default). */
  const selectGroup = useCallback(
    (g: GroupId) => selectMode(lastInGroup.current[g] ?? MODES.find((m) => m.group === g)!.id),
    [selectMode],
  );

  const viewAlert = (a: Alert) => {
    selectMode(a.scenario);
    if (a.entityId) setSelectedId(a.entityId);
  };

  // keys 1-4 pick a group; the active group's key again moves to its next scenario (ignored while typing)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      const group = GROUPS[Number(e.key) - 1];
      if (!group) return;
      if (group.id !== MODE_BY_ID[modeId].group) return selectGroup(group.id);
      const subs = MODES.filter((m) => m.group === group.id);
      selectMode(subs[(subs.findIndex((m) => m.id === modeId) + 1) % subs.length].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modeId, selectMode, selectGroup]);

  const mapSummary = [
    layersOn.has("quakes") ? `${quakesFiltered.length} quakes · ${range} · M${minMag}+` : null,
    layersOn.has("arsenals") || plantsOn || layersOn.has("dyads") ? `${arsenals.countries.length} arsenals · ${plants.length} plants · ${dyads.length} pairs` : null,
    layersOn.has("outbreaks") ? `${outbreakGroups.length} countries with WHO reports` : null,
    conflictOn ? `${cells.length} conflict hotspots (news-based)` : null,
    layersOn.has("geomag") ? "geomagnetic bands at 50° and 60°" : null,
  ]
    .filter(Boolean)
    .join("  |  ");

  const signal = mode.signal(world);
  const SIGNAL_COLOR = { normal: "var(--fg-dim)", elevated: "var(--scn)", high: "var(--threat)", none: "var(--fg-dim)" } as const;

  const tabs: [Tab, string][] = [
    ["readout", "Readout"],
    ["metrics", `Metrics${world ? ` · ${world.counters.length}` : ""}`],
    ["links", `Links${selected ? " •" : ""}`],
  ];

  // metrics: this scenario's first, then the rest in their usual order
  const orderedCounters = useMemo(() => {
    const all = world?.counters ?? [];
    const first = mode.counterIds.map((id) => all.find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => !!c);
    return [...first, ...all.filter((c) => !mode.counterIds.includes(c.id))];
  }, [world, mode]);

  const legend = (
    <>
      {layersOn.has("dyads") && <p><span style={{ color: "var(--threat)" }}>━</span> curves: country pairs; thicker and redder is more tense coverage</p>}
      {conflictOn && <p><span style={{ color: "var(--conflict)" }}>●</span> news-reported armed conflict, last 7 days</p>}
      {layersOn.has("volcanoes") && <p>◉ supervolcano: white normal, red above baseline, grey no feed</p>}
      {layersOn.has("bases") && (
        <p>
          <span style={{ color: COLOR.geo }}>●</span> military base (Wikidata; coverage uneven, not an order of battle).{" "}
          {basesFile ? `Showing ${shownBases.length.toLocaleString("en-US")} of ${basesFile.bases.length.toLocaleString("en-US")}${showHistorical ? "" : " (former states hidden)"}. A red ring marks a base that is also in the nuclear reference list.` : "Loading bases…"}
        </p>
      )}
      {layersOn.has("targets") && (
        <p>
          <span style={{ color: "var(--threat)" }}>◆ ■ ▲ ○</span> strategic forces, storage, command, capital. ILLUSTRATIVE MODEL, not a forecast: click one to draw the dashed rings of an example 300 kt explosion. Example yield, not a prediction of what would be used. {targets.failed ? "The list is unavailable right now." : ""}
        </p>
      )}
      {layersOn.has("aurora") && <p>Aurora oval: NOAA OVATION nowcast (brighter = likelier). {aurora.failed ? "Nowcast unavailable right now. " : ""}Dashed bands: fixed 50° and 60° geomagnetic latitude, for reference (illustrative).</p>}
      {layersOn.has("exposure") && <p>Shaded countries: share of power capacity at 50° or more geomagnetic latitude (WRI plant data). {exposure.failed ? "Exposure data unavailable. " : ""}{countries.failed ? "Country outlines unavailable." : ""}</p>}
      {(layersOn.has("cables") || layersOn.has("cablesAll")) && <p>Long undersea internet cables need powered repeaters. A strong geomagnetic storm can induce currents that damage them, cutting internet links between continents.</p>}
      {layersOn.has("outbreaks") && <p><span style={{ color: "var(--bio)" }}>■</span> darker purple: more WHO reports in the last 90 days (reports, not outbreaks). {countries.failed ? "Country outlines unavailable, so no shading." : ""}</p>}
      {layersOn.has("hubs") && <p><span style={{ color: "var(--bio)" }}>◯</span> How fast a new pathogen can travel: the 50 busiest airports by route count. {airports.failed ? "Airport data unavailable. " : ""}<Link href="/scenarios/pandemic-x" className="underline">Pandemic explorer</Link></p>}
      {layersOn.has("labs") && <p><span style={{ color: LAYER.labs }}>◯</span> <Term id="bsl4">BSL-4</Term> labs: partial reference list, not a risk ranking. {labs.failed ? "Unavailable right now." : ""}</p>}
      {globeEff && <p>3D: the shaded side is night; the Sun and Moon markers are computed from the clock.</p>}
      {modeId === "orbit" && <p>Dots are positions at the snapshot time; objects move about 7 km/s</p>}
      {layersOn.has("geomag") && <p><span style={{ color: "var(--geo)" }}>┄</span> 50° <span style={{ color: "var(--threat)" }}>┄</span> 60° geomagnetic latitude</p>}
      <p className="pt-1">Only observations and published figures; nothing here is a forecast.</p>
    </>
  );

  const right = (
    <>
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto" key={mode.id}>
        {/* first view: scenario, signal with its basis, and the first metric */}
        <div className="border-b border-line px-3 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <p className="mono text-body font-bold tracking-wider" style={{ color: mode.color }}>
              {`SCN//${mode.title.toUpperCase()}`}
            </p>
            <span
              className="mono border px-1.5 py-0.5 text-label font-bold tracking-wider"
              style={{ color: SIGNAL_COLOR[signal.level], borderColor: SIGNAL_COLOR[signal.level] }}
              title="The highest status among this scenario's live metrics. Thresholds are set in the data worker and described on the Methodology page; it is a reading, not a forecast."
            >
              SIGNAL {signal.label}
            </span>
          </div>
          <p className="mt-1.5 text-body leading-relaxed text-dim">{signal.basis}</p>
        </div>
        <CounterPanel counters={orderedCounters.slice(0, 1)} today={today} />
        {mode.id === "solar" && <ScaleChips solar={solarNow} picked={scaleDetail} onPick={(k) => { setScaleDetail(k); setMoreOpen(true); setTab("readout"); }} />}

        <details className="group border-t border-line" open={moreOpen} onToggle={(e) => setMoreOpen(e.currentTarget.open)}>
          <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 hover:bg-accent/5 [&::-webkit-details-marker]:hidden">
            <span className="label">More</span>
            <span className="mono text-label font-bold text-accent" aria-hidden>
              <span className="group-open:hidden">+</span>
              <span className="hidden group-open:inline">−</span>
            </span>
          </summary>
          <p className="px-3 pb-2 text-body leading-relaxed text-dim">{mode.blurb}</p>
          <Link href={mode.page} style={{ "--c": mode.color } as React.CSSProperties} className="btn mono mx-3 mb-3 inline-block px-2.5 py-1 text-body font-bold">
            {mode.pageLabel} →
          </Link>

          <div className="flex border-y border-line" role="tablist" aria-label="Right panel view">
            {tabs.map(([id, label], i) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={`btn mono flex-1 border-0 px-2 py-2 text-body font-bold ${tab === id ? "border-b-2" : ""} ${i > 0 ? "border-l" : ""}`}
                style={{ borderBottomColor: tab === id ? "var(--accent)" : undefined, borderLeftColor: "var(--line)" }}
              >
                {label}
              </button>
            ))}
          </div>

          <div role="tabpanel" key={`${mode.id}-${tab}`}>
            {tab === "readout" && (
              <Readout mode={mode} world={world} quakes={quakesFiltered} now={now} selectedId={selectedId} onSelect={select} asteroids={asteroids} tide={tideFile} orbit={orbitFile} cyclones={cycloneFile} fires={fireFile} solar={solarNow} scaleDetail={scaleDetail} targets={targets} userPlace={userPlace} onUseLocation={useMyLocation} />
            )}
            {tab === "metrics" && (
              <>
                <CounterPanel counters={orderedCounters.slice(1)} today={today} />
                <p className="px-3 py-3 text-body leading-relaxed text-dim">Open a metric for its trend, source, date and caveats.</p>
              </>
            )}
            {tab === "links" && <LinksPanel selected={selected} myCountry={myCountryEntity} links={links} entities={entities} onSelect={select} />}
          </div>
        </details>
      </div>

      <HubCard />
    </>
  );

  return (
    <DashboardLayout
      themeColor={mode.color}
      alarm={alarmOn}
      banner={
        critical.length + notices.length === 0 ? null : (
        <AlarmBar
          critical={critical}
          notices={notices}
          now={now}
          muted={sound.muted}
          locked={sound.locked}
          onMute={sound.setMuted}
          onView={viewAlert}
          onAck={acknowledge}
        />
        )
      }
      topBar={<TopBar modes={MODES} activeId={modeId} onSelect={selectMode} onSelectGroup={selectGroup} world={world} />}
      left={
        <FilterPanel
          mode={mode}
          layersOn={layersOn}
          onToggle={toggleLayer}
          onAllLayers={(on) => setLayersOn(new Set(on ? mode.layers : []))}
          counts={counts}
          points={miniPoints}
          selected={selected}
          onFly={(lon, lat, zoom) => controlsRef.current?.flyTo(lon, lat, zoom)}
          onClearSelection={() => select(null)}
          pickList={pickList}
          onPick={select}
          range={range}
          onRange={setRange}
          minMag={minMag}
          onMinMag={setMinMag}
          showConnections={showConnections}
          onConnections={setShowConnections}
          onPlace={(lon, lat, label) => setUserPlace({ lat, lon, label })}
          basesUi={
            basesOn && basesFile
              ? {
                  kinds: baseKinds,
                  onKinds: setBaseKinds,
                  countries: baseCountries,
                  country: baseCountry,
                  onCountry: setBaseCountry,
                  historical: showHistorical,
                  onHistorical: setShowHistorical,
                }
              : null
          }
          legend={legend}
        />
      }
      right={right}
      footer={
        <>
        <StatusBar
          world={world}
          loadError={loadError}
          now={now}
          liveFeeds={liveFeeds}
          totalFeeds={totalFeeds}
          stale={dataStale}
          failed={failedFeeds}
          summary={mapSummary}
          overdue={overdue}
          freshnessOpen={freshnessOpen}
          onFreshness={() => setFreshnessOpen((v) => !v)}
        />
        <Ticker items={tickerItems} onSelect={select} />
        </>
      }
      map={
        <MapView
          data={mapData}
          entities={entities}
          selectedId={selectedId}
          onSelect={select}
          globe={globe || !!mode.globe}
          camera={{ ...mode.camera, key: mode.id }}
          controlsRef={controlsRef}
          onZoom={(z) => setMapZoom((prev) => (prev !== null && Math.abs(prev - z) < 0.01 ? prev : z))}
        />
      }
      controls={<ViewControls globe={globe || !!mode.globe} locked={!!mode.globe} onGlobe={setGlobe} controls={controlsRef} />}
      mapOverlay={
        <>
          <MapHud color={mode.color} id={mode.id} />
          <p className="sr-only" role="status">{`${mode.title} map. ${mapSummary}. Use the list in the Selection section to choose an item without a pointer.`}</p>
          {mode.id === "asteroid" && <AsteroidOrbit file={asteroids} now={now} zoom={mapZoom} />}
          {freshnessOpen && world && (
            <section className="panel-scn absolute inset-x-2 bottom-2 z-30 max-h-[70%] overflow-y-auto scroll-thin p-3 lg:inset-x-auto lg:bottom-[calc(var(--foot-h)+var(--gap))] lg:left-(--left-edge) lg:w-[min(760px,calc(100%-var(--left-edge)-var(--right-edge)))]" aria-label="Data freshness">
              <div className="mb-2 flex items-center justify-between">
                <p className="label caret">Data freshness</p>
                <button type="button" className="btn mono px-2 py-0.5 text-body font-bold" onClick={() => setFreshnessOpen(false)}>CLOSE</button>
              </div>
              <FreshnessTable feeds={world.feeds} />
              {overdue.length > 0 && (
                <div className="mt-3 border border-geo p-2 text-body leading-relaxed">
                  <p className="mono font-bold" style={{ color: "var(--geo)" }}>PAST REVIEW DATE (hand-entered figures)</p>
                  <ul className="mt-1 text-dim">
                    {overdue.map((o) => (
                      <li key={o.label}>{o.label}: due {o.reviewBy}, check {o.source}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}
        </>
      }
    />
  );
}
