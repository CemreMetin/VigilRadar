import type { UiKey } from "@/core/content/ui";
import type { StatusReason } from "@/core/types";

type T = (k: UiKey) => string;

/** "5 dk", "3 sa", "2 gün" and the matching English short forms. */
export function agoText(ms: number, t: T): string {
  const m = Math.max(0, Math.round(ms / 60_000));
  const span = m < 60 ? `${m} ${t("min")}` : m < 2880 ? `${Math.round(m / 60)} ${t("hour")}` : `${Math.round(m / 1440)} ${t("day")}`;
  return `${span} ${t("ago")}`;
}

const hhmm = (ms: number) => new Date(ms).toISOString().slice(11, 16);

/** The one line that always sits next to a status: what raised it, e.g. `M6.8 · Kamchatka · 3 sa önce`. No status without a reason. */
export function reasonText(r: StatusReason | null | undefined, nowMs: number, t: T, lastOkMs?: number, nameOf?: (siteId: string) => string | undefined): string {
  if (!r) return "";
  const when = (ms: number) => agoText(nowMs - ms, t);
  switch (r.kind) {
    case "stale": return `${t("lastData")} ${hhmm(r.lastHeartbeatMs ?? lastOkMs ?? nowMs)} UTC`;
    case "quake": case "pager": case "province-severity": case "province-tsunami": return `M${r.mag} · ${r.place} · ${when(r.timeMs)}`;
    case "tsunami": return `${r.title} · ${when(r.timeMs)}`;
    case "link": { const site = (r.linkId.split(">").pop() ?? "").replace(/^(plant|chokepoint):/, ""); return `${r.rule.replace("→", " → ")} · ${nameOf?.(site) ?? site}`; }
    case "chokepoint": return `${r.id} · ${r.state}`;
  }
}
