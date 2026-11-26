// Run: npm run test:alerts
import assert from "node:assert/strict";
import { kpAlerts, quakeAlerts, tsunamiAlerts } from "./rules";
import { formatMessage } from "./telegram";
import { parseBulletins } from "./sources";

const now = Date.parse("2026-10-11T12:00:00Z");
const q = (over: object) => ({ id: "x", mag: 5, place: "Somewhere", lat: 1, lon: 2, time: now - 60_000, url: "https://u", tsunami: 0, type: "earthquake", ...over });

// quakes: M7.0 is critical, 6.9 is not, 6.5 with the tsunami flag is a notice, old events are ignored
assert.equal(quakeAlerts([q({ mag: 7.0 })], now)[0].level, "critical");
assert.equal(quakeAlerts([q({ mag: 6.9 })], now).length, 0);
assert.equal(quakeAlerts([q({ mag: 6.5, tsunami: 1 })], now)[0].level, "notice");
assert.equal(quakeAlerts([q({ mag: 7.4, time: now - 25 * 3_600_000 })], now).length, 0);
assert.equal(quakeAlerts([q({ mag: 7.4, type: "explosion" })], now).length, 0);
assert.equal(quakeAlerts([q({ mag: 7.4 })], now)[0].entityId, "usgs:x");

// Kp: 8 critical, 7 notice, below that nothing, stale values ignored
assert.equal(kpAlerts([{ time: now - 3_600_000, kp: 8 }], now)[0].level, "critical");
assert.equal(kpAlerts([{ time: now - 3_600_000, kp: 7 }], now)[0].level, "notice");
assert.equal(kpAlerts([{ time: now - 3_600_000, kp: 6.67 }], now).length, 0);
assert.equal(kpAlerts([{ time: now - 7 * 3_600_000, kp: 9 }], now).length, 0);

// tsunami bulletins parsed from the NWS Atom feed
const xml = `<feed><author><name>NWS PACIFIC TSUNAMI WARNING CENTER</name></author><entry><title>PANAMA</title><updated>2026-10-11T11:00:00Z</updated>
<geo:lat>7.782</geo:lat><geo:long>-81.378</geo:long><summary type="xhtml"><div><strong>Category:</strong> Warning<br/><strong>Bulletin Issue Time: </strong> 2026.10.11 11:00:00 UTC <br/><strong>Preliminary Magnitude: </strong>7.4(Mwp)<br/><strong>Affected Region: </strong>PANAMA<br/></div></summary></entry></feed>`;
const parsed = parseBulletins(xml, "PHEB");
assert.equal(parsed.length, 1);
assert.equal(parsed[0].category, "Warning");
assert.equal(parsed[0].issued, Date.parse("2026-10-11T11:00:00Z"));
const t = tsunamiAlerts(parsed, now);
assert.equal(t[0].level, "critical");
assert.equal(tsunamiAlerts([{ ...parsed[0], category: "Information" }], now).length, 0);
assert.equal(tsunamiAlerts([{ ...parsed[0], category: "Watch" }], now)[0].level, "notice");

// the Telegram message carries type, severity, coordinates and a link to the event on the map; markup is escaped
const msg = formatMessage({ ...quakeAlerts([q({ mag: 7.2, place: "5 km <N> of A&B" })], now)[0] }, "https://site.example");
assert.match(msg, /CRITICAL/);
assert.match(msg, /Event type: quake/);
assert.match(msg, /Coordinates: 1\.000, 2\.000/);
assert.match(msg, /https:\/\/site\.example\/\?q=usgs%3Ax/);
assert.ok(msg.includes("5 km &lt;N&gt; of A&amp;B"));

// a quote cannot break out of href, and a non-http(s) source link is not made clickable
const hostile = { ...quakeAlerts([q({ mag: 7.2 })], now)[0], sourceName: "USGS", sourceUrl: 'https://x.example/"onclick="1' };
assert.ok(formatMessage(hostile, "https://site.example").includes('href="https://x.example/&quot;onclick=&quot;1"'));
const scripted = formatMessage({ ...hostile, sourceUrl: "javascript:alert(1)" }, "https://site.example");
assert.ok(!scripted.includes("javascript:") && scripted.includes("Source: USGS"));

console.log("alert rules: all checks passed");
