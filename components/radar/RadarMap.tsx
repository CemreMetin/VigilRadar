"use client";

import { useEffect, useRef } from "react";
import type { GeoJSONSource, Map as MlMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { EN } from "@/core/content/en";
import { TR } from "@/core/content/tr";
import { UI } from "@/core/content/ui";
import { TIER_NAMES } from "@/core/laplace/copy";
import type { SimulationResult } from "@/core/laplace/types";
import type { State } from "@/core/types";
import type { Lang } from "@/lib/lang";
import { assetFeatures, chokepointPoints, chronicRings, conflictPoints, linkArcs, quakeFeatures, selectionPoint } from "@/lib/radar/geojson";
import { registerMapGlyphs } from "@/lib/radar/glyphs";
import { TIER_FILL, arcFeatures, fillExpression, graticuleFeatures, gridFeatures, landingFeatures, shockPoint, straitFeatures, volcanoFeatures } from "@/lib/radar/laplaceGeo";
import { chokepointKey } from "@/lib/radar/triage";
import { loadWorld } from "@/lib/radar/world";
import { COLOR, MAP } from "@/lib/palette";

export type Selection = { kind: "quake" | "plant" | "chokepoint" | "conflict"; id: string };
/** What the SIMULATE mode draws: the result and the map name of the selected country. */
export interface SimView { result: SimulationResult; selected: string | null }
interface Props {
  state: State | null;
  nowMs: number;
  sim: SimView | null; // null: LIVE mode
  lang: Lang;
  label: string;
  onSelect: (s: Selection | null) => void;
  onCountry: (mapName: string | null) => void; // null: a click on open sea
  selected: Selection | null; // LIVE: ringed on the map, and the camera moves to it once
}

const WORLD_BOUNDS: [[number, number], [number, number]] = [[-168, -56], [174, 72]];

const INTERACTIVE_LIVE = ["quakes", "plants", "chokepoints", "conflicts"];
const KIND: Record<string, Selection["kind"]> = { quakes: "quake", plants: "plant", chokepoints: "chokepoint", conflicts: "conflict" };
const LIVE_LAYERS = ["arcs-shadow", "arcs", "rings", "conflicts", "chokepoints", "plants", "quake-aura", "quake-ring", "quakes", "live-selected"];
const SIM_ALWAYS = ["world-selected-line", "sim-arcs-shadow", "sim-arcs-solid", "sim-arcs-dashed", "sim-landings", "sim-center"];
const EMPTY = { type: "FeatureCollection", features: [] } as const;
const GROW_MS = 900; // the arcs spread from the shock once when a shock is chosen
const PULSE_MS = 1800;
const FOCUS_ZOOM = 4.2;
// 20 % above the base instrument sizes, so the points read at world zoom
const quakeRadius = (mag: number) => 4.8 + (21.6 * (2 ** Math.min(3, Math.max(0, mag - 5)) - 1)) / 7; // the curve below, in JS
const quakeCircle = (extra: number) => ["+", ["interpolate", ["exponential", 2], ["get", "mag"], 5, 4.8, 8, 26.4], extra] as never;
const QUAKE_COLOR = ["step", ["get", "mag"], MAP.stone, 5.5, MAP.gold, 6.5, MAP.hot] as never;

/** MapLibre without a tile or glyph server: Taktil Minimalizm palette, 30° graticule, and @2x procedural instrument glyphs. */
export default function RadarMap(props: Props) {
  const { state, nowMs, sim, lang, label, selected } = props;
  const el = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const readyRef = useRef(false);
  const markers = useRef<Marker[]>([]);
  const latest = useRef(props);
  const drawLive = useRef<() => void>(() => {});
  const drawSim = useRef<() => void>(() => {});

  const resetView = () => {
    const map = mapRef.current;
    if (!map || !el.current) return;
    const narrow = el.current.clientWidth < 700;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    map.fitBounds(WORLD_BOUNDS, { padding: narrow ? 8 : 16, duration: reduced ? 0 : 600 });
  };

  useEffect(() => {
    let disposed = false;
    let raf = 0; // 0: no animation frame is pending
    const world = loadWorld(); // started before the map library arrives
    world.catch(() => {});
    import("maplibre-gl").then((ml) => {
      if (disposed || !el.current) return;
      ml.setWorkerUrl("/vendor/maplibre-gl-worker.mjs");
      const narrow = el.current.clientWidth < 700;
      const map = new ml.Map({
        container: el.current,
        style: {
          version: 8,
          sources: {
            graticule: { type: "geojson", data: graticuleFeatures() as never },
            world: { type: "geojson", data: EMPTY as never },
          },
          layers: [
            { id: "bg", type: "background", paint: { "background-color": COLOR.bg } },
            {
              id: "graticule", type: "line", source: "graticule",
              paint: { "line-color": COLOR.fg, "line-width": ["case", ["get", "major"], 0.9, 0.5], "line-opacity": ["case", ["get", "major"], 0.08, 0.04] },
            },
            { id: "world-fill", type: "fill", source: "world", paint: { "fill-color": TIER_FILL.none } },
            { id: "world-line", type: "line", source: "world", paint: { "line-color": MAP.coast, "line-width": 1 } },
          ],
        },
        center: [15, 25],
        zoom: narrow ? 0.4 : 1.3,
        minZoom: narrow ? 0.35 : 0.75,
        maxZoom: 9,
        renderWorldCopies: false, // one flat world: no second pair of Americas
        // just inside ±180: MapLibre 6 reads an exact -180..180 as a zero-width range and the map goes blank
        maxBounds: [[-179.999, -76], [179.999, 82]],
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
      });
      map.touchZoomRotate.disableRotation();
      mapRef.current = map;

      map.on("load", () => {
        registerMapGlyphs(map);
        map.fitBounds([[-168, -56], [174, 72]], { padding: narrow ? 8 : 16, duration: 0 });
        const set = (id: string, data: unknown) => (map.getSource(id) as GeoJSONSource | undefined)?.setData(data as never);
        const show = (id: string, on: boolean) => { if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", on ? "visible" : "none"); };
        world.then((w) => { if (!disposed) set("world", w); }, () => { /* no outlines; the lists beside the map still work */ });

        for (const id of ["quakes", "plants", "chokepoints", "conflicts", "arcs", "rings", "halo", "live-selected", "sim-arcs", "sim-landings", "sim-straits", "sim-volcanoes", "sim-grid", "sim-center"])
          map.addSource(id, { type: "geojson", data: EMPTY as never });

        // ---- LIVE layers: tactile precision cartography ----
        map.addLayer({ id: "arcs-shadow", type: "line", source: "arcs", paint: { "line-color": COLOR.bg, "line-width": 4, "line-opacity": 0.45 } });
        map.addLayer({ id: "arcs", type: "line", source: "arcs", paint: { "line-color": COLOR.geo, "line-width": 1.3, "line-dasharray": [2.5, 2], "line-opacity": ["case", ["get", "chronic"], 0.4, 0.92] } });
        map.addLayer({ id: "rings", type: "line", source: "rings", paint: { "line-color": COLOR.stone, "line-width": 1, "line-dasharray": [2, 2], "line-opacity": 0.55 } });
        map.addLayer({
          id: "conflicts", type: "symbol", source: "conflicts",
          layout: { "icon-image": ["get", "icon"], "icon-allow-overlap": true, "icon-ignore-placement": true, "icon-size": 1.2 },
        });
        map.addLayer({
          id: "chokepoints", type: "symbol", source: "chokepoints",
          layout: { "icon-image": ["get", "icon"], "icon-allow-overlap": true, "icon-ignore-placement": true, "icon-size": 1.2 },
          paint: { "icon-opacity": ["match", ["get", "state"], "idle", 0.78, 1] },
        });
        map.addLayer({
          id: "plants", type: "symbol", source: "plants",
          layout: {
            "icon-image": ["match", ["get", "state"], "active", "plant-active", "chronic", "plant-chronic", "plant-idle"],
            "icon-allow-overlap": true, "icon-ignore-placement": true,
            "icon-size": ["match", ["get", "state"], "idle", 0.86, 1.26],
          },
          paint: { "icon-opacity": ["match", ["get", "state"], "idle", 0.78, 1] },
        });

        // ---- SIMULATE layers: warm choropleth, context infra, dual-pass domino arcs, Braun reticle ----
        map.addLayer({ id: "world-selected-line", type: "line", source: "world", filter: ["==", ["get", "name"], ""], paint: { "line-color": MAP.cream, "line-width": 2.2 } });
        map.addLayer({ id: "sim-grid", type: "line", source: "sim-grid", paint: { "line-color": COLOR.space, "line-width": 1.2, "line-dasharray": [4, 4], "line-opacity": 0.65 } });
        map.addLayer({ id: "sim-arcs-shadow", type: "line", source: "sim-arcs", layout: { "line-cap": "round" }, paint: { "line-color": COLOR.bg, "line-width": ["+", ["get", "width"], 3.5], "line-opacity": 0.32 } });
        map.addLayer({ id: "sim-arcs-solid", type: "line", source: "sim-arcs", filter: ["==", ["get", "order"], 1], layout: { "line-cap": "round" }, paint: { "line-color": ["get", "color"], "line-width": ["get", "width"], "line-opacity": 0.94 } });
        map.addLayer({ id: "sim-arcs-dashed", type: "line", source: "sim-arcs", filter: ["!=", ["get", "order"], 1], layout: { "line-cap": "round" }, paint: { "line-color": ["get", "color"], "line-width": ["get", "width"], "line-dasharray": [3, 2.2], "line-opacity": 0.85 } });
        map.addLayer({
          id: "sim-straits", type: "symbol", source: "sim-straits",
          layout: { "icon-image": ["get", "icon"], "icon-allow-overlap": true, "icon-ignore-placement": true, "icon-size": ["case", ["get", "active"], 1.15, 0.85] },
        });
        map.addLayer({
          id: "sim-volcanoes", type: "symbol", source: "sim-volcanoes",
          layout: { "icon-image": "volcano", "icon-allow-overlap": true, "icon-ignore-placement": true },
        });
        map.addLayer({
          id: "sim-landings", type: "symbol", source: "sim-landings",
          layout: { "icon-image": "landing", "icon-allow-overlap": true, "icon-ignore-placement": true, "icon-size": ["case", ["==", ["get", "order"], 1], 1, 0.8] },
        });
        map.addLayer({
          id: "sim-center", type: "symbol", source: "sim-center",
          layout: { "icon-image": "shock", "icon-allow-overlap": true, "icon-ignore-placement": true },
        });

        // ---- Shared expanding telemetry ring + multi-layer seismic epicentres ----
        map.addLayer({ id: "halo", type: "circle", source: "halo", paint: { "circle-radius": 10, "circle-color": "rgba(0,0,0,0)", "circle-stroke-color": COLOR.accent, "circle-stroke-width": 1.3, "circle-stroke-opacity": 0.55 } });
        map.addLayer({
          id: "quake-aura", type: "circle", source: "quakes",
          paint: {
            "circle-radius": quakeCircle(5),
            "circle-color": QUAKE_COLOR,
            "circle-opacity": ["*", ["get", "op"], 0.16],
          },
        });
        map.addLayer({
          // the last 24 hours, and every M6.5+
          id: "quake-ring", type: "circle", source: "quakes", filter: ["any", ["get", "recent"], [">=", ["get", "mag"], 6.5]],
          paint: {
            "circle-radius": quakeCircle(4),
            "circle-color": "rgba(0,0,0,0)",
            "circle-stroke-color": MAP.cream,
            "circle-stroke-width": 1.4,
            "circle-stroke-opacity": 0.85,
          },
        });
        map.addLayer({
          id: "quakes", type: "circle", source: "quakes",
          paint: {
            "circle-radius": quakeCircle(0),
            "circle-color": QUAKE_COLOR,
            "circle-opacity": ["get", "op"],
            "circle-stroke-color": COLOR.bg,
            "circle-stroke-width": 1.2,
            "circle-stroke-opacity": ["get", "op"],
          },
        });

        map.addLayer({
          id: "live-selected", type: "circle", source: "live-selected",
          paint: { "circle-radius": ["get", "radius"], "circle-color": "rgba(0,0,0,0)", "circle-stroke-color": MAP.cream, "circle-stroke-width": 2.2 },
        });

        for (const id of [...INTERACTIVE_LIVE, "world-fill"]) {
          const wanted = () => (id === "world-fill") === !!latest.current.sim;
          map.on("mouseenter", id, () => { if (wanted()) map.getCanvas().style.cursor = "pointer"; });
          map.on("mouseleave", id, () => { if (wanted()) map.getCanvas().style.cursor = ""; });
        }

        const hideTip = () => {
          const tip = tipRef.current;
          if (tip) tip.style.opacity = "0";
        };
        const showTip = (text: string, x: number, y: number) => {
          const tip = tipRef.current;
          const box = el.current;
          if (!tip || !box) return;
          tip.textContent = text;
          const maxX = Math.max(8, box.clientWidth - tip.offsetWidth - 10);
          const tx = Math.min(maxX, Math.max(8, x + 12));
          const ty = y > 44 ? y - 34 : y + 16;
          tip.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
          tip.style.opacity = "1";
        };
        map.on("dragstart", hideTip);
        map.on("mouseout", hideTip);
        map.on("mousemove", (e) => {
          const { sim: view, state: s, lang: lg } = latest.current;
          const ui = UI[lg];
          const notes = lg === "tr" ? TR.chokepointNotes : EN.chokepointNotes;
          if (view) {
            const { x, y } = e.point;
            const infraLayers = ["sim-straits", "sim-volcanoes"].filter((id) => map.getLayer(id) && map.getLayoutProperty(id, "visibility") !== "none");
            const pin = infraLayers.length ? map.queryRenderedFeatures([[x - 8, y - 8], [x + 8, y + 8]], { layers: infraLayers })[0] : undefined;
            if (pin?.properties?.name) {
              const rawName = String(pin.properties.name);
              const k = chokepointKey(rawName);
              showTip(k ? notes[k].name : rawName, x, y);
              return;
            }
            const country = map.queryRenderedFeatures(e.point, { layers: ["world-fill"] })[0];
            if (!country) { hideTip(); return; }
            const hit = view.result.byMapName[String(country.properties?.name)];
            if (!hit) { hideTip(); return; }
            showTip(`${hit.name[lg]} · ${hit.total}/100 · ${TIER_NAMES[hit.tier][lg]}`, x, y);
            return;
          }
          const { x, y } = e.point;
          const hit = map.queryRenderedFeatures([[x - 6, y - 6], [x + 6, y + 6]], { layers: INTERACTIVE_LIVE })[0];
          if (!hit) { hideTip(); return; }
          const kind = KIND[hit.layer.id];
          const id = String(hit.properties?.id ?? "");
          if (kind === "quake") {
            showTip(`M${hit.properties?.mag} · ${hit.properties?.place}`, x, y);
          } else if (kind === "chokepoint") {
            const cp = s?.chokepoints.find((c) => c.id === id);
            const raw = String(hit.properties?.name ?? cp?.name ?? "");
            const k = chokepointKey(raw);
            const title = k ? notes[k].name : raw;
            const status = !cp || cp.level === "stale" ? ui.flowOld : cp.level === "severe" ? ui.flowSevere : cp.level === "deviation" ? ui.flowDeviation : ui.flowNormal;
            const count = cp && cp.recent !== null && cp.level !== "stale" ? ` · ${Math.round(cp.recent)}/${ui.day}` : "";
            showTip(`${title}${count} · ${status}`, x, y);
          } else if (kind === "plant") {
            showTip(`${hit.properties?.name} · ${ui.plant}`, x, y);
          } else {
            const c = s?.conflicts.find((k) => k.id === id);
            showTip(c ? `${c.label} · ${c.events} ${ui.events}` : ui.conflict, x, y);
          }
        });

        map.on("click", (e) => {
          hideTip();
          if (latest.current.sim) {
            const country = map.queryRenderedFeatures(e.point, { layers: ["world-fill"] })[0];
            latest.current.onCountry(country ? String(country.properties?.name) : null);
            return;
          }
          const { x, y } = e.point; // a 16 px tap box for comfortable mobile touches
          const hit = map.queryRenderedFeatures([[x - 8, y - 8], [x + 8, y + 8]], { layers: INTERACTIVE_LIVE })[0];
          latest.current.onSelect(hit ? { kind: KIND[hit.layer.id], id: String(hit.properties?.id) } : null);
        });

        // One loop for the ring and the arc growth. It runs only while one of them moves; an idle map schedules no frames.
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        let ring = false;
        let growFrom: number | null = null;
        const frame = (t: number) => {
          raf = 0;
          const view = latest.current.sim;
          if (growFrom !== null && view) {
            const p = Math.min(1, Math.max(0, (t - growFrom) / GROW_MS));
            set("sim-arcs", arcFeatures(view.result, p));
            if (p === 1) growFrom = null;
          }
          if (ring) {
            const f = (t % PULSE_MS) / PULSE_MS;
            map.setPaintProperty("halo", "circle-radius", 8 + 14 * f);
            map.setPaintProperty("halo", "circle-stroke-opacity", 0.65 * (1 - f));
          }
          animate();
        };
        const animate = () => {
          if (!reduced && (ring || growFrom !== null)) { raf ||= requestAnimationFrame(frame); return; }
          cancelAnimationFrame(raf);
          raf = 0;
        };
        const halo = (data: unknown, on: boolean) => {
          set("halo", data);
          ring = on;
          if (reduced && on) { map.setPaintProperty("halo", "circle-radius", 12); map.setPaintProperty("halo", "circle-stroke-opacity", 0.55); }
          animate();
        };

        let flownTo: string | null = null; // the 30 s redraws must not pull the camera back
        drawLive.current = () => {
          const { state: s, nowMs: now, sim: view, selected: sel } = latest.current;
          for (const id of LIVE_LAYERS) show(id, !view);
          markers.current.forEach((m) => m.remove());
          markers.current = [];
          if (view) { flownTo = null; return; } // the two modes never overlap
          const at = s && sel ? selectionPoint(s, sel) : null;
          const mag = sel?.kind === "quake" ? s?.quakes.find((q) => q.id === sel.id)?.best.mag : undefined;
          const radius = mag === undefined ? 16 : quakeRadius(mag) + 8;
          set("live-selected", at ? { type: "FeatureCollection", features: [{ type: "Feature", properties: { radius }, geometry: { type: "Point", coordinates: at } }] } : EMPTY);
          if (!sel) flownTo = null;
          else if (at && flownTo !== sel.id) {
            flownTo = sel.id;
            map.flyTo({ center: at, zoom: Math.max(map.getZoom(), FOCUS_ZOOM), duration: reduced ? 0 : 900 });
          }
          const assets = s === null ? null : assetFeatures(s);
          set("quakes", s ? quakeFeatures(s, now) : EMPTY);
          set("plants", assets?.plants ?? EMPTY);
          set("chokepoints", s ? chokepointPoints(s) : EMPTY);
          set("conflicts", s ? conflictPoints(s) : EMPTY);
          set("arcs", s ? linkArcs(s) : EMPTY);
          set("rings", s ? chronicRings(s) : EMPTY);
          const active = (assets?.marked ?? []).filter((f) => f.properties.state === "active" && f.geometry.type === "Point");
          halo({ type: "FeatureCollection", features: active }, active.length > 0);
          // text labels only for active or chronic assets, as HTML markers (no glyph server)
          markers.current = (assets?.marked ?? []).filter((f) => f.geometry.type === "Point").map((f) => {
            const div = document.createElement("div");
            div.className = "mono pointer-events-none rounded bg-bg/85 px-1 text-label uppercase text-fg";
            div.textContent = String(f.properties.name);
            return new ml.Marker({ element: div, anchor: "left", offset: [10, 0] }).setLngLat((f.geometry as { coordinates: [number, number] }).coordinates).addTo(map);
          });
        };

        let shownShock: string | null = null;
        let cables = false;
        const loadCables = () => {
          if (cables) return;
          cables = true;
          fetch("/data/cables.json").then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status))))).then((data) => {
            if (disposed) return;
            map.addSource("sim-cables", { type: "geojson", data });
            map.addLayer({ id: "sim-cables", type: "line", source: "sim-cables", paint: { "line-color": MAP.steel, "line-width": 1, "line-opacity": 0.48 } }, "sim-arcs-shadow");
            show("sim-cables", latest.current.sim?.result.shock.infra === "cables");
          }, () => { cables = false; });
        };

        drawSim.current = () => {
          const view = latest.current.sim;
          const infra = view?.result.shock.infra;
          for (const id of SIM_ALWAYS) show(id, !!view);
          show("sim-straits", infra === "chokepoint");
          show("sim-volcanoes", infra === "volcano");
          show("sim-grid", infra === "grid");
          show("sim-cables", infra === "cables");
          map.setPaintProperty("world-line", "line-color", view ? MAP.coastSim : MAP.coast);
          if (!view) {
            map.setPaintProperty("world-fill", "fill-color", TIER_FILL.none);
            shownShock = null; // the halo now belongs to drawLive, which ran first on this switch
            growFrom = null;
            return;
          }
          const { result, selected } = view;
          map.setPaintProperty("world-fill", "fill-color", fillExpression(result) as never);
          map.setFilter("world-selected-line", ["==", ["get", "name"], selected ?? ""]);
          set("sim-landings", landingFeatures(result));
          if (shownShock !== result.shock.id) {
            shownShock = result.shock.id;
            if (infra === "cables") loadCables();
            if (infra === "chokepoint") set("sim-straits", straitFeatures(result.shock));
            if (infra === "volcano") set("sim-volcanoes", volcanoFeatures());
            if (infra === "grid") set("sim-grid", gridFeatures());
            set("sim-center", shockPoint(result.shock));
            growFrom = reduced ? null : performance.now();
            halo(shockPoint(result.shock), true);
            // lean towards the shock, but stay clear of the dateline edge of the single world
            const lon = Math.max(-55, Math.min(55, result.shock.lon * 0.45));
            map.easeTo({ center: [lon, 20], zoom: map.getContainer().clientWidth < 700 ? 0.55 : 1.15, duration: reduced ? 0 : 900 });
          }
          if (growFrom === null) set("sim-arcs", arcFeatures(result));
          animate();
        };

        readyRef.current = true;
        drawLive.current();
        drawSim.current();
      });
    });
    return () => { disposed = true; cancelAnimationFrame(raf); markers.current.forEach((m) => m.remove()); mapRef.current?.remove(); mapRef.current = null; readyRef.current = false; };
  }, []);

  useEffect(() => { latest.current = props; });
  const live = sim === null;
  // each effect redraws only when its own data changes: the 30 s clock and the sliders never rebuild the other mode
  useEffect(() => { if (readyRef.current) drawLive.current(); }, [state, nowMs, live, selected]);
  useEffect(() => { if (readyRef.current) drawSim.current(); }, [sim]);

  const ui = UI[lang];
  // maplibre-gl.css makes its container position:relative, so the sizing wrapper is a separate element
  return (
    <div lang={lang} className="absolute inset-0">
      <div ref={el} className="h-full w-full" role="img" aria-label={label} />
      <div
        ref={tipRef}
        aria-hidden
        style={{ opacity: 0, transition: "opacity 120ms ease" }}
        className="mono pointer-events-none absolute left-0 top-0 z-20 whitespace-nowrap rounded-lg border border-line-strong bg-panel-solid/95 px-2.5 py-1 text-label text-fg shadow-card"
      />
      <button
        type="button"
        onClick={resetView}
        title={ui.resetView}
        aria-label={ui.resetView}
        className="btn mono absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-read text-fg shadow-card"
      >
        <span aria-hidden>⌖</span>
      </button>
      {live && (
        <ul aria-hidden className="mono pointer-events-none absolute bottom-2.5 left-2.5 z-10 hidden items-center gap-3 rounded-lg border border-line bg-panel-solid/95 px-2.5 py-1 text-label text-dim shadow-card sm:flex">
          <li className="flex items-center gap-1"><span style={{ color: MAP.gold }}>●</span>{ui.legQuake}</li>
          <li className="flex items-center gap-1"><span style={{ color: MAP.steel }}>◈</span>{ui.legNuclear}</li>
          <li className="flex items-center gap-1"><span style={{ color: MAP.cream }}>][</span>{ui.legStrait}</li>
          <li className="flex items-center gap-1"><span style={{ color: MAP.hot }}>⌜⌝</span>{ui.legConflict}</li>
        </ul>
      )}
    </div>
  );
}
