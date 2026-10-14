# Monitoring

A personal, ad-free situational-awareness dashboard and offline survival guide for global catastrophic risks. Live feeds, curated watchlists, 23 evidence-tiered scenarios and a preparedness hub share one map and one data pipeline. Every number cites its source and says whether it is a measurement, a projection, an expert judgement or an illustrative model.

Live site: https://monitoring-9l7.pages.dev

Design decisions and rationale: [SPEC.md](SPEC.md) (Turkish). How figures are computed: the site's `/methodology` page.

## Vision

Monitoring answers three questions in one view: what world am I looking at, what detail do I want to see, and what does it mean for me. It does not forecast. It shows observations and published figures, separates them visibly from projections and expert estimates, and links each risk to the others where research supports a causal claim.

Principles:

- Every datum carries its source, date and licence.
- Observation, projection, expert estimate and model output are never mixed. Each has its own label and visual treatment.
- The site invents no probabilities. It shows other people's, named and cited, side by side.
- A failing source degrades one metric, never the whole page.
- Preparedness content works with no connection, requires no account and stores nothing on a server.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16, App Router, static export (`output: "export"`), React 19, TypeScript |
| Styling | Tailwind CSS 4 with CSS custom properties for the design tokens |
| Map | MapLibre GL JS 6 (WebGL), CARTO Dark Matter basemap, optional globe projection |
| Data worker | Node.js with `tsx` (`worker/`), plus one-off Python scripts for static datasets (`scripts/`) |
| Storage | None server-side. Static JSON files, browser `localStorage`, service-worker caches |
| Offline | Hand-written service worker and web app manifest (installable PWA) |
| Hosting | Cloudflare Pages (free plan) |
| CI and refresh | GitHub Actions: refreshes data, builds, tests types, deploys twice an hour |
| Verification | `playwright-core` driving the installed Edge or Chrome |

There is no database, no serverless function layer and no authentication. This is deliberate: the site is a set of static files, so a traffic spike during a real crisis is absorbed by the CDN.

## Design system

Theme: an underground analysis room. Ultra-dark, flat, monospace.

- Surfaces: background `#050505`, panels `#0a0f14`. Solid fills and 1px borders only; no blur, no shadows, no glow.
- Colour roles: red `#ff003c` threat and nuclear, purple `#b026ff` biological, cyan `#00e5ff` accent and water, green `#00ff41` reserved for safe or actionable (preparedness, status), amber `#ffb000` geophysical, orange `#ff6a00` conflict, lavender `#c9d1ff` space.
- Typography: JetBrains Mono for data, labels and controls; Inter for body text. Weight carries hierarchy: bold for values and titles, light for labels.
- Interaction contract: anything clickable has a solid 1px border and a visible fill plus brighter border on hover (`.btn`, `.card-btn`, `.tab-btn`). Reading material is muted grey with no border. Colour never carries meaning alone; shape and text accompany it.
- Evidence vocabulary: observed (solid), projection (dashed, amber), expert estimate (dotted, purple), illustrative model (dashed). Scenario tiers A, B and C rate quality of evidence, not likelihood.
- Motion: tab underlines, readout fade-ins, bar growth, a blinking cursor. All disabled under `prefers-reduced-motion`.

### Z-pattern layout

The map view uses three strict zones around a full-window map, read top-left to bottom-right:

1. Top bar: macro context. Mutually exclusive scenario tabs (Overview, Nuclear, Bio, Volcano, Conflict, Solar, Weather, Orbit, Ice & Sea, Asteroid; keys 1 to 9, then 0).
2. Left panel: micro control. Only the map layers of the active scenario, their filters and view options. It never switches scenarios.
3. Right panel: analysis and action. Read-only readouts, metrics and links, plus the survival card. It holds no map controls.

A status line at the bottom reports system state in plain terms (`UPLINK NOMINAL`, `DEGRADED`, `LOST`), each shown only when it is true. Selecting a scenario changes the available layers, the camera, panel border colour, a map vignette and the readouts. On narrow screens the zones stack without overlapping.

## Core features

### Map
Layers, each fed by the data pipeline: earthquakes (USGS), supervolcano watchlist, nuclear arsenals and power plants, tension arcs between country pairs, WHO outbreak reports, armed-conflict coverage, geomagnetic latitude bands and submarine cables. Selecting any object draws great-circle lines to what it is linked to, and the right panel lists the links.

