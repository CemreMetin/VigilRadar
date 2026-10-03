"use client";

import { useEffect, useRef } from "react";
import type { GeoJSONSource, Map as MlMap, Marker, Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { greatCircle } from "@/lib/arcs";
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
};

type Props = {
  data: MapData;
  entities: Map<string, Entity>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  globe: boolean;
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

const CLICKABLE = [
  "events-core",
  "plants-core",
  "volcanoes-ring",
  "outbreaks-core",
  "cells-core",
  "dyads",
];

export default function MapView({ data, entities, selectedId, onSelect, globe }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const readyRef = useRef(false);
  const popupRef = useRef<Popup | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const applyDataRef = useRef<() => void>(() => {});
  const applyArsenalsRef = useRef<() => void>(() => {});
  const applySelectionRef = useRef<() => void>(() => {});
  const latest = useRef({ data, entities, selectedId, onSelect, globe });
  // Keep map callbacks pointed at current props. Declared first so it runs before the
  // other effects in the same commit.
  useEffect(() => {
    latest.current = { data, entities, selectedId, onSelect, globe };
  });

  // init once
  useEffect(() => {
    let disposed = false;
    let map: MlMap | null = null;

    import("maplibre-gl").then((ml) => {
      if (disposed || !el.current) return;
      ml.setWorkerUrl("/vendor/maplibre-gl-worker.mjs");
      const narrow = el.current.clientWidth < 700;
      map = new ml.Map({
        container: el.current,
        style: STYLE_URL,
        center: [15, 20],
        zoom: narrow ? 0.3 : 1.6,
        minZoom: 0.5,
        maxZoom: 9,
        attributionControl: { compact: true },
        dragRotate: false,
        pitchWithRotate: false,
      });
      map.touchZoomRotate.disableRotation();
      mapRef.current = map;

      map.on("load", () => {
        if (!map) return;
        const src = buildSources(latest.current.data);
        for (const [id, data] of Object.entries(src)) map.addSource(id, { type: "geojson", data: data as never });
        map.addSource("selected", { type: "geojson", data: fc([]) as never });

        // ---- layers, bottom to top
        map.addLayer({
          id: "cells-halo", type: "circle", source: "cells",
          paint: {
            "circle-color": DOMAIN_BY_ID.conflict.color,
            "circle-opacity": 0.12,
            "circle-radius": ["interpolate", ["linear"], ["get", "n"], 15, 10, 100, 22, 500, 44],
            "circle-blur": 0.9,
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
          id: "outbreaks-core", type: "circle", source: "outbreaks",
          paint: {
            "circle-color": "rgba(176,38,255,0.30)",
            "circle-stroke-color": DOMAIN_BY_ID.health.color,
            "circle-stroke-width": 2,
            "circle-radius": ["interpolate", ["linear"], ["get", "count"], 1, 8, 5, 14],
          },
        });
        map.addLayer({
          id: "events-halo", type: "circle", source: "events",
          paint: {
            "circle-color": DOMAIN_BY_ID.geophysical.color,
            "circle-opacity": 0.16,
            "circle-radius": ["interpolate", ["linear"], ["get", "mag"], 4.5, 9, 6, 20, 8, 44],
            "circle-blur": 0.8,
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
          id: "selected-ring", type: "circle", source: "selected",
          paint: {
            "circle-color": "rgba(0,0,0,0)",
            "circle-radius": 15,
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 2,
          },
        });

        map.on("click", (ev) => {
          const box: [[number, number], [number, number]] = [
            [ev.point.x - 6, ev.point.y - 6],
            [ev.point.x + 6, ev.point.y + 6],
          ];
          const hit = map!.queryRenderedFeatures(box, { layers: CLICKABLE });
          const id = hit[0]?.properties?.id as string | undefined;
          latest.current.onSelect(id ?? null);
        });
        const hoverable = ["events-core", "plants-core", "volcanoes-ring", "outbreaks-core", "cells-core", "dyads"];
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
  }, []);

  const { quakes, plants, volcanoes, outbreaks, cells, dyads, connections, arsenals } = data;
  useEffect(() => {
    applyDataRef.current();
  }, [quakes, plants, volcanoes, outbreaks, cells, dyads, connections]);

  useEffect(() => {
    applyArsenalsRef.current();
  }, [arsenals]);

  useEffect(() => {
    applySelectionRef.current();
  }, [selectedId, entities]);

  // projection toggle
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    map.setProjection({ type: globe ? "globe" : "mercator" });
    const narrow = (el.current?.clientWidth ?? 800) < 700;
    map.easeTo({ zoom: (narrow ? 0.3 : 1.6) + (globe ? 0.7 : 0), duration: 600 });
  }, [globe]);

  return <div ref={el} className="h-full w-full" role="application" aria-label="World map" />;
}
