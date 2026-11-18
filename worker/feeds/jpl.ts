import type { AsteroidsFile, Counter, Tone } from "../../lib/types";
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

const HORIZONS = "https://ssd.jpl.nasa.gov/api/horizons.api";
const HORIZONS_MAX = 15; // the closest approaches only: one request each, and these are the ones the plot labels

/** Geocentric right ascension and declination (degrees) of a small body at a UTC time, or null if Horizons cannot say. */
async function horizonsDirection(des: string, date: string): Promise<{ ra: number; dec: number } | null> {
  const t0 = new Date(date.replace(/-([A-Za-z]{3})-/, " $1 ") + " UTC");
  if (Number.isNaN(t0.getTime())) return null;
  const fmt = (d: Date) => d.toISOString().slice(0, 16).replace("T", " ");
  const q = new URLSearchParams({
    format: "json",
    COMMAND: `'DES=${des};'`,
    CENTER: "'500@399'", // the centre of the Earth
    MAKE_EPHEM: "'YES'",
    EPHEM_TYPE: "'OBSERVER'",
    QUANTITIES: "'1'",
    START_TIME: `'${fmt(t0)}'`,
    STOP_TIME: `'${fmt(new Date(t0.getTime() + 60_000))}'`,
    STEP_SIZE: "'1 m'",
    ANG_FORMAT: "'DEG'",
    CSV_FORMAT: "'YES'",
  });
  const json = (await (await fetchOpen(`${HORIZONS}?${q}`, 45_000)).json()) as { result?: string };
  const block = json.result?.split("$$SOE")[1]?.split("$$EOE")[0];
  const cols = block?.trim().split("\n")[0]?.split(",");
  const ra = Number(cols?.[3]);
  const dec = Number(cols?.[4]);
  return Number.isFinite(ra) && Number.isFinite(dec) && cols?.[3]?.trim() ? { ra, dec } : null;
}

export async function asteroidFeed(): Promise<{ counters: Counter[]; file: AsteroidsFile }> {
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
  let sentry: AsteroidsFile["sentry"] = null;
  try {
    const s = (await (await fetchOpen("https://ssd-api.jpl.nasa.gov/sentry.api")).json()) as {
      data: { ts_max: string; ps_max: string; fullname: string; diameter?: string }[];
    };
    const torino = s.data.filter((d) => Number(d.ts_max) > 0).length;
    sentry = { tracked: s.data.length, torinoAbove0: torino };
    sentryNote = ` NASA's Sentry system tracks ${s.data.length.toLocaleString("en-US")} objects with a non-zero computed chance of impact within about a century; ${torino} of them rate 1 or higher on the Torino scale (0 = no hazard, 10 = certain global catastrophe).`;
  } catch {
    sentryNote = "";
  }

  const within1 = rows.filter((r) => r.ld <= 1).length;
  const nearest = rows[0];
  const tone: Tone = within1 > 0 ? "elevated" : "normal";
  const counters: Counter[] = [
    {
      id: "asteroids",
      label: "Asteroid close approaches",
      domain: "space",
      value: String(rows.length),
      numeric: rows.length,
      unit: "within 20 Moon-distances, next 60 days",
      tone,
      basis: "Elevated when a known object passes within one Moon-distance. No known object is rated a hazard, so it is never critical.",
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
      href: "/library/asteroid",
    },
  ];
  // Directions from Horizons for the closest few; any that fail keep today's data (no direction, drawn by date)
  const dir = new Map<string, { ra: number; dec: number }>();
  const todo = rows.slice(0, HORIZONS_MAX);
  for (let i = 0; i < todo.length; i += 3) {
    await Promise.all(
      todo.slice(i, i + 3).map(async (r) => {
        try {
          const d = await horizonsDirection(r.des, r.date);
          if (d) dir.set(r.des + r.date, d);
        } catch {
          /* leave this one without a direction */
        }
      }),
    );
  }
  const file: AsteroidsFile = {
    generatedAt: new Date().toISOString(),
    windowDays: 60,
    maxLd: 0.05 / AU_PER_LD,
    approaches: rows.map((r) => {
      const dia = r.h != null ? diameterRange(r.h) : null;
      const d = dir.get(r.des + r.date);
      return { des: r.des, date: r.date, ld: Math.round(r.ld * 100) / 100, kms: r.v, h: r.h, dMinM: dia ? Math.round(dia[0]) : null, dMaxM: dia ? Math.round(dia[1]) : null, ...(d ? { raDeg: Math.round(d.ra * 1000) / 1000, decDeg: Math.round(d.dec * 1000) / 1000 } : {}) };
    }),
    sentry,
    source: { name: "NASA/JPL Center for Near-Earth Object Studies; directions from JPL Horizons", url: "https://cneos.jpl.nasa.gov/ca/", license: "Public domain (NASA)" },
  };
  return { counters, file };
}
