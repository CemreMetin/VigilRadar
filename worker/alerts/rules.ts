import type { Alert } from "../../lib/alerts";

/**
 * Alert rules. Strict and observation-based: a rule fires on a published figure crossing a fixed threshold.
 * Nothing here estimates, predicts or scores. Thresholds are constants so they can be read and argued with.
 *
 * CRITICAL (broadcast to Telegram, red alarm in the browser):
 *   - earthquake magnitude 7.0 or more (USGS), within the last 24 h
 *   - a tsunami WARNING bulletin from the NWS tsunami warning centers
 *   - geomagnetic Kp 8 or more (NOAA G4 severe or stronger)
 * NOTICE (listed in the dashboard, no alarm, not broadcast):
 *   - earthquake magnitude 6.5 or more that USGS flags as tsunami-capable
 *   - a tsunami WATCH or ADVISORY bulletin
 *   - geomagnetic Kp 7 (G3 strong)
 * Not covered: DEFCON (the US does not publish it, so any figure shown for it would be unverifiable) and volcano
 * alert levels (the feeds report only above or at the usual level).
 */

export const QUAKE_CRITICAL_MAG = 7.0;
export const QUAKE_NOTICE_MAG = 6.5;
export const KP_CRITICAL = 8;
export const KP_NOTICE = 7;
export const QUAKE_WINDOW_H = 24;
export const BULLETIN_WINDOW_H = 12;
export const KP_WINDOW_H = 6;
/** how long an alert stays in the file (and sounds the browser alarm) after the event */
export const ALERT_TTL_H = 6;

export const RULE_TEXT = [
  `Earthquake magnitude ${QUAKE_CRITICAL_MAG.toFixed(1)} or more (USGS), event within ${QUAKE_WINDOW_H} h: CRITICAL`,
  `NWS tsunami bulletin of category Warning: CRITICAL; Watch or Advisory: notice`,
  `Planetary Kp ${KP_CRITICAL} or more (NOAA G4+), value within ${KP_WINDOW_H} h: CRITICAL; Kp ${KP_NOTICE}: notice`,
  `Earthquake magnitude ${QUAKE_NOTICE_MAG} or more with the USGS tsunami flag: notice`,
];

const H = 3_600_000;
const iso = (ms: number) => new Date(ms).toISOString();

export type QuakeIn = { id: string; mag: number; place: string; lat: number; lon: number; time: number; url: string; tsunami: number; type: string };
export type BulletinIn = { feed: "PHEB" | "PAAQ"; center: string; category: string; region: string; mag: string; lat: number; lon: number; issued: number; url: string };
export type KpIn = { time: number; kp: number };

export function quakeAlerts(quakes: QuakeIn[], now: number): Alert[] {
  const out: Alert[] = [];
  for (const q of quakes) {
    if (q.type !== "earthquake" || !Number.isFinite(q.mag)) continue;
    if (now - q.time > QUAKE_WINDOW_H * H || q.time > now + H) continue;
    const critical = q.mag >= QUAKE_CRITICAL_MAG;
    const notice = !critical && q.mag >= QUAKE_NOTICE_MAG && q.tsunami === 1;
    if (!critical && !notice) continue;
    out.push({
      id: `quake:${q.id}`,
      level: critical ? "critical" : "notice",
      kind: "quake",
      rule: critical ? `magnitude ${QUAKE_CRITICAL_MAG.toFixed(1)} or more` : `magnitude ${QUAKE_NOTICE_MAG} or more with the USGS tsunami flag`,
      title: `Earthquake M${q.mag.toFixed(1)}`,
      detail: q.place,
      lat: q.lat,
      lon: q.lon,
      at: iso(q.time),
      expiresAt: iso(q.time + ALERT_TTL_H * H),
      scenario: "overview",
      entityId: `usgs:${q.id}`,
      sourceName: "USGS Earthquake Hazards Program",
      sourceUrl: q.url,
    });
  }
  return out;
}

export function tsunamiAlerts(items: BulletinIn[], now: number): Alert[] {
  const out: Alert[] = [];
  for (const b of items) {
    const cat = b.category.toLowerCase();
    const level = cat.includes("warning") ? "critical" : cat.includes("watch") || cat.includes("advisory") ? "notice" : null;
    if (!level || now - b.issued > BULLETIN_WINDOW_H * H) continue;
    out.push({
      id: `tsunami:${b.feed}:${b.issued}:${cat}`,
      level,
      kind: "tsunami",
      rule: `NWS tsunami bulletin, category ${b.category}`,
      title: `Tsunami ${b.category}`,
      detail: `${b.region}${b.mag ? `, preliminary magnitude ${b.mag}` : ""} (${b.center})`,
      lat: Number.isFinite(b.lat) ? b.lat : undefined,
      lon: Number.isFinite(b.lon) ? b.lon : undefined,
      at: iso(b.issued),
      expiresAt: iso(b.issued + ALERT_TTL_H * H),
      scenario: "overview",
      sourceName: b.center,
      sourceUrl: b.url,
    });
  }
  return out;
}

export function kpAlerts(rows: KpIn[], now: number): Alert[] {
  const out: Alert[] = [];
  for (const r of rows) {
    if (now - r.time > KP_WINDOW_H * H) continue;
    const level = r.kp >= KP_CRITICAL ? "critical" : r.kp >= KP_NOTICE ? "notice" : null;
    if (!level) continue;
    out.push({
      id: `kp:${r.time}`,
      level,
      kind: "geomagnetic",
      rule: level === "critical" ? `Kp ${KP_CRITICAL} or more (NOAA G4+)` : `Kp ${KP_NOTICE} (NOAA G3)`,
      title: `Geomagnetic storm, Kp ${r.kp.toFixed(1)}`,
      detail: r.kp >= 9 ? "NOAA scale G5, extreme" : r.kp >= 8 ? "NOAA scale G4, severe" : "NOAA scale G3, strong",
      at: iso(r.time),
      expiresAt: iso(r.time + ALERT_TTL_H * H),
      scenario: "solar",
      sourceName: "NOAA Space Weather Prediction Center",
      sourceUrl: "https://www.swpc.noaa.gov/products/planetary-k-index",
    });
  }
  return out;
}
