"use client";

import Link from "next/link";
import { useJson } from "@/lib/useJson";
import { Card, Ext, KindTag, Loading, Term } from "./ui";
import { PAGE_META } from "@/data/pages";
import WikiShell, { type WikiSection } from "./WikiShell";

type Series = {
  generatedAt: string;
  giss: { baseline: string; annual: { y: number; v: number }[]; source: { name: string; url: string } };
  co2: { annual: { y: number; v: number }[]; source: { name: string; url: string } };
};

function LineChart({
  data,
  color,
  unit,
  label,
  zeroLine = false,
  height = 200,
}: {
  data: { y: number; v: number }[];
  color: string;
  unit: string;
  label: string;
  zeroLine?: boolean;
  height?: number;
}) {
  const W = 720;
  const L = 44;
  const R = 12;
  const T = 12;
  const B = 24;
  const minY = Math.min(...data.map((d) => d.y));
  const maxY = Math.max(...data.map((d) => d.y));
  const lo = Math.min(...data.map((d) => d.v), zeroLine ? 0 : Infinity);
  const hi = Math.max(...data.map((d) => d.v));
  const pad = (hi - lo) * 0.08;
  const vmin = lo - (zeroLine ? 0 : pad);
  const vmax = hi + pad;
  const x = (y: number) => L + ((y - minY) / (maxY - minY)) * (W - L - R);
  const yy = (v: number) => T + (1 - (v - vmin) / (vmax - vmin)) * (height - T - B);
  const pts = data.map((d) => `${x(d.y).toFixed(1)},${yy(d.v).toFixed(1)}`).join(" ");
  const ticks = 4;
  const last = data[data.length - 1];
  const first = data[0];

  return (
    <div className="mt-2 border border-line bg-panel-solid">
      <svg viewBox={`0 0 ${W} ${height}`} className="w-full" role="img" aria-label={`${label}: from ${first.v}${unit} in ${first.y} to ${last.v}${unit} in ${last.y}`}>
        {Array.from({ length: ticks + 1 }, (_, i) => {
          const v = vmin + ((vmax - vmin) * i) / ticks;
          return (
            <g key={i}>
              <line x1={L} x2={W - R} y1={yy(v)} y2={yy(v)} stroke="rgba(0,229,255,0.08)" />
              <text x={L - 6} y={yy(v) + 3} textAnchor="end" fontSize="10" fill="#7d8c97" fontFamily="monospace">{v.toFixed(vmax - vmin > 20 ? 0 : 1)}</text>
            </g>
          );
        })}
        {zeroLine && <line x1={L} x2={W - R} y1={yy(0)} y2={yy(0)} stroke="#7d8c97" strokeDasharray="2 3" />}
        {[minY, Math.round((minY + maxY) / 2 / 10) * 10, maxY].map((y) => (
          <text key={y} x={x(y)} y={height - 6} textAnchor="middle" fontSize="10" fill="#7d8c97" fontFamily="monospace">{y}</text>
        ))}
        <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
        <circle cx={x(last.y)} cy={yy(last.v)} r="3.5" fill={color} />
        <text x={x(last.y) - 6} y={yy(last.v) - 8} textAnchor="end" fontSize="11" fill={color} fontFamily="monospace">{last.v}{unit} ({last.y})</text>
      </svg>
    </div>
  );
}

// IPCC AR6 WGI SPM Table SPM.1 / SPM sea-level text: central estimate and very likely (temperature) or likely (sea level) range
const SSP = [
  { id: "SSP1-1.9", note: "very low emissions", t: [1.4, 1.0, 1.8], s: [0.38, 0.28, 0.55] },
  { id: "SSP1-2.6", note: "low", t: [1.8, 1.3, 2.4], s: [0.44, 0.32, 0.62] },
  { id: "SSP2-4.5", note: "intermediate", t: [2.7, 2.1, 3.5], s: [0.56, 0.44, 0.76] },
  { id: "SSP3-7.0", note: "high", t: [3.6, 2.8, 4.6], s: [0.68, 0.55, 0.9] },
  { id: "SSP5-8.5", note: "very high", t: [4.4, 3.3, 5.7], s: [0.77, 0.63, 1.01] },
];

