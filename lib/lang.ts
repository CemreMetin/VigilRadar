import { useSyncExternalStore } from "react";

export type Lang = "en" | "tr";
const KEY = "vigil.lang";
const listeners = new Set<() => void>();

function read(): Lang {
  try {
    const stored = window.localStorage.getItem(KEY);
    if (stored === "en" || stored === "tr") return stored;
  } catch {
    /* storage blocked: fall through to the browser language */
  }
  return navigator.language.toLowerCase().startsWith("tr") ? "tr" : "en";
}

function write(lang: Lang) {
  try {
    window.localStorage.setItem(KEY, lang);
  } catch {
    /* blocked: the choice lasts until reload */
  }
  listeners.forEach((l) => l());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** The page language, EN or TR: saved choice, else the browser language. Only Survive and Scenarios have Turkish text. */
export function useLang(): [Lang, (lang: Lang) => void] {
  return [useSyncExternalStore(subscribe, read, () => "en" as Lang), write];
}
