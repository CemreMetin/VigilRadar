"use client";

import { useEffect, useState } from "react";
import { asOfText, duration, feedFreshness } from "@/lib/freshness";
import type { FeedStatus } from "@/lib/types";

/**
 * Per-feed freshness: when the newest observation happened, how old that is (the source's real latency),
 * and when our pipeline last fetched it. Ticks every second. "LATE" = failed or older than its normal lag.
 */
export default function FreshnessTable({ feeds: given }: { feeds?: FeedStatus[] }) {
  const [now, setNow] = useState<number | null>(null);
  // static pages pass nothing: fetch the live file so the latencies are not frozen at build time
  const [fetched, setFetched] = useState<FeedStatus[] | null>(null);
  useEffect(() => {
    if (given) return;
    fetch("/data/world_state.json", { cache: "no-cache" })
      .then((r) => r.json())
      .then((w: { feeds: FeedStatus[] }) => setFetched(w.feeds))
      .catch(() => {});
  }, [given]);
  const feeds = given ?? fetched;
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!feeds) return <p className="mono text-[11px] text-dim">Loading feed status…</p>;

  return (
    <div className="overflow-x-auto scroll-thin">
      <table className="mono w-full min-w-[640px] text-left text-[11px]">
        <thead className="text-dim">
          <tr className="border-b border-line">
            <th className="py-1.5 pr-3 font-bold">FEED</th>
            <th className="pr-3 font-bold">SOURCE CADENCE</th>
            <th className="pr-3 font-bold">NEWEST OBSERVATION</th>
            <th className="pr-3 font-bold">LATENCY</th>
            <th className="pr-3 font-bold">FETCHED</th>
            <th className="font-bold">STATE</th>
          </tr>
        </thead>
        <tbody>
          {feeds.map((f) => {
            const fr = now ? feedFreshness(f, now) : null;
            return (
              <tr key={f.id} className="border-b border-line/60 align-top">
                <td className="py-1.5 pr-3 font-bold">{f.name}</td>
                <td className="pr-3 font-light text-dim">{f.cadence}</td>
                <td className="pr-3 font-light">{asOfText(f)}</td>
                <td className="pr-3 font-bold tabular-nums">{fr?.observedLagMs != null ? duration(fr.observedLagMs) : "n/a"}</td>
                <td className="pr-3 font-light text-dim tabular-nums">
                  {fr?.fetchedAgeMs != null ? `${duration(fr.fetchedAgeMs)} ago` : "never"}
                </td>
                <td className="font-bold" style={{ color: !f.ok ? "var(--threat)" : fr?.late ? "var(--geo)" : "var(--safe)" }} title={f.error}>
                  {!f.ok ? "FAILED" : fr?.late ? "LATE" : "ON TIME"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-[11px] font-light leading-relaxed text-dim">
        Latency is the age of the newest observation, so it includes the source&apos;s own publishing delay (monthly climate series lag by weeks, by design). Fetched is when this site last pulled the feed successfully; the data job runs twice an hour.
      </p>
    </div>
  );
}
