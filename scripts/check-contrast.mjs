// WCAG contrast of the text in the map view's see-through panels over the real basemap, per scenario, flat and globe.
// Text is hidden for a second screenshot so the pixels behind each text box can be sampled; the worst case is the
// brighter 90th percentile of those pixels.   node scripts/check-contrast.mjs [http://localhost:8081]
import { chromium } from "playwright-core";

const BASE = process.argv[2] ?? "http://localhost:8081";
const SCENARIOS = ["overview", "nuclear", "conflict", "bio", "volcano", "weather", "ice", "solar", "orbit", "asteroid"];
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();

const measure = () =>
  page.evaluate(async () => {
    const boxes = [];
    for (const el of document.querySelectorAll("aside *, header *")) {
      if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      const closed = el.closest("details:not([open])");
      if (closed && !el.closest("summary")) continue; // closed disclosures keep their boxes but paint nothing
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (r.width < 2 || r.height < 2 || cs.visibility === "hidden" || cs.display === "none" || r.bottom < 0 || r.top > innerHeight) continue;
      const m = cs.color.match(/[\d.]+/g).map(Number);
      boxes.push({ x: r.x, y: r.y, w: r.width, h: r.height, fg: m.slice(0, 3), text: el.textContent.trim().slice(0, 30) });
    }
    return boxes;
  });

const lum = ([r, g, b]) => [r, g, b].map((v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

let worst = { ratio: 99 };
let failing = 0;
const fails = new Map();
let total = 0;
for (const globe of [false, true]) {
  for (const sc of SCENARIOS) {
    await page.goto(`${BASE}/?sc=${sc}${globe ? "&view=3d" : ""}`, { waitUntil: "load" });
    await page.waitForTimeout(4500);
    const boxes = await measure();
    await page.addStyleTag({ content: "aside *, header * { color: transparent !important; text-shadow: none !important; } .scroll-thin{scrollbar-width:none}" });
    const shot = (await page.screenshot()).toString("base64");
    const pixels = await page.evaluate(
      async ({ shot, boxes }) => {
        const img = new Image();
        img.src = "data:image/png;base64," + shot;
        await img.decode();
        const c = document.createElement("canvas");
        c.width = img.width; c.height = img.height;
        const g = c.getContext("2d", { willReadFrequently: true });
        g.drawImage(img, 0, 0);
        return boxes.map((b) => {
          const d = g.getImageData(Math.max(0, Math.floor(b.x) + 2), Math.max(0, Math.floor(b.y) + 2), Math.max(1, Math.min(Math.ceil(b.w) - 4, 400)), Math.max(1, Math.ceil(b.h) - 4)).data;
          const ls = [];
          for (let i = 0; i < d.length; i += 4) ls.push([d[i], d[i + 1], d[i + 2]]);
          return ls.filter((_, i) => i % 3 === 0);
        });
      },
      { shot, boxes },
    );
    boxes.forEach((b, i) => {
      const bgs = pixels[i].map(lum).sort((a, c) => a - c);
      const bg = bgs[Math.floor(bgs.length * 0.9)] ?? 0;
      const fg = lum(b.fg);
      const cr = ratio(fg, bg);
      total++;
      if (cr < 4.5) { failing++; const k = b.text; if (!fails.has(k) || fails.get(k).cr > cr) fails.set(k, { cr, where: `${sc}${globe ? " globe" : ""}` }); }
      if (cr < worst.ratio) worst = { ratio: cr, sc, globe, text: b.text };
    });
  }
}
for (const [t, v] of [...fails].sort((a, b) => a[1].cr - b[1].cr).slice(0, 30)) console.log(`  ${v.cr.toFixed(2)}  ${v.where.padEnd(14)} "${t}"`);
console.log(`text boxes measured ${total}, below 4.5:1: ${failing}, worst ${worst.ratio.toFixed(2)}:1 (${worst.sc}${worst.globe ? " globe" : ""}, "${worst.text}")`);
await browser.close();
