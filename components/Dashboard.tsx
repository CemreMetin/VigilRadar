"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { arsenals } from "@/lib/arsenals";
import { buildEntityIndex, dyadLines, groupOutbreaks, type Entity } from "@/lib/entities";
import { isStale } from "@/lib/format";
import { geomagLat, geomagLines } from "@/lib/geomag";
import { LAYER_INFO, MODES, MODE_BY_ID, type LayerId } from "@/lib/lenses";
import type {
  ConflictCell,
  ConflictFile,
  LinksFile,
  MonitorEvent,
  Plant,
  PlantsFile,
  ProfilesFile,
  WorldState,
} from "@/lib/types";
import CounterPanel from "./CounterPanel";
import DashboardLayout from "./dashboard/DashboardLayout";
import FilterPanel from "./dashboard/FilterPanel";
import HubCard from "./dashboard/HubCard";
import MapHud from "./dashboard/MapHud";
import Readout from "./dashboard/Readout";
import StatusBar from "./dashboard/StatusBar";
import TopBar from "./dashboard/TopBar";
import LinksPanel, { linksFor } from "./LinksPanel";
import MapView, { type MapData } from "./MapView";

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
  const [layersOn, setLayersOn] = useState<Set<LayerId>>(new Set(MODE_BY_ID.overview.layers));
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

  const mode = MODE_BY_ID[modeId];

  // URL state (shareable views), read once after mount. Done in an effect on purpose: the static HTML
  // is rendered without a query string, so reading it during render would cause a hydration mismatch.
  useEffect(() => {
    const u = readUrl();
    /* eslint-disable react-hooks/set-state-in-effect */
    setModeId(u.mode);
    setLayersOn(new Set(MODE_BY_ID[u.mode].layers.filter((l) => !u.off.includes(l))));
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
    const off = MODE_BY_ID[modeId].layers.filter((l) => !layersOn.has(l));
    if (off.length) p.set("off", off.join(","));
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
  const cablesOn = layersOn.has("cables");
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
    }),
    [layersOn, quakesFiltered, plantsOn, plants, world, outbreakGroups, conflictOn, cells, dyads, connections, geomagFc, cablesOn, cables],
  );

  const liveFeeds = world?.feeds.filter((f) => f.ok && !isStale(f.fetchedAt, nowMs)).length ?? 0;
  const totalFeeds = world?.feeds.length ?? 0;
  const dataStale = world ? isStale(world.generatedAt, nowMs) : false;
  const failedFeeds = world?.feeds.filter((f) => !f.ok).map((f) => f.name) ?? [];

  const toggleLayer = (id: LayerId) =>
    setLayersOn((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const select = (id: string | null) => {
    setSelectedId(id);
    if (id) setTab((t) => (t === "readout" ? "links" : t));
  };

  /** Top-bar tabs are mutually exclusive: switching resets the layers to that scenario's set. */
  const selectMode = useCallback((id: string) => {
    if (!MODE_BY_ID[id]) return;
    setModeId(id);
    setLayersOn(new Set(MODE_BY_ID[id].layers));
    setSelectedId(null);
    setTab("readout");
  }, []);

  // keys 1-6 switch scenarios (ignored while typing)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      const i = Number(e.key) - 1;
      if (Number.isInteger(i) && i >= 0 && i < MODES.length) selectMode(MODES[i].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectMode]);

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
  const SIGNAL_COLOR = { normal: "var(--safe)", elevated: "var(--geo)", high: "var(--threat)" } as const;

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
      {layersOn.has("outbreaks") && <p><span style={{ color: "var(--bio)" }}>◯</span> WHO report (country centre)</p>}
      {layersOn.has("volcanoes") && <p>◉ supervolcano: white normal, red above baseline, grey no feed</p>}
      {layersOn.has("geomag") && <p><span style={{ color: "var(--geo)" }}>┄</span> 50° <span style={{ color: "var(--threat)" }}>┄</span> 60° geomagnetic latitude</p>}
      <p className="pt-1">Only observations and published figures; nothing here is a forecast.</p>
    </>
  );

  const right = (
    <>
      {/* scenario header: what this scenario is, and one status word with its basis */}
      <div className="shrink-0 border-b border-line px-3 py-2.5" key={mode.id}>
        <div className="flex items-center justify-between gap-3">
          <p className="mono readout-in text-[11px] font-bold tracking-wider" style={{ color: mode.color }}>
            {`SCN//${mode.title.toUpperCase()}`}
          </p>
          <span
            className="mono readout-in border px-1.5 py-0.5 text-[10px] font-bold tracking-wider"
            style={{ color: SIGNAL_COLOR[signal.level], borderColor: SIGNAL_COLOR[signal.level] }}
            title="The highest status among this scenario's live metrics. Thresholds are set in the data worker and described on the Methodology page; it is a reading, not a forecast."
          >
            SIGNAL {signal.label}
          </span>
        </div>
        <p className="readout-in mt-1.5 text-[11px] font-light leading-relaxed text-dim">{signal.basis}</p>
        <p className="readout-in mt-1 text-[11px] font-light leading-relaxed text-dim">{mode.blurb}</p>
        <Link href={mode.page} style={{ "--c": mode.color } as React.CSSProperties} className="btn mono mt-2 inline-block px-2.5 py-1 text-[11px] font-bold">
          {mode.pageLabel} →
        </Link>
      </div>

      <div className="flex shrink-0 border-b border-line" role="tablist" aria-label="Right panel view">
        {tabs.map(([id, label], i) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`btn mono flex-1 border-0 px-2 py-2 text-xs font-bold ${tab === id ? "border-b-2" : ""} ${i > 0 ? "border-l" : ""}`}
            style={{ borderBottomColor: tab === id ? "var(--accent)" : undefined, borderLeftColor: "var(--line)" }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto" role="tabpanel" key={`${mode.id}-${tab}`}>
        {tab === "readout" && (
          <Readout mode={mode} world={world} quakes={quakesFiltered} now={now} selectedId={selectedId} onSelect={select} />
        )}
        {tab === "metrics" && (
          <>
            <CounterPanel counters={orderedCounters} today={today} focusId={mode.counterIds[0] ?? null} />
            <p className="px-3 py-3 text-[11px] font-light leading-relaxed text-dim">
              Tap a metric for its source, date and caveats. &quot;manual&quot; values come from annual publications and are updated by hand.
            </p>
          </>
        )}
        {tab === "links" && <LinksPanel selected={selected} links={links} entities={entities} onSelect={select} />}
      </div>

      <HubCard />
    </>
  );

  return (
    <DashboardLayout
      themeColor={mode.color}
      topBar={<TopBar modes={MODES} activeId={modeId} onSelect={selectMode} world={world} />}
      left={
        <FilterPanel
          mode={mode}
          layersOn={layersOn}
          onToggle={toggleLayer}
          range={range}
          onRange={setRange}
          minMag={minMag}
          onMinMag={setMinMag}
          globe={globe}
          onGlobe={setGlobe}
          showConnections={showConnections}
          onConnections={setShowConnections}
          legend={legend}
        />
      }
      right={right}
      footer={
        <StatusBar
          world={world}
          loadError={loadError}
          now={now}
          liveFeeds={liveFeeds}
          totalFeeds={totalFeeds}
          stale={dataStale}
          failed={failedFeeds}
          summary={mapSummary}
        />
      }
      map={
        <MapView
          data={mapData}
          entities={entities}
          selectedId={selectedId}
          onSelect={select}
          globe={globe}
          camera={{ ...mode.camera, key: mode.id }}
        />
      }
      mapOverlay={<MapHud color={mode.color} id={mode.id} />}
    />
  );
}
