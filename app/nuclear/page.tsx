import type { Metadata } from "next";
import Link from "next/link";
import { readFile } from "node:fs/promises";
import path from "node:path";
import manual from "@/data/manual-counters.json";
import { arsenals } from "@/lib/arsenals";
import dyadsFile from "@/data/dyads.json";
import SiteNav from "@/components/SiteNav";
import WikiShell, { type WikiSection } from "@/components/WikiShell";
import type { PlantsFile } from "@/lib/types";

export const metadata: Metadata = {
  title: "Nuclear · Monitoring",
  description:
    "Nuclear arsenals by country (SIPRI, January 2026), the Doomsday Clock, and nuclear power plants, with sources and caveats.",
};

async function loadPlants(): Promise<PlantsFile | null> {
  try {
    return JSON.parse(
      await readFile(path.join(process.cwd(), "public", "data", "nuclear_plants.json"), "utf8"),
    ) as PlantsFile;
  } catch {
    return null;
  }
}

const n = (v: number) => v.toLocaleString("en-US");

export default async function NuclearPage() {
  const plantsFile = await loadPlants();
  const clock = manual.counters.find((c) => c.id === "doomsday-clock");
  const rows = [...arsenals.countries].sort((a, b) => b.inventory - a.inventory);
  const maxInv = Math.max(...rows.map((r) => r.inventory));

  const byCountry = new Map<string, { count: number; mw: number }>();
  for (const p of plantsFile?.plants ?? []) {
    const cur = byCountry.get(p.country) ?? { count: 0, mw: 0 };
    cur.count += 1;
    cur.mw += p.mw;
    byCountry.set(p.country, cur);
  }
  const plantRows = [...byCountry.entries()].sort((a, b) => b[1].mw - a[1].mw).slice(0, 12);

  const sections: WikiSection[] = [
    { id: "overview", label: "Overview", group: "Weapons", content: (<>
            <div className="mt-3 grid gap-px border border-line bg-line sm:grid-cols-3">
        <div className="bg-panel-solid p-4">
          <p className="label">Doomsday Clock</p>
          <p className="mono mt-1 text-3xl" style={{ color: "var(--threat)" }}>
            {clock?.value}
          </p>
          <p className="mt-1 text-xs text-dim">to midnight · set {clock?.asOf}</p>
          <p className="mt-2 text-[11px] leading-snug text-dim">{clock?.note}</p>
        </div>
        <div className="bg-panel-solid p-4">
          <p className="label">Military stockpile</p>
          <p className="mono mt-1 text-3xl" style={{ color: "var(--geo)" }}>
            {n(arsenals.totals.stockpile)}
          </p>
          <p className="mt-1 text-xs text-dim">
            {n(arsenals.totals.deployed)} deployed · {n(arsenals.totals.stored)} in storage
          </p>
          <p className="mt-2 text-[11px] leading-snug text-dim">Warheads that could be used: the number that matters most.</p>
        </div>
        <div className="bg-panel-solid p-4">
          <p className="label">Total inventory</p>
          <p className="mono mt-1 text-3xl text-fg">{n(arsenals.totals.inventory)}</p>
          <p className="mt-1 text-xs text-dim">incl. {n(arsenals.totals.retired)} retired, awaiting dismantling</p>
          <p className="mt-2 text-[11px] leading-snug text-dim">Falls as old warheads are dismantled even while usable stockpiles grow.</p>
        </div>
      </div>

    </>) },
    { id: "arsenals", label: `Arsenals · ${arsenals.asOf}`, group: "Weapons", content: (<>
      <div className="mt-2 overflow-x-auto border border-line">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="label border-b border-line text-left">
              <th className="p-2 font-normal">Country</th>
              <th className="p-2 font-normal">Composition (share of total inventory)</th>
              <th className="mono p-2 text-right font-normal">Deployed</th>
              <th className="mono p-2 text-right font-normal">Stored</th>
              <th className="mono p-2 text-right font-normal">Retired</th>
              <th className="mono p-2 text-right font-normal">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.iso3}>
                <th scope="row" className="p-2 text-left font-medium">
                  {r.name}
                </th>
                <td className="p-2">
                  <div
                    className="flex h-2.5 bg-line"
                    style={{ width: `${(r.inventory / maxInv) * 100}%`, minWidth: 6 }}
                    role="img"
                    aria-label={`${r.name}: ${r.deployed} deployed, ${r.stored} stored, ${r.retired} retired`}
                  >
                    <span style={{ width: `${(r.deployed / r.inventory) * 100}%`, background: "var(--threat)" }} />
                    <span style={{ width: `${(r.stored / r.inventory) * 100}%`, background: "rgba(255,0,60,0.4)" }} />
                    <span style={{ width: `${(r.retired / r.inventory) * 100}%`, background: "rgba(125,140,151,0.55)" }} />
                  </div>
                </td>
                <td className="mono p-2 text-right">{r.deployed ? n(r.deployed) : "–"}</td>
                <td className="mono p-2 text-right">{n(r.stored)}</td>
                <td className="mono p-2 text-right">{r.retired ? n(r.retired) : "–"}</td>
                <td className="mono p-2 text-right font-bold">{n(r.inventory)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-line-strong">
              <th scope="row" className="p-2 text-left">World</th>
              <td />
              <td className="mono p-2 text-right">{n(arsenals.totals.deployed)}</td>
              <td className="mono p-2 text-right">{n(arsenals.totals.stored)}</td>
              <td className="mono p-2 text-right">{n(arsenals.totals.retired)}</td>
              <td className="mono p-2 text-right font-bold">{n(arsenals.totals.inventory)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="mono mt-2 flex flex-wrap gap-x-4 text-[11px] text-dim">
        <span><span className="mr-1 inline-block h-2 w-2" style={{ background: "var(--threat)" }} />deployed</span>
        <span><span className="mr-1 inline-block h-2 w-2" style={{ background: "rgba(255,0,60,0.4)" }} />stored</span>
        <span><span className="mr-1 inline-block h-2 w-2" style={{ background: "rgba(125,140,151,0.55)" }} />retired</span>
      </p>

      <ul className="mt-4 list-disc space-y-1 pl-5 text-xs leading-relaxed text-dim">
        {arsenals.notes.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <dl className="mt-4 grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
        {Object.entries(arsenals.definitions).map(([k, v]) => (
          <div key={k}>
            <dt className="label inline">{k.replace(/([A-Z])/g, " $1")}: </dt>
            <dd className="inline text-dim">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mono mt-3 text-[11px] text-dim">
        Source:{" "}
        <a href={arsenals.source.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
          {arsenals.source.name} ↗
        </a>{" "}
        · published {arsenals.publishedAt}
      </p>

    </>) },
    { id: "pairs", label: "Tension pairs", group: "Weapons", content: (<>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-dim">
        The map draws a line between these country pairs and colours it by how tense news coverage of the pair is. Each pair is listed for the reason given here.
        Being listed is not an accusation and not a prediction. Live values are on the map (Nuclear tab) and in <Link href="/methodology?tab=pairs" className="text-accent hover:underline">the methodology</Link>.
      </p>
      <ul className="mt-3 divide-y divide-line border border-line">
        {dyadsFile.pairs.map((d) => (
          <li key={d.a + d.b} className="px-3 py-2">
            <p className="text-[13px] font-bold">
              {d.label}
              {"sensitive" in d && d.sensitive ? <span className="mono ml-2 text-[10px] font-bold text-geo">SENSITIVE</span> : null}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-dim">{d.why}</p>
          </li>
        ))}
      </ul>
    </>) },
    { id: "plants", label: "Power plants", group: "Civil", content: (<>
      <p className="mt-2 max-w-2xl text-xs leading-relaxed text-dim">
        Civil power reactors are not weapons. They are shown because a war, quake or flood near a
        plant is a risk of its own; the map links quakes and conflict reports near a plant. Switch on{" "}
        <em>Nuclear</em> on the map to see all {plantsFile?.plants.length ?? "–"}.
      </p>
      {plantsFile && (
        <>
          <div className="mt-2 border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="label border-b border-line text-left">
                  <th className="p-2 font-normal">Country (top 12 by capacity)</th>
                  <th className="mono p-2 text-right font-normal">Plants</th>
                  <th className="mono p-2 text-right font-normal">Capacity (MW)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {plantRows.map(([country, v]) => (
                  <tr key={country}>
                    <th scope="row" className="p-2 text-left font-medium">{country}</th>
                    <td className="mono p-2 text-right">{v.count}</td>
                    <td className="mono p-2 text-right">{n(v.mw)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mono mt-2 text-[11px] text-dim">
            Source:{" "}
            <a href={plantsFile.source.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              {plantsFile.source.name} ↗
            </a>{" "}
            · {plantsFile.source.license} · vintage: {plantsFile.vintage}
          </p>
        </>
      )}
    </>) },
  ];

  return (
    <>
      <SiteNav />
      <WikiShell
        title="Nuclear"
        accent="var(--threat)"
        intro="Who has how many warheads, and what the most-cited symbolic clock says. These are published estimates, not live data."
        sections={sections}
      />
    </>
  );
}
