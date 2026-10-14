"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Place = [string, number, number, number, string]; // name, lat, lon, kind (0 country, 1 city), country iso2

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const COORDS = /^\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*$/;

/**
 * Fly the map to a place. Works offline of any geocoding service: coordinates ("41.01, 28.98") are parsed,
 * and names are matched against a bundled list of countries and cities of 100,000+ people (GeoNames, CC BY 4.0).
 * The list is fetched the first time the box is used.
 */
export default function PlaceSearch({ onFly }: { onFly: (lon: number, lat: number, zoom?: number) => void }) {
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const loading = useRef(false);

  const load = () => {
    if (places || loading.current) return;
    loading.current = true;
    fetch("/data/places.json")
      .then((r) => (r.ok ? (r.json() as Promise<Place[]>) : Promise.reject(new Error(String(r.status)))))
      .then(setPlaces)
      .catch(() => setFailed(true))
      .finally(() => (loading.current = false));
  };

  // a result is either a typed coordinate pair or a named place
  const results = useMemo(() => {
    const text = q.trim();
    if (!text) return [];
    const m = text.match(COORDS);
    if (m) {
      const lat = Number(m[1]);
      const lon = Number(m[2]);
      if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) return [{ label: `Go to ${lat}, ${lon}`, sub: "coordinates", lat, lon, zoom: 8 }];
    }
    if (!places) return [];
    const n = norm(text);
    const starts: Place[] = [];
    const contains: Place[] = [];
    for (const p of places) {
      const name = norm(p[0]);
      if (name.startsWith(n)) starts.push(p);
      else if (n.length >= 3 && name.includes(n)) contains.push(p);
      if (starts.length >= 6) break;
    }
    return [...starts, ...contains].slice(0, 6).map((p) => ({ label: p[0], sub: p[3] === 0 ? "country" : `city, ${p[4]}`, lat: p[1], lon: p[2], zoom: p[3] === 0 ? 4 : 8 }));
  }, [q, places]);

  useEffect(() => setActive(0), [q]);

  const pick = (i: number) => {
    const r = results[i];
    if (!r) return;
    onFly(r.lon, r.lat, r.zoom);
    setOpen(false);
    setQ("");
  };

  return (
    <div className="relative">
      <label className="sr-only" htmlFor="place-search">Search a place or coordinates</label>
      <input
        id="place-search"
        type="search"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls="place-results"
        aria-activedescendant={open && results.length ? `place-${active}` : undefined}
        autoComplete="off"
        value={q}
        placeholder="Search a place or lat, lon"
        onFocus={() => {
          load();
          setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(results.length - 1, a + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(0, a - 1));
          } else if (e.key === "Enter") pick(active);
          else if (e.key === "Escape") setOpen(false);
        }}
        className="mono w-full border border-line bg-transparent px-2 py-1.5 text-[11px] placeholder:text-dim focus:outline-none"
      />
      {open && q.trim() && (
        <ul id="place-results" role="listbox" className="absolute inset-x-0 top-full z-40 border border-line bg-panel-solid">
          {results.map((r, i) => (
            <li key={`${r.label}-${i}`} id={`place-${i}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(i)}
                className={`flex w-full items-baseline justify-between gap-2 px-2 py-1 text-left text-[12px] hover:bg-accent/10 ${i === active ? "bg-accent/15" : ""}`}
              >
                <span className="truncate font-bold">{r.label}</span>
                <span className="mono shrink-0 text-[10px] font-light text-dim">{r.sub}</span>
              </button>
            </li>
          ))}
          {results.length === 0 && (
            <li className="mono px-2 py-1.5 text-[11px] font-light text-dim">{failed ? "Place list unavailable" : places ? "No match. Try lat, lon" : "Loading places…"}</li>
          )}
        </ul>
      )}
    </div>
  );
}
