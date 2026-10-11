"use client";

import { ref } from "@/data/references";
import { SCENARIO_BY_ID } from "@/data/scenarios";
import type { AsteroidsFile, Counter, TideGaugesFile, WorldState } from "@/lib/types";
import { Bar, Big, Section } from "./parts";

/** Readouts for the AI & Bio, Ice & Sea and Asteroid tabs. Published figures and observations only. */

const c = (w: WorldState, id: string) => w.counters.find((x) => x.id === id);

function Spark({ values, color, label }: { values: number[]; color: string; label: string }) {
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

function Published({ counter }: { counter: Counter | undefined }) {
  if (!counter) return null;
  return (
    <div className="border border-line p-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[12px] font-bold">{counter.label}</span>
        <span className="mono text-[11px] font-bold" style={{ color: "var(--accent)" }}>
          {counter.value} {counter.unit}
        </span>
      </div>
      <p className="mt-1 text-[11px] font-light leading-relaxed text-dim">{counter.trendLabel}</p>
      <p className="mono mt-1 text-[10px] font-light text-dim">
        PUBLISHED FIGURE · {counter.asOf} ·{" "}
        <a href={counter.source.url} target="_blank" rel="noopener noreferrer" className="underline">
          {counter.source.name}
        </a>
      </p>
    </div>
  );
}

export function AiBioReadout({ world }: { world: WorldState }) {
  const rows = ["engineered-pandemic", "ai-risk"].flatMap((id) => SCENARIO_BY_ID[id].estimates.map((e) => ({ id, ...e })));
  const who = c(world, "outbreaks");
  return (
    <>
      <Section title="Why there is no gauge">
        <p className="text-[12px] font-light leading-relaxed text-dim">
          Nothing is measured here. These risks have not happened, so the only figures are what experts say, and they disagree widely. Every item below is labelled as an expert estimate with its source.
        </p>
      </Section>
      <Section title="Expert estimates">
        <ul className="space-y-2">
          {rows.map((e) => (
            <li key={e.id + e.who} className="border border-line p-2.5">
              <p className="mono text-[10px] font-bold tracking-wider" style={{ color: "var(--bio)" }}>
                EXPERT ESTIMATE · {e.id === "ai-risk" ? "ADVANCED AI" : "ENGINEERED PANDEMIC"}
              </p>
              <p className="mt-1 text-[12px] font-bold">{e.who}</p>
              <p className="mt-0.5 text-[11px] font-light leading-relaxed text-dim">{e.what}</p>
              <a href={ref(e.ref).url} target="_blank" rel="noopener noreferrer" className="mono mt-1 inline-block text-[10px] text-dim underline">
                source
              </a>
            </li>
          ))}
        </ul>
      </Section>
      <Section title="The one live gauge nearby">
        <Big label="WHO OUTBREAK REPORTS · 90D" value={who?.value ?? "–"} color="var(--bio)" sub={who?.trendLabel} />
        <p className="mt-2 text-[10px] font-light leading-relaxed text-dim">Natural outbreaks, not engineered ones. Context only.</p>
      </Section>
    </>
  );
}

export function IceReadout({ world, tide }: { world: WorldState; tide: TideGaugesFile | null }) {
  const sl = c(world, "sea-level");
  const ice = c(world, "sea-ice");
  const trends = (tide?.stations ?? []).map((s) => s[4]).sort((a, b) => a - b);
  const median = trends.length ? trends[Math.floor(trends.length / 2)] : null;
  const rising = trends.filter((t) => t > 0).length;
  return (
    <>
      <div className="grid grid-cols-2 gap-px border-b border-line bg-line">
        <Big label="SEA LEVEL" value={sl ? `${sl.value} mm` : "–"} color="var(--accent)" sub="since 1993, satellite altimetry" />
        <Big label="ARCTIC SEA ICE" value={ice?.value ?? "–"} color="var(--accent)" sub="million km²" />
      </div>
      <Section title="Global mean sea level (annual means)">
        <Spark values={sl?.history ?? []} color="var(--accent)" label="Global mean sea level, annual means" />
        <p className="mono mt-1 text-[10px] font-light text-dim">{sl?.trendLabel}</p>
        <p className="mt-1 text-[10px] font-light leading-relaxed text-dim">{sl?.note}</p>
      </Section>
      <Section title="Sea ice vs 1981–2010 mean">
        <ul>
          {(ice?.rows ?? []).map((r) => (
            <Bar key={r.label} label={r.label} value={r.value} pct={60} color={r.tone === "normal" ? "var(--accent)" : "var(--geo)"} />
          ))}
        </ul>
        <Spark values={ice?.history ?? []} color="var(--accent)" label="Arctic extent, last 90 days" />
        <p className="mono mt-1 text-[10px] font-light text-dim">{ice?.trendLabel}</p>
      </Section>
      <Section title="Land ice (published assessments)">
        <div className="space-y-2">
          <Published counter={c(world, "glaciers")} />
          <Published counter={c(world, "ice-sheets")} />
        </div>
        <p className="mt-2 text-[10px] font-light leading-relaxed text-dim">
          These come from multi-year scientific assessments, not a live feed, and are updated by hand when a new one is published.
        </p>
      </Section>
      <Section title="Tide gauges on the map">
        {median !== null ? (
          <p className="text-[12px] font-light leading-relaxed text-dim">
            {trends.length} stations; {rising} show rising relative sea level over the last 30 years (median {median > 0 ? "+" : ""}
            {median.toFixed(1)} mm/yr). Colour: blue falling, grey flat, amber rising, red fast. Relative sea level includes the land moving up or down, so a gauge can fall where the land is rising. Click a dot for its value.
          </p>
        ) : (
          <p className="text-[12px] text-dim">Switch the Tide gauges layer on to load the stations.</p>
        )}
      </Section>
    </>
  );
}

export function AsteroidReadout({ world, file }: { world: WorldState; file: AsteroidsFile | null }) {
  const ctr = c(world, "asteroids");
  if (!file) {
    return (
      <p className="mono caret p-4 text-xs font-light text-dim" role="status">
        LOADING CLOSE APPROACHES
      </p>
    );
  }
  const list = [...file.approaches].sort((a, b) => a.ld - b.ld);
  const nearest = list[0];
  const inside = list.filter((a) => a.ld < 1).length;
  const soon = [...file.approaches].sort((a, b) => a.date.localeCompare(b.date));
  const size = (a: (typeof list)[number]) => (a.dMinM && a.dMaxM ? `${a.dMinM}–${a.dMaxM} m` : "size unknown");
  return (
    <>
      <div className="grid grid-cols-2 gap-px border-b border-line bg-line">
        <Big label="NEAREST APPROACH" value={nearest ? `${nearest.ld.toFixed(2)} LD` : "–"} color="var(--space)" sub={nearest ? `${nearest.des} · ${nearest.date.slice(0, 11)}` : undefined} />
        <Big label="INSIDE THE MOON ORBIT" value={String(inside)} color={inside ? "var(--geo)" : "var(--fg)"} sub={`of ${list.length} in ${file.windowDays} days`} />
      </div>
      <Section title="Distance from Earth (1 LD = Earth–Moon, 384,400 km)">
        <div className="relative h-8 border-y border-line" role="img" aria-label="Close approaches by distance in lunar distances">
          <div className="absolute inset-y-0 left-0 w-px bg-fg" title="Earth" />
          <div className="absolute inset-y-0 w-px bg-geo" style={{ left: `${(1 / file.maxLd) * 100}%` }} title="Moon orbit (1 LD)" />
          {list.map((a) => (
            <span
              key={a.des + a.date}
              className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ left: `${(a.ld / file.maxLd) * 100}%`, background: a.ld < 1 ? "var(--geo)" : "var(--space)" }}
              title={`${a.des}: ${a.ld.toFixed(2)} LD`}
            />
          ))}
        </div>
        <div className="mono mt-1 flex justify-between text-[9px] font-light text-dim">
          <span>Earth</span>
          <span>Moon 1 LD</span>
          <span>{file.maxLd.toFixed(0)} LD</span>
        </div>
      </Section>
      <Section title="Next close approaches">
        <ul className="divide-y divide-line border border-line">
          {soon.slice(0, 8).map((a) => (
            <li key={a.des + a.date} className="flex items-center justify-between gap-3 px-2.5 py-1.5">
              <span className="min-w-0">
                <span className="block text-[12px] font-bold">{a.des}</span>
                <span className="mono block text-[10px] font-light text-dim">
                  {a.date} UTC · {size(a)} · {a.kms.toFixed(1)} km/s
                </span>
              </span>
              <span className="mono shrink-0 text-[11px] font-bold" style={{ color: a.ld < 1 ? "var(--geo)" : "var(--space)" }}>
                {a.ld.toFixed(2)} LD
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[10px] font-light leading-relaxed text-dim">
          Sizes are rough ranges computed from brightness (H) with two assumed reflectivities, not measurements. A listed approach is a flyby, not an impact.
        </p>
      </Section>
      <Section title="Impact monitoring (NASA Sentry)">
        {file.sentry ? (
          <p className="text-[12px] font-light leading-relaxed text-dim">
            Sentry currently tracks <strong className="text-fg">{file.sentry.tracked}</strong> objects with a non-zero chance of impact within 100 years;{" "}
            <strong className="text-fg">{file.sentry.torinoAbove0}</strong> rate above 0 on the Torino scale (0 means no hazard).
          </p>
        ) : (
          <p className="text-[12px] text-dim">Sentry table unavailable right now.</p>
        )}
        {ctr && (
          <p className="mono mt-2 text-[10px] font-light text-dim">
            Source: {ctr.source.name}. Updated {ctr.cadence}.
          </p>
        )}
      </Section>
    </>
  );
}
