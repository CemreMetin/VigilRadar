2026-11-18 · `/scenarios` → `/library` (aynı alt yollar), `public/_redirects` 301 ile eski bağlantıları korur · statik export'ta sunucu yönlendirmesi yok, Cloudflare Pages `_redirects` okur
2026-11-18 · `/metrics` yeni sayfa, `world_state.json`'daki tüm sayaçları `CounterPanel` ile listeler · VIGIL.md "14 sayaç" diyor, veride 18 var; hiçbiri silinmez
2026-11-18 · Ana sayfa boş kabuk (`/library` ve `/metrics` bağlantıları); `components/Dashboard.tsx` ve bağımlıları silinmedi, kullanılmıyor · Bölüm 0 kural 7 "silme, taşı"
2026-11-18 · `data.yml`: `schedule` ve `workflow_dispatch` kaldırıldı, yalnızca `main` push'unda çalışır; sır yoksa dağıtım zaten atlanıyor · Faz 0 maddesi
2026-11-18 · `alerts.yml` (5 dk cron, Telegram + `alerts-feed` dalı) dokunulmadı: site derlemesini tetiklemiyor, eski Telegram hattı; Faz 6'da yenisiyle değişecek
2026-11-18 · `scripts/flatten-segments.mjs` KALDIRILMADI · `prefetchInlining: false` olsa da istemci düzleştirilmiş `__next.<seg>.__PAGE__.txt` adlarını istiyor; dosyalar silinince tarayıcıda 404 görüldü (canlı sınama)
2026-11-18 · `scripts/build-search-index.mjs` `/metrics`'i atlıyor · WikiShell sayfası değil, 'Print whole page' düğmesi yok
2026-11-18 · Faz 6'da yeni bildirim hattı devreye girerken `alerts.yml` kapatılacak · aynı Telegram kanalına iki sistem yazmamalı
2026-11-18 · Test 1: Ankara için 5.1 tablosu P1 verir (469 km, M7.8, satır 7.5: P1 ≤ 500 km); Bölüm 12 "P2 veya yok" der · Tablo değiştirilmedi (tek kaynak config), test yalnızca "P0 değil" der; eşik kararı insana ait
2026-11-18 · Testler 7–10 (bildirim politikası) `it.todo` · Bölüm 13 bunları Faz 6'ya koyuyor; Faz 1 satırı "1–15" diyor, belge kendi içinde çelişiyor
2026-11-18 · Faz 1 `core/quakes/normalize.ts` yalnızca kabul kuralı (M4.0 TR kutusu, M5.0 dışı); kaynak ayrıştırıcıları Faz 3'te, canlı örnek yanıtlardan (kural 0.4)
2026-11-18 · Geri çekilme (retracted) bayrağı Faz 1'de hesaplanmıyor · "2 tur üst üste yok" durum gerektirir, KV Faz 3'te
2026-11-18 · Test fixture'ları elle yazıldı (il merkezleri, Daiichi yaklaşık; Akkuyu spec'ten) · places.tr.json ve plants.json Faz 2'de gelince değişecek
2026-11-18 · USGS `tsunami=1` bayrağı TR kıyı kuralında büyüklük/derinlik testinin yerine geçer; kıyı ili ≤100 km şartı kalır · Bölüm 5.5 "aynı etkiyi" ifadesinin en dar okuması
2026-11-18 · `@types/node` ^20 → ^22 · vitest 5 peer isteği (CI Node 22 ile uyumlu); `--force` kullanılmadı
