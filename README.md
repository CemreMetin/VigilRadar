# Monitoring

A personal, ad-free dashboard of interlinked global risks: live feeds (quakes, outbreaks, conflict coverage, space weather, climate), nuclear and supervolcano watchlists, 23 scenarios rated by quality of evidence, an offline preparedness guide, and a map that shows what is linked to what. Every number cites its source and says whether it is a measurement, a projection or an expert's judgement.

Design notes and decisions: [SPEC.md](SPEC.md) (Turkish). How things are computed: the site's `/methodology` page.

## Run

```bash
npm install          # also copies the MapLibre worker into public/vendor
npm run dev          # refreshes the fast feeds first, then serves http://localhost:3000
npm run data         # full refresh: adds GDELT (downloads missing days, ~7 MB each) and World Bank
npm run build        # static export to out/
```

## How it works (server-heavy, client-light)

- `worker/build-world-state.ts` runs every feed and writes `public/data/*.json`. Each feed is independent: if one fails, its last values stay and its status turns amber.
- The site is a static export. The browser downloads JSON and paints it with MapLibre; all computation (tension index, links, country profiles, exposure) happens in the worker.
- Basemap: CARTO Dark Matter (free for non-commercial use, attribution shown).
- `public/sw.js` + `public/manifest.webmanifest` make it an installable app. "Save for offline use" on `/survive/` stores pages, scripts and data on the device.
- No accounts, ads or analytics. The checklist lives in `localStorage`.

## Data

| What | Where | Refresh |
|---|---|---|
| Quakes, CO₂, temperature, Kp, WHO reports, chokepoints, asteroids, supervolcano status | `worker/feeds/*` | `npm run data:fast` (every 5-15 min) |
| Tension pairs, armed-conflict map, World Bank indicators | `worker/feeds/gdelt.ts`, `worldbank.ts` (slow feeds) | `npm run data` (daily) |
| Doomsday Clock, SIPRI warheads, Overshoot Day | `data/manual-counters.json`, `data/arsenals.json` (hand-maintained, `reviewBy` dates) | yearly, by hand |
| Plants, airports, cables, solar exposure, cities, countries | one-off scripts in `scripts/` (`build-*.py`), output committed | rarely |
| Scenario text and references | `data/scenarios.ts`, `data/references.ts`, `data/causal.ts` | by hand |

Adding a feed: write a module in `worker/feeds/`, register it in `FEEDS` in `worker/build-world-state.ts` (give it `prefix` for events or `counterIds` for counters, so old values are kept if it fails).

## Pages

`/` map and metrics · `/scenarios` (23, tiered A/B/C; 7 interactive) · `/survive` offline preparedness · `/trajectory` observed series, IPCC scenarios, expert estimates · `/nuclear` · `/health` · `/supervolcanoes` · `/country?c=ISO3` · `/links` hand-curated causal map · `/methodology` · `/sources`.

## Checks

```bash
npm run lint && npx tsc --noEmit && npm run build
# serve the built site, then run the checks:
node scripts/serve-out.mjs 8081 &
node scripts/test-offline.mjs     # service worker, offline pages, checklist persistence (uses installed Edge/Chrome)
node scripts/perf-check.mjs       # phone-like load: size, load time, long tasks
```

Last measured (4× slowed CPU, 390 px viewport): map page about 575 KB of gzipped JavaScript and 25-35 KB of data; worst single main-thread task about 0.2-0.6 s during map start-up.

## Deploying

The export uses extensionless URLs (`/survive` is served from `survive.html`), which Cloudflare Pages, Netlify, Vercel and GitHub Pages all do by default; a plain `python -m http.server` does not, use `node scripts/serve-out.mjs` locally. `npm run build` runs `scripts/flatten-segments.mjs` afterwards: Next 16.3 writes route-segment files into nested folders but asks for flat names, which would make every link prefetch a 404.

Hosting: Cloudflare Pages (free plan: unlimited bandwidth, 20,000 files and 25 MiB per file; this site is about 430 files and 12 MB). `.github/workflows/data.yml` refreshes the data, builds and deploys on every push and twice an hour, without committing data back to the repo. It needs two repository secrets, `CLOUDFLARE_API_TOKEN` (Pages: Edit) and `CLOUDFLARE_ACCOUNT_ID`; without them it builds and skips the deploy. Any static host works if you prefer another. Keep the CC BY-NC-SA datasets (submarine cables) in mind if the site ever becomes commercial.
