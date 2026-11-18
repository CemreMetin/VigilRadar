"use client";

import { useEffect, useRef } from "react";
import type { GeoJSONSource, Map as MlMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { State } from "@/core/types";
import { assetFeatures, chronicRings, conflictBoxes, linkArcs, quakeFeatures } from "@/lib/radar/geojson";
import { COLOR } from "@/lib/palette";

export type Selection = { kind: "quake" | "plant" | "chokepoint" | "conflict"; id: string };
interface Props { state: State | null; nowMs: number; onSelect: (s: Selection) => void; focus?: { center: [number, number]; zoom: number } }

const PANEL = "#0a0f14";
const LINE = "#1f2a33";
const QUAKE_LAYERS = ["quakes", "plants", "chokepoints", "conflicts"];
const KIND: Record<string, Selection["kind"]> = { quakes: "quake", plants: "plant", chokepoints: "chokepoint", conflicts: "conflict" };
const EMPTY = { type: "FeatureCollection", features: [] } as const;

/** MapLibre without a tile or glyph server: a background, the country outlines from world.json and our own layers. No text layers. */
export default function RadarMap({ state, nowMs, onSelect, focus }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const readyRef = useRef(false);
  const markers = useRef<Marker[]>([]);
  const latest = useRef({ state, nowMs, onSelect, focus });
  const draw = useRef<() => void>(() => {});

  useEffect(() => {
    let disposed = false;
    let raf = 0;
    import("maplibre-gl").then((ml) => {
      if (disposed || !el.current) return;
      ml.setWorkerUrl("/vendor/maplibre-gl-worker.mjs");
      const narrow = el.current.clientWidth < 700;
      const map = new ml.Map({
        container: el.current,
        style: {
          version: 8,
          sources: { world: { type: "geojson", data: "/data/static/world.json" } },
          layers: [
            { id: "bg", type: "background", paint: { "background-color": COLOR.bg } },
            { id: "world-fill", type: "fill", source: "world", paint: { "fill-color": PANEL } },
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
        for (const id of ["quakes", "plants", "chokepoints", "conflicts", "arcs", "rings"]) map.addSource(id, { type: "geojson", data: EMPTY as never });
        map.addSource("halo", { type: "geojson", data: EMPTY as never });
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
        map.addLayer({ id: "halo", type: "circle", source: "halo", paint: { "circle-radius": 8, "circle-color": "rgba(0,0,0,0)", "circle-stroke-color": COLOR.threat, "circle-stroke-width": 1, "circle-stroke-opacity": 0.5 } });
        map.addLayer({
          id: "quake-ring", type: "circle", source: "quakes", filter: ["get", "recent"],
          paint: { "circle-radius": ["+", ["interpolate", ["exponential", 2], ["get", "mag"], 5, 4, 8, 22], 4], "circle-color": "rgba(0,0,0,0)", "circle-stroke-color": COLOR.geo, "circle-stroke-width": 1, "circle-stroke-opacity": 0.8 },
        });
        map.addLayer({
          id: "quakes", type: "circle", source: "quakes",
          paint: { "circle-radius": ["interpolate", ["exponential", 2], ["get", "mag"], 5, 4, 8, 22], "circle-color": COLOR.geo, "circle-opacity": ["get", "op"], "circle-stroke-color": COLOR.geo, "circle-stroke-width": 1, "circle-stroke-opacity": ["get", "op"] },
        });

        for (const id of QUAKE_LAYERS) {
          map.on("mouseenter", id, () => (map.getCanvas().style.cursor = "pointer"));
          map.on("mouseleave", id, () => (map.getCanvas().style.cursor = ""));
        }
        map.on("click", (e) => {
          const hit = map.queryRenderedFeatures(e.point, { layers: QUAKE_LAYERS })[0];
          if (hit) latest.current.onSelect({ kind: KIND[hit.layer.id], id: String(hit.properties?.id) });
        });

        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const pulse = (t: number) => {
          const active = (map.getSource("halo") as GeoJSONSource | undefined) && hasHalo;
          if (active) {
            const f = (t % 1600) / 1600;
            map.setPaintProperty("halo", "circle-radius", 6 + 10 * f);
            map.setPaintProperty("halo", "circle-stroke-opacity", 0.6 * (1 - f));
          }
          raf = requestAnimationFrame(pulse);
        };
        let hasHalo = false;

        draw.current = () => {
          const { state: s, nowMs: now } = latest.current;
          const set = (id: string, data: unknown) => (map.getSource(id) as GeoJSONSource | undefined)?.setData((data ?? EMPTY) as never);
          const empty = s === null;
          const assets = empty ? null : assetFeatures(s);
          set("quakes", empty ? EMPTY : quakeFeatures(s, now));
          set("plants", assets?.plants ?? EMPTY);
          set("chokepoints", assets?.chokepoints ?? EMPTY);
          set("conflicts", empty ? EMPTY : conflictBoxes(s));
          set("arcs", empty ? EMPTY : linkArcs(s));
          set("rings", empty ? EMPTY : chronicRings(s));
          const live = (assets?.marked ?? []).filter((f) => f.properties.state === "active" && f.geometry.type === "Point");
          set("halo", { type: "FeatureCollection", features: live });
          hasHalo = live.length > 0;
          if (reduced && hasHalo) { map.setPaintProperty("halo", "circle-radius", 9); map.setPaintProperty("halo", "circle-stroke-opacity", 0.6); }
          // text labels only for active or chronic assets, as HTML markers (no glyph server)
          markers.current.forEach((m) => m.remove());
          markers.current = (assets?.marked ?? []).filter((f) => f.geometry.type === "Point").map((f) => {
            const div = document.createElement("div");
            div.className = "mono pointer-events-none text-label uppercase text-fg";
            div.textContent = String(f.properties.name);
            return new ml.Marker({ element: div, anchor: "left", offset: [8, 0] }).setLngLat((f.geometry as { coordinates: [number, number] }).coordinates).addTo(map);
          });
        };
        readyRef.current = true;
        draw.current();
        if (!reduced) raf = requestAnimationFrame(pulse);
      });
    });
    return () => { disposed = true; cancelAnimationFrame(raf); markers.current.forEach((m) => m.remove()); mapRef.current?.remove(); mapRef.current = null; readyRef.current = false; };
  }, []);

  useEffect(() => {
    latest.current = { state, nowMs, onSelect, focus };
    if (readyRef.current) draw.current();
  }, [state, nowMs, onSelect, focus]);
  useEffect(() => { if (focus && mapRef.current) mapRef.current.flyTo({ center: focus.center, zoom: focus.zoom, duration: 900 }); }, [focus]);

  // maplibre-gl.css makes its container position:relative, so the sizing wrapper is a separate element
  return (
    <div className="absolute inset-0">
      <div ref={el} className="h-full w-full" role="img" aria-label="World map of recent earthquakes and the assets they may affect. The list of recent events is the keyboard alternative." />
    </div>
  );
}
