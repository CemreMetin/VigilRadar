import { PROVINCES } from "../../../core/build-state";
import { haversineKm } from "../../../core/geo";
import { provinceTsunamiAdvice } from "../../../core/tsunami";
import type { Notice } from "./policy";

// Message texts (VIGIL.md 7.2), Turkish and English with the same structure. Pure: no network, no storage.

export type Lang = "tr" | "en";
export interface Message { title: string; body: string; url: string }

const SRC = { afad: "AFAD", kandilli: "Kandilli", emsc: "EMSC", usgs: "USGS", tsunami: "NOAA" } as const;
const T = {
  tr: {
    quake: "DEPREM", update: "GÜNCELLEME", cancel: "İPTAL", tsunami: "TSUNAMİ UYARISI",
    near: (p: string, km: number) => `${p} merkezine ${km} km`,
    meta: (hm: string, d: number, src: string) => `${hm} · derinlik ${d} km · kaynak: ${src}`,
    p0: "İlinde yıkıcı olabilir.", p1: "İlinde güçlü hissedilmiş olabilir.",
    coast: "Kıyıdaysan hemen yüksek bir yere çık.",
    todo: "Ne yapmalı:", cancelled: (m: string) => `M${m} depremi bildirimi geri çekildi. Önceki bildirimi dikkate alma.`,
    provinces: "Etkilenen iller:", more: (n: number) => `+${n} il`,
    disclaimer: "Bu bir erken uyarı değildir; sarsıntı sonrası bilgilendirmedir.",
  },
  en: {
    quake: "EARTHQUAKE", update: "UPDATE", cancel: "CANCELLED", tsunami: "TSUNAMI WARNING",
    near: (p: string, km: number) => `${km} km from ${p}`,
    meta: (hm: string, d: number, src: string) => `${hm} · depth ${d} km · source: ${src}`,
    p0: "May be destructive in this province.", p1: "May have been strongly felt in this province.",
    coast: "If you are on the coast, move to high ground now.",
    todo: "What to do:", cancelled: (m: string) => `The report of the M${m} earthquake was withdrawn. Disregard the earlier alert.`,
    provinces: "Affected provinces:", more: (n: number) => `+${n} more`,
    disclaimer: "This is not an early warning; it is information after the shaking.",
  },
} as const;

const byCode = new Map(PROVINCES.map((p) => [p.code, p]));
/** Turkey messages carry Turkey time (UTC+3 all year), global ones UTC. */
const clock = (ms: number, scope: Notice["scope"]) =>
  scope === "TR" ? `${new Date(ms + 3 * 3_600_000).toISOString().slice(11, 16)} TRT` : `${new Date(ms).toISOString().slice(11, 16)} UTC`;
const MAX_LISTED = 8;

/** The Telegram message for one notice; it lists all of the notice's provinces. */
export function compose(n: Notice, lang: Lang, siteUrl: string): Message {
  const t = T[lang];
  const url = `${siteUrl.replace(/\/$/, "")}/?q=${encodeURIComponent(n.eventId)}`;
  const tail = [t.disclaimer];
  const head = n.kind === "update" ? `${t.update} · ` : n.kind === "cancel" ? `${t.cancel} · ` : "";

  if (n.kind === "tsunami") return { title: `${t.tsunami} — ${n.place}`, body: [clock(n.timeMs, n.scope), `${t.todo} ${url}`, ...tail].join("\n"), url };

  const mag = n.mag.toFixed(1);
  const hits = n.provinces;
  const first = byCode.get(hits[0]?.code ?? "");
  const where = first ? t.near(first.name, Math.round(haversineKm(first, n))) : n.place;
  const title = `${head}M${mag} ${t.quake} — ${where}`;
  if (n.kind === "cancel") return { title, body: [t.cancelled(mag), ...tail].join("\n"), url };

  const lines = [t.meta(clock(n.timeMs, n.scope), Math.round(n.depthKm), SRC[n.source])];
  if (hits.length) {
    const sev = hits[0].sev === "P0" ? t.p0 : t.p1;
    if (hits.length > 1) {
      const names = hits.slice(0, MAX_LISTED).map((h) => `${byCode.get(h.code)?.name ?? h.code} (${h.sev})`).join(", ");
      lines.push(`${t.provinces} ${names}${hits.length > MAX_LISTED ? ` ${t.more(hits.length - MAX_LISTED)}` : ""}`);
    } else lines.push(sev);
    if (hits.some((h) => { const p = byCode.get(h.code); return !!p && provinceTsunamiAdvice(p, n); })) lines.push(t.coast);
  }
  lines.push(`${t.todo} ${url}`, ...tail);
  return { title, body: lines.join("\n"), url };
}
