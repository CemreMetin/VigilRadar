import { PROVINCES } from "../../../core/build-state";
import { CONFIG } from "../../../core/config";
import { haversineKm } from "../../../core/geo";
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
const hhmm = (ms: number) => new Date(ms + 3 * 3_600_000).toISOString().slice(11, 16); // Turkey time, UTC+3 all year
const MAX_LISTED = 8;

/** The message for one notice. `province` is the one a push goes to; Telegram lists all of the notice's provinces. */
export function compose(n: Notice, lang: Lang, siteUrl: string, opts: { province?: string; telegram?: boolean } = {}): Message {
  const t = T[lang];
  const url = `${siteUrl.replace(/\/$/, "")}/alert?e=${encodeURIComponent(n.eventId)}`;
  const tail = opts.telegram ? [t.disclaimer] : [];
  const head = n.kind === "update" ? `${t.update} · ` : n.kind === "cancel" ? `${t.cancel} · ` : "";

  if (n.kind === "tsunami") return { title: `${t.tsunami} — ${n.place}`, body: [`${hhmm(n.timeMs)}`, `${t.todo} ${url}`, ...tail].join("\n"), url };

  const mag = n.mag.toFixed(1);
  const hits = opts.telegram ? n.provinces : n.provinces.filter((h) => h.code === opts.province);
  const first = byCode.get(hits[0]?.code ?? "");
  const where = first ? t.near(first.name, Math.round(haversineKm(first, n))) : n.place;
  const title = `${head}M${mag} ${t.quake} — ${where}`;
  if (n.kind === "cancel") return { title, body: [t.cancelled(mag), ...tail].join("\n"), url };

  const lines = [t.meta(hhmm(n.timeMs), Math.round(n.depthKm), SRC[n.source])];
  if (hits.length) {
    const sev = hits[0].sev === "P0" ? t.p0 : t.p1;
    if (opts.telegram && hits.length > 1) {
      const names = hits.slice(0, MAX_LISTED).map((h) => `${byCode.get(h.code)?.name ?? h.code} (${h.sev})`).join(", ");
      lines.push(`${t.provinces} ${names}${hits.length > MAX_LISTED ? ` ${t.more(hits.length - MAX_LISTED)}` : ""}`);
    } else lines.push(sev);
    const ts = CONFIG.tsunamiRuleTR;
    if (hits.some((h) => byCode.get(h.code)?.coastal) && n.mag >= ts.minMag && n.depthKm <= ts.maxDepthKm) lines.push(t.coast);
  }
  lines.push(`${t.todo} ${url}`, ...tail);
  return { title, body: lines.join("\n"), url };
}
