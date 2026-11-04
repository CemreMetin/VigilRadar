"use client";

export type TickerItem = { id: string; at: string; kind: string; text: string; source: string; entityId?: string };

const utcHm = (iso: string) => `${iso.slice(11, 16)} UTC`;

/**
 * "What changed" along the bottom edge: alerts, notable quakes and new WHO reports from the data already loaded.
 * It scrolls slowly, stops on hover and focus, and is a plain static list under reduced motion.
 */
export default function Ticker({ items, onSelect }: { items: TickerItem[]; onSelect: (entityId: string) => void }) {
  const row = (hidden: boolean) =>
    items.map((it) => {
      const body = (
        <>
          <span className="text-dim">{utcHm(it.at)}</span> <span className="font-bold">{it.kind}</span> {it.text} <span className="text-dim">· {it.source}</span>
        </>
      );
      return (
        <li key={it.id + hidden} className="shrink-0 whitespace-nowrap">
          {it.entityId ? (
            <button type="button" tabIndex={hidden ? -1 : 0} onClick={() => onSelect(it.entityId!)} className="hover:text-fg focus-visible:text-fg">
              {body}
            </button>
          ) : (
            body
          )}
        </li>
      );
    });

  return (
    <div className="ticker mono overflow-hidden border-t border-line px-3 py-1 text-body text-dim" role="region" aria-label="What changed today">
      {items.length === 0 ? (
        <p>No notable change in the data loaded right now.</p>
      ) : (
        <>
          <ul className="ticker-track flex w-max gap-8">{row(false)}</ul>
          <ul className="ticker-track ticker-copy flex w-max gap-8" aria-hidden>
            {row(true)}
          </ul>
        </>
      )}
    </div>
  );
}
