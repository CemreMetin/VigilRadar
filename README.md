# Vigil (VigilRadar + VigilAlert)

Dünyadaki büyük depremleri ve çatışmaları izleyip "ne oldu, neyi etkileyebilir, bana etkisi ne, ne yapmalıyım" sorularına cevap veren ücretsiz bir analiz sitesi (VigilRadar, `/`) ve telefona eklenen bir hazırlık ve bildirim uygulaması (VigilAlert, `/alert`).

**Vigil resmi bir uyarı sistemi değildir ve erken uyarı vermez.** Veriler resmi ağlardan dakikalar içinde aktarılır; gecikme ve hata olabilir. Acil durumda 112'yi ara, AFAD'ın açıklamalarını izle.

Projenin tek belgesi **[VIGIL.md](VIGIL.md)**: Kısım A bağlamdır, Kısım B uygulama şartnamesidir. Kararların kaydı [docs/DECISIONS.md](docs/DECISIONS.md), senin yapacakların [docs/SETUP.md](docs/SETUP.md).

## Parçalar

| Parça | Yer | Ne yapar |
|---|---|---|
| Site | kök (`app/`, `components/`, `lib/`) | Next.js 16 statik dışa aktarım. Radar (`/`), Alert (`/alert`), `/about` (kaynaklar, gizlilik, veri tazeliği), eski `/library` ve `/metrics`. |
| `core/` | `core/` | Saf mantık: veri tipleri, birleştirme, il seviyeleri, bağlantılar, küresel durum. Site, Worker ve testler aynı kodu kullanır. |
| Worker | `daemon/` | Cloudflare Worker, dakikada bir deprem ve tsunami kaynaklarını çeker, durumu KV'ye yazar, Telegram ve Web Push gönderir. |
| Yavaş hat | `scripts/data/slow.mjs` | GDELT çatışma kümeleri ve IMF PortWatch boğaz verisi; GitHub Actions (`slow-data.yml`) her 30 dakikada Worker'a gönderir. |
| Eski hat | `worker/` | Eski Node veri hattı (`npm run data`); eski `/library` ve `/metrics` sayfaları ona bağlı. Dokunma. |

## Çalıştırma

```powershell
npm ci
npm run dev        # http://localhost:3000, yedek yolla (Worker olmadan da çalışır)
```

Worker adresini yerelde kullanmak için `.env.local` dosyasına `NEXT_PUBLIC_WORKER_URL=...` yaz (depoya girmez).

## Kontroller (her fazın sonunda yeşil olmalı)

```powershell
npx tsc --noEmit
npm run lint
npm test
npm run build
```

Tarayıcı kontrolleri (derlenmiş siteyi `node scripts/serve-out.mjs 8098` ile sun, sonra): `check-alert.mjs`, `check-print-alert.mjs`, `check-overflow.mjs`, `check-contrast.mjs`, `test-offline.mjs`. Komutlar `docs/SETUP.md` sonunda.

## Gizlilik

Çerez, analitik, hata izleme ya da üçüncü taraf script yok. Tarayıcıda yalnızca `localStorage` kullanılır (anahtarlar `/about` sayfasında listelidir). Sunucuda saklanan tek kişisel veri, bildirim açarsan Web Push abonelik adresi + seçtiğin il + dildir; bildirimi kapatınca silinir.
