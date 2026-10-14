"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { GROUPS, type GroupId, type Mode } from "@/lib/lenses";
import type { WorldState } from "@/lib/types";
import { PagesMenu } from "../SiteNav";

/**
 * Top bar = macro context: which scenario am I looking at? Two rows. The first has the scenario groups
 * (Overview, Human, Earth, Space); the second, smaller, has the scenarios of the active group. The active group
 * is derived from the active scenario, so picking a scenario by any route (alerts included) selects its group.
 * Keys 1-4 pick a group; pressing the active group's key again moves to its next scenario.
 */
export default function TopBar({
  modes,
  activeId,
  onSelect,
  onSelectGroup,
  world,
}: {
  modes: Mode[];
  activeId: string;
  onSelect: (id: string) => void;
  onSelectGroup: (id: GroupId) => void;
  world: WorldState | null;
}) {
  const active = modes.find((m) => m.id === activeId) ?? modes[0];
  const subs = modes.filter((m) => m.group === active.group);
  const bar = useRef<HTMLDivElement>(null);
  // on a very narrow bar a row can still overflow: keep the selected tab in view (also when switched by key)
  useEffect(() => {
    bar.current?.querySelectorAll<HTMLElement>('[aria-selected="true"]').forEach((el) => el.scrollIntoView({ inline: "nearest", block: "nearest" }));
  }, [activeId]);

  return (
    <div className="flex flex-wrap items-stretch gap-x-3 px-3 lg:flex-nowrap">
      <div className="flex shrink-0 flex-col justify-center py-1.5 pr-2">
        <h1 className="mono text-sm font-bold tracking-[0.22em] text-accent">MONITORING</h1>
        <span className="label hidden sm:block">global risk board</span>
      </div>

      <div className="order-last flex w-full min-w-0 flex-col lg:order-none lg:w-auto lg:flex-1" ref={bar}>
        <div className="scroll-thin flex items-stretch gap-1.5 overflow-x-auto pt-1.5" role="tablist" aria-label="Scenario group">
          {GROUPS.map((g, i) => {
            const on = g.id === active.group;
            return (
              <button
                key={g.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => onSelectGroup(g.id)}
                style={{ "--c": g.color } as CSSProperties}
                className="tab-btn flex w-fit shrink-0 items-baseline gap-2 whitespace-nowrap px-2.5 py-1.5 text-left sm:px-4"
              >
                <span className="mono text-[13px] font-bold uppercase tracking-wider" style={{ color: on ? "#fff" : g.color }}>
                  {g.title}
                </span>
                <span className="mono hidden text-[9px] font-light text-dim sm:inline" aria-hidden>
                  {i + 1}
                </span>
              </button>
            );
          })}
        </div>
        {/* sub-tabs: plain text, a line under the selected one. Overview has none. */}
        <div className="scroll-thin flex h-7 items-end gap-4 overflow-x-auto" role="tablist" aria-label="Scenario">
          {subs.length > 1 &&
            subs.map((m) => {
              const on = m.id === activeId;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => onSelect(m.id)}
                  title={m.stat(world)}
                  style={{ borderBottomColor: on ? m.color : "transparent", color: on ? "var(--fg)" : "var(--fg-dim)" }}
                  className="mono shrink-0 whitespace-nowrap border-b-2 px-0.5 pb-1 text-[11px] font-bold uppercase tracking-wider hover:text-fg"
                >
                  {m.title}
                </button>
              );
            })}
        </div>
      </div>

      <div className="ml-auto flex shrink-0 items-center pl-1 lg:ml-0">
        <PagesMenu />
      </div>
    </div>
  );
}
