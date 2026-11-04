"use client";

import { COLOR, LAYER } from "@/lib/palette";
import { useEffect, useState } from "react";
import type { Map as MlMap } from "maplibre-gl";
import { geomagLat, geomagLines } from "@/lib/geomag";
import { useJson } from "@/lib/useJson";
import type { WorldState } from "@/lib/types";
import { KindTag, Loading } from "@/components/ui";
import MiniMap from "./MiniMap";

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
    map.addSource("gm", { type: "geojson", data: geomagLines() as never });
    map.addLayer({
      id: "gm-lines", type: "line", source: "gm",
      paint: {
        "line-color": ["match", ["get", "deg"], 60, COLOR.threat, COLOR.geo],
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
              "line-color": ["case", ["==", ["get", "hi"], 1], COLOR.accent, LAYER.cableDim],
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
        <span className="text-body text-dim">
          Where a geomagnetic storm is strongest: closer to the magnetic poles. Dashed lines mark 50° (amber) and 60° (red) geomagnetic latitude.
        </span>
      </div>
      <div className="mt-3">
        <MiniMap label="Map of geomagnetic latitude bands and submarine cables" legend={["Dashed lines: 50° and 60° geomagnetic latitude (reference lines, illustrative)", "Submarine cables: those that cross the 50° band are drawn stronger than those that stay south of it", "Cable routes: TeleGeography; geomagnetic latitude: computed"]} onReady={(m) => setMap(m)} height={380} />
      </div>
      <label className="mt-2 flex cursor-pointer items-center gap-2 text-body text-dim">
        <input type="checkbox" checked={showCables} onChange={(e) => setShowCables(e.target.checked)} style={{ accentColor: "var(--accent)" }} />
        Show submarine cables (cyan: crosses the 50° band; grey: stays south of it)
      </label>

      {kp && (
        <p className="mono mt-3 text-body">
          <span className="text-dim">Right now:</span> Kp {kp.value} ({kp.trendLabel})
        </p>
      )}

      <h3 className="label mt-8">Installed power capacity at high geomagnetic latitude</h3>
      {exposure.loading || exposure.error || !exposure.data ? (
        <Loading error={exposure.error} />
      ) : (
        <>
          <p className="mt-1 text-body leading-relaxed text-dim">
            About {Math.round(exposure.data.world.share * 100)}% of the world&apos;s installed capacity (
            {exposure.data.world.highGW.toLocaleString("en-US")} of {exposure.data.world.totalGW.toLocaleString("en-US")} GW) sits at
            50° geomagnetic latitude or higher. Countries with the most capacity there:
          </p>
          <div className="mt-2 overflow-x-auto border border-line">
            <table className="w-full min-w-[420px] text-left text-body">
              <thead>
                <tr className="label border-b border-line">
                  <th className="p-2">Country</th>
                  <th className="mono p-2 text-right">GW at ≥50°</th>
                  <th className="mono p-2 text-right">of total GW</th>
                  <th className="mono p-2 text-right">share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {exposure.data.countries.slice(0, 12).map((c) => (
                  <tr key={c.iso3}>
                    <th scope="row" className="p-2">{c.name}</th>
                    <td className="mono p-2 text-right">{c.highGW}</td>
                    <td className="mono p-2 text-right text-dim">{c.totalGW}</td>
                    <td className="mono p-2 text-right">{Math.round(c.share * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 border border-line p-3 text-body leading-relaxed text-dim">
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
