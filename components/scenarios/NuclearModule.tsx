"use client";

import Link from "next/link";
import { arsenals } from "@/lib/arsenals";
import { useJson } from "@/lib/useJson";
import type { WorldState } from "@/lib/types";
import { KindTag, Loading } from "@/components/ui";

export default function NuclearModule() {
  const { data, error, loading } = useJson<WorldState>("/data/world_state.json");
  if (loading || error || !data) return <Loading error={error} />;
  const clock = data.counters.find((c) => c.id === "doomsday-clock");
  const dyads = [...data.dyads].sort((a, b) => (b.tension ?? -1) - (a.tension ?? -1));

  return (
    <section className="mt-6" aria-label="Nuclear scenario">
      <div className="grid gap-px border border-line bg-line sm:grid-cols-3">
        <div className="bg-panel-solid p-4">
          <KindTag kind="reference" />
          <p className="mono mt-2 text-value" style={{ color: "var(--geo)" }}>{arsenals.totals.stockpile.toLocaleString("en-US")}</p>
          <p className="text-body text-dim">warheads in military stockpiles (SIPRI, Jan 2026)</p>
        </div>
        <div className="bg-panel-solid p-4">
          <KindTag kind="reference" />
          <p className="mono mt-2 text-value" style={{ color: "var(--threat)" }}>Feb 2026</p>
          <p className="text-body text-dim">New START expired with no replacement treaty</p>
        </div>
        <div className="bg-panel-solid p-4">
          <KindTag kind="reference" />
          <p className="mono mt-2 text-value" style={{ color: "var(--threat)" }}>{clock?.value ?? "–"}</p>
          <p className="text-body text-dim">Doomsday Clock (symbolic, not a probability)</p>
        </div>
      </div>

      <h3 className="label mt-8">What climate models say about soot and food</h3>
      <div className="mt-2 border border-line p-4 text-read leading-relaxed">
        <KindTag kind="projection" />
        <p className="mt-2">
          Xia et al. (2022) fed six soot scenarios, from 5 to 150 teragrams injected into the stratosphere, into climate and crop
          models. The smallest, matching a regional war between India and Pakistan, cut global average calorie production by
          about 7%. Larger wars cut it far more, and the authors&apos; summary states that most of the world&apos;s population would
          face starvation after a war between the United States and Russia.
        </p>
        <p className="mt-2 text-body text-dim">
          Caveats the authors and others stress: how much soot a war would produce depends on targets and fires, and models
          disagree on the details. These are projections of what could follow, not forecasts of what will.{" "}
          <a href="https://doi.org/10.1038/s43016-022-00573-0" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Nature Food paper ↗</a>
        </p>
      </div>

      <h3 className="label mt-8">Tension between country pairs, from media coverage</h3>
      <p className="mt-1 text-body leading-relaxed text-dim">
        A 0–100 description of how news reports each pair over the last 30 days. It is <span className="text-fg">not a forecast and not a measure of intent</span>;{" "}
        <Link href="/methodology#tension" className="text-accent hover:underline">how it is computed</Link>.
      </p>
      <ul className="mt-2 divide-y divide-line border border-line">
        {dyads.map((d) => (
          <li key={`${d.a}${d.b}`} className="flex items-center gap-3 px-3 py-2">
            <span className="min-w-0 flex-1 text-read">{d.label}</span>
            {d.tension != null ? (
              <>
                <span className="relative h-2 w-28 shrink-0 bg-line" role="img" aria-label={`Tension index ${d.tension} of 100`}>
                  <span
                    className="absolute inset-y-0 left-0"
                    style={{ width: `${d.tension}%`, background: d.tension >= 55 ? "var(--threat)" : d.tension >= 40 ? "var(--conflict)" : "var(--geo)" }}
                  />
                </span>
                <span className="mono w-8 text-right text-body">{d.tension}</span>
              </>
            ) : (
              <span className="mono text-body text-dim">low data</span>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-body">
        <Link href="/nuclear" className="text-accent hover:underline">Arsenals by country →</Link>{" · "}
        <Link href="/" className="text-accent hover:underline">Plant sites on the map →</Link>
      </p>
    </section>
  );
}
