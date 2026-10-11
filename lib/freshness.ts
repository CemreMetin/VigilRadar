import type { FeedStatus } from "./types";

export type Freshness = {
  /** time since the newest observation in the feed's data (the real latency of the source) */
  observedLagMs: number | null;
  /** time since our pipeline last fetched it successfully */
  fetchedAgeMs: number | null;
  /** failed, or the newest observation is older than the feed's normal lag */
  late: boolean;
};

export function feedFreshness(f: FeedStatus, nowMs: number): Freshness {
  const observedLagMs = f.dataAsOf ? Math.max(0, nowMs - new Date(f.dataAsOf).getTime()) : null;
  const fetchedAgeMs = f.fetchedAt ? Math.max(0, nowMs - new Date(f.fetchedAt).getTime()) : null;
  const tooOld = observedLagMs !== null && f.maxAgeHours !== undefined && observedLagMs > f.maxAgeHours * 3_600_000;
  return { observedLagMs, fetchedAgeMs, late: !f.ok || tooOld };
}

/** "12 min 04 s", "3 h 12 min", "5 d 2 h": exact enough to read as a latency, short enough for a table cell. */
export function duration(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ${String(s % 60).padStart(2, "0")} s`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h} h ${String(m % 60).padStart(2, "0")} min`;
  const d = Math.floor(h / 24);
  return `${d} d ${h % 24} h`;
}

/** Exact UTC time, trimmed to the precision the source states (a monthly value is "2026-09", not a made-up minute). */
export function asOfText(f: FeedStatus): string {
  if (!f.dataAsOf) return "n/a";
  if (f.asOfPrecision === "month") return `${f.dataAsOf.slice(0, 7)} (month)`;
  if (f.asOfPrecision === "day") return `${f.dataAsOf.slice(0, 10)} (day)`;
  return `${f.dataAsOf.replace("T", " ").slice(0, 19)} UTC`;
}
