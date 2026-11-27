"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { readMoreFor, type ReadMore } from "@/core/content/readmore";
import type { ChokepointFlow, ConflictCluster, MergedQuake, State } from "@/core/types";
import { PLANTS } from "@/core/build-state";
import plantsData from "@/public/data/static/plants.json";
import { agoText } from "@/lib/radar/format";
import { chokepointKey, chokepointKeys, linkRadiusKm, namedLinks, type ChokepointKey, type NamedLink } from "@/lib/radar/triage";
import { useT } from "@/lib/radar/useT";
import { SIM_UI } from "@/core/laplace/copy";
import type { ShockId } from "@/core/laplace/types";
import { shockForStrait } from "@/lib/radar/laplaceGeo";
import type { Selection } from "./RadarMap";

const SRC = { usgs: "USGS", emsc: "EMSC", afad: "AFAD", kandilli: "B.Ü. KRDAE" } as const;
interface PlantMeta { id: string; country: string; status: string; reactors: number }
const PLANT_META = new Map((plantsData.plants as PlantMeta[]).map((p) => [p.id, p]));

interface Props { state: State; sel: Selection; now: number; onClose: () => void; onSimulate: (shock: ShockId) => void }

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line p-3">
      <h3 className="label">{title}</h3>
      <div className="mt-2 space-y-2 text-read">{children}</div>
    </section>
  );
}

