import Link from "next/link";
import { Section } from "./parts";

const BASICS = ["Water for several days", "Light, radio, spare power", "Medicines and documents", "A written family plan"];

/**
 * Survival hub entry, docked at the bottom of the right panel. One row of actions; the basics are
 * behind a disclosure so the panel stays quiet. Green is the "safe / action" colour.
 */
export default function HubCard() {
  return (
    <div className="shrink-0 border-t border-line">
      <Section title="What can you do?">
        <ul className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-body text-dim">
          {BASICS.map((b) => (
            <li key={b} className="truncate before:mr-1.5 before:content-['·']">{b}</li>
          ))}
        </ul>
      </Section>
      <div className="flex gap-2 px-3 pb-3">
        <Link href="/survive" className="btn mono flex-1 px-2 py-1.5 text-center text-body font-bold">
          Open checklist
        </Link>
        <Link href="/survive?tab=maps" className="btn mono px-2 py-1.5 text-center text-body font-bold">
          Offline maps
        </Link>
      </div>
    </div>
  );
}
