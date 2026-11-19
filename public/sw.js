/* Monitoring service worker: lets the site (especially /survive/) open with no connection.
 *
 *  - /data/*.json, /search-index.json   network first, cached copy when offline (so metrics still show, marked by their own timestamps)
 *  - /_next/static, fonts, icons   cache first (files are content-hashed)
 *  - pages               network first, cached copy when offline
 *  - anything cross-origin (map tiles, etc.) is left alone: the basemap needs a connection.
 *
 * "Save for offline" on /survive/ sends a CACHE_PAGES message; we then download those pages and every
 * script/style/font they reference, so they work even if you never opened them online.
 */
const VERSION = "v1";
const PAGES = `monitoring-pages-${VERSION}`;
const RUNTIME = `monitoring-runtime-${VERSION}`;
const DATA = `monitoring-data-${VERSION}`;
// the search index is data too: network first, cached copy when offline
const isData = (path) => path.startsWith("/data") || path === "/search-index.json";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k.startsWith("monitoring-") && !k.endsWith(VERSION)).map((k) => caches.delete(k)),
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
      const fallback = (await cache.match("/alert")) || (await cache.match("/survive")) || (await cache.match("/"));
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

const ASSET_RE = /\/_next\/static\/[^"'\s\\)<>]+/g;

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
      for (const a of assets) await fetchAndStore(a.split("?")[0], RUNTIME, seen, found);
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

// ---- Web Push (VIGIL.md 7.4 / 9.3) ----
// The Worker sends {id, level, title, body, url}. The tag is the event id, so an update or a cancel replaces the earlier
// notification of the same event. Only P0 stays on screen until the user acts.
self.addEventListener("push", (event) => {
  let d = null;
  try { d = event.data ? event.data.json() : null; } catch { /* not JSON */ }
  if (!d || typeof d.title !== "string") return;
  event.waitUntil(
    self.registration.showNotification(d.title, {
      body: typeof d.body === "string" ? d.body : "",
      tag: typeof d.id === "string" ? d.id : undefined,
      requireInteraction: d.level === "P0",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: typeof d.url === "string" ? d.url : "/alert" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  // only this site's own address is opened, whatever the payload says
  let target = "/alert";
  try {
    const u = new URL(event.notification.data && event.notification.data.url, self.location.origin);
    if (u.origin === self.location.origin) target = u.pathname + u.search;
  } catch { /* keep /alert */ }
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const open = all.find((c) => new URL(c.url).origin === self.location.origin);
      if (open) {
        await open.focus();
        if ("navigate" in open) await open.navigate(target).catch(() => {});
      } else {
        await self.clients.openWindow(target);
      }
    })(),
  );
});
