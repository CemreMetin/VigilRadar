"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import LaplacePanel from "@/components/laplace/LaplacePanel";
import ShockChips from "@/components/laplace/ShockChips";
import SimControls from "@/components/laplace/SimControls";
import { SIM_UI } from "@/core/laplace/copy";
import { decodeSimQuery, encodeSimQuery, simulate } from "@/core/laplace/engine";
import { shockById } from "@/core/laplace/shocks";
import type { ShockId, SimQuery } from "@/core/laplace/types";
import { agoText } from "@/lib/radar/format";
import { useCountries } from "@/lib/radar/useCountries";
import { useNow } from "@/lib/radar/useNow";
import { useRadar } from "@/lib/radar/useRadar";
import { useT } from "@/lib/radar/useT";
import { useSearch, writeSearch } from "@/lib/useSearch";
import RadarMap, { type Selection } from "./RadarMap";
import StatusLine from "./StatusLine";
import TopBar, { type Mode } from "./TopBar";
import TriageCard from "./TriageCard";

// One map, two modes that never overlap: LIVE (recent events and the triage card) and SIMULATE (the Laplace cascade).
interface Screen { search: string | null; mode: Mode; sim: SimQuery; selected: Selection | null }
const INITIAL: Screen = { search: null, mode: "live", sim: decodeSimQuery(""), selected: null };

/** `?mode=sim&shock=…` opens that simulation, `?q=<event id>` opens LIVE with that quake selected. */
function fromUrl(search: string, was: Screen): Screen {
  const p = new URLSearchParams(search);
  if (p.get("mode") === "sim") return { search, mode: "sim", sim: decodeSimQuery(search), selected: null };
  const q = p.get("q");
  return { search, mode: "live", sim: was.sim, selected: q ? { kind: "quake", id: q } : null };
}

export default function RadarScreen() {
  const search = useSearch();
  const [screen, setScreen] = useState(INITIAL);
  if (screen.search !== search) setScreen(fromUrl(search, screen)); // adjust during render when the address changes
  const { mode, sim: query, selected } = screen;
  const simulating = mode === "sim";

  const { loaded, done } = useRadar();
  const now = useNow();
  const { t, lang, c } = useT();
  const countries = useCountries(simulating);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const state = loaded?.state ?? null;
  const recent = (state?.quakes ?? []).filter((q) => !q.retracted).slice(0, 10);
  const asideRef = useRef<HTMLElement>(null);

  const change = useCallback((patch: Partial<SimQuery>) => setScreen((s) => ({ ...s, sim: { ...s.sim, ...patch } })), []);
  const select = useCallback((sel: Selection | null) => setScreen((s) => ({ ...s, selected: sel })), []);
  const setMode = (m: Mode) => writeSearch(m === "sim" ? encodeSimQuery(query) : "");
  const openShock = (shock: ShockId) => writeSearch(encodeSimQuery({ ...query, shock, day: shockById(shock).defaultDay }));
  const pickShock = (shock: ShockId) => { if (shock !== query.shock) change({ shock, day: shockById(shock).defaultDay }); };

  const result = useMemo(() => (simulating && countries ? simulate({ shock: query.shock, severity: query.severity, day: query.day }, countries) : null), [simulating, countries, query.shock, query.severity, query.day]);
  const iso3 = result && query.country && result.byIso3[query.country] ? query.country : lang === "tr" ? "TUR" : "USA";
  const selectedName = result?.byIso3[iso3]?.mapName ?? "";
  const view = useMemo(() => (result ? { result, selected: selectedName } : null), [result, selectedName]);
  const pickByName = useCallback((name: string) => { const hit = countries?.find((x) => x.mapName === name); if (hit) change({ country: hit.iso3 }); }, [countries, change]);

  useEffect(() => {
    if (!selected) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") select(null); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [selected, select]);

  // the card sits at the top of the panel; bring it into view on every new selection
  useEffect(() => {
    if (!selected) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    asideRef.current?.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }, [selected]);

  const open = simulating || !!selected;

  return (
    <div lang={lang} className="flex h-dvh flex-col bg-bg">
      <TopBar mode={mode} lang={lang} onMode={setMode} />
      <main className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {simulating && <ShockChips shock={query.shock} lang={lang} onPick={pickShock} />}
          <div className="relative min-h-0 flex-1">
            <RadarMap state={state} nowMs={loaded?.lastOkMs ?? 0} sim={view} selected={selected} onSelect={select} onCountry={pickByName}
              label={simulating ? SIM_UI.mapLabel[lang] : "World map of recent earthquakes and the assets they may affect. The list of recent events is the keyboard alternative."} />
          </div>
        </div>
        <aside ref={asideRef} className={`scroll-thin overflow-auto border-t border-line bg-panel-solid md:max-h-none md:w-[380px] md:shrink-0 md:border-l md:border-t-0 ${simulating ? (drawerOpen ? "h-[46dvh] md:h-auto" : "h-auto md:h-auto") : open ? "max-h-[58dvh]" : "max-h-[40dvh]"}`}>
          {simulating ? (
            <>
              <button
                type="button"
                onClick={() => setDrawerOpen((o) => !o)}
                aria-expanded={drawerOpen}
                className="mono flex min-h-9 w-full items-center justify-between border-b border-line px-3 py-1.5 text-body text-fg md:hidden"
              >
                <span>{result ? `${result.byIso3[iso3]?.name[lang]} · ${result.byIso3[iso3]?.total}/100` : SIM_UI.loading[lang]}</span>
                <span className="text-dim" aria-hidden>{drawerOpen ? "▾" : "▴"}</span>
              </button>
              <div className={drawerOpen ? "block" : "hidden md:block"}>
                {result && countries ? <LaplacePanel result={result} countries={countries} iso3={iso3} lang={lang} onCountry={(country) => { change({ country }); setDrawerOpen(true); }} />
                  : <p className="mono p-3 text-body text-dim" role="status">{SIM_UI.loading[lang]}</p>}
              </div>
            </>
          ) : (
            <>
              {selected && state && <TriageCard state={state} sel={selected} now={now || loaded?.lastOkMs || 0} onClose={() => select(null)} onSimulate={openShock} />}
              <details open={!selected} key={selected ? "card" : "list"}>
                <summary className="label cursor-pointer p-3">{t("recentEvents")}</summary>
                <ul className="divide-y divide-line" aria-label={t("recentEvents")}>
                  {recent.map((q) => (
                    <li key={q.id}>
                      <button type="button" onClick={() => select({ kind: "quake", id: q.id })} aria-pressed={selected?.id === q.id}
                        className={`mono block w-full px-3 py-2 text-left text-body hover:bg-panel-solid ${selected?.id === q.id ? "text-accent" : ""}`}>
                        M{q.best.mag} · {q.best.place} · {agoText(now - q.best.timeMs, t)}
                      </button>
                    </li>
                  ))}
                  {state && recent.length === 0 && <li className="p-3 text-body text-dim">{t("noEvents")}</li>}
                </ul>
              </details>
              <p className="border-t border-line p-3 text-label text-dim">{c.disclaimer}</p>
            </>
          )}
        </aside>
      </main>
      <footer className="border-t border-line">
        {simulating ? <SimControls query={{ ...query, country: iso3 }} lang={lang} onChange={change} /> : <StatusLine loaded={loaded} done={done} now={now} />}
      </footer>
    </div>
  );
}
