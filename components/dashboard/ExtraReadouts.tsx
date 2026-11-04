"use client";

import { COLOR } from "@/lib/palette";
import type { SolarNow, AsteroidsFile, Counter, CyclonesFile, FiresFile, OrbitFile, TideGaugesFile, WorldState } from "@/lib/types";
import { Bar, Big, Section, Spark } from "./parts";
import { Term } from "../ui";
import PassFinder from "./PassFinder";

/** Readouts for the Ice & Sea and Asteroid tabs. Published figures and observations only. */

const c = (w: WorldState, id: string) => w.counters.find((x) => x.id === id);

function Published({ counter }: { counter: Counter | undefined }) {
  if (!counter) return null;
  return (
    <div className="border border-line p-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-body font-bold">{counter.label}</span>
        <span className="mono text-body font-bold" style={{ color: "var(--accent)" }}>
          {counter.value} {counter.unit}
        </span>
      </div>
      <p className="mt-1 text-body leading-relaxed text-dim">{counter.trendLabel}</p>
      <p className="mono mt-1 text-label text-dim">
        PUBLISHED FIGURE · {counter.asOf} ·{" "}
        <a href={counter.source.url} target="_blank" rel="noopener noreferrer" className="underline">
          {counter.source.name}
        </a>
      </p>
    </div>
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
      <div className="grid grid-cols-2 border-b border-line">
        <Big label="SEA LEVEL" value={sl ? `${sl.value} mm` : "–"} sub="since 1993, satellite altimetry" />
        <Big label="ARCTIC SEA ICE" value={ice?.value ?? "–"} sub="million km²" />
      </div>
      <Section open title="Global mean sea level (annual means)">
        <Spark values={sl?.history ?? []} color="var(--accent)" label="Global mean sea level, annual means" />
        <p className="mono mt-1 text-label text-dim">{sl?.trendLabel}</p>
        <p className="mt-1 text-label leading-relaxed text-dim">{sl?.note}</p>
      </Section>
      <Section title="Sea ice vs 1981–2010 mean">
        <ul>
          {(ice?.rows ?? []).map((r) => (
            <Bar key={r.label} label={r.label} value={r.value} pct={60} color={r.tone === "normal" ? "var(--accent)" : "var(--geo)"} />
          ))}
        </ul>
        <Spark values={ice?.history ?? []} color="var(--accent)" label="Arctic extent, last 90 days" />
        <p className="mono mt-1 text-label text-dim">{ice?.trendLabel}</p>
      </Section>
      <Section title="Land ice (published assessments)">
        <div className="space-y-2">
          <Published counter={c(world, "glaciers")} />
          <Published counter={c(world, "ice-sheets")} />
        </div>
        <p className="mt-2 text-label leading-relaxed text-dim">
          These come from multi-year scientific assessments, not a live feed, and are updated by hand when a new one is published.
        </p>
      </Section>
      <Section title="Tide gauges on the map">
        {median !== null ? (
          <p className="text-body leading-relaxed text-dim">
            {trends.length} stations; {rising} show rising relative sea level over the last 30 years (median {median > 0 ? "+" : ""}
            {median.toFixed(1)} mm/yr). Colour: blue falling, grey flat, amber rising, red fast. Relative sea level includes the land moving up or down, so a gauge can fall where the land is rising. Click a dot for its value.
          </p>
        ) : (
          <p className="text-body text-dim">Switch the Tide gauges layer on to load the stations.</p>
        )}
      </Section>
    </>
  );
}

