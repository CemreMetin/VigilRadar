"use client";

import { useState } from "react";
import { SIM_UI } from "@/core/laplace/copy";
import type { Country } from "@/core/laplace/types";
import type { Lang } from "@/lib/lang";
import { fold } from "@/lib/radar/region";

const QUICK: [string, string][] = [["TR", "TUR"], ["DE", "DEU"], ["JP", "JPN"], ["US", "USA"], ["EG", "EGY"], ["IN", "IND"]];

interface Props { countries: Country[]; lang: Lang; selected: string; onPick: (iso3: string) => void }

/** All countries, filtered as you type (either language, or the three letter code), plus six shortcuts. */
export default function CountryPicker({ countries, lang, selected, onPick }: Props) {
  const [q, setQ] = useState("");
  const needle = fold(q.trim());
  const hits = needle
    ? countries
        .filter((c) => [c.name.en, c.name.tr, c.mapName, c.iso3].some((n) => fold(n).includes(needle)))
        .sort((a, b) => Number(fold(b.name[lang]).startsWith(needle)) - Number(fold(a.name[lang]).startsWith(needle)) || a.name[lang].localeCompare(b.name[lang], lang))
    : [];
  const pick = (iso3: string) => { onPick(iso3); setQ(""); };

  return (
    <div className="mt-3">
      <input
        type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={SIM_UI.findCountry[lang]} aria-label={SIM_UI.country[lang]}
        onKeyDown={(e) => { if (e.key === "Enter" && hits[0]) pick(hits[0].iso3); if (e.key === "Escape") setQ(""); }}
        className="mono w-full border border-line-strong bg-panel-solid px-2 py-2 text-body"
      />
      {needle && (
        <ul className="max-h-48 overflow-auto border border-t-0 border-line-strong">
          {hits.map((c) => (
            <li key={c.iso3}><button type="button" onClick={() => pick(c.iso3)} className="mono block w-full px-2 py-1 text-left text-body hover:bg-bg">{c.name[lang]}</button></li>
          ))}
          {hits.length === 0 && <li className="mono px-2 py-2 text-body text-dim">{SIM_UI.noCountry[lang]}</li>}
        </ul>
      )}
      <div className="mt-2 flex flex-wrap gap-1">
        {QUICK.map(([label, iso3]) => (
          <button key={iso3} type="button" onClick={() => pick(iso3)} aria-pressed={selected === iso3} aria-label={countries.find((c) => c.iso3 === iso3)?.name[lang]} className="btn mono px-2 py-1 text-body">{label}</button>
        ))}
      </div>
    </div>
  );
}
