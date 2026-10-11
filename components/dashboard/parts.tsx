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
        <span className="mono flex shrink-0 items-center gap-2 text-[10px] font-light text-dim">
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

export function Big({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="bg-panel-solid p-3">
      <p className="label">{label}</p>
      <p className="mono readout-in mt-1 text-2xl font-bold leading-none" style={{ color }}>
        {value}
      </p>
      {sub && <p className="mono mt-1 text-[10px] font-light text-dim">{sub}</p>}
    </div>
  );
}

/** One labelled horizontal bar: label left, value right, a 4px flat bar below. */
export function Bar({ label, value, pct, color, hint }: { label: string; value: string; pct: number; color: string; hint?: string }) {
  return (
    <li className="py-1" title={hint}>
      <div className="flex items-baseline justify-between gap-3 text-[12px]">
        <span className="min-w-0 truncate">{label}</span>
        <span className="mono shrink-0 text-[11px] font-bold" style={{ color }}>
          {value}
        </span>
      </div>
      <div className="mt-1 h-1 bg-line" role="img" aria-label={`${label}: ${value}`}>
        <div className="bar-fill h-full" style={{ width: `${Math.max(2, Math.min(100, pct))}%`, background: color }} />
      </div>
    </li>
  );
}

