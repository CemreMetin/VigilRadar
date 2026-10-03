import Link from "next/link";
import type { ReactNode } from "react";

/** Shared building blocks for content pages. Server-safe (no hooks). */

export function Page({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return <div className={`mx-auto px-4 pb-24 pt-8 ${wide ? "max-w-6xl" : "max-w-4xl"}`}>{children}</div>;
}

export function H1({ children, color = "var(--accent)" }: { children: ReactNode; color?: string }) {
  return (
    <h1 className="mono text-xl font-bold tracking-wide" style={{ color }}>
      {children}
    </h1>
  );
}

export function Lead({ children }: { children: ReactNode }) {
  return <p className="mt-3 max-w-2xl text-sm leading-relaxed text-dim">{children}</p>;
}

export function H2({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2 id={id} className="label mt-10 scroll-mt-4">
      {children}
    </h2>
  );
}

export function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
      {children}
    </a>
  );
}

export function Int({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-accent hover:underline">
      {children}
    </Link>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`border border-line bg-panel-solid p-4 ${className}`}>{children}</div>;
}

/** A label that says what KIND of statement follows: observation, projection, estimate, model. */
export type Kind = "observed" | "projection" | "expert" | "model" | "reference";
const KIND: Record<Kind, { text: string; cls: string }> = {
  observed: { text: "OBSERVED", cls: "border-accent text-accent" },
  projection: { text: "PROJECTION", cls: "border-geo text-geo border-dashed" },
  expert: { text: "EXPERT ESTIMATE", cls: "border-bio text-bio border-dotted" },
  model: { text: "ILLUSTRATIVE MODEL", cls: "border-geo text-geo border-dashed" },
  reference: { text: "REFERENCE", cls: "border-dim text-dim" },
};
export function KindTag({ kind }: { kind: Kind }) {
  const k = KIND[kind];
  return <span className={`mono inline-block border px-1.5 py-0.5 text-[10px] tracking-wider ${k.cls}`}>{k.text}</span>;
}

export type Tier = "A" | "B" | "C";
const TIER: Record<Tier, { name: string; cls: string }> = {
  A: { name: "A · Documented", cls: "border-safe text-safe" },
  B: { name: "B · Plausible", cls: "border-accent text-accent" },
  C: { name: "C · Thought experiment", cls: "border-geo text-geo border-dashed" },
};
export function TierBadge({ tier }: { tier: Tier }) {
  const t = TIER[tier];
  return (
    <span className={`mono inline-block border px-1.5 py-0.5 text-[10px] tracking-wider ${t.cls}`} title="Evidence quality, not likelihood">
      {t.name}
    </span>
  );
}

export function Loading({ error }: { error?: string | null }) {
  return (
    <p className={`mt-6 text-sm ${error ? "text-threat" : "text-dim"}`}>
      {error ? `Could not load data (${error}). Run npm run data.` : "Loading…"}
    </p>
  );
}
