"use client";

import { useMemo, useState } from "react";
import { useJson } from "@/lib/useJson";
import type { WorldState } from "@/lib/types";
import { KindTag } from "@/components/ui";

const MT_J = 4.184e15; // joules per megaton of TNT

const DENSITY = [
  { id: "stone", label: "Stony asteroid", v: 3000, speed: 20 },
  { id: "iron", label: "Iron asteroid", v: 7800, speed: 20 },
  { id: "ice", label: "Comet (ice and dust)", v: 1000, speed: 50 },
];

const REFS: { label: string; mt: number; note: string }[] = [
  { label: "Hiroshima bomb", mt: 0.015, note: "about 15 kilotonnes" },
  { label: "Chelyabinsk 2013", mt: 0.5, note: "about 0.5 Mt, a 20 m object" },
  { label: "Tunguska 1908", mt: 12, note: "roughly 10–15 Mt" },
  { label: "Tsar Bomba", mt: 50, note: "largest nuclear test, about 50 Mt" },
  { label: "Chicxulub", mt: 1e8, note: "order of 10⁸ Mt, a roughly 10 km object" },
];

const LOG_MIN = -3;
const LOG_MAX = 9;
const pos = (mt: number) => `${((Math.log10(mt) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 100}%`;

function fmt(mt: number): string {
  if (mt >= 1000) return mt.toExponential(1).replace("e+", " × 10^") + " Mt";
  if (mt >= 1) return `${mt.toFixed(mt >= 100 ? 0 : 1)} Mt`;
  if (mt >= 0.001) return `${(mt * 1000).toFixed(mt >= 0.1 ? 0 : 1)} kt`;
  return `${(mt * 1e6).toFixed(0)} tonnes TNT`;
}

export default function AsteroidModule() {
  const [diameter, setDiameter] = useState(50);
  const [kind, setKind] = useState("stone");
  const [speed, setSpeed] = useState(20);
  const world = useJson<WorldState>("/data/world_state.json");

  const preset = DENSITY.find((d) => d.id === kind) ?? DENSITY[0];
  const mt = useMemo(() => {
    const mass = preset.v * (Math.PI / 6) * diameter ** 3;
    const energy = 0.5 * mass * (speed * 1000) ** 2;
    return energy / MT_J;
  }, [diameter, preset, speed]);

  const counter = world.data?.counters.find((c) => c.id === "asteroids");
  const field = "mono border border-line bg-bg px-2 py-1 text-xs text-fg";

  return (
    <section className="mt-6" aria-label="Impact energy calculator">
      <div className="flex flex-wrap items-center gap-3">
        <KindTag kind="model" />
        <span className="text-xs text-dim">Kinetic energy of an impactor, from size, material and speed. Energy only.</span>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="text-xs text-dim">
          Diameter: <span className="text-fg">{diameter} m</span>
          <input
            type="range" min={0} max={3} step={0.01}
            value={Math.log10(diameter)}
            onChange={(e) => setDiameter(Math.max(1, Math.round(10 ** Number(e.target.value))))}
            className="mt-2 block w-full" style={{ accentColor: "var(--space)" }}
            aria-label="Diameter in metres (log scale)"
          />
        </label>
        <label className="text-xs text-dim">
          Material
          <select className={`${field} mt-1 block w-full`} value={kind} onChange={(e) => { setKind(e.target.value); setSpeed(DENSITY.find((d) => d.id === e.target.value)!.speed); }}>
            {DENSITY.map((d) => <option key={d.id} value={d.id}>{d.label} ({d.v} kg/m³)</option>)}
          </select>
        </label>
        <label className="text-xs text-dim">
          Speed: <span className="text-fg">{speed} km/s</span>
          <input type="range" min={11} max={72} step={1} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="mt-2 block w-full" style={{ accentColor: "var(--space)" }} />
        </label>
      </div>
      <p className="mono mt-1 text-[11px] text-dim">Diameter slider runs from 1 m to 1,000 m (log scale); for larger objects see the Chicxulub marker.</p>

      <div className="mt-4 border border-line p-4">
        <p className="label">Impact energy</p>
        <p className="mono mt-1 text-3xl" style={{ color: "var(--space)" }}>{fmt(mt)}</p>
        <div className="relative mt-6 h-10" role="img" aria-label="Energy compared with historical events on a logarithmic scale">
          <div className="absolute inset-x-0 top-5 h-px bg-line-strong" />
          {REFS.map((r, i) => (
            <div key={r.label} className="absolute top-0 -translate-x-1/2 text-center" style={{ left: pos(r.mt) }}>
              <span className={`mono block whitespace-nowrap text-[9px] text-dim ${i % 2 ? "mt-6" : ""}`}>{r.label}</span>
              {i % 2 === 0 && <span className="mx-auto mt-3 block h-2 w-px bg-dim" />}
            </div>
          ))}
          <div className="absolute top-3 h-4 w-0.5 -translate-x-1/2 bg-[var(--space)]" style={{ left: pos(Math.min(Math.max(mt, 10 ** LOG_MIN), 10 ** LOG_MAX)) }} aria-hidden />
        </div>
        <ul className="mt-5 grid gap-x-6 gap-y-0.5 text-[11px] text-dim sm:grid-cols-2">
          {REFS.map((r) => <li key={r.label}><span className="text-fg">{r.label}:</span> {r.note}</li>)}
        </ul>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-dim">
        This is energy only. What happens on the ground depends on entry angle, whether the object breaks up in the air
        (small stony ones usually do), and the target. For craters, blast and thermal radius use the{" "}
        <a href="https://doi.org/10.1111/j.1945-5100.2005.tb00157.x" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Earth Impact Effects Program (Collins et al., 2005)</a>.
      </p>

      {counter && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-3"><KindTag kind="observed" /><span className="text-xs text-dim">Known objects passing close in the next 60 days (LD = distance to the Moon)</span></div>
          <ul className="mt-2 divide-y divide-line border border-line">
            {counter.rows?.map((r) => (
              <li key={r.label} className="flex items-baseline justify-between gap-3 px-3 py-1.5 text-xs">
                <span className="text-dim">{r.label}</span>
                <span className="mono shrink-0">{r.value}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs leading-relaxed text-dim">{counter.note}</p>
        </div>
      )}
    </section>
  );
}
