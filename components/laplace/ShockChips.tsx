"use client";

import { SHOCK_COPY, SIM_UI } from "@/core/laplace/copy";
import { SHOCK_IDS } from "@/core/laplace/shocks";
import type { ShockId } from "@/core/laplace/types";
import type { Lang } from "@/lib/lang";

/** One row above the map, scrolling sideways comfortably on mobile. */
export default function ShockChips({ shock, lang, onPick }: { shock: ShockId; lang: Lang; onPick: (id: ShockId) => void }) {
  return (
    <div className="scroll-thin overflow-x-auto border-b border-line bg-panel-solid" role="group" aria-label={SIM_UI.shocks[lang]}>
      <div className="flex w-max gap-1.5 px-3 py-2">
        {SHOCK_IDS.map((id) => (
          <button key={id} type="button" aria-pressed={id === shock} onClick={() => onPick(id)} className="btn mono min-h-9 whitespace-nowrap px-3 py-1 text-body md:min-h-0">
            {SHOCK_COPY[id].chip[lang]}
          </button>
        ))}
      </div>
    </div>
  );
}
