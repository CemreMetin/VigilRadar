"use client";

import GitHubLink from "@/components/GitHubLink";
import LangSwitch from "@/components/LangSwitch";
import { MainNav } from "@/components/SiteNav";
import { SIM_UI } from "@/core/laplace/copy";
import type { Lang } from "@/lib/lang";

export type Mode = "live" | "sim";

/** One tactile header row: monochrome wordmark, two modes, three pages, and language toggle. */
export default function TopBar({ mode, lang, onMode }: { mode: Mode; lang: Lang; onMode: (m: Mode) => void }) {
  return (
    <header className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-line bg-panel-solid px-3 py-1.5 md:h-[52px] md:flex-nowrap md:gap-x-5 md:py-0">
      <h1 className="mono text-read font-bold tracking-[0.16em] text-fg">VIGILRADAR</h1>
      <div className="flex gap-1.5" role="group" aria-label={SIM_UI.mode[lang]}>
        {([["live", "●", "live"], ["sim", "◈", "simulate"]] as const).map(([m, icon, key]) => (
          <button key={m} type="button" aria-pressed={mode === m} onClick={() => onMode(m)} className="btn mono min-h-9 px-3 py-1 text-body font-bold md:min-h-0">
            <span aria-hidden>{icon} </span>{SIM_UI[key][lang]}
          </button>
        ))}
      </div>
      <MainNav current="/" onMap={() => onMode("live")} />
      <div className="ml-auto flex items-center md:gap-2"><GitHubLink /><LangSwitch /></div>
    </header>
  );
}
