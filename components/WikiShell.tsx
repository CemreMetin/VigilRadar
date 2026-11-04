"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLazyJson } from "@/lib/useLazyJson";
import { PAGE_GROUPS } from "./SiteNav";

type SearchEntry = { url: string; page: string; section: string; text: string };

/** Entries whose text (or title) holds every word of the query; title hits first, then by number of matches. */
function search(index: SearchEntry[], words: string[]) {
  return index
    .map((e) => {
      const title = `${e.page} ${e.section}`.toLowerCase();
      if (!words.every((w) => e.text.includes(w) || title.includes(w))) return null;
      const hits = words.reduce((n, w) => n + e.text.split(w).length - 1, 0);
      return { e, score: (words.every((w) => title.includes(w)) ? 1000 : 0) + hits };
    })
    .filter((r): r is { e: SearchEntry; score: number } => r !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((r) => r.e);
}

const escapeRegex = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** A short stretch of the text around the first match, with every matching word in bold. */
function Snippet({ text, words }: { text: string; words: string[] }) {
  const first = Math.min(...words.map((w) => text.indexOf(w)).filter((i) => i >= 0), text.length);
  const from = Math.max(0, first - 40);
  const parts = text.slice(from, from + 150).split(new RegExp(`(${words.map(escapeRegex).join("|")})`));
  return (
    <>
      {from > 0 && "…"}
      {parts.map((part, i) => (words.includes(part) ? <mark key={i} className="bg-transparent font-bold text-fg">{part}</mark> : part))}
      …
    </>
  );
}

export type WikiSection = {
  id: string;
  label: string;
  /** kept for older call sites; the sidebar groups by page, not by section group */
  group?: string;
  hint?: string;
  content: ReactNode;
};

/**
 * The site's wiki frame: a dual-pane layout used by every informational page.
 *
 *   left pane   a fixed, scrollable tree of all pages in the five groups of PAGE_GROUPS; the current page is white and
 *               expands to its own sections, everything else is muted
 *   right pane  the reading area, at most 3xl wide so lines stay readable
 *
 * One section of the current page is shown at a time. It lives in the URL as ?tab=id (a #id hash from older
 * links works too). On narrow screens the tree moves into a menu above the content.
 * Type: Inter for running text, JetBrains Mono for headings, tables and data (see .wiki in globals.css).
 */

const isActivePage = (path: string, href: string) => path === href || path.startsWith(`${href}/`);

export default function WikiShell({
  title,
  intro,
  updated,
  keyPoints,
  sources,
  sections: given,
  accent = "var(--accent)",
  aside,
  openOnParam,
}: {
  title: string;
  intro?: ReactNode;
  /** "Last updated": the data date or the content date, whichever the page shows */
  updated?: string;
  /** at most four bullets, shown on the first section */
  keyPoints?: string[];
  /** the links the page cites; they become its last section, "Sources" */
  sources?: { label: string; url: string }[];
  sections: WikiSection[];
  accent?: string;
  /** shown above the content on every section (for example the offline button) */
  aside?: ReactNode;
  /** a query parameter that opens a section when no tab is given, e.g. { for: "bag" } */
  openOnParam?: Record<string, string>;
}) {
  const path = usePathname() ?? "";
  const sections = useMemo<WikiSection[]>(
    () =>
      sources?.length
        ? [
            ...given,
            {
              id: "sources",
              label: "Sources",
              content: (
                <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-xs leading-relaxed text-dim">
                  {sources.map((x) => (
                    <li key={x.url}>
                      {x.label}{" "}
                      <a href={x.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                        link ↗
                      </a>
                    </li>
                  ))}
                </ol>
              ),
            },
          ]
        : given,
    [given, sources],
  );
  const [activeId, setActiveId] = useState(sections[0].id);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [printedOn, setPrintedOn] = useState("");
  const [dataAsOf, setDataAsOf] = useState("n/a");

  // the data date printed in the footer: from the same world_state.json the map reads (it is cached for offline use)
  useEffect(() => {
    fetch("/data/world_state.json")
      .then((r) => r.json())
      .then((w: { generatedAt: string }) => setDataAsOf(w.generatedAt.slice(0, 10)))
      .catch(() => {});
  }, []);

  /** html[data-print] tells the print stylesheet which container to print; afterprint clears it. */
  const [printMode, setPrintMode] = useState<"section" | "all" | null>(null);
  const print = (m: "section" | "all") => {
    setPrintedOn(new Date().toISOString().slice(0, 10));
    setPrintMode(m);
  };
  useEffect(() => {
    if (!printMode) return;
    document.documentElement.dataset.print = printMode;
    const t = setTimeout(() => window.print(), 80); // the print-only container is in the DOM by now
    return () => clearTimeout(t);
  }, [printMode]);
  useEffect(() => {
    const clear = () => {
      delete document.documentElement.dataset.print;
      setPrintMode(null);
    };
    window.addEventListener("afterprint", clear);
    return () => window.removeEventListener("afterprint", clear);
  }, []);
  const printAll = printMode === "all";

  const open = useCallback(
    (id: string) => {
      if (!sections.some((s) => s.id === id)) return;
      setActiveId(id);
      const p = new URLSearchParams(window.location.search);
      p.set("tab", id);
      window.history.replaceState(null, "", `${window.location.pathname}?${p}`);
      window.scrollTo({ top: 0 });
      setMenuOpen(false);
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
  const words = q.split(/\s+/).filter(Boolean);
  const { data: searchIndex } = useLazyJson<SearchEntry[]>("/search-index.json", q.length >= 3);
  const results = useMemo(() => (q.length >= 3 && searchIndex ? search(searchIndex, words) : []), [q, searchIndex]); // eslint-disable-line react-hooks/exhaustive-deps
  const [picked, setPicked] = useState(0);

  const go = (url: string) => {
    const [path, id] = url.split("#");
    setQuery("");
    if (path === window.location.pathname) open(id);
    else window.location.assign(url);
  };

  // "/" jumps to the filter box unless the person is typing somewhere else
  useEffect(() => {
    const focusFilter = () => [...document.querySelectorAll<HTMLInputElement>("#wiki-filter")].find((i) => i.offsetParent)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey || (e.target as HTMLElement).closest("input, textarea, select, [contenteditable]")) return;
      e.preventDefault();
      if (document.querySelectorAll("#wiki-filter").length && ![...document.querySelectorAll("#wiki-filter")].some((i) => (i as HTMLElement).offsetParent)) {
        setMenuOpen(true);
        requestAnimationFrame(focusFilter);
      } else focusFilter();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const tree = useMemo(
    () =>
      PAGE_GROUPS.map((g) => ({
        ...g,
        pages: g.pages.filter(
          (p) => !q || p.label.toLowerCase().includes(q) || (isActivePage(path, p.href) && sections.some((s) => s.label.toLowerCase().includes(q))),
        ),
      })).filter((g) => g.pages.length > 0),
    [q, path, sections],
  );

  const index = sections.findIndex((s) => s.id === activeId);
  const active = sections[index] ?? sections[0];
  const prev = sections[index - 1];
  const next = sections[index + 1];

  const nav = (
    <nav aria-label="Wiki" className="text-[13px]">
      <label className="sr-only" htmlFor="wiki-filter">
        Filter pages
      </label>
      <input
        id="wiki-filter"
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setPicked(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setQuery("");
          else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setPicked((i) => Math.max(0, Math.min(results.length - 1, i + (e.key === "ArrowDown" ? 1 : -1))));
          } else if (e.key === "Enter" && results[picked]) go(results[picked].url);
        }}
        placeholder="Search the site  ( / )"
        aria-controls="wiki-results"
        className="mono mb-5 w-full border border-line bg-transparent px-2 py-1.5 text-xs placeholder:text-dim focus:outline-none"
      />
      {q.length >= 3 && (
        <div id="wiki-results" className="-mt-3 mb-5" aria-live="polite">
          {results.length === 0 ? (
            <p className="mono text-[11px] text-dim">{searchIndex ? "No text matches." : "Searching…"}</p>
          ) : (
            <ul role="listbox" aria-label="Search results" className="border-l border-line">
              {results.map((r, i) => (
                <li key={r.url} role="option" aria-selected={i === picked}>
                  <a
                    href={r.url}
                    onClick={(e) => {
                      e.preventDefault();
                      go(r.url);
                    }}
                    className={`block break-words py-1 pl-3 hover:text-fg ${i === picked ? "-ml-px border-l border-fg text-fg" : "text-dim"}`}
                  >
                    <span className="mono block text-[11px] font-bold text-fg">
                      {r.page} › {r.section}
                    </span>
                    <span className="block text-[11px] leading-snug">
                      <Snippet text={r.text} words={words} />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {tree.map((g) => (
        <div key={g.title} className="mb-5">
          <p className="mono mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-dim opacity-70">{g.title}</p>
          <ul className="border-l border-line">
            {g.pages.map((p) => {
              const here = isActivePage(path, p.href);
              return (
                <li key={p.href}>
                  <Link
                    href={p.href}
                    aria-current={here ? "page" : undefined}
                    className={`block py-1 pl-3 hover:text-fg ${here ? "-ml-px border-l border-fg font-semibold text-fg" : "text-dim"}`}
                  >
                    {p.label}
                  </Link>
                  {here && (
                    <ul className="mb-1 ml-3 border-l border-line">
                      {sections
                        .filter((s) => !q || s.label.toLowerCase().includes(q) || p.label.toLowerCase().includes(q))
                        .map((s) => (
                          <li key={s.id}>
                            <button
                              type="button"
                              onClick={() => open(s.id)}
                              aria-current={s.id === active.id ? "true" : undefined}
                              className={`block w-full py-0.5 pl-3 text-left text-[12px] hover:text-fg ${s.id === active.id ? "-ml-px border-l border-fg text-fg" : "text-dim"}`}
                            >
                              {s.label}
                            </button>
                          </li>
                        ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {tree.length === 0 && <p className="mono text-[11px] text-dim">No page matches.</p>}
    </nav>
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col lg:flex-row">
      {/* narrow screens: the tree sits behind a menu button above the content */}
      <div className="no-print border-b border-line px-4 py-2 lg:hidden">
        <button type="button" className="btn mono px-3 py-1.5 text-xs font-bold" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}>
          {menuOpen ? "CLOSE MENU" : `MENU · ${title.toUpperCase()}`}
        </button>
        {menuOpen && <div className="mt-3">{nav}</div>}
      </div>
      {/* wide screens: fixed, scrollable left pane */}
      <aside className="no-print scroll-thin sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-line px-5 py-6 lg:block">{nav}</aside>

      <main className="min-w-0 flex-1 px-4 pb-24 pt-8 lg:px-10" role="tabpanel" aria-label={active.label}>
        <article className="wiki max-w-3xl">
          <p className="print-header hidden print:block">
            {title} · printed {printedOn}
          </p>
          <h1 className="mono text-xl font-bold tracking-wide" style={{ color: accent }}>
            {title}
          </h1>
          {intro && <div className="mt-3 text-sm leading-relaxed text-dim">{intro}</div>}
          {updated && <p className="mono mt-2 text-[11px] text-dim">Last updated: {updated}</p>}
          {keyPoints && index <= 0 && (
            <section aria-label="Key points" className="mt-4 border border-line p-3">
              <p className="label">Key points</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed">
                {keyPoints.slice(0, 4).map((k) => (
                  <li key={k}>{k}</li>
                ))}
              </ul>
            </section>
          )}
          {aside && <div className="no-print mt-5">{aside}</div>}

          <div className="no-print mt-4 flex flex-wrap gap-2" role="toolbar" aria-label="Print">
            <button type="button" className="btn mono px-3 py-1 text-[11px] font-bold" onClick={() => print("section")}>
              Print this section
            </button>
            <button type="button" className="btn mono px-3 py-1 text-[11px] font-bold" onClick={() => print("all")}>
              Print whole page
            </button>
          </div>

          <div className="screen-section">
            <h2 className="mono mt-8 border-t border-line pt-4 text-sm font-bold tracking-[0.14em]" style={{ color: accent }}>
              {active.label.toUpperCase()}
            </h2>
            <div className="mt-1">{active.content}</div>
          </div>

          {/* the whole page, in order, for printing only */}
          {printAll && (
            <div className="print-all hidden print:block">
              {keyPoints && (
                <section aria-label="Key points" className="print-keypoints">
                  <p className="label">Key points</p>
                  <ul className="list-disc pl-5">
                    {keyPoints.slice(0, 4).map((k) => (
                      <li key={k}>{k}</li>
                    ))}
                  </ul>
                </section>
              )}
              {sections.map((sec) => (
                <section key={sec.id} className="print-section" data-section={sec.id} data-label={sec.label}>
                  <h2 className="mono">{sec.label.toUpperCase()}</h2>
                  {sec.content}
                </section>
              ))}
            </div>
          )}
          <p className="print-footer hidden print:block">
            Monitoring · monitoring-9l7.pages.dev · printed {printedOn} · data as of {dataAsOf}
          </p>

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
        </article>
      </main>
    </div>
  );
}
