// Writes out/search-index.json: the text of every section of every content page, for the search box in WikiShell.
// Each page is opened in a headless browser and "Print whole page" renders all its sections (the exported HTML holds only the first one).
// Run after flatten-segments (npm run build does). Without a browser it warns and the search box simply finds nothing.
import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";

const PORT = 8099;
const CHARS_PER_SECTION = 1200; // enough for AND matches deep in a section; the file stays well under 300 KB
// the page list lives in components/SiteNav.tsx; read the hrefs rather than import TSX
const pages = [...readFileSync("components/SiteNav.tsx", "utf8").matchAll(/href: "(\/[a-z-]*)"/g)].map((m) => m[1]).filter((h) => h !== "/");

const scenarios = readdirSync("out/scenarios", { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
  .map((d) => `/scenarios/${d.name}`);
const urls = [...new Set([...pages, ...scenarios])];

const server = spawn(process.execPath, ["scripts/serve-out.mjs", String(PORT)], { stdio: "ignore" });
const done = (code) => {
  server.kill();
  process.exit(code);
};
await new Promise((r) => setTimeout(r, 1500));

const browser = await chromium.launch({ channel: "chrome", headless: true }).catch(() => chromium.launch({ channel: "msedge", headless: true })).catch(() => null);
if (!browser) {
  console.warn("build-search-index: no Chrome or Edge found, search-index.json not written");
  done(0);
}
const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
await page.addInitScript(() => {
  window.print = () => {};
});

const index = [];
for (const url of urls) {
  await page.goto(`http://localhost:${PORT}${url}`, { waitUntil: "load" });
  await page.waitForTimeout(1200); // pages that load data fill their sections after mount
  await page.getByRole("button", { name: "Print whole page" }).first().click();
  await page.waitForSelector(".print-section", { state: "attached" });
  const title = await page.locator("h1").first().innerText();
  const sections = await page.$$eval(".print-section", (els) =>
    els.map((el) => ({ id: el.dataset.section, label: el.dataset.label, text: el.textContent })),
  );
  for (const s of sections) {
    if (s.id === "sources") continue;
    const text = s.text.replace(s.label.toUpperCase(), "").replace(/\s+/g, " ").trim().toLowerCase().slice(0, CHARS_PER_SECTION);
    index.push({ url: `${url}#${s.id}`, page: title, section: s.label, text });
  }
}
await browser.close();

writeFileSync("out/search-index.json", JSON.stringify(index));
console.log(`build-search-index: ${index.length} sections from ${urls.length} pages, ${(statSync("out/search-index.json").size / 1024).toFixed(0)} KB`);
done(0);
