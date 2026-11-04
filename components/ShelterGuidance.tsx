import { SHELTER_GUIDANCE as g } from "@/data/survival";

export default function ShelterGuidance() {
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
        Source:{" "}
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
