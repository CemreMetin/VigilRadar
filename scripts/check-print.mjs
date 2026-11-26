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
await printText("scenarios-all", "/library", /Print whole page/);
await printText("nuclear-all", "/nuclear", /Print whole page/);

/** map printing: click "Print map", render the sheet to PDF and screenshot it, check the image is not blank */
async function printMapPage(name, path) {
  await page.goto(BASE + path, { waitUntil: "load" });
  await page.waitForTimeout(6000); // basemap tiles
  await page.emulateMedia({ media: "screen" });
  await page.getByRole("button", { name: /PRINT MAP/i }).first().click();
  await page.waitForSelector(".map-print img", { state: "attached", timeout: 15000 });
  await page.waitForFunction(() => window.__printed > 0, null, { timeout: 5000 }).catch(() => {});
  await page.emulateMedia({ media: "print" });
  const info = await page.evaluate(async () => {
    const img = document.querySelector(".map-print img");
    const c = document.createElement("canvas");
    c.width = 64; c.height = 64;
    const g = c.getContext("2d");
    g.drawImage(img, 0, 0, 64, 64);
    const d = g.getImageData(0, 0, 64, 64).data;
    const colours = new Set();
    for (let i = 0; i < d.length; i += 4) colours.add(`${d[i] >> 4},${d[i + 1] >> 4},${d[i + 2] >> 4}`);
    return {
      colours: colours.size,
      w: img.naturalWidth,
      h: img.naturalHeight,
      legend: [...document.querySelectorAll(".map-legend li")].length,
      sheet: document.querySelector(".map-print").innerText.slice(0, 160).replace(/\s+/g, " "),
      visibleOther: [...document.body.children].filter((e) => !e.classList.contains("map-print") && getComputedStyle(e).display !== "none").length,
      filter: getComputedStyle(img).filter,
    };
  });
  await page.setViewportSize({ width: 1123, height: 794 }); // A4 landscape at 96 dpi, for the screenshot only
  await page.screenshot({ path: `out-print/${name}.png` });
  const buf = await page.pdf({ preferCSSPageSize: true });
  writeFileSync(`out-print/${name}.pdf`, buf);
  await page.emulateMedia({ media: "screen" });
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  const n = pdfPages(buf);
  check(info.colours > 8 && info.visibleOther === 0 && n === 1, `${name}: ${n} page(s), image ${info.w}x${info.h} with ${info.colours} colour bins, legend lines ${info.legend}, other page content ${info.visibleOther}, filter ${info.filter}`);
  console.log("      " + info.sheet);
}
await printMapPage("minimap-solar", "/library/solar-superstorm?tab=explorer");

/** Survive sheets: set options, click, screenshot the sheet (A4 portrait), then render the PDF */
async function printSheet(name, { tab = "bag", setup, button, expectPages }) {
  await page.goto(BASE + `/survive?tab=${tab}`, { waitUntil: "load" });
  await page.waitForTimeout(800);
  if (setup) await setup(page);
  await page.getByRole("button", { name: button }).first().click();
  await page.waitForSelector(".print-sheet", { state: "attached", timeout: 5000 });
  await page.waitForFunction(() => window.__printed > 0, null, { timeout: 5000 }).catch(() => {});
  await page.emulateMedia({ media: "print" });
  await page.setViewportSize({ width: 794, height: 1123 });
  const info = await page.evaluate(() => ({
    other: [...document.body.children].filter((e) => !e.classList.contains("print-sheet") && getComputedStyle(e).display !== "none").length,
    ticks: [...document.querySelectorAll(".print-sheet .box")].filter((b) => b.textContent.trim()).length,
    items: document.querySelectorAll(".print-sheet .box").length,
    grey: document.querySelectorAll(".print-sheet li.less").length,
    why: document.querySelectorAll(".print-sheet .why").length,
    card: (() => { const w = document.querySelector(".wallet")?.getBoundingClientRect(); return w ? `${(w.width / 96 * 25.4).toFixed(0)}x${(w.height / 96 * 25.4).toFixed(0)} mm` : ""; })(),
  }));
  await page.screenshot({ path: `out-print/${name}.png` });
  const buf = await page.pdf({ preferCSSPageSize: true });
  writeFileSync(`out-print/${name}.pdf`, buf);
  await page.emulateMedia({ media: "screen" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  const n = pdfPages(buf);
  check(info.other === 0 && (!expectPages || n === expectPages), `${name}: ${n} page(s)${expectPages ? ` (expected ${expectPages})` : ""}, items ${info.items}, ticked ${info.ticks}, grey ${info.grey}, reasons ${info.why}, other content ${info.other}${info.card ? `, card ${info.card}` : ""}`);
}
const form = (page) => page.getByRole("form", { name: "Print the checklist" });
const pick = (label) => async (page) => { await form(page).getByLabel(label, { exact: true }).check(); };
await printSheet("survive-grab-blank", { button: /PRINT CHECKLIST/, setup: pick("Grab-and-go"), expectPages: 1 });
await printSheet("survive-stay-blank", { button: /PRINT CHECKLIST/, setup: pick("Staying put") });
await printSheet("survive-both-blank", { button: /PRINT CHECKLIST/, setup: pick("Both") });
await printSheet("survive-grab-reasons", { button: /PRINT CHECKLIST/, setup: async (p) => { await pick("Grab-and-go")(p); await form(p).getByLabel("Include reasons").check(); } });
await printSheet("survive-both-ticks", {
  button: /PRINT CHECKLIST/,
  setup: async (p) => {
    await p.evaluate(() => localStorage.setItem("monitoring.bag.v1", JSON.stringify(["water-3d", "food-3d", "radio", "flashlight", "meds"])));
    await p.reload({ waitUntil: "load" });
    await p.waitForTimeout(600);
    await pick("Both")(p);
    await form(p).getByLabel("Include my ticks").check();
    await p.getByRole("button", { name: "Nuclear" }).first().click().catch(() => {});
  },
});
await printSheet("survive-plan-section", { tab: "plan", button: /Print this section/ }).catch(() => {});
await printSheet("survive-plan-fill-in", { tab: "plan", button: /PRINT FILL-IN PLAN/, expectPages: 1 });
await printSheet("survive-wallet-card", { tab: "comms", button: /PRINT WALLET CARD/, expectPages: 1 });

// preparedness pack: Save as PDF prints plan, checklist, wallet card, shelter guidance and a map, one part per page
await page.goto(BASE + "/survive/pack", { waitUntil: "load" });
await page.waitForTimeout(5000);
await page.getByRole("button", { name: /SAVE AS PDF/ }).click();
await page.waitForFunction(() => window.__printed > 0, null, { timeout: 8000 }).catch(() => {});
await page.emulateMedia({ media: "print" });
const packInfo = await page.evaluate(() => ({ img: !!document.querySelector(".pack-map")?.naturalWidth, other: [...document.querySelectorAll("nav, aside, button")].filter((e) => e.offsetParent).length }));
const packBuf = await page.pdf({ preferCSSPageSize: true });
writeFileSync("out-print/survive-pack.pdf", packBuf);
check(packInfo.img && packInfo.other === 0, `survive-pack: ${pdfPages(packBuf)} pages, map image ${packInfo.img}, chrome ${packInfo.other}`);
await page.emulateMedia({ media: "screen" });

await browser.close();
process.exit(failed ? 1 : 0);
