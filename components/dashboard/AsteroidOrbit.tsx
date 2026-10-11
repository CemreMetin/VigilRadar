"use client";

import { ASTEROID_ZOOM } from "@/lib/lenses";
import type { AsteroidsFile } from "@/lib/types";

/**
 * Earth-Moon plot drawn around the 3D globe (asteroid scenario).
 *
 * It is a polar chart of what JPL publishes, not a trajectory drawing: JPL lists a date and a miss distance
 * for each close approach, not a direction, so no flight paths are invented.
 *   angle  = date of closest approach within the window (top = now, clockwise)
 *   radius = miss distance, log scale (1 lunar distance = the dashed Moon-orbit ring)
 * The globe itself is not to scale with the rings; the Moon orbit is 60 Earth radii across in reality.
 */

const A = 1.443; // r = R * (1 + A ln(1 + LD)) puts 1 LD at two globe radii
const monthIndex: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

function parseJpl(d: string): number {
  const m = d.match(/^(\d{4})-(\w{3})-(\d{2}) (\d{2}):(\d{2})/);
  return m ? Date.UTC(+m[1], monthIndex[m[2]], +m[3], +m[4], +m[5]) : NaN;
}

export default function AsteroidOrbit({ file, now }: { file: AsteroidsFile | null; now: number | null }) {
  if (!file || now === null) return null;
  // MapLibre draws the globe with radius = 512 * 2^zoom / (2 pi) pixels
  const R = (512 * 2 ** ASTEROID_ZOOM) / (2 * Math.PI);
  const rad = (ld: number) => R * (1 + A * Math.log(1 + ld));
  const rMax = rad(file.maxLd);
  const size = Math.ceil(rMax * 2 + 70);
  const c = size / 2;
  const span = file.windowDays * 86_400_000;
  const pts = file.approaches
    .map((a) => {
      const t = parseJpl(a.date);
      const frac = Math.min(1, Math.max(0, (t - now) / span));
      const ang = frac * 2 * Math.PI - Math.PI / 2;
      const r = rad(a.ld);
      return { a, x: c + r * Math.cos(ang), y: c + r * Math.sin(ang), inside: a.ld < 1 };
    })
    .filter((p) => Number.isFinite(p.x));
  const nearest = [...pts].sort((p, q) => p.a.ld - q.a.ld).slice(0, 3);
  const ticks = [0, 15, 30, 45].filter((d) => d < file.windowDays);

  return (
    <div className="pointer-events-none absolute inset-0 z-[6] hidden items-center justify-center md:flex" aria-hidden={false}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Close approaches by date (angle) and miss distance (radius, log scale)">
        {/* distance rings: 5, 10, 20 LD faint; the Moon orbit (1 LD) dashed */}
        {[5, 10, 20].filter((ld) => ld <= file.maxLd + 1).map((ld) => (
          <g key={ld}>
            <circle cx={c} cy={c} r={rad(ld)} fill="none" stroke="var(--line)" strokeWidth={1} />
            <text x={c + 4} y={c - rad(ld) - 3} fontSize={9} fill="var(--fg-dim)" className="mono">{ld} LD</text>
          </g>
        ))}
        <circle cx={c} cy={c} r={rad(1)} fill="none" stroke="var(--fg-dim)" strokeWidth={1} strokeDasharray="4 4" />
        <text x={c + 4} y={c - rad(1) - 3} fontSize={9} fill="var(--fg)" className="mono">Moon orbit · 1 LD</text>
        {/* date ticks around the outer ring */}
        {ticks.map((d) => {
          const ang = (d / file.windowDays) * 2 * Math.PI - Math.PI / 2;
          const r0 = rMax + 6;
          return (
            <g key={d}>
              <line x1={c + (r0 - 4) * Math.cos(ang)} y1={c + (r0 - 4) * Math.sin(ang)} x2={c + (r0 + 4) * Math.cos(ang)} y2={c + (r0 + 4) * Math.sin(ang)} stroke="var(--fg-dim)" />
              <text x={c + (r0 + 16) * Math.cos(ang)} y={c + (r0 + 16) * Math.sin(ang) + 3} fontSize={9} textAnchor="middle" fill="var(--fg-dim)" className="mono">{d === 0 ? "now" : `+${d} d`}</text>
            </g>
          );
        })}
        {pts.map((p) => (
          <circle key={p.a.des + p.a.date} cx={p.x} cy={p.y} r={p.inside ? 3.5 : 2.5} style={{ fill: p.inside ? "var(--geo)" : "var(--space)" }}>
            <title>{`${p.a.des}: ${p.a.ld.toFixed(2)} LD on ${p.a.date.slice(0, 11)}`}</title>
          </circle>
        ))}
        {nearest.map((p) => (
          <text key={`l-${p.a.des}`} x={p.x + 7} y={p.y + 3} fontSize={9} fill="var(--fg)" className="mono">{p.a.des}</text>
        ))}
      </svg>
      <p className="mono absolute bottom-14 left-1/2 max-w-md -translate-x-1/2 text-center text-[10px] font-light leading-snug text-dim">
        Angle = date of closest approach (top is now, clockwise). Radius = miss distance, log scale. Earth is not to scale; directions are not published.
      </p>
    </div>
  );
}
