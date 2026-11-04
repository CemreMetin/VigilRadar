"use client";

import { SHELTER_GUIDANCE as en, TR } from "@/data/survival";
import { useLang } from "@/lib/lang";

export default function ShelterGuidance() {
  const [lang] = useLang();
  const g = lang === "tr" ? { lead: TR.shelter.lead, leadBold: `“${TR.shelter.quote}” ${TR.shelter.translation}`, bullets: TR.shelter.bullets, sources: en.sources, source: TR.shelter.sourceLabel } : { ...en, source: "Source:" };
  return (
    <div className="mt-3 border border-line p-4 text-read leading-relaxed">
      <p>
        {g.lead} <strong>{g.leadBold}</strong>
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-body text-dim">
        {g.bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      <p className="mono mt-3 text-body text-dim">
        {g.source}{" "}
        {g.sources.map((s, i) => (
          <span key={s.url}>
            {i > 0 && " · "}
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{s.label}</a>
          </span>
        ))}
      </p>
    </div>
  );
}
