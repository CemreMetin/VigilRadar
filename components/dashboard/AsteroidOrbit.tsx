"use client";

import { useEffect, useRef, useState } from "react";
import { moon, sun } from "@/lib/sky";
import type { AsteroidsFile } from "@/lib/types";

/**
 * Earth-Moon plot drawn around the 3D globe (asteroid scenario), seen from above the North Pole.
 *   angle  = right ascension, so a direction means the same thing for the Moon, the Sun and an asteroid
 *   radius = miss distance, log scale (1 lunar distance = the dashed Moon-orbit ring)
 * Asteroid directions come from JPL Horizons at each object's closest approach; the Moon and Sun are shown as they
 * are now. An asteroid Horizons did not answer for has no direction: it is drawn hollow and placed by date (top is
 * now, clockwise over the window). Declination is not drawn. The globe is not to scale with the rings: the Moon
 * orbit is 60 Earth radii across in reality. The rings start at the edge of the globe as it is drawn (its radius is
 * read from the map zoom, which MapLibre may keep larger than asked for) and stretch to fit the space around it.
 */

const monthIndex: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

function parseJpl(d: string): number {
  const m = d.match(/^(\d{4})-(\w{3})-(\d{2}) (\d{2}):(\d{2})/);
  return m ? Date.UTC(+m[1], monthIndex[m[2]], +m[3], +m[4], +m[5]) : NaN;
}

export default function AsteroidOrbit({ file, now, zoom }: { file: AsteroidsFile | null; now: number | null; zoom: number | null }) {
  const box = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState(0); // free space around the globe, in pixels (the side panels and bars take the rest)
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setRoom(Math.min(el.clientWidth - 660, el.clientHeight - 240));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [file]);

  if (!file || now === null || zoom === null) return <div ref={box} className="pointer-events-none absolute inset-0" />;
  // MapLibre draws the globe with radius = 512 * 2^zoom / (2 pi) pixels
  const R = (512 * 2 ** zoom) / (2 * Math.PI);
  // the outer ring (maxLd) goes to the edge of the free space; r = R * (1 + A ln(1 + LD)) starts at the globe edge
  const rMaxTarget = Math.max(R * 1.6, room / 2 - 20);
  const A = (rMaxTarget / R - 1) / Math.log(1 + file.maxLd);
  const rad = (ld: number) => R * (1 + A * Math.log(1 + ld));
  const rMax = rad(file.maxLd);
  const size = Math.ceil(rMax * 2 + 90);
  const c = size / 2;
  const span = file.windowDays * 86_400_000;
  const at = (raDeg: number, r: number) => ({ x: c + r * Math.cos((raDeg * Math.PI) / 180), y: c - r * Math.sin((raDeg * Math.PI) / 180) });

  const pts = file.approaches
    .map((a) => {
      const withDir = a.raDeg !== undefined;
      let x: number;
      let y: number;
      if (withDir) ({ x, y } = at(a.raDeg as number, rad(a.ld)));
      else {
        const frac = Math.min(1, Math.max(0, (parseJpl(a.date) - now) / span));
        const ang = frac * 2 * Math.PI - Math.PI / 2;
        x = c + rad(a.ld) * Math.cos(ang);
        y = c + rad(a.ld) * Math.sin(ang);
      }
      return { a, x, y, withDir, inside: a.ld < 1 };
    })
    .filter((p) => Number.isFinite(p.x));
  const nearest = [...pts].sort((p, q) => p.a.ld - q.a.ld).slice(0, 3);
  const hollow = pts.filter((p) => !p.withDir).length;

  const m = at(moon(now).ra, rad(1));
  const sunDir = sun(now).ra;
  const s0 = at(sunDir, rMax + 12);
  const s1 = at(sunDir, rMax + 40);

  return (
    <div ref={box} className="pointer-events-none absolute inset-0 z-[6] hidden items-center justify-center md:flex">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Close approaches by direction (angle) and miss distance (radius, log scale), with the Moon and the direction of the Sun">
        {[5, 10, 20].filter((ld) => ld <= file.maxLd + 1).map((ld) => (
          <g key={ld}>
            <circle cx={c} cy={c} r={rad(ld)} fill="none" stroke="var(--line)" strokeWidth={1} />
            <text x={c + 4} y={c - rad(ld) - 3} fontSize={9} fill="var(--fg-dim)" className="mono">{ld} LD</text>
          </g>
        ))}
        <circle cx={c} cy={c} r={rad(1)} fill="none" stroke="var(--fg-dim)" strokeWidth={1} strokeDasharray="4 4" />
        <text x={c + 4} y={c - rad(1) - 3} fontSize={9} fill="var(--fg)" className="mono">Moon orbit · 1 LD</text>

        {/* the Moon where it is now, and the Sun's direction at the edge */}
        <circle cx={m.x} cy={m.y} r={5} fill="#d7e2ea" stroke="#050505" strokeWidth={1.2}>
          <title>The Moon now (direction from its current position)</title>
        </circle>
        <text x={m.x + 8} y={m.y + 3} fontSize={9} fill="var(--fg)" className="mono">Moon</text>
        <line x1={s0.x} y1={s0.y} x2={s1.x} y2={s1.y} stroke="#ffd24a" strokeWidth={1.6} />
        <circle cx={s1.x} cy={s1.y} r={3.5} fill="#ffd24a" />
        <text x={s1.x + (s1.x >= c ? 6 : -6)} y={s1.y + 3} fontSize={9} textAnchor={s1.x >= c ? "start" : "end"} fill="#ffd24a" className="mono">Sun</text>

        {pts.map((p) => (
          <circle
            key={p.a.des + p.a.date}
            cx={p.x}
            cy={p.y}
            r={p.inside ? 3.5 : 2.5}
            fill={p.withDir ? (p.inside ? "var(--geo)" : "var(--space)") : "none"}
            stroke={p.inside ? "var(--geo)" : "var(--space)"}
            strokeWidth={p.withDir ? 0 : 1.2}
          >
            <title>{`${p.a.des}: ${p.a.ld.toFixed(2)} LD on ${p.a.date.slice(0, 11)}${p.withDir ? "" : " (direction not available)"}`}</title>
          </circle>
        ))}
        {nearest.map((p) => (
          <text key={`l-${p.a.des}`} x={p.x + 7} y={p.y + 3} fontSize={9} fill="var(--fg)" className="mono">{p.a.des}</text>
        ))}
      </svg>
      <p className="mono absolute bottom-14 left-[280px] max-w-[26rem] text-label leading-snug text-dim">
        Directions: JPL Horizons. Distances not to scale with the globe.
        {" "}Asteroids are shown where they are at closest approach, the Moon and Sun as they are now; angle is right ascension seen from above the North Pole.
        {hollow > 0 ? ` Hollow dots (${hollow}): no direction available, placed by date (top is now, clockwise).` : ""}
      </p>
    </div>
  );
}
