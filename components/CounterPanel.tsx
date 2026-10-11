"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DOMAIN_BY_ID } from "@/lib/domains";
import type { Counter, Tone } from "@/lib/types";

const TONE_COLOR: Record<Tone, string> = {
  normal: "var(--accent)",
  elevated: "var(--geo)",
  high: "var(--threat)",
};
const TONE_LABEL: Record<Tone, string> = {
  normal: "Normal",
  elevated: "Elevated",
  high: "High",
};
const TREND_ARROW = { up: "▲", down: "▼", flat: "■" } as const;

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const W = 72;
  const H = 22;
  const pts = values
    .map((v, i) => `${((i / (values.length - 1)) * W).toFixed(1)},${(H - 2 - ((v - min) / span) * (H - 4)).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden className="shrink-0">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.25" strokeLinejoin="round" />
    </svg>
  );
}

function fmtAsOf(asOf: string): string {
  return asOf.length > 10 ? asOf.slice(0, 16).replace("T", " ") + " UTC" : asOf;
}

export default function CounterPanel({
  counters,
  today,
  focusId,
}: {
  counters: Counter[];
  today: string;
  /** open this metric (used when a scenario card is selected) */
  focusId?: string | null;
}) {
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (focusId) setOpen(focusId);
  }, [focusId]);

  if (counters.length === 0) {
    return <p className="p-4 text-xs text-dim">No metrics loaded. Run npm run data.</p>;
  }

  return (
    <ul className="divide-y divide-line">
      {counters.map((c) => {
        const dom = DOMAIN_BY_ID[c.domain];
        const tone = c.tone ?? "normal";
        const isOpen = open === c.id;
        const reviewDue = c.manual && c.reviewBy && c.reviewBy < today;
        return (
          <li key={c.id}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : c.id)}
              className="flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-accent/10"
            >
              <span className="mt-1 inline-block h-2 w-2 shrink-0" style={{ background: dom.color }} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="label">{c.label}</span>
                  {c.manual && <span className="label opacity-60">manual</span>}
                  {tone !== "normal" && <span className="mono text-[10px] font-bold" style={{ color: TONE_COLOR[tone] }}>{TONE_LABEL[tone].toUpperCase()}</span>}
                  {reviewDue && <span className="label text-geo">review due</span>}
                </span>
                <span className="mt-0.5 flex items-baseline gap-2">
                  <span className="mono text-xl leading-none" style={{ color: TONE_COLOR[tone] }}>
                    {c.value}
                  </span>
                  {c.unit && <span className="mono text-[11px] text-dim">{c.unit}</span>}
                </span>
              </span>
              {c.history && <Sparkline values={c.history} color={dom.color} />}
              <span className="mono mt-0.5 shrink-0 text-xs font-bold text-accent" aria-hidden>
                {isOpen ? "−" : "+"}
              </span>
              <span className="sr-only">Status: {TONE_LABEL[tone]}</span>
            </button>

            {isOpen && (
              <div className="border-t border-line bg-bg/60 px-3 py-3 text-xs leading-relaxed">
                {c.trendLabel && (
                  <p className="mb-2 text-[11px] leading-snug text-fg">
                    {c.trend && <span className="mono mr-1" aria-hidden>{TREND_ARROW[c.trend]}</span>}
                    {c.trendLabel}
                  </p>
                )}
                {c.basis && <p className="mb-2 text-[11px] font-light leading-snug text-dim">How the status is set: {c.basis}</p>}
                {c.note && <p className="font-light text-dim">{c.note}</p>}
                {c.rows && (
                  <ul className="mono mt-2 divide-y divide-line border border-line">
                    {c.rows.map((r, i) => (
                      <li key={`${i}-${r.label}`} className="flex items-baseline justify-between gap-3 px-2 py-1">
                        <span className="min-w-0 truncate text-[11px] text-dim" title={r.label}>
                          {r.label}
                        </span>
                        <span className="shrink-0 text-[11px]" style={{ color: TONE_COLOR[r.tone ?? "normal"] }}>
                          {r.value}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mono mt-2 text-[11px] text-dim">
                  as of {fmtAsOf(c.asOf)} · {c.cadence}
                  {reviewDue ? ` · was due for review ${c.reviewBy}` : ""}
                </p>
                <p className="mono mt-1 text-[11px]">
                  <a
                    href={c.source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    {c.source.name} ↗
                  </a>
                  <span className="text-dim"> · {c.source.license}</span>
                </p>
                {c.href && (
                  <Link href={c.href} className="mono mt-2 inline-block text-[11px] text-accent hover:underline">
                    details →
                  </Link>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
