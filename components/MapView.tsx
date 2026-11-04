"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import type { GeoJSONSource, Map as MlMap, Marker, Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { greatCircle } from "@/lib/arcs";
import { BLAST_RINGS, EXAMPLE_YIELD_KT, circle } from "@/lib/blast";
import { DOMAIN_BY_ID } from "@/lib/domains";
import type { DyadLine, Entity, OutbreakGroup } from "@/lib/entities";
import type { ArsenalCountry, ConflictCell, MonitorEvent, Plant, VolcanoStatus } from "@/lib/types";

// CARTO Dark Matter: free for non-commercial use with attribution (personal project).
const STYLE_URL = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export type MapData = {
  quakes: MonitorEvent[];
  plants: Plant[];
  arsenals: ArsenalCountry[];
  volcanoes: VolcanoStatus[];
  outbreaks: OutbreakGroup[];
  cells: ConflictCell[];
  dyads: DyadLine[];
  /** lines from the selected entity to what it is linked to (Connections) */
  connections: { id: string; from: [number, number]; to: [number, number] }[];
  /** geomagnetic latitude lines and submarine cables (solar scenario) */
  geomag: { type: "FeatureCollection"; features: unknown[] } | null;
  cables: { type: "FeatureCollection"; features: unknown[] } | null;
  /** tide-gauge stations: relative sea-level trend in mm/yr (ice and sea scenario) */
  tide: { type: "FeatureCollection"; features: unknown[] } | null;
  /** military bases (conflict scenario) and catalogued objects in orbit (orbit scenario) */
  bases: { type: "FeatureCollection"; features: unknown[] } | null;
  orbit: { type: "FeatureCollection"; features: unknown[] } | null;
  /** active tropical cyclones (weather scenario) */
  cyclones: { type: "FeatureCollection"; features: unknown[] } | null;
  /** gridded fire detections (weather scenario) */
  fires: { type: "FeatureCollection"; features: unknown[] } | null;
  /** night side of the Earth and the Sun and Moon markers (3D globe, every scenario) */
  night: { type: "FeatureCollection"; features: unknown[] } | null;
  sky: { type: "FeatureCollection"; features: unknown[] } | null;
  /** nuclear scenario: illustrative reference sites */
  targets: { type: "FeatureCollection"; features: unknown[] } | null;
  /** solar scenario: aurora oval nowcast */
  aurora: { type: "FeatureCollection"; features: unknown[] } | null;
  /** bio scenario: air-travel hubs and BSL-4 reference labs */
  hubs: { type: "FeatureCollection"; features: unknown[] } | null;
  labs: { type: "FeatureCollection"; features: unknown[] } | null;
  /** country outlines for the shaded layers, and what to shade them by */
  countries: { type: "FeatureCollection"; features: unknown[] } | null;
  fill: { mode: "reports" | "exposure" | null; values: Record<string, number>; reports: Record<string, { title: string; date: string; url?: string }[]> };
  /** show every submarine cable, not only those crossing the 50 degree geomagnetic band */
  allCables: boolean;
};

/** Imperative controls for the on-map view buttons (bottom right). */
export type MapControls = { getMap: () => MlMap | null; zoomIn: () => void; zoomOut: () => void; reset: () => void; flyTo: (lon: number, lat: number, zoom?: number) => void };

/** Where the camera should go when the scenario changes. `key` identifies the scenario. */
export type Camera = { center: [number, number]; zoom: number; key: string; minZoom?: number };

type Props = {
  data: MapData;
  entities: Map<string, Entity>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  globe: boolean;
  camera?: Camera;
  controlsRef?: MutableRefObject<MapControls | null>;
  /** called whenever the zoom changes (the asteroid plot sizes itself from the real globe radius) */
  onZoom?: (zoom: number) => void;
};

type FC = { type: "FeatureCollection"; features: unknown[] };
const fc = (features: unknown[]): FC => ({ type: "FeatureCollection", features });
const point = (lon: number, lat: number, props: Record<string, unknown>) => ({
  type: "Feature",
  properties: props,
  geometry: { type: "Point", coordinates: [lon, lat] },
});
const arcFeature = (from: [number, number], to: [number, number], props: Record<string, unknown>) => ({
  type: "Feature",
  properties: props,
  geometry: { type: "MultiLineString", coordinates: greatCircle(from, to) },
});

