// Screenshots the map view at 1440 x 900 for each of the four groups into out-print/ (not in git).
//   node scripts/shoot-groups.mjs <prefix> [http://localhost:8081]
import { chromium } from "playwright-core";

const [prefix = "shot", base = "http://localhost:8081"] = process.argv.slice(2);
const browser = await chromium.launch({ channel: "msedge", headless: true }).catch(() => chromium.launch({ channel: "chrome", headless: true }));
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
for (const group of ["OVERVIEW", "HUMAN", "EARTH", "SPACE"]) {
  await page.goto(base + "/", { waitUntil: "load" });
  await page.waitForTimeout(4500);
  await page.getByRole("tab", { name: new RegExp(group, "i") }).first().click().catch(() => page.getByText(group, { exact: true }).first().click());
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `out-print/${prefix}-${group.toLowerCase()}.png` });
  console.log("saved", `out-print/${prefix}-${group.toLowerCase()}.png`);
}
await browser.close();
