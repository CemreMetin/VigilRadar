// Time zone check (VIGIL.md 4.1, required): are AFAD and Kandilli timestamps UTC or local (UTC+3)?
// Matches the same quakes against EMSC (UTC) by place and measures the median time difference.
// ~0 h means UTC, ~3 h means local time. Usage: node scripts/probe/timezone.mjs
import { writeFileSync } from "node:fs";

const UA = { "User-Agent": "VigilRadar/1.0" };
const now = Date.now();
const iso = (ms) => new Date(ms).toISOString();
const fmt = (ms) => iso(ms).slice(0, 19).replace("T", " ");
const rad = (d) => (d * Math.PI) / 180;
const km = (a, b) => 12742 * Math.asin(Math.sqrt(Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2));

const emscJson = await (await fetch(`https://www.seismicportal.eu/fdsnws/event/1/query?format=json&minlat=34&maxlat=43&minlon=24&maxlon=46&minmag=2.5&limit=500&orderby=time&start=${iso(now - 3 * 86_400_000)}`, { headers: UA })).json();
const emsc = emscJson.features.map((f) => ({ lat: f.properties.lat, lon: f.properties.lon, ms: Date.parse(f.properties.time) }));

const afadRaw = await (await fetch(`https://deprem.afad.gov.tr/apiv2/event/filter?start=${encodeURIComponent(fmt(now - 3 * 86_400_000))}&end=${encodeURIComponent(fmt(now))}&minmag=2.5&orderby=timedesc`, { headers: UA })).json();
// the raw text has no zone: read it as if it were UTC and compare
const afad = afadRaw.map((e) => ({ lat: +e.latitude, lon: +e.longitude, ms: Date.parse(`${e.date}Z`) }));

const html = new TextDecoder("windows-1254").decode(await (await fetch("http://www.koeri.boun.edu.tr/scripts/lst0.asp", { headers: UA })).arrayBuffer());
const kandilli = html.split("\n").flatMap((l) => {
  const m = l.match(/^(\d{4})\.(\d\d)\.(\d\d) (\d\d):(\d\d):(\d\d)\s+(-?[\d.]+)\s+(-?[\d.]+)/);
  return m ? [{ lat: +m[7], lon: +m[8], ms: Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]) }] : [];
});

function offsetHours(list, name) {
  const diffs = [];
  for (const q of list) {
    // nearest EMSC quake in space within 4 h either way, then the closest time wins
    const c = emsc.filter((e) => km(q, e) <= 30 && Math.abs(q.ms - e.ms) <= 4 * 3_600_000).sort((a, b) => Math.abs(q.ms - a.ms) - Math.abs(q.ms - b.ms))[0];
    if (c) diffs.push((q.ms - c.ms) / 3_600_000);
  }
  diffs.sort((a, b) => a - b);
  const median = diffs[Math.floor(diffs.length / 2)];
  console.log(`${name}: ${list.length} events, ${diffs.length} matched with EMSC, median (source - EMSC) = ${median?.toFixed(3)} h`);
  return { events: list.length, matched: diffs.length, medianHours: median ?? null };
}

const result = { checkedAt: iso(now), afad: offsetHours(afad, "AFAD"), kandilli: offsetHours(kandilli, "Kandilli") };
writeFileSync("scripts/probe/samples/timezone-result.json", JSON.stringify(result, null, 1));
