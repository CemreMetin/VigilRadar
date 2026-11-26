"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LangSwitch from "@/components/LangSwitch";
import { useLang } from "@/lib/lang";

type PageLink = { href: string; label: string; blurb: string };

/** Every content page: the wiki sidebar, the offline save list and the search index read it. */
export const PAGE_GROUPS: { title: string; pages: PageLink[] }[] = [
  { title: "Map", pages: [{ href: "/", label: "Map", blurb: "Live radar and simulator" }] },
  { title: "Scenarios", pages: [{ href: "/library", label: "Scenarios", blurb: "What could go wrong, and how well we know it" }] },
  { title: "Metrics", pages: [{ href: "/metrics", label: "Metrics", blurb: "The live counters" }] },
  { title: "Survive", pages: [{ href: "/survive", label: "Survive", blurb: "What you can do (works offline)" }] },
  {
    title: "Atlases",
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

/** Header for content pages: the brand, the three pages and the language. */
export default function SiteNav() {
  const path = usePathname() ?? "";
  const current = path === "/about" ? "/about" : path.startsWith("/library") ? "/library" : undefined;
  return (
    <header className="no-print border-b border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-3 py-1 md:h-[51px] md:flex-nowrap">
        <Link href="/" className="mono text-read font-bold tracking-[0.2em] text-accent">VIGILRADAR</Link>
        <MainNav current={current} />
        <div className="ml-auto"><LangSwitch /></div>
      </div>
    </header>
  );
}
