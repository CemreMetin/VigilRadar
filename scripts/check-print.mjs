// Prints pages to PDF with the browser's own print engine and reports page counts and anything that leaks onto paper.
// Run on a served build (node scripts/serve-out.mjs 8081):  node scripts/check-print.mjs [http://localhost:8081]
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:8081";
mkdirSync("out-print", { recursive: true });
let failed = 0;
const check = (ok, msg) => {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`);
};
const pdfPages = (buf) => (buf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;

const browser = await chromium.launch({ channel: "msedge", headless: true }).catch(() => chromium.launch({ channel: "chrome", headless: true }));
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.addInitScript(() => { window.print = () => { window.__printed = (window.__printed ?? 0) + 1; }; }); // the buttons call print(); we render the PDF ourselves
const page = await ctx.newPage();

/** open a page, click a button, wait for the print-only container, then render the PDF */
async function printText(name, path, button, after) {
  await page.goto(BASE + path, { waitUntil: "load" });
  await page.waitForTimeout(800);
  if (after) await after(page);
  await page.getByRole("button", { name: button }).first().click();
  await page.waitForFunction(() => window.__printed > 0, null, { timeout: 5000 }).catch(() => {});
  await page.emulateMedia({ media: "print" });
  await page.waitForTimeout(300);
  const leaks = await page.evaluate(() => {
    const vis = (el) => { const r = el.getBoundingClientRect(); const st = getComputedStyle(el); return st.display !== "none" && st.visibility !== "hidden" && r.width > 0 && r.height > 0; };
    return {
      bg: getComputedStyle(document.body).backgroundColor,
      rail: [...document.querySelectorAll("aside, nav, button")].filter(vis).length,
      mapCanvas: [...document.querySelectorAll("canvas.maplibregl-canvas")].filter(vis).length,
      mode: document.documentElement.dataset.print,
    };
  });
  const buf = await page.pdf({ preferCSSPageSize: true, printBackground: false });
  writeFileSync(`out-print/${name}.pdf`, buf);
  await page.emulateMedia({ media: "screen" });
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  const n = pdfPages(buf);
  check(leaks.rail === 0 && /255, 255, 255|rgba\(0, 0, 0, 0\)/.test(leaks.bg), `${name}: ${n} pages, background ${leaks.bg}, chrome elements ${leaks.rail}, mode ${leaks.mode}`);
  return n;
}

await printText("methodology-all", "/methodology", /Print whole page/);
await printText("methodology-section", "/methodology", /Print this section/);
await printText("scenarios-all", "/scenarios", /Print whole page/);
await printText("nuclear-all", "/nuclear", /Print whole page/);

await browser.close();
process.exit(failed ? 1 : 0);