### Scenario top bar
Ten exclusive tabs, each with a live statistic (for example the Doomsday Clock reading or the number of watchlist volcanoes above baseline). A signal chip (`NOMINAL`, `ELEVATED`, `CRITICAL`) is derived from the status of the scenario's live metrics, with its basis printed beneath it. It is a reading, not a forecast.

### Context-aware layer panel
Layers on offer depend on the scenario, for example arsenals, plants and tension pairs for Nuclear, or geomagnetic bands and cables for Solar. Quake time and magnitude filters appear only when the quake layer exists.

### Right panel
- Readout: per-scenario analysis such as tension bars, the Kp gauge with a 24 hour history, the volcano watchlist and chokepoint transit changes.
- Metrics: fourteen counters. Nine come from live feeds (global temperature, CO2, sea level, sea ice, WHO reports, shipping chokepoints, armed-conflict coverage, asteroid close approaches, Kp) and five are published figures entered by hand (Doomsday Clock, warheads, Earth Overshoot Day, glacier loss, ice-sheet loss), marked "manual" with a review date; past it the status bar shows a warning. Each expands to source, date, caveats and licence.
- Links: the selected object's computed links (nearby, same country, exposure).

### Survival hub (`/survive`)
A tiered checklist (grab-and-go and staying put) that can be highlighted by scenario, a four-step family plan, radiation-shelter guidance quoted from Ready.gov, a communications table (broadcast radio, PMR446, FRS and GMRS, amateur radio), a generator for a `pmtiles extract` command for offline maps, and verified links to official guides. There is no readiness score. Ticks are stored only in the browser. Medical doses are never given: the page links to WHO, CDC, Red Cross and national agencies.

### Further pages
`/scenarios` (23 scenarios, seven with interactive explorers: supervolcano watchlist, pandemic spread by air travel, nuclear soot and food, solar exposure, asteroid impact energy, climate tipping elements, food and water), `/trajectory` (observed series, IPCC scenarios, expert estimates), `/links` (hand-curated causal map with evidence ratings), `/country`, `/nuclear`, `/health`, `/supervolcanoes`, `/methodology`, `/sources`.

## Data and architecture

### Server-heavy, client-light
All computation happens in the worker. The browser downloads small JSON files and paints them.

```
open feeds --> worker (Node, runs in CI) --> public/data/*.json --> static build --> Cloudflare Pages CDN
                  |                                                                       |
        link engine, tension index,                                          browser: MapLibre paints,
        country profiles, exposure                                           service worker caches
```

- Each feed is independent. If one fails, its previous values stay and its status turns amber; the site never goes blank.
- GDELT daily aggregates are cached, so a normal run downloads only the missing day.
- The map page ships about 580 KB of gzipped JavaScript and 25 to 35 KB of data. On a CPU slowed 4 times with a 390 px viewport, the worst single main-thread task is roughly 0.2 to 0.6 s.

### Feeds
USGS earthquakes, NOAA GML (CO2), NASA GISTEMP (temperature), NOAA SWPC (Kp), WHO Disease Outbreak News, IMF PortWatch, NASA/JPL close approaches and Sentry, USGS HANS, GeoNet and INGV (volcanoes), GDELT events (tension pairs and conflict coverage), World Bank indicators. Annual figures (Doomsday Clock, SIPRI warheads, Earth Overshoot Day) are entered by hand with a `reviewBy` date.

### Data model (what replaces a database schema)
The contract between worker and browser is typed in `lib/types.ts`.

| File in `public/data/` | Contents |
|---|---|
| `world_state.json` | `WorldState`: feed statuses, events, counters, volcano watchlist, tension pairs |
| `links.json` | Computed links (spatial, actor, exposure) with the rules that produced them |
| `country_profiles.json` | One profile per country: arsenal, pairs, plants, outbreaks, indicators, co-occurring signals |
| `conflict_cells.json` | Armed-conflict reports aggregated to 0.25 degree cells over 7 days |
| `indicators.json`, `series.json` | World Bank water and food indicators; long temperature and CO2 series |
| `nuclear_plants.json`, `airports.json`, `cables.json`, `solar_exposure.json` | Static datasets built by scripts in `scripts/` |

Hand-curated content lives in `data/`: scenarios, references, causal edges, the survival checklist, tracked country pairs.

### Client storage and privacy
- `localStorage` key `monitoring.bag.v1`: the ids of ticked checklist items. Nothing is sent anywhere.
- Service-worker caches (`pages`, `runtime`, `data`): created only when the visitor presses "save for offline use" or visits the built site.
- No accounts, cookies, analytics or ads. The only third-party request at runtime is the CARTO basemap tiles. Geolocation, if the visitor allows it for the offline-map helper, stays in the browser.

