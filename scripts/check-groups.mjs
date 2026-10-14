// Checks the grouped scenario tabs, keys 1-4, alert jumps, the calm right panel and the grouped pages menu on a
// served build (node scripts/serve-out.mjs 8081), at desktop and phone width:
//   node scripts/check-groups.mjs [http://localhost:8081] [screenshot-dir]
import { chromium } from "playwright-core";

const BASE = process.argv[2] ?? "http://localhost:8081";
const SHOTS = process.argv[3];
let failed = 0;
const check = (ok, msg) => {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`);
};

const browser = await chromium.launch({ channel: "msedge", headless: true }).catch(() => chromium.launch({ channel: "chrome", headless: true }));

const alert = {
  generatedAt: new Date().toISOString(),
  rules: [],
  active: [
    {
      id: "kp:test", level: "critical", kind: "geomagnetic", rule: "test", title: "Geomagnetic storm, Kp 8.0 (TEST)", detail: "test",
      at: new Date(Date.now() - 60_000).toISOString(), expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      scenario: "solar", sourceName: "test", sourceUrl: "https://example.org",
    },
  ],
};

for (const [label, viewport, mobile] of [["desktop", { width: 1440, height: 860 }, false], ["phone", { width: 390, height: 844 }, true]]) {
  console.log(`--- ${label} ${viewport.width}x${viewport.height}`);
  const context = await browser.newContext({ viewport, isMobile: mobile });
  const page = await context.newPage();
  const tabs = (name) => page.getByRole("tablist", { name, exact: true }).getByRole("tab");
  const selected = (name) => page.getByRole("tablist", { name, exact: true }).locator('[aria-selected="true"]').first().innerText();

  await page.goto(BASE + "/", { waitUntil: "load" });
  await page.waitForTimeout(2500);

  check((await tabs("Scenario group").count()) === 4, "4 group tabs");
  check((await tabs("Scenario").count()) === 0, "Overview has no second row");
  check((await selected("Scenario group")).startsWith("OVERVIEW"), "Overview selected at first");

  await page.keyboard.press("2");
  check((await selected("Scenario group")).startsWith("HUMAN"), "key 2 selects Human");
  check((await tabs("Scenario").allInnerTexts()).join() === "NUCLEAR,CONFLICT,BIO", "Human sub-tabs: Nuclear, Conflict, Bio");
  check((await selected("Scenario")) === "NUCLEAR", "first sub-tab by default");
  await page.keyboard.press("2");
  check((await selected("Scenario")) === "CONFLICT", "key 2 again: next sub-tab");
  await page.keyboard.press("2");
  await page.keyboard.press("2");
  check((await selected("Scenario")) === "NUCLEAR", "sub-tabs wrap");

  await page.keyboard.press("3");
  check((await tabs("Scenario").allInnerTexts()).join() === "VOLCANO,WEATHER,ICE & SEA", "Earth sub-tabs");
  await page.getByRole("tablist", { name: "Scenario", exact: true }).getByRole("tab", { name: "Weather" }).click();
  await page.keyboard.press("4");
  check((await tabs("Scenario").allInnerTexts()).join() === "SOLAR,ORBIT,ASTEROID", "Space sub-tabs");
  await page.keyboard.press("3");
  check((await selected("Scenario")) === "WEATHER", "a group reopens its last used sub-tab");
  await page.keyboard.press("0");
  check((await selected("Scenario group")).startsWith("EARTH"), "old key 0 does nothing");

  // typing in the search box must not switch tabs
  await page.locator("#place-search").fill("1");
  check((await selected("Scenario group")).startsWith("EARTH"), "keys are ignored while typing");

  // group colours come from CSS custom properties; scenario panel border follows the group
  const vars = await page.evaluate(() => ["overview", "human", "earth", "space"].map((g) => getComputedStyle(document.documentElement).getPropertyValue(`--grp-${g}`).trim()));
  check(vars.every(Boolean), `group colours defined (${vars.join(" ")})`);
  check(await page.evaluate(() => [...document.querySelectorAll("*")].every((el) => { const s = getComputedStyle(el); return (s.backdropFilter || "none") === "none"; })), "no backdrop-filter on any element");

  // right panel: first view is short; "More" is a closed <details>
  await page.getByRole("tablist", { name: "Scenario group", exact: true }).getByRole("tab", { name: "Overview" }).click();
  const more = page.locator("details", { has: page.locator("summary", { hasText: /^More/ }) });
  check((await more.count()) === 1 && !(await more.evaluate((d) => d.open)), "More is closed by default");
  check(await page.getByText(/SIGNAL /).first().isVisible(), "signal chip visible");
  await more.locator("summary").first().click();
  check(await more.evaluate((d) => d.open), "More opens");
  await more.locator("summary").first().click();

  // layout: no sideways scroll, rows fit
  const over = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  check(!over, "no horizontal page scroll");
  const rows = await page.evaluate(() => [...document.querySelectorAll('[role="tablist"][aria-label^="Scenario"]')].map((el) => el.scrollWidth <= el.clientWidth + 1));
  check(rows.every(Boolean), "both tab rows fit without scrolling");
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/groups-${label}-overview.png` });

  // alerts still jump to the right scenario
  await context.route("**/data/alerts.json", (r) => r.fulfill({ contentType: "application/json", body: JSON.stringify(alert) }));
  await page.reload({ waitUntil: "load" });
  await page.waitForTimeout(2500);
  await page.getByRole("button", { name: "VIEW" }).click();
  check((await selected("Scenario group")).startsWith("SPACE") && (await selected("Scenario")) === "SOLAR", "alert VIEW jumps to Space / Solar");
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/groups-${label}-solar.png` });

  // pages menu: five groups
  const menuTitles = async () => page.locator("details", { has: page.locator("summary", { hasText: /^pages/ }) }).locator("p.label").allInnerTexts();
  await page.locator("summary", { hasText: /^pages/ }).click();
  const menu = (await menuTitles()).map((t) => t.trim().toLowerCase());
  check(menu.join() === "map,scenarios,survive,library,about", `pages menu groups: ${menu.join(", ")}`);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/groups-${label}-menu.png` });

  // wiki sidebar shows the same groups
  await page.goto(BASE + "/survive", { waitUntil: "load" });
  await page.waitForTimeout(800);
  if (mobile) await page.getByRole("button", { name: /MENU/ }).click();
  const wikiNav = await page.locator("nav[aria-label='Wiki']:visible p").allInnerTexts();
  check(wikiNav.map((t) => t.trim()).filter((t) => ["MAP", "SCENARIOS", "SURVIVE", "LIBRARY", "ABOUT"].includes(t.toUpperCase())).length === 5, "wiki sidebar shows the same 5 groups");
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/groups-${label}-wiki.png` });
  await context.close();
}

await browser.close();
process.exit(failed ? 1 : 0);
