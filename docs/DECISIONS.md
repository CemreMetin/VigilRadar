2026-11-18 · `/scenarios` → `/library` (aynı alt yollar), `public/_redirects` 301 ile eski bağlantıları korur · statik export'ta sunucu yönlendirmesi yok, Cloudflare Pages `_redirects` okur
2026-11-18 · `/metrics` yeni sayfa, `world_state.json`'daki tüm sayaçları `CounterPanel` ile listeler · VIGIL.md "14 sayaç" diyor, veride 18 var; hiçbiri silinmez
2026-11-18 · Ana sayfa boş kabuk (`/library` ve `/metrics` bağlantıları); `components/Dashboard.tsx` ve bağımlıları silinmedi, kullanılmıyor · Bölüm 0 kural 7 "silme, taşı"
2026-11-18 · `data.yml`: `schedule` ve `workflow_dispatch` kaldırıldı, yalnızca `main` push'unda çalışır; sır yoksa dağıtım zaten atlanıyor · Faz 0 maddesi
2026-11-18 · `alerts.yml` (5 dk cron, Telegram + `alerts-feed` dalı) dokunulmadı: site derlemesini tetiklemiyor, eski Telegram hattı; Faz 6'da yenisiyle değişecek
2026-11-18 · `scripts/flatten-segments.mjs` KALDIRILMADI · `prefetchInlining: false` olsa da istemci düzleştirilmiş `__next.<seg>.__PAGE__.txt` adlarını istiyor; dosyalar silinince tarayıcıda 404 görüldü (canlı sınama)
2026-11-18 · `scripts/build-search-index.mjs` `/metrics`'i atlıyor · WikiShell sayfası değil, 'Print whole page' düğmesi yok
2026-11-18 · Faz 6'da yeni bildirim hattı devreye girerken `alerts.yml` kapatılacak · aynı Telegram kanalına iki sistem yazmamalı
