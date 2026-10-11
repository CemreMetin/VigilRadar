"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { Entity } from "@/lib/entities";
import { LAYER_INFO, type LayerId, type Mode } from "@/lib/lenses";
import MiniContext, { type MiniPoint } from "./MiniContext";
import { Section } from "./parts";

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
          className={`btn mono flex-1 px-2 py-1 text-[11px] font-bold ${i > 0 ? "-ml-px" : ""}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Left panel = control centre for THIS scenario, a glass overlay on the map:
 *   layers (with live counts) and quick filters, a mini context map, the current selection, the legend.
 * It never switches scenarios (that is the top bar's job).
 */
export default function FilterPanel({
  mode,
  layersOn,
  onToggle,
  onAllLayers,
  counts,
  range,
  onRange,
  minMag,
  onMinMag,
  showConnections,
  onConnections,
  points,
  selected,
  onFly,
  onClearSelection,
  legend,
}: {
  mode: Mode;
  layersOn: Set<LayerId>;
  onToggle: (id: LayerId) => void;
  onAllLayers: (on: boolean) => void;
  counts: Partial<Record<LayerId, number>>;
  range: "24h" | "7d";
  onRange: (v: "24h" | "7d") => void;
  minMag: number;
  onMinMag: (v: number) => void;
  showConnections: boolean;
  onConnections: (v: boolean) => void;
  points: MiniPoint[];
  selected: Entity | null;
  onFly: (lon: number, lat: number) => void;
  onClearSelection: () => void;
  legend: ReactNode;
}) {
  const hasQuakes = mode.layers.includes("quakes");
  const allOn = mode.layers.every((l) => layersOn.has(l));
  return (
    <div key={mode.id} className="flex min-h-full flex-col">
      <div className="flex items-center justify-between gap-2 px-3 pt-3">
        <p className="mono text-[11px] font-bold tracking-wider" style={{ color: mode.color }}>
          {`${mode.title.toUpperCase()} // LAYERS`}
        </p>
        {mode.layers.length > 1 && (
          <button type="button" onClick={() => onAllLayers(!allOn)} className="btn mono px-1.5 py-0.5 text-[10px] font-bold">
            {allOn ? "ALL OFF" : "ALL ON"}
          </button>
        )}
      </div>

      <div className="px-3 pb-3">
        {mode.layers.length === 0 && (
          <p className="readout-in mt-3 text-[11px] font-light leading-relaxed text-dim">
            This scenario has no map layer: the objects are not on the ground. Its readout is on the right.
          </p>
        )}
        <ul className="readout-in mt-2 space-y-1">
          {mode.layers.map((id) => {
            const info = LAYER_INFO[id];
            const on = layersOn.has(id);
            const n = counts[id];
            return (
              <li key={id}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => onToggle(id)}
                  style={{ "--c": info.color } as CSSProperties}
                  className="card-btn toggle-row relative flex w-full items-center gap-2 overflow-hidden px-2.5 py-1.5 text-left"
                  title={info.blurb}
                >
                  <span className="inline-block h-2.5 w-2.5 shrink-0" style={{ background: on ? info.color : "transparent", border: `1px solid ${info.color}` }} aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-bold">{info.label}</span>
                  <span className="mono shrink-0 text-[11px] font-bold tabular-nums" style={{ color: on ? info.color : "var(--fg-dim)" }}>
                    {n !== undefined ? n.toLocaleString("en-US") : on ? "ON" : "OFF"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {hasQuakes && (
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <Segmented
              label="Quake time range"
              value={range}
              onChange={onRange}
              options={[
                { value: "24h", label: "24h" },
                { value: "7d", label: "7d" },
              ]}
            />
            <Segmented
              label="Minimum magnitude"
              value={minMag}
              onChange={onMinMag}
              options={[
                { value: 5, label: "M5+" },
                { value: 4.5, label: "M4.5+" },
              ]}
            />
          </div>
        )}
        <button
          type="button"
          aria-pressed={showConnections}
          onClick={() => onConnections(!showConnections)}
          className="btn mt-1.5 flex w-full items-center justify-between px-2.5 py-1 text-left"
          title="Click anything on the map to draw lines to what it is linked to"
        >
          <span className="text-[12px] font-bold">Links for selection</span>
          <span className="mono text-[10px] font-bold">{showConnections ? "ON" : "OFF"}</span>
        </button>
      </div>

      {points.length > 0 && (
      <div className="border-t border-line px-3 py-3">
        <p className="label mb-1.5">Context · click to move the map</p>
        <MiniContext points={points} selected={selected} onFly={onFly} />
      </div>
      )}

      <Section open={!!selected} title="Selection" meta={selected ? selected.kind : undefined}>
        {selected ? (
          <>
            <p className="text-[13px] font-bold leading-snug">{selected.title}</p>
            <ul className="mt-1 space-y-1">
              {selected.lines.slice(0, 4).map((l) => (
                <li key={l} className="text-[11px] font-light leading-snug text-dim">{l}</li>
              ))}
            </ul>
            <div className="mt-2 flex gap-2">
              {selected.link &&
                (selected.link.external ? (
                  <a href={selected.link.href} target="_blank" rel="noopener noreferrer" className="btn mono px-2 py-1 text-[11px] font-bold">
                    {selected.link.text}
                  </a>
                ) : (
                  <Link href={selected.link.href} className="btn mono px-2 py-1 text-[11px] font-bold">
                    {selected.link.text}
                  </Link>
                ))}
              <button type="button" onClick={onClearSelection} className="btn mono px-2 py-1 text-[11px] font-bold">
                CLEAR
              </button>
            </div>
          </>
        ) : (
          <p className="text-[11px] font-light leading-relaxed text-dim">Click a marker on the map to see what it is and what it is linked to.</p>
        )}
      </Section>

      <Section title="Legend">
        <div className="space-y-1 text-[11px] font-light text-dim">{legend}</div>
      </Section>
    </div>
  );
}
