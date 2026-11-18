"use client";

import { EN } from "@/core/content/en";
import { TR, type Content } from "@/core/content/tr";
import { UI, type UiKey } from "@/core/content/ui";
import { useLang } from "@/lib/lang";

/** Translator for the Radar strings and the fixed Section 10 content, following the page language (saved choice, else the browser language). */
export function useT(): { t: (k: UiKey) => string; lang: "tr" | "en"; c: Content; fill: (k: UiKey, v: Record<string, string | number>) => string } {
  const [lang] = useLang();
  const t = (k: UiKey) => UI[lang][k];
  return { t, lang, c: lang === "tr" ? TR : EN, fill: (k, v) => t(k).replace(/\{(\w+)\}/g, (_, n) => String(v[n] ?? "")) };
}
