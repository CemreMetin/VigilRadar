"use client";

import type { CSSProperties, ReactNode } from "react";
import { LAYER_INFO, type LayerId, type Mode } from "@/lib/lenses";

type Option<T> = { value: T; label: string };

function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="flex" role="group" aria-label={label}>
      {options.map((o, i) => (
        <button
          key={String(o.value)}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`btn mono flex-1 px-2 py-1.5 text-xs font-bold ${i > 0 ? "-ml-px" : ""}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const Heading = ({ children }: { children: ReactNode }) => (
  <p className="label caret mb-2 mt-6 first:mt-0">{children}</p>
);

/**
 * Left panel = micro control: which details of THIS scenario do I want on the map?
 * It holds only the layers that belong to the active scenario, their filters, and the view options.
 * It never switches scenarios (that is the top bar's job).
 */
export default function FilterPanel({
  mode,
  layersOn,
  onToggle,
  range,
  onRange,
  minMag,
  onMinMag,
  globe,
  onGlobe,
  showConnections,
  onConnections,
  legend,
}: {
  mode: Mode;
  layersOn: Set<LayerId>;
  onToggle: (id: LayerId) => void;
  range: "24h" | "7d";
  onRange: (v: "24h" | "7d") => void;
  minMag: number;
  onMinMag: (v: number) => void;
  globe: boolean;
  onGlobe: (v: boolean) => void;
  showConnections: boolean;
  onConnections: (v: boolean) => void;
  legend: ReactNode;
}) {
  const hasQuakes = mode.layers.includes("quakes");
  return (
    <div className="p-3" key={mode.id}>
      <p className="mono text-[11px] font-bold tracking-wider" style={{ color: mode.color }}>
        {`${mode.title.toUpperCase()} // LAYERS`}
      </p>
      <ul className="readout-in mt-3 space-y-1.5">
        {mode.layers.map((id) => {
          const info = LAYER_INFO[id];
          const on = layersOn.has(id);
          return (
            <li key={id}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onToggle(id)}
                style={{ "--c": info.color } as CSSProperties}
                className="card-btn toggle-row relative flex w-full items-center gap-2 overflow-hidden px-2.5 py-1.5 text-left"
              >
                <span className="inline-block h-2.5 w-2.5 shrink-0" style={{ background: on ? info.color : "transparent", border: `1px solid ${info.color}` }} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-bold">{info.label}</span>
                  <span className="block truncate text-[11px] font-light text-dim">{info.blurb}</span>
                </span>
                <span className="mono shrink-0 text-[10px] font-bold" style={{ color: on ? info.color : "var(--fg-dim)" }}>
                  {on ? "ON" : "OFF"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {hasQuakes && (
        <>
          <Heading>Quake filter: time</Heading>
          <Segmented
            label="Quake time range"
            value={range}
            onChange={onRange}
            options={[
              { value: "24h", label: "24h" },
              { value: "7d", label: "7d" },
            ]}
          />
          <Heading>Quake filter: magnitude</Heading>
          <Segmented
            label="Minimum magnitude"
            value={minMag}
            onChange={onMinMag}
            options={[
              { value: 5, label: "M5+" },
              { value: 4.5, label: "M4.5+" },
            ]}
          />
        </>
      )}

      <Heading>View</Heading>
      <Segmented
        label="Map projection"
        value={globe ? "3D" : "2D"}
        onChange={(v) => onGlobe(v === "3D")}
        options={[
          { value: "2D", label: "2D MAP" },
          { value: "3D", label: "3D GLOBE" },
        ]}
      />
      <button
        type="button"
        aria-pressed={showConnections}
        onClick={() => onConnections(!showConnections)}
        className="btn mt-1.5 flex w-full items-center justify-between px-2.5 py-1.5 text-left"
      >
        <span className="text-[13px] font-bold">Draw links for selection</span>
        <span className="mono text-[10px] font-bold">{showConnections ? "ON" : "OFF"}</span>
      </button>
      <p className="mt-1.5 text-[11px] font-light leading-relaxed text-dim">Click anything on the map to draw lines to what it is linked to.</p>

      <div className="mt-6 space-y-1 text-[11px] font-light text-dim">{legend}</div>
    </div>
  );
}
