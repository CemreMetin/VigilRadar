"use client";

import { agoText } from "@/lib/radar/format";
import { freshnessRows, type FreshStatus } from "@/lib/radar/freshness";
import { useNow } from "@/lib/radar/useNow";
import { useRadar } from "@/lib/radar/useRadar";
import { useT } from "@/lib/radar/useT";

const STATUS = { ok: "freshOk", error: "freshError", stale: "freshStale", none: "freshNone" } as const;
const TONE: Record<FreshStatus, string> = { ok: "text-safe", error: "text-threat", stale: "text-conflict", none: "text-dim" };

/** Data freshness table for /about: every source with its last successful fetch, its newest event and a status. */
export default function SourceFreshness() {
  const { loaded, done } = useRadar();
  const now = useNow();
  const { t, lang } = useT();
  const state = loaded?.state ?? null;
  const locale = lang === "tr" ? "tr-TR" : "en-GB";
  const when = (ms: number | null) => (ms === null ? "—" : `${new Date(ms).toLocaleString(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · ${agoText(now - ms, t)}`);

  return (
    <section aria-label={t("freshHead")}>
      <h2 id="freshness" className="label mt-6">{t("freshHead")}</h2>
      {!state ? <p className="mt-2 text-dim">{done ? t("noData") : t("freshLoading")}</p> : (
        <div className="mt-2 overflow-x-auto">
          <table className="mono w-full border border-line text-left text-body">
            <thead className="text-label text-dim"><tr>
              <th scope="col" className="px-3 py-2">{t("freshSource")}</th><th scope="col" className="px-3 py-2">{t("freshFetched")}</th>
              <th scope="col" className="px-3 py-2">{t("freshNewest")}</th><th scope="col" className="px-3 py-2">{t("freshStatus")}</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {freshnessRows(state, now || state.generatedMs).map((r) => (
                <tr key={r.key}>
                  <th scope="row" className="px-3 py-2 font-bold">{r.name}</th>
                  <td className="px-3 py-2">{now ? when(r.fetchedMs) : "—"}</td>
                  <td className="px-3 py-2">{now ? (r.key === "portwatch" && r.newestMs !== null ? new Date(r.newestMs).toLocaleDateString(locale, { day: "numeric", month: "short" }) : when(r.newestMs)) : "—"}</td>
                  <td className={`px-3 py-2 font-bold ${TONE[r.status]}`}>{t(STATUS[r.status])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-2 text-label text-dim">{t("freshNote")}</p>
    </section>
  );
}
