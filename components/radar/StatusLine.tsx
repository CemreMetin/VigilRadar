"use client";

import Link from "next/link";
import { PLANTS } from "@/core/build-state";
import type { Level, StatusResult } from "@/core/types";
import { reasonText } from "@/lib/radar/format";
import type { Loaded } from "@/lib/radar/load";
import { useT } from "@/lib/radar/useT";

// Colour is never the only cue: every level is also written out. Tokens come from app/globals.css.
const TONE: Record<Level, string> = { NOMINAL: "text-dim", ELEVATED: "text-geo", CRITICAL: "text-threat", STALE: "text-space" };

/** The bottom line of LIVE: where the data comes from, the global status, the straits and the two reference links. */
export default function StatusLine({ loaded, done, now }: { loaded: Loaded | null; done: boolean; now: number }) {
  const { t } = useT();

  const source = loaded?.source;
  const stale = source === "stale";
  const clock = now || loaded?.lastOkMs || 0; // the live clock, so an old cached state keeps ageing on screen and never looks fresh
  const global: StatusResult | null = !loaded ? null
    : stale ? { level: "STALE", reason: { kind: "stale", lastHeartbeatMs: loaded.lastOkMs } }
    : { level: loaded.state.global.level, reason: loaded.state.global.reasonDetail ?? null };
  const flag = !loaded ? (done ? t("noData") : null) : source === "worker" ? null : t(source!);

  const cps = (loaded?.state.chokepoints ?? []).filter((x) => x.available);
  const off = cps.filter((x) => x.level === "deviation" || x.level === "severe");
  const straits = cps.length === 0 ? t("noChokepoints")
    : `${t("cpWatched").replace("{n}", String(cps.length))}${off.length ? ` · ${t("cpDev")}: ${off.map((x) => x.name).join(", ")}` : ""}`;

  const siteName = (id: string) => PLANTS.find((p) => p.id === id)?.name ?? loaded?.state.chokepoints.find((c) => c.id === id)?.name;
  const level = (label: string, res: StatusResult | null) => (
    <span className="min-w-0 truncate">
      <span className="text-dim">{label}: </span>
      {res ? <><span className={TONE[res.level]}>{res.level}</span>{res.reason && <span className="text-dim"> · {reasonText(res.reason, clock, t, loaded?.lastOkMs, siteName)}</span>}</> : <span className="text-dim">—</span>}
    </span>
  );

  return (
    <div className="mono flex flex-wrap items-center gap-x-4 gap-y-1 bg-panel-solid px-3 py-1.5 text-body md:h-[52px] md:flex-nowrap md:py-0">
      {flag && <span className="shrink-0 font-bold text-space">{flag}</span>}
      {level(t("global"), global)}
      <span className="min-w-0 truncate text-dim">{straits}</span>
      <span className="ml-auto shrink-0 text-dim"><Link href="/about#sources" className="hover:text-accent">{t("sources")}</Link> · <Link href="/about" className="hover:text-accent">{t("about")}</Link></span>
    </div>
  );
}
