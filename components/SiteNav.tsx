import Link from "next/link";

type PageLink = { href: string; label: string; blurb: string };

/** The one list of pages: the pages menu, the wiki sidebar and the offline save list all read it. */
export const PAGE_GROUPS: { title: string; pages: PageLink[] }[] = [
  { title: "Map", pages: [{ href: "/", label: "Map", blurb: "Live board" }] },
  { title: "Scenarios", pages: [{ href: "/scenarios", label: "Scenarios", blurb: "What could go wrong, and how well we know it" }] },
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
    ],
  },
];

/** Compact menu used in page headers. A <details> element: no JavaScript needed. */
export function PagesMenu() {
  return (
    <details className="relative">
      <summary className="mono cursor-pointer list-none text-xs text-dim hover:text-accent [&::-webkit-details-marker]:hidden">
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
                    <span className="mono text-xs text-accent">{p.label}</span>
                    <span className="block text-[11px] text-dim">{p.blurb}</span>
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

/** Header for content pages. */
export default function SiteNav() {
  return (
    <header className="no-print border-b border-line">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
        <Link href="/" className="mono text-sm font-bold tracking-[0.2em] text-accent">
          MONITORING
        </Link>
        <nav aria-label="Primary" className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
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
