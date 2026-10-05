"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { arsenals } from "@/lib/arsenals";
import { DOMAINS, DOMAIN_BY_ID } from "@/lib/domains";
import {
  buildEntityIndex,
  dyadLines,
  groupOutbreaks,
  type Entity,
} from "@/lib/entities";
import { ageLabel, isStale, relTime, utcClock } from "@/lib/format";
import { LENSES, LENS_BY_ID } from "@/lib/lenses";
import type {
  ConflictCell,
  ConflictFile,
  DomainId,
  LinksFile,
  MonitorEvent,
  Plant,
  PlantsFile,
  ProfilesFile,
  WorldState,
} from "@/lib/types";
import CounterPanel from "./CounterPanel";
import LinksPanel, { linksFor } from "./LinksPanel";
import MapView, { type MapData } from "./MapView";
import { PagesMenu } from "./SiteNav";
import DashboardLayout from "./dashboard/DashboardLayout";
import FilterPanel from "./dashboard/FilterPanel";
import HubCard from "./dashboard/HubCard";
import ScenarioCard from "./dashboard/ScenarioCard";

type Range = "24h" | "7d";
type Tab = "metrics" | "events" | "links";
const RANGE_MS: Record<Range, number> = { "24h": 86_400_000, "7d": 7 * 86_400_000 };
const REFRESH_MS = 5 * 60_000;
const LIVE_LAYERS = DOMAINS.filter((d) => d.live).map((d) => d.id);
const MAX_CONNECTION_LINES = 40;

