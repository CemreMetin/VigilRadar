"use client";

import { useEffect, useRef } from "react";
import type { GeoJSONSource, Map as MlMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { SimulationResult } from "@/core/laplace/types";
import type { State } from "@/core/types";
import { assetFeatures, chronicRings, conflictBoxes, linkArcs, quakeFeatures } from "@/lib/radar/geojson";
import { TIER_FILL, arcFeatures, fillExpression, gridFeatures, shockPoint, straitFeatures, volcanoFeatures } from "@/lib/radar/laplaceGeo";
import { loadWorld } from "@/lib/radar/world";
import { COLOR } from "@/lib/palette";

export type Selection = { kind: "quake" | "plant" | "chokepoint" | "conflict"; id: string };
/** What the SIMULATE mode draws: the result and the map name of the selected country. */
export interface SimView { result: SimulationResult; selected: string }
interface Props {
  state: State | null;
  nowMs: number;
  sim: SimView | null; // null: LIVE mode
  label: string;
  onSelect: (s: Selection) => void;
  onCountry: (mapName: string) => void;
  focus?: { center: [number, number]; zoom: number };
}

const LINE = "#1f2a33";
const QUAKE_LAYERS = ["quakes", "plants", "chokepoints", "conflicts"];
const KIND: Record<string, Selection["kind"]> = { quakes: "quake", plants: "plant", chokepoints: "chokepoint", conflicts: "conflict" };
const LIVE_LAYERS = ["arcs", "rings", "conflicts", "chokepoints", "plants", "quake-ring", "quakes"];
const EMPTY = { type: "FeatureCollection", features: [] } as const;
const GROW_MS = 900; // the arcs spread from the shock once when a shock is chosen
const PULSE_MS = 1600;

/** MapLibre without a tile or glyph server: a background, the country outlines from world.json and our own layers. No text layers. */
export default function RadarMap(props: Props) {
  const { state, nowMs, sim, label, focus } = props;
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const readyRef = useRef(false);
  const markers = useRef<Marker[]>([]);
  const latest = useRef(props);
  const drawLive = useRef<() => void>(() => {});
  const drawSim = useRef<() => void>(() => {});

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
          sources: { world: { type: "geojson", data: EMPTY as never } },
          layers: [
            { id: "bg", type: "background", paint: { "background-color": COLOR.bg } },
            { id: "world-fill", type: "fill", source: "world", paint: { "fill-color": TIER_FILL.none } },
            { id: "world-line", type: "line", source: "world", paint: { "line-color": LINE, "line-width": 1 } },
          ],
        },
        center: latest.current.focus?.center ?? [15, 25],
        zoom: latest.current.focus?.zoom ?? (narrow ? 0.4 : 1.3),
        minZoom: 0.3,
        maxZoom: 9,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
      });
      map.touchZoomRotate.disableRotation();
      mapRef.current = map;

      map.on("load", () => {
        const set = (id: string, data: unknown) => (map.getSource(id) as GeoJSONSource | undefined)?.setData(data as never);
        const show = (id: string, on: boolean) => { if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", on ? "visible" : "none"); };
        world.then((w) => { if (!disposed) set("world", w); }, () => { /* no outlines; the lists beside the map still work */ });

        for (const id of ["quakes", "plants", "chokepoints", "conflicts", "arcs", "rings", "halo", "sim-arcs", "sim-straits", "sim-volcanoes", "sim-grid", "sim-center"])
          map.addSource(id, { type: "geojson", data: EMPTY as never });
        // order: arcs and frames under the points
        map.addLayer({ id: "arcs", type: "line", source: "arcs", paint: { "line-color": COLOR.geo, "line-width": 1, "line-dasharray": [2, 2], "line-opacity": ["case", ["get", "chronic"], 0.35, 0.9] } });
        map.addLayer({ id: "rings", type: "line", source: "rings", paint: { "line-color": COLOR.dim, "line-width": 1, "line-dasharray": [2, 2] } });
        map.addLayer({ id: "conflicts", type: "line", source: "conflicts", paint: { "line-color": COLOR.conflict, "line-width": 1.5 } });
        map.addLayer({
          id: "chokepoints", type: "line", source: "chokepoints",
          paint: { "line-color": ["match", ["get", "state"], "active", COLOR.threat, "chronic", COLOR.geo, COLOR.dim], "line-width": 1.5, "line-opacity": ["match", ["get", "state"], "idle", 0.35, 1] },
        });
        map.addLayer({
          id: "plants", type: "circle", source: "plants",
          paint: {
            "circle-radius": ["match", ["get", "state"], "idle", 2.5, 4.5],
            "circle-color": ["match", ["get", "state"], "active", COLOR.threat, "chronic", COLOR.geo, COLOR.dim],
            "circle-opacity": ["match", ["get", "state"], "idle", 0.35, 1],
          },
        });
        // simulation: selected country, context infrastructure, arcs, the shock itself
        map.addLayer({ id: "world-selected-line", type: "line", source: "world", filter: ["==", ["get", "name"], ""], paint: { "line-color": COLOR.accent, "line-width": 2 } });
        map.addLayer({ id: "sim-grid", type: "line", source: "sim-grid", paint: { "line-color": COLOR.space, "line-width": 1, "line-dasharray": [4, 4], "line-opacity": 0.6 } });
        map.addLayer({ id: "sim-arcs", type: "line", source: "sim-arcs", layout: { "line-cap": "round" }, paint: { "line-color": ["get", "color"], "line-width": ["get", "width"] } });
        map.addLayer({ id: "sim-straits", type: "circle", source: "sim-straits", paint: { "circle-radius": ["case", ["get", "active"], 6, 4], "circle-color": ["case", ["get", "active"], COLOR.accent, COLOR.bg], "circle-stroke-color": COLOR.accent, "circle-stroke-width": 1.5 } });
        map.addLayer({ id: "sim-volcanoes", type: "circle", source: "sim-volcanoes", paint: { "circle-radius": 5, "circle-color": COLOR.bg, "circle-stroke-color": COLOR.geo, "circle-stroke-width": 2 } });
        map.addLayer({ id: "sim-center", type: "circle", source: "sim-center", paint: { "circle-radius": 4, "circle-color": COLOR.threat, "circle-stroke-color": COLOR.fg, "circle-stroke-width": 1 } });
        map.addLayer({ id: "halo", type: "circle", source: "halo", paint: { "circle-radius": 8, "circle-color": "rgba(0,0,0,0)", "circle-stroke-color": COLOR.threat, "circle-stroke-width": 1, "circle-stroke-opacity": 0.5 } });
        map.addLayer({
          id: "quake-ring", type: "circle", source: "quakes", filter: ["get", "recent"],
          paint: { "circle-radius": ["+", ["interpolate", ["exponential", 2], ["get", "mag"], 5, 4, 8, 22], 4], "circle-color": "rgba(0,0,0,0)", "circle-stroke-color": COLOR.geo, "circle-stroke-width": 1, "circle-stroke-opacity": 0.8 },
        });
        map.addLayer({
          id: "quakes", type: "circle", source: "quakes",
          paint: { "circle-radius": ["interpolate", ["exponential", 2], ["get", "mag"], 5, 4, 8, 22], "circle-color": COLOR.geo, "circle-opacity": ["get", "op"], "circle-stroke-color": COLOR.geo, "circle-stroke-width": 1, "circle-stroke-opacity": ["get", "op"] },
        });

        for (const id of [...QUAKE_LAYERS, "world-fill"]) {
          const wanted = () => (id === "world-fill") === !!latest.current.sim;
          map.on("mouseenter", id, () => { if (wanted()) map.getCanvas().style.cursor = "pointer"; });
          map.on("mouseleave", id, () => { if (wanted()) map.getCanvas().style.cursor = ""; });
        }
        map.on("click", (e) => {
          if (latest.current.sim) {
            const country = map.queryRenderedFeatures(e.point, { layers: ["world-fill"] })[0];
            if (country) latest.current.onCountry(String(country.properties?.name));
            return;
          }
          const { x, y } = e.point; // a 12 px box: the chokepoint lines are 1.5 px thin and fingers are not exact
          const hit = map.queryRenderedFeatures([[x - 6, y - 6], [x + 6, y + 6]], { layers: QUAKE_LAYERS })[0];
          if (hit) latest.current.onSelect({ kind: KIND[hit.layer.id], id: String(hit.properties?.id) });
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
            map.setPaintProperty("halo", "circle-radius", 6 + 10 * f);
            map.setPaintProperty("halo", "circle-stroke-opacity", 0.6 * (1 - f));
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
          if (reduced && on) { map.setPaintProperty("halo", "circle-radius", 9); map.setPaintProperty("halo", "circle-stroke-opacity", 0.6); }
          animate();
        };

        drawLive.current = () => {
          const { state: s, nowMs: now, sim: view } = latest.current;
          for (const id of LIVE_LAYERS) show(id, !view);
          markers.current.forEach((m) => m.remove());
          markers.current = [];
          if (view) return; // the two modes never overlap
          const assets = s === null ? null : assetFeatures(s);
          set("quakes", s ? quakeFeatures(s, now) : EMPTY);
          set("plants", assets?.plants ?? EMPTY);
          set("chokepoints", assets?.chokepoints ?? EMPTY);
          set("conflicts", s ? conflictBoxes(s) : EMPTY);
          set("arcs", s ? linkArcs(s) : EMPTY);
          set("rings", s ? chronicRings(s) : EMPTY);
          const active = (assets?.marked ?? []).filter((f) => f.properties.state === "active" && f.geometry.type === "Point");
          halo({ type: "FeatureCollection", features: active }, active.length > 0);
          // text labels only for active or chronic assets, as HTML markers (no glyph server)
          markers.current = (assets?.marked ?? []).filter((f) => f.geometry.type === "Point").map((f) => {
            const div = document.createElement("div");
            div.className = "mono pointer-events-none text-label uppercase text-fg";
            div.textContent = String(f.properties.name);
            return new ml.Marker({ element: div, anchor: "left", offset: [8, 0] }).setLngLat((f.geometry as { coordinates: [number, number] }).coordinates).addTo(map);
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
            map.addLayer({ id: "sim-cables", type: "line", source: "sim-cables", paint: { "line-color": COLOR.accent, "line-width": 1, "line-opacity": 0.38 } }, "sim-arcs");
            show("sim-cables", latest.current.sim?.result.shock.infra === "cables");
          }, () => { cables = false; });
        };

        drawSim.current = () => {
          const view = latest.current.sim;
          const infra = view?.result.shock.infra;
          for (const id of ["world-selected-line", "sim-arcs", "sim-center"]) show(id, !!view);
          show("sim-straits", infra === "chokepoint");
          show("sim-volcanoes", infra === "volcano");
          show("sim-grid", infra === "grid");
          show("sim-cables", infra === "cables");
          if (!view) {
            map.setPaintProperty("world-fill", "fill-color", TIER_FILL.none);
            if (shownShock) { shownShock = null; growFrom = null; halo(EMPTY, false); }
            return;
          }
          const { result, selected } = view;
          map.setPaintProperty("world-fill", "fill-color", fillExpression(result) as never);
          map.setFilter("world-selected-line", ["==", ["get", "name"], selected]);
          if (shownShock !== result.shock.id) {
            shownShock = result.shock.id;
            if (infra === "cables") loadCables();
            if (infra === "chokepoint") set("sim-straits", straitFeatures(result.shock));
            if (infra === "volcano") set("sim-volcanoes", volcanoFeatures());
            if (infra === "grid") set("sim-grid", gridFeatures());
            set("sim-center", shockPoint(result.shock));
            growFrom = reduced ? null : performance.now();
            halo(shockPoint(result.shock), true);
            map.easeTo({ center: [result.shock.lon, 25], zoom: map.getContainer().clientWidth < 700 ? 0.6 : 1.4, duration: reduced ? 0 : 900 });
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
  useEffect(() => { if (readyRef.current) drawLive.current(); }, [state, nowMs, live]);
  useEffect(() => { if (readyRef.current) drawSim.current(); }, [sim]);
  useEffect(() => { if (focus && mapRef.current) mapRef.current.flyTo({ center: focus.center, zoom: focus.zoom, duration: 900 }); }, [focus]);

  // maplibre-gl.css makes its container position:relative, so the sizing wrapper is a separate element
  return (
    <div lang="en" className="absolute inset-0">
      <div ref={el} className="h-full w-full" role="img" aria-label={label} />
    </div>
  );
}
