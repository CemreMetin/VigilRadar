// WCAG contrast (4.5:1) of the text on the main pages: / (live and simulate), /library, /about. The background of each text
// element is the first non-transparent background of its ancestors; the Radar map and the pages' fixed bars are solid colours.
//   node scripts/serve-out.mjs 8098   then   node scripts/check-contrast.mjs [http://localhost:8098]
import { chromium } from "playwright-core";

const BASE = process.argv[2] ?? "http://localhost:8098";
const PAGES = [["/", "radar"], ["/?mode=sim&shock=hormuz&sev=80&day=30&country=TUR", "simulate"], ["/library", "scenarios"], ["/about", "about"]];

const browser = await chromium.launch({ channel: "msedge", headless: true }).catch(() => chromium.launch({ channel: "chrome", headless: true }));
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "tr-TR" })).newPage();

const lum = ([r, g, b]) => [r, g, b].map((v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

let failing = 0, total = 0;
for (const [path, name] of PAGES) {
  await page.goto(BASE + path, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  const boxes = await page.evaluate(() => {
    // any CSS colour syntax (rgb, color-mix, oklab, color(srgb ...)) is read back as RGBA through a canvas pixel
    const px = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    px.canvas.width = px.canvas.height = 1;
    const parse = (c) => { px.clearRect(0, 0, 1, 1); px.fillStyle = "#000"; px.fillStyle = c; px.fillRect(0, 0, 1, 1); const d = px.getImageData(0, 0, 1, 1).data; return { rgb: [d[0], d[1], d[2]], a: d[3] / 255 }; };
    const bgOf = (el) => {
      let layers = [];
      for (let e = el; e; e = e.parentElement) {
        const { rgb, a } = parse(getComputedStyle(e).backgroundColor);
        if (a > 0) layers.push({ rgb, a });
        if (a >= 1) break;
      }
      let out = [0, 0, 0]; // under everything: the page's dark base
      for (const l of layers.reverse()) out = out.map((v, i) => v * (1 - l.a) + l.rgb[i] * l.a);
      return out;
    };
    const out = [];
    for (const el of document.querySelectorAll("body *")) {
      if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
      if (r.width < 2 || r.height < 2 || cs.visibility === "hidden" || cs.display === "none" || el.closest("canvas, svg, [aria-hidden=true], .maplibregl-map")) continue;
      const fg = parse(cs.color);
      out.push({ fg: fg.rgb, fa: fg.a, bg: bgOf(el), text: el.textContent.trim().slice(0, 36), size: parseFloat(cs.fontSize) });
    }
    return out;
  });
  const bad = [];
  for (const b of boxes) {
    const fg = b.fg.map((v, i) => v * b.fa + b.bg[i] * (1 - b.fa));
    const cr = ratio(lum(fg), lum(b.bg));
    total++;
    if (cr < 4.5) { failing++; bad.push({ cr, text: b.text, size: b.size }); }
  }
  console.log(`${bad.length ? "FAIL" : "ok  "} ${name.padEnd(12)} ${boxes.length} text elements, ${bad.length} below 4.5:1`);
  for (const b of bad.sort((x, y) => x.cr - y.cr).slice(0, 8)) console.log(`       ${b.cr.toFixed(2)}  ${b.size}px  "${b.text}"`);
}
console.log(`text elements measured ${total}, below 4.5:1: ${failing}`);
await browser.close();
process.exit(failing ? 1 : 0);