function readUrl() {
  const p = new URLSearchParams(window.location.search);
  const layers = (p.get("layers") ?? "geophysical")
    .split(",")
    .filter((l): l is DomainId => LIVE_LAYERS.includes(l as DomainId));
  const tab = p.get("tab");
  return {
    range: (p.get("range") === "24h" ? "24h" : "7d") as Range,
    minMag: p.get("mag") === "4.5" ? 4.5 : 5,
    globe: p.get("view") === "3d",
    layers,
    tab: (tab === "events" || tab === "links" ? tab : "metrics") as Tab,
    selected: p.get("sel"),
    lens: p.get("sc"),
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
  const [range, setRange] = useState<Range>("7d");
  const [minMag, setMinMag] = useState<number>(5);
  const [globe, setGlobe] = useState(false);
  const [tab, setTab] = useState<Tab>("metrics");
  const [enabled, setEnabled] = useState<Set<DomainId>>(new Set(["geophysical"]));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showConnections, setShowConnections] = useState(true);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [cells, setCells] = useState<ConflictCell[]>([]);
  const [links, setLinks] = useState<LinksFile | null>(null);
  const [profiles, setProfiles] = useState<ProfilesFile | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [lens, setLens] = useState<string | null>(null);

  // URL state (shareable views), read once after mount. Done in an effect on purpose:
  // the static HTML is rendered without a query string, so reading it during render
  // would cause a hydration mismatch.
  useEffect(() => {
    const u = readUrl();
    /* eslint-disable react-hooks/set-state-in-effect */
    setRange(u.range);
    setMinMag(u.minMag);
    setGlobe(u.globe);
    setTab(u.tab);
    setEnabled(new Set(u.layers));
    if (u.selected) setSelectedId(u.selected);
    if (u.lens && LENS_BY_ID[u.lens]) setLens(u.lens);
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);
  useEffect(() => {
    // Do not write until the URL has been read: React StrictMode runs effects twice in dev, and an
    // early write would erase the query string before the second read.
    if (!hydrated) return;
    const p = new URLSearchParams();
    if (range !== "7d") p.set("range", range);
    if (minMag !== 5) p.set("mag", String(minMag));
    if (globe) p.set("view", "3d");
    if (tab !== "metrics") p.set("tab", tab);
    const layers = LIVE_LAYERS.filter((l) => enabled.has(l)).join(",");
    if (layers !== "geophysical") p.set("layers", layers);
    if (selectedId) p.set("sel", selectedId);
    if (lens) p.set("sc", lens);
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [hydrated, range, minMag, globe, tab, enabled, selectedId, lens]);

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
  const nuclearOn = enabled.has("nuclear");
  const conflictOn = enabled.has("conflict");
  useEffect(() => {
    if (!nuclearOn || plants.length > 0) return;
    let cancelled = false;
    getJson<PlantsFile>("/data/nuclear_plants.json")
      .then((f) => !cancelled && setPlants(f.plants))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [nuclearOn, plants.length]);
  useEffect(() => {
    if (!conflictOn || cells.length > 0) return;
    let cancelled = false;
    getJson<ConflictFile>("/data/conflict_cells.json")
      .then((f) => !cancelled && setCells(f.cells))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [conflictOn, cells.length]);

  const nowMs = now ?? 0;
  const today = now ? new Date(now).toISOString().slice(0, 10) : "0000-00-00";

  const quakes = useMemo<MonitorEvent[]>(() => {
    if (!world || now === null || !enabled.has("geophysical")) return [];
    const since = now - RANGE_MS[range];
    return world.events.filter(
      (e) => e.kind === "quake" && (e.magnitude ?? 0) >= minMag && new Date(e.startedAt).getTime() >= since,
    );
  }, [world, now, range, minMag, enabled]);

  const outbreakGroups = useMemo(() => groupOutbreaks(world, profiles), [world, profiles]);
  const dyads = useMemo(() => dyadLines(world, profiles, arsenals.countries), [world, profiles]);
  const allCells = cells;

  const entities = useMemo(
    () =>
      buildEntityIndex({
        world,
        plants,
        arsenals: arsenals.countries,
        cells: allCells,
        links,
        profiles,
        outbreaks: outbreakGroups,
        dyads,
      }),
    [world, plants, allCells, links, profiles, outbreakGroups, dyads],
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

  const mapData = useMemo<MapData>(
    () => ({
      quakes,
      plants: nuclearOn ? plants : [],
      arsenals: nuclearOn ? arsenals.countries : [],
      volcanoes: enabled.has("geophysical") ? (world?.volcanoes ?? []) : [],
      outbreaks: enabled.has("health") ? outbreakGroups : [],
      cells: conflictOn ? cells : [],
      dyads: nuclearOn ? dyads : [],
      connections,
    }),
    [quakes, nuclearOn, plants, enabled, world, outbreakGroups, conflictOn, cells, dyads, connections],
  );

  const stats = useMemo(() => {
    if (!world || now === null) return null;
    const qs = world.events.filter((e) => e.kind === "quake");
    const d1 = qs.filter((e) => (e.magnitude ?? 0) >= 5 && new Date(e.startedAt).getTime() >= now - 86_400_000);
    const strongest = qs.reduce<MonitorEvent | null>(
      (best, e) => (!best || (e.magnitude ?? 0) > (best.magnitude ?? 0) ? e : best),
      null,
    );
    return { m5day: d1.length, strongest };
  }, [world, now]);

  const liveFeeds = world?.feeds.filter((f) => f.ok && !isStale(f.fetchedAt, nowMs)).length ?? 0;
  const totalFeeds = world?.feeds.length ?? 0;
  const dataStale = world ? isStale(world.generatedAt, nowMs) : false;
  const failedFeeds = world?.feeds.filter((f) => !f.ok).map((f) => f.name) ?? [];

  const toggleDomain = (id: DomainId) => {
    setLens(null);
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const select = (id: string | null) => {
    setSelectedId(id);
    if (id) setTab((t) => (t === "metrics" ? "links" : t));
  };

  /** A scenario card is a preset: show its map layers, open its metric, clear the current selection. */
  const selectLens = (id: string) => {
    if (lens === id) {
      setLens(null);
      return;
    }
    const l = LENS_BY_ID[id];
    setLens(id);
    setEnabled(new Set(l.layers));
    setSelectedId(null);
    setTab("metrics");
  };

  const mapSummary = [
    enabled.has("geophysical") ? `${quakes.length} quakes · ${range} · M${minMag}+` : null,
    nuclearOn ? `${plants.length} plants · ${arsenals.countries.length} arsenals · ${dyads.length} pairs` : null,
    enabled.has("health") ? `${outbreakGroups.length} countries with WHO reports` : null,
    conflictOn ? `${cells.length} conflict hotspots (news-based)` : null,
  ]
    .filter(Boolean)
    .join("  |  ");

  const quakeList = quakes;
  const tabs: [Tab, string][] = [
    ["metrics", `Metrics${world ? ` · ${world.counters?.length ?? 0}` : ""}`],
    ["events", `Quakes${enabled.has("geophysical") ? ` · ${quakes.length}` : ""}`],
    ["links", `Links${selected ? " •" : ""}`],
  ];

  const activeLens = lens ? LENS_BY_ID[lens] : null;

  const header = (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2">
      <div className="flex items-baseline gap-2">
        <h1 className="mono text-sm font-bold tracking-[0.2em] text-accent">MONITORING</h1>
        <span className="label hidden sm:inline">global risk board</span>
      </div>
      <div className="mono text-xs font-light text-dim" aria-label="Current UTC time">
        UTC <span className="font-bold text-fg">{now ? utcClock(now) : "--:--:--"}</span>
      </div>
      <div
        className="mono flex items-center gap-2 text-xs font-light"
        title={failedFeeds.length ? `Not updating: ${failedFeeds.join(", ")}` : undefined}
      >
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            !world ? "bg-dim" : dataStale || liveFeeds < totalFeeds ? "bg-geo" : "bg-safe live-dot"
          }`}
          aria-hidden
        />
        <span className="text-dim">
          {world
            ? `${liveFeeds}/${totalFeeds} feeds live${dataStale ? " · stale" : ""}`
            : loadError
              ? "offline"
              : "loading"}
        </span>
      </div>
      <div className="ml-auto flex items-center gap-4">
        <div className="flex" role="group" aria-label="Map projection">
          {(["2D", "3D"] as const).map((v, i) => (
            <button
              key={v}
              type="button"
              aria-pressed={(v === "3D") === globe}
              onClick={() => setGlobe(v === "3D")}
              className={`btn mono px-2.5 py-1 text-xs font-bold ${i > 0 ? "-ml-px" : ""}`}
            >
              {v}
            </button>
          ))}
        </div>
        <PagesMenu />
      </div>
    </div>
  );

  const scenarios = (
    <div>
      <div className="scroll-thin flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Scenario lenses">
        {LENSES.map((l) => (
          <ScenarioCard
            key={l.id}
            title={l.title}
            stat={l.stat(world)}
            color={l.color}
            active={lens === l.id}
            onClick={() => selectLens(l.id)}
          />
        ))}
      </div>
      {activeLens && (
        <div className="panel mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2">
          <p className="min-w-0 flex-1 text-xs font-light leading-relaxed text-dim">{activeLens.blurb}</p>
          <Link
            href={activeLens.page}
            style={{ "--c": activeLens.color } as React.CSSProperties}
            className="btn mono shrink-0 px-2.5 py-1 text-xs font-bold"
          >
            {activeLens.pageLabel} →
          </Link>
        </div>
      )}
    </div>
  );

  const legend = (
    <>
      {nuclearOn && <p><span style={{ color: "var(--threat)" }}>━</span> curves: country pairs; thicker and redder is more tense coverage</p>}
      {conflictOn && <p><span style={{ color: "var(--conflict)" }}>●</span> news-reported armed conflict, last 7 days</p>}
      {enabled.has("health") && <p><span style={{ color: "var(--bio)" }}>◯</span> WHO report (country centre)</p>}
      {enabled.has("geophysical") && <p>◉ supervolcano: white normal, red above baseline, grey no feed</p>}
      <p className="pt-1">Only observations and published figures; nothing here is a forecast.</p>
    </>
  );

  const left = (
    <FilterPanel
      enabled={enabled}
      onToggle={toggleDomain}
      quakeFilters={enabled.has("geophysical")}
      range={range}
      onRange={setRange}
      minMag={minMag}
      onMinMag={setMinMag}
      showConnections={showConnections}
      onConnections={setShowConnections}
      legend={legend}
    />
  );

  const right = (
    <>
      <div className="flex shrink-0 border-b border-line" role="tablist" aria-label="Right panel">
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

      {tab === "metrics" && (
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto" role="tabpanel">
          <CounterPanel counters={world?.counters ?? []} today={today} focusId={activeLens?.counterId ?? null} />
          <p className="px-3 py-3 text-[11px] font-light leading-relaxed text-dim">
            Tap a metric for its source, date and caveats. &quot;manual&quot; values come from annual publications and are
            updated by hand.
          </p>
        </div>
      )}

      {tab === "events" && (
        <div className="flex min-h-0 flex-1 flex-col" role="tabpanel">
          <div className="grid shrink-0 grid-cols-2 gap-px border-b border-line bg-line">
            <div className="bg-panel-solid p-3">
              <p className="label">M5+ · 24h</p>
              <p className="mono mt-1 text-2xl font-bold text-geo">{stats ? stats.m5day : "–"}</p>
            </div>
            <div className="bg-panel-solid p-3">
              <p className="label">Strongest · 7d</p>
              <p className="mono mt-1 text-2xl font-bold text-geo">
                {stats?.strongest ? `M${stats.strongest.magnitude?.toFixed(1)}` : "–"}
              </p>
            </div>
            <div className="col-span-2 bg-panel-solid px-3 py-2">
              <p className="mono text-[11px] font-light text-dim">
                Source: USGS · data age {world && now ? ageLabel(world.generatedAt, now) : "–"}
              </p>
            </div>
          </div>
          <ul className="scroll-thin min-h-0 flex-1 divide-y divide-line overflow-y-auto">
            {quakeList.slice(0, 80).map((e) => {
              const dom = DOMAIN_BY_ID[e.domain];
              const active = e.id === selectedId;
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => select(e.id)}
                    aria-current={active}
                    className={`flex w-full items-start gap-3 px-3 py-2 text-left hover:bg-accent/10 ${active ? "bg-accent/15" : ""}`}
                  >
                    <span
                      className="mono mt-0.5 w-11 shrink-0 border px-1 py-0.5 text-center text-xs font-bold"
                      style={{ borderColor: dom.color, color: dom.color }}
                    >
                      {e.magnitude?.toFixed(1)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-bold">{e.title.replace(/^M [\d.]+ - /, "")}</span>
                      <span className="mono text-[11px] font-light text-dim">
                        {now ? relTime(e.startedAt, now) : ""} · {Math.round(e.depthKm ?? 0)} km deep
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
            {world && quakeList.length === 0 && (
              <li className="px-3 py-6 text-center text-xs text-dim">
                {enabled.has("geophysical") ? "No quakes match these filters." : "Turn on the Geophysical layer to list quakes."}
              </li>
            )}
          </ul>
        </div>
      )}

      {tab === "links" && <LinksPanel selected={selected} links={links} entities={entities} onSelect={select} />}

      <HubCard />
    </>
  );

  return (
    <DashboardLayout
      header={header}
      scenarios={scenarios}
      left={left}
      right={right}
      map={<MapView data={mapData} entities={entities} selectedId={selectedId} onSelect={select} globe={globe} />}
      mapOverlay={
        <>
          {mapSummary && (
            <div className="mono pointer-events-none absolute bottom-3 left-3 max-w-[70%] border border-line bg-panel-solid px-2 py-1 text-[11px] font-light text-dim lg:left-[270px] lg:max-w-[calc(100%-660px)]">
              {mapSummary}
            </div>
          )}
          {loadError && !world && (
            <div className="panel absolute left-1/2 top-4 -translate-x-1/2 px-3 py-2 text-xs text-threat">
              Could not load world_state.json ({loadError}). Run <code className="mono">npm run data</code>.
            </div>
          )}
        </>
      }
    />
  );
}
