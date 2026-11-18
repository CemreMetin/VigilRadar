// Probe for the fast-lane sources (VIGIL.md 4.1): one live request each, the raw answer saved under scripts/probe/samples/.
// Usage: node scripts/probe/fast-sources.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const UA = "VigilRadar/1.0";
const OUT = "scripts/probe/samples";
mkdirSync(OUT, { recursive: true });

const now = Date.now();
const iso = (ms) => new Date(ms).toISOString();
const afadFmt = (ms) => iso(ms).slice(0, 19).replace("T", " ");

async function probe(name, url, init = {}, file = name) {
  try {
    const r = await fetch(url, { ...init, headers: { "User-Agent": UA, ...(init.headers ?? {}) }, signal: AbortSignal.timeout(15_000) });
    const buf = Buffer.from(await r.arrayBuffer());
    const cors = r.headers.get("access-control-allow-origin");
    console.log(`${name}: ${r.status} ${r.headers.get("content-type")} ${buf.length} B cors=${cors}`);
    if (r.ok) writeFileSync(`${OUT}/${file}`, buf);
    return r.ok ? buf : null;
  } catch (e) {
    console.log(`${name}: FAILED ${e.cause?.code ?? e.message}`);
    return null;
  }
}

await probe("usgs", "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson", {}, "usgs.json");
await probe("emsc", `https://www.seismicportal.eu/fdsnws/event/1/query?format=json&minmag=4&limit=200&orderby=time&start=${iso(now - 86_400_000)}`, {}, "emsc.json");
await probe(
  "afad-primary",
  `https://deprem.afad.gov.tr/apiv2/event/filter?start=${encodeURIComponent(afadFmt(now - 86_400_000 * 2))}&end=${encodeURIComponent(afadFmt(now))}&minmag=3.5&orderby=timedesc`,
  {},
  "afad.json",
);
await probe(
  "afad-backup",
  "https://deprem.afad.gov.tr/EventData/GetEventsByFilter",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      EventSearchFilterList: [{ FilterType: 8, Value: iso(now - 86_400_000 * 2) }, { FilterType: 9, Value: iso(now) }],
      Skip: 0, Take: 100, SortDescriptor: { field: "eventDate", dir: "desc" },
    }),
  },
  "afad-backup.json",
);
for (const scheme of ["http", "https"]) await probe(`kandilli-${scheme}`, `${scheme}://www.koeri.boun.edu.tr/scripts/lst0.asp`, {}, `kandilli-${scheme}.html`);
await probe("tsunami-ntwc", "https://www.tsunami.gov/events/xml/PAAQAtom.xml", {}, "tsunami-ntwc.xml");
await probe("tsunami-ptwc", "https://www.tsunami.gov/events/xml/PHEBAtom.xml", {}, "tsunami-ptwc.xml");