function buildSources(d: MapData): Record<string, FC> {
  return {
    events: fc(d.quakes.map((e) => point(e.lon, e.lat, { id: e.id, mag: e.magnitude ?? 0 }))),
    plants: fc(d.plants.map((p) => point(p.lon, p.lat, { id: `plant:${p.id}`, mw: p.mw }))),
    volcanoes: fc(d.volcanoes.map((v) => point(v.lon, v.lat, { id: `volcano:${v.id}`, level: v.level }))),
    outbreaks: fc(d.outbreaks.map((g) => point(g.lon, g.lat, { id: g.id, count: g.count }))),
    cells: fc(d.cells.map((c) => point(c.lon, c.lat, { id: `cell:${c.lat},${c.lon}`, n: c.n }))),
    dyads: fc(d.dyads.map((x) => arcFeature(x.from, x.to, { id: x.id, tension: x.tension ?? 0 }))),
    connections: fc(d.connections.map((c) => arcFeature(c.from, c.to, { id: c.id }))),
    gm: d.geomag ?? fc([]),
    cables: d.cables ?? fc([]),
    tide: d.tide ?? fc([]),
    bases: d.bases ?? fc([]),
    orbit: d.orbit ?? fc([]),
    cyclones: d.cyclones ?? fc([]),
    fires: d.fires ?? fc([]),
    night: d.night ?? fc([]),
    sky: d.sky ?? fc([]),
    targets: d.targets ?? fc([]),
    aurora: d.aurora ?? fc([]),
    hubs: d.hubs ?? fc([]),
    labs: d.labs ?? fc([]),
    countries: d.countries ?? fc([]),
  };
}

/** Build popup content with DOM nodes (no innerHTML: text comes from external data). */
function popupBox(e: Entity) {
  const box = document.createElement("div");
  box.style.minWidth = "200px";
  const t = document.createElement("div");
  t.style.fontWeight = "600";
  t.textContent = e.title;
  box.append(t);
  for (const line of e.lines) {
    const m = document.createElement("div");
    m.style.cssText = "margin-top:4px;color:#9aa8b3;font-size:11px;line-height:1.4";
    m.textContent = line;
    box.append(m);
  }
  if (e.link) {
    const a = document.createElement("a");
    a.href = e.link.href;
    if (e.link.external) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
    a.style.cssText = "display:inline-block;margin-top:6px;color:#00e5ff;font-size:11px";
    a.textContent = e.link.text;
    box.append(a);
  }
  return box;
}

const TARGET_CATEGORY_LABEL: Record<string, string> = {
  "strategic-forces": "Strategic forces site",
  "weapons-storage": "Weapons storage or production site",
  command: "Command site",
  capital: "National capital",
};

/** Marker shapes for the nuclear reference sites, drawn once on a canvas: diamond, square, triangle, ring. */
const TARGET_SHAPES: Record<string, (c: CanvasRenderingContext2D) => void> = {
  "strategic-forces": (c) => { c.moveTo(14, 2); c.lineTo(26, 14); c.lineTo(14, 26); c.lineTo(2, 14); c.closePath(); },
  "weapons-storage": (c) => { c.rect(4, 4, 20, 20); },
  command: (c) => { c.moveTo(14, 2); c.lineTo(26, 25); c.lineTo(2, 25); c.closePath(); },
  capital: (c) => { c.arc(14, 14, 10, 0, Math.PI * 2); },
};
function shapeImage(draw: (c: CanvasRenderingContext2D) => void): ImageData {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 28;
  const c = cv.getContext("2d")!;
  c.beginPath();
  draw(c);
  c.fillStyle = "rgba(255,0,60,0.85)";
  c.strokeStyle = "#ffffff";
  c.lineWidth = 2.2;
  c.fill();
  c.stroke();
  return c.getImageData(0, 0, 28, 28);
}

const CLICKABLE = [
  "events-core",
  "plants-core",
  "volcanoes-ring",
  "cells-core",
  "dyads",
];

