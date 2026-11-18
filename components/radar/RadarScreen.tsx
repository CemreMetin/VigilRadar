"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { agoText } from "@/lib/radar/format";
import { useRegion } from "@/lib/radar/region";
import { useNow } from "@/lib/radar/useNow";
import { useRadar } from "@/lib/radar/useRadar";
import { useT } from "@/lib/radar/useT";
import RadarMap, { type Selection } from "./RadarMap";
import TopBar from "./TopBar";

// Faz 4 step 3: top bar with the two statuses and the region picker, map, recent events, bottom line. The triage card is step 4.
const TURKEY = { center: [35.2, 39.1] as [number, number], zoom: 4.3 };
const WORLD = { center: [15, 25] as [number, number], zoom: 1.3 };

export default function RadarScreen() {
  const { loaded, done } = useRadar();
  const now = useNow();
  const { t } = useT();
  const { province } = useRegion();
  const [selected, setSelected] = useState<Selection | null>(null);
  const state = loaded?.state ?? null;
  const recent = (state?.quakes ?? []).filter((q) => !q.retracted).slice(0, 10);
  const focus = useMemo(() => (province ? TURKEY : WORLD), [province]);

  return (
    <div className="flex h-dvh flex-col bg-bg">
      <TopBar loaded={loaded} done={done} now={now} />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="relative min-h-0 flex-1"><RadarMap state={state} nowMs={loaded?.lastOkMs ?? now} onSelect={setSelected} focus={focus} /></div>
        <aside className="max-h-[40dvh] overflow-auto border-t border-line md:max-h-none md:w-[380px] md:border-l md:border-t-0" aria-label={t("recentEvents")}>
          <h2 className="label p-3">{t("recentEvents")}</h2>
          <ul className="divide-y divide-line">
            {recent.map((q) => (
              <li key={q.id}>
                <button type="button" onClick={() => setSelected({ kind: "quake", id: q.id })} aria-pressed={selected?.id === q.id}
                  className={`mono block w-full px-3 py-2 text-left text-body hover:bg-panel-solid ${selected?.id === q.id ? "text-accent" : ""}`}>
                  M{q.best.mag} · {q.best.place} · {agoText(now - q.best.timeMs, t)}
                </button>
              </li>
            ))}
            {state && recent.length === 0 && <li className="p-3 text-body text-dim">{t("noEvents")}</li>}
          </ul>
        </aside>
      </div>
      <footer className="mono flex gap-4 border-t border-line px-3 py-2 text-body text-dim">
        <span>{t("noChokepoints")}</span>
        <Link href="/library" className="hover:text-accent">Library</Link>
        <Link href="/metrics" className="hover:text-accent">Metrics</Link>
      </footer>
    </div>
  );
}
