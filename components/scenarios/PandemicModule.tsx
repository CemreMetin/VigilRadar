"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GeoJSONSource, Map as MlMap } from "maplibre-gl";
import { greatCircle } from "@/lib/arcs";
import { useJson } from "@/lib/useJson";
import { KindTag, Loading } from "@/components/ui";
import MiniMap from "./MiniMap";

type AirportsFile = {
  source: { name: string; url: string; license: string };
  method: string;
  vintage: string;
  airports: [string, string, string, string, number, number, number][]; // iata, name, city, country, lat, lon, degree
  origins: Record<string, { d: number[]; p: number[] }>;
};

const ORIGIN_LABEL: Record<string, string> = {
  IST: "Istanbul",
  LHR: "London",
  JFK: "New York",
  GRU: "São Paulo",
  JNB: "Johannesburg",
  LOS: "Lagos",
  CAI: "Cairo",
  DXB: "Dubai",
  DEL: "Delhi",
  PEK: "Beijing",
  SIN: "Singapore",
  SYD: "Sydney",
};

const empty = { type: "FeatureCollection" as const, features: [] as unknown[] };

export default function PandemicModule() {
  const { data, error, loading } = useJson<AirportsFile>("/data/airports.json");
  const [origin, setOrigin] = useState("IST");
  const [r0, setR0] = useState(2.5);
  const [gen, setGen] = useState(5);
  const [day, setDay] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [map, setMap] = useState<MlMap | null>(null);
  const layersReady = useRef(false);

  const growth = Math.log(r0) / gen; // exponential growth rate per day

  // arrival day per airport: effective distance / growth rate (Brockmann & Helbing 2013)
  const arrival = useMemo(() => {
    if (!data) return null;
    const o = data.origins[origin];
    return o ? o.d.map((d) => (d < 0 ? Infinity : d / growth)) : null;
  }, [data, origin, growth]);

  const maxDay = useMemo(() => {
    if (!arrival) return 100;
    const finite = arrival.filter((t) => Number.isFinite(t));
    return Math.min(365, Math.ceil(Math.max(...finite)));
  }, [arrival]);

  // add sources and layers once the map and the data exist
  useEffect(() => {
    if (!map || !data || layersReady.current) return;
    map.addSource("ap-lines", { type: "geojson", data: empty as never });
    map.addSource("ap-points", { type: "geojson", data: empty as never });
    map.addLayer({
      id: "ap-lines", type: "line", source: "ap-lines", filter: ["<=", ["get", "t"], 0],
      paint: { "line-color": "#b026ff", "line-opacity": 0.35, "line-width": 0.8 },
    });
    map.addLayer({
      id: "ap-points", type: "circle", source: "ap-points", filter: ["<=", ["get", "t"], 0],
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["get", "deg"], 20, 2.5, 600, 5, 3000, 8],
        "circle-color": ["interpolate", ["linear"], ["get", "t"], 0, "#b026ff", 40, "#d58cff", 80, "#f0d4ff", 160, "#ffffff"],
        "circle-stroke-color": "#050505",
        "circle-stroke-width": 0.6,
        "circle-opacity": 0.95,
      },
    });
    map.addLayer({
      id: "ap-origin", type: "circle", source: "ap-points", filter: ["==", ["get", "origin"], 1],
      paint: { "circle-radius": 9, "circle-color": "rgba(0,0,0,0)", "circle-stroke-color": "#ff003c", "circle-stroke-width": 2.5 },
    });
    layersReady.current = true;
  }, [map, data]);

  // recompute geometry when origin / disease parameters change
  useEffect(() => {
    if (!map || !data || !arrival || !layersReady.current) return;
    const o = data.origins[origin];
    const pts = data.airports.map((a, i) => ({
      type: "Feature",
      properties: { t: arrival[i], deg: a[6], origin: i === data.airports.findIndex((x) => x[0] === origin) ? 1 : 0 },
      geometry: { type: "Point", coordinates: [a[5], a[4]] },
    }));
    const lines: unknown[] = [];
    o.p.forEach((parent, i) => {
      if (parent < 0 || !Number.isFinite(arrival[i])) return;
      const a = data.airports[parent];
      const b = data.airports[i];
      lines.push({
        type: "Feature",
        properties: { t: arrival[i] },
        geometry: { type: "MultiLineString", coordinates: greatCircle([a[5], a[4]], [b[5], b[4]], 24) },
      });
    });
    (map.getSource("ap-points") as GeoJSONSource).setData({ type: "FeatureCollection", features: pts } as never);
    (map.getSource("ap-lines") as GeoJSONSource).setData({ type: "FeatureCollection", features: lines } as never);
  }, [map, data, arrival, origin]);

  // the day slider only changes a GPU filter, so scrubbing and playing stay cheap on phones
  useEffect(() => {
    if (!map || !layersReady.current) return;
    map.setFilter("ap-points", ["<=", ["get", "t"], day]);
    map.setFilter("ap-lines", ["<=", ["get", "t"], day]);
  }, [map, day, arrival]);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setDay((d) => {
        if (d >= maxDay) {
          setPlaying(false);
          return d;
        }
        return d + 1;
      });
    }, 110);
    return () => clearInterval(t);
  }, [playing, maxDay]);

  // the first days are empty (nothing has left the origin yet); playback starts just before the first export
  const firstDay = useMemo(() => {
    if (!arrival) return 0;
    const positive = arrival.filter((t) => t > 0 && Number.isFinite(t));
    return positive.length ? Math.max(0, Math.floor(Math.min(...positive)) - 2) : 0;
  }, [arrival]);

  const stats = useMemo(() => {
    if (!data || !arrival) return null;
    const totalDeg = data.airports.reduce((s, a) => s + a[6], 0);
    let reached = 0;
    let reachedDeg = 0;
    const order: { i: number; t: number }[] = [];
    arrival.forEach((t, i) => {
      if (!Number.isFinite(t)) return;
      if (t <= day) {
        reached++;
        reachedDeg += data.airports[i][6];
      }
      if (t > 0) order.push({ i, t });
    });
    order.sort((a, b) => a.t - b.t);
    return { reached, share: reachedDeg / totalDeg, first: order.slice(0, 12) };
  }, [data, arrival, day]);

  if (loading || error || !data) return <Loading error={error} />;

  const field = "mono border border-line bg-bg px-2 py-1 text-xs text-fg";
  return (
    <section aria-label="Pandemic spread explorer" className="mt-6">
      <div className="flex flex-wrap items-center gap-3">
        <KindTag kind="model" />
        <span className="text-xs text-dim">
          Order and relative timing of arrival by air travel, using &quot;effective distance&quot; on the airline network.
        </span>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="text-xs text-dim">
          Outbreak starts in
          <select className={`${field} mt-1 block w-full`} value={origin} onChange={(e) => { setOrigin(e.target.value); setDay(0); setPlaying(false); }}>
            {Object.keys(data.origins).map((o) => (
              <option key={o} value={o}>{ORIGIN_LABEL[o] ?? o} ({o})</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-dim">
          R₀ (new cases per case): <span className="text-fg">{r0.toFixed(1)}</span>
          <input type="range" min={1.2} max={6} step={0.1} value={r0} onChange={(e) => setR0(Number(e.target.value))} className="mt-2 block w-full" style={{ accentColor: "var(--bio)" }} />
        </label>
        <label className="text-xs text-dim">
          Generation time (days): <span className="text-fg">{gen}</span>
          <input type="range" min={2} max={12} step={1} value={gen} onChange={(e) => setGen(Number(e.target.value))} className="mt-2 block w-full" style={{ accentColor: "var(--bio)" }} />
        </label>
      </div>

      <div className="mt-3">
        <MiniMap label="Map of airports reached by the simulated outbreak" onReady={(m) => setMap(m)} height={380} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (day >= maxDay) setDay(firstDay);
            else if (day < firstDay) setDay(firstDay);
            setPlaying((p) => !p);
          }}
          className="mono border border-bio px-3 py-1 text-xs text-bio hover:bg-bio/10"
        >
          {playing ? "pause" : day >= maxDay ? "replay" : "play"}
        </button>
        <label className="flex min-w-[220px] flex-1 items-center gap-3 text-xs text-dim">
          Day
          <input type="range" min={0} max={maxDay} value={day} onChange={(e) => { setPlaying(false); setDay(Number(e.target.value)); }} className="flex-1" style={{ accentColor: "var(--bio)" }} />
          <span className="mono w-14 text-right text-fg">day {day}</span>
        </label>
      </div>

      {stats && (
        <p className="mono mt-2 text-[11px] text-dim">
          By day {day}: {stats.reached} of {data.airports.length} airports reached, covering about{" "}
          {(stats.share * 100).toFixed(0)}% of route volume. Growth rate {growth.toFixed(2)} per day.
        </p>
      )}

      {stats && (
        <div className="mt-4">
          <p className="label">First airports reached (day)</p>
          <ol className="mt-1 grid gap-x-6 gap-y-0.5 text-xs sm:grid-cols-2">
            {stats.first.map(({ i, t }) => {
              const a = data.airports[i];
              return (
                <li key={a[0]} className="flex justify-between border-b border-line py-0.5">
                  <span>{a[2]}, {a[3]} <span className="mono text-dim">{a[0]}</span></span>
                  <span className="mono text-bio">{Math.round(t)}</span>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <div className="mt-4 border border-line p-3 text-xs leading-relaxed text-dim">
        <p className="text-fg">How to read this</p>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          <li>
            Method: on the air-travel network, the &quot;effective distance&quot; between airports is 1 − ln(share of departures
            that go there). Shortest effective paths predict the order of arrival much better than kilometres. Arrival day is
            effective distance divided by the epidemic&apos;s growth rate, ln(R₀) / generation time.
          </li>
          <li>
            Limits: route counts stand in for passengers; the data are mostly from 2017; there are no border closures,
            behaviour changes or local control; one growth rate for all places. Trust the order, be sceptical of the days.
          </li>
          <li>
            Data: <a href={data.source.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{data.source.name}</a> ({data.source.license}). Method:{" "}
            <a href="https://doi.org/10.1126/science.1245200" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Brockmann &amp; Helbing, Science 2013</a>.
          </li>
        </ul>
      </div>
    </section>
  );
}
