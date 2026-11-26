// Rough performance check on an emulated mid-range phone: 390x844 viewport, CPU slowed 4x.
// Start the built site first (npm run build && node scripts/serve-out.mjs 8081), then:
//   node scripts/perf-check.mjs [http://localhost:8081]
// Reports transferred bytes (gzip estimate), time to load, and long main-thread tasks per page. On the simulator it
// also plays the whole timeline. Exit code 1 when a map page downloads more than the data budget on first load.
import { gzipSync } from "node:zlib";
import { chromium } from "playwright-core";

const BASE = process.argv[2] ?? "http://localhost:8081";
const PAGES = [
  ["/", "map, live", 9_000],
  ["/?mode=sim&shock=hormuz&day=30", "map, simulator", 12_000],
  ["/survive", "survive", 2_500],
  ["/library/pandemic-x", "pandemic explorer", 12_000],
  ["/trajectory", "trajectory", 2_500],
];

const DATA_BUDGET_KB = 80; // VIGIL_V2_SPEC.md 3.4: data from this site on the first load of the map
let over = 0;

const browser = await chromium.launch({ channel: "msedge", headless: true }).catch(() => chromium.launch({ channel: "chrome", headless: true }));

console.log("page".padEnd(26), "load ms".padStart(8), "JS gz KB".padStart(9), "data gz KB".padStart(11), "long tasks".padStart(11), "worst ms".padStart(9));
for (const [path, name, settle] of PAGES) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.addInitScript(() => {
    window.__long = [];
    new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__long.push(e.duration))).observe({ entryTypes: ["longtask"] });
  });

  let js = 0;
  let data = 0;
  page.on("response", async (res) => {
    try {
      const url = res.url();
      if (!url.startsWith(BASE)) return;
      const body = await res.body();
      const gz = gzipSync(body).length;
      if (/\.js(\?|$)|\.mjs/.test(url)) js += gz;
      else if (url.includes("/data")) data += gz;
    } catch {
      /* redirects / aborted */
    }
  });

  const t0 = Date.now();
  await page.goto(`${BASE}${path}`, { waitUntil: "load" });
  const loadMs = Date.now() - t0;
  await page.waitForTimeout(settle);
  const long = await page.evaluate(() => window.__long);
  console.log(
    `${name}`.padEnd(26),
    String(loadMs).padStart(8),
    (js / 1024).toFixed(0).padStart(9),
    (data / 1024).toFixed(0).padStart(11),
    String(long.length).padStart(11),
    (long.length ? Math.max(...long).toFixed(0) : "0").padStart(9),
  );
  if (path === "/" || path.startsWith("/?")) {
    const ok = data / 1024 <= DATA_BUDGET_KB;
    if (!ok) over++;
    console.log(`  ${ok ? "ok  " : "OVER"} first-load data ${(data / 1024).toFixed(1)} KB gzip (budget ${DATA_BUDGET_KB})`);
  }
  if (path.startsWith("/?mode=sim")) {
    await page.evaluate(() => (window.__long = []));
    await page.locator("footer button").first().click();
    await page.waitForTimeout(10_500);
    const during = await page.evaluate(() => ({ long: window.__long, day: document.querySelectorAll("footer input[type=range]")[1].value }));
    console.log(`  time player: reached day ${during.day}, ${during.long.length} long tasks, worst ${during.long.length ? Math.max(...during.long).toFixed(0) : 0} ms`);
  }
  await context.close();
}
await browser.close();
process.exit(over ? 1 : 0);
