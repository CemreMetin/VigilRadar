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
2026-11-18 · Saat dilimi (scripts/probe/timezone.mjs, EMSC ile eşleştirme, 20 AFAD ve 32 Kandilli eşleşmesi): AFAD UTC (medyan fark 0,000 sa), Kandilli UTC+3 yerel saat (medyan 3,000 sa) · adaptörde AFAD_UTC_OFFSET_H=0, KANDILLI_UTC_OFFSET_H=3 sabitleri; sonuç core/__fixtures__/samples/timezone-result.json
2026-11-18 · Kandilli: http çalışıyor (200), https zaman aşımı (UND_ERR_CONNECT_TIMEOUT) · önce http, hata olursa https denenir, `enabled: true`
2026-11-18 · AFAD yedek POST (GetEventsByFilter) 401 verdi · yalnızca birincil `apiv2/event/filter` kullanılıyor; yedek eklenmedi
2026-11-18 · USGS ve EMSC CORS `*` (yedek yol Faz 4'te kullanılabilir); AFAD, Kandilli, tsunami.gov CORS yok, yalnızca Worker çeker
2026-11-18 · Tsunami seviyesi `Category:` satırından okunur, özet metninden değil · "Information" bültenlerinin metni "warning, advisory, or watch" sözcüklerini içerir; spec'in "anahtar kelime" tarifi sahte `warning` üretirdi
2026-11-18 · Adaptörler (ham → QuakeEvent) core/quakes/normalize.ts ve core/tsunami.ts içinde saf fonksiyon; daemon yalnızca fetch eder · Radar yedek yolu aynı kodu tarayıcıda kullanacak
2026-11-18 · Kalp atışı yalnızca dört deprem kaynağından en az biri yanıt verdiyse yazılır · hepsi çökmüşken "canlı" görünmemek için
2026-11-18 · State'e ek alan `global.reasonDetail` (yapısal neden) ve yanıta `fastAgeSec`, `slow` · UI nedeni biçimlendirebilsin; spec alanları değişmedi
2026-11-18 · wrangler.toml KV id'si `000…0` yer tutucu · gerçek id'yi insan yazar (Bölüm 14.1); `wrangler deploy --dry-run` geçti, gerçek deploy yapılmadı
2026-11-18 · Faz 3 kapsamı /v1/state ve /v1/health; /v1/vapid, /v1/push/*, /v1/ingest/slow sırasıyla Faz 6 ve Faz 5 · Bölüm 13
2026-11-18 · `/v1/state` `caches.default` ile 30 sn önbellekte; önbelleğe CORS başlıksız yazılır, çıkışta Origin'e göre eklenir; KV yalnızca önbellek boşken okunur · ücretsiz KV okuma sınırı
