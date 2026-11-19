"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ALERT, BAG, BAG_IDS, BAG_TOTAL, MYTHS, PLAN } from "@/core/content/alert";
import { EMPTY_PLAN, NO_TICKS, useStored, type Plan } from "@/lib/alert/store";
import { pickCrisis, recentFelt } from "@/lib/alert/crisis";
import { currentSubscription, disablePush, enablePush, iosNeedsInstall, pushSupported, type PushOutcome } from "@/lib/alert/push";
import { useRegion } from "@/lib/radar/region";
import { useNow } from "@/lib/radar/useNow";
import { useRadar } from "@/lib/radar/useRadar";
import { useT } from "@/lib/radar/useT";
import { useLang } from "@/lib/lang";
import RegionPicker from "@/components/radar/RegionPicker";
import CrisisView from "./CrisisView";
import { usePrintSheet } from "./PrintSheets";

const noSubscribe = () => () => {};
const TELEGRAM_URL = process.env.NEXT_PUBLIC_TELEGRAM_TR_URL;
const OUT: Record<PushOutcome, "pushUnsupported" | "pushDenied" | "pushOffline" | "pushNoServer" | "pushDone"> = { ok: "pushDone", unsupported: "pushUnsupported", denied: "pushDenied", offline: "pushOffline", noserver: "pushNoServer" };

