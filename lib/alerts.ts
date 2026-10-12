/** Shared by the alert engine (worker) and the browser. An alert is a published observation that crossed a fixed threshold. */

export type AlertLevel = "critical" | "notice";
export type AlertKind = "quake" | "tsunami" | "geomagnetic";

export type Alert = {
  id: string; // stable across runs, used for de-duplication and acknowledgement
  level: AlertLevel;
  kind: AlertKind;
  rule: string; // which rule fired, in words
  title: string;
  detail: string;
  lat?: number;
  lon?: number;
  at: string; // ISO UTC: when the underlying event happened or was issued
  expiresAt: string; // after this the alert drops out of the file and the browser alarm clears
  scenario: string; // dashboard tab to open
  entityId?: string; // map entity to select
  sourceName: string;
  sourceUrl: string;
};

export type AlertsFile = {
  generatedAt: string;
  rules: string[];
  active: Alert[];
};

/** Which upstream source an alert kind depends on, so a failed source can keep its previous alerts. */
export const KIND_SOURCE: Record<AlertKind, "usgs" | "tsunami" | "swpc"> = { quake: "usgs", tsunami: "tsunami", geomagnetic: "swpc" };
