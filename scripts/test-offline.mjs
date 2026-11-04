// Smoke test for offline mode. Serves nothing itself: start the built site first, e.g.
//   npm run build && node scripts/serve-out.mjs 8081
//   node scripts/test-offline.mjs [http://localhost:8081]
// Uses the Edge/Chrome already installed on the machine through playwright-core (no browser download).
import { chromium } from "playwright-core";

const BASE = process.argv[2] ?? "http://localhost:8081";
const log = (ok, msg) => console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`);
let failed = 0;
const check = (ok, msg) => {
  if (!ok) failed++;
  log(ok, msg);
};

const browser = await chromium.launch({ channel: "msedge", headless: true }).catch(() => chromium.launch({ channel: "chrome", headless: true }));
const context = await browser.newContext();
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto(`${BASE}/survive`, { waitUntil: "networkidle" });
await page.evaluate(() => navigator.serviceWorker.ready);
check(true, "service worker registered");

await page.getByRole("button", { name: /save for offline use/i }).click();
await page.getByText(/files saved/i).waitFor({ timeout: 60_000 });
const saved = await page.getByRole("status").innerText();
check(/files saved/i.test(saved), `saved for offline: ${saved.trim()}`);

const cacheCounts = await page.evaluate(async () => {
  const out = {};
  for (const k of await caches.keys()) out[k] = (await (await caches.open(k)).keys()).length;
  return out;
});
console.log("      caches:", JSON.stringify(cacheCounts));

// ---- go offline and reload
await context.setOffline(true);
const EXPECT = {
  "/survive": "What can you do",
  "/scenarios/supervolcano": "Supervolcanic eruption",
  "/scenarios/pandemic-x": "Pandemic X",
  "/trajectory": "Trajectory",
  "/methodology": "Methodology",
};
for (const [path, heading] of Object.entries(EXPECT)) {
  try {
    await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 20_000 });
    const h1 = await page.locator("h1").first().innerText({ timeout: 8000 });
    check(h1.includes(heading), `offline ${path}: shows "${h1.trim()}"`);
  } catch (e) {
    check(false, `offline ${path}: ${String(e).split("\n")[0]}`);
  }
}

// checklist still works offline: tick an item, reload, it stays ticked
await page.goto(`${BASE}/survive?tab=bag`, { waitUntil: "domcontentloaded" });
const box = page.getByRole("checkbox").first();
await box.check();
const stored = await page.evaluate(() => window.localStorage.getItem("monitoring.bag.v1"));
check(!!stored && stored.includes("water-3d"), `offline: tick saved to localStorage (${stored})`);
await page.reload({ waitUntil: "domcontentloaded" });
// the saved ticks are applied in an effect after hydration, so wait for them instead of reading at once
const persisted = await page
  .waitForFunction(() => document.querySelector('input[type="checkbox"]')?.checked === true, null, { timeout: 5000 })
  .then(() => true, () => false);
check(persisted, "offline: checklist tick persists across reload");

// full-text search works on a saved page with the network off
await page.goto(`${BASE}/methodology`, { waitUntil: "domcontentloaded" });
await page.locator("#wiki-filter:visible").fill("potassium iodide");
await page.getByRole("option").first().waitFor({ timeout: 5000 }).catch(() => {});
const found = (await page.getByRole("option").allInnerTexts()).join(" ; ");
check(found.length > 0, `offline: search finds "potassium iodide" (${found.replace(/\s+/g, " ").slice(0, 60)})`);

// metrics from the cached world_state
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await page.getByText(/Doomsday Clock/i).first().waitFor({ timeout: 15_000 }).then(
  () => check(true, "offline: map page shows cached metrics"),
  () => check(false, "offline: map page shows cached metrics"),
);

await browser.close();
if (errors.length) console.log("page errors:", errors.slice(0, 3));
process.exit(failed ? 1 : 0);
