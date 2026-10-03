import Link from "next/link";

export const PAGES: { href: string; label: string; blurb: string }[] = [
  { href: "/", label: "Map", blurb: "Live board" },
  { href: "/scenarios", label: "Scenarios", blurb: "What could go wrong, and how well we know it" },
  { href: "/survive", label: "Survive", blurb: "What you can do (works offline)" },
  { href: "/trajectory", label: "Trajectory", blurb: "Where the climate is heading, expert estimates" },
  { href: "/nuclear", label: "Nuclear", blurb: "Arsenals, plants, tension pairs" },
  { href: "/health", label: "Health", blurb: "WHO outbreak reports" },
  { href: "/supervolcanoes", label: "Supervolcanoes", blurb: "Watchlist and live status" },
  { href: "/country", label: "Countries", blurb: "Everything about one country" },
  { href: "/links", label: "Links", blurb: "How the risks feed each other" },
  { href: "/methodology", label: "Methodology", blurb: "How things are computed" },
  { href: "/sources", label: "Sources", blurb: "Where every number comes from" },
];

/** Compact menu used in page headers. A <details> element: no JavaScript needed. */
export function PagesMenu() {
  return (
    <details className="relative">
      <summary className="mono cursor-pointer list-none text-xs text-dim hover:text-accent [&::-webkit-details-marker]:hidden">
        pages ▾
      </summary>
      <ul className="panel absolute right-0 z-50 mt-2 w-72 divide-y divide-line border border-line-strong bg-panel-solid">
        {PAGES.map((p) => (
          <li key={p.href}>
            <Link href={p.href} className="block px-3 py-2 hover:bg-accent/10">
              <span className="mono text-xs text-accent">{p.label}</span>
              <span className="block text-[11px] text-dim">{p.blurb}</span>
            </Link>
          </li>
        ))}
      </ul>
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
          {PAGES.slice(1, 5).map((p) => (
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