### Security posture
- No server code and no secrets in the repository. The only secrets are the two Cloudflare values held in GitHub Actions secrets.
- Text from external feeds is inserted with `textContent` or React escaping, never `innerHTML`.
- Not configured yet: HTTP security headers and a Content Security Policy (Cloudflare Pages supports a `_headers` file).
- Citations were checked against Crossref records; web links were opened. Sites that block automated requests are marked in the data.

## Project structure

```
app/                     routes (one folder per page); layout.tsx, globals.css (design tokens)
components/
  Dashboard.tsx          state and data loading for the map view
  MapView.tsx            MapLibre layers, popups, camera
  dashboard/             the zones: TopBar, FilterPanel, Readout, StatusBar, HubCard, MapHud, DashboardLayout
  scenarios/             interactive scenario explorers and the shared MiniMap
  SurvivalHub.tsx, OfflineButton.tsx, PwaRegister.tsx   preparedness hub and offline support
lib/                     types, scenario modes and layer catalogue (lenses.ts), entity index, geometry helpers
worker/                  data pipeline: build-world-state.ts, links.ts (link engine), feeds/ (one module per source)
data/                    hand-maintained content: scenarios, references, causal edges, checklist, arsenals, tracked pairs
scripts/                 one-off dataset builders (Python) and test or build helpers (Node)
public/                  data/ (generated JSON), sw.js, manifest, icons
.github/workflows/       data.yml: refresh, build, deploy
```

## Data sources and licences

| Source | Used for | Licence |
|---|---|---|
| USGS Earthquake Hazards Program, USGS HANS | Earthquakes, volcano alert levels | Public domain |
| NOAA GML, NOAA SWPC | CO2, geomagnetic Kp | Public domain |
| NASA GISTEMP, NASA/JPL CNEOS | Temperature, asteroid close approaches | Public domain |
| WHO Disease Outbreak News | Outbreak reports | CC BY-NC-SA 3.0 IGO |
| IMF PortWatch | Shipping chokepoint transits | Open, attribution |
| GDELT | Tension pairs, armed-conflict coverage | Open, attribution requested |
| World Bank | Water stress, undernourishment | CC BY 4.0 |
| GeoNet, INGV | Taupo and Campi Flegrei status | CC BY 4.0 |
| SIPRI Yearbook 2026, Bulletin of the Atomic Scientists, Global Footprint Network | Warheads, Doomsday Clock, Overshoot Day (entered by hand) | Cited with attribution |
| WRI Global Power Plant Database | Nuclear plants, power capacity | CC BY 4.0 |
| OpenFlights | Air-travel network | ODbL 1.0 |
| GeoNames, gavinr/world-countries-centroids | Countries and cities | CC BY 4.0 |
| TeleGeography Submarine Cable Map | Cables | CC BY-NC-SA 3.0 (non-commercial) |
| CARTO, OpenStreetMap contributors | Basemap | Free for non-commercial use, attribution shown |

The full, live list with last-success times is on the site's `/sources` page.

## Development

```bash
npm install          # also copies the MapLibre worker into public/vendor
npm run dev          # refreshes the fast feeds, then serves http://localhost:3000
npm run data         # full refresh including GDELT and World Bank
npm run build        # static export to out/ (a post-build step flattens segment files)
```

Checks:

```bash
npm run lint && npx tsc --noEmit && npm run build
node scripts/serve-out.mjs 8081 &       # static server with real try_files behaviour
node scripts/test-offline.mjs           # service worker, offline pages, checklist persistence
node scripts/check-overflow.mjs         # sideways scrolling on a 390 px phone
node scripts/perf-check.mjs             # size, load time and long tasks on a throttled phone
```

Adding a feed: write a module in `worker/feeds/` and register it in `FEEDS` in `worker/build-world-state.ts`. Give it `prefix` (events) or `counterIds` (counters) so old values are kept if it fails.

## Deployment

Cloudflare Pages, deployed by `.github/workflows/data.yml` on every push to `main` and twice an hour. It needs repository secrets `CLOUDFLARE_API_TOKEN` (Pages: Edit) and `CLOUDFLARE_ACCOUNT_ID`; without them it builds and skips the deploy. Any static host works. The export uses extensionless URLs (`/survive` is served from `survive.html`).

## Licence

The code is under the PolyForm Noncommercial License 1.0.0 (see `LICENSE`). Third-party data keep their own licences.

Licence note: the submarine-cable dataset is CC BY-NC-SA 3.0, so the project is non-commercial. If it ever becomes commercial, replace that layer.

