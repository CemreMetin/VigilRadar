"use client";

import type { ReactNode } from "react";
import type { ChokepointFlow, ConflictCluster, MergedQuake, Province, State } from "@/core/types";
import { PLANTS } from "@/core/build-state";
import { agoText } from "@/lib/radar/format";
import { chokepointKey, linkRadiusKm, namedLinks, triageQuake, type ChokepointKey, type NamedLink } from "@/lib/radar/triage";
import { useT } from "@/lib/radar/useT";
import type { Selection } from "./RadarMap";

const SRC = { usgs: "USGS", emsc: "EMSC", afad: "AFAD", kandilli: "B.Ü. KRDAE" } as const;
const SEV = { P0: "sevP0", P1: "sevP1", P2: "sevP2" } as const;

interface Props { state: State; sel: Selection; now: number; province: Province | null; onClose: () => void }

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

export default function TriageCard({ state, sel, now, province, onClose }: Props) {
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

  const chokepointNotes = (keys: ChokepointKey[]) =>
    keys.map((k) => (
      <p key={k}><span className="font-bold">{c.chokepointNotes[k].name}</span> — {c.chokepointNotes[k].text} <span className="mono text-label text-dim">{c.chokepointNotes[k].evidence}</span></p>
    ));

  const comms = (
    <ul className="mt-3 space-y-1 border-t border-line pt-2 text-body text-dim">
      <li>{c.comms.call112}</li>
      <li>{c.comms.radio} {c.comms.radioFreq}</li>
      <li>{c.comms.pmr}</li>
      <li>{c.comms.amateur}</li>
    </ul>
  );

  let body: ReactNode = null;
  let title = "";

  if (sel.kind === "quake") {
    const q = state.quakes.find((x) => x.id === sel.id) as MergedQuake | undefined;
    if (!q) return null;
    const b = q.best;
    const tri = triageQuake(state, q, province);
    title = `${t("quake")} M${b.mag}`;
    body = (
      <>
        <Block title={t("qWhat")}>
          <p className="font-bold">M{b.mag} · {b.place}</p>
          <p className="text-dim">{new Date(b.timeMs).toLocaleString(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · {ago(b.timeMs)}</p>
          <p className="text-dim">{t("depth")} {Math.round(b.depthKm)} {t("km")} · {t("srcs")}: {q.sources.map((s) => SRC[s.source]).join(", ")}</p>
          <p className="mono text-label">{t("evidenceA")} · {t("prelim")}</p>
        </Block>
        <Block title={t("qAffects")}>{linkList(tri.links, b.mag)}</Block>
        <Block title={t("qYou")}>
          {tri.needsProvince ? <p className="text-dim">{t("pickForYou")}</p> : tri.severity ? (
            <>
              <p className="font-bold">{t(SEV[tri.severity])} ({tri.severity})</p>
              <p className="text-dim">{Math.round(tri.distanceKm ?? 0)} {t("km")} {t("fromCentre")} · {province?.name}</p>
              <p className="text-label text-dim">{t("roughNote")}</p>
            </>
          ) : <p>{t("noPhysical")}</p>}
          {chokepointNotes(tri.chokepoints)}
        </Block>
        <Block title={t("qDo")}>
          {tri.needsProvince ? <p className="text-dim">—</p> : tri.nothingToDo ? <p>{c.nothingToDo}</p> : (
            <>
              {tri.lists.map((k) => (
                <div key={k}>
                  <ol className="list-decimal space-y-1 pl-5">{(k === "tsunami" ? c.tsunami : c[k]).map((s) => <li key={s}>{s}</li>)}</ol>
                  {k === "tsunami" && <p className="mt-1 text-label text-dim">{c.tsunamiNote}</p>}
                  {k === "afterQuake" && <p className="mt-1 text-body">{c.afterQuakeNote}</p>}
                </div>
              ))}
              {comms}
            </>
          )}
        </Block>
      </>
    );
  } else if (sel.kind === "conflict") {
    const k = state.conflicts.find((x) => x.id === sel.id) as ConflictCluster | undefined;
    if (!k) return null;
    const links = namedLinks(state, state.links.filter((l) => l.fromKind === "conflict" && l.fromId === k.id));
    const keys = [...new Set(links.filter((l) => l.link.toKind === "chokepoint").map((l) => chokepointKey(l.name)).filter((x): x is ChokepointKey => !!x))];
    title = t("conflict");
    body = (
      <>
        <Block title={t("qWhat")}>
          <p className="font-bold">{k.label}</p>
          <p className="text-dim">{k.events} {t("events")} · {k.domains} {t("domains")} · {ago(k.lastSeenMs)}</p>
          <p className="mono text-label">{t("evidenceB")}</p>
          <ul className="text-body">{k.sampleUrls.map((u) => { let host = u; try { host = new URL(u).hostname; } catch { /* keep the raw text */ } return <li key={u}><a href={u} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{host} ↗</a></li>; })}</ul>
        </Block>
        <Block title={t("qAffects")}>{linkList(links)}</Block>
        <Block title={t("qYou")}>{keys.length ? chokepointNotes(keys) : <p>{t("noPhysical")}</p>}</Block>
        <Block title={t("qDo")}><p>{c.conflictNote}</p></Block>
      </>
    );
  } else if (sel.kind === "plant") {
    const p = PLANTS.find((x) => x.id === sel.id);
    if (!p) return null;
    const links = namedLinks(state, state.links.filter((l) => l.toId === p.id));
    title = t("plant");
    body = (
      <>
        <Block title={t("qWhat")}><p className="font-bold">{p.name}</p><p className="text-dim">{t("plant")} · {t("approx")}</p><p>{t("plantNote")}</p></Block>
        <Block title={t("qAffects")}>
          {links.length === 0 ? <p className="text-dim">{t("noLinks")}</p> : <ul>{links.map(({ link }) => <li key={link.id}>{link.rule.replace("→", " → ")} · {Math.round(link.distanceKm)} {t("km")}{link.chronic ? ` · ${t("chronic")}` : ""}</li>)}</ul>}
        </Block>
      </>
    );
  } else {
    const cp = state.chokepoints.find((x) => x.id === sel.id) as ChokepointFlow | undefined;
    if (!cp) return null;
    const key = chokepointKey(cp.name);
    const links = namedLinks(state, state.links.filter((l) => l.toId === cp.id));
    title = `${t("chokepoint")}: ${cp.name}`;
    body = (
      <>
        <Block title={t("qWhat")}>
          <p className="font-bold">{cp.name}</p>
          {cp.level === "stale" || cp.recent === null || cp.baseline === null || cp.dev === null ? <p className="text-dim">{t("flowOld")}</p> : (
            <dl className="mono grid grid-cols-2 gap-x-3 text-body">
              <dt className="text-dim">{t("avg7")}</dt><dd>{Math.round(cp.recent)} {t("perDay")}</dd>
              <dt className="text-dim">{t("base90")}</dt><dd>{Math.round(cp.baseline)} {t("perDay")}</dd>
              <dt className="text-dim">{t("deviation")}</dt><dd>{(cp.dev * 100).toFixed(0)}% · {cp.level}</dd>
            </dl>
          )}
          {cp.dataThrough && <p className="text-dim">{t("dataThrough")}: {new Date(cp.dataThrough).toLocaleDateString(locale, { day: "numeric", month: "short" })}</p>}
          {cp.series && cp.series.length > 1 ? <MiniLine values={cp.series} /> : <p className="text-label text-dim">{t("noSeries")}</p>}
        </Block>
        <Block title={t("qAffects")}>{linkList(links)}</Block>
        <Block title={t("qYou")}>{key ? chokepointNotes([key]) : <p>{t("noPhysical")}</p>}</Block>
      </>
    );
  }

  return (
    <article aria-label={title} className="border-t border-line-strong">
      <div className="flex items-center justify-between px-3 py-2">
        <h2 className="mono text-body font-bold">{title}</h2>
        <button type="button" onClick={onClose} aria-label={t("closeCard")} className="mono px-2 text-dim hover:text-fg">×</button>
      </div>
      {body}
    </article>
  );
}
