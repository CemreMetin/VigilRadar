"use client";

import { SHOCK_COPY, SIM_UI } from "@/core/laplace/copy";
import { SHOCK_IDS } from "@/core/laplace/shocks";
import type { ShockId } from "@/core/laplace/types";
import type { Lang } from "@/lib/lang";

/** One row above the map, scrolling sideways on a narrow screen. */
export default function ShockChips({ shock, lang, onPick }: { shock: ShockId; lang: Lang; onPick: (id: ShockId) => void }) {
  return (
    <div className="overflow-x-auto border-b border-line" role="group" aria-label={SIM_UI.shocks[lang]}>
      <div className="flex w-max gap-1 p-2">
        {SHOCK_IDS.map((id) => (
          <button key={id} type="button" aria-pressed={id === shock} onClick={() => onPick(id)} className="btn mono whitespace-nowrap px-2 py-1 text-body">{SHOCK_COPY[id].chip[lang]}</button>
        ))}
      </div>
    </div>
  );
}
