// Browser checks for /alert on a served build:  node scripts/serve-out.mjs 8098  then  node scripts/check-alert.mjs [http://localhost:8098]
// Phone size (390x844): peace mode, the offline start, the drill, the flashlight, the whistle, an event id that the data does not hold.
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:8098";
mkdirSync("docs/shots", { recursive: true });
let failed = 0;
const check = (ok, msg) => { if (!ok) failed++; console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); };

const browser = await chromium.launch({ channel: "msedge", headless: true }).catch(() => chromium.launch({ channel: "chrome", headless: true }));
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: "allow", locale: "tr-TR" });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const external = new Set();
page.on("request", (r) => { const u = new URL(r.url()); if (u.origin !== new URL(BASE).origin && !/^(data|blob):/.test(r.url())) external.add(u.origin); });

// ---- peace mode, online ----
await page.goto(`${BASE}/alert`, { waitUntil: "load" });
await page.waitForSelector("h1");
check((await page.locator("h1").innerText()) === "VigilAlert", "peace mode opens");
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
check(!overflow, "no horizontal overflow at 390 px");
await page.screenshot({ path: "docs/shots/alert-peace-390.png", fullPage: false });

// the service worker must have saved /alert
await page.waitForFunction(async () => { const ks = await caches.keys(); for (const k of ks) { if (await (await caches.open(k)).match("/alert")) return true; } return false; }, null, { timeout: 20000 }).then(() => check(true, "service worker saved /alert"), () => check(false, "service worker saved /alert"));
await page.waitForTimeout(1500); // the assets of the page are saved right after it

// a bag tick, the radio frequency and the plan stay in localStorage
await page.getByRole("checkbox", { name: /içme suyu/ }).check();
await page.getByRole("textbox", { name: "Yerel radyo frekansım" }).fill("TRT FM 99,5");
await page.getByRole("textbox", { name: /Buluşma noktası 1/ }).fill("Cumhuriyet Parkı");
const counter = await page.locator("[aria-live=polite]").first().innerText();
check(/^1\/22$/.test(counter.trim()), `bag counter ${counter.trim()}`);

// ---- offline ----
await ctx.setOffline(true);
await page.reload({ waitUntil: "load" }).catch(() => {});
const offlineH1 = await page.locator("h1").first().innerText({ timeout: 8000 }).catch(() => "");
check(offlineH1 === "VigilAlert", "offline: /alert opens");
check(await page.getByRole("checkbox", { name: /içme suyu/ }).isChecked(), "offline: the bag tick is still there");
check((await page.locator("[aria-live=polite]").first().innerText()).trim() === "1/22", "offline: the counter works");
const offlineRadio = await page.getByRole("textbox", { name: "Yerel radyo frekansım" }).inputValue();
check(offlineRadio === "TRT FM 99,5", "offline: the saved radio frequency is there");

// ---- drill (offline too) ----
await page.getByRole("button", { name: "Kriz ekranını dene" }).click();
await page.waitForSelector("main[aria-label=DEPREM]", { timeout: 5000 });
const crisisText = await page.locator("main[aria-label=DEPREM]").innerText();
check(/TATBİKAT/.test(crisisText), "drill: labelled TATBİKAT");
check(/M7\.2 DEPREM — MERKEZİNE \d+ KM/.test(crisisText), `drill: title ${crisisText.split("\n").find((l) => /DEPREM —/.test(l))}`);
check(/Kendini ve yanındakileri kontrol et/.test(crisisText) && /112/.test(crisisText), "drill: the first-10-minutes list and 112");
check(/TRT FM 99,5/.test(crisisText) && /Cumhuriyet Parkı/.test(crisisText), "drill: saved radio frequency and meeting point shown");
check(await page.evaluate(() => getComputedStyle(document.querySelector("main[aria-label=DEPREM]")).backgroundColor) === "rgb(0, 0, 0)", "crisis background is pure black");
await page.screenshot({ path: "docs/shots/alert-crisis-390.png" });
await page.evaluate(() => document.querySelector("main[aria-label=DEPREM]").scrollTo(0, 9999));
await page.screenshot({ path: "docs/shots/alert-crisis-tools-390.png" });

// flashlight: white full screen, closes on tap
await page.getByRole("button", { name: "EKRANI FENER YAP" }).click();
const white = await page.evaluate(() => { const el = document.querySelector("[aria-label='Kapatmak için dokun']"); return el ? getComputedStyle(el).backgroundColor : ""; });
check(white === "rgb(255, 255, 255)", "flashlight is a white full-screen layer");
await page.locator("[aria-label='Kapatmak için dokun']").click();
check((await page.locator("[aria-label='Kapatmak için dokun']").count()) === 0, "flashlight closes on tap");

// whistle: starts a 3200 Hz oscillator and stops on the second tap
await page.addInitScript(() => {});
const started = await page.evaluate(() => { window.__osc = []; const O = window.AudioContext; const proto = O.prototype; const orig = proto.createOscillator; proto.createOscillator = function () { const o = orig.call(this); window.__osc.push(o); return o; }; });
void started;
await page.getByRole("button", { name: "ACİL DÜDÜK" }).click();
await page.waitForTimeout(400);
const whistle = await page.evaluate(() => ({ n: window.__osc.length, f: window.__osc[0]?.frequency.value, type: window.__osc[0]?.type }));
check(whistle.n === 1 && whistle.f === 3200 && whistle.type === "square", `whistle: ${whistle.n} oscillator, ${whistle.f} Hz ${whistle.type}`);
await page.getByRole("button", { name: "DÜDÜĞÜ DURDUR" }).click();
check((await page.getByRole("button", { name: "ACİL DÜDÜK" }).count()) === 1, "whistle stops on the second tap");

// "I'm OK" message: an sms: link with the text
const sms = await page.getByRole("link", { name: /İYİYİM MESAJI/ }).getAttribute("href");
check(/^sms:\?body=/.test(sms ?? "") && decodeURIComponent(sms ?? "").includes("İyiyim."), "I'm OK message is an sms: link");

await page.getByRole("button", { name: "Normal moda dön" }).click();
check((await page.locator("h1").first().innerText()) === "VigilAlert", "back to normal mode");

// ---- an event id the data does not hold (a notification opened offline) ----
await page.goto(`${BASE}/alert?e=afad%3A999`, { waitUntil: "load" }).catch(() => {});
const unknown = await page.locator("main[aria-label=DEPREM]").innerText({ timeout: 8000 }).catch(() => "");
check(/Kendini ve yanındakileri kontrol et/.test(unknown), "?e=<unknown id> offline: crisis mode with the general list");
await ctx.setOffline(false);

// ---- English ----
await page.goto(`${BASE}/alert`, { waitUntil: "load" });
await page.getByRole("button", { name: "EN", exact: true }).click();
check((await page.getByRole("button", { name: "Try the crisis screen" }).count()) === 1, "English strings");

check(errors.length === 0, `no page errors${errors.length ? ": " + errors[0] : ""}`);
const bad = [...external].filter((o) => !/vigil-daemon|workers\.dev|usgs|seismicportal|openfreemap|basemaps|fonts\.g/.test(o));
check(bad.length === 0, `no unexpected third-party origins${bad.length ? ": " + bad.join(", ") : ""}`);
await browser.close();
process.exit(failed ? 1 : 0);