function RangeBars({ field, max, unit }: { field: "t" | "s"; max: number; unit: string }) {
  return (
    <ul className="mt-2 divide-y divide-line border border-line">
      {SSP.map((s) => {
        const [mid, lo, hi] = s[field];
        return (
          <li key={s.id} className="flex items-center gap-3 px-3 py-2 text-xs">
            <span className="w-28 shrink-0"><span className="mono text-fg">{s.id}</span><span className="block text-[10px] text-dim">{s.note}</span></span>
            <span className="relative h-3 flex-1 bg-line" role="img" aria-label={`${s.id}: ${mid}${unit}, range ${lo} to ${hi}${unit}`}>
              <span className="absolute inset-y-0" style={{ left: `${(lo / max) * 100}%`, width: `${((hi - lo) / max) * 100}%`, background: "repeating-linear-gradient(90deg, var(--geo) 0 5px, transparent 5px 8px)", opacity: 0.8 }} />
              <span className="absolute -inset-y-0.5 w-0.5 bg-fg" style={{ left: `${(mid / max) * 100}%` }} />
            </span>
            <span className="mono w-36 shrink-0 text-right">{mid}{unit} <span className="text-dim">({lo}–{hi})</span></span>
          </li>
        );
      })}
    </ul>
  );
}

// Toby Ord, The Precipice, Table 6.1: chance of existential catastrophe within the next 100 years
const ORD: { label: string; oneIn: number; total?: boolean }[] = [
  { label: "Asteroid or comet impact", oneIn: 1_000_000 },
  { label: "Supervolcanic eruption", oneIn: 10_000 },
  { label: "Stellar explosion", oneIn: 1_000_000_000 },
  { label: "Total natural risk", oneIn: 10_000, total: true },
  { label: "Nuclear war", oneIn: 1000 },
  { label: "Climate change", oneIn: 1000 },
  { label: "Other environmental damage", oneIn: 1000 },
  { label: "Naturally arising pandemics", oneIn: 10_000 },
  { label: "Engineered pandemics", oneIn: 30 },
  { label: "Unaligned artificial intelligence", oneIn: 10 },
  { label: "Unforeseen anthropogenic risks", oneIn: 30 },
  { label: "Other anthropogenic risks", oneIn: 50 },
  { label: "Total anthropogenic risk", oneIn: 6, total: true },
  { label: "Total existential risk", oneIn: 6, total: true },
];

