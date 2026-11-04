"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BAG_ITEMS,
  CATEGORY_LABEL,
  COMMS_ROWS,
  GUIDES,
  OFFLINE_READING,
  REGULATOR_LINKS,
  SCENARIO_FILTERS,
  type BagCategory,
  type ScenarioTag,
} from "@/data/survival";
import Link from "next/link";
import { useMyCountry } from "@/lib/myCountry";
import { useLazyJson } from "@/lib/useLazyJson";
import type { ProfilesFile } from "@/lib/types";
import OfflineButton from "./OfflineButton";
import { ChecklistPrintForm, usePrintSheet } from "./ChecklistPrint";
import { PAGE_META } from "@/data/pages";
import WikiShell, { type WikiSection } from "./WikiShell";

const STORAGE_KEY = "monitoring.bag.v1";

function loadChecked(): Set<string> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveChecked(set: Set<string>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    /* storage unavailable (private mode): the list still works, it just will not persist */
  }
}

const A = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
    {children}
  </a>
);

function MapExtractTool() {
  const [lat, setLat] = useState("41.01");
  const [lon, setLon] = useState("28.98");
  const [radius, setRadius] = useState("40");
  const [geoMsg, setGeoMsg] = useState("");

  const bbox = useMemo(() => {
    const la = Number(lat);
    const lo = Number(lon);
    const r = Number(radius);
    if (![la, lo, r].every(Number.isFinite) || Math.abs(la) > 85 || Math.abs(lo) > 180 || r <= 0 || r > 300) return null;
    const dLat = r / 111.32;
    const dLon = r / (111.32 * Math.cos((la * Math.PI) / 180));
    return [lo - dLon, la - dLat, lo + dLon, la + dLat].map((v) => v.toFixed(4)).join(",");
  }, [lat, lon, radius]);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoMsg("This browser has no location support.");
      return;
    }
    setGeoMsg("Asking your device…");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLat(p.coords.latitude.toFixed(3));
        setLon(p.coords.longitude.toFixed(3));
        setGeoMsg("Used your position. It stays in your browser and is not sent anywhere.");
      },
      () => setGeoMsg("Location was not shared. Type coordinates instead."),
      { maximumAge: 600_000, timeout: 10_000 },
    );
  };

  const cmd = bbox
    ? `pmtiles extract https://build.protomaps.com/<BUILD_DATE>.pmtiles my-area.pmtiles --bbox=${bbox} --maxzoom=14`
    : "";

  const field = "mono w-full border border-line bg-bg px-2 py-1 text-xs text-fg";
  return (
    <div className="mt-3 border border-line p-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs text-dim">
          Latitude
          <input className={field} inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} />
        </label>
        <label className="text-xs text-dim">
          Longitude
          <input className={field} inputMode="decimal" value={lon} onChange={(e) => setLon(e.target.value)} />
        </label>
        <label className="text-xs text-dim">
          Radius (km, max 300)
          <input className={field} inputMode="decimal" value={radius} onChange={(e) => setRadius(e.target.value)} />
        </label>
      </div>
      <button
        type="button"
        onClick={useMyLocation}
        className="mono mt-3 border border-line px-2.5 py-1 text-xs text-dim hover:border-accent hover:text-accent"
      >
        use my location
      </button>
      {geoMsg && <span className="ml-3 text-xs text-dim">{geoMsg}</span>}
      {cmd ? (
        <>
          <p className="label mt-4">Command</p>
          <pre className="mono mt-1 overflow-x-auto whitespace-pre-wrap break-all border border-line bg-bg p-2 text-[11px]">{cmd}</pre>
          <p className="mt-2 text-xs leading-relaxed text-dim">
            Replace <code className="mono">&lt;BUILD_DATE&gt;</code> with a build listed on the{" "}
            <A href="https://maps.protomaps.com/builds/">Protomaps builds page</A>. Add{" "}
            <code className="mono">--dry-run</code> first to see how many tiles and how much data it would download. Needs the free{" "}
            <A href="https://docs.protomaps.com/pmtiles/cli">pmtiles command-line tool</A>.
          </p>
        </>
      ) : (
        <p className="mt-3 text-xs text-threat">Enter a valid latitude, longitude and a radius up to 300 km.</p>
      )}
    </div>
  );
}

