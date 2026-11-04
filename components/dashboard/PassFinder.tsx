"use client";

import { useState } from "react";
import type { Pass } from "@/lib/passes";
import type { OrbitElementsFile } from "@/lib/types";

const COORDS = /^\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*$/;
const fmt = (t: number) => new Date(t).toLocaleString(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit" });

/**
 * Next passes of the space stations and Hubble above a place. Computed in this browser from published orbital
 * elements, so a location typed here or read from the device never goes to any server. Geometry only: it does not
 * know whether the object is sunlit or the sky dark.
 */
export default function PassFinder() {
  const [elements, setElements] = useState<OrbitElementsFile | null>(null);
  const [name, setName] = useState("ISS (ZARYA)");
  const [place, setPlace] = useState("");
  const [passes, setPasses] = useState<Pass[] | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (lat: number, lon: number) => {
    setBusy(true);
    setMsg("");
    try {
      const el = elements ?? ((await (await fetch("/data/orbit_elements.json", { cache: "no-cache" })).json()) as OrbitElementsFile);
      setElements(el);
      const omm = el.objects.find((o) => o.OBJECT_NAME === name);
      if (!omm) throw new Error("no orbital elements for that object");
      const { nextPasses } = await import("@/lib/passes"); // satellite.js loads only when this button is used
      const found = nextPasses(omm, lat, lon, Date.now(), 48, 10);
      setPasses(found);
      const age = (Date.now() - Date.parse(String(omm.EPOCH) + "Z")) / 86_400_000;
      setMsg(`Elements from ${String(omm.EPOCH).slice(0, 16).replace("T", " ")} UTC (${age.toFixed(1)} days old; accuracy falls with age).`);
    } catch (e) {
      setPasses(null);
      setMsg(e instanceof Error ? e.message : "could not compute passes");
    } finally {
      setBusy(false);
    }
  };

  const go = () => {
    const m = place.match(COORDS);
    if (!m || Math.abs(Number(m[1])) > 90 || Math.abs(Number(m[2])) > 180) {
      setMsg("Type your position as latitude, longitude (for example 41.01, 28.98), or use the location button.");
      return;
    }
    run(Number(m[1]), Number(m[2]));
  };

  const locate = () => {
    if (!navigator.geolocation) return setMsg("This browser has no location service.");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPlace(`${p.coords.latitude.toFixed(2)}, ${p.coords.longitude.toFixed(2)}`);
        run(p.coords.latitude, p.coords.longitude);
      },
      () => setMsg("Location was not allowed. Type latitude, longitude instead."),
      { timeout: 10_000 },
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        <select aria-label="Object" value={name} onChange={(e) => setName(e.target.value)} className="mono border border-line bg-panel-solid px-1.5 py-1 text-body">
          <option value="ISS (ZARYA)">ISS</option>
          <option value="CSS (TIANHE)">Tiangong</option>
          <option value="HST">Hubble</option>
        </select>
        <input
          aria-label="Latitude, longitude"
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder="lat, lon"
          className="mono min-w-0 flex-1 border border-line bg-transparent px-2 py-1 text-body placeholder:text-dim focus:outline-none"
        />
      </div>
      <div className="flex gap-1.5">
        <button type="button" className="btn mono flex-1 px-2 py-1 text-body font-bold" onClick={go} disabled={busy}>
          {busy ? "COMPUTING…" : "NEXT 48 H"}
        </button>
        <button type="button" className="btn mono px-2 py-1 text-body font-bold" onClick={locate} disabled={busy} title="Uses this device's location; it stays in your browser">
          MY LOCATION
        </button>
      </div>
      {passes && (
        <table className="mono w-full text-body">
          <thead className="text-label text-dim">
            <tr className="text-left"><th className="pb-1 text-dim">RISES</th><th className="text-dim">PEAK</th><th className="text-right text-dim">MAX ELEV</th></tr>
          </thead>
          <tbody>
            {passes.length === 0 && <tr><td colSpan={3} className="py-1 text-dim">No pass above 10° in the next 48 h.</td></tr>}
            {passes.slice(0, 6).map((p) => (
              <tr key={p.rise} className="border-t border-line/50">
                <td className="py-0.5">{fmt(p.rise)}</td>
                <td className="text-dim">{fmt(p.peak)}</td>
                <td className="text-right font-bold">{Math.round(p.maxElevationDeg)}°</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {msg && <p className="text-label leading-relaxed text-dim">{msg}</p>}
      <p className="text-label leading-relaxed text-dim">
        Times are in your local time. A pass is when the object is above the horizon (peak elevation 10° or more). Whether you can see it also needs the object in sunlight and a dark sky, which this does not check. Your position stays in this browser.
      </p>
    </div>
  );
}