export default function TrajectoryView() {
  const { data, error, loading } = useJson<Series>("/data/series.json");

  const sections: WikiSection[] = [
    { id: "now", label: "Where we are", group: "Observed", content: (<>
      {loading || error || !data ? <Loading error={error} /> : (
        <>
          <p className="mt-3 flex items-center gap-3 text-sm"><KindTag kind="observed" /> Global surface temperature, annual mean</p>
          <LineChart data={data.giss.annual} color="#ffb000" unit=" °C" label="Global temperature anomaly" zeroLine />
          <p className="mt-1 text-[11px] leading-relaxed text-dim">
            NASA GISTEMP <Term id="anomaly">anomaly relative to 1951-1980</Term> (not the pre-industrial baseline used for the 1.5 °C target, which is roughly 0.3 °C
            cooler). <Ext href={data.giss.source.url}>{data.giss.source.name} ↗</Ext>
          </p>

          <p className="mt-6 flex items-center gap-3 text-sm"><KindTag kind="observed" /> Atmospheric CO₂ at Mauna Loa, annual mean</p>
          <LineChart data={data.co2.annual} color="#00e5ff" unit=" ppm" label="Atmospheric CO2" />
          <p className="mt-1 text-[11px] text-dim">
            Pre-industrial level was about 280 ppm. <Ext href={data.co2.source.url}>{data.co2.source.name} ↗</Ext>
          </p>
        </>
      )}
      <p className="mt-4 text-sm leading-relaxed">
        The WMO puts long-term warming at 1.34–1.41 °C above 1850-1900 and found 2024 alone about 1.55 ± 0.13 °C.{" "}
        <Ext href="https://wmo.int/files/state-of-global-climate-2024">WMO report ↗</Ext>
      </p>

    </>) },
    { id: "ipcc", label: "IPCC scenarios", group: "Projections", content: (<>
      <p className="mt-3 flex items-center gap-3 text-sm"><KindTag kind="projection" /> Warming by 2081-2100 vs 1850-1900 (best estimate and very likely range)</p>
      <RangeBars field="t" max={6} unit=" °C" />
      <p className="mt-6 flex items-center gap-3 text-sm"><KindTag kind="projection" /> Global sea level rise by 2100 vs 1995-2014 (median and likely range)</p>
      <RangeBars field="s" max={1.2} unit=" m" />
      <p className="mt-2 text-xs leading-relaxed text-dim">
        These are scenarios of what follows from different emission paths, not predictions: the path is a human choice. Sea-level
        rise would continue for centuries beyond 2100, and the high end is uncertain because of ice-sheet behaviour.{" "}
        <Ext href="https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/">IPCC AR6 WGI SPM ↗</Ext>.
        Tipping points are on the <Link href="/scenarios/climate-tipping" className="text-accent hover:underline">climate tipping scenario</Link>.
      </p>

    </>) },
    { id: "experts", label: "Expert estimates", group: "Judgements", content: (<>
      <p className="mt-3 flex items-center gap-3 text-sm"><KindTag kind="expert" /> Toby Ord, <em>The Precipice</em> (2020): chance of an existential catastrophe within the next 100 years</p>
      <ul className="mt-2 divide-y divide-line border border-line">
        {ORD.map((r) => {
          const p = 1 / r.oneIn;
          const w = ((Math.log10(p) + 9) / 9) * 100; // 1e-9 .. 1
          return (
            <li key={r.label} className={`flex items-center gap-3 px-3 py-1.5 text-xs ${r.total ? "bg-line/30" : ""}`}>
              <span className={`w-56 shrink-0 ${r.total ? "font-semibold" : ""}`}>{r.label}</span>
              <span className="relative h-2 flex-1 bg-line" role="img" aria-label={`1 in ${r.oneIn.toLocaleString("en-US")}`}>
                <span className="absolute inset-y-0 left-0" style={{ width: `${w}%`, background: "repeating-linear-gradient(90deg, var(--bio) 0 2px, transparent 2px 5px)" }} />
              </span>
              <span className="mono w-28 shrink-0 text-right">1 in {r.oneIn.toLocaleString("en-US")}</span>
            </li>
          );
        })}
      </ul>
      <p className="mono mt-1 text-[10px] text-dim">Bars use a logarithmic scale from 1 in a billion to 1 in 1.</p>

      <Card className="mt-6">
        <p className="label">Other expert estimates, side by side</p>
        <ul className="mt-2 space-y-3 text-sm leading-relaxed">
          <li>
            <KindTag kind="expert" /> <span className="text-fg">Advanced AI:</span> in a survey of 2,778 AI researchers, between 38% and 51%
            (depending on the question) gave at least a 10% chance to outcomes as bad as human extinction, while Ord puts unaligned
            AI at 1 in 10 for the century. Other experts rate it far lower. <Ext href="https://arxiv.org/abs/2401.02843">Grace et al. 2024 ↗</Ext>
          </li>
          <li>
            <KindTag kind="expert" /> <span className="text-fg">Carrington-class solar storm:</span> about 12% per decade in Riley&apos;s 2012 power-law
            estimate; later about 10%; other methods range from about 1.5% to 85%. <Ext href="https://doi.org/10.1029/2011SW000734">Riley 2012 ↗</Ext>
          </li>
          <li>
            <KindTag kind="projection" /> <span className="text-fg">Cascadia magnitude ~9 earthquake:</span> 10–15% in the next 50 years (USGS 2025). <Ext href="https://pubs.usgs.gov/publication/fs20253050">USGS ↗</Ext>
          </li>
        </ul>
      </Card>
      <p className="mt-4 text-xs leading-relaxed text-dim">
        These are personal judgements by experts, built from limited evidence and not comparable to measurements. They differ by orders
        of magnitude between authors and methods, which is itself the finding. This site never adds probabilities of its own. See{" "}
        <Link href="/scenarios" className="text-accent hover:underline">the scenarios</Link> for the reasoning behind each, and{" "}
        <Link href="/methodology#kinds" className="text-accent hover:underline">how the labels work</Link>.
      </p>
    </>) },
  ];
  return <WikiShell title="Trajectory" {...PAGE_META.trajectory} updated={data?.generatedAt.slice(0, 10) ?? PAGE_META.trajectory.updated} intro={<>Where we are, where the climate is heading under different choices, and what experts think about the largest risks. The three
        kinds of statement are always marked: <KindTag kind="observed" /> measurements, <KindTag kind="projection" /> scenarios that
        depend on choices, <KindTag kind="expert" /> personal judgements.</>} sections={sections} />;
}
