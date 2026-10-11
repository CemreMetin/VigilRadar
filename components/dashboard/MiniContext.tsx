"use client";

import { useMemo } from "react";

export type MiniPoint = { lon: number; lat: number; color: string };

/**
 * Mini context map for the left panel: every point the active layers draw, on a plain equirectangular
 * grid (no coastlines, so it stays light). Click anywhere to fly the main map there.
 */
export default function MiniContext({
  points,
  selected,
  onFly,
}: {
  points: MiniPoint[];
  selected: { lon: number; lat: number } | null;
  onFly: (lon: number, lat: number) => void;
}) {
  const dots = useMemo(
    () => points.map((p, i) => <circle key={i} cx={p.lon + 180} cy={90 - p.lat} r={1.6} style={{ fill: p.color }} opacity={0.8} />),
    [points],
  );
  return (
    <svg
      viewBox="0 0 360 180"
      className="block w-full cursor-crosshair border border-line"
      role="img"
      aria-label={`Overview of ${points.length} mapped points. Click to move the main map.`}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        onFly(((e.clientX - r.left) / r.width) * 360 - 180, 90 - ((e.clientY - r.top) / r.height) * 180);
      }}
    >
      {[-120, -60, 0, 60, 120].map((x) => <line key={x} x1={x + 180} x2={x + 180} y1={0} y2={180} stroke="var(--line)" strokeWidth={0.5} />)}
      {[-60, -30, 0, 30, 60].map((y) => <line key={y} y1={90 - y} y2={90 - y} x1={0} x2={360} stroke="var(--line)" strokeWidth={y === 0 ? 0.9 : 0.5} />)}
      {dots}
      {selected && <circle cx={selected.lon + 180} cy={90 - selected.lat} r={5} fill="none" stroke="#fff" strokeWidth={1.2} />}
    </svg>
  );
}