## Ice and sea, asteroids, freshness, wiki

- Ice & Sea tab: NOAA satellite sea level and NSIDC sea-ice extent are live feeds; glacier (GlaMBIE) and ice-sheet (IMBIE) losses are published figures; 655 PSMSL tide gauges are a map layer (relative sea level, which includes land motion). Observed trends only.
- Asteroid tab: close approaches in Earth-Moon distances from NASA JPL, with the Sentry table counts (`public/data/asteroids.json`). It has no map layer.
- Tension pairs carry a `basis` and a one-sentence `why` (`data/dyads.json`); politically contestable pairs are marked `sensitive` and starred.
- Data freshness: every feed reports its newest observation time, latency and fetch time (`FeedStatus.dataAsOf`, `maxAgeHours`). The table is behind the Freshness button on the map and on /sources.
- Wiki layout (`components/WikiShell.tsx`): every informational page (Survive, Methodology, Sources, Nuclear, Health, Supervolcanoes, Trajectory, Countries, Links and the scenario pages) shows one section at a time with a sidebar; the section is in the URL as `?tab=`.
- Map view and camera controls are at the bottom right of the map; the left layer panel is a glass overlay.
- Progressive disclosure: the right panel shows the signal chip and one headline figure; basis, caveats, sources and secondary readouts sit in collapsible sections (`Section` in `components/dashboard/parts.tsx`). The left panel is the control centre: layers with live counts, quick filters, a mini context map, the selection card and the legend.

## Orbit, asteroid globe, military bases, matte UI

- Orbit tab: positions of about 19,000 catalogued satellites and tracked debris, computed in the worker with SGP4 from CelesTrak orbital elements (`worker/feeds/orbit.ts`, `public/data/orbit.json`, lazy-loaded). Positions are a snapshot for the stated UTC time. Debris covers four major breakups only. Elements are cached for 2 hours (CelesTrak's rule), also in CI.
- Asteroid tab: switches the map to the 3D globe, zoomed out, with a polar chart drawn around it (`components/dashboard/AsteroidOrbit.tsx`): angle is the approach date, radius the miss distance on a log scale, the dashed ring is the Moon orbit. JPL publishes no direction, so no flight paths are drawn.
- Conflict tab: a military-bases layer (Wikidata, CC0, about 3,900 entries; `scripts/build-bases.py`, committed output). It is a reference layer with uneven coverage, not an order of battle. Fleet positions are not public data and are not shown.
- Matte UI: no glow, blink, pulse, blur halos or scanlines; active states are solid fills with 1px borders; scenario tabs fit their text.
- Wiki frame: one site-wide tree (Preparedness, Scenario deep-dives, Data & methodology) in a fixed left pane, reading column limited to 3xl; Inter for text, JetBrains Mono for headings and tables.

## Early warning (alerts)

- Alert engine: `worker/alerts.ts` with fixed rules in `worker/alerts/rules.ts` (CRITICAL: M7.0+ earthquake, NWS tsunami Warning, Kp 8+). Run by `.github/workflows/alerts.yml` every 5 minutes; `npm run alerts -- --dry` prints what it would send, `npm run test:alerts` runs the rule tests.
- Telegram: new CRITICAL alerts are posted to a channel with type, severity, coordinates, time, source and a link to the dashboard tab. Add repository secrets `TELEGRAM_BOT_TOKEN` (from @BotFather, bot added as channel administrator) and `TELEGRAM_CHAT_ID`. No subscriber list is kept; sent ids live in the Actions cache.
- Browser: the dashboard polls `/data/alerts.json` and the fast feed on the `alerts-feed` branch every minute. A CRITICAL alert turns the top bar and screen edge red (slow pulse, static with reduced motion) and plays a quiet tone with a mute button.
- No DEFCON: it is not public data, so it is not shown.

## Weather tab and place search

- Weather tab: active tropical cyclones from the National Hurricane Center (`worker/feeds/cyclones.ts`, `public/data/cyclones.json`): current position, sustained wind, pressure and movement from the latest advisory. NHC forecast tracks are not drawn (the site shows observations only). Atlantic, East and Central Pacific only.
- Place search (left panel): coordinates or a name from a bundled list of countries and cities of 100,000+ people (`public/data/places.json`, GeoNames CC BY 4.0, built by `scripts/build-places.py`). No geocoding service is called.
- Ideas taken from God's Eye View (MIT); no code was copied. Not done on purpose: plate-reader camera maps, live public-camera video, sensor-look filters.