/** VigilAlert (VIGIL.md 9): peace mode by default, crisis mode on ?e=<id>, a P0/P1 event in the last hour, or the drill. */
export default function AlertScreen() {
  const { loaded } = useRadar();
  const now = useNow();
  const { lang, c } = useT();
  const [, setLang] = useLang();
  const a = ALERT[lang];
  const { region, province, setRegion } = useRegion();
  const eventId = useSyncExternalStore(noSubscribe, () => new URLSearchParams(window.location.search).get("e"), () => null);
  const [drill, setDrill] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [pickOpen, setPickOpen] = useState(false);
  const [ticks, setTicks] = useStored<string[]>("vigil.bag", NO_TICKS);
  const [radio, setRadio] = useStored<string>("vigil.radio", "");
  const [plan, setPlan] = useStored<Plan>("vigil.plan", EMPTY_PLAN);
  const [push, setPush] = useState<"unknown" | "on" | "off">("unknown");
  const [pushMsg, setPushMsg] = useState("");
  // known only in the browser, so the static page and the first client render agree on "wait"
  const pushKind = useSyncExternalStore(noSubscribe, () => (!pushSupported() ? "no" : iosNeedsInstall() ? "ios" : "yes"), () => "wait");
  const state = loaded?.state ?? null;
  useEffect(() => { document.documentElement.lang = lang; }, [lang]); // screen readers pronounce the page in its language

  useEffect(() => {
    void currentSubscription().then((s) => setPush(s ? "on" : "off"));
  }, []);

  const crisis = useMemo(() => (!now || (dismissed && !drill) ? null : pickCrisis({ state, province, nowMs: now, eventId, drill })), [state, province, now, eventId, drill, dismissed]);
  const exit = () => {
    setDrill(false);
    setDismissed(true);
    if (eventId) window.history.replaceState(null, "", "/alert");
  };
  const { start, sheet } = usePrintSheet({ ticks, plan, radio, province: province?.name ?? "" });
  const felt = recentFelt(state, province, now);
  const ticked = ticks.filter((id) => BAG_IDS.has(id));

  const togglePush = async () => {
    setPushMsg("");
    if (push === "on") { await disablePush(); setPush("off"); return; }
    if (!province && region === "GLOBAL") { setPickOpen(true); setPushMsg(a.pickFirst); return; }
    const r = await enablePush(region, lang);
    setPushMsg(a[OUT[r]]);
    if (r === "ok") setPush("on");
  };

  if (crisis) return <CrisisView crisis={crisis} nowMs={now} radio={radio} plan={plan} onExit={exit} />;

  const box = "border border-line p-3";
  const h2 = "label mb-2";
  const inp = "mono w-full border border-line bg-transparent px-2 py-1.5 text-body";
  const btn = "btn mono px-3 py-1.5 text-body font-bold";
  const setPlanField = (k: keyof Plan, v: string) => setPlan({ ...plan, [k]: v });

  return (
    <div className="mx-auto min-h-dvh max-w-3xl px-4 pb-16 pt-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="mono text-[20px] font-bold">{a.title}</h1>
        <nav className="mono flex gap-4 text-body"><Link href="/" className="py-2 hover:text-accent">{a.back}</Link>
          <button type="button" onClick={() => setLang(lang === "tr" ? "en" : "tr")} className="py-2 hover:text-accent">{lang === "tr" ? "EN" : "TR"}</button>
        </nav>
      </header>

      <section className={`${box} mt-4`} aria-label={a.region}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="mono text-[16px] font-bold">{a.region}: <span className="text-safe">{province ? a.nominal : "—"}</span></p>
          <RegionPicker region={region} label={province?.name ?? a.pick} open={pickOpen} setOpen={setPickOpen} onPick={setRegion} />
        </div>
        <p className="mt-2 text-body text-dim">{province ? (felt.length ? a.felt : a.noFelt) : a.pickFirst}</p>
        {felt.length > 0 && <ul className="mono mt-1 text-body">{felt.map(({ quake, severity }) => <li key={quake.id}>M{quake.best.mag.toFixed(1)} · {quake.best.place} · {new Date(quake.best.timeMs).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-GB", { day: "numeric", month: "short" })} · {severity}</li>)}</ul>}
      </section>

      <section className={`${box} mt-3`} aria-label={a.notify}>
        <h2 className={h2}>{a.notify}</h2>
        <div className="flex flex-wrap gap-2">
          {TELEGRAM_URL && <a className={btn} href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">{a.telegram}</a>}
          {pushKind === "yes" && <button type="button" className={btn} onClick={togglePush} disabled={push === "unknown"}>{push === "on" ? a.pushOff : a.pushOn}</button>}
          {pushKind === "ios" && <p className="text-body">{a.iosHint}</p>}
          {pushKind === "no" && <p className="text-body">{a.pushUnsupported}</p>}
        </div>
        {pushMsg && <p role="status" className="mt-2 text-body">{pushMsg}</p>}
        <p className="mt-2 text-body text-dim">{a.silentNote}</p>
      </section>

      <section className={`${box} mt-3`} aria-label={a.bag}>
        <div className="flex items-baseline justify-between"><h2 className={h2}>{a.bag}</h2><span className="mono text-body" aria-live="polite">{ticked.length}/{BAG_TOTAL}</span></div>
        {BAG.map((cat) => (
          <fieldset key={cat.id} className="mt-2">
            <legend className="mono text-body font-bold">{cat.title[lang]}</legend>
            {cat.items.map((it) => (
              <label key={it.id} className="flex items-start gap-2 py-0.5 text-read">
                <input type="checkbox" className="mt-1" checked={ticks.includes(it.id)} onChange={(e) => setTicks(e.target.checked ? [...ticks, it.id] : ticks.filter((x) => x !== it.id))} style={{ accentColor: "var(--safe)" }} />
                <span>{it.text[lang]}</span>
              </label>
            ))}
          </fieldset>
        ))}
        <button type="button" className="mono mt-2 py-2 text-body text-dim hover:text-fg" onClick={() => setTicks([])}>{a.bagReset}</button>
      </section>

      <section className={`${box} mt-3`} aria-label={a.radio}>
        <label className={h2} htmlFor="radio">{a.radio}</label>
        <input id="radio" className={inp} value={radio} maxLength={60} placeholder={a.radioPlaceholder} onChange={(e) => setRadio(e.target.value)} />
        <p className="mt-1 text-body text-dim">{a.radioHint}</p>
      </section>

      <section className={`${box} mt-3`} aria-label={a.myths}>
        <h2 className={h2}>{a.myths}</h2>
        <ul className="space-y-2">{MYTHS.map((m) => <li key={m.q.tr}><p className="font-bold">{m.q[lang]}</p><p className="text-read">{m.a[lang]}</p></li>)}</ul>
      </section>

      <section className={`${box} mt-3`} aria-label={a.drill}>
        <button type="button" className={btn} onClick={() => setDrill(true)}>{a.drill}</button>
      </section>

      <section className={`${box} mt-3`} aria-label={a.plan}>
        <h2 className={h2}>{a.plan}</h2>
        <p className="mb-2 text-body text-dim">{a.planNote}</p>
        <div className="space-y-3">
          <label className="block"><span className="mono text-body font-bold">{a.planName}</span><input className={inp} value={plan.name} maxLength={80} onChange={(e) => setPlanField("name", e.target.value)} /></label>
          {PLAN.map((f) => (
            <label key={f.id} className="block"><span className="mono text-body font-bold">{f.label[lang]}</span><span className="block text-body text-dim">{f.hint[lang]}</span>
              {f.lines > 1 ? <textarea className={inp} rows={f.lines} maxLength={400} value={plan[f.id]} onChange={(e) => setPlanField(f.id, e.target.value)} /> : <input className={inp} maxLength={200} value={plan[f.id]} onChange={(e) => setPlanField(f.id, e.target.value)} />}
            </label>
          ))}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="block"><span className="mono text-body">{a.planRel1}</span><input className={inp} inputMode="tel" maxLength={30} value={plan.rel1} onChange={(e) => setPlanField("rel1", e.target.value)} /></label>
            <label className="block"><span className="mono text-body">{a.planRel2}</span><input className={inp} inputMode="tel" maxLength={30} value={plan.rel2} onChange={(e) => setPlanField("rel2", e.target.value)} /></label>
          </div>
          <fieldset className="space-y-2"><legend className="text-body text-dim">{a.planHealth}</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <input aria-label={a.planBlood} placeholder={a.planBlood} className={inp} maxLength={10} value={plan.blood} onChange={(e) => setPlanField("blood", e.target.value)} />
              <input aria-label={a.planMeds} placeholder={a.planMeds} className={inp} maxLength={80} value={plan.meds} onChange={(e) => setPlanField("meds", e.target.value)} />
              <input aria-label={a.planAllergy} placeholder={a.planAllergy} className={inp} maxLength={80} value={plan.allergy} onChange={(e) => setPlanField("allergy", e.target.value)} />
            </div>
          </fieldset>
        </div>
      </section>

      <section className={`${box} mt-3 no-print`} aria-label={a.print}>
        <h2 className={h2}>{a.print}</h2>
        <p className="mb-2 text-body">{a.printNote}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btn} onClick={() => start("checklist")}>{a.printBag}</button>
          <button type="button" className={btn} onClick={() => start("plan")}>{a.printPlan}</button>
          <button type="button" className={btn} onClick={() => start("card")}>{a.printCard}</button>
        </div>
      </section>

      <p className="mt-3 text-body text-dim">{a.offlineNote}</p>
      <p className="mono mt-4 text-label text-dim">{c.disclaimer}</p>
      {sheet}
    </div>
  );
}
