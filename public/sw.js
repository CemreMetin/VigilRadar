/* VigilRadar service worker: lets the site (especially /survive/) open with no connection.
 *
 *  - /data/*.json, /search-index.json   network first, cached copy when offline (so metrics still show, marked by their own timestamps)
 *  - /_next/static, fonts, icons   cache first (files are content-hashed)
 *  - pages               network first, cached copy when offline
 *  - anything cross-origin (map tiles, etc.) is left alone: the basemap needs a connection.
 *
 * "Save for offline" on /survive/ sends a CACHE_PAGES message; we then download those pages and every
 * script/style/font they reference, so they work even if you never opened them online.
 */
const VERSION = "v2";
const PAGES = `vigil-pages-${VERSION}`;
const RUNTIME = `vigil-runtime-${VERSION}`;
const DATA = `vigil-data-${VERSION}`;
// the search index is data too: network first, cached copy when offline
const isData = (path) => path.startsWith("/data") || path === "/search-index.json";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => ![PAGES, RUNTIME, DATA].includes(k)).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(req, { ignoreSearch: false });
    if (hit) return hit;
    if (req.mode === "navigate") {
      const fallback = await cache.match("/");
      if (fallback) return fallback;
    }
    throw err;
  }
}

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (isData(url.pathname)) {
    event.respondWith(networkFirst(req, DATA));
  } else if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/vendor") ||
    url.pathname.startsWith("/icons")
  ) {
    event.respondWith(cacheFirst(req, RUNTIME));
  } else if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    event.respondWith(networkFirst(req, PAGES));
  } else {
    event.respondWith(networkFirst(req, RUNTIME));
  }
});

// chunk names inside Next's JS (dynamic imports such as the map) are written without the /_next/ prefix
const ASSET_RE = /(?:\/_next\/)?static\/(?:chunks|css|media)\/[^"'\s\\)<>]+/g;

async function fetchAndStore(url, cacheName, seen, found) {
  if (seen.has(url)) return;
  seen.add(url);
  try {
    const res = await fetch(url, { cache: "reload" });
    if (!res.ok) return;
    const cache = await caches.open(cacheName);
    await cache.put(url, res.clone());
    found.count++;
    const type = res.headers.get("content-type") || "";
    if (type.includes("text/html") || type.includes("text/css") || type.includes("javascript")) {
      const text = await res.clone().text();
      const assets = new Set(text.match(ASSET_RE) || []);
      for (const a of assets) await fetchAndStore((a.startsWith("/") ? a : `/_next/${a}`).split("?")[0], RUNTIME, seen, found);
    }
  } catch {
    found.failed++;
  }
}

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type !== "CACHE_PAGES") return;
  const port = event.ports && event.ports[0];
  event.waitUntil(
    (async () => {
      const seen = new Set();
      const found = { count: 0, failed: 0 };
      for (const page of data.pages || []) {
        await fetchAndStore(page, isData(page) ? DATA : PAGES, seen, found);
      }
      if (port) port.postMessage({ ok: true, ...found });
    })(),
  );
});
