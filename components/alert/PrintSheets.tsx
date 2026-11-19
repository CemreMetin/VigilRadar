"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ALERT, BAG, PLAN } from "@/core/content/alert";
import type { Plan } from "@/lib/alert/store";
import { useT } from "@/lib/radar/useT";

// Printable sheets (VIGIL.md 9.1 item 8, 10.9, 10.10). Only the browser's print function and @media print CSS: the sheet is
// mounted in <body>, html[data-print] tells the print stylesheet to hide the rest, and nothing is sent anywhere.
// The data-print values reuse the existing print CSS: "checklist" (bag), "plan", "card".
export type SheetKind = "checklist" | "plan" | "card";
interface Data { ticks: string[]; plan: Plan; radio: string; province: string }

export function usePrintSheet(data: Data) {
  const [kind, setKind] = useState<SheetKind | null>(null);
  const start = useCallback((k: SheetKind) => setKind(k), []);
  useEffect(() => {
    if (!kind) return;
    document.documentElement.dataset.print = kind;
    const t = setTimeout(() => window.print(), 80);
    const clear = () => { delete document.documentElement.dataset.print; setKind(null); };
    window.addEventListener("afterprint", clear);
    return () => { clearTimeout(t); window.removeEventListener("afterprint", clear); };
  }, [kind]);
  const sheet = kind ? createPortal(<div className="print-sheet"><Sheet kind={kind} data={data} /></div>, document.body) : null;
  return { start, sheet };
}

const Line = ({ w = "60mm", text }: { w?: string; text?: string }) => <span className="fill" style={{ minWidth: text ? undefined : w }}>{text}</span>;

function Sheet({ kind, data }: { kind: SheetKind; data: Data }) {
  const { lang } = useT();
  const a = ALERT[lang];
  if (kind === "checklist") {
    return (
      <div className="sheet-checklist">
        <h1 className="mono">{a.sheetBag}</h1>
        <p className="sheet-fields"><span>{a.household} <Line w="70mm" /></span><span>{a.date} <Line w="12mm" /> / <Line w="12mm" /> / <Line w="20mm" /></span></p>
        <div className="sheet-tier sheet-cats">
          {BAG.map((cat) => (
            <div key={cat.id} className="print-cat">
              <h3 className="mono">{cat.title[lang]}</h3>
              <ul>{cat.items.map((it) => <li key={it.id}><span className="box">{data.ticks.includes(it.id) ? "✓" : ""}</span><span className="nm">{it.text[lang]}</span></li>)}</ul>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (kind === "plan") {
    return (
      <div className="sheet-plan">
        <h1 className="mono">{a.sheetPlan}</h1>
        <p className="sheet-fields"><span>{a.household} <Line w="70mm" text={data.plan.name} /></span><span>{a.date} <Line w="12mm" /> / <Line w="12mm" /> / <Line w="20mm" /></span></p>
        {PLAN.map((f) => {
          const val = data.plan[f.id];
          return (
            <div key={f.id} className="plan-row">
              <p className="mono">{f.label[lang]}</p>
              <p className="sheet-sub">{f.hint[lang]}</p>
              {val ? <span className="write">{val}</span> : Array.from({ length: f.lines }, (_, i) => <span key={i} className="write" />)}
            </div>
          );
        })}
      </div>
    );
  }
  const p = data.plan;
  const health = [p.blood && `${a.planBlood}: ${p.blood}`, p.meds && `${a.planMeds}: ${p.meds}`, p.allergy && `${a.planAllergy}: ${p.allergy}`].filter(Boolean);
  return (
    <div className="sheet-card">
      <p className="sheet-sub">{a.cut}</p>
      <div className="wallet-pair">
        <div className="wallet" aria-label={a.front}>
          <p className="mono wallet-title">{a.front}</p>
          <ul>
            <li>{a.planName}: <Line w="38mm" text={p.name} /> · {a.cardLoc}: <Line w="16mm" text={data.province} /></li>
            <li>{a.cardMeet1}: <Line w="55mm" text={p.meet1} /></li>
            <li>{a.cardMeet2}: <Line w="55mm" text={p.meet2} /></li>
            <li>{a.cardContact}: <Line w="40mm" text={p.contact} /></li>
            <li>{a.cardRel} 1: <Line w="50mm" text={p.rel1} /></li>
            <li>{a.cardRel} 2: <Line w="50mm" text={p.rel2} /></li>
          </ul>
        </div>
        <div className="wallet" aria-label={a.backSide}>
          <p className="mono wallet-title">{a.backSide}</p>
          <ul>
            <li><b>{a.card112}</b></li>
            <li>{a.cardRadio}: <Line w="45mm" text={data.radio} /></li>
            <li><b>{a.cardPmr}</b></li>
            {health.map((h) => <li key={h}>{h}</li>)}
            <li className="wallet-tail">{a.cardTail}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
