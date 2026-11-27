"use client";

import Link from "next/link";
import { HUB_UI, SHOCK_COPY } from "@/core/laplace/copy";
import { encodeSimQuery } from "@/core/laplace/engine";
import { shockById, SHOCK_IDS } from "@/core/laplace/shocks";
import { useLang } from "@/lib/lang";

const ATLASES = ["links", "nuclear", "supervolcanoes", "trajectory", "metrics"] as const;

/** The top of /library: the eight simulations, then the reference pages that are not in the three-link header. */
export default function ScenarioHub() {
  const [lang] = useLang();
  return (
    <div lang={lang} className="no-print mt-5">
      <h2 className="label">{HUB_UI.simulations[lang]} ({SHOCK_IDS.length})</h2>
      <ul className="mt-2 grid gap-2 sm:grid-cols-2">
        {SHOCK_IDS.map((id) => (
          <li key={id}>
            <Link href={`/${encodeSimQuery({ shock: id, severity: 0.75, day: shockById(id).defaultDay, country: null })}`} className="card-btn block h-full p-3">
              <span className="mono block text-body font-bold">{SHOCK_COPY[id].name[lang]}</span>
              <span className="mt-1 block text-body text-dim">{SHOCK_COPY[id].summary[lang]}</span>
              <span className="mono mt-2 block text-body text-accent">{HUB_UI.open[lang]} →</span>
            </Link>
          </li>
        ))}
      </ul>
      <h2 className="label mt-5">{HUB_UI.atlases[lang]}</h2>
      <ul className="mono mt-2 flex flex-wrap gap-2 text-body">
        {ATLASES.map((a) => <li key={a}><Link href={`/${a}`} className="btn inline-block px-3 py-2">{HUB_UI[a][lang]}</Link></li>)}
      </ul>
    </div>
  );
}
