export function relTime(iso: string, nowMs: number): string {
  const diff = Math.max(0, nowMs - new Date(iso).getTime());
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function utcClock(nowMs: number): string {
  return new Date(nowMs).toISOString().slice(11, 19);
}

export function utcStamp(iso: string): string {
  return iso.replace("T", " ").slice(0, 16) + " UTC";
}

export function ageLabel(iso: string, nowMs: number): string {
  const m = Math.max(0, Math.floor((nowMs - new Date(iso).getTime()) / 60_000));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h} h`;
  return `${Math.floor(h / 24)} d`;
}

export const STALE_AFTER_MIN = 45;

export function isStale(iso: string | null, nowMs: number): boolean {
  if (!iso) return true;
  return nowMs - new Date(iso).getTime() > STALE_AFTER_MIN * 60_000;
}
