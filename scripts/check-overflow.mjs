// Finds pages that scroll sideways on a 390 px phone. Serve the built site first (see README), then:
//   node scripts/check-overflow.mjs [http://localhost:8081]
import { chromium } from "playwright-core";
import { readdirSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:8081";
const scenarios = readdirSync("out/library", { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => `/library/${d.name}`);
const paths = ["/", "/library", "/survive", "/trajectory", "/nuclear", "/health", "/supervolcanoes", "/country?c=TUR", "/country?c=USA", "/links", "/methodology", "/sources", ...scenarios];

const browser = await chromium.launch({ channel: "msedge", headless: true }).catch(() => chromium.launch({ channel: "chrome", headless: true }));
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })).newPage();
let bad = 0;
for (const p of paths) {
  await page.goto(BASE + p, { waitUntil: "load" });
  await page.waitForTimeout(p === "/" ? 1500 : 900);
  const r = await page.evaluate(() => {
    const vw = window.innerWidth;
    const wide = [...document.querySelectorAll("body *")]
      .filter((e) => e.getBoundingClientRect().right > vw + 1 && !e.closest("[class*=overflow-x-auto]") && !e.closest("svg") && getComputedStyle(e).position !== "fixed")
      .slice(0, 3)
      .map((e) => `${e.tagName.toLowerCase()}.${String(e.className).slice(0, 40)}`);
    return { sw: document.documentElement.scrollWidth, vw, wide };
  });
  const ok = r.sw <= r.vw + 1;
  if (!ok) bad++;
  console.log(`${ok ? "ok  " : "WIDE"} ${p}${ok ? "" : `  scrollWidth ${r.sw} > ${r.vw}  ${r.wide.join(" | ")}`}`);
}
// the search results panel inside the phone menu
await page.goto(BASE + "/methodology", { waitUntil: "load" });
await page.getByRole("button", { name: /^MENU/ }).click();
await page.locator("#wiki-filter:visible").fill("potassium");
await page.getByRole("option").first().waitFor();
const sw = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
if (sw[0] > sw[1] + 1) bad++;
console.log(`${sw[0] <= sw[1] + 1 ? "ok  " : "WIDE"} search results at 390 px (scrollWidth ${sw[0]}, viewport ${sw[1]})`);
await browser.close();
process.exit(bad ? 1 : 0);
