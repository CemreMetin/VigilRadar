"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useJson } from "@/lib/useJson";
import type { ProfilesFile } from "@/lib/types";
import { arsenals } from "@/lib/arsenals";
import { Card, Ext, H1, H2, KindTag, Lead, Loading } from "./ui";

const n = (v: number) => v.toLocaleString("en-US");

// extra names people type; GeoNames says "Turkey", "United States", and so on
const ALT_NAMES: Record<string, string[]> = {
  TUR: ["türkiye", "turkiye"],
  USA: ["usa", "america", "united states of america"],
  GBR: ["uk", "britain", "great britain", "england"],
  KOR: ["korea", "republic of korea"],
  PRK: ["dprk", "north korea"],
  RUS: ["russian federation"],
  COD: ["drc", "congo-kinshasa"],
  CZE: ["czechia"],
  ARE: ["uae", "emirates"],
};

export default function CountryView() {
  const { data, error, loading } = useJson<ProfilesFile>("/data/country_profiles.json");
  const [iso, setIso] = useState<string>("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("c");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (c) setIso(c.toUpperCase());
  }, []);

  const list = useMemo(() => {
    const all = Object.values(data?.countries ?? {});
    const q = query.trim().toLowerCase();
    return all
      .filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.iso3.toLowerCase() === q ||
          (ALT_NAMES[c.iso3] ?? []).some((a) => a.includes(q)),
      )
      .sort((a, b) => b.signals.length - a.signals.length || a.name.localeCompare(b.name));
  }, [data, query]);

  const p = data?.countries[iso];
  const arsenal = arsenals.countries.find((c) => c.iso3 === iso);

  const select = (code: string) => {
    setIso(code);
    window.history.replaceState(null, "", `?c=${code}`);
  };

  return (
    <>
      <H1>Countries</H1>
      <Lead>
        Everything this site knows about one country on one page: nuclear status, tension pairs, outbreak reports, armed
        conflict in the news, supervolcanoes, water and food indicators. Signals listed together happen at the same time, which is not
        the same as one causing the other.
      </Lead>

      {loading || error ? <Loading error={error} /> : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
          <div>
            <label className="label" htmlFor="country-search">Find a country</label>
            <input
              id="country-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Türkiye, India, USA"
              className="mono mt-1 w-full border border-line bg-bg px-2 py-1.5 text-xs text-fg"
            />
            <ul className="scroll-thin mt-2 max-h-[420px] divide-y divide-line overflow-y-auto border border-line">
              {list.slice(0, 80).map((c) => (
                <li key={c.iso3}>
                  <button
                    type="button"
                    onClick={() => select(c.iso3)}
                    aria-current={c.iso3 === iso}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-xs hover:bg-accent/5 ${c.iso3 === iso ? "bg-accent/10 text-accent" : ""}`}
                  >
                    <span className="truncate">{c.name}</span>
                    {c.signals.length > 0 && <span className="mono text-[10px] text-geo">{c.signals.length} signal{c.signals.length > 1 ? "s" : ""}</span>}
                  </button>
                </li>
              ))}
              {list.length === 0 && <li className="px-3 py-3 text-xs text-dim">No match.</li>}
            </ul>
          </div>

          <div>
            {!p ? (
              <p className="text-sm text-dim">Choose a country from the list. Countries with active signals are listed first.</p>
            ) : (
              <>
                <h2 className="text-lg font-semibold">{p.name}</h2>
                <p className="mono mt-1 text-xs text-dim">{p.iso3} · population {n(p.population)}</p>

                {p.signals.length > 0 && (
                  <Card className="mt-4">
                    <p className="label">Active now (co-occurrence, not cause)</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                      {p.signals.map((s) => <li key={s}>{s}</li>)}
                    </ul>
                  </Card>
                )}

                {arsenal && (
                  <section>
                    <H2>Nuclear</H2>
                    <KindTag kind="reference" />
                    <p className="mt-2 text-sm leading-relaxed">
                      Military stockpile <span className="mono">{n(arsenal.stockpile)}</span> warheads, <span className="mono">{n(arsenal.deployed)}</span> deployed,
                      total inventory <span className="mono">{n(arsenal.inventory)}</span> (SIPRI, January 2026).{" "}
                      <Link href="/nuclear" className="text-accent hover:underline">All arsenals →</Link>
                    </p>
                  </section>
                )}

                {p.dyads.length > 0 && (
                  <section>
                    <H2>Tension pairs</H2>
                    <ul className="mt-2 divide-y divide-line border border-line">
                      {p.dyads.map((d) => (
                        <li key={d.other} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                          <span>{d.label}</span>
                          <span className="mono text-xs">{d.tension != null ? `${d.tension}/100` : "low data"}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-1 text-[11px] text-dim">A description of media coverage, not a forecast. <Link href="/methodology#tension" className="text-accent hover:underline">How it is computed</Link>.</p>
                  </section>
                )}

                {p.plants && (
                  <section>
                    <H2>Nuclear power plants</H2>
                    <p className="mt-2 text-sm"><span className="mono">{p.plants.count}</span> plants, <span className="mono">{n(p.plants.mw)}</span> MW (dataset from about 2019).</p>
                  </section>
                )}

                {p.volcanoes.length > 0 && (
                  <section>
                    <H2>Supervolcanoes</H2>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                      {p.volcanoes.map((v) => <li key={v.id}>{v.name}: {v.level === "elevated" ? "above baseline" : v.level === "normal" ? "normal" : "no live feed"}</li>)}
                    </ul>
                    <p className="mt-1 text-xs"><Link href="/supervolcanoes" className="text-accent hover:underline">Watchlist →</Link></p>
                  </section>
                )}

                {p.outbreaks.length > 0 && (
                  <section>
                    <H2>WHO outbreak reports</H2>
                    <ul className="mt-2 divide-y divide-line border border-line">
                      {p.outbreaks.map((o) => (
                        <li key={o.title + o.date} className="flex justify-between gap-3 px-3 py-2 text-sm">
                          <span className="min-w-0">{o.url ? <Ext href={o.url}>{o.title} ↗</Ext> : o.title}</span>
                          <span className="mono shrink-0 text-[11px] text-dim">{o.date}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {p.violence7d != null && p.violence7d > 0 && (
                  <section>
                    <H2>Armed conflict in the news</H2>
                    <p className="mt-2 text-sm"><span className="mono">{n(p.violence7d)}</span> armed-conflict events reported in the last 7 days (GDELT, automatically coded; high-coverage countries are over-represented).</p>
                  </section>
                )}

                {(p.water || p.hunger) && (
                  <section>
                    <H2>Water and food</H2>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                      {p.water && <li>Freshwater withdrawal: <span className="mono">{p.water.value}%</span> of available resources ({p.water.year})</li>}
                      {p.hunger && <li>Undernourishment: <span className="mono">{p.hunger.value}%</span> of the population ({p.hunger.year})</li>}
                    </ul>
                  </section>
                )}

                <p className="mt-8 text-sm">
                  <Link href={`/?layers=nuclear%2Cconflict%2Chealth%2Cgeophysical&sel=country%3A${p.iso3}&tab=links`} className="text-accent hover:underline">
                    Show on the map with connections →
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
