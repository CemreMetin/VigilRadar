// Checks the sky, nuclear reference sites, bases filters, solar and bio layers on a served build
// (node scripts/serve-out.mjs 8081), at desktop and phone width, and that the map survives every new feed failing:
//   node scripts/check-layers.mjs [http://localhost:8081] [screenshot-dir]
import { chromium } from "playwright-core";

const BASE = process.argv[2] ?? "http://localhost:8081";
const SHOTS = process.argv[3];
let failed = 0;
const check = (ok, msg) => {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`);
};

const browser = await chromium.launch({ channel: "msedge", headless: true }).catch(() => chromium.launch({ channel: "chrome", headless: true }));
const NEW_DATA = ["aurora", "solar_now", "nuclear_targets", "countries.geo", "bsl4_labs", "airports", "solar_exposure", "military_bases", "asteroids", "cyclones"];

async function open(context, query, wait = 3500) {
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`${BASE}/${query}`, { waitUntil: "load" });
  await page.waitForTimeout(wait);
  return { page, errors };
}
// the legend is a disclosure that opens by itself for the nuclear and bases layers; open it for the rest
const text = async (page) => {
  await page.evaluate(() => document.querySelectorAll("details").forEach((d) => d.querySelector("summary")?.textContent?.trim().toUpperCase().startsWith("LEGEND") && (d.open = true)));
  return page.evaluate(() => document.body.innerText);
};
const shot = async (page, name) => SHOTS && page.screenshot({ path: `${SHOTS}/${name}.png` });

for (const [label, viewport, mobile] of [["desktop", { width: 1440, height: 860 }, false], ["phone", { width: 390, height: 844 }, true]]) {
  console.log(`--- ${label} ${viewport.width}x${viewport.height}`);
  const context = await browser.newContext({ viewport, isMobile: mobile });

  // Part 1: asteroid plot with real directions, hollow dots for the rest, the required legend line
  {
    const { page, errors } = await open(context, "?sc=asteroid");
    const body = await text(page);
    if (!mobile) {
      const filled = await page.locator('svg[aria-label^="Close approaches"] circle:not([fill="none"])').count();
      const hollow = await page.locator('svg[aria-label^="Close approaches"] circle[fill="none"]').count();
      check(filled > 10, `asteroid plot: ${filled} dots drawn at their direction`);
      check(hollow >= 1, `asteroid plot: ${hollow} hollow dots without a direction`);
      check(body.includes("Directions: JPL Horizons. Distances not to scale with the globe."), "asteroid legend line");
      check(/Moon/.test(body) && /Sun/.test(body), "Moon and Sun on the plot");
      check(/no direction available/.test(body), "legend says hollow dots have no direction");
    }
    await shot(page, `layers-${label}-asteroid`);
    check(errors.length === 0, "asteroid tab: no page errors");
    await page.close();
  }

  // 3D globe in a normal scenario: the legend says the night side is shaded
  {
    const { page, errors } = await open(context, "?view=3d");
    check((await text(page)).includes("the shaded side is night"), "3D globe legend mentions the night side, Sun and Moon");
    await shot(page, `layers-${label}-globe`);
    check(errors.length === 0, "globe: no page errors");
    await page.close();
  }

  // Part 2: nuclear reference sites
  {
    const { page, errors } = await open(context, "?sc=nuclear&on=targets", 5000);
    const body = await text(page);
    check(/Possible target areas/.test(body), "Nuclear tab offers Possible target areas");
    check(/ILLUSTRATIVE MODEL, not a forecast/.test(body), "target legend says illustrative model");
    check(/Example yield, not a prediction of what would be used/.test(body), "legend carries the example-yield sentence");
    check(!/most likely|likelihood ranking/i.test(body.replace(/says nothing about intentions or likelihood/g, "")), "no ranking wording");
    // place search -> distance line
    await page.locator("#place-search").fill("Ankara");
    await page.waitForTimeout(800);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(2500);
    const more = page.locator("details", { has: page.locator("summary", { hasText: /^More/ }) });
    await more.locator("summary").first().click();
    await page.getByText("Possible target areas (illustrative)").first().click();
    await page.waitForTimeout(500);
    check(/Distance from Ankara to the nearest listed site: [\d,]+ km/.test(await text(page)), "distance from a searched place to the nearest listed site");
    await shot(page, `layers-${label}-nuclear`);
    check(errors.length === 0, "nuclear: no page errors");
    await page.close();
  }

  // Part 3: bases filters, count line, historical toggle
  {
    const { page, errors } = await open(context, "?sc=conflict", 5000);
    const legend = async () => (await text(page)).match(/Showing [\d,]+ of 3,901/)?.[0] ?? "";
    const n = async () => Number((await legend()).match(/Showing ([\d,]+) of/)[1].replace(/,/g, ""));
    const base = await n();
    check(base < 3901 && base > 3600, `bases: ${base} of 3,901 shown by default (former states hidden)`);
    await page.getByRole("button", { name: /Show historical/ }).click();
    await page.waitForTimeout(500);
    check((await n()) === 3901, "Show historical brings back all 3,901");
    await page.getByRole("button", { name: "Show historical" }).click();
    await page.getByRole("group", { name: "Base kinds" }).getByRole("button", { name: "Air" }).click();
    await page.waitForTimeout(500);
    check((await n()) < base - 2000, "turning Air off removes the air bases");
    await page.getByRole("group", { name: "Base kinds" }).getByRole("button", { name: "Air" }).click();
    await page.locator("#base-country").selectOption("Germany");
    await page.waitForTimeout(500);
    const de = await n();
    check(de > 5 && de < 400, `country select narrows to Germany (${de})`);
    await shot(page, `layers-${label}-bases`);
    check(errors.length === 0, "conflict: no page errors");
    await page.close();
  }

  // Part 4: solar
  {
    const { page, errors } = await open(context, "?sc=solar", 4500);
    const body = await text(page);
    check(/G\d/.test(body) && /S\d/.test(body) && /R\d/.test(body), "solar first view: G, S and R chips");
    for (const name of ["Aurora oval", "Grid exposure", "Cables at risk", "All other cables"]) check(body.includes(name), `solar layer: ${name}`);
    check(body.includes("Long undersea internet cables need powered repeaters. A strong geomagnetic storm can induce currents that damage them, cutting internet links between continents."), "cable legend line");
    check(/Dashed bands: fixed 50° and 60°/.test(body), "50/60 degree bands kept as dashed reference");
    // a chip opens its detail in the right panel's More drawer
    await page.getByRole("button", { name: /^G\d/ }).click();
    await page.waitForTimeout(500);
    const more = page.locator("details", { has: page.locator("summary", { hasText: /^More/ }) });
    check(await more.evaluate((d) => d.open), "clicking a scale chip opens the drawer");
    check(/NOAA G scale/i.test(await text(page)) && /Kp 7, strong/.test(await text(page)), "chip detail: what the G scale means");
    const b2 = await text(page);
    check(/Solar wind and flares/i.test(b2) && /Kp forecast \(NOAA projection\)/i.test(b2), "solar readout: wind, flares, forecast labelled as projection");
    await shot(page, `layers-${label}-solar`);
    check(errors.length === 0, "solar: no page errors");
    await page.close();
  }

  // Part 5: bio
  {
    const { page, errors } = await open(context, "?sc=bio&on=labs", 5000);
    const body = await text(page);
    check(body.includes("WHO reports") && body.includes("Air-travel hubs") && body.includes("BSL-4 labs"), "bio layers: reports, hubs, labs");
    check(/darker purple: more WHO reports/.test(body), "shading legend");
    check(/How fast a new pathogen can travel/.test(body), "hubs label");
    check(/Pandemic explorer/.test(body), "link to the Pandemic X page");
    check(/not a risk ranking/.test(body), "labs: not a risk ranking");
    const more = page.locator("details", { has: page.locator("summary", { hasText: /^More/ }) });
    await more.locator("summary").first().click();
    await page.waitForTimeout(500);
    check(/DAYS SINCE LAST WHO EMERGENCY CHANGE/i.test(await text(page)), "readout: days since the last WHO emergency change");
    await shot(page, `layers-${label}-bio`);
    check(errors.length === 0, "bio: no page errors");
    await page.close();
  }

  // every new feed failing: the map still loads, each layer says so
  {
    const failing = await browser.newContext({ viewport, isMobile: mobile });
    await failing.route(new RegExp(`/data/(${NEW_DATA.join("|").replace(/\./g, "\\.")})\\.json`), (r) => r.abort());
    for (const [q, expect] of [["?sc=solar", /unavailable/i], ["?sc=nuclear&on=targets", /unavailable/i], ["?sc=bio&on=labs", /unavailable/i], ["?sc=conflict", /./], ["?sc=asteroid", /./]]) {
      const { page, errors } = await open(failing, q, 4000);
      const body = await text(page);
      check(errors.length === 0, `feeds failing ${q}: no page errors`);
      check(await page.locator("canvas").count() > 0, `feeds failing ${q}: the map is still there`);
      check(expect.test(body), `feeds failing ${q}: says unavailable`);
      await page.close();
    }
    await failing.close();
  }

  const over = await (async () => {
    const { page } = await open(context, "?sc=solar", 2500);
    const o = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    await page.close();
    return o;
  })();
  check(!over, "no horizontal page scroll");
  await context.close();
}

await browser.close();
process.exit(failed ? 1 : 0);
