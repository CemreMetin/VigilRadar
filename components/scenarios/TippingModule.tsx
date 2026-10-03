"use client";

import { KindTag } from "@/components/ui";

// Armstrong McKay et al. (2022), Science 377:eabn7950. Threshold best estimate and range, in °C of
// global warming above pre-industrial; timescale = years for the change to play out once triggered.
// Values checked against the paper's summary table on 2026-10-03.
const ELEMENTS: { name: string; best: number; lo: number; hi: number; years: string; core: boolean }[] = [
  { name: "Greenland ice sheet", best: 1.5, lo: 0.8, hi: 3.0, years: "10,000", core: true },
  { name: "West Antarctic ice sheet", best: 1.5, lo: 1.0, hi: 3.0, years: "2,000", core: true },
  { name: "Labrador-Irminger Seas convection", best: 1.8, lo: 1.1, hi: 3.8, years: "10", core: true },
  { name: "East Antarctic subglacial basins", best: 3.0, lo: 2.0, hi: 6.0, years: "2,000", core: true },
  { name: "Amazon rainforest", best: 3.5, lo: 2.0, hi: 6.0, years: "100", core: true },
  { name: "Boreal permafrost (collapse)", best: 4.0, lo: 3.0, hi: 6.0, years: "50", core: true },
  { name: "Atlantic overturning (AMOC)", best: 4.0, lo: 1.4, hi: 8.0, years: "50", core: true },
  { name: "Arctic winter sea ice", best: 6.3, lo: 4.5, hi: 8.7, years: "20", core: true },
  { name: "East Antarctic ice sheet", best: 7.5, lo: 5.0, hi: 10.0, years: "varies", core: true },
  { name: "Low-latitude coral reefs", best: 1.5, lo: 1.0, hi: 2.0, years: "10", core: false },
  { name: "Boreal permafrost (abrupt thaw)", best: 1.5, lo: 1.0, hi: 2.3, years: "200", core: false },
  { name: "Barents Sea ice", best: 1.6, lo: 1.5, hi: 1.7, years: "25", core: false },
  { name: "Mountain glaciers", best: 2.0, lo: 1.5, hi: 3.0, years: "200", core: false },
  { name: "Sahel / West African monsoon", best: 2.8, lo: 2.0, hi: 3.5, years: "50", core: false },
  { name: "Southern boreal forest", best: 4.0, lo: 1.4, hi: 5.0, years: "100", core: false },
  { name: "Northern boreal forest", best: 4.0, lo: 1.5, hi: 7.2, years: "100", core: false },
];

// AR6 SPM Table SPM.1: warming over 2081-2100 relative to 1850-1900, best estimates
const SSP = [
  { id: "SSP1-2.6", v: 1.8 },
  { id: "SSP2-4.5", v: 2.7 },
  { id: "SSP5-8.5", v: 4.4 },
];

const W = 760;
const ROW = 22;
const LEFT = 230;
const TOP = 58;
const LABEL_ROWS = [0, 11, 22]; // stagger the reference-line labels so close lines do not overlap
const MAXT = 10;
const x = (t: number) => LEFT + (t / MAXT) * (W - LEFT - 16);

