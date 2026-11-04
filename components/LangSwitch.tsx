"use client";

import { useLang } from "@/lib/lang";

export default function LangSwitch() {
  const [lang, setLang] = useLang();
  return (
    <div className="no-print flex items-center gap-1" role="group" aria-label="Language">
      {(["en", "tr"] as const).map((l) => (
        <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} className="btn mono min-h-11 px-3 text-body font-bold lg:min-h-0 lg:py-1">
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
