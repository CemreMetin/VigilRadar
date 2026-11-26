import { CONFIG } from "../../../core/config";
import type { MergedQuake, QuakeSource, Severity, TsunamiBulletin } from "../../../core/types";

// Notification policy (VIGIL.md 7.1): a pure function from the current state and what was already sent to the notices
// that are due now. It sends nothing and touches no storage; the dispatcher does that and stores the returned log.

const N = CONFIG.notify;
const MIN = 60_000;
const NEW_WINDOW_MS = 3 * 3_600_000; // an event first seen longer ago than this never starts a notification
const KEEP_MS = 7 * 86_400_000;

export type NoticeKind = "new" | "update" | "cancel" | "tsunami";
export interface ProvinceHit { code: string; sev: "P0" | "P1" }

/** Everything needed to write and deliver one message, so a retry does not need the state. */
export interface Notice {
  key: string; // eventId:scope:kind, unique per message
  eventId: string;
  scope: "TR" | "GLOBAL";
  kind: NoticeKind;
  ms: number;
  mag: number;
  depthKm: number;
  timeMs: number;
  lat: number;
  lon: number;
  place: string;
  source: QuakeSource | "tsunami";
  usgsTsunami?: boolean;
  provinces: ProvinceHit[]; // TR scope: P0 first, then P1
}

interface EventLog {
  firstMs: number;
  tr?: { mag: number; sevs: Record<string, "P0" | "P1">; updated: boolean };
  global?: { mag: number; updated: boolean };
  cancelled?: boolean;
}
export interface NotifyLog { events: Record<string, EventLog>; p1Last: Record<string, number> }
export const EMPTY_LOG: NotifyLog = { events: {}, p1Last: {} };

export interface PolicyInput {
  nowMs: number;
  quakes: readonly MergedQuake[];
  levels: Record<string, Record<string, Severity>>; // quake id -> province code -> severity
  tsunami: readonly TsunamiBulletin[];
  log: NotifyLog;
}

const confirmed = (q: MergedQuake, nowMs: number) => q.sources.length >= N.p0ConfirmSources || nowMs - q.firstSeenMs >= N.p0SingleSourceWaitSec * 1000;
// 7.2 - 6.9 is 0.2999… in floating point; magnitudes have one decimal, so compare rounded
const revised = (a: number, b: number) => Math.round(Math.abs(a - b) * 10) / 10 >= N.updateMagDelta;
const isGlobal = (q: MergedQuake) => (q.best.mag >= N.globalChannel.minMag && q.best.depthKm <= N.globalChannel.maxDepthKm) || q.best.pagerAlert === "orange" || q.best.pagerAlert === "red";

function notice(q: MergedQuake, scope: Notice["scope"], kind: NoticeKind, nowMs: number, provinces: ProvinceHit[]): Notice {
  const b = q.best;
  return { key: `${q.id}:${scope}:${kind}`, eventId: q.id, scope, kind, ms: nowMs, mag: b.mag, depthKm: b.depthKm, timeMs: b.timeMs, lat: b.lat, lon: b.lon, place: b.place, source: b.source, usgsTsunami: b.usgsTsunami, provinces };
}

const hits = (levels: Record<string, Severity> | undefined, only?: (code: string, sev: Severity) => boolean): ProvinceHit[] => {
  const out: ProvinceHit[] = [];
  for (const sev of ["P0", "P1"] as const)
    for (const [code, s] of Object.entries(levels ?? {})) if (s === sev && (!only || only(code, s))) out.push({ code, sev });
  return out;
};

export function plan(i: PolicyInput): { notices: Notice[]; log: NotifyLog } {
  const { nowMs } = i;
  const events: Record<string, EventLog> = Object.fromEntries(Object.entries(i.log.events).filter(([, e]) => nowMs - e.firstMs <= KEEP_MS).map(([k, e]) => [k, structuredClone(e)]));
  const p1Last = { ...i.log.p1Last };
  const notices: Notice[] = [];

  for (const q of i.quakes) {
    const known = events[q.id];
    if (!known && (q.retracted || nowMs - q.firstSeenMs > NEW_WINDOW_MS)) continue;
    const ev = (events[q.id] ??= { firstMs: nowMs });
    const levels = i.levels[q.id];

    if (q.retracted) { // a cancel goes once, to every target that got the original
      if (!ev.cancelled && (ev.tr || ev.global)) {
        ev.cancelled = true;
        if (ev.tr) notices.push(notice(q, "TR", "cancel", nowMs, Object.entries(ev.tr.sevs).map(([code, sev]) => ({ code, sev }))));
        if (ev.global) notices.push(notice(q, "GLOBAL", "cancel", nowMs, []));
      }
      continue;
    }

    // ---- Turkey: provinces and the TR channel ----
    if (!ev.tr) {
      const due = hits(levels, (code, sev) => (sev === "P0" ? confirmed(q, nowMs) : nowMs - (p1Last[code] ?? -Infinity) >= N.p1CooldownMin * MIN));
      if (due.length) {
        ev.tr = { mag: q.best.mag, sevs: Object.fromEntries(due.map((h) => [h.code, h.sev])), updated: false };
        for (const h of due) if (h.sev === "P1") p1Last[h.code] = nowMs;
        notices.push(notice(q, "TR", "new", nowMs, due));
      }
    } else if (!ev.tr.updated) {
      const now = hits(levels);
      const changed = now.some((h) => ev.tr!.sevs[h.code] !== h.sev) || Object.keys(ev.tr.sevs).some((c) => !now.some((h) => h.code === c));
      if (revised(q.best.mag, ev.tr.mag) || changed) {
        ev.tr.updated = true;
        notices.push(notice(q, "TR", "update", nowMs, now));
      }
    }

    // ---- Global channel ----
    if (isGlobal(q)) {
      if (!ev.global) {
        ev.global = { mag: q.best.mag, updated: false };
        notices.push(notice(q, "GLOBAL", "new", nowMs, []));
      } else if (!ev.global.updated && revised(q.best.mag, ev.global.mag)) {
        ev.global.updated = true;
        notices.push(notice(q, "GLOBAL", "update", nowMs, []));
      }
    }
  }

  // A tsunami warning goes to the global targets once per bulletin.
  for (const b of i.tsunami) {
    const id = `tsunami:${b.timeMs}`;
    if (b.level !== "warning" || events[id] || nowMs - b.timeMs > 24 * 3_600_000) continue;
    events[id] = { firstMs: nowMs, global: { mag: 0, updated: false } };
    notices.push({ key: `${id}:GLOBAL:tsunami`, eventId: id, scope: "GLOBAL", kind: "tsunami", ms: nowMs, mag: 0, depthKm: 0, timeMs: b.timeMs, lat: b.lat, lon: b.lon, place: b.title, source: "tsunami", provinces: [] });
  }

  return { notices, log: { events, p1Last } };
}
