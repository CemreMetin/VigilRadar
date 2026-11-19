"use client";

import { useEffect, useRef, useState } from "react";
import { ALERT } from "@/core/content/alert";
import type { Crisis } from "@/lib/alert/crisis";
import { keepAwake, startWhistle } from "@/lib/alert/tools";
import type { Plan } from "@/lib/alert/store";
import { useT } from "@/lib/radar/useT";

const SRC = { usgs: "USGS", emsc: "EMSC", afad: "AFAD", kandilli: "Kandilli" } as const;
const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, n) => String(v[n] ?? ""));

interface Props { crisis: Crisis; nowMs: number; radio: string; plan: Plan; onExit: () => void }

/** Crisis mode (VIGIL.md 9.2): pure black, red accent, large type, no navigation. */
export default function CrisisView({ crisis, nowMs, radio, plan, onExit }: Props) {
  const { c, lang } = useT();
  const a = ALERT[lang];
  const q = crisis.quake?.best ?? null;
  const [torch, setTorch] = useState(false);
  const [whistle, setWhistle] = useState(false);
  const stopWhistle = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!torch) return;
    let release = () => {};
    let gone = false;
    void keepAwake().then((r) => { if (gone) r(); else release = r; });
    return () => { gone = true; release(); };
  }, [torch]);
  useEffect(() => () => stopWhistle.current?.(), []);

  const toggleWhistle = () => {
    if (whistle) { stopWhistle.current?.(); stopWhistle.current = null; setWhistle(false); return; }
    try { stopWhistle.current = startWhistle(); setWhistle(true); } catch { /* no Web Audio: the button simply does nothing */ }
  };

  const place = crisis.province?.name ?? q?.place ?? "";
  const mins = q ? Math.max(0, Math.round((nowMs - q.timeMs) / 60_000)) : 0;
  const km = crisis.distanceKm !== null ? Math.round(crisis.distanceKm) : null;
  const title = q ? `M${q.mag.toFixed(1)} ${a.crisis}${km !== null ? ` — ${fill(a.kmFrom, { km })}` : ""}` : a.crisis;
  const body = `${crisis.drill ? `[${a.drillLabel}] ` : ""}${fill(a.okText, { yer: place || "—" })}`;
  const smsHref = `sms:?body=${encodeURIComponent(body)}`;
  const onOk = async (e: React.MouseEvent) => {
    const nav = navigator as Navigator & { share?: (d: { text: string }) => Promise<void> };
    if (!nav.share) return; // the sms: link does the work
    e.preventDefault();
    try { await nav.share({ text: body }); } catch { /* cancelled */ }
  };

  const btn = "mono block w-full border-2 border-[#ff2d2d] px-4 py-4 text-left text-[18px] font-bold text-white active:bg-[#ff2d2d]/30";
  const listFor = (k: Crisis["lists"][number]) => (k === "tsunami" ? c.tsunami : c[k]);

  return (
    <main aria-label={a.crisis} className="fixed inset-0 z-50 overflow-auto bg-black px-4 pb-10 pt-4 text-white" style={{ background: "#000" }}>
      {crisis.drill && <p role="status" className="mono mb-3 bg-[#ff2d2d] px-3 py-2 text-center text-[16px] font-bold text-black">{a.drillLabel}</p>}
      <h1 className="mono text-[26px] font-bold leading-tight text-[#ff2d2d]">{crisis.drill ? `${a.drillLabel} · ` : ""}{title.toLocaleUpperCase(lang)}</h1>
      {q ? (
        <p className="mono mt-2 text-[16px]">
          {new Date(q.timeMs).toLocaleTimeString(lang === "tr" ? "tr-TR" : "en-GB", { hour: "2-digit", minute: "2-digit" })} · {fill(a.agoMin, { n: mins })} · {a.srcLabel}: {crisis.quake!.sources.map((s) => SRC[s.source]).join(", ")}
        </p>
      ) : <p className="mt-2 text-[16px] text-white/70">{a.unknownEvent}</p>}

      <section className="mt-6" aria-label={a.doNow}>
        <h2 className="mono text-[14px] font-bold tracking-widest text-[#ff2d2d]">{a.doNow}</h2>
        {crisis.lists.length === 0 && <p className="mt-2 text-[20px]">{c.nothingToDo}</p>}
        {crisis.lists.map((k) => (
          <div key={k} className="mt-3">
            <ol className="list-decimal space-y-2 pl-6 text-[20px] leading-snug">{listFor(k).map((s) => <li key={s}>{s}</li>)}</ol>
            {k === "tsunami" && <p className="mt-2 text-[14px] text-white/70">{c.tsunamiNote}</p>}
            {k === "afterQuake" && <p className="mt-3 text-[18px] font-bold">{c.afterQuakeNote}</p>}
          </div>
        ))}
      </section>

      <section className="mt-6" aria-label={a.comms}>
        <h2 className="mono text-[14px] font-bold tracking-widest text-[#ff2d2d]">{a.comms}</h2>
        <ul className="mt-2 space-y-2 text-[17px] leading-snug">
          <li>{c.comms.call112}</li>
          <li>{c.comms.radio} <strong className="text-white">{radio || c.comms.radioFreq}</strong></li>
          <li>{c.comms.pmr}</li>
          <li>{c.comms.amateur}</li>
        </ul>
        {(plan.meet1 || plan.meet2 || plan.contact) && (
          <div className="mt-4 border border-white/40 p-3 text-[17px]" aria-label={a.planShown}>
            <p className="mono text-[12px] font-bold tracking-widest text-white/70">{a.planShown}</p>
            {(plan.meet1 || plan.meet2) && <p className="mt-1"><strong>{a.meet}:</strong> {[plan.meet1, plan.meet2].filter(Boolean).join(" · ")}</p>}
            {plan.contact && <p className="mt-1"><strong>{a.contact}:</strong> {plan.contact}</p>}
          </div>
        )}
      </section>

      <section className="mt-6 space-y-3" aria-label={a.tools}>
        <h2 className="mono text-[14px] font-bold tracking-widest text-[#ff2d2d]">{a.tools}</h2>
        <button type="button" className={btn} onClick={() => setTorch(true)}>{a.torch}</button>
        <div>
          <button type="button" className={btn} onClick={toggleWhistle} aria-pressed={whistle}>{whistle ? a.whistleStop : a.whistle}</button>
          <p className="mt-1 text-[14px] text-white/70">{a.whistleNote}</p>
        </div>
        <a className={btn} href={smsHref} onClick={onOk}>{a.okMsg}</a>
      </section>

      <button type="button" onClick={onExit} className="mono mt-8 w-full border border-white/40 px-4 py-3 text-[16px] text-white/80">{a.normal}</button>

      {torch && (
        <div role="button" tabIndex={0} aria-label={a.torchClose} className="fixed inset-0 z-[60] flex items-end justify-center bg-white pb-6" onClick={() => setTorch(false)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " " || e.key === "Escape") setTorch(false); }}>
          <span className="mono text-[13px] text-black/50">{a.torchClose}</span>
        </div>
      )}
    </main>
  );
}
