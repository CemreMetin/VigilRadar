"use client";

import { useEffect, useState } from "react";
import type { Map as MlMap } from "maplibre-gl";
import { useJson } from "@/lib/useJson";
import type { WorldState } from "@/lib/types";
import { KindTag, Loading } from "@/components/ui";
import MiniMap from "./MiniMap";

// Centred-dipole approximation; see scripts/build-solar-data.py. A rough proxy only.
const POLE_LAT = 80.7;
const POLE_LON = -72.7;
const rad = Math.PI / 180;

function geomagLat(lat: number, lon: number): number {
  const s =
    Math.sin(lat * rad) * Math.sin(POLE_LAT * rad) +
    Math.cos(lat * rad) * Math.cos(POLE_LAT * rad) * Math.cos((lon - POLE_LON) * rad);
  return Math.asin(Math.max(-1, Math.min(1, s))) / rad;
}

/** Geographic line where geomagnetic latitude equals `target` (found by scanning each meridian). */
function contour(target: number): [number, number][] {
  const pts: [number, number][] = [];
  let prev: number | null = null;
  for (let lon = -180; lon <= 180; lon += 2) {
    const cross: number[] = [];
    let last = geomagLat(-89, lon) - target;
    for (let lat = -88.5; lat <= 89; lat += 0.5) {
      const f = geomagLat(lat, lon) - target;
      if (last * f < 0) cross.push(lat - 0.5 * (f / (f - last)));
      last = f;
    }
    if (cross.length === 0) continue;
    const want = Math.sign(target);
    const pool = cross.filter((c) => Math.sign(c) === want);
    const cand = pool.length ? pool : cross;
    const pick: number = prev == null ? cand[0] : cand.reduce((a, b) => (Math.abs(a - prev!) < Math.abs(b - prev!) ? a : b));
    pts.push([lon, pick]);
    prev = pick;
  }
  return pts;
}

type Exposure = {
  source: { name: string; url: string; license: string };
  method: string;
  vintage: string;
  world: { totalGW: number; highGW: number; share: number };
  countries: { iso3: string; name: string; totalGW: number; highGW: number; share: number }[];
};

export default function SolarModule() {
  const exposure = useJson<Exposure>("/data/solar_exposure.json");
  const world = useJson<WorldState>("/data/world_state.json");
  const [map, setMap] = useState<MlMap | null>(null);
  const [showCables, setShowCables] = useState(true);

  useEffect(() => {
    if (!map) return;
    const lines = [50, 60, -50, -60].map((t) => ({
      type: "Feature",
      properties: { deg: Math.abs(t) },
      geometry: { type: "LineString", coordinates: contour(t) },
    }));
    map.addSource("gm", { type: "geojson", data: { type: "FeatureCollection", features: lines } as never });
    map.addLayer({
      id: "gm-lines", type: "line", source: "gm",
      paint: {
        "line-color": ["match", ["get", "deg"], 60, "#ff003c", "#ffb000"],
        "line-width": 2,
        "line-dasharray": [3, 2],
        "line-opacity": 0.9,
      },
    });
    fetch("/data/cables.json")
      .then((r) => r.json())
      .then((fc: { features: { properties: Record<string, unknown>; geometry: { coordinates: [number, number][][] } }[] }) => {
        for (const f of fc.features) {
          let maxLat = 0;
          for (const line of f.geometry.coordinates) for (const [lo, la] of line) maxLat = Math.max(maxLat, Math.abs(geomagLat(la, lo)));
          f.properties.hi = maxLat >= 50 ? 1 : 0;
        }
        map.addSource("cables", { type: "geojson", data: fc as never });
        map.addLayer(
          {
            id: "cables", type: "line", source: "cables",
            paint: {
              "line-color": ["case", ["==", ["get", "hi"], 1], "#00e5ff", "#4a6a78"],
              "line-width": ["case", ["==", ["get", "hi"], 1], 1.1, 0.6],
              "line-opacity": 0.75,
            },
          },
          "gm-lines",
        );
      })
      .catch(() => {});
    return () => {
      // the map is destroyed with the component; nothing to remove
    };
  }, [map]);

  useEffect(() => {
    if (!map || !map.getLayer("cables")) return;
    map.setLayoutProperty("cables", "visibility", showCables ? "visible" : "none");
  }, [map, showCables, exposure.data]);

  const kp = world.data?.counters.find((c) => c.id === "kp");

  return (
    <section className="mt-6" aria-label="Solar storm exposure">
      <div className="flex flex-wrap items-center gap-3">
        <KindTag kind="model" />
        <span className="text-xs text-dim">
          Where a geomagnetic storm is strongest: closer to the magnetic poles. Dashed lines mark 50° (amber) and 60° (red) geomagnetic latitude.
        </span>
      </div>
      <div className="mt-3">
        <MiniMap label="Map of geomagnetic latitude bands and submarine cables" onReady={(m) => setMap(m)} height={380} />
      </div>
      <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-dim">
        <input type="checkbox" checked={showCables} onChange={(e) => setShowCables(e.target.checked)} style={{ accentColor: "var(--accent)" }} />
        Show submarine cables (cyan: crosses the 50° band; grey: stays south of it)
      </label>

      {kp && (
        <p className="mono mt-3 text-xs">
          <span className="text-dim">Right now:</span> Kp {kp.value} ({kp.trendLabel})
        </p>
      )}

      <h3 className="label mt-8">Installed power capacity at high geomagnetic latitude</h3>
      {exposure.loading || exposure.error || !exposure.data ? (
        <Loading error={exposure.error} />
      ) : (
        <>
          <p className="mt-1 text-xs leading-relaxed text-dim">
            About {Math.round(exposure.data.world.share * 100)}% of the world&apos;s installed capacity (
            {exposure.data.world.highGW.toLocaleString("en-US")} of {exposure.data.world.totalGW.toLocaleString("en-US")} GW) sits at
            50° geomagnetic latitude or higher. Countries with the most capacity there:
          </p>
          <div className="mt-2 overflow-x-auto border border-line">
            <table className="w-full min-w-[420px] text-left text-xs">
              <thead>
                <tr className="label border-b border-line">
                  <th className="p-2 font-normal">Country</th>
                  <th className="mono p-2 text-right font-normal">GW at ≥50°</th>
                  <th className="mono p-2 text-right font-normal">of total GW</th>
                  <th className="mono p-2 text-right font-normal">share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {exposure.data.countries.slice(0, 12).map((c) => (
                  <tr key={c.iso3}>
                    <th scope="row" className="p-2 font-medium">{c.name}</th>
                    <td className="mono p-2 text-right">{c.highGW}</td>
                    <td className="mono p-2 text-right text-dim">{c.totalGW}</td>
                    <td className="mono p-2 text-right">{Math.round(c.share * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 border border-line p-3 text-xs leading-relaxed text-dim">
            <p className="text-fg">Read with care</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>Geomagnetic latitude is a rough stand-in for risk. Ground conductivity, line length and orientation, and transformer design matter as much; a low-latitude grid can be hit too, and a northern grid can be well protected.</li>
              <li>The fibre in a submarine cable is not itself damaged by a storm; the powered repeaters along long cables are the exposed part.</li>
              <li>
                Data: <a href={exposure.data.source.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{exposure.data.source.name}</a> ({exposure.data.source.license}, {exposure.data.vintage}); cables:{" "}
                <a href="https://www.submarinecablemap.com/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">TeleGeography</a> (CC BY-NC-SA 3.0).
              </li>
            </ul>
          </div>
        </>
      )}
    </section>
  );
}
