// Interface strings, Turkish and English (VIGIL.md 8.6). No i18n library: a lookup by key. Both languages carry the same keys.
const tr = {
  live: "LIVE", backup: "YEDEK KAYNAK", stale: "STALE", noData: "VERİ YOK",
  global: "KÜRESEL", region: "BÖLGEN", pickProvince: "İlini seç", regionGlobal: "Küresel", regionLabel: "Bölge",
  filterProvinces: "İl ara…", noMatch: "Eşleşen il yok", dismiss: "Kapat",
  lastData: "son veri", ago: "önce", min: "dk", hour: "sa", day: "gün",
  recentEvents: "Son olaylar", noEvents: "Son 7 günde olay yok.",
  noChokepoints: "Boğaz verisi yok", sources: "kaynaklar", about: "hakkında",
} as const;
const en: Record<keyof typeof tr, string> = {
  live: "LIVE", backup: "BACKUP SOURCE", stale: "STALE", noData: "NO DATA",
  global: "GLOBAL", region: "YOUR REGION", pickProvince: "Pick your province", regionGlobal: "Global", regionLabel: "Region",
  filterProvinces: "Find a province…", noMatch: "No matching province", dismiss: "Dismiss",
  lastData: "last data", ago: "ago", min: "min", hour: "h", day: "d",
  recentEvents: "Recent events", noEvents: "No events in the last 7 days.",
  noChokepoints: "No chokepoint data", sources: "sources", about: "about",
};
export type UiKey = keyof typeof tr;
export const UI = { tr: tr as Record<UiKey, string>, en };
