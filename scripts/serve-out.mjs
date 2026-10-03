// Minimal static server for the exported site (out/), with the try_files behaviour real static hosts have:
// /path -> /path, /path.html, /path/index.html. Used by the test scripts; not for production.
//   node scripts/serve-out.mjs [port]
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const PORT = Number(process.argv[2] ?? 8081);
const ROOT = join(process.cwd(), "out");
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".ico": "image/x-icon",
  ".svg": "image/svg+xml", ".txt": "text/plain; charset=utf-8", ".woff2": "font/woff2",
};

function resolve(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath)).replace(/^([/\\])+/, "");
  const candidates = [clean, `${clean}.html`, join(clean, "index.html")];
  for (const c of candidates) {
    const full = join(ROOT, c);
    if (full.startsWith(ROOT) && existsSync(full) && statSync(full).isFile()) return full;
  }
  return null;
}

createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  let file = resolve(url.pathname === "/" ? "index.html" : url.pathname);
  let status = 200;
  if (!file) {
    file = join(ROOT, "404.html");
    status = 404;
  }
  res.writeHead(status, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream", "Cache-Control": "no-cache" });
  res.end(readFileSync(file));
}).listen(PORT, () => console.log(`serving out/ on http://localhost:${PORT}`));
