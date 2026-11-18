"use client";

import { UI, type UiKey } from "@/core/content/ui";
import { useLang } from "@/lib/lang";

/** Translator for the Radar strings, following the page language (saved choice, else the browser language). */
export function useT(): { t: (k: UiKey) => string; lang: "tr" | "en" } {
  const [lang] = useLang();
  return { t: (k) => UI[lang][k], lang };
}
