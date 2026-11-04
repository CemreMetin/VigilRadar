"use client";

import { arsenals } from "@/lib/arsenals";
import { relTime } from "@/lib/format";
import type { Mode } from "@/lib/lenses";
import { nearestSite } from "@/lib/blast";
import type { AsteroidsFile, Counter, CyclonesFile, FiresFile, SolarNow, TargetsFile, MonitorEvent, OrbitFile, TideGaugesFile, WorldState } from "@/lib/types";
import { AsteroidReadout, IceReadout, OrbitReadout, WeatherReadout } from "./ExtraReadouts";
import { Term } from "../ui";
import { Bar, Big, Section, Spark } from "./parts";

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
        <span className="mono text-[11px] font-light text-dim"><Term id="kp">Kp</Term> now · {counter.unit?.split("·")[1]?.trim()}</span>
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
  fires,
  solar,
  scaleDetail,
  targets,
  userPlace,
  onUseLocation,
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
  fires: FiresFile | null | "off";
  solar: { data: SolarNow | null; failed: boolean };
  scaleDetail: "G" | "S" | "R" | null;
  targets: { data: TargetsFile | null; failed: boolean };
  userPlace: { lat: number; lon: number; label: string } | null;
  onUseLocation: () => void;
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
        <div className="grid grid-cols-2 border-b border-line">
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
        <div className="grid grid-cols-2 border-b border-line">
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
        <Section title="Possible target areas (illustrative)">
          <p className="text-[11px] font-light leading-relaxed text-dim">
            An illustrative model, not a forecast: sites that open sources associate with nuclear forces, plus capitals, so the map can show what one fixed example explosion (300 kt, an airburst) would reach. It says nothing about intentions or likelihood, and the list is partial. Switch the layer on and click a marker for the rings.
          </p>
          {targets.failed ? (
            <p className="mt-2 text-[11px] text-dim">The reference list is unavailable right now.</p>
          ) : targets.data ? (
            (() => {
              const near = userPlace ? nearestSite(userPlace.lat, userPlace.lon, targets.data.sites.map((x) => ({ name: x[0], lat: x[1], lon: x[2] }))) : null;
              return (
                <div className="mt-2">
                  {near && userPlace ? (
                    <p className="text-[12px] leading-relaxed">
                      Distance from {userPlace.label} to the nearest listed site: <span className="mono font-bold">{Math.round(near.km).toLocaleString("en-US")} km</span> <span className="font-light text-dim">({near.site.name})</span>
                    </p>
                  ) : (
                    <p className="text-[11px] font-light leading-relaxed text-dim">Pick a place in the search box on the left, or use your location, to see the distance to the nearest listed site.</p>
                  )}
                  <button type="button" className="btn mono mt-1.5 px-2 py-1 text-[11px] font-bold" onClick={onUseLocation} title="Uses this device location; it stays in your browser and is never sent anywhere">
                    USE MY LOCATION
                  </button>
                </div>
              );
            })()
          ) : (
            <p className="mt-2 text-[11px] text-dim">Loading the list…</p>
          )}
        </Section>
      </>
    );
  }

  if (mode.id === "bio") {
    const seen = new Set<string>();
    const latest = outbreaks.filter((e) => (seen.has(e.title) ? false : (seen.add(e.title), true))).slice(0, 6);
    const pheic = c("pheic");
    const pheicDays = pheic?.eventDate && now !== null ? Math.floor((now - Date.parse(pheic.eventDate)) / 86_400_000) : null;
    return (
      <>
        <div className="grid grid-cols-2 border-b border-line">
          <Big label="WHO REPORTS · 90D" value={c("outbreaks")?.value ?? "–"} color="var(--bio)" />
          <Big
            label="DAYS SINCE LAST WHO EMERGENCY CHANGE"
            value={pheicDays === null ? "–" : String(pheicDays)}
            color="var(--bio)"
            sub={pheic ? `${pheic.value} ${pheic.unit ?? ""}; polio still in force` : "unavailable"}
          />
        </div>
        {latest[0] && (
          <p className="border-b border-line px-3 py-2 text-[11px] font-light leading-relaxed text-dim">
            Most recent report: <span className="font-bold text-fg">{latest[0].title}</span> ({latest[0].startedAt.slice(0, 10)})
          </p>
        )}
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
          <p className="mt-2 text-[10px] font-light leading-relaxed text-dim">A count of published reports, not of outbreaks. Countries are shaded by reports in the last 90 days; click one on the map for the list. The purple rings are the busiest airports (how fast a new pathogen can travel); the outlined rings are a partial list of BSL-4 laboratories, reference data and not a risk ranking.</p>
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
        <div className="grid grid-cols-2 border-b border-line">
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

  if (mode.id === "weather") return <WeatherReadout world={world} file={cyclones} fires={fires} />;
  if (mode.id === "orbit") return <OrbitReadout world={world} file={orbit} />;
  if (mode.id === "ice") return <IceReadout world={world} tide={tide} />;
  if (mode.id === "asteroid") return <AsteroidReadout world={world} file={asteroids} />;

  return <SolarReadout kp={c("kp")} solar={solar} scaleDetail={scaleDetail} />;
}

const SCALE_INFO = {
  G: { what: "Geomagnetic storms, from the planetary Kp index. They disturb power grids, satellites, radio and the aurora.", levels: [["G1", "Kp 5, minor"], ["G2", "Kp 6, moderate"], ["G3", "Kp 7, strong"], ["G4", "Kp 8, severe"], ["G5", "Kp 9, extreme"]] },
  S: { what: "Solar radiation storms, from the flux of energetic protons (at least 10 MeV, in particles per cm² per s per steradian). They affect satellites, astronauts and polar flights.", levels: [["S1", "10, minor"], ["S2", "100, moderate"], ["S3", "1,000, strong"], ["S4", "10,000, severe"], ["S5", "100,000, extreme"]] },
  R: { what: "Radio blackouts, from the peak X-ray flux of solar flares. They degrade high-frequency radio on the sunlit side of the Earth.", levels: [["R1", "M1 flare, minor"], ["R2", "M5, moderate"], ["R3", "X1, strong"], ["R4", "X10, severe"], ["R5", "X20, extreme"]] },
} as const;

/** Solar scenario readout: Kp, the NOAA scales, solar wind, flares, the Kp forecast (a projection), and why cables and grids matter. */
function SolarReadout({ kp, solar, scaleDetail }: { kp: Counter | undefined; solar: { data: SolarNow | null; failed: boolean }; scaleDetail: "G" | "S" | "R" | null }) {
  const d = solar.data;
  const na = <span className="text-dim">unavailable</span>;
  const forecast = (d?.kpForecast ?? []).filter((r) => r.kind === "predicted").slice(0, 24);
  return (
    <>
      {scaleDetail && (
        <Section open title={`NOAA ${scaleDetail} scale`} meta={d?.scales ? `now ${scaleDetail}${d.scales[scaleDetail].n}` : undefined}>
          <p className="text-[12px] font-light leading-relaxed text-dim">{SCALE_INFO[scaleDetail].what} <Term id="noaa-scales">About the G, S and R scales</Term></p>
          <table className="mono mt-2 w-full text-[11px]">
            <tbody>
              {SCALE_INFO[scaleDetail].levels.map(([lvl, def]) => (
                <tr key={lvl} className="border-t border-line/50" style={{ color: d?.scales?.[scaleDetail].n === Number(lvl.slice(1)) ? "var(--fg)" : "var(--fg-dim)" }}>
                  <td className="py-0.5 font-bold">{lvl}</td>
                  <td className="text-right font-light">{def}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mono mt-1 text-[10px] font-light text-dim">
            Definitions: <a className="underline" href="https://www.swpc.noaa.gov/noaa-scales-explanation" target="_blank" rel="noopener noreferrer">NOAA space weather scales</a>. The level now is observed ({d?.scales ? d.scales[scaleDetail].text : "unavailable"}), not forecast.
          </p>
        </Section>
      )}
      <Section open title="Geomagnetic activity">{kp ? <KpGauge counter={kp} /> : <p className="text-xs text-dim">Kp unavailable.</p>}</Section>
      <Section open title="Solar wind and flares (observed)" meta={solar.failed ? "unavailable" : undefined}>
        {solar.failed && <p className="text-[11px] text-dim">NOAA space-weather products are unavailable right now.</p>}
        {!solar.failed && !d && <p className="text-[11px] text-dim">Loading…</p>}
        {d && (
          <ul className="mono space-y-2 text-[11px]">
            <li>
              <div className="flex justify-between"><span className="text-dim">Wind speed</span><span className="font-bold">{d.wind ? `${d.wind.speed} km/s${d.wind.density !== null ? ` · ${d.wind.density} p/cm³` : ""}` : na}</span></div>
              {d.wind && <Spark values={d.wind.speedHistory} color="var(--space)" label="Solar wind speed, last 3 hours" />}
            </li>
            <li>
              <div className="flex justify-between">
                <span className="text-dim" title="Bz pointing south (negative) lets the solar wind couple with the Earth's field">Bz (GSM)</span>
                <span className="font-bold" style={{ color: d.bz && d.bz.value <= -10 ? "var(--threat)" : undefined }}>{d.bz ? `${d.bz.value.toFixed(1)} nT${d.bz.value < 0 ? " (south)" : ""}` : na}</span>
              </div>
              {d.bz && <Spark values={d.bz.history} color="var(--space)" label="Bz, last 3 hours" />}
            </li>
            <li className="flex justify-between"><span className="text-dim">X-ray flare class</span><span className="font-bold">{d.xray ? `${d.xray.current} now · peak ${d.xray.peak24h} (24 h)` : na}</span></li>
          </ul>
        )}
      </Section>
      <Section title="Kp forecast (NOAA projection)">
        {forecast.length === 0 ? (
          <p className="text-[11px] text-dim">{solar.failed ? "Unavailable right now." : "No forecast loaded."}</p>
        ) : (
          <>
            <div className="flex h-12 items-end gap-0.5" role="img" aria-label="NOAA three-day Kp forecast">
              {forecast.map((r) => (
                <div key={r.time} className="flex-1" title={`${r.time.slice(0, 16).replace("T", " ")} UTC: Kp ${r.kp}`} style={{ height: `${Math.max(6, (r.kp / 9) * 100)}%`, border: "1px dashed var(--geo)", background: r.kp >= 5 ? "rgba(255,0,60,0.25)" : "transparent" }} />
              ))}
            </div>
            <p className="mono mt-1 text-[10px] font-light text-dim">Dashed amber = NOAA projection for the next 3 days, 3-hour steps; not observed and not ours.</p>
          </>
        )}
      </Section>
      <Section title="Why it matters">
        <p className="text-[12px] font-light leading-relaxed text-dim">
          Storms induce currents in long conductors, strongest near the magnetic poles: power lines, pipelines and the powered repeaters of undersea internet cables. The map shades countries by the share of their power capacity at high geomagnetic latitude, and shows the cables that cross the 50° band.
        </p>
      </Section>
    </>
  );
}
