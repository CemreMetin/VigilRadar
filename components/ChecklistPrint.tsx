"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { BAG_ITEMS, CATEGORY_LABEL, COMMS_ROWS, SCENARIO_FILTERS, TR, type BagCategory, type ScenarioTag } from "@/data/survival";
import { useLang } from "@/lib/lang";
import { dataDate } from "@/lib/printMap";

export const TIER_LABEL = { 1: "Grab-and-go (about 72 hours)", 2: "Staying put (longer)" } as const;

export type SheetJob =
  | { kind: "checklist"; tier: "1" | "2" | "both"; ticks: boolean; reasons: boolean; checked: Set<string>; filter: ScenarioTag | "all" }
  | { kind: "plan" }
  | { kind: "card" };

/**
 * Printable sheets for the Survive page. start(job) mounts the sheet in <body>, marks html[data-print] with its kind
 * (the print stylesheet hides everything else), prints, and unmounts it on afterprint. Nothing is sent anywhere.
 */
export function usePrintSheet() {
  const [job, setJob] = useState<SheetJob | null>(null);
  const [dates, setDates] = useState({ on: "", asOf: "" });

  const start = useCallback(async (j: SheetJob) => {
    setDates({ on: new Date().toISOString().slice(0, 10), asOf: await dataDate() });
    setJob(j);
  }, []);

  useEffect(() => {
    if (!job) return;
    document.documentElement.dataset.print = job.kind;
    const t = setTimeout(() => window.print(), 80); // the sheet is in the DOM by now
    const clear = () => {
      delete document.documentElement.dataset.print;
      setJob(null);
    };
    window.addEventListener("afterprint", clear);
    return () => {
      clearTimeout(t);
      window.removeEventListener("afterprint", clear);
    };
  }, [job]);

  const sheet = job
    ? createPortal(
        <div className="print-sheet">
          {job.kind === "checklist" && <ChecklistSheet job={job} />}
          {job.kind === "plan" && <PlanSheet />}
          {job.kind === "card" && <WalletCard />}
          <p className="print-footer">
            VigilRadar · vigilradar.pages.dev · printed {dates.on} · data as of {dates.asOf}
          </p>
        </div>,
        document.body,
      )
    : null;
  return { start, sheet };
}

const Line = ({ w = "60mm" }: { w?: string }) => <span className="fill" style={{ minWidth: w }} />;

