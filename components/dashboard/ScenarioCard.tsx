"use client";

import type { CSSProperties } from "react";

/**
 * One scenario card in the top bar. It is a button: a solid 1px border tinted with the scenario's
 * own colour, a fill on hover, and a stronger fill plus a bar when active. The title carries the colour;
 * the live stat underneath is muted because it is reading material, not a control.
 */
export default function ScenarioCard({
  title,
  stat,
  color,
  active,
  onClick,
}: {
  title: string;
  stat: string;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      style={{ "--c": color } as CSSProperties}
      className="card-btn relative min-w-[112px] shrink-0 px-2.5 pb-2.5 pt-2 text-left"
    >
      <span className="mono block text-[13px] font-bold uppercase tracking-wider" style={{ color }}>
        {title}
      </span>
      <span className="mono mt-0.5 block truncate text-[11px] font-light text-dim">{stat}</span>
      {/* active marker: a solid bar, not a glow */}
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5" style={{ background: active ? color : "transparent" }} />
    </button>
  );
}
