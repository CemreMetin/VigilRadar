"use client";

import { useMemo, useState } from "react";
import { EDGES, NODES, type CausalEdge } from "@/data/causal";
import { ref } from "@/data/references";
import type { Evidence } from "@/data/scenarios";
import { DOMAIN_BY_ID } from "@/lib/domains";
import type { DomainId } from "@/lib/types";
import { Card, Ext } from "./ui";

const W = 900;
const H = 450;
const COLX = [100, 450, 800];
const NW = 178;
const NH = 34;

const STYLE: Record<Evidence, { dash?: string; width: number; label: string; opacity: number }> = {
  strong: { width: 2.6, label: "strong evidence", opacity: 0.95 },
  moderate: { width: 1.6, label: "moderate evidence", opacity: 0.85 },
  speculative: { width: 1.2, dash: "4 4", label: "speculative", opacity: 0.7 },
};

function pos(id: string) {
  const n = NODES.find((x) => x.id === id)!;
  return { x: COLX[n.col], y: n.y };
}

function path(e: CausalEdge): string {
  const a = pos(e.from);
  const b = pos(e.to);
  const x1 = a.x + NW / 2;
  const x2 = b.x - NW / 2;
  const mid = (x1 + x2) / 2;
  return `M ${x1} ${a.y} C ${mid} ${a.y}, ${mid} ${b.y}, ${x2} ${b.y}`;
}

export default function CausalGraph() {
  const [showSpec, setShowSpec] = useState(false);
  const [sel, setSel] = useState<string | null>("volcano>aerosols");

  const edges = useMemo(() => EDGES.filter((e) => showSpec || e.evidence !== "speculative"), [showSpec]);
  const selected = EDGES.find((e) => e.id === sel && (showSpec || e.evidence !== "speculative")) ?? null;
  const used = new Set(edges.flatMap((e) => [e.from, e.to]));

  return (
    <div className="mt-6">
      <label className="flex cursor-pointer items-center gap-2 text-body">
        <input type="checkbox" checked={showSpec} onChange={(e) => setShowSpec(e.target.checked)} style={{ accentColor: "var(--geo)" }} />
        <span>Show speculative links ({EDGES.filter((e) => e.evidence === "speculative").length})</span>
      </label>

      <div className="mt-3 overflow-x-auto border border-line bg-panel-solid">
        <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[760px]" role="group" aria-label="Causal links between risks">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#7d8c97" />
            </marker>
            <marker id="arrow-sel" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#00e5ff" />
            </marker>
          </defs>
          {["Drivers", "Mechanisms", "Outcomes"].map((t, i) => (
            <text key={t} x={COLX[i]} y={16} textAnchor="middle" fontSize="10" fill="#7d8c97" fontFamily="monospace" letterSpacing="2">
              {t.toUpperCase()}
            </text>
          ))}
          {edges.map((e) => {
            const st = STYLE[e.evidence];
            const on = e.id === sel;
            return (
              <g key={e.id}>
                <path d={path(e)} fill="none" stroke={on ? "#00e5ff" : "#7d8c97"} strokeWidth={on ? st.width + 1 : st.width} strokeDasharray={st.dash} opacity={on ? 1 : st.opacity * 0.7} markerEnd={on ? "url(#arrow-sel)" : "url(#arrow)"} />
                {/* wide invisible stroke makes thin lines easy to click */}
                <path d={path(e)} fill="none" stroke="transparent" strokeWidth="12" style={{ cursor: "pointer" }} onClick={() => setSel(e.id)}>
                  <title>{`${NODES.find((n) => n.id === e.from)!.label} → ${NODES.find((n) => n.id === e.to)!.label} (${st.label})`}</title>
                </path>
              </g>
            );
          })}
          {NODES.filter((n) => used.has(n.id)).map((n) => {
            const p = pos(n.id);
            const color = DOMAIN_BY_ID[n.domain as DomainId]?.color ?? "#7d8c97";
            return (
              <g key={n.id}>
                <rect x={p.x - NW / 2} y={p.y - NH / 2} width={NW} height={NH} fill="#0a0f14" stroke={color} strokeWidth="1.2" />
                <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="11" fill="#d7e2ea">{n.label}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <p className="mono mt-2 flex flex-wrap gap-x-4 text-body text-dim">
        <span>━ strong</span>
        <span>─ moderate</span>
        <span>┄ speculative</span>
        <span>click a line, or pick one below</span>
      </p>

      {selected && (
        <Card className="mt-4" >
          <p className="label">
            {NODES.find((n) => n.id === selected.from)!.label} → {NODES.find((n) => n.id === selected.to)!.label}
          </p>
          <p className="mono mt-1 text-body text-accent">{STYLE[selected.evidence].label}</p>
          <p className="mt-2 text-read leading-relaxed">{selected.note}</p>
          {selected.refs.length > 0 ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-body text-dim">
              {selected.refs.map((r) => (
                <li key={r}>
                  {ref(r).text} <Ext href={ref(r).url}>link ↗</Ext>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-body text-dim">No citation: this link is a plausible inference and is shown only when you ask for speculative links.</p>
          )}
        </Card>
      )}

      <ul className="mt-4 grid gap-1 sm:grid-cols-2">
        {edges.map((e) => (
          <li key={e.id}>
            <button
              type="button"
              onClick={() => setSel(e.id)}
              aria-pressed={sel === e.id}
              className={`w-full border px-2 py-1 text-left text-body ${sel === e.id ? "border-accent text-accent" : "border-line text-dim hover:text-fg"}`}
            >
              {NODES.find((n) => n.id === e.from)!.label} → {NODES.find((n) => n.id === e.to)!.label}{" "}
              <span className="mono text-label">· {STYLE[e.evidence].label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
