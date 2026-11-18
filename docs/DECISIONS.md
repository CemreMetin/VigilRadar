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
2026-11-18 · Canlı deploy: Radian Collective hesabı, KV `VIGIL` (id wrangler.toml'da), Worker https://vigil-daemon.radian-collective.workers.dev · hesap kimliği repoda yok, `CLOUDFLARE_ACCOUNT_ID` ortam değişkeniyle verilir (wrangler üç hesap görüyor)
2026-11-18 · İlk `wrangler deploy` sonrası cron ~20 dakika hiç çalışmadı (KV boş, /v1/state 503); aynı sürümün ikinci `wrangler deploy`'undan sonra ilk turda çalıştı · neden bilinmiyor; yeni kurulumda 2–3 dakikada state yoksa yeniden deploy dene
2026-11-18 · Canlı doğrulama (13:00–13:16 UTC): USGS, EMSC, AFAD, Kandilli (http:// çağrısı Cloudflare Workers'tan) ve tsunami.gov hepsi ok · `enabled: true` kalır; 12 birleşik deprem, TR kutusunda AFAD M4.3 ve Kandilli M4.9 ayrı kayıt, küresel durum NOMINAL
2026-11-18 · `workers.dev` adresine tarayıcı botları istek atıyor (/ ve /favicon.ico, 404) · normal, önlem gerekmiyor
2026-11-18 · Van Gölü incelemesi: AFAD M4.3 ve Kandilli M4.9 aynı deprem DEĞİL · AFAD 734442 (2026-11-17 15:57:45Z, 38.485 42.934, 13.6 km) Van Gölü'nde, Kandilli M4.9 (20261113030504, 2026-11-13 00:05:04Z, 34.767 24.949, 27.2 km) Girit açıklarında; arası ~2000 km
2026-11-18 · Van Gölü M4.3 üç kaynaktan doğru birleşiyor (canlı state): AFAD 15:57:45.000Z, Kandilli 20261117185745 yerel = 15:57:45.000Z, EMSC 15:57:45.010Z; konumlar ≤ 5 km, derinlik AFAD 13,61 / Kandilli 2,6 / EMSC 13,6 · Kandilli saat farkı bir kez uygulanıyor (test: core/__tests__/adapters.test.ts)
2026-11-18 · Girit M4.9 (Kandilli) EMSC M5.1 (20261113_0000002, 34.700 24.922, 45 km) ve USGS M5.1 (us7000txx9) ile aynı depremdir ama state'te tek kaynaklı: Worker USGS `4.5_day` ve EMSC `start=son 24 saat` çeker, Kandilli son 500 olayı verir · ilk kurulumda geriye dönük doldurma, kararlı durumda her deprem 24 saat içinde tüm kaynaklarda görülür; düzeltilmedi, 24 saati aşan eski tek kaynaklı kayıt 7 günde düşer
2026-11-18 · public/_headers connect-src: Worker adresi (sabit), earthquake.usgs.gov, www.seismicportal.eu eklendi; cartocdn eski /library haritası için kalır · Worker adresi değişirse (özel alan adı) bu satır da değişmeli
2026-11-18 · world.json: antimeridiyeni geçen halkalar (Rusya, Fiji) açılarak düzeltildi, Antarktika çıkarıldı (kutbu çevreler, Mercator'da çizilemez; deprem uyarısı kapsamı dışı) · 176 ülke
2026-11-19 · Triage kartı: Bölüm 10 metinleri core/content/tr.ts ve en.ts'te (TR kelimesi kelimesine, EN sadık çeviri); 10.1'deki "resmi tsunami uyarısı + kullanıcı ili kıyıda" satırı yalnızca kural tabanlı `tsunamiAdvice` (USGS bayrağı dahil) ile uygulandı, NTWC/PTWC bülteniyle depremi eşleştirmek Faz 5/6'ya kaldı
2026-11-19 · `ChokepointFlow.series?: number[]` (son 30 gün, eskiden yeniye) eklendi · boğaz kartının mini çizgisi için; yavaş hat (Faz 5) doldurur, yokken "Günlük seri henüz yok."
2026-11-19 · Harita tıklamasında 12 px'lik kutu sorgusu · boğaz çizgileri 1,5 px, parmakla tam isabet zor
2026-11-19 · Bölge seçili değilken kartın "Ne yapmalısın?" bölümü "—", "Sana etkisi" bölümü "İlini seç…" der · aksi halde büyük bir depremde "Yapman gereken bir şey yok" yanlış güvence olurdu
