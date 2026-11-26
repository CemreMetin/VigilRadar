"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Map as MlMap } from "maplibre-gl";
import { useMyCountry } from "@/lib/myCountry";
import { useLazyJson } from "@/lib/useLazyJson";
import { captureMap, dataDate } from "@/lib/printMap";
import type { ProfilesFile } from "@/lib/types";
import { ChecklistSheet, PlanSheet, WalletCard } from "./ChecklistPrint";
import MiniMap from "./scenarios/MiniMap";
import ShelterGuidance from "./ShelterGuidance";

const CONTENTS = ["Household plan to fill in", "Emergency kit checklist (both lists)", "Wallet card to cut out", "Radiation shelter guidance", "A map of your country (or the world)"];

/** The preparedness pack: a print layout of the Survive sheets plus a map. "Save as PDF" is the browser's print dialog; nothing leaves the device. */
export default function PackView() {
  const [mine] = useMyCountry();
  const { data: profiles } = useLazyJson<ProfilesFile>("/data/country_profiles.json", !!mine);
  const country = mine ? profiles?.countries[mine] : undefined;
  const mapRef = useRef<MlMap | null>(null);
  const [mapImage, setMapImage] = useState<string | null>(null);
  const [dates, setDates] = useState({ on: "", asOf: "" });

  useEffect(() => {
    const clear = () => setMapImage(null);
    window.addEventListener("afterprint", clear);
    return () => window.removeEventListener("afterprint", clear);
  }, []);

  const savePdf = async () => {
    // the map canvas is hidden in print; a snapshot of it is printed instead
    if (mapRef.current) setMapImage(await captureMap(mapRef.current));
    setDates({ on: new Date().toISOString().slice(0, 10), asOf: await dataDate() });
    setTimeout(() => window.print(), 100);
  };

  return (
    <main className="mx-auto max-w-4xl px-4 pb-24 pt-8">
      <div className="no-print">
        <h1 className="mono text-title font-bold tracking-wide" style={{ color: "var(--safe)" }}>Preparedness pack</h1>
        <p className="mt-3 max-w-2xl text-read leading-relaxed text-dim">
          Everything to keep on paper, in one printout. In the print dialog choose <strong>Save as PDF</strong> as the printer. It is made in your browser, works offline once
          the site is saved, and nothing is sent anywhere. Your ticks are not included; for a list with ticks use the checklist on the{" "}
          <Link href="/survive?tab=bag" className="text-accent hover:underline">Survive page</Link>.
        </p>
        <ul className="mt-3 list-disc pl-5 text-read text-dim">
          {CONTENTS.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <button type="button" onClick={savePdf} className="btn mono mt-4 min-h-11 px-4 text-body font-bold lg:min-h-0 lg:py-1.5">SAVE AS PDF</button>

        <h2 className="label mt-8">Map in the pack: {country ? country.name : "the world"}</h2>
        <p className="mt-1 text-body text-dim">
          {country ? "Your country, from \"my country\". " : "Pick a country on the "}
          {!country && <Link href="/country" className="text-accent hover:underline">country page</Link>}
          {!country && " and choose \"Set as my country\" to put it here."}
        </p>
        <div className="mt-3">
          <MiniMap
            key={country?.iso3 ?? "world"}
            label={`Map of ${country ? country.name : "the world"}`}
            height={320}
            center={country ? [country.lon, country.lat] : [15, 25]}
            zoom={country ? 3.2 : 0.9}
            onReady={(m) => (mapRef.current = m)}
          />
        </div>
      </div>

      <div className="pack-print hidden print:block">
        <h1 className="mono">Preparedness pack</h1>
        <section><PlanSheet /></section>
        <section><ChecklistSheet job={{ kind: "checklist", tier: "both", ticks: false, reasons: false, checked: new Set(), filter: "all" }} /></section>
        <section><WalletCard /></section>
        <section>
          <h2 className="mono">Radiation shelter guidance</h2>
          <ShelterGuidance />
        </section>
        <section>
          <h2 className="mono">{country ? country.name : "World"}</h2>
          {/* eslint-disable-next-line @next/next/no-img-element -- a print snapshot, not a site image */}
          {mapImage && <img src={mapImage} alt={`Map of ${country ? country.name : "the world"}`} className="light-paper pack-map" />}
          <p className="sheet-sub">Basemap © CARTO, © OpenStreetMap contributors.</p>
        </section>
        <p className="print-footer">VigilRadar · vigilradar.pages.dev · printed {dates.on} · data as of {dates.asOf}</p>
      </div>
    </main>
  );
}
