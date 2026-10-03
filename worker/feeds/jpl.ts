import type { Counter, Tone } from "../../lib/types";
import { fetchOpen } from "../http";

const AU_PER_LD = 0.00256955; // one lunar distance in au

/** Rough diameter range in metres from absolute magnitude H, for albedo 0.25 (small) to 0.05 (large). */
function diameterRange(h: number): [number, number] {
  const d = (p: number) => (1329 / Math.sqrt(p)) * 10 ** (-h / 5) * 1000;
  return [d(0.25), d(0.05)];
}

function fmtM(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
  if (m >= 100) return `${Math.round(m / 10) * 10} m`;
  return `${Math.round(m)} m`;
}

export async function asteroidCounter(): Promise<Counter[]> {
  const from = new Date().toISOString().slice(0, 10);
  const to = new Date(Date.now() + 60 * 86_400_000).toISOString().slice(0, 10);
  const cad = (await (
    await fetchOpen(`https://ssd-api.jpl.nasa.gov/cad.api?dist-max=0.05&date-min=${from}&date-max=${to}&sort=date`)
  ).json()) as { fields: string[]; data: string[][] };
  const idx = (f: string) => cad.fields.indexOf(f);
  const rows = cad.data.map((r) => ({
    des: r[idx("des")],
    date: r[idx("cd")],
    ld: Number(r[idx("dist")]) / AU_PER_LD,
    v: Number(r[idx("v_rel")]),
    h: r[idx("h")] ? Number(r[idx("h")]) : null,
  }));
  rows.sort((a, b) => a.ld - b.ld);

  // Sentry: objects with a non-zero computed impact probability over the next ~100 years
  let sentryNote = "";
  try {
    const s = (await (await fetchOpen("https://ssd-api.jpl.nasa.gov/sentry.api")).json()) as {
      data: { ts_max: string; ps_max: string; fullname: string; diameter?: string }[];
    };
    const torino = s.data.filter((d) => Number(d.ts_max) > 0).length;
    sentryNote = ` NASA's Sentry system tracks ${s.data.length.toLocaleString("en-US")} objects with a non-zero computed chance of impact within about a century; ${torino} of them rate 1 or higher on the Torino scale (0 = no hazard, 10 = certain global catastrophe).`;
  } catch {
    sentryNote = "";
  }

  const within1 = rows.filter((r) => r.ld <= 1).length;
  const nearest = rows[0];
  const tone: Tone = within1 > 0 ? "elevated" : "normal";
  return [
    {
      id: "asteroids",
      label: "Asteroid close approaches",
      domain: "space",
      value: String(rows.length),
      numeric: rows.length,
      unit: "within 20 Moon-distances, next 60 days",
      tone,
      trendLabel: nearest
        ? `Closest: ${nearest.des} at ${nearest.ld.toFixed(1)} LD on ${nearest.date.slice(0, 11)}`
        : "None in the window",
      note: `Known near-Earth objects passing within 0.05 au (about 19.5 lunar distances, LD). Close approaches are routine and almost always involve small objects; the ones listed are known orbits that do not hit Earth. Diameter ranges are rough estimates from brightness, assuming a reflectivity between 0.05 and 0.25.${sentryNote}`,
      asOf: new Date().toISOString(),
      cadence: "daily",
      source: {
        name: "NASA/JPL Center for Near-Earth Object Studies",
        url: "https://cneos.jpl.nasa.gov/ca/",
        license: "Public domain (NASA)",
      },
      rows: rows.slice(0, 6).map((r) => {
        const dia = r.h != null ? diameterRange(r.h) : null;
        return {
          label: `${r.des} · ${r.date.slice(0, 11)}${dia ? ` · ~${fmtM(dia[0])}–${fmtM(dia[1])}` : ""}`,
          value: `${r.ld.toFixed(1)} LD`,
          tone: r.ld <= 1 ? ("elevated" as Tone) : ("normal" as Tone),
        };
      }),
      href: "/scenarios/asteroid",
    },
  ];
}
