"use client";

import { useState } from "react";
import { PLANTS } from "@/core/build-state";
import { regionStatus } from "@/core/status";
import type { Level, StatusResult } from "@/core/types";
import type { Loaded } from "@/lib/radar/load";
import { reasonText } from "@/lib/radar/format";
import { useRegion } from "@/lib/radar/region";
import { useT } from "@/lib/radar/useT";
import LangSwitch from "@/components/LangSwitch";
import RegionPicker from "./RegionPicker";

// Colour is never the only cue: every level is also written out. Tokens come from app/globals.css.
const TONE: Record<Level, string> = { NOMINAL: "text-dim", ELEVATED: "text-geo", CRITICAL: "text-threat", STALE: "text-space" };

export default function TopBar({ loaded, done, now }: { loaded: Loaded | null; done: boolean; now: number }) {
  const { t } = useT();
  const { region, province, setRegion, showHint, dismissHint } = useRegion();
  const [open, setOpen] = useState(false);

  const source = loaded?.source;
  const stale = source === "stale";
  const clock = now || loaded?.lastOkMs || 0; // the live clock, so an old cached state keeps ageing on screen and never looks fresh
  const global: StatusResult | null = !loaded ? null
    : stale ? { level: "STALE", reason: { kind: "stale", lastHeartbeatMs: loaded.lastOkMs } }
    : { level: loaded.state.global.level, reason: loaded.state.global.reasonDetail ?? null };
  const mine: StatusResult | null = !loaded || !province ? null : stale ? global : regionStatus(province, loaded.state.quakes, clock);

  const siteName = (id: string) => PLANTS.find((p) => p.id === id)?.name ?? loaded?.state.chokepoints.find((c) => c.id === id)?.name;
  const row = (label: string, res: StatusResult | null) => (
    <p className="mono min-w-0 truncate text-body">
      <span className="text-dim">{label}: </span>
      {res ? <><span className={TONE[res.level]}>{res.level}</span>{res.reason && <span className="text-dim"> · {reasonText(res.reason, clock, t, loaded?.lastOkMs, siteName)}</span>}</> : <span className="text-dim">—</span>}
    </p>
  );

  return (
    <header className="flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-line px-3 py-2">
      <h1 className="mono text-body font-bold">VIGILRADAR // {source ? t(source === "worker" ? "live" : source) : done ? t("noData") : "…"}</h1>
      <div className="min-w-0 flex-1">
        {row(t("global"), global)}
        {province ? row(t("region"), mine) : (
          <p className="mono text-body"><span className="text-dim">{t("region")}: — · </span><button type="button" onClick={() => setOpen(true)} className="text-accent hover:underline">{t("pickProvince")}</button></p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {showHint && (
          <span className="mono flex items-center gap-1 text-label text-accent">{t("pickProvince")}<button type="button" onClick={dismissHint} aria-label={t("dismiss")} className="px-1 text-dim hover:text-fg">×</button></span>
        )}
        <LangSwitch />
        <RegionPicker region={region} label={province ? province.name : t("regionGlobal")} open={open} setOpen={setOpen} onPick={setRegion} />
      </div>
    </header>
  );
}