export default function MapView({ data, entities, selectedId, onSelect, globe, camera, controlsRef, onZoom }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const readyRef = useRef(false);
  const popupRef = useRef<Popup | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const applyDataRef = useRef<() => void>(() => {});
  const applyArsenalsRef = useRef<() => void>(() => {});
  const applySelectionRef = useRef<() => void>(() => {});
  const latest = useRef({ data, entities, selectedId, onSelect, globe, camera, onZoom });
  // Keep map callbacks pointed at current props. Declared first so it runs before the
  // other effects in the same commit.
  useEffect(() => {
    latest.current = { data, entities, selectedId, onSelect, globe, camera, onZoom };
  });

  // init once
  useEffect(() => {
    let disposed = false;
    let map: MlMap | null = null;

    import("maplibre-gl").then((ml) => {
      if (disposed || !el.current) return;
      ml.setWorkerUrl("/vendor/maplibre-gl-worker.mjs");
      const narrow = el.current.clientWidth < 700;
      const cam = latest.current.camera;
      map = new ml.Map({
        container: el.current,
        style: STYLE_URL,
        center: cam?.center ?? [15, 20],
        zoom: cam ? (narrow ? Math.max(0.3, cam.zoom - 1.3) : cam.zoom) : narrow ? 0.3 : 1.6,
        minZoom: cam?.minZoom ?? 0.5,
        maxZoom: 9,
        attributionControl: false, // credited in the status bar instead, so the corner stays free for the view controls
        dragRotate: false,
        pitchWithRotate: false,
        canvasContextAttributes: { preserveDrawingBuffer: true }, // so "Print map" can read the pixels
      });
      map.touchZoomRotate.disableRotation();
      mapRef.current = map;
      if (controlsRef) {
        const home = () => {
          const c = latest.current.camera;
          const small = (el.current?.clientWidth ?? 800) < 700;
          return { center: c?.center ?? ([15, 20] as [number, number]), zoom: (c ? (small ? Math.max(0.3, c.zoom - 1.3) : c.zoom) : small ? 0.3 : 1.6) + (latest.current.globe ? 0.7 : 0) };
        };
        controlsRef.current = {
          getMap: () => map ?? null,
          zoomIn: () => map?.zoomIn({ duration: 300 }),
          zoomOut: () => map?.zoomOut({ duration: 300 }),
          reset: () => map?.flyTo({ ...home(), duration: 900 }),
          flyTo: (lon, lat, zoom) => map?.flyTo({ center: [lon, lat], zoom: zoom ?? Math.max(map.getZoom(), 2.5), duration: 900 }),
        };
      }

      map.on("zoom", () => latest.current.onZoom?.(map!.getZoom()));
      map.on("load", () => {
        if (!map) return;
        latest.current.onZoom?.(map.getZoom());
        const src = buildSources(latest.current.data);
        for (const [id, data] of Object.entries(src)) {
          map.addSource(id, {
            type: "geojson",
            data: data as never,
            // bases are drawn as counted clusters below zoom 5 and as single points above it
            ...(id === "bases" ? { cluster: true, clusterRadius: 45, clusterMaxZoom: 4 } : {}),
            ...(id === "countries" ? { promoteId: "iso3" } : {}),
          });
        }
        map.addSource("target-rings", { type: "geojson", data: fc([]) as never });
        // one marker shape per category, so colour is never the only cue
        for (const [name, draw] of Object.entries(TARGET_SHAPES)) map.addImage(`target-${name}`, shapeImage(draw));
        map.addSource("selected", { type: "geojson", data: fc([]) as never });

        // ---- layers, bottom to top
        map.addLayer({
          id: "fill-reports", type: "fill", source: "countries", layout: { visibility: "none" },
          paint: {
            // one hue (the Bio colour), more reports = more opaque
            "fill-color": "#b026ff",
            "fill-opacity": ["interpolate", ["linear"], ["coalesce", ["feature-state", "reports"], 0], 0, 0, 1, 0.2, 3, 0.4, 6, 0.65],
          },
        });
        map.addLayer({
          id: "fill-exposure", type: "fill", source: "countries", layout: { visibility: "none" },
          paint: {
            "fill-color": "#c9d1ff",
            "fill-opacity": ["interpolate", ["linear"], ["coalesce", ["feature-state", "exposure"], 0], 0, 0, 0.05, 0.1, 0.3, 0.28, 0.7, 0.45],
          },
        });
        map.addLayer({
          id: "country-lines", type: "line", source: "countries", layout: { visibility: "none" },
          paint: { "line-color": "#7d8c97", "line-width": 0.5, "line-opacity": 0.6 },
        });
        map.addLayer({
          id: "night-fill", type: "fill", source: "night",
          paint: { "fill-color": "#000000", "fill-opacity": 0.4 },
        });
        map.addLayer({
          id: "aurora-core", type: "circle", source: "aurora",
          paint: {
            "circle-color": "#c9d1ff",
            "circle-opacity": ["interpolate", ["linear"], ["get", "a"], 5, 0.12, 30, 0.45, 80, 0.85],
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 0, 2.2, 4, 6],
          },
        });
        map.addLayer({
          id: "cables-lines", type: "line", source: "cables",
          paint: {
            "line-color": ["case", ["==", ["get", "hi"], 1], "#00e5ff", "#4a6a78"],
            "line-width": ["case", ["==", ["get", "hi"], 1], 1.1, 0.6],
            "line-opacity": 0.75,
          },
        });
        map.addLayer({
          id: "tide-core", type: "circle", source: "tide",
          paint: {
            // mm/yr of sea-level change relative to the land at the gauge: falling = blue, fast rise = red
            "circle-color": ["interpolate", ["linear"], ["get", "trend"], -5, "#4a90ff", 0, "#7d8c97", 3, "#ffb000", 8, "#ff003c"],
            "circle-opacity": 0.85,
            "circle-radius": 3.5,
            "circle-stroke-color": "#050505",
            "circle-stroke-width": 0.6,
          },
        });
        map.addLayer({
          id: "orbit-core", type: "circle", source: "orbit",
          paint: {
            "circle-color": ["match", ["get", "kind"], 1, "#7d8c97", 2, "#ffb000", 3, "#ffffff", "#00e5ff"],
            "circle-radius": ["match", ["get", "kind"], 3, 4, 2, 1.6, 1.4],
            "circle-opacity": ["match", ["get", "kind"], 1, 0.55, 0.9],
          },
        });
        map.addLayer({
          id: "fires-core", type: "circle", source: "fires",
          paint: {
            "circle-color": "#ff6a00",
            "circle-opacity": ["interpolate", ["linear"], ["get", "n"], 1, 0.45, 20, 0.9],
            "circle-radius": ["interpolate", ["linear"], ["get", "n"], 1, 1.6, 20, 4, 200, 8],
          },
        });
        map.addLayer({
          id: "cyclones-core", type: "circle", source: "cyclones",
          paint: {
            // colour by Saffir-Simpson step from sustained wind in knots; size grows with wind
            "circle-color": ["step", ["get", "wind"], "#7fd3ff", 34, "#2fd4b0", 64, "#ffb000", 96, "#ff6a00", 113, "#ff003c"],
            "circle-radius": ["interpolate", ["linear"], ["get", "wind"], 20, 6, 64, 9, 140, 14],
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 1.5,
          },
        });
        map.addLayer({
          id: "bases-cluster", type: "circle", source: "bases", filter: ["has", "point_count"],
          paint: {
            "circle-color": "rgba(255,255,0,0.22)",
            "circle-stroke-color": "#FFFF00",
            "circle-stroke-width": 1.2,
            "circle-radius": ["step", ["get", "point_count"], 11, 25, 15, 100, 20],
          },
        });
        map.addLayer({
          id: "bases-cluster-count", type: "symbol", source: "bases", filter: ["has", "point_count"],
          layout: { "text-field": ["get", "point_count_abbreviated"], "text-font": ["Montserrat Medium", "Open Sans Bold", "Noto Sans Regular"], "text-size": 11 },
          paint: { "text-color": "#FFFF00" },
        });
        map.addLayer({
          id: "bases-core", type: "circle", source: "bases", filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": "#FFFF00",
            "circle-radius": ["match", ["get", "kind"], "naval", 3.5, 3],
            "circle-stroke-color": "#050505",
            "circle-stroke-width": 0.8,
          },
        });
        map.addLayer({
          id: "bases-nuc", type: "circle", source: "bases", filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "nuc"], 1]],
          paint: { "circle-color": "rgba(0,0,0,0)", "circle-radius": 7.5, "circle-stroke-color": "#ff003c", "circle-stroke-width": 1.5 },
        });
        map.addLayer({
          id: "gm-lines", type: "line", source: "gm",
          paint: {
            "line-color": ["match", ["get", "deg"], 60, "#ff003c", "#ffb000"],
            "line-width": 1.8,
            "line-dasharray": [3, 2],
            "line-opacity": 0.9,
          },
        });
        map.addLayer({
          id: "cells-core", type: "circle", source: "cells",
          paint: {
            "circle-color": DOMAIN_BY_ID.conflict.color,
            "circle-opacity": ["interpolate", ["linear"], ["get", "n"], 15, 0.35, 150, 0.8],
            "circle-radius": ["interpolate", ["linear"], ["get", "n"], 15, 2.5, 100, 6, 500, 12],
          },
        });
        map.addLayer({
          id: "dyads", type: "line", source: "dyads",
          layout: { "line-cap": "round" },
          paint: {
            "line-color": ["interpolate", ["linear"], ["get", "tension"], 15, "#ffb000", 45, "#ff6a00", 65, "#ff003c"],
            "line-width": ["interpolate", ["linear"], ["get", "tension"], 10, 1, 40, 2, 70, 4],
            "line-opacity": 0.7,
          },
        });
        map.addLayer({
          id: "connections", type: "line", source: "connections",
          layout: { "line-cap": "round" },
          paint: { "line-color": "#00e5ff", "line-width": 1.8, "line-opacity": 0.95, "line-dasharray": [2, 1.5] },
        });
        map.addLayer({
          id: "plants-core", type: "circle", source: "plants",
          paint: {
            "circle-color": DOMAIN_BY_ID.nuclear.color,
            "circle-opacity": 0.85,
            "circle-radius": ["interpolate", ["linear"], ["get", "mw"], 100, 2.5, 1500, 4, 6000, 7],
            "circle-stroke-color": "#050505",
            "circle-stroke-width": 0.8,
          },
        });
        map.addLayer({
          id: "events-core", type: "circle", source: "events",
          paint: {
            "circle-color": DOMAIN_BY_ID.geophysical.color,
            "circle-opacity": 0.85,
            "circle-radius": ["interpolate", ["linear"], ["get", "mag"], 4.5, 3, 6, 6, 8, 13],
            "circle-stroke-color": "#050505",
            "circle-stroke-width": 1,
          },
        });
        map.addLayer({
          id: "volcanoes-ring", type: "circle", source: "volcanoes",
          paint: {
            "circle-color": "rgba(5,5,5,0.55)",
            "circle-radius": 8,
            "circle-stroke-width": 2.5,
            "circle-stroke-color": [
              "match", ["get", "level"],
              "normal", "#ffffff",
              "elevated", "#ff003c",
              "#7d8c97",
            ],
          },
        });
        map.addLayer({
          id: "volcanoes-dot", type: "circle", source: "volcanoes",
          paint: { "circle-color": DOMAIN_BY_ID.geophysical.color, "circle-radius": 3 },
        });
        map.addLayer({
          id: "hubs-core", type: "circle", source: "hubs",
          paint: {
            "circle-color": "rgba(176,38,255,0.25)",
            "circle-stroke-color": "#b026ff",
            "circle-stroke-width": 1.5,
            "circle-radius": ["interpolate", ["linear"], ["get", "routes"], 100, 4, 600, 9, 1200, 14],
          },
        });
        map.addLayer({
          id: "hubs-label", type: "symbol", source: "hubs", minzoom: 2.5,
          layout: { "text-field": ["get", "iata"], "text-font": ["Montserrat Medium", "Open Sans Bold", "Noto Sans Regular"], "text-size": 10, "text-offset": [0, 1.4] },
          paint: { "text-color": "#d7e2ea", "text-halo-color": "#050505", "text-halo-width": 1 },
        });
        map.addLayer({
          id: "labs-core", type: "circle", source: "labs",
          paint: { "circle-color": "rgba(0,0,0,0)", "circle-stroke-color": "#ff6ad5", "circle-stroke-width": 2, "circle-radius": 5 },
        });
        map.addLayer({
          id: "target-rings-line", type: "line", source: "target-rings",
          layout: { "line-cap": "butt" },
          paint: { "line-color": ["get", "color"], "line-width": 1.6, "line-dasharray": [2, 2] },
        });
        map.addLayer({
          id: "targets-core", type: "symbol", source: "targets",
          layout: {
            "icon-image": ["concat", "target-", ["get", "cat"]],
            "icon-size": 0.6,
            "icon-allow-overlap": true,
          },
        });
        map.addLayer({
          id: "sky-core", type: "circle", source: "sky",
          paint: {
            "circle-color": ["match", ["get", "kind"], "sun", "#ffd24a", "#d7e2ea"],
            "circle-radius": ["match", ["get", "kind"], "sun", 8, 6],
            "circle-stroke-color": "#050505",
            "circle-stroke-width": 1.2,
          },
        });
        map.addLayer({
          id: "selected-ring", type: "circle", source: "selected",
          paint: {
            "circle-color": "rgba(0,0,0,0)",
            "circle-radius": 15,
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 2,
          },
        });

        // layers whose points are not entities: a small popup with plain text
        const simple = (layer: string, text: (p: Record<string, unknown>) => [string, string]) => {
          map!.on("click", layer, (ev) => {
            const f = ev.features?.[0];
            if (!f) return;
            const [title, body] = text(f.properties as Record<string, unknown>);
            const box = document.createElement("div");
            const t = document.createElement("div");
            t.style.fontWeight = "600";
            t.textContent = title;
            const m = document.createElement("div");
            m.style.cssText = "margin-top:4px;color:#9aa8b3;font-size:11px;line-height:1.4";
            m.textContent = body;
            box.append(t, m);
            import("maplibre-gl").then((ml) => {
              popupRef.current?.remove();
              popupRef.current = new ml.Popup({ offset: 8, maxWidth: "280px" }).setLngLat(ev.lngLat).setDOMContent(box).addTo(map!);
            });
          });
          map!.on("mouseenter", layer, () => (map!.getCanvas().style.cursor = "pointer"));
          map!.on("mouseleave", layer, () => (map!.getCanvas().style.cursor = ""));
        };
        simple("tide-core", (p) => [
          String(p.name),
          `${Number(p.trend) > 0 ? "+" : ""}${Number(p.trend).toFixed(1)} mm/yr relative sea level (${p.years} yr of data to ${p.last}). Includes land rising or sinking at this gauge.`,
        ]);
        simple("hubs-core", (p) => [
          `${p.name} (${p.iata})`,
          `${p.routes} airline routes in the OpenFlights data (mostly 2017). A hub is a place a new pathogen could reach many others from quickly; this is a count of routes, not a forecast of spread. Explore it on the Pandemic X page.`,
        ]);
        simple("labs-core", (p) => [
          String(p.name),
          `${p.country}. Reference data: a laboratory listed as BSL-4 in its public source. Not a risk ranking and not a complete list. ${p.source}`,
        ]);
        simple("sky-core", (p) => [String(p.title), String(p.text)]);
        simple("bases-core", (p) => [
          String(p.name),
          `${p.kind === "naval" ? "Naval base" : p.kind === "air" ? "Airbase" : "Military base"}${p.country ? `, ${p.country}` : ""}${p.nuc ? ". Also appears in the nuclear reference list." : ""}. Wikidata entry: coverage is uneven and entries may be historical.`,
        ]);
        simple("fires-core", (p) => [
          `${p.n} fire detection${Number(p.n) === 1 ? "" : "s"}`,
          `In a 0.5 degree cell over the last 24 h${p.frp ? `, strongest ${p.frp} MW` : ""}. A hot pixel seen by a satellite: it can be a burn or a gas flare, not only a wildfire.`,
        ]);
        simple("cyclones-core", (p) => [
          `${p.name} (${p.cls})`,
          `${p.wind} kt sustained wind${p.pressure ? `, ${p.pressure} mb` : ""}. Position from the NHC advisory of ${String(p.updated).slice(0, 16).replace("T", " ")} UTC; the storm has moved since.`,
        ]);
        simple("orbit-core", (p) => [
          p.name ? String(p.name) : ["Satellite", "Starlink satellite", "Tracked debris", "Space station"][Number(p.kind)] ?? "Object",
          `Altitude about ${p.alt} km at the snapshot time. Positions are a snapshot: objects move about 7 km/s.`,
        ]);

        // a cluster of bases: zoom in on it
        map.on("click", "bases-cluster", (ev) => {
          const f = ev.features?.[0];
          if (!f) return;
          (map!.getSource("bases") as GeoJSONSource).getClusterExpansionZoom(f.properties.cluster_id as number).then((z) =>
            map!.easeTo({ center: (f.geometry as unknown as { coordinates: [number, number] }).coordinates, zoom: z + 0.5 }),
          );
        });
        map.on("mouseenter", "bases-cluster", () => (map!.getCanvas().style.cursor = "pointer"));
        map.on("mouseleave", "bases-cluster", () => (map!.getCanvas().style.cursor = ""));

        // shaded countries: a popup with the WHO reports behind the shade
        map.on("click", "fill-reports", (ev) => {
          const f = ev.features?.[0];
          const iso = f?.properties?.iso3 as string | undefined;
          const items = (iso && latest.current.data.fill.reports[iso]) || [];
          if (!f || items.length === 0) return;
          const box = document.createElement("div");
          box.style.minWidth = "220px";
          const t = document.createElement("div");
          t.style.fontWeight = "600";
          t.textContent = `${f.properties.name}: ${items.length} WHO report${items.length === 1 ? "" : "s"}, last 90 days`;
          box.append(t);
          for (const it of items.slice(0, 6)) {
            const row = document.createElement("div");
            row.style.cssText = "margin-top:4px;font-size:11px;line-height:1.4";
            const d = document.createElement("span");
            d.style.color = "#9aa8b3";
            d.textContent = `${it.date} `;
            row.append(d);
            if (it.url) {
              const a = document.createElement("a");
              a.href = it.url;
              a.target = "_blank";
              a.rel = "noopener noreferrer";
              a.style.color = "#00e5ff";
              a.textContent = it.title;
              row.append(a);
            } else row.append(it.title);
            box.append(row);
          }
          import("maplibre-gl").then((ml) => {
            popupRef.current?.remove();
            popupRef.current = new ml.Popup({ offset: 8, maxWidth: "320px" }).setLngLat(ev.lngLat).setDOMContent(box).addTo(map!);
          });
        });

        // a reference site: popup plus dashed rings for the one fixed example (illustrative model)
        map.on("click", "targets-core", (ev) => {
          const f = ev.features?.[0];
          if (!f) return;
          const p = f.properties as Record<string, string>;
          const [lon, lat] = (f.geometry as unknown as { coordinates: [number, number] }).coordinates;
          (map!.getSource("target-rings") as GeoJSONSource).setData(
            fc(BLAST_RINGS.map((r) => ({ type: "Feature", properties: { color: r.color }, geometry: { type: "LineString", coordinates: circle(lat, lon, r.km(EXAMPLE_YIELD_KT)) } }))) as never,
          );
          const box = document.createElement("div");
          box.style.minWidth = "230px";
          const badge = document.createElement("div");
          badge.style.cssText = "font:700 10px monospace;letter-spacing:.1em;color:#ffb000";
          badge.textContent = "ILLUSTRATIVE MODEL, NOT A FORECAST";
          const t = document.createElement("div");
          t.style.cssText = "font-weight:600;margin-top:3px";
          t.textContent = p.name;
          box.append(badge, t);
          const lines = [
            `${TARGET_CATEGORY_LABEL[p.cat] ?? p.cat}: ${p.role}. ${p.country}.`,
            `Rings for an example ${EXAMPLE_YIELD_KT} kt airburst: ${BLAST_RINGS.map((r) => `${r.label.toLowerCase()} ${r.km(EXAMPLE_YIELD_KT).toFixed(1)} km`).join(", ")}.`,
            "Example yield, not a prediction of what would be used. Listing a place says nothing about intentions or likelihood.",
            `Source: ${p.source}`,
          ];
          for (const l of lines) {
            const m = document.createElement("div");
            m.style.cssText = "margin-top:4px;color:#9aa8b3;font-size:11px;line-height:1.4";
            m.textContent = l;
            box.append(m);
          }
          import("maplibre-gl").then((ml) => {
            popupRef.current?.remove();
            popupRef.current = new ml.Popup({ offset: 12, maxWidth: "320px" }).setLngLat([lon, lat]).setDOMContent(box).addTo(map!);
            popupRef.current.on("close", () => (map!.getSource("target-rings") as GeoJSONSource | undefined)?.setData(fc([]) as never));
          });
        });
        for (const layer of ["targets-core", "fill-reports", "bases-core"]) {
          map.on("mouseenter", layer, () => (map!.getCanvas().style.cursor = "pointer"));
          map.on("mouseleave", layer, () => (map!.getCanvas().style.cursor = ""));
        }

        map.on("click", (ev) => {
          const box: [[number, number], [number, number]] = [
            [ev.point.x - 6, ev.point.y - 6],
            [ev.point.x + 6, ev.point.y + 6],
          ];
          const hit = map!.queryRenderedFeatures(box, { layers: CLICKABLE });
          const id = hit[0]?.properties?.id as string | undefined;
          latest.current.onSelect(id ?? null);
        });
        const hoverable = ["events-core", "plants-core", "volcanoes-ring", "cells-core", "dyads"];
        for (const layer of hoverable) {
          map.on("mouseenter", layer, () => (map!.getCanvas().style.cursor = "pointer"));
          map.on("mouseleave", layer, () => (map!.getCanvas().style.cursor = ""));
        }

        readyRef.current = true;
        map.setProjection({ type: latest.current.globe ? "globe" : "mercator" });
        applyArsenals();
        applySelection();
      });
    });

    function applyData() {
      const map = mapRef.current;
      if (!map || !readyRef.current) return;
      const src = buildSources(latest.current.data);
      for (const [id, data] of Object.entries(src)) {
        (map.getSource(id) as GeoJSONSource | undefined)?.setData(data as never);
      }
      const { fill, allCables } = latest.current.data;
      for (const [layer, mode] of [["fill-reports", "reports"], ["fill-exposure", "exposure"]] as const) {
        map.setLayoutProperty(layer, "visibility", fill.mode === mode ? "visible" : "none");
      }
      map.setLayoutProperty("country-lines", "visibility", fill.mode ? "visible" : "none");
      if (fill.mode) {
        map.removeFeatureState({ source: "countries" });
        for (const [iso, v] of Object.entries(fill.values)) map.setFeatureState({ source: "countries", id: iso }, { [fill.mode]: v });
      }
      // by default only the cables that cross the 50 degree geomagnetic band
      map.setFilter("cables-lines", allCables ? null : ["==", ["get", "hi"], 1]);
    }

    function applySelection() {
      const map = mapRef.current;
      if (!map || !readyRef.current) return;
      const { selectedId, entities } = latest.current;
      popupRef.current?.remove();
      popupRef.current = null;
      const ent = selectedId ? entities.get(selectedId) : undefined;
      (map.getSource("selected") as GeoJSONSource | undefined)?.setData(
        fc(ent ? [point(ent.lon, ent.lat, { id: ent.id })] : []) as never,
      );
      if (!ent) return;
      import("maplibre-gl").then((ml) => {
        popupRef.current = new ml.Popup({ offset: 14, closeButton: true, maxWidth: "300px" })
          .setLngLat([ent.lon, ent.lat])
          .setDOMContent(popupBox(ent))
          .addTo(map);
        popupRef.current.on("close", () => {
          if (latest.current.selectedId === ent.id) latest.current.onSelect(null);
        });
        map.easeTo({ center: [ent.lon, ent.lat], duration: 700 });
      });
    }

    /** arsenal bubbles: HTML markers (only 9, cheap) */
    function applyArsenals() {
      const map = mapRef.current;
      if (!map || !readyRef.current) return;
      for (const m of markersRef.current) m.remove();
      markersRef.current = [];
      const list = latest.current.data.arsenals;
      if (list.length === 0) return;
      import("maplibre-gl").then((ml) => {
        if (!mapRef.current) return;
        for (const c of list) {
          const size = Math.round(14 + Math.sqrt(c.stockpile) * 0.55);
          const b = document.createElement("button");
          b.type = "button";
          b.setAttribute("aria-label", `${c.name}: ${c.stockpile} warheads in military stockpile`);
          b.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;border:1.5px solid ${DOMAIN_BY_ID.nuclear.color};background:rgba(255,0,60,0.18);color:#ffd6de;font:600 10px var(--font-mono-face),monospace;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0`;
          if (size >= 30) b.textContent = c.stockpile >= 1000 ? `${(c.stockpile / 1000).toFixed(1)}k` : String(c.stockpile);
          b.addEventListener("click", (e) => {
            e.stopPropagation();
            latest.current.onSelect(`country:${c.iso3}`);
          });
          markersRef.current.push(new ml.Marker({ element: b }).setLngLat(c.centroid).addTo(map));
        }
      });
    }

    applyDataRef.current = applyData;
    applyArsenalsRef.current = applyArsenals;
    applySelectionRef.current = applySelection;

    return () => {
      disposed = true;
      popupRef.current?.remove();
      for (const m of markersRef.current) m.remove();
      markersRef.current = [];
      readyRef.current = false;
      map?.remove();
      mapRef.current = null;
    };
    // controlsRef is a stable ref object; the map is created once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { quakes, plants, volcanoes, outbreaks, cells, dyads, connections, arsenals } = data;
  useEffect(() => {
    applyDataRef.current();
  }, [quakes, plants, volcanoes, outbreaks, cells, dyads, connections, data.geomag, data.cables, data.tide, data.bases, data.orbit, data.cyclones, data.fires, data.night, data.sky, data.targets, data.aurora, data.hubs, data.labs, data.countries, data.fill, data.allCables]);

  useEffect(() => {
    applyArsenalsRef.current();
  }, [arsenals]);

  useEffect(() => {
    applySelectionRef.current();
  }, [selectedId, entities]);

  // scenario change: fly the camera to that scenario's preset view
  const camKey = camera?.key;
  const lastCamKey = useRef(camKey);
  const firstCam = useRef(true);
  useEffect(() => {
    const map = mapRef.current;
    const cam = latest.current.camera;
    if (firstCam.current) {
      firstCam.current = false;
      return; // the initial view is set when the map is created
    }
    if (!map || !readyRef.current || !cam) return;
    const narrow = (el.current?.clientWidth ?? 800) < 700;
    map.setMinZoom(cam.minZoom ?? 0.5);
    map.flyTo({ center: cam.center, zoom: narrow ? Math.max(cam.minZoom ?? 0.3, cam.zoom - 1.3) : cam.zoom, duration: 1400, essential: false });
  }, [camKey]);

  // projection: follows the 2D/3D button, and scenarios that need the globe (orbit, asteroid) force it
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    map.setProjection({ type: globe ? "globe" : "mercator" });
    // a scenario change already flies the camera; only the button should nudge the zoom
    const scenarioChanged = lastCamKey.current !== camKey;
    lastCamKey.current = camKey;
    if (scenarioChanged) return;
    const narrow = (el.current?.clientWidth ?? 800) < 700;
    map.easeTo({ zoom: (narrow ? 0.3 : 1.6) + (globe ? 0.7 : 0), duration: 600 });
  }, [globe, camKey]);

  return <div ref={el} className="h-full w-full" role="application" aria-label="World map" />;
}
