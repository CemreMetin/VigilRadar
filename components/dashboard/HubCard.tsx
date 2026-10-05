import Link from "next/link";

const BASICS = ["Water for several days", "Light, radio, spare power", "Medicines and documents", "A written family plan"];

/**
 * Survival hub entry, docked at the bottom of the right panel. The list is plain muted text (reading);
 * the two actions are bordered buttons (clicking). Green is the "safe / action" colour.
 */
export default function HubCard() {
  return (
    <div className="shrink-0 border-t border-line p-3">
      <p className="label" style={{ color: "var(--safe)" }}>What can you do?</p>
      <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] font-light text-dim">
        {BASICS.map((b) => (
          <li key={b} className="truncate before:mr-1.5 before:content-['·']">
            {b}
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        <Link
          href="/survive"
          style={{ "--c": "var(--safe)" } as React.CSSProperties}
          className="btn mono flex-1 px-2 py-1.5 text-center text-xs font-bold"
        >
          Open checklist
        </Link>
        <Link href="/survive#maps" style={{ "--c": "var(--safe)" } as React.CSSProperties} className="btn mono px-2 py-1.5 text-center text-xs font-bold">
          Offline maps
        </Link>
      </div>
    </div>
  );
}
