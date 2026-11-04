"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { Entity } from "@/lib/entities";
import type { LinkType, LinksFile } from "@/lib/types";

const TYPE_LABEL: Record<LinkType, string> = {
  spatial: "Nearby (spatial)",
  actor: "Same country (actor)",
  exposure: "Exposure",
  temporal: "Same time (co-occurrence)",
  causal: "Causal",
};

export type LinkedItem = { otherId: string; label: string; type: LinkType; distanceKm?: number };

/** Links touching an entity. A country-group id ("health:ISO") also shows the country's links. */
export function linksFor(id: string, links: LinksFile | null): LinkedItem[] {
  if (!links) return [];
  const ids = new Set([id]);
  if (id.startsWith("health:")) ids.add(`country:${id.slice(7)}`);
  const out: LinkedItem[] = [];
  const seen = new Set<string>();
  for (const l of links.links) {
    const hitFrom = ids.has(l.from);
    const hitTo = ids.has(l.to);
    if (!hitFrom && !hitTo) continue;
    const otherId = hitFrom ? l.to : l.from;
    if (seen.has(otherId + l.type)) continue;
    seen.add(otherId + l.type);
    out.push({ otherId, label: l.label, type: l.type, distanceKm: l.distanceKm });
  }
  return out;
}

export default function LinksPanel({
  selected,
  myCountry,
  links,
  entities,
  onSelect,
}: {
  selected: Entity | null;
  /** the visitor's stored country, listed first when it has computed links */
  myCountry: Entity | null;
  links: LinksFile | null;
  entities: Map<string, Entity>;
  onSelect: (id: string | null) => void;
}) {
  const items = useMemo(() => (selected ? linksFor(selected.id, links) : []), [selected, links]);
  const mine = useMemo(() => (myCountry ? linksFor(myCountry.id, links) : []), [myCountry, links]);
  const grouped = useMemo(() => {
    const m = new Map<LinkType, LinkedItem[]>();
    for (const it of items) m.set(it.type, [...(m.get(it.type) ?? []), it]);
    return [...m.entries()];
  }, [items]);

  const row = (it: LinkedItem) => {
    const other = entities.get(it.otherId);
    return (
      <li key={it.otherId + it.type}>
        <button
          type="button"
          onClick={() => other && onSelect(it.otherId)}
          disabled={!other}
          className="block w-full px-3 py-2 text-left hover:bg-accent/5 disabled:cursor-default disabled:hover:bg-transparent"
        >
          <span className="block text-body">{other?.title ?? it.otherId}</span>
          <span className="block text-body text-dim">{it.label}</span>
        </button>
      </li>
    );
  };
  const yourCountry = mine.length > 0 && (
    <div className="border-b border-line">
      <p className="label px-3 pt-3">Your country · {myCountry?.title} · {mine.length}</p>
      <ul className="divide-y divide-line">{mine.slice(0, 10).map(row)}</ul>
      {mine.length > 10 && <p className="px-3 pb-2 text-body text-dim">+ {mine.length - 10} more: click the country on the map</p>}
    </div>
  );

  if (!selected) {
    return (
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto" role="tabpanel">
      {yourCountry}
      <div className="p-4 text-body leading-relaxed text-dim">
        <p className="text-fg">Click anything on the map to see what it is linked to.</p>
        <p className="mt-2">
          Links are computed from data we already have: things that are <em>near</em> each other (an earthquake close to
          a nuclear plant), things in the <em>same country</em>, and how many people live within 100 km. They show
          connections, not causes. The causes we do claim are written down by hand, with sources, on the{" "}
          <Link href="/links" className="text-accent hover:underline">
            Links page
          </Link>
          .
        </p>
      </div>
      </div>
    );
  }

  return (
    <div className="scroll-thin min-h-0 flex-1 overflow-y-auto" role="tabpanel">
      {yourCountry}
      <div className="border-b border-line p-3">
        <p className="label">{selected.kind}</p>
        <p className="mt-1 text-body">{selected.title}</p>
        {selected.lines.map((l) => (
          <p key={l} className="mt-1.5 text-body leading-relaxed text-dim">
            {l}
          </p>
        ))}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {selected.link && (
            <a
              href={selected.link.href}
              {...(selected.link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="mono text-body text-accent hover:underline"
            >
              {selected.link.text}
            </a>
          )}
          <button type="button" onClick={() => onSelect(null)} className="mono text-body text-dim hover:text-fg">
            clear selection
          </button>
        </div>
      </div>

      {grouped.length === 0 ? (
        <p className="p-3 text-body text-dim">No computed links for this item right now.</p>
      ) : (
        grouped.map(([type, list]) => (
          <div key={type} className="border-b border-line">
            <p className="label px-3 pt-3">{TYPE_LABEL[type]} · {list.length}</p>
            <ul className="divide-y divide-line">
              {list.slice(0, 25).map(row)}
            </ul>
            {list.length > 25 && <p className="px-3 pb-2 text-body text-dim">+ {list.length - 25} more</p>}
          </div>
        ))
      )}
    </div>
  );
}
