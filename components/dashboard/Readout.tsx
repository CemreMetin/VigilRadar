"use client";

import { arsenals } from "@/lib/arsenals";
import { relTime } from "@/lib/format";
import type { Mode } from "@/lib/lenses";
import type { AsteroidsFile, Counter, CyclonesFile, MonitorEvent, OrbitFile, TideGaugesFile, WorldState } from "@/lib/types";
import { AsteroidReadout, IceReadout, OrbitReadout, WeatherReadout } from "./ExtraReadouts";
import { Bar, Big, Section } from "./parts";

/**
 * Right panel, "Readout" tab: read-only analysis for the active scenario. Nothing here changes the map
 * except picking an item from a list, which selects it. Bars and gauges are flat and have no axes.
 */

const n = (v: number) => v.toLocaleString("en-US");
const num = (s: string) => Number(s.replace(/[,%+]/g, "").replace("−", "-"));

function QuakeList({ quakes, now, selectedId, onSelect, limit = 6 }: { quakes: MonitorEvent[]; now: number | null; selectedId: string | null; onSelect: (id: string) => void; limit?: number }) {
  if (quakes.length === 0) return <p className="text-xs text-dim">No earthquakes match the filters.</p>;
  return (
    <ul className="divide-y divide-line border border-line">
      {quakes.slice(0, limit).map((e) => (
        <li key={e.id}>
          <button
            type="button"
            onClick={() => onSelect(e.id)}
            aria-current={e.id === selectedId}
            className={`flex w-full items-center gap-3 px-2.5 py-1.5 text-left hover:bg-accent/10 ${e.id === selectedId ? "bg-accent/15" : ""}`}
          >
            <span className="mono w-9 shrink-0 text-center text-xs font-bold text-geo">{e.magnitude?.toFixed(1)}</span>
            <span className="min-w-0">
              <span className="block truncate text-[12px] font-bold">{e.title.replace(/^M [\d.]+ - /, "")}</span>
              <span className="mono text-[10px] font-light text-dim">{now ? relTime(e.startedAt, now) : ""} · {Math.round(e.depthKm ?? 0)} km deep</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function KpGauge({ counter }: { counter: Counter }) {
  const kp = counter.numeric ?? 0;
  const hist = (counter.history ?? []).slice(-8); // last 24 hours, 3-hour values
  const peak = hist.length ? Math.max(...hist) : kp;
  return (
    <>
      <div className="flex items-baseline gap-3">
        <span className="mono readout-in text-3xl font-bold" style={{ color: kp >= 5 ? "var(--threat)" : "var(--space)" }}>{counter.value}</span>
        <span className="mono text-[11px] font-light text-dim">Kp now · {counter.unit?.split("·")[1]?.trim()}</span>
      </div>
      {/* nine segments: Kp 0-9. Filled up to the current value; a tick marks the 24 h peak. */}
      <div className="mt-3 flex gap-0.5" role="img" aria-label={`Kp ${counter.value} of 9, 24 hour peak ${peak.toFixed(1)}`}>
        {Array.from({ length: 9 }, (_, i) => {
          const fill = Math.max(0, Math.min(1, kp - i));
          const storm = i >= 4;
          return (
            <div key={i} className="relative h-4 flex-1 bg-line">
              <div className="absolute inset-y-0 left-0" style={{ width: `${fill * 100}%`, background: storm ? "var(--threat)" : "var(--space)" }} />
              {Math.floor(peak) === i && peak > 0 && <div className="absolute inset-x-0 -bottom-1.5 mx-auto h-1 w-1 rounded-full bg-fg" aria-hidden />}
            </div>
          );
        })}
      </div>
      <div className="mono mt-2 flex justify-between text-[9px] font-light text-dim">
        <span>0</span><span>quiet</span><span className="text-threat">5 storm (G1)</span><span>9</span>
      </div>
      {hist.length > 1 && (
        <div className="mt-4">
          <p className="label">Last 24 h (3-hour values)</p>
          <div className="mt-1.5 flex h-10 items-end gap-0.5" role="img" aria-label="Kp over the last 24 hours">
            {hist.map((v, i) => (
              <div key={i} className="flex-1" style={{ height: `${Math.max(6, (v / 9) * 100)}%`, background: v >= 5 ? "var(--threat)" : "var(--space)", opacity: 0.35 + (i / hist.length) * 0.65 }} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default function Readout({
  mode,
  world,
  quakes,
  now,
  selectedId,
  onSelect,
  asteroids,
  tide,
  orbit,
  cyclones,
}: {
  mode: Mode;
  world: WorldState | null;
  quakes: MonitorEvent[];
  now: number | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  asteroids: AsteroidsFile | null;
  tide: TideGaugesFile | null;
  orbit: OrbitFile | null;
  cyclones: CyclonesFile | null;
}) {
  if (!world) {
    return (
      <p className="mono caret p-4 text-xs font-light text-dim" role="status">
        INITIALIZING FEEDS
      </p>
    );
  }
  const c = (id: string) => world.counters.find((x) => x.id === id);
  const outbreaks = world.events.filter((e) => e.domain === "health");
  const countries = new Set(outbreaks.flatMap((e) => e.countries));

  if (mode.id === "overview") {
    const all = world.events.filter((e) => e.kind === "quake");
    const d1 = all.filter((e) => (e.magnitude ?? 0) >= 5 && now !== null && new Date(e.startedAt).getTime() >= now - 86_400_000).length;
    const strongest = all.reduce<MonitorEvent | null>((b, e) => (!b || (e.magnitude ?? 0) > (b.magnitude ?? 0) ? e : b), null);
    const up = world.volcanoes.filter((v) => v.level === "elevated").length;
    return (
      <>
        <div className="grid grid-cols-2 gap-px border-b border-line bg-line">
          <Big label="M5+ · 24H" value={String(d1)} color="var(--geo)" />
          <Big label="STRONGEST · 7D" value={strongest ? `M${strongest.magnitude?.toFixed(1)}` : "–"} color="var(--geo)" />
          <Big label="WHO REPORTS · 90D" value={c("outbreaks")?.value ?? "–"} color="var(--bio)" sub={`${countries.size} countries`} />
          <Big label="VOLCANOES ABOVE BASELINE" value={`${up}/${world.volcanoes.length}`} color={up ? "var(--threat)" : "var(--fg)"} />
        </div>
        <Section open title="Recent earthquakes">
          <QuakeList quakes={quakes} now={now} selectedId={selectedId} onSelect={onSelect} />
        </Section>
      </>
    );
  }

  if (mode.id === "nuclear") {
    const clock = c("doomsday-clock");
    const dyads = [...world.dyads].filter((d) => d.tension != null).sort((a, b) => (b.tension ?? 0) - (a.tension ?? 0)).slice(0, 6);
    const top = [...arsenals.countries].sort((a, b) => b.stockpile - a.stockpile).slice(0, 5);
    const seconds = [100, 100, 100, 90, 90, 89, 85]; // Doomsday Clock settings, 2020-2026 (Bulletin of the Atomic Scientists)
    return (
      <>
        <div className="grid grid-cols-2 gap-px border-b border-line bg-line">
          <Big label="DOOMSDAY CLOCK" value={clock?.value ?? "–"} color="var(--threat)" sub="to midnight (symbolic)" />
          <Big label="MILITARY STOCKPILE" value={n(arsenals.totals.stockpile)} color="var(--geo)" sub="warheads, Jan 2026" />
        </div>
        <Section title="Clock setting, 2020 to 2026 (seconds)">
          <div className="flex h-10 items-end gap-1" role="img" aria-label="Doomsday Clock seconds to midnight 2020 to 2026: 100, 100, 100, 90, 90, 89, 85">
            {seconds.map((s, i) => (
              <div key={i} className="flex-1" style={{ height: `${((120 - s) / 40) * 100}%`, minHeight: 6, background: i === seconds.length - 1 ? "var(--threat)" : "var(--line-strong)" }} title={`${2020 + i}: ${s} s`} />
            ))}
          </div>
          <p className="mono mt-1 text-[10px] font-light text-dim">Taller bar = closer to midnight. Source: Bulletin of the Atomic Scientists.</p>
        </Section>
        <Section open title="Tension between pairs (media coverage, 0-100)">
          <ul>
            {dyads.map((d) => (
              <li key={d.label} className="border-b border-line/50 pb-1.5 last:border-0">
                <ul><Bar label={`${d.label}${d.sensitive ? " *" : ""}`} value={String(d.tension)} pct={d.tension ?? 0} color={(d.tension ?? 0) >= 55 ? "var(--threat)" : (d.tension ?? 0) >= 40 ? "var(--conflict)" : "var(--geo)"} hint={d.why} /></ul>
                {d.why && <p className="text-[10px] font-light leading-snug text-dim">Why drawn: {d.why}</p>}
              </li>
            ))}
          </ul>
          <p className="mt-1 text-[10px] font-light leading-relaxed text-dim">Describes how news reports each pair; not a forecast. * Politically sensitive: the pair is listed for the reason given, which is not an accusation.</p>
        </Section>
        <Section title="Largest arsenals (military stockpile)">
          <ul>
            {top.map((a) => (
              <Bar key={a.iso3} label={a.name} value={n(a.stockpile)} pct={(a.stockpile / top[0].stockpile) * 100} color="var(--threat)" />
            ))}
          </ul>
        </Section>
      </>
    );
  }

  if (mode.id === "bio") {
    const seen = new Set<string>();
    const latest = outbreaks.filter((e) => (seen.has(e.title) ? false : (seen.add(e.title), true))).slice(0, 6);
    const byCountry = new Map<string, number>();
    for (const e of outbreaks) for (const iso of e.countries) byCountry.set(iso, (byCountry.get(iso) ?? 0) + 1);
    return (
      <>
        <div className="grid grid-cols-2 gap-px border-b border-line bg-line">
          <Big label="WHO REPORTS · 90D" value={c("outbreaks")?.value ?? "–"} color="var(--bio)" />
          <Big label="COUNTRIES · 120D" value={String(countries.size)} color="var(--bio)" sub="named in a report" />
        </div>
        <Section open title="Latest WHO reports">
          <ul className="divide-y divide-line border border-line">
            {latest.map((e) => (
              <li key={e.id}>
                <button type="button" onClick={() => onSelect(`health:${e.countries[0]}`)} className="block w-full px-2.5 py-1.5 text-left hover:bg-accent/10">
                  <span className="block text-[12px] font-bold leading-snug">{e.title}</span>
                  <span className="mono text-[10px] font-light text-dim">{e.startedAt.slice(0, 10)}</span>
                </button>
              </li>
            ))}
            {latest.length === 0 && <li className="px-2.5 py-2 text-xs text-dim">No reports in the last 120 days.</li>}
          </ul>
          <p className="mt-2 text-[10px] font-light leading-relaxed text-dim">A count of published reports, not of outbreaks. Markers sit at country centres.</p>
        </Section>
      </>
    );
  }

  if (mode.id === "volcano") {
    return (
      <>
        <Section open title="Supervolcano watchlist">
          <ul className="divide-y divide-line border border-line">
            {world.volcanoes.map((v) => {
              const col = v.level === "elevated" ? "var(--threat)" : v.level === "normal" ? "var(--safe)" : "var(--fg-dim)";
              return (
                <li key={v.id}>
                  <button type="button" onClick={() => onSelect(`volcano:${v.id}`)} className="flex w-full items-center gap-3 px-2.5 py-1.5 text-left hover:bg-accent/10">
                    <span className="inline-block h-2.5 w-2.5 shrink-0" style={{ background: col }} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12px] font-bold">{v.name}</span>
                      <span className="mono block truncate text-[10px] font-light text-dim">{v.levelLabel}</span>
                    </span>
                    {v.quakes30d && <span className="mono shrink-0 text-[10px] text-dim" title="earthquakes in the last 30 days nearby">{n(v.quakes30d.count)} q</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </Section>
        <Section title="Recent earthquakes">
          <QuakeList quakes={quakes} now={now} selectedId={selectedId} onSelect={onSelect} limit={5} />
        </Section>
      </>
    );
  }

  if (mode.id === "conflict") {
    const news = c("conflict-news");
    const choke = c("chokepoints");
    const rows = (news?.rows ?? []).map((r) => ({ label: r.label, v: num(r.value) }));
    const max = Math.max(1, ...rows.map((r) => r.v));
    return (
      <>
        <div className="grid grid-cols-2 gap-px border-b border-line bg-line">
          <Big label="CONFLICT REPORTS · 7D" value={news?.value ?? "–"} color="var(--conflict)" sub={news?.trendLabel} />
          <Big label="CHOKEPOINTS LOW" value={choke?.value ?? "–"} color="var(--geo)" sub="of tracked straits and canals" />
        </div>
        <Section open title="Most-reported countries (armed conflict, 7 d)">
          <ul>
            {rows.map((r) => (
              <Bar key={r.label} label={r.label} value={n(r.v)} pct={(r.v / max) * 100} color="var(--conflict)" />
            ))}
          </ul>
          <p className="mt-1 text-[10px] font-light leading-relaxed text-dim">How much is reported, not casualties. High-coverage countries are over-represented.</p>
        </Section>
        <Section title="Shipping chokepoints vs the past year">
          <ul>
            {(choke?.rows ?? []).map((r) => {
              const v = num(r.value);
              return <Bar key={r.label} label={r.label} value={r.value} pct={Math.abs(v)} color={r.tone === "high" ? "var(--threat)" : r.tone === "elevated" ? "var(--geo)" : "var(--accent)"} />;
            })}
          </ul>
          <p className="mt-1 text-[10px] font-light leading-relaxed text-dim">Bar length is the size of the change, up or down. Source: IMF PortWatch.</p>
        </Section>
      </>
    );
  }

  if (mode.id === "weather") return <WeatherReadout world={world} file={cyclones} />;
  if (mode.id === "orbit") return <OrbitReadout world={world} file={orbit} />;
  if (mode.id === "ice") return <IceReadout world={world} tide={tide} />;
  if (mode.id === "asteroid") return <AsteroidReadout world={world} file={asteroids} />;

  // solar
  const kp = c("kp");
  return (
    <>
      <Section open title="Geomagnetic activity">{kp ? <KpGauge counter={kp} /> : <p className="text-xs text-dim">Kp unavailable.</p>}</Section>
      <Section title="Why it matters">
        <p className="text-[12px] font-light leading-relaxed text-dim">
          Storms induce currents in long power lines and pipelines, strongest near the magnetic poles. The amber and red lines on the map are 50° and
          60° geomagnetic latitude; cyan cables cross the 50° band.
        </p>
      </Section>
    </>
  );
}