/** Mini line of the last 30 daily counts, plain SVG. */
export function MiniLine({ values }: { values: number[] }) {
  const max = Math.max(...values), min = Math.min(...values), span = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 240},${46 - ((v - min) / span) * 42}`).join(" ");
  return <svg viewBox="0 0 240 48" className="h-12 w-full" role="img" aria-label={`${values.length}`}><polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent" /></svg>;
}

export default function TriageCard({ state, sel, now, onClose, onSimulate }: Props) {
  const { t, c, fill, lang } = useT();
  const locale = lang === "tr" ? "tr-TR" : "en-GB";
  const ago = (ms: number) => agoText(now - ms, t);

  const linkList = (links: NamedLink[], mag?: number) =>
    links.length === 0 ? <p className="text-dim">{t("noLinks")}</p> : (
      <ul className="space-y-1">
        {links.map(({ link, name }) => (
          <li key={link.id}>
            <span className="font-bold">{name}</span> · {Math.round(link.distanceKm)} {t("km")} ·{" "}
            <span className="text-dim">
              {link.fromKind === "quake" && mag !== undefined ? fill("withinQuake", { mag, km: linkRadiusKm(link, mag) }) : fill("withinConflict", { km: link.toKind === "plant" ? 50 : 150 })}
              {link.chronic ? ` · ${t("chronic")}` : ""}
            </span>
          </li>
        ))}
      </ul>
    );

  // "Global impact / context": the straits the event touches, else one plain line
  const context = (keys: ChokepointKey[]) =>
    keys.length === 0 ? <p className="text-dim">{t("noGlobal")}</p> : keys.map((k) => (
      <p key={k}><span className="font-bold">{c.chokepointNotes[k].name}</span> — {c.chokepointNotes[k].text} <span className="mono text-label text-dim">{c.chokepointNotes[k].evidence}</span></p>
    ));

  let body: ReactNode = null;
  let title = "";
  let more: ReadMore | null = null; // the one /library page that fits, if any
  let straits: ChokepointKey[] = []; // the straits this card touches; the first one with a shock gets the simulate button

  if (sel.kind === "quake") {
    const q = state.quakes.find((x) => x.id === sel.id) as MergedQuake | undefined;
    if (!q) return null;
    const b = q.best;
    const links = namedLinks(state, state.links.filter((l) => l.fromKind === "quake" && l.fromId === q.id));
    title = `${t("quake")} M${b.mag}`;
    more = readMoreFor(b.lat, b.lon);
    straits = chokepointKeys(state, links);
    body = (
      <>
        <Block title={t("qWhat")}>
          <p className="font-bold">M{b.mag} · {b.place}</p>
          <p className="text-dim">{new Date(b.timeMs).toLocaleString(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · {ago(b.timeMs)}</p>
          <p className="text-dim">{t("depth")} {Math.round(b.depthKm)} {t("km")} · {t("srcs")}: {q.sources.map((s) => SRC[s.source]).join(", ")}</p>
          <p className="mono text-label">{t("evidenceA")} · {t("prelim")}</p>
        </Block>
        <Block title={t("qNearby")}>{linkList(links, b.mag)}</Block>
        <Block title={t("qContext")}>{context(straits)}</Block>
      </>
    );
  } else if (sel.kind === "conflict") {
    const k = state.conflicts.find((x) => x.id === sel.id) as ConflictCluster | undefined;
    if (!k) return null;
    const links = namedLinks(state, state.links.filter((l) => l.fromKind === "conflict" && l.fromId === k.id));
    const keys = [...new Set(links.filter((l) => l.link.toKind === "chokepoint").map((l) => chokepointKey(l.name)).filter((x): x is ChokepointKey => !!x))];
    title = t("conflict");
    straits = keys;
    body = (
      <>
        <Block title={t("qWhat")}>
          <p className="font-bold">{k.label}</p>
          <p className="text-dim">{k.events} {t("events")} · {k.domains} {t("domains")} · {ago(k.lastSeenMs)}</p>
          <p className="mono text-label">{t("evidenceB")}</p>
          <ul className="text-body">{k.sampleUrls.map((u) => { let host = u; try { host = new URL(u).hostname; } catch { /* keep the raw text */ } return <li key={u}><a href={u} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{host} ↗</a></li>; })}</ul>
        </Block>
        <Block title={t("qNearby")}>{linkList(links)}</Block>
        <Block title={t("qContext")}>{keys.length > 0 && context(keys)}<p className="text-dim">{c.conflictNote}</p></Block>
      </>
    );
  } else if (sel.kind === "plant") {
    const p = PLANTS.find((x) => x.id === sel.id);
    if (!p) return null;
    const meta = PLANT_META.get(p.id);
    const links = namedLinks(state, state.links.filter((l) => l.toId === p.id));
    title = `${t("plant")}: ${p.name}`;
    const statusLabel = meta?.status === "Under Construction" ? t("plantConstruction") : meta?.status === "Operational" ? t("plantOperational") : meta?.status;
    body = (
      <>
        <Block title={t("qWhat")}>
          <p className="font-bold">{p.name}</p>
          {meta && <p className="mono text-body text-dim">{meta.country} · {meta.reactors} {t("reactors")}{statusLabel ? ` · ${statusLabel}` : ""}</p>}
          <p className="text-label text-dim">{t("approx")}</p>
        </Block>
        <Block title={t("qNearby")}>
          {links.length === 0 ? <p className="text-dim">{t("noLinks")}</p> : <ul>{links.map(({ link }) => <li key={link.id}>{link.rule.replace("→", " → ")} · {Math.round(link.distanceKm)} {t("km")}{link.chronic ? ` · ${t("chronic")}` : ""}</li>)}</ul>}
        </Block>
        <Block title={t("qContext")}><p>{t("plantNote")}</p></Block>
      </>
    );
  } else {
    const cp = state.chokepoints.find((x) => x.id === sel.id) as ChokepointFlow | undefined;
    if (!cp) return null;
    const key = chokepointKey(cp.name);
    const note = key ? c.chokepointNotes[key] : null;
    const links = namedLinks(state, state.links.filter((l) => l.toId === cp.id));
    title = `${t("chokepoint")}: ${note?.name ?? cp.name}`;
    straits = key ? [key] : [];
    body = (
      <>
        <Block title={t("qWhat")}>
          <p className="font-bold">{note?.name ?? cp.name}</p>
          {cp.level === "stale" || cp.recent === null || cp.baseline === null || cp.dev === null ? <p className="text-dim">{t("flowOld")}</p> : (
            <dl className="mono grid grid-cols-2 gap-x-3 text-body">
              <dt className="text-dim">{t("avg7")}</dt><dd>{Math.round(cp.recent)} {t("perDay")}</dd>
              <dt className="text-dim">{t("base90")}</dt><dd>{Math.round(cp.baseline)} {t("perDay")}</dd>
              <dt className="text-dim">{t("deviation")}</dt><dd>{(cp.dev * 100).toFixed(0)}% · {t(cp.level === "severe" ? "flowSevere" : cp.level === "deviation" ? "flowDeviation" : "flowNormal")}</dd>
            </dl>
          )}
          {cp.dataThrough && <p className="text-dim">{t("dataThrough")}: {new Date(cp.dataThrough).toLocaleDateString(locale, { day: "numeric", month: "short" })}</p>}
          {cp.series && cp.series.length > 1 ? <MiniLine values={cp.series} /> : <p className="text-label text-dim">{t("noSeries")}</p>}
        </Block>
        {note && (
          <Block title={t("qContext")}>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-body">
              <dt className="mono text-dim">{t("cpShare")}</dt><dd>{note.share}</dd>
              <dt className="mono text-dim">{t("cpCargo")}</dt><dd>{note.cargo}</dd>
              <dt className="mono text-dim">{t("cpWidth")}</dt><dd>{note.width}</dd>
              <dt className="mono text-dim">{t("cpDetour")}</dt><dd>{note.detour}</dd>
            </dl>
            <p className="pt-1">{note.text}</p>
            <p className="mono text-label text-dim">{note.evidence} · {note.source}</p>
          </Block>
        )}
        <Block title={t("qNearby")}>{linkList(links)}</Block>
      </>
    );
  }

  const shock = straits.map(shockForStrait).find((s) => s !== null);

  return (
    <article aria-label={title} className="border-t border-line-strong">
      <div className="flex items-center justify-between px-3 py-2">
        <h2 className="mono text-body font-bold">{title}</h2>
        <button type="button" onClick={onClose} aria-label={t("closeCard")} className="mono px-2 text-dim hover:text-fg">×</button>
      </div>
      {body}
      {shock && <p className="border-t border-line p-3"><button type="button" onClick={() => onSimulate(shock)} className="btn mono min-h-11 w-full px-3 py-2 text-body font-bold">{SIM_UI.simulateThis[lang]} →</button></p>}
      {more && <p className="border-t border-line p-3 text-body"><Link href={`/library/${more.id}`} className="text-accent hover:underline">{t("readMore")}: {more.title[lang]} →</Link></p>}
    </article>
  );
}
