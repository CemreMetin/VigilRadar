"use client";

import Link from "next/link";
import { useLang } from "@/lib/lang";

type PageLink = { href: string; label: string; blurb: string };

/** The one list of pages: the pages menu, the wiki sidebar and the offline save list all read it. */
export const PAGE_GROUPS: { title: string; pages: PageLink[] }[] = [
  { title: "Home", pages: [{ href: "/", label: "Home", blurb: "Start" }] },
  { title: "Scenarios", pages: [{ href: "/library", label: "Library", blurb: "What could go wrong, and how well we know it" }] },
  { title: "Metrics", pages: [{ href: "/metrics", label: "Metrics", blurb: "The live counters" }] },
  { title: "Survive", pages: [{ href: "/survive", label: "Survive", blurb: "What you can do (works offline)" }] },
  {
    title: "Library",
    pages: [
      { href: "/nuclear", label: "Nuclear", blurb: "Arsenals, plants, tension pairs" },
      { href: "/health", label: "Health", blurb: "WHO outbreak reports" },
      { href: "/supervolcanoes", label: "Supervolcanoes", blurb: "Watchlist and live status" },
      { href: "/trajectory", label: "Trajectory", blurb: "Where the climate is heading, expert estimates" },
      { href: "/country", label: "Countries", blurb: "Everything about one country" },
      { href: "/links", label: "Links", blurb: "How the risks feed each other" },
    ],
  },
  {
    title: "About",
    pages: [
      { href: "/methodology", label: "Methodology", blurb: "How things are computed" },
      { href: "/sources", label: "Sources", blurb: "Where every number comes from" },
      { href: "/glossary", label: "Glossary", blurb: "What the abbreviations mean" },
    ],
  },
];

/** Compact menu used in page headers. A <details> element: no JavaScript needed. */
export function PagesMenu() {
  return (
    <details className="relative">
      <summary className="mono cursor-pointer list-none text-body text-dim hover:text-accent [&::-webkit-details-marker]:hidden">
        pages ▾
      </summary>
      <div className="panel absolute right-0 z-50 mt-2 w-72 border border-line-strong bg-panel-solid">
        {PAGE_GROUPS.map((g) => (
          <div key={g.title} className="border-b border-line last:border-0">
            <p className="label px-3 pt-2">{g.title}</p>
            <ul>
              {g.pages.map((p) => (
                <li key={p.href}>
                  <Link href={p.href} className="block px-3 py-1.5 hover:bg-accent/10">
                    <span className="mono text-body text-accent">{p.label}</span>
                    <span className="block text-body text-dim">{p.blurb}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}

const MAIN = [
  { href: "/", en: "Map", tr: "Harita" },
  { href: "/library", en: "Scenarios", tr: "Senaryolar" },
  { href: "/about", en: "About", tr: "Hakkında" },
] as const;

/** The only primary navigation: three pages. On the map itself, "Map" switches back to LIVE instead of navigating. */
export function MainNav({ current, onMap }: { current?: string; onMap?: () => void }) {
  const [lang] = useLang();
  return (
    <nav aria-label="Primary" className="flex gap-x-4 text-body">
      {MAIN.map((p) => (
        <Link key={p.href} href={p.href} aria-current={current === p.href ? "page" : undefined}
          onClick={onMap && p.href === "/" ? (e) => { e.preventDefault(); onMap(); } : undefined}
          className={`mono py-2 hover:text-accent ${current === p.href ? "text-fg" : "text-dim"}`}>
          {p[lang]}
        </Link>
      ))}
    </nav>
  );
}

/** Header for content pages. */
export default function SiteNav() {
  return (
    <header className="no-print border-b border-line">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
        <Link href="/" className="mono text-read font-bold tracking-[0.2em] text-accent">
          MONITORING
        </Link>
        <nav aria-label="Primary" className="flex flex-wrap gap-x-4 gap-y-1 text-body">
          {[...PAGE_GROUPS.slice(0, 3).flatMap((g) => g.pages), { href: PAGE_GROUPS[3].pages[0].href, label: PAGE_GROUPS[3].title }].map((p) => (
            <Link key={p.href} href={p.href} className="mono text-dim hover:text-accent">
              {p.label.toLowerCase()}
            </Link>
          ))}
        </nav>
        <div className="ml-auto">
          <PagesMenu />
        </div>
      </div>
    </header>
  );
}
