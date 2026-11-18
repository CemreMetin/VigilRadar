# CURRENT_STATE — Faz 0 başlangıcı (2026-11-18)

Bu belge Faz 0 öncesi depoyu anlatır; taşıma bittikten sonra "Faz 0 sonrası" bölümü eklenir. Tek geçerli kaynak `VIGIL.md`. `docs/archive/` yalnızca geçmiştir.

## Çatı
| Konu | Durum |
|---|---|
| Çatı | Next.js 16.4.5, App Router, `output: "export"` (statik, sunucu yok) |
| UI | React 19.2.8, Tailwind 4 (`@tailwindcss/postcss`), MapLibre GL 6.11.2, `satellite.js` |
| Dil | TypeScript 5, ESLint 9 (`eslint-config-next`), `tsx` ile testler |
| Paket yöneticisi | npm (`package-lock.json`); yerelde Node 26.7 / npm 11.19, CI'da Node 22 |
| Paket adı | `monitoring` (eski proje adı; yeniden adlandırma Faz kapsamında değil) |
| Kurulu ama kullanılmayan | `wrangler` 4.157.0, `fflate` (yalnızca script) |
| Test çerçevesi | Yok. `npm test` altı bağımsız `tsx` betiği çalıştırır (alert kuralları, geçiş bulucu, ateş ızgarası, blast, güneş-ay, üs filtresi). `vitest` Faz 1'de eklenecek |

## Router ve sayfalar (baseline)
`/`, `/country`, `/glossary`, `/health`, `/links`, `/methodology`, `/nuclear`, `/scenarios`, `/scenarios/[id]` (23 senaryo, SSG), `/sources`, `/supervolcanoes`, `/survive`, `/survive/pack`, `/trajectory`. Ana sayfa `components/Dashboard.tsx` (harita + sol/sağ paneller + sayaç paneli + senaryo menüsü) çizer. Yeni Cloudflare Worker `daemon/` altına yazılacak; yoksa henüz.

## Derleme adımları
- `postinstall` ve `prebuild`: `scripts/copy-vendor.mjs`
- `predev`: vendor + `npm run data:fast`
- `build`: `next build`; `postbuild`: `scripts/flatten-segments.mjs` + `scripts/build-search-index.mjs`
- `next.config.ts`: statik export, `images.unoptimized`, `experimental.prefetchInlining: false`
- Yardımcı: `npm run data` (tam), `data:fast`, `alerts`, `test:alerts`
- Doğrulama scriptleri (npm'e bağlı değil): `scripts/check-*.mjs`, `perf-check.mjs`, `test-offline.mjs`, `check-all.sh` (playwright-core)

**Baseline (Faz 0'a girerken): `tsc --noEmit`, `lint`, `test`, `build` hepsi yeşil.** Derleme 39 statik sayfa üretiyor.

## Eski veri hattı (`worker/`, silinmez)
`worker/build-world-state.ts` → `public/data/world_state.json` ve diğer `public/data/*.json` (repoda izlenir). `worker/feeds/*` kaynak adaptörleri (USGS, GDELT, PortWatch, JPL, FIRMS, WHO, NOAA vb.), `worker/alerts/*` Telegram kural motoru, `worker/links.ts`, `worker/geo.ts`, `worker/http.ts`. Sayfalar `public/data/` dosyalarını tarayıcıda `useJson` ile okur.
`scripts/build-*.py`: statik veri üreticileri (havalimanı, üs, BSL4, şehir, ülke, nükleer vb.).

## Veri iş akışları (`.github/workflows/`)
- `data.yml` ("data and deploy"): `push main` + **her saat iki kez cron** + manuel. `npm run data`, alert değerlendirme, test, tsc, lint, build, sonra Cloudflare Pages dağıtımı. Dağıtım sırları yoksa dağıtım adımı atlanıyor (zaten güvenli). Pages proje adı `monitoring`.
- `alerts.yml`: **her 5 dakikada** cron; USGS/NWS/Kp kurallarını çalıştırır, Telegram'a yollar (sır yoksa atlar), `alerts-feed` dalına yazar. Site derlemesini tetiklemez.

## Tasarım belirteçleri (`app/globals.css`)
Koyu tema: `--bg #050505`, `--panel`, `--line` (cyan %16), `--fg #d7e2ea`, `--fg-dim`, `--accent #00e5ff`. Tehdit renkleri: `--threat #ff003c`, `--conflict #ff6a00`, `--bio #b026ff`, `--safe #00ff41`, `--geo #ffb000`, `--space #c9d1ff`; grup renkleri `--grp-*`. Ölçüler: `--gap 12px`, `--left-w 252px`, `--right-w 364px`, `--topbar-h 96px`. Yazı: `--text-label 10px`, `--text-body 12px`, `--text-read 13px`, `--text-value 24px`, `--text-title 20px`. Fontlar `next/font` ile `--font-inter` ve `--font-mono-face`.

## Sayılar
- Senaryo: 23 (`data/scenarios.ts`).
- Sayaç: `world_state.json` içinde **18** (VIGIL.md "14" diyor; hiçbiri silinmez, hepsi `/metrics`'e gider).

## Faz 0 yapılacaklar (VIGIL.md Bölüm 13)
1. Bu belge. 2. Derleme zaten yeşil; `flatten-segments.mjs` gereksizse kaldır. 3. Senaryolar `/library`'ye, sayaçlar `/metrics`'e; ana sayfa boş kabuk. 4. `data.yml` zamanlanmış işini kapat, dağıtım yalnızca `main` push'unda.

## Faz 0 sonrası
- `app/scenarios` → `app/library` (23 senaryo, aynı alt yollar); `public/_redirects` eski `/scenarios*` adreslerini 301 ile yönlendirir. Yerel `serve-out.mjs` bu dosyayı okumaz, yalnızca Cloudflare Pages okur.
- `/metrics` yeni: `components/MetricsView.tsx`, 18 sayacın hepsi. Ana sayfa boş kabuk; `components/Dashboard.tsx` silinmedi, kullanılmıyor.
- `data.yml`: zamanlama ve manuel tetik kapalı, yalnızca `main` push'u. `alerts.yml` aynen duruyor.
- `flatten-segments.mjs` gerekli (canlı sınamayla doğrulandı), kalıyor.
- Kapı: `tsc`, `lint`, `test`, `build` yeşil.
