"use client";

import { useEffect, useRef } from "react";
import PrintMapButton from "../PrintMapButton";
import type { Map as MlMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const STYLE_URL = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

/** A small MapLibre map for scenario pages. Calls onReady(map) once the style has loaded. */
export default function MiniMap({
  onReady,
  height = 420,
  center = [15, 25],
  zoom = 0.9,
  label,
  legend = [],
}: {
  onReady: (map: MlMap, ml: typeof import("maplibre-gl")) => void;
  height?: number;
  center?: [number, number];
  zoom?: number;
  label: string;
  /** lines printed under the map by "Print map" */
  legend?: string[];
}) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const cb = useRef(onReady);
  useEffect(() => {
    cb.current = onReady;
  });

  useEffect(() => {
    let disposed = false;
    let map: MlMap | null = null;
    import("maplibre-gl").then((ml) => {
      if (disposed || !el.current) return;
      ml.setWorkerUrl("/vendor/maplibre-gl-worker.mjs");
      const narrow = el.current.clientWidth < 600;
      map = new ml.Map({
        container: el.current,
        style: STYLE_URL,
        center,
        zoom: narrow ? Math.max(0, zoom - 0.7) : zoom,
        minZoom: 0.3,
        maxZoom: 8,
        attributionControl: { compact: true },
        dragRotate: false,
        pitchWithRotate: false,
        canvasContextAttributes: { preserveDrawingBuffer: true }, // so "Print map" can read the pixels
      });
      mapRef.current = map;
      map.touchZoomRotate.disableRotation();
      map.on("load", () => {
        if (map && !disposed) cb.current(map, ml);
      });
    });
    return () => {
      disposed = true;
      map?.remove();
    };
    // the map is created once; center/zoom are initial values only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div ref={el} style={{ height }} className="w-full border border-line" role="application" aria-label={label} />
      <div className="mt-1.5">
        <PrintMapButton getMap={() => mapRef.current} title={label} getLegend={() => legend} className="btn mono px-2 py-1 text-label font-bold" />
      </div>
    </>
  );
}
