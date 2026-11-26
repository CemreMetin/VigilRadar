"use client";

import { useEffect, useRef, useState } from "react";
import { SIM_UI } from "@/core/laplace/copy";
import { MAX_DAY, encodeSimQuery } from "@/core/laplace/engine";
import type { SimQuery } from "@/core/laplace/types";
import type { Lang } from "@/lib/lang";
import { writeSearch } from "@/lib/useSearch";

const TICK_MS = 75; // about 13 updates a second: smooth, and light for the map
const TICKS = 120; // day 1 to 180 in 9 seconds

interface Props { query: SimQuery; lang: Lang; onChange: (patch: Partial<SimQuery>) => void }

/** The bottom bar of SIMULATE: severity, the time player and the share button. */
export default function SimControls({ query, lang, onChange }: Props) {
  const s = (k: keyof typeof SIM_UI) => SIM_UI[k][lang];
  const [playing, setPlaying] = useState(false);
  const [shared, setShared] = useState<"copied" | "copyFailed" | null>(null);
  const change = useRef(onChange);
  useEffect(() => { change.current = onChange; });

  useEffect(() => {
    if (!playing) return;
    let tick = 0;
    change.current({ day: 1 });
    const id = window.setInterval(() => {
      tick++;
      change.current({ day: Math.round(1 + (tick / TICKS) * (MAX_DAY - 1)) });
      if (tick >= TICKS) setPlaying(false);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [playing]);

  useEffect(() => {
    if (!shared) return;
    const id = window.setTimeout(() => setShared(null), 2000);
    return () => window.clearTimeout(id);
  }, [shared]);

  const share = () => {
    writeSearch(encodeSimQuery(query));
    // `clipboard` is missing outside https and may refuse; the address bar holds the link either way
    Promise.resolve()
      .then(() => navigator.clipboard.writeText(window.location.href))
      .then(() => setShared("copied"), () => setShared("copyFailed"));
  };
  const percent = Math.round(query.severity * 100);

  return (
    <div className="mono flex flex-wrap items-center gap-x-3 gap-y-1.5 bg-panel-solid px-3 py-2 text-body md:h-[52px] md:flex-nowrap md:gap-4 md:py-0">
      <div className="flex min-w-0 flex-1 basis-full items-center gap-2 md:order-2 md:basis-auto">
        <button type="button" onClick={() => setPlaying((p) => !p)} className="btn h-9 min-w-9 shrink-0 px-2.5 md:w-24">
          <span aria-hidden>{playing ? "❚❚" : "▶"}</span><span className="sr-only md:not-sr-only"> {playing ? s("pause") : s("play")}</span>
        </button>
        <label className="flex min-w-0 flex-1 items-center gap-2">
          <span className="min-w-12 whitespace-nowrap md:w-16">{s("day")} {query.day}</span>
          <input type="range" min={1} max={MAX_DAY} value={query.day} aria-label={s("time")} onChange={(e) => { setPlaying(false); onChange({ day: Number(e.target.value) }); }} className="range min-w-0 flex-1" />
        </label>
      </div>
      <label className="flex min-w-0 flex-1 items-center gap-2 md:order-1 md:max-w-xs">
        <span className="whitespace-nowrap">{s("severity")} {percent}%</span>
        <input type="range" min={10} max={100} value={percent} onChange={(e) => onChange({ severity: Number(e.target.value) / 100 })} className="range min-w-0 flex-1" />
      </label>
      <button type="button" onClick={share} className="btn h-9 shrink-0 px-3 md:order-3">
        <span aria-hidden>{shared === "copied" ? "✓" : "↗"}</span><span role="status"> {s(shared ?? "share")}</span>
      </button>
    </div>
  );
}
