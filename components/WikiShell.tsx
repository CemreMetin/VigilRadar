"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

export type WikiSection = {
  id: string;
  label: string;
  /** sidebar group heading */
  group?: string;
  /** one line under the label in the sidebar */
  hint?: string;
  content: ReactNode;
};

/**
 * Wiki layout for informational pages: a sidebar of sections with a filter box, and one section shown at a time.
 * The section lives in the URL (?tab=id), and a #id hash (older links) opens the same section.
 * Narrow screens: the sidebar becomes a scrolling tab strip above the content.
 */
export default function WikiShell({
  title,
  intro,
  sections,
  accent = "var(--accent)",
  aside,
  openOnParam,
}: {
  title: string;
  intro?: ReactNode;
  sections: WikiSection[];
  accent?: string;
  /** shown above the content on every section (for example the offline button) */
  aside?: ReactNode;
  /** a query parameter that opens a section when no tab is given, e.g. { for: "bag" } */
  openOnParam?: Record<string, string>;
}) {
  const [activeId, setActiveId] = useState(sections[0].id);
  const [query, setQuery] = useState("");

  const open = useCallback(
    (id: string, push = true) => {
      if (!sections.some((s) => s.id === id)) return;
      setActiveId(id);
      if (push) {
        const p = new URLSearchParams(window.location.search);
        p.set("tab", id);
        window.history.replaceState(null, "", `${window.location.pathname}?${p}`);
      }
      window.scrollTo({ top: 0 });
    },
    [sections],
  );

  // read the URL after mount (static HTML has no query string), and follow #hash links
  useEffect(() => {
    const fromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const viaParam = Object.entries(openOnParam ?? {}).find(([k]) => params.has(k))?.[1];
      const id = params.get("tab") ?? viaParam ?? window.location.hash.slice(1);
      if (id && sections.some((s) => s.id === id)) setActiveId(id);
    };
    fromUrl();
    window.addEventListener("hashchange", fromUrl);
    return () => window.removeEventListener("hashchange", fromUrl);
  }, [sections, openOnParam]);

  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () => sections.filter((s) => !q || `${s.label} ${s.hint ?? ""} ${s.group ?? ""}`.toLowerCase().includes(q)),
    [sections, q],
  );
  const groups = useMemo(() => {
    const m = new Map<string, WikiSection[]>();
    for (const s of visible) m.set(s.group ?? "", [...(m.get(s.group ?? "") ?? []), s]);
    return [...m.entries()];
  }, [visible]);

  const index = sections.findIndex((s) => s.id === activeId);
  const active = sections[index] ?? sections[0];
  const prev = sections[index - 1];
  const next = sections[index + 1];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-8">
      <h1 className="mono text-xl font-bold tracking-wide" style={{ color: accent }}>
        {title}
      </h1>
      {intro && <div className="mt-3 max-w-3xl text-sm leading-relaxed text-dim">{intro}</div>}

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav aria-label={`${title} sections`} className="no-print lg:sticky lg:top-4 lg:self-start">
          <label className="sr-only" htmlFor="wiki-filter">
            Filter sections
          </label>
          <input
            id="wiki-filter"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter sections"
            className="mono mb-3 hidden w-full border border-line bg-transparent px-2 py-1.5 text-xs placeholder:text-dim focus:outline-none lg:block"
          />
          {/* wide: grouped vertical list; narrow: one scrolling row */}
          <div className="scroll-thin -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:block lg:overflow-visible lg:px-0" role="tablist" aria-orientation="vertical">
            {groups.map(([group, list]) => (
              <div key={group} className="flex gap-1 lg:mb-3 lg:block">
                {group && <p className="label caret mb-1 hidden lg:block">{group}</p>}
                {list.map((s) => {
                  const on = s.id === active.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      onClick={() => open(s.id)}
                      className="tab-btn relative w-auto shrink-0 px-2.5 py-1.5 text-left lg:block lg:w-full"
                      style={{ "--c": accent } as React.CSSProperties}
                    >
                      <span className="mono block whitespace-nowrap text-[12px] font-bold lg:whitespace-normal">{s.label}</span>
                      {s.hint && <span className="mono hidden text-[10px] font-light text-dim lg:block">{s.hint}</span>}
                      <span aria-hidden className="tab-bar absolute inset-x-0 bottom-0 h-0.5" style={{ background: accent }} />
                    </button>
                  );
                })}
              </div>
            ))}
            {visible.length === 0 && <p className="mono text-[11px] text-dim">No section matches.</p>}
          </div>
        </nav>

        <main className="min-w-0" role="tabpanel" aria-label={active.label}>
          {aside && <div className="no-print mb-4">{aside}</div>}
          <h2 className="mono text-sm font-bold tracking-[0.14em]" style={{ color: accent }}>
            {active.label.toUpperCase()}
          </h2>
          <div className="mt-1">{active.content}</div>
          <div className="no-print mt-10 flex justify-between gap-3 border-t border-line pt-3">
            {prev ? (
              <button type="button" className="btn mono px-3 py-1.5 text-xs font-bold" onClick={() => open(prev.id)}>
                ← {prev.label}
              </button>
            ) : (
              <span />
            )}
            {next && (
              <button type="button" className="btn mono px-3 py-1.5 text-xs font-bold" onClick={() => open(next.id)}>
                {next.label} →
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
