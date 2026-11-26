# SETUP: kendi kopyanı yayınla

Dört adım. Hiçbiri yapılmamışken de site derlenir ve yedek yol (tarayıcıdan USGS + EMSC) üzerinden çalışır.

Komutlar PowerShell içindir. Sır değerlerini depoya, `docs/DECISIONS.md`'ye ya da bir sohbete yazma.

Önce her şeyin yeşil olduğunu gör:

```powershell
npm ci
```

```powershell
npm test
```

```powershell
npm run build
```

## 1. Cloudflare: KV ve Worker

```powershell
cd daemon
```

```powershell
npx wrangler login
```

```powershell
npx wrangler whoami
```

`whoami` çıktısındaki hesap kimliğini (Account ID) not et. Birden çok hesabın varsa her `wrangler` komutundan önce `$env:CLOUDFLARE_ACCOUNT_ID = "<hesap kimliğin>"` ver.

KV ad alanı (kendi kopyanda yeni bir tane oluştur):

```powershell
npx wrangler kv namespace create VIGIL
```

Yazdığı `id` değerini `daemon/wrangler.toml` içindeki `[[kv_namespaces]]` bölümüne yaz. Aynı dosyada `[vars]` bölümünü kendi adreslerinle düzenle:

```toml
[vars]
ALLOWED_ORIGINS = "http://localhost:3000,https://<site-adresin>"
SITE_URL = "https://<site-adresin>"
```

`ALLOWED_ORIGINS` yalnızca bu adreslere CORS izni verir. Sonra yayınla:

```powershell
npx wrangler deploy
```

Doğrula (cron bir dakika içinde ilk turunu çalıştırır; `/v1/health` yanıtında `ok: true` görünmeli):

```powershell
curl.exe https://vigil-daemon.<alt-alan>.workers.dev/v1/health
```

Worker adresi sitenin `public/_headers` dosyasındaki `connect-src` satırında da yazılıdır; kendi adresinle değiştir.

## 2. `INGEST_TOKEN` ve GitHub sırları

Rastgele bir değer üret ve Worker'a sır olarak ver:

```powershell
$t = -join ((48..57) + (97..122) | Get-Random -Count 40 | ForEach-Object { [char]$_ }); $t; $t | npx wrangler secret put INGEST_TOKEN
```

GitHub deposunda **Settings → Secrets and variables → Actions → New repository secret** ile dört sır gir:

| Sır | Değer |
|---|---|
| `INGEST_TOKEN` | az önce üretilen değer |
| `WORKER_URL` | Worker adresin (sonda `/` olmasın) |
| `CLOUDFLARE_API_TOKEN` | Cloudflare → Profil → API Tokens → *Create Token*, izin **Cloudflare Pages: Edit** |
| `CLOUDFLARE_ACCOUNT_ID` | Workers & Pages sayfasının sağındaki hesap kimliği |

`slow-data.yml` her 30 dakikada GDELT ve PortWatch verisini Worker'a gönderir (özel depoda dakika kotası için cron'u `0 * * * *` yapabilirsin). Zamanlanmış iş akışları yalnızca `main` dalında çalışır; birleşmeden önce elle denemek için:

```powershell
$env:WORKER_URL = "https://vigil-daemon.<alt-alan>.workers.dev"; $env:INGEST_TOKEN = "<değer>"; npx tsx scripts/data/slow.mjs
```

## 3. `main`'e birleştir ve Pages'e yayınla

`main`'e push, `.github/workflows/data.yml` iş akışını çalıştırır: test, tip ve lint kontrolü, derleme ve Cloudflare Pages'e yükleme (proje adı `vigilradar`; yoksa oluşturulur). Cloudflare sırları yoksa site derlenir ama yüklenmez.

`NEXT_PUBLIC_WORKER_URL` derleme anında siteye gömülür; iş akışı onu `WORKER_URL` sırrından alır. Yerel derleme için `.env.local` dosyasına (depoya girmez) yaz:

```
NEXT_PUBLIC_WORKER_URL=https://vigil-daemon.<alt-alan>.workers.dev
```

Yayından sonra: haritada **CANLI** modunda alt satırda `YEDEK KAYNAK` yazmamalı; `/about` sayfasındaki "Veri tazeliği" tablosunda kaynaklar `tamam` olmalı.

## 4. İsteğe bağlı: Telegram kanalı

1. Telegram'da `@BotFather` ile konuş: `/newbot`, ad ve kullanıcı adı ver; bot belirtecini kopyala.
2. İki genel kanal aç (Türkiye ve küresel) ve botu **ikisinin de yöneticisi** yap ("Mesaj gönder" izni yeter).
3. Sırları `daemon` klasöründe gir (her biri değeri sorar). Kanal değeri `@kanaladi` biçimindedir.

```powershell
npx wrangler secret put TELEGRAM_BOT_TOKEN
```

```powershell
npx wrangler secret put TELEGRAM_CHAT_TR
```

```powershell
npx wrangler secret put TELEGRAM_CHAT_GLOBAL
```

Sırlar yoksa Worker bildirim için KV'yi hiç okumaz ve yazmaz. İlk mesaj, ilk uygun deprem olduğunda gider.

## Kontrol komutları

```powershell
npx next typegen; npx tsc --noEmit; npm run lint; npm test; npm run build
```

Derlenmiş siteyi ayrı bir pencerede sun:

```powershell
node scripts/serve-out.mjs 8098
```

Sonra tarayıcı kontrolleri (makinedeki Edge ya da Chrome'u `playwright-core` ile kullanır):

```powershell
node scripts/check-overflow.mjs http://localhost:8098
```

```powershell
node scripts/check-contrast.mjs http://localhost:8098
```

```powershell
node scripts/test-offline.mjs http://localhost:8098
```

```powershell
node scripts/perf-check.mjs http://localhost:8098
```
