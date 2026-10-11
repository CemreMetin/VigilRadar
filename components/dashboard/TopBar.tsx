"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import type { Mode } from "@/lib/lenses";
import type { WorldState } from "@/lib/types";
import { PagesMenu } from "../SiteNav";

/**
 * Top bar = macro context: which scenario am I looking at? It holds the brand, the scenario tabs and
 * the page menu, and nothing else. The tabs are mutually exclusive: exactly one is always selected.
 * Keys 1-9 switch tabs (the number shown on each tab).
 */
export default function TopBar({
  modes,
  activeId,
  onSelect,
  world,
}: {
  modes: Mode[];
  activeId: string;
  onSelect: (id: string) => void;
  world: WorldState | null;
}) {
  const list = useRef<HTMLDivElement>(null);
  // nine tabs can overflow a narrow bar: keep the selected one in view (also when switched by key)
  useEffect(() => {
    list.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }, [activeId]);

  return (
    <div className="flex items-stretch gap-3 px-3">
      <div className="flex shrink-0 flex-col justify-center py-1.5 pr-2">
        <h1 className="mono text-sm font-bold tracking-[0.22em] text-accent">MONITORING</h1>
        <span className="label hidden sm:block">global risk board</span>
      </div>

      <div ref={list} className="scroll-thin flex min-w-0 flex-1 items-stretch gap-1.5 overflow-x-auto py-1.5" role="tablist" aria-label="Scenario">
        {modes.map((m, i) => {
          const active = m.id === activeId;
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(m.id)}
              title={m.stat(world)}
              style={{ "--c": m.color } as CSSProperties}
              className="tab-btn group relative flex w-fit shrink-0 items-baseline gap-2 whitespace-nowrap px-4 py-2 text-left"
            >
              <span className="mono text-[13px] font-bold uppercase tracking-wider" style={{ color: active ? "#fff" : m.color }}>
                {m.title}
              </span>
              <span className="mono text-[9px] font-light text-dim" aria-hidden>
                {i + 1}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex shrink-0 items-center pl-1">
        <PagesMenu />
      </div>
    </div>
  );
}
