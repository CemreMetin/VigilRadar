"use client";

import LangSwitch from "@/components/LangSwitch";
import { MainNav } from "@/components/SiteNav";
import { SIM_UI } from "@/core/laplace/copy";
import type { Lang } from "@/lib/lang";

export type Mode = "live" | "sim";

/** One row: the brand, the two modes, the three pages and the language. */
export default function TopBar({ mode, lang, onMode }: { mode: Mode; lang: Lang; onMode: (m: Mode) => void }) {
  return (
    <header className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-line px-3 py-1 md:h-[52px] md:flex-nowrap">
      <h1 className="mono text-read font-bold tracking-[0.2em] text-accent">VIGILRADAR</h1>
      <div className="flex" role="group" aria-label={SIM_UI.mode[lang]}>
        {([["live", "●", "live"], ["sim", "◈", "simulate"]] as const).map(([m, icon, key]) => (
          <button key={m} type="button" aria-pressed={mode === m} onClick={() => onMode(m)} className="btn mono min-h-11 px-3 text-body font-bold lg:min-h-0 lg:py-1">
            <span aria-hidden>{icon} </span>{SIM_UI[key][lang]}
          </button>
        ))}
      </div>
      <MainNav current="/" onMap={() => onMode("live")} />
      <div className="ml-auto"><LangSwitch /></div>
    </header>
  );
}