export function ChecklistSheet({ job }: { job: Extract<SheetJob, { kind: "checklist" }> }) {
  const tr = useLang()[0] === "tr";
  const tiers = job.tier === "both" ? ([1, 2] as const) : ([Number(job.tier)] as (1 | 2)[]);
  const scenario = SCENARIO_FILTERS.find((f) => f.id === job.filter)?.label;
  const relevant = (tags: ScenarioTag[]) => job.filter === "all" || tags.length === 0 || tags.includes(job.filter as ScenarioTag);
  return (
    <div className="sheet-checklist">
      <h1 className="mono">{tr ? TR.page.checklistTitle : "Emergency kit checklist"}</h1>
      <p className="sheet-sub">
        {tiers.map((t) => (tr ? TR.tiers[t] : TIER_LABEL[t])).join(" / ")}
        {scenario && job.filter !== "all" ? ` · grey items matter less for: ${scenario}` : ""}
      </p>
      <p className="sheet-fields">
        <span>
          Household <Line w="70mm" />
        </span>
        <span>
          Checked on <Line w="12mm" /> / <Line w="12mm" /> / <Line w="20mm" />
        </span>
      </p>
      {tiers.map((t, n) => {
        const byCat = new Map<BagCategory, typeof BAG_ITEMS>();
        for (const it of BAG_ITEMS.filter((i) => i.tier === t)) byCat.set(it.category, [...(byCat.get(it.category) ?? []), it]);
        return (
          <section key={t} className={`sheet-tier ${t === 1 ? "compact" : ""}`} style={n > 0 ? { breakBefore: "page" } : undefined}>
            {tiers.length > 1 && <h2 className="mono">{tr ? TR.tiers[t] : TIER_LABEL[t]}</h2>}
            <div className="sheet-cats">
              {[...byCat.entries()].map(([cat, list]) => (
                <div key={cat} className="print-cat">
                  <h3 className="mono">{tr ? TR.categories[cat] : CATEGORY_LABEL[cat]}</h3>
                  <ul>
                    {list.map((it) => {
                      const less = !relevant(it.tags);
                      return (
                        <li key={it.id} className={less ? "less" : ""}>
                          <span className="box">{job.ticks && job.checked.has(it.id) ? "✓" : ""}</span>
                          <span className="nm">
                            {tr ? TR.items[it.id]?.[0] ?? it.name : it.name}
                            {less && scenario && <small> (less relevant for {scenario})</small>}
                            {job.reasons && <small className="why">{it.why}</small>}
                          </span>
                          <i className="short" />
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

const PLAN_ROWS: [string, number][] = [
  ["Meeting place near home (if you cannot stay in the house)", 1],
  ["Meeting place outside your area (if you cannot get home)", 1],
  ["Out-of-town contact: name and phone", 2],
  ["Medical needs, medicines and doctors", 3],
  ["Pets: food, carrier, vet and who takes them", 2],
];

export function PlanSheet() {
  return (
    <div className="sheet-plan">
      <h1 className="mono">Household emergency plan</h1>
      <p className="sheet-fields">
        <span>
          Household <Line w="70mm" />
        </span>
        <span>
          Date <Line w="12mm" /> / <Line w="12mm" /> / <Line w="20mm" />
        </span>
      </p>
      <p className="sheet-sub">Talk it through together, write it down, keep a copy in your kit, and practise it. Steps from Ready.gov: Make a plan.</p>
      {PLAN_ROWS.map(([label, lines]) => (
        <div key={label} className="plan-row">
          <p className="mono">{label}</p>
          {Array.from({ length: lines }, (_, i) => (
            <span key={i} className="write" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** the Communication table as a cut-out wallet card, 85 x 55 mm */
export function WalletCard() {
  return (
    <div className="sheet-card">
      <p className="sheet-sub">Cut along the dashed line and keep it in your wallet.</p>
      <div className="wallet">
        <p className="mono wallet-title">If networks fail</p>
        <ul>
          {COMMS_ROWS.map((r) => (
            <li key={r.service}>
              <b>{r.service}</b> · {r.where}
              {r.licence.startsWith("None") || r.licence.startsWith("Licence-free") ? "" : ` · ${r.licence}`}
            </li>
          ))}
        </ul>
        <p className="wallet-fill">
          Out-of-town contact: <Line w="30mm" />
        </p>
      </div>
    </div>
  );
}

/** "Print checklist" with the options that must not leave a mark on paper unless asked: tier, ticks, reasons. */
export function ChecklistPrintForm({ onPrint, defaultTier }: { onPrint: (o: { tier: "1" | "2" | "both"; ticks: boolean; reasons: boolean }) => void; defaultTier: 1 | 2 }): ReactNode {
  const [tier, setTier] = useState<"1" | "2" | "both">(String(defaultTier) as "1" | "2");
  const [ticks, setTicks] = useState(false);
  const [reasons, setReasons] = useState(false);
  const opt = "mono flex items-center gap-1.5 text-body text-dim";
  return (
    <form
      className="no-print mt-4 border border-line p-3"
      aria-label="Print the checklist"
      onSubmit={(e) => {
        e.preventDefault();
        onPrint({ tier, ticks, reasons });
      }}
    >
      <p className="label">Print checklist</p>
      <fieldset className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        <legend className="sr-only">Which list</legend>
        {(
          [
            ["1", "Grab-and-go"],
            ["2", "Staying put"],
            ["both", "Both"],
          ] as const
        ).map(([v, l]) => (
          <label key={v} className={opt}>
            <input type="radio" name="print-tier" checked={tier === v} onChange={() => setTier(v)} style={{ accentColor: "var(--safe)" }} />
            {l}
          </label>
        ))}
      </fieldset>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        <label className={opt}>
          <input type="checkbox" checked={ticks} onChange={(e) => setTicks(e.target.checked)} style={{ accentColor: "var(--safe)" }} />
          Include my ticks
        </label>
        <label className={opt}>
          <input type="checkbox" checked={reasons} onChange={(e) => setReasons(e.target.checked)} style={{ accentColor: "var(--safe)" }} />
          Include reasons
        </label>
      </div>
      <button type="submit" className="btn mono mt-3 px-3 py-1.5 text-body font-bold">
        PRINT CHECKLIST
      </button>
      <p className="mt-2 text-body text-dim">Your ticks stay on this device; nothing is sent anywhere.</p>
    </form>
  );
}
