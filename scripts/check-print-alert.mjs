// Prints the /alert sheets to PDF with the browser's print engine (VIGIL.md Faz 7): page counts and the 85x55 mm wallet card.
// Run on a served build (node scripts/serve-out.mjs 8098):  node scripts/check-print-alert.mjs [http://localhost:8098]
// scripts/check-print.mjs covers the older pages; this one covers /alert.
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:8098";
mkdirSync("out-print", { recursive: true });
let failed = 0;
const check = (ok, msg) => { if (!ok) failed++; console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); };
const pdfPages = (buf) => (buf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;

const browser = await chromium.launch({ channel: "msedge", headless: true }).catch(() => chromium.launch({ channel: "chrome", headless: true }));
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.addInitScript(() => { window.print = () => { window.__printed = (window.__printed ?? 0) + 1; }; });
const page = await ctx.newPage();

async function printAlert(name, button, { fill = false, expectPages, expectCards }) {
  await page.goto(BASE + "/alert", { waitUntil: "load" });
  await page.evaluate((f) => {
    localStorage.clear();
    localStorage.setItem("vigil.lang", JSON.stringify("tr").replace(/"/g, ""));
    if (f) {
      localStorage.setItem("vigil.bag", JSON.stringify(["water", "food", "radio"]));
      localStorage.setItem("vigil.radio", JSON.stringify("TRT FM 99,5"));
      localStorage.setItem("vigil.plan", JSON.stringify({ meet1: "Cumhuriyet Parkı", meet2: "Stadyum", contact: "Ayşe 0555 000 00 00", who: "Ali okuldan alınacak", where: "Vana balkonda", name: "Deniz Kaya", rel1: "0555 111 11 11", rel2: "0555 222 22 22", blood: "0 Rh+", meds: "", allergy: "" }));
    }
  }, fill);
  await page.reload({ waitUntil: "load" });
  await page.waitForTimeout(800);
  await page.setViewportSize({ width: 794, height: 1123 });
  await page.getByRole("button", { name: button }).click();
  await page.waitForSelector(".print-sheet", { state: "attached", timeout: 5000 });
  await page.waitForFunction(() => window.__printed > 0, null, { timeout: 5000 }).catch(() => {});
  await page.emulateMedia({ media: "print" });
  const info = await page.evaluate(() => ({
    other: [...document.body.children].filter((e) => !e.classList.contains("print-sheet") && getComputedStyle(e).display !== "none").length,
    boxes: document.querySelectorAll(".print-sheet .box").length,
    ticked: [...document.querySelectorAll(".print-sheet .box")].filter((b) => b.textContent.trim()).length,
    cards: [...document.querySelectorAll(".wallet")].map((w) => { const r = w.getBoundingClientRect(); return `${(r.width / 96 * 25.4).toFixed(0)}x${(r.height / 96 * 25.4).toFixed(0)}`; }),
    text: document.querySelector(".print-sheet").innerText.replace(/\s+/g, " ").slice(0, 160),
  }));
  await page.screenshot({ path: `out-print/${name}.png` });
  const buf = await page.pdf({ preferCSSPageSize: true });
  writeFileSync(`out-print/${name}.pdf`, buf);
  await page.emulateMedia({ media: "screen" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  const n = pdfPages(buf);
  const cardsOk = expectCards === undefined || (info.cards.length === expectCards && info.cards.every((c) => c === "85x55"));
  check(info.other === 0 && n === expectPages && cardsOk, `${name}: ${n} page(s) (expected ${expectPages}), boxes ${info.boxes}, ticked ${info.ticked}, cards [${info.cards.join(", ")}], other content ${info.other}`);
  console.log("      " + info.text);
}
await printAlert("alert-bag", /Çanta listesini yazdır/, { fill: true, expectPages: 1 });
await printAlert("alert-plan-blank", /Aile planını yazdır/, { expectPages: 1 });
await printAlert("alert-plan-filled", /Aile planını yazdır/, { fill: true, expectPages: 1 });
await printAlert("alert-card-blank", /Cüzdan kartını yazdır/, { expectPages: 1, expectCards: 2 });
await printAlert("alert-card-filled", /Cüzdan kartını yazdır/, { fill: true, expectPages: 1, expectCards: 2 });


await browser.close();
process.exit(failed ? 1 : 0);