export default function SurvivalHub() {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<ScenarioTag | "all">("all");
  const [tier, setTier] = useState<1 | 2>(1);
  const { start, sheet } = usePrintSheet();
  const [mine] = useMyCountry();
  const { data: profiles } = useLazyJson<ProfilesFile>("/data/country_profiles.json", !!mine);
  const mineProfile = mine ? profiles?.countries[mine] : undefined;
  // only what the site already holds about the country; no scores and no probabilities
  const mineChips: { tag: ScenarioTag; why: string }[] = mineProfile
    ? [
        ...(mineProfile.arsenal || mineProfile.plants ? [{ tag: "nuclear" as const, why: "nuclear-armed state or has nuclear power plants" }] : []),
        ...(mineProfile.volcanoes.length ? [{ tag: "ash" as const, why: "has a supervolcano on the watchlist" }] : []),
        ...(mineProfile.outbreaks.some((o) => Date.parse(profiles!.generatedAt) - Date.parse(o.date) < 90 * 864e5) ? [{ tag: "pandemic" as const, why: "WHO outbreak report in the last 90 days" }] : []),
      ]
    : [];

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setChecked(loadChecked());
    // /survive/?for=nuclear opens the checklist already highlighted for that scenario
    const wanted = new URLSearchParams(window.location.search).get("for");
    if (wanted && SCENARIO_FILTERS.some((f) => f.id === wanted)) setFilter(wanted as ScenarioTag);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const toggle = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveChecked(next);
      return next;
    });

  const reset = () => {
    if (window.confirm("Clear every tick on this list? Only this device is affected.")) {
      const empty = new Set<string>();
      saveChecked(empty);
      setChecked(empty);
    }
  };

  const items = BAG_ITEMS.filter((i) => i.tier === tier);
  const byCategory = useMemo(() => {
    const m = new Map<BagCategory, typeof items>();
    for (const it of items) m.set(it.category, [...(m.get(it.category) ?? []), it]);
    return [...m.entries()];
  }, [items]);

  const relevant = (tags: ScenarioTag[]) => filter === "all" || tags.length === 0 || tags.includes(filter);
  const tierDone = items.filter((i) => checked.has(i.id)).length;

  const sections: WikiSection[] = [
    { id: "plan", label: "Plan", group: "Start here", hint: "30 minutes, no money", content: (
      <>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
        <li>
          <strong>Meet.</strong> Talk through how you would get alerts, where you would shelter, how you would leave, and
          how the household would contact each other.
        </li>
        <li>
          <strong>Assess.</strong> Note medical needs, disabilities, children, older relatives and pets.
        </li>
        <li>
          <strong>Write it down.</strong> Contacts, a meeting place near home and one outside your area, an out-of-town contact.
        </li>
        <li>
          <strong>Practise.</strong> A plan nobody has rehearsed fails under stress.
        </li>
      </ol>
      <p className="mono mt-2 text-[11px] text-dim">
        Steps from <A href="https://www.ready.gov/plan">Ready.gov: Make a plan</A>.
      </p>
      <button type="button" onClick={() => start({ kind: "plan" })} className="btn mono no-print mt-4 px-3 py-1.5 text-xs font-bold">
        PRINT FILL-IN PLAN
      </button>

      </>
    ) },
    { id: "bag", label: "Checklist", group: "Start here", hint: "Packing list, ticks stay on this device", content: (
      <>
      <div className="no-print mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Highlight for scenario">
        {SCENARIO_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`mono border px-2 py-1 text-[11px] ${
              filter === f.id ? "border-safe bg-safe/10 text-safe" : "border-line text-dim hover:text-fg"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <p className="no-print mt-2 text-xs text-dim">
        Choosing a scenario fades items that matter less for it. Nothing is hidden.
      </p>

      <div className="no-print mt-4 flex items-center gap-1" role="tablist" aria-label="Kit type">
        {(
          [
            [1, "Grab-and-go (about 72 hours)"],
            [2, "Staying put (longer)"],
          ] as const
        ).map(([t, label]) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tier === t}
            onClick={() => setTier(t)}
            className={`mono flex-1 border px-2 py-1.5 text-xs ${
              tier === t ? "border-safe bg-safe/10 text-safe" : "border-line text-dim hover:text-fg"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="mono mt-2 text-[11px] text-dim">
        {tierDone} of {items.length} packed on this list
        {tierDone > 0 && (
          <button type="button" onClick={reset} className="no-print ml-3 text-dim underline hover:text-fg">
            clear all ticks
          </button>
        )}
      </p>

      <div className="mt-3 space-y-5">
        {byCategory.map(([cat, list]) => (
          <fieldset key={cat}>
            <legend className="label mb-1">
              {CATEGORY_LABEL[cat]} · {list.filter((i) => checked.has(i.id)).length}/{list.length}
            </legend>
            <ul className="divide-y divide-line border border-line">
              {list.map((it) => {
                const on = checked.has(it.id);
                const dim = !relevant(it.tags);
                return (
                  <li key={it.id} className={dim ? "opacity-45" : ""}>
                    <label className="flex cursor-pointer items-start gap-3 px-3 py-2 hover:bg-safe/5">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 shrink-0"
                        style={{ accentColor: "var(--safe)" }}
                        checked={on}
                        onChange={() => toggle(it.id)}
                      />
                      <span className="min-w-0">
                        <span className={`block text-[13px] font-medium ${on ? "text-dim line-through" : ""}`}>{it.name}</span>
                        <span className="block text-xs leading-relaxed text-dim">
                          {it.why}
                          {it.source && (
                            <>
                              {" "}
                              <A href={it.source.url}>{it.source.label} ↗</A>
                            </>
                          )}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        ))}
      </div>
      <ChecklistPrintForm defaultTier={tier} onPrint={(o) => start({ kind: "checklist", ...o, checked, filter })} />

      </>
    ) },
    { id: "shelter", label: "Radiation shelter", group: "Emergencies", hint: "Get inside, stay inside, stay tuned", content: (
      <>
      <div className="mt-3 border border-line p-4 text-sm leading-relaxed">
        <p>
          Official guidance (Ready.gov) is three words: <strong>get inside, stay inside, stay tuned.</strong>
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-dim">
          <li>Go to the nearest solid building, away from windows. A basement or the middle of a building is best.</li>
          <li>If you are caught outside by a blast, Ready.gov advises lying face down to protect your skin, then getting indoors within about 10 minutes, before fallout arrives.</li>
          <li>Stay for at least 24 hours unless officials say otherwise or you face an immediate danger. Close windows, doors and air intakes.</li>
          <li>Afterwards, remove outer clothing (this removes up to 90% of radioactive material, per Ready.gov), wash with soap and water, and avoid unsealed outdoor food until authorities say it is safe.</li>
          <li>Potassium iodide is not a general radiation pill. Take it only if your health authority tells you to.</li>
        </ul>
        <p className="mono mt-3 text-[11px] text-dim">
          Source: <A href="https://www.ready.gov/nuclear-explosion">Ready.gov: Nuclear explosion</A> ·{" "}
          <A href="https://www.who.int/publications/i/item/9789241550185">WHO iodine thyroid blocking guideline</A>
        </p>
      </div>

      </>
    ) },
    { id: "comms", label: "Communication", group: "Emergencies", hint: "When networks fail", content: (
      <>
      <p className="mt-3 text-sm leading-relaxed text-dim">
        Start simple: a written contact list, a meeting place and a battery radio to hear official instructions. Two-way
        radio is a bonus; learn it before you need it.
      </p>
      <div className="mt-3 overflow-x-auto border border-line">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead>
            <tr className="label border-b border-line">
              <th className="p-2 font-normal">Method</th>
              <th className="p-2 font-normal">Where</th>
              <th className="p-2 font-normal">Licence</th>
              <th className="p-2 font-normal">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line align-top">
            {COMMS_ROWS.map((r) => (
              <tr key={r.service}>
                <th scope="row" className="p-2 font-medium">{r.service}</th>
                <td className="p-2 text-dim">{r.where}</td>
                <td className="p-2 text-dim">{r.licence}</td>
                <td className="p-2 leading-relaxed text-dim">{r.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-dim">
        Radio rules differ by country and change. Never transmit on emergency-service or public-safety channels, and do not
        use amateur frequencies without a licence. Check your regulator:{" "}
        {REGULATOR_LINKS.map((l, i) => (
          <span key={l.url}>
            {i > 0 && " · "}
            <A href={l.url}>{l.label}</A>
          </span>
        ))}
        .
      </p>
      <button type="button" onClick={() => start({ kind: "card" })} className="btn mono no-print mt-4 px-3 py-1.5 text-xs font-bold">
        PRINT WALLET CARD
      </button>

      </>
    ) },
    { id: "maps", label: "Offline maps", group: "Resources", hint: "Maps without a connection", content: (
      <>
      <p className="mt-3 text-sm leading-relaxed text-dim">
        For most people the easiest option is a phone app with downloaded regions. If you are technical and want a map file
        you control, the tool below builds the extraction command for a circle around a place.
      </p>
      <ul className="mt-2 space-y-1 text-xs">
        {OFFLINE_READING.map((o) => (
          <li key={o.url}>
            <A href={o.url}>{o.label} ↗</A> <span className="text-dim">· {o.note}</span>
          </li>
        ))}
      </ul>
      <MapExtractTool />

      </>
    ) },
    { id: "guides", label: "Official guides", group: "Resources", hint: "Links to the agencies that issue them", content: (
      <>
      <p className="mt-3 text-sm leading-relaxed text-dim">
        These are links, not copies: guidance changes, and the issuing health and emergency agencies keep it current. For
        medicine and doses, follow them, not this page. Save the ones you need before a crisis (print to PDF or open them in
        a reader such as Kiwix).
      </p>
      <ul className="mt-3 divide-y divide-line border border-line">
        {GUIDES.map((g) => (
          <li key={g.url} className="px-3 py-2">
            <A href={g.url}>
              {g.title} ↗
            </A>
            <span className="mono ml-2 text-[11px] text-dim">{g.org}</span>
            {g.botBlocked && <span className="mono ml-2 text-[11px] text-dim">(opens in a browser)</span>}
            <span className="block text-xs text-dim">{g.blurb}</span>
          </li>
        ))}
      </ul>
      </>
    ) },
  ];

  return (
    <>
    {sheet}
    <WikiShell
      title="What can you do?"
      accent="var(--safe)"
      intro="A calm preparedness guide from official sources: plan, checklist, shelter, communication, offline maps. It works offline and needs no account."
      {...PAGE_META.survive}
      aside={
        <>
          {mineProfile && (
            <p className="mb-3 text-sm">
              Your country: <strong>{mineProfile.name}</strong>{" "}
              <Link href="/country" className="text-accent hover:underline">change</Link>.{" "}
              {mineChips.length > 0 ? "Highlight the checklist for:" : "Nothing in the site's data points to a scenario for it."}{" "}
              {mineChips.map((c) => (
                <button
                  key={c.tag}
                  type="button"
                  title={c.why}
                  onClick={() => {
                    setFilter(c.tag);
                    window.history.replaceState(null, "", "?tab=bag");
                    window.dispatchEvent(new Event("hashchange")); // WikiShell re-reads the URL and opens the checklist
                  }}
                  className="mono mr-1.5 border border-line px-2 py-0.5 text-[11px] text-dim hover:text-fg"
                >
                  {SCENARIO_FILTERS.find((f) => f.id === c.tag)?.label}
                </button>
              ))}
            </p>
          )}
          <OfflineButton />
        </>
      }
      openOnParam={{ for: "bag" }}
      sections={sections.map((sec, i) =>
        i === sections.length - 1
          ? { ...sec, content: (<>{sec.content}
      <p className="mt-6 text-xs leading-relaxed text-dim">
        This page gives general information, not medical or safety advice for your situation. Follow instructions from
        local authorities.
      </p>
</>) }
          : sec,
      )}
    />
    </>
  );
}
