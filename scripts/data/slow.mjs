// Slow lane (VIGIL.md 4.2): GDELT conflict reports + IMF PortWatch chokepoint flow -> POST /v1/ingest/slow.
// Run with tsx, because it imports core/ (TypeScript):  npx tsx scripts/data/slow.mjs [--dry] [--fresh]
// Needs WORKER_URL and INGEST_TOKEN in the environment; without them (or with --dry) it only prints what it would send.
// Also writes public/data/static/chokepoints.json (the resolved PortWatch ids and coordinates).
import { mkdirSync, writeFileSync } from "node:fs";
import { unzipSync, strFromU8 } from "fflate";
import { clusterConflicts, expireClusters } from "../../core/conflict";
import { CHOKEPOINT_KEYS, chokepointFlow, gdeltUrls, latestGdeltStamp, parseGdeltTsv, resolveChokepoints, toDaily, unavailableChokepoint } from "../../core/slow";

const DRY = process.argv.includes("--dry");
const FRESH = process.argv.includes("--fresh"); // ignore what the Worker holds, e.g. after the actor rule changed
const { WORKER_URL, INGEST_TOKEN } = process.env;
const UA = { "User-Agent": "VigilRadar/1.0" };
const PW = "https://services9.arcgis.com/weJ1QsnbMYJlCHdG/arcgis/rest/services";
const now = Date.now();

async function getJson(url) {
  const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30_000) });
  if (!r.ok) throw new Error(`${r.status} ${url.slice(0, 80)}`);
  return r.json();
}

/** What the Worker holds now: its clusters expire 48 h after their last report, and a failed source keeps its old data. */
async function previous() {
  if (!WORKER_URL || FRESH) return null;
  try { return (await getJson(`${WORKER_URL.replace(/\/$/, "")}/v1/state`)).slow ?? null; } catch { return null; }
}

async function gdelt(prev) {
  const last = await fetch("https://data.gdeltproject.org/gdeltv2/lastupdate.txt", { headers: UA, signal: AbortSignal.timeout(30_000) }).then((r) => r.text());
  const stamp = latestGdeltStamp(last);
  if (!stamp) throw new Error("GDELT lastupdate.txt has no export file");
  const urls = gdeltUrls(stamp);
  const rows = [];
  let got = 0, checked = false;
  for (let i = 0; i < urls.length; i += 8) {
    const files = await Promise.all(urls.slice(i, i + 8).map(async (u) => {
      try {
        const r = await fetch(u, { headers: UA, signal: AbortSignal.timeout(60_000) });
        if (!r.ok) return null; // a missing file is skipped
        const zip = unzipSync(new Uint8Array(await r.arrayBuffer()));
        return strFromU8(Object.values(zip)[0]);
      } catch { return null; }
    }));
    for (const text of files) {
      if (text === null) continue;
      rows.push(...parseGdeltTsv(text, !checked)); // the layout is checked on the first file; a mismatch throws
      checked = true;
      got++;
    }
  }
  if (!got) throw new Error("no GDELT file could be downloaded");
  const clusters = expireClusters(prev?.conflicts ?? [], clusterConflicts(rows, now), now);
  console.log(`GDELT: ${got}/${urls.length} files, ${rows.length} candidate rows, ${clusters.length} clusters`);
  return clusters;
}

async function portwatch() {
  const list = await getJson(`${PW}/PortWatch_chokepoints_database/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=json`);
  const sites = resolveChokepoints(list.features ?? []);
  const out = [];
  for (const key of CHOKEPOINT_KEYS) {
    const site = sites.find((s) => s.key === key);
    if (!site) { console.log(`PortWatch: ${key} not found -> available:false`); out.push(unavailableChokepoint(key)); continue; }
    const where = encodeURIComponent(`portid='${site.id}'`);
    const j = await getJson(`${PW}/Daily_Chokepoints_Data/FeatureServer/0/query?where=${where}&outFields=date,n_total&orderByFields=date%20DESC&resultRecordCount=120&f=json`);
    const flow = chokepointFlow(site, toDaily(j.features ?? []), now);
    console.log(`PortWatch: ${site.name} (${site.id}) ${flow.available ? `${flow.level} dev=${flow.dev?.toFixed(2)} through ${flow.dataThrough}` : "no data"}`);
    out.push(flow);
  }
  mkdirSync("public/data/static", { recursive: true });
  writeFileSync("public/data/static/chokepoints.json", JSON.stringify({ source: { name: "IMF PortWatch", url: "https://portwatch.imf.org/", credit: "Sources: UN Global Platform; IMF PortWatch (portwatch.imf.org)" }, chokepoints: sites.map(({ key, id, name, lat, lon }) => ({ key, id, name, lat, lon })), missing: CHOKEPOINT_KEYS.filter((k) => !sites.some((s) => s.key === k)) }, null, 1) + "\n");
  return out;
}

const prev = await previous();
const [g, p] = await Promise.allSettled([gdelt(prev), portwatch()]);
if (g.status === "rejected") console.error(`GDELT failed: ${g.reason?.message ?? g.reason}`);
if (p.status === "rejected") console.error(`PortWatch failed: ${p.reason?.message ?? p.reason}`);
if (g.status === "rejected" && p.status === "rejected") process.exit(1);

// a failed source keeps what the Worker already has, with its old timestamp, so the site shows it as old rather than fresh
const body = {
  conflicts: g.status === "fulfilled" ? g.value : prev?.conflicts ?? [],
  conflictsMs: g.status === "fulfilled" ? now : prev?.conflictsMs ?? null,
  chokepoints: p.status === "fulfilled" ? p.value : prev?.chokepoints ?? [],
};
const text = JSON.stringify(body);
console.log(`payload ${(text.length / 1024).toFixed(1)} KB`);

if (DRY || !WORKER_URL || !INGEST_TOKEN) { console.log("not posting (--dry, or WORKER_URL / INGEST_TOKEN missing)"); process.exit(0); }
const res = await fetch(`${WORKER_URL.replace(/\/$/, "")}/v1/ingest/slow`, { method: "POST", headers: { Authorization: `Bearer ${INGEST_TOKEN}`, "Content-Type": "application/json" }, body: text });
console.log(`POST /v1/ingest/slow -> ${res.status} ${await res.text()}`);
if (!res.ok) process.exit(1);
