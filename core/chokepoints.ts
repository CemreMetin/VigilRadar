import { CONFIG } from "./config";
import type { DailyCount, FlowResult } from "./types";

const DAY = 86_400_000;
const mean = (xs: DailyCount[]) => xs.reduce((s, x) => s + x.count, 0) / xs.length;

/**
 * Flow deviation (VIGIL.md 5.7): mean of the latest 7 days against the mean of the 90 days before them.
 * No data, no baseline or a last date older than 10 days is `stale`.
 */
export function flowDeviation(daily: readonly DailyCount[], nowMs: number): FlowResult {
  const c = CONFIG.chokepoint;
  const days = [...daily].sort((a, b) => (a.date < b.date ? 1 : -1));
  const recent = days.slice(0, c.recentDays);
  const base = days.slice(c.recentDays, c.recentDays + c.baselineDays);
  const lastDate = days[0]?.date ?? null;
  const lastMs = lastDate ? Date.parse(`${lastDate}T00:00:00Z`) : NaN;
  if (!lastDate || !base.length || !(mean(base) > 0) || nowMs - lastMs > c.staleDays * DAY)
    return { state: "stale", dev: null, recent: recent.length ? mean(recent) : null, baseline: base.length ? mean(base) : null, lastDate };
  const r = mean(recent);
  const b = mean(base);
  const dev = r / b - 1;
  return { state: dev <= c.severe ? "severe" : dev <= c.deviation ? "deviation" : "normal", dev, recent: r, baseline: b, lastDate };
}
