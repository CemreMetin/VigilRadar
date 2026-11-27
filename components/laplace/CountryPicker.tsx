"use client";

import { useState } from "react";
import { SIM_UI } from "@/core/laplace/copy";
import type { Country } from "@/core/laplace/types";
import type { Lang } from "@/lib/lang";
import { fold } from "@/lib/radar/format";

const QUICK: [string, string][] = [["US", "USA"], ["DE", "DEU"], ["JP", "JPN"], ["CN", "CHN"], ["TR", "TUR"], ["IN", "IND"], ["EG", "EGY"], ["GB", "GBR"]];

interface Props { countries: Country[]; lang: Lang; selected: string; onPick: (iso3: string) => void }

/** All countries, filtered as you type (either language, or the three letter code), plus eight shortcuts. */
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
        className="mono min-h-10 w-full rounded-lg border border-line-strong bg-bg px-3 py-2 text-body text-fg"
      />
      {needle && (
        <ul className="mt-1 max-h-48 overflow-auto rounded-lg border border-line-strong bg-bg">
          {hits.map((c) => (
            <li key={c.iso3}><button type="button" onClick={() => pick(c.iso3)} className="mono block min-h-9 w-full px-3 py-1.5 text-left text-body hover:bg-panel-solid">{c.name[lang]}</button></li>
          ))}
          {hits.length === 0 && <li className="mono px-3 py-2 text-body text-dim">{SIM_UI.noCountry[lang]}</li>}
        </ul>
      )}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {QUICK.map(([label, iso3]) => (
          <button key={iso3} type="button" onClick={() => pick(iso3)} aria-pressed={selected === iso3} aria-label={countries.find((c) => c.iso3 === iso3)?.name[lang]} className="btn mono min-h-8 px-2.5 py-1 text-body">{label}</button>
        ))}
      </div>
    </div>
  );
}
