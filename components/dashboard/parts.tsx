import type { ReactNode } from "react";

/**
 * Collapsible block (progressive disclosure). Closed by default: only the title shows, in muted type.
 * Native <details>, so it is keyboard- and screen-reader-accessible without extra code.
 */
export function Section({ title, children, open = false, meta }: { title: string; children: ReactNode; open?: boolean; meta?: string }) {
  return (
    <details open={open} className="group border-b border-line">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 hover:bg-accent/5 [&::-webkit-details-marker]:hidden">
        <span className="label">{title}</span>
        <span className="mono flex shrink-0 items-center gap-2 text-label text-dim">
          {meta}
          <span className="font-bold text-accent group-open:hidden" aria-hidden>+</span>
          <span className="hidden font-bold text-accent group-open:inline" aria-hidden>−</span>
        </span>
      </summary>
      <div className="px-3 pb-3">{children}</div>
    </details>
  );
}

export const Disclose = Section;

export function Big({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="p-3 odd:border-r odd:border-line [&:nth-child(n+3)]:border-t [&:nth-child(n+3)]:border-line">
      <p className="label">{label}</p>
      <p className="mono readout-in mt-1 text-value font-bold leading-none">
        {value}
      </p>
      {sub && <p className="mono mt-1 text-label text-dim">{sub}</p>}
    </div>
  );
}

/** One labelled horizontal bar: label left, value right, a 4px flat bar below. */
export function Bar({ label, value, pct, color, hint }: { label: string; value: string; pct: number; color: string; hint?: string }) {
  return (
    <li className="py-1" title={hint}>
      <div className="flex items-baseline justify-between gap-3 text-body">
        <span className="min-w-0 truncate">{label}</span>
        <span className="mono shrink-0 text-body font-bold" style={{ color }}>
          {value}
        </span>
      </div>
      <div className="mt-1 h-1 bg-line" role="img" aria-label={`${label}: ${value}`}>
        <div className="bar-fill h-full" style={{ width: `${Math.max(2, Math.min(100, pct))}%`, background: color }} />
      </div>
    </li>
  );
}


export function Spark({ values, color, label }: { values: number[]; color: string; label: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${28 - ((v - min) / (max - min || 1)) * 26}`).join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-8 w-full" role="img" aria-label={label}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

