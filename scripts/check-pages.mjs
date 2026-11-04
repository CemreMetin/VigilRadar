// Every content page follows one template: title, summary, "Last updated", at most four "Key points", sections, and
// "Sources" as the last section. Run on a served build (node scripts/serve-out.mjs 8081):
//   node scripts/check-pages.mjs [http://localhost:8081]
import { chromium } from "playwright-core";
import { readdirSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:8081";
let failed = 0;
const check = (ok, msg) => {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`);
};

const scenarios = readdirSync("out/scenarios", { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith("_")).map((d) => `/scenarios/${d.name}`);
// pages without a Sources section: the scenarios index (cards only) and the Sources page itself
const NO_SOURCES = new Set(["/scenarios", "/sources"]);
const paths = ["/survive", "/scenarios", "/nuclear", "/health", "/supervolcanoes", "/trajectory", "/country", "/links", "/methodology", "/sources", ...scenarios];

const browser = await chromium.launch({ channel: "msedge", headless: true }).catch(() => chromium.launch({ channel: "chrome", headless: true }));
const page = await (await browser.newContext({ viewport: { width: 1440, height: 860 } })).newPage();
for (const p of paths) {
  await page.goto(BASE + p, { waitUntil: "load" });
  await page.waitForTimeout(700);
  const body = await page.evaluate(() => document.body.innerText);
  const points = await page.locator('section[aria-label="Key points"] li').count();
  const nav = await page.locator("nav[aria-label='Wiki']:visible button").allInnerTexts();
  const h1 = await page.locator("h1").count();
  const ok =
    /Last updated: \S+/.test(body) &&
    points >= 1 &&
    points <= 4 &&
    h1 === 1 &&
    (NO_SOURCES.has(p) || nav[nav.length - 1]?.trim() === "Sources");
  check(ok, `${p}: ${points} key points, last section "${nav[nav.length - 1]?.trim()}"${/Last updated/.test(body) ? "" : ", no date"}`);
}
await browser.close();
process.exit(failed ? 1 : 0);
