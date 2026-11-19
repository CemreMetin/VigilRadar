// Prints the actor columns of GDELT rows near a point, to see why a cluster passes or fails the actor rule.
//   npx tsx scripts/probe/gdelt-actors.mjs <lat> <lon> [radiusDeg=0.4]
import { unzipSync, strFromU8 } from "fflate";
import { gdeltUrls, latestGdeltStamp } from "../../core/slow";

const [lat, lon, rad = "0.4"] = process.argv.slice(2).map(Number);
const last = await fetch("https://data.gdeltproject.org/gdeltv2/lastupdate.txt").then((r) => r.text());
const urls = gdeltUrls(latestGdeltStamp(last), 96);
const seen = new Map();
for (let i = 0; i < urls.length; i += 8) {
  const texts = await Promise.all(urls.slice(i, i + 8).map(async (u) => { try { const r = await fetch(u); return r.ok ? strFromU8(Object.values(unzipSync(new Uint8Array(await r.arrayBuffer())))[0]) : ""; } catch { return ""; } }));
  for (const t of texts) for (const line of t.split("\n")) {
    const c = line.split("\t");
    if (c.length !== 61 || !["19", "20"].includes(c[28]) && c[27] !== "183") continue;
    if (Math.abs(Number(c[56]) - lat) > rad || Math.abs(Number(c[57]) - lon) > rad || !["3", "4"].includes(c[51])) continue;
    seen.set(c[0], c);
  }
}
for (const c of seen.values()) console.log(`root=${c[28]} ev=${c[26]} A1=${c[5]}/${c[7]}/${[c[12], c[13], c[14]].join(",")} A2=${c[15]}/${c[17]}/${[c[22], c[23], c[24]].join(",")} | ${c[52]} | ${c[60].slice(0, 90)}`);
