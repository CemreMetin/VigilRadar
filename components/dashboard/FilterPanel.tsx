"use client";

import type { CSSProperties } from "react";
import { DOMAINS } from "@/lib/domains";
import type { DomainId } from "@/lib/types";

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

const Heading = ({ children }: { children: React.ReactNode }) => (
  <p className="label mb-2 mt-6 first:mt-0">{children}</p>
);

/**
 * Left panel: map layers and filters. Layers are toggle buttons (bordered, with an explicit ON/OFF),
 * so it is obvious they can be clicked. Domains with no map layer are shown as muted, borderless
 * text: they are information, not controls.
 */
export default function FilterPanel({
  enabled,
  onToggle,
  quakeFilters,
  range,
  onRange,
  minMag,
  onMinMag,
  showConnections,
  onConnections,
  legend,
}: {
  enabled: Set<DomainId>;
  onToggle: (id: DomainId) => void;
  quakeFilters: boolean;
  range: "24h" | "7d";
  onRange: (v: "24h" | "7d") => void;
  minMag: number;
  onMinMag: (v: number) => void;
  showConnections: boolean;
  onConnections: (v: boolean) => void;
  legend: React.ReactNode;
}) {
  return (
    <div className="p-3">
      <Heading>Map layers</Heading>
      <ul className="space-y-1.5">
        {DOMAINS.map((d) => {
          const on = enabled.has(d.id);
          if (!d.live) {
            return (
              <li key={d.id} className="px-2.5 py-1.5">
                <span className="flex items-center gap-2 text-[13px] text-dim">
                  <span className="inline-block h-2 w-2 shrink-0 opacity-60" style={{ background: d.color }} aria-hidden />
                  {d.label}
                  {d.metrics && <span className="label ml-auto">metrics only</span>}
                </span>
              </li>
            );
          }
          return (
            <li key={d.id}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onToggle(d.id)}
                style={{ "--c": d.color } as CSSProperties}
                className="card-btn flex w-full items-center gap-2 px-2.5 py-1.5 text-left"
              >
                <span className="inline-block h-2.5 w-2.5 shrink-0" style={{ background: on ? d.color : "transparent", border: `1px solid ${d.color}` }} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-bold">{d.label}</span>
                  <span className="block truncate text-[11px] font-light text-dim">{d.blurb}</span>
                </span>
                <span className="mono shrink-0 text-[10px] font-bold" style={{ color: on ? d.color : "var(--fg-dim)" }}>
                  {on ? "ON" : "OFF"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {quakeFilters && (
        <>
          <Heading>Quakes: time</Heading>
          <Segmented
            label="Quake time range"
            value={range}
            onChange={onRange}
            options={[
              { value: "24h", label: "24h" },
              { value: "7d", label: "7d" },
            ]}
          />
          <Heading>Quakes: magnitude</Heading>
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

      <Heading>Connections</Heading>
      <button
        type="button"
        aria-pressed={showConnections}
        onClick={() => onConnections(!showConnections)}
        className="btn flex w-full items-center justify-between px-2.5 py-1.5 text-left"
      >
        <span className="text-[13px] font-bold">Draw links for selection</span>
        <span className="mono text-[10px] font-bold">{showConnections ? "ON" : "OFF"}</span>
      </button>
      <p className="mt-1.5 text-[11px] font-light leading-relaxed text-dim">Click anything on the map to draw lines to what it is linked to.</p>

      <div className="mt-6 space-y-1 text-[11px] font-light text-dim">{legend}</div>
    </div>
  );
}
