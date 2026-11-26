"use client";

import Link from "next/link";
import { CHANNEL_NAMES, ORDER_NAMES, SHOCK_COPY, SIM_UI, TIER_NAMES, dayRange } from "@/core/laplace/copy";
import { dominoChain } from "@/core/laplace/engine";
import { CHANNEL_IDS } from "@/core/laplace/shocks";
import type { Country, ImpactTier, SimulationResult } from "@/core/laplace/types";
import type { Lang } from "@/lib/lang";
import { CHANNEL_COLOR, TIER_FILL } from "@/lib/radar/laplaceGeo";
import CountryPicker from "./CountryPicker";

const TOP_SHOWN = 6;
const TIERS: ImpactTier[] = ["low", "moderate", "high", "severe"];

/** A square of the map colour next to its name: the fills themselves are too dark to be used as text colours. */
function Swatch({ tier }: { tier: ImpactTier }) {
  return <span aria-hidden className="inline-block h-3 w-3 shrink-0 border border-line-strong" style={{ background: TIER_FILL[tier] }} />;
}

interface Props { result: SimulationResult; countries: Country[]; iso3: string; lang: Lang; onCountry: (iso3: string) => void }

export default function LaplacePanel({ result, countries, iso3, lang, onCountry }: Props) {
  const s = (k: keyof typeof SIM_UI) => SIM_UI[k][lang];
  const country = countries.find((c) => c.iso3 === iso3)!;
  const impact = result.byIso3[iso3];
  const { shock } = result;
  const copy = SHOCK_COPY[shock.id];

  return (
    <div className="divide-y divide-line">
      <section className="p-3">
        <h2 className="mono text-body font-bold uppercase text-accent">{copy.name[lang]}</h2>
        <p className="mt-1 text-read">{copy.summary[lang]}</p>
        <CountryPicker countries={countries} lang={lang} selected={iso3} onPick={onCountry} />
      </section>

      <section className="p-3" aria-label={`${s("impact")}: ${impact.name[lang]}`}>
        <h3 className="label">{s("impact")}: <span className="text-fg">{impact.name[lang]}</span></h3>
        <p className="mono mt-1 flex flex-wrap items-center gap-2">
          <span className="text-value font-bold" data-testid="sim-total">{impact.total}</span>
          <span className="text-body text-dim">/ 100</span>
          <Swatch tier={impact.tier} />
          <span className="text-body font-bold">{TIER_NAMES[impact.tier][lang]}</span>
        </p>
        <p className="mono text-body text-dim">{ORDER_NAMES[impact.order][lang]} · {s("peak")}: {dayRange(...impact.peakWindowDays)[lang]}</p>
        <p className="mono text-label text-dim">{impact.profiled ? s("profileModel") : s("fallbackModel")}</p>
      </section>

      <section className="p-3">
        <h3 className="label">{s("channels")}</h3>
        <ul className="mt-2 space-y-1">
          {CHANNEL_IDS.map((ch) => (
            <li key={ch} className="mono grid grid-cols-[72px_1fr_28px] items-center gap-2 text-body">
              <span>{CHANNEL_NAMES[ch][lang]}</span>
              <span aria-hidden className="block h-2 border border-line-strong">
                <span className="block h-full" style={{ width: `${impact.channels[ch]}%`, background: CHANNEL_COLOR[ch] }} />
              </span>
              <span className="text-right">{impact.channels[ch]}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="p-3">
        <h3 className="label">{s("chain")}</h3>
        <ol className="mt-2 space-y-3">
          {dominoChain(shock.id, country).map((step) => (
            <li key={step.step}>
              <p className="mono text-label uppercase text-dim">
                {step.step}. {step.timing[lang]} · <span className="border border-line-strong px-1 text-fg">{step.evidence}</span> · {CHANNEL_NAMES[step.channel][lang]}
              </p>
              <p className="mt-1 text-read">{step.text[lang]}</p>
              <p className="mono text-label text-dim">{step.source}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="p-3">
        <h3 className="label">{s("most")}</h3>
        <ul className="mt-2 grid grid-cols-2 gap-1">
          {result.topAffected.slice(0, TOP_SHOWN).map((i) => (
            <li key={i.iso3}>
              <button type="button" onClick={() => onCountry(i.iso3)} aria-pressed={i.iso3 === iso3} className="btn mono flex w-full items-center gap-2 px-2 py-1 text-left text-body">
                <Swatch tier={i.tier} />
                <span className="min-w-0 flex-1 truncate">{i.name[lang]}</span>
                <span className="font-bold">{i.total}</span>
              </button>
            </li>
          ))}
        </ul>
        <ul className="mono mt-3 flex flex-wrap gap-x-3 gap-y-1 text-label text-dim" aria-label={s("legend")}>
          {TIERS.map((tier) => <li key={tier} className="flex items-center gap-1"><Swatch tier={tier} />{TIER_NAMES[tier][lang]}</li>)}
        </ul>
      </section>

      <section className="p-3">
        {shock.libraryId && <p className="mb-2 text-body"><Link href={`/library/${shock.libraryId}`} className="text-accent hover:underline">{s("deepRead")} →</Link></p>}
        <p className="text-label text-dim">{s("honesty")}</p>
        <p className="mono mt-1 text-label text-dim">{shock.sources.join(" · ")}</p>
      </section>
    </div>
  );
}
