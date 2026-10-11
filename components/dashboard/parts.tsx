import type { ReactNode } from "react";

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-line px-3 py-3">
      <p className="label caret mb-2">{title}</p>
      {children}
    </section>
  );
}

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

