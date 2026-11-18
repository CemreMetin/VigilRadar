"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRadar } from "@/lib/radar/useRadar";
import RadarMap, { type Selection } from "./RadarMap";

// Faz 4 step 2: top line, map, recent events list, bottom line. The top bar, region picker and triage card come in steps 3 and 4.
const LABEL = { worker: "LIVE", backup: "YEDEK KAYNAK", stale: "STALE" } as const;
const ago = (ms: number) => { const m = Math.max(0, Math.round(ms / 60_000)); return m < 60 ? `${m} dk` : m < 2880 ? `${Math.round(m / 60)} sa` : `${Math.round(m / 1440)} gün`; };

export default function RadarScreen() {
  const { loaded, done } = useRadar();
  const [now, setNow] = useState(0);
  const [selected, setSelected] = useState<Selection | null>(null);
  useEffect(() => { const t = loaded?.lastOkMs ?? Date.now(); const id = requestAnimationFrame(() => setNow(t)); return () => cancelAnimationFrame(id); }, [loaded]);
  const state = loaded?.state ?? null;
  const recent = (state?.quakes ?? []).filter((q) => !q.retracted).slice(0, 10);

  return (
    <div className="flex h-dvh flex-col bg-bg">
      <header className="mono border-b border-line px-3 py-2 text-body">
        VIGILRADAR // {loaded ? LABEL[loaded.source] : done ? "NO DATA" : "..."}
        {state && <span className="ml-4 text-dim">{state.global.level}{state.global.reason ? ` · ${state.global.reason}` : ""}</span>}
      </header>
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="relative min-h-0 flex-1"><RadarMap state={state} nowMs={now} onSelect={setSelected} /></div>
        <aside className="max-h-[40dvh] overflow-auto border-t border-line md:max-h-none md:w-[380px] md:border-l md:border-t-0" aria-label="Son olaylar">
          <h2 className="label p-3">Son olaylar</h2>
          <ul className="divide-y divide-line">
            {recent.map((q) => (
              <li key={q.id}>
                <button type="button" onClick={() => setSelected({ kind: "quake", id: q.id })} aria-pressed={selected?.id === q.id}
                  className={`mono block w-full px-3 py-2 text-left text-body hover:bg-panel-solid ${selected?.id === q.id ? "text-accent" : ""}`}>
                  M{q.best.mag} · {q.best.place} · {ago(now - q.best.timeMs)} önce
                </button>
              </li>
            ))}
            {state && recent.length === 0 && <li className="p-3 text-body text-dim">Son 7 günde olay yok.</li>}
          </ul>
        </aside>
      </div>
      <footer className="mono flex gap-4 border-t border-line px-3 py-2 text-body text-dim">
        <span>Boğaz verisi yok</span>
        <Link href="/library" className="hover:text-accent">Library</Link>
        <Link href="/metrics" className="hover:text-accent">Metrics</Link>
      </footer>
    </div>
  );
}
