// Minimal static server for the exported site (out/), with the try_files behaviour real static hosts have:
// /path -> /path, /path.html, /path/index.html. Used by the test scripts; not for production.
//   node scripts/serve-out.mjs [port]
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const PORT = Number(process.argv[2] ?? 8081);
const ROOT = join(process.cwd(), "out");
// out/_headers (Cloudflare Pages format) is applied the way the CDN does: every block whose path matches the request
const RULES = [];
if (existsSync(join(ROOT, "_headers")))
  for (const line of readFileSync(join(ROOT, "_headers"), "utf8").split(/\r?\n/)) {
    if (line.startsWith("/")) RULES.push({ path: line.trim(), headers: {} });
    else if (/^\s+\S+:/.test(line)) RULES.at(-1).headers[line.slice(0, line.indexOf(":")).trim()] = line.slice(line.indexOf(":") + 1).trim();
  }
const matches = (rule, path) => (rule.endsWith("*") ? path.startsWith(rule.slice(0, -1)) : path === rule);
const headersFor = (path) => Object.assign({}, ...RULES.filter((r) => matches(r.path, path)).map((r) => r.headers));
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
  res.writeHead(status, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream", "Cache-Control": "no-cache", ...headersFor(url.pathname) });
  res.end(readFileSync(file));
}).listen(PORT, () => console.log(`serving out/ on http://localhost:${PORT}`));
