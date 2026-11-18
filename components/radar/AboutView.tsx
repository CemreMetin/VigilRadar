"use client";

import Link from "next/link";
import { ABOUT, SOURCES, STORAGE_KEYS } from "@/core/content/about";
import { useT } from "@/lib/radar/useT";
import LangSwitch from "@/components/LangSwitch";

export default function AboutView() {
  const { lang, c } = useT();
  const a = ABOUT[lang];
  return (
    <main className="mx-auto max-w-3xl px-4 py-6 text-read">
      <div className="flex items-center justify-between">
        <Link href="/" className="mono text-body hover:text-accent">{a.back}</Link>
        <LangSwitch />
      </div>
      <h1 className="mono mt-4 text-title">{a.title}</h1>

      <h2 className="label mt-6">{a.is.h}</h2>
      <p className="mt-2">{a.is.p}</p>

      <h2 className="label mt-6">{a.isNot.h}</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">{a.isNot.items.map((s) => <li key={s}>{s}</li>)}</ul>

      <h2 className="label mt-6">{a.evidence.h}</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">{a.evidence.items.map((s) => <li key={s}>{s}</li>)}</ul>

      <h2 id="sources" className="label mt-6">{a.sources.h}</h2>
      <p className="mt-2 text-dim">{a.sources.intro}</p>
      <ul className="mt-2 divide-y divide-line border border-line text-body">
        {SOURCES.map((s) => (
          <li key={s.name} className="px-3 py-2">
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-bold text-accent hover:underline">{s.name} ↗</a> · {s.use[lang]} · <span className="text-dim">{s.license[lang]}</span>
            {s.credit && <span className="block text-dim">{s.credit}</span>}
          </li>
        ))}
      </ul>

      <h2 className="label mt-6">{a.privacy.h}</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">{a.privacy.items.map((s) => <li key={s}>{s}</li>)}</ul>
      <p className="mt-2">{a.privacy.hosts}</p>
      <p className="mt-2">{a.privacy.keys}</p>
      <ul className="mono mt-1 text-body">{STORAGE_KEYS.map((k) => <li key={k}>{k}</li>)}</ul>

      <p className="mt-8 border-t border-line pt-3 text-body text-dim">{c.disclaimer}</p>
    </main>
  );
}
