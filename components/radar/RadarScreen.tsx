"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { agoText } from "@/lib/radar/format";
import { useRegion } from "@/lib/radar/region";
import { useNow } from "@/lib/radar/useNow";
import { useRadar } from "@/lib/radar/useRadar";
import { useT } from "@/lib/radar/useT";
import RadarMap, { type Selection } from "./RadarMap";
import TopBar from "./TopBar";
import TriageCard from "./TriageCard";

// Faz 4 step 4: map, recent events above the triage card, bottom line with the chokepoint summary and the fixed notice.
const TURKEY = { center: [35.2, 39.1] as [number, number], zoom: 4.3 };
const WORLD = { center: [15, 25] as [number, number], zoom: 1.3 };

export default function RadarScreen() {
  const { loaded, done } = useRadar();
  const now = useNow();
  const { t, c, lang } = useT();
  const { province } = useRegion();
  const [selected, setSelected] = useState<Selection | null>(null);
  const state = loaded?.state ?? null;
  const recent = (state?.quakes ?? []).filter((q) => !q.retracted).slice(0, 10);
  const focus = useMemo(() => (province ? TURKEY : WORLD), [province]);
  const cps = (state?.chokepoints ?? []).filter((x) => x.available);
  const off = cps.filter((x) => x.level === "deviation" || x.level === "severe");
  const lastData = cps.map((x) => x.dataThrough).filter(Boolean).sort().pop();

  useEffect(() => {
    if (!selected) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setSelected(null); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [selected]);

  return (
    <div className="flex h-dvh flex-col bg-bg">
      <TopBar loaded={loaded} done={done} now={now} />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="relative min-h-0 flex-1"><RadarMap state={state} nowMs={loaded?.lastOkMs ?? now} onSelect={setSelected} focus={focus} /></div>
        <aside className={`overflow-auto border-t border-line md:max-h-none md:w-[380px] md:border-l md:border-t-0 ${selected ? "max-h-[60dvh]" : "max-h-[40dvh]"}`}>
          <details open={!selected} key={selected ? "card" : "list"}>
            <summary className="label cursor-pointer p-3">{t("recentEvents")}</summary>
            <ul className="divide-y divide-line" aria-label={t("recentEvents")}>
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
          </details>
          {selected && state && <TriageCard state={state} sel={selected} now={now || loaded?.lastOkMs || 0} province={province} onClose={() => setSelected(null)} />}
        </aside>
      </div>
      <footer className="mono border-t border-line px-3 py-2 text-body text-dim">
        <div className="flex flex-wrap gap-x-4">
          <span>
            {cps.length === 0 ? t("noChokepoints") : `${t("cpWatched").replace("{n}", String(cps.length))} · ${off.length ? `${t("cpDev")}: ${off.map((x) => x.name).join(", ")}` : t("cpNoDev")}${lastData ? ` · ${t("dataThrough")}: ${new Date(lastData).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-GB", { day: "numeric", month: "short" })}` : ""}`}
          </span>
          <Link href="/library" className="hover:text-accent">Library</Link>
          <Link href="/metrics" className="hover:text-accent">Metrics</Link>
        </div>
        <p className="mt-1 text-label">{c.disclaimer}</p>
      </footer>
    </div>
  );
}