export default function TippingModule() {
  const sorted = [...ELEMENTS].sort((a, b) => a.best - b.best);
  const H = TOP + sorted.length * ROW + 30;

  return (
    <section className="mt-6" aria-label="Climate tipping elements">
      <div className="flex flex-wrap items-center gap-3">
        <KindTag kind="expert" />
        <KindTag kind="projection" />
        <KindTag kind="observed" />
        <span className="text-xs text-dim">Estimated thresholds (dotted), projected warming (dashed) and observed warming (solid), all in °C above 1850-1900.</span>
      </div>

      <div className="mt-3 overflow-x-auto border border-line bg-panel-solid">
        <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[640px]" role="img" aria-label="Range of warming at which each climate tipping element may tip, with current and projected warming">
          {/* axis */}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={TOP - 6} y2={H - 24} stroke="rgba(0,229,255,0.08)" />
              <text x={x(t)} y={H - 10} textAnchor="middle" fontSize="10" fill="#7d8c97" fontFamily="monospace">{t}°</text>
            </g>
          ))}
          {/* observed warming band (WMO long-term estimate 1.34-1.41) */}
          <rect x={x(1.34)} y={TOP - 6} width={x(1.41) - x(1.34)} height={H - TOP - 18} fill="#00e5ff" opacity="0.55" />
          <text x={x(1.375)} y={TOP - 42} textAnchor="middle" fontSize="9" fill="#00e5ff" fontFamily="monospace">now ~1.4</text>
          {/* projections */}
          {SSP.map((s, i) => (
            <g key={s.id}>
              <line x1={x(s.v)} x2={x(s.v)} y1={TOP - 38 + LABEL_ROWS[[1, 2, 0][i]]} y2={H - 24} stroke="#ffb000" strokeDasharray="5 4" />
              <text x={x(s.v)} y={TOP - 42 + LABEL_ROWS[[1, 2, 0][i]]} textAnchor="middle" fontSize="9" fill="#ffb000" fontFamily="monospace">{s.id} {s.v}°</text>
            </g>
          ))}
          {/* elements */}
          {sorted.map((e, i) => {
            const y = TOP + i * ROW + ROW / 2;
            return (
              <g key={e.name}>
                <text x={LEFT - 8} y={y + 3} textAnchor="end" fontSize="10.5" fill={e.core ? "#d7e2ea" : "#9aa8b3"}>{e.name}</text>
                <line x1={x(e.lo)} x2={x(e.hi)} y1={y} y2={y} stroke="#b026ff" strokeWidth="3" strokeDasharray="1 3" strokeLinecap="round" />
                <circle cx={x(e.best)} cy={y} r="4" fill={e.core ? "#b026ff" : "none"} stroke="#b026ff" strokeWidth="1.5" />
              </g>
            );
          })}
        </svg>
      </div>
      <p className="mono mt-2 text-[11px] text-dim">
        ● core element (global) · ○ regional impact element · dotted bar = uncertainty range, marker = best estimate.
      </p>

      <p className="mt-3 text-xs leading-relaxed text-dim">
        Reading it: the bars that already overlap the cyan &quot;now&quot; band (Greenland, West Antarctica, abrupt permafrost thaw,
        Labrador Sea convection, coral reefs) are the five Armstrong McKay and colleagues say may already be at risk. A threshold
        being crossed does not mean the change is instant: the table below shows how long each takes once triggered, from a
        decade to ten thousand years. The 1.34-1.41 °C band is the WMO&apos;s estimate of long-term warming; 2024 alone reached
        about 1.55 °C.
      </p>

      <div className="mt-3 overflow-x-auto border border-line">
        <table className="w-full min-w-[520px] text-left text-xs">
          <thead>
            <tr className="label border-b border-line">
              <th className="p-2 font-normal">Element</th>
              <th className="mono p-2 text-right font-normal">Threshold °C</th>
              <th className="mono p-2 text-right font-normal">Range</th>
              <th className="mono p-2 text-right font-normal">Years to play out</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {sorted.map((e) => (
              <tr key={e.name}>
                <th scope="row" className="p-2 font-medium">{e.name} <span className="text-dim">{e.core ? "(core)" : "(regional)"}</span></th>
                <td className="mono p-2 text-right">{e.best.toFixed(1)}</td>
                <td className="mono p-2 text-right text-dim">{e.lo.toFixed(1)}–{e.hi.toFixed(1)}</td>
                <td className="mono p-2 text-right text-dim">{e.years}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-dim">
        Source:{" "}
        <a href="https://doi.org/10.1126/science.abn7950" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Armstrong McKay et al., Science 2022 ↗</a>; projections from{" "}
        <a href="https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">IPCC AR6 WGI SPM ↗</a>; observed from{" "}
        <a href="https://wmo.int/files/state-of-global-climate-2024" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">WMO ↗</a>.
      </p>
    </section>
  );
}