export function AsteroidReadout({ world, file }: { world: WorldState; file: AsteroidsFile | null }) {
  const ctr = c(world, "asteroids");
  if (!file) {
    return (
      <p className="mono caret p-4 text-body text-dim" role="status">
        LOADING CLOSE APPROACHES
      </p>
    );
  }
  const byDist = [...file.approaches].sort((a, b) => a.ld - b.ld);
  const nearest = byDist[0];
  const inside = byDist.filter((a) => a.ld < 1).length;
  const soon = [...file.approaches].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 7);
  const size = (a: (typeof byDist)[number]) => (a.dMinM && a.dMaxM ? `${a.dMinM}–${a.dMaxM} m` : "?");
  return (
    <>
      {/* one dense header row: nearest approach, count inside the Moon's orbit, Sentry numbers */}
      <div className="flex items-stretch border-b border-line">
        <div className="min-w-0 flex-[1.4] border-r border-line px-3 py-2 last:border-r-0">
          <p className="label">Nearest</p>
          <p className="mono text-value font-bold leading-tight">
            {nearest ? `${nearest.ld.toFixed(2)} LD` : "–"}
          </p>
          <p className="mono truncate text-label text-dim">{nearest ? `${nearest.des} · ${nearest.date.slice(5, 11)}` : ""}</p>
        </div>
        <div className="flex-1 border-r border-line px-3 py-2 last:border-r-0">
          <p className="label">&lt; 1 LD</p>
          <p className="mono text-value font-bold leading-tight">{inside}</p>
          <p className="mono text-label text-dim">of {byDist.length}</p>
        </div>
        <div className="flex-1 border-r border-line px-3 py-2 last:border-r-0" title="NASA Sentry: objects with a non-zero impact chance in 100 years; Torino scale above 0">
          <p className="label">Sentry</p>
          <p className="mono text-value font-bold leading-tight">{file.sentry ? file.sentry.tracked : "–"}</p>
          <p className="mono text-label text-dim">{file.sentry ? `${file.sentry.torinoAbove0} above Torino 0` : "unavailable"}</p>
        </div>
      </div>

      {/* distance ribbon, one thin line: Earth at the left edge, the Moon's orbit as the amber tick */}
      <div className="border-b border-line px-3 py-2">
        <div className="relative h-4 border-y border-line" role="img" aria-label="Close approaches by distance in lunar distances">
          <div className="absolute inset-y-0 w-px bg-geo" style={{ left: `${(1 / file.maxLd) * 100}%` }} title="Moon orbit (1 LD)" />
          {byDist.map((a) => (
            <span
              key={a.des + a.date}
              className="absolute top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ left: `${Math.max(1, (a.ld / file.maxLd) * 100)}%`, background: a.ld < 1 ? "var(--geo)" : "var(--space)" }}
              title={`${a.des}: ${a.ld.toFixed(2)} LD`}
            />
          ))}
        </div>
        <p className="mono mt-0.5 flex justify-between text-label text-dim"><span>Earth</span><span>Moon 1 LD</span><span>{file.maxLd.toFixed(0)} LD</span></p>
      </div>

      <Section open title="Next approaches" meta={`${file.windowDays} d window`}>
        <table className="mono w-full text-body">
          <thead className="text-label text-dim">
            <tr className="text-left"><th className="pb-1 text-dim">UTC</th><th className="text-dim">OBJECT</th><th className="text-right text-dim">SIZE</th><th className="text-right text-dim">KM/S</th><th className="text-right text-dim">LD</th></tr>
          </thead>
          <tbody>
            {soon.map((a) => (
              <tr key={a.des + a.date} className="border-t border-line/50">
                <td className="py-0.5 text-dim">{a.date.slice(5, 11)}</td>
                <td className="font-bold">{a.des}</td>
                <td className="text-right text-dim">{size(a)}</td>
                <td className="text-right text-dim">{a.kms.toFixed(1)}</td>
                <td className="text-right font-bold" style={{ color: a.ld < 1 ? "var(--geo)" : "var(--space)" }}>{a.ld.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
      <Section title="About these numbers">
        <p className="text-body leading-relaxed text-dim">
          <Term id="ld">LD</Term> = lunar distance (384,400 km). A listed approach is a flyby, not an impact. Sizes are rough ranges from brightness (H) with two assumed reflectivities, not measurements.
          Sentry lists objects with a non-zero chance of impact within 100 years; <Term id="torino">Torino</Term> 0 means no hazard.{" "}
          {ctr ? `Source: ${ctr.source.name}, updated ${ctr.cadence}.` : ""}
        </p>
      </Section>
    </>
  );
}

export function OrbitReadout({ world, file }: { world: WorldState; file: OrbitFile | null }) {
  const ctr = c(world, "satellites");
  if (!file) {
    return (
      <p className="mono caret p-4 text-body text-dim" role="status">
        LOADING CATALOGUE SNAPSHOT
      </p>
    );
  }
  const { counts } = file;
  const max = Math.max(counts.satellites, counts.starlink, counts.debris, 1);
  const rows: [string, number, string][] = [
    ["Other satellites", counts.satellites, COLOR.accent],
    ["Starlink", counts.starlink, COLOR.dim],
    ["Tracked debris", counts.debris, COLOR.geo],
  ];
  return (
    <>
      <div className="flex items-stretch border-b border-line">
        <div className="flex-1 border-r border-line px-3 py-2 last:border-r-0">
          <p className="label">Active</p>
          <p className="mono text-value font-bold leading-tight">{(counts.satellites + counts.starlink).toLocaleString("en-US")}</p>
        </div>
        <div className="flex-1 border-r border-line px-3 py-2 last:border-r-0">
          <p className="label">Debris</p>
          <p className="mono text-value font-bold leading-tight">{counts.debris.toLocaleString("en-US")}</p>
        </div>
        <div className="flex-1 border-r border-line px-3 py-2 last:border-r-0">
          <p className="label">Snapshot</p>
          <p className="mono text-value font-bold leading-tight">{file.generatedAt.slice(11, 16)}</p>
          <p className="mono text-label text-dim">UTC</p>
        </div>
      </div>
      <Section open title="By kind">
        <ul>
          {rows.map(([label, n, color]) => (
            <Bar key={label} label={label} value={n.toLocaleString("en-US")} pct={(n / max) * 100} color={color} />
          ))}
        </ul>
      </Section>
      <Section title="Space stations (at the snapshot)">
        <ul className="mono text-body">
          {file.stations.map(([name, lon, lat, alt]) => (
            <li key={name} className="flex justify-between border-t border-line/50 py-0.5 first:border-0">
              <span className="font-bold">{name.replace(/ \(.*\)/, "")}</span>
              <span className="text-dim">{lat.toFixed(1)}°, {lon.toFixed(1)}° · {alt} km</span>
            </li>
          ))}
        </ul>
      </Section>
      <Section title="When is it overhead?">
        <PassFinder />
      </Section>
      <Section title="About this snapshot">
        <p className="text-body leading-relaxed text-dim">
          Positions are computed (SGP4) from published orbital elements for {file.generatedAt.slice(0, 16).replace("T", " ")} UTC. Satellites move about 7 km/s, so the dots show where objects were at that time, not where they are now. Debris covers four major breakups only, and small objects are not tracked.{" "}
          {ctr ? `Source: ${ctr.source.name}.` : ""}
        </p>
      </Section>
    </>
  );
}

const CLASS_LABEL: Record<string, string> = {
  TD: "Tropical depression",
  TS: "Tropical storm",
  HU: "Hurricane",
  STD: "Subtropical depression",
  STS: "Subtropical storm",
  PTC: "Post-tropical cyclone",
  PC: "Post-tropical cyclone",
  TY: "Typhoon",
};
const step = (kt: number) => (kt >= 137 ? 5 : kt >= 113 ? 4 : kt >= 96 ? 3 : kt >= 83 ? 2 : kt >= 64 ? 1 : 0);

export function WeatherReadout({ world, file, fires }: { world: WorldState; file: CyclonesFile | null; fires: FiresFile | null | "off" }) {
  const ctr = c(world, "cyclones");
  if (!file) {
    return (
      <p className="mono caret p-4 text-body text-dim" role="status">
        LOADING ADVISORIES
      </p>
    );
  }
  const storms = [...file.storms].sort((a, b) => b.windKt - a.windKt);
  const top = storms[0];
  return (
    <>
      <div className="flex items-stretch border-b border-line">
        <div className="flex-1 border-r border-line px-3 py-2 last:border-r-0">
          <p className="label">Active</p>
          <p className="mono text-value font-bold leading-tight">{storms.length}</p>
        </div>
        <div className="flex-[1.6] border-r border-line px-3 py-2 last:border-r-0">
          <p className="label">Strongest</p>
          <p className="mono text-value font-bold leading-tight">{top ? `${top.windKt} kt` : "–"}</p>
          <p className="mono truncate text-label text-dim">{top ? `${top.name}${step(top.windKt) ? ` · category ${step(top.windKt)}` : ""}` : "no active storms"}</p>
        </div>
      </div>
      <Section open title="Storms" meta="NHC advisories">
        {storms.length === 0 ? (
          <p className="text-body leading-relaxed text-dim">
            NHC has no active tropical cyclones in the Atlantic, East Pacific or Central Pacific right now. That is normal outside the main seasons.
          </p>
        ) : (
          <table className="mono w-full text-body">
            <thead className="text-label text-dim">
              <tr className="text-left"><th className="pb-1 text-dim">NAME</th><th className="text-dim">CLASS</th><th className="text-right text-dim">WIND</th><th className="text-right text-dim">MB</th><th className="text-right text-dim">MOVING</th></tr>
            </thead>
            <tbody>
              {storms.map((s) => (
                <tr key={s.id} className="border-t border-line/50">
                  <td className="py-0.5 font-bold"><a href={s.url} target="_blank" rel="noopener noreferrer" className="underline">{s.name}</a></td>
                  <td className="text-dim" title={CLASS_LABEL[s.cls] ?? s.cls}>{s.cls}</td>
                  <td className="text-right font-bold" style={{ color: step(s.windKt) >= 3 ? "var(--threat)" : step(s.windKt) >= 1 ? "var(--geo)" : "var(--fg)" }}>{s.windKt} kt</td>
                  <td className="text-right text-dim">{s.pressureMb ?? "–"}</td>
                  <td className="text-right text-dim">{s.dir !== null && s.speedKt !== null ? `${s.dir}° ${s.speedKt} kt` : "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
      <Section title="Active fires (NASA FIRMS)" meta={fires && fires !== "off" ? `${fires.total.toLocaleString("en-US")} hot pixels` : undefined}>
        {fires && fires !== "off" ? (
          <p className="text-body leading-relaxed text-dim">
            {fires.total.toLocaleString("en-US")} satellite hot-pixel detections in the last 24 hours, summed on a 0.5 degree grid ({fires.cells.length.toLocaleString("en-US")} cells; low-confidence pixels removed). A detection is a hot spot, not a confirmed wildfire: it includes agricultural burns and gas flares.
          </p>
        ) : (
          <p className="text-body leading-relaxed text-dim">
            {fires === "off" ? "Fire detections are not enabled on this deployment: the data job needs a free NASA FIRMS key (FIRMS_MAP_KEY)." : "Loading…"}
          </p>
        )}
      </Section>
      <Section title="About these numbers">
        <p className="text-body leading-relaxed text-dim">
          Sustained one-minute wind in knots (1 kt = 1.15 mph = 1.85 km/h) and the position from the latest NHC advisory, issued about every six hours; the storm has moved since. Colour steps follow the Saffir-Simpson scale. NHC forecast tracks are not drawn here. Only the Atlantic, East Pacific and Central Pacific are covered; West Pacific typhoons and Indian Ocean cyclones are not.{" "}
          {ctr ? `Source: ${ctr.source.name}.` : ""}
        </p>
      </Section>
    </>
  );
}

/** The three NOAA space weather scales as chips: G geomagnetic storms, S radiation storms, R radio blackouts. */
export function ScaleChips({ solar, picked, onPick }: { solar: { data: SolarNow | null; failed: boolean }; picked: "G" | "S" | "R" | null; onPick: (k: "G" | "S" | "R") => void }) {
  const sc = solar.data?.scales;
  if (!sc) {
    return (
      <p className="mono px-3 py-2 text-body text-dim" role="status">
        {solar.failed || solar.data ? "NOAA scales unavailable right now." : "LOADING NOAA SCALES"}
      </p>
    );
  }
  return (
    <div className="flex gap-1.5 border-b border-line px-3 py-2" role="group" aria-label="NOAA space weather scales">
      {(["G", "S", "R"] as const).map((k) => {
        const level = sc[k].n;
        const color = level >= 3 ? "var(--threat)" : level >= 1 ? "var(--geo)" : "var(--fg-dim)";
        return (
          <button
            key={k}
            type="button"
            aria-pressed={picked === k}
            onClick={() => onPick(k)}
            className="btn mono flex-1 px-2 py-1 text-center"
            style={{ "--c": color, color } as React.CSSProperties}
            title={`${k}${level}: ${sc[k].text}. Click for what the scale means.`}
          >
            <span className="block text-body font-bold">{k}{level}</span>
            <span className="block text-label text-dim">{sc[k].text}</span>
          </button>
        );
      })}
    </div>
  );
}
