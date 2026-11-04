"use client";

import { useState } from "react";
import type { Map as MlMap } from "maplibre-gl";
import { dataDate, printMap } from "@/lib/printMap";

/** "Print map" and the Light paper option (on by default). getLegend returns the active layers and legend lines at the moment of printing. */
export default function PrintMapButton({
  getMap,
  title,
  getLegend,
  className = "btn mono h-8 px-2 text-xs font-bold",
}: {
  getMap: () => MlMap | null | undefined;
  title: string | (() => string);
  getLegend?: () => string[];
  className?: string;
}) {
  const [light, setLight] = useState(true);
  const [busy, setBusy] = useState(false);
  return (
    <div className="no-print flex flex-wrap items-center gap-x-2 gap-y-1">
      <button
        type="button"
        className={className}
        disabled={busy}
        onClick={async () => {
          const map = getMap();
          if (!map) return;
          setBusy(true);
          try {
            await printMap(map, { title: typeof title === "function" ? title() : title, legend: getLegend?.() ?? [], light }, await dataDate());
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "PREPARING…" : "PRINT MAP"}
      </button>
      <label className="mono flex cursor-pointer items-center gap-1 whitespace-nowrap text-[10px] text-dim">
        <input type="checkbox" checked={light} onChange={(e) => setLight(e.target.checked)} style={{ accentColor: "var(--accent)" }} />
        Light paper
      </label>
    </div>
  );
}
