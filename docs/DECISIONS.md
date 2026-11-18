2026-11-18 · `/scenarios` → `/library` (aynı alt yollar), `public/_redirects` 301 ile eski bağlantıları korur · statik export'ta sunucu yönlendirmesi yok, Cloudflare Pages `_redirects` okur
2026-11-18 · `/metrics` yeni sayfa, `world_state.json`'daki tüm sayaçları `CounterPanel` ile listeler · VIGIL.md "14 sayaç" diyor, veride 18 var; hiçbiri silinmez
2026-11-18 · Ana sayfa boş kabuk (`/library` ve `/metrics` bağlantıları); `components/Dashboard.tsx` ve bağımlıları silinmedi, kullanılmıyor · Bölüm 0 kural 7 "silme, taşı"
2026-11-18 · `data.yml`: `schedule` ve `workflow_dispatch` kaldırıldı, yalnızca `main` push'unda çalışır; sır yoksa dağıtım zaten atlanıyor · Faz 0 maddesi
2026-11-18 · `alerts.yml` (5 dk cron, Telegram + `alerts-feed` dalı) dokunulmadı: site derlemesini tetiklemiyor, eski Telegram hattı; Faz 6'da yenisiyle değişecek
2026-11-18 · `scripts/flatten-segments.mjs` KALDIRILMADI · `prefetchInlining: false` olsa da istemci düzleştirilmiş `__next.<seg>.__PAGE__.txt` adlarını istiyor; dosyalar silinince tarayıcıda 404 görüldü (canlı sınama)
2026-11-18 · `scripts/build-search-index.mjs` `/metrics`'i atlıyor · WikiShell sayfası değil, 'Print whole page' düğmesi yok
2026-11-18 · Faz 6'da yeni bildirim hattı devreye girerken `alerts.yml` kapatılacak · aynı Telegram kanalına iki sistem yazmamalı
2026-11-18 · Faz 1 `core/quakes/normalize.ts` yalnızca kabul kuralı (M4.0 TR kutusu, M5.0 dışı); kaynak ayrıştırıcıları Faz 3'te, canlı örnek yanıtlardan (kural 0.4)
2026-11-18 · Geri çekilme (retracted) bayrağı Faz 1'de hesaplanmıyor · "2 tur üst üste yok" durum gerektirir, KV Faz 3'te
2026-11-18 · Test fixture'ları elle yazıldı (il merkezleri, Daiichi yaklaşık; Akkuyu spec'ten) · places.tr.json ve plants.json Faz 2'de gelince değişecek
2026-11-18 · USGS `tsunami=1` bayrağı TR kıyı kuralında büyüklük/derinlik testinin yerine geçer; kıyı ili ≤100 km şartı kalır · Bölüm 5.5 "aynı etkiyi" ifadesinin en dar okuması
2026-11-18 · `@types/node` ^20 → ^22 · vitest 5 peer isteği (CI Node 22 ile uyumlu); `--force` kullanılmadı
2026-11-18 · Test 1 Ankara çelişkisi: P1 sütunu 6.0→100, 6.5→150, 7.0→250, 7.5→350 olarak daraltıldı (VIGIL.md 5.1); Ankara (469 km, M7.8) artık P2 · insan kararı
2026-11-18 · Testler 7–10 Faz 6'da; VIGIL.md Faz 1 satırı '1–6 ve 11–15' olarak düzeltildi · insan onayı
2026-11-18 · Faz 2 çıktıları `{source, <liste>}` sarmalında (`places`, `plants`) · lisans atfı (ODbL, CC BY) dosyada taşınsın; world.json düz GeoJSON FeatureCollection
2026-11-18 · Plaka kodu GeoNames admin1 koduyla değil ad eşleştirmesiyle (admin1 kodları plaka değil, ör. Ankara=68) · Bölüm 4.3
2026-11-18 · `build-plants`: durum Operational/Under Construction, ad kökü + 5 km ile siteye indirgeme; 193 saha, Akkuyu 4 reaktör · yaklaşık koordinat, arayüzde belirtilecek (Faz 4)
2026-11-18 · Eski WRI `nuclear_plants.json` ve `places.json` dokunulmadı (eski sayfalar kullanıyor); yeni veri `public/data/static/` altında ayrı
2026-11-18 · `world.json 110m, 3 ondalık · Radar yedek yolunda yalnızca Faz 4'te yüklenir
