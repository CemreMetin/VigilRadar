"use client";

import { useEffect, useRef, useState } from "react";
import { filterProvinces, type Region } from "@/lib/radar/region";
import { useT } from "@/lib/radar/useT";

interface Props { region: Region; label: string; open: boolean; setOpen: (o: boolean) => void; onPick: (r: Region) => void }

/** Region list: Global plus the 81 provinces, filtered as you type (Turkish letters folded). All of it works with the keyboard. */
export default function RegionPicker({ region, label, open, setOpen, onPick }: Props) {
  const { t } = useT();
  const [q, setQ] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const list = filterProvinces(q);
  const showGlobal = !q.trim() || "global küresel".includes(q.trim().toLowerCase());

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open, setOpen]);

  const pick = (r: Region) => { onPick(r); setOpen(false); setQ(""); };

  return (
    <div ref={root} className="relative">
      <button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(!open)} className="mono border border-line px-2 py-1 text-body hover:border-line-strong">
        {t("regionLabel")}: {label} ▾
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-64 border border-line-strong bg-panel-solid" onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}>
          <input
            autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("filterProvinces")} aria-label={t("filterProvinces")}
            onKeyDown={(e) => { if (e.key === "Enter") { if (showGlobal && !q.trim()) pick("GLOBAL"); else if (list[0]) pick(list[0].code); } }}
            className="mono w-full border-b border-line bg-transparent px-2 py-2 text-body outline-none"
          />
          <ul role="listbox" aria-label={t("regionLabel")} className="max-h-64 overflow-auto">
            {showGlobal && (
              <li><button type="button" role="option" aria-selected={region === "GLOBAL"} onClick={() => pick("GLOBAL")} className="mono block w-full px-2 py-1 text-left text-body hover:bg-bg">{t("regionGlobal")}</button></li>
            )}
            {list.map((p) => (
              <li key={p.code}>
                <button type="button" role="option" aria-selected={region === p.code} onClick={() => pick(p.code)} className="mono block w-full px-2 py-1 text-left text-body hover:bg-bg">{p.name}</button>
              </li>
            ))}
            {!showGlobal && list.length === 0 && <li className="px-2 py-2 text-body text-dim">{t("noMatch")}</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
