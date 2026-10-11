import type { Counter } from "./types";

export type Overdue = { label: string; reviewBy: string; source: string };

/** Hand-entered figures whose review date has passed. Both the worker (CI log) and the UI use this. */
export function overdueReviews(
  counters: Pick<Counter, "label" | "manual" | "reviewBy" | "source">[],
  arsenals: { reviewBy?: string; source: { name: string } },
  today: string,
): Overdue[] {
  const out: Overdue[] = [];
  for (const c of counters) if (c.reviewBy && c.reviewBy < today) out.push({ label: c.label, reviewBy: c.reviewBy, source: c.source.name });
  if (arsenals.reviewBy && arsenals.reviewBy < today) out.push({ label: "Nuclear arsenals", reviewBy: arsenals.reviewBy, source: arsenals.source.name });
  return out;
}
