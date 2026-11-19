# SETUP: senin yapacakların

Bu adımları Claude Code yapmaz (hesap, sır ve kanal gerektirirler). Sırayla ilerle. Hiçbiri yapılmamışken de site derlenir ve yedek yol (tarayıcıdan USGS + EMSC) üzerinden çalışır; Worker, Telegram ve Web Push bunlar yapıldıkça açılır.

Komutlar PowerShell içindir. Sır değerlerini depoya, `docs/DECISIONS.md`'ye ya da bir sohbete yazma.

## 0. Hazırlık

```powershell
npm ci
npm test
npm run build
```

Hepsi yeşil olmalı. Worker kodu `daemon/` içinde, site kökte.

## 1. Cloudflare girişi ve KV

```powershell
cd daemon
npx wrangler login
npx wrangler whoami
```

`whoami` çıktısındaki hesap kimliğini (Account ID) not et. Birden çok hesabın varsa her `wrangler` komutundan önce şunu ver:

```powershell
$env:CLOUDFLARE_ACCOUNT_ID = "<hesap kimliğin>"
```

KV ad alanı (zaten oluşturulmuşsa atla; `daemon/wrangler.toml` içindeki `id` dolu):

```powershell
npx wrangler kv namespace create VIGIL
```

Yazdığı `id` değerini `daemon/wrangler.toml` içindeki `[[kv_namespaces]]` bölümüne yaz.

## 2. Telegram (isteğe bağlı; birincil bildirim kanalı)

1. Telegram'da `@BotFather` ile konuş: `/newbot`, ad ve kullanıcı adı ver. Verdiği bot belirtecini kopyala.
2. İki genel kanal aç: biri Türkiye için, biri küresel olaylar için. Genel kanal olduğu için `@kanaladi` biçiminde bir kullanıcı adı verirsin.
3. Botu **iki kanalın da yöneticisi** yap (Kanal → Yöneticiler → Yönetici ekle → botu seç; "Mesaj gönder" izni yeter).
4. Sırları gir (her biri sana değeri sorar, yapıştır):

```powershell
cd daemon
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_TR
npx wrangler secret put TELEGRAM_CHAT_GLOBAL
```

`TELEGRAM_CHAT_TR` ve `TELEGRAM_CHAT_GLOBAL` değerleri kanalın `@kanaladi` yazımıdır.

Türkiye kanalının davet bağlantısını (örn. `https://t.me/kanaladi`) 6. adımda `TELEGRAM_TR_URL` olarak gireceksin; Alert sayfası bu bağlantıyla "Telegram kanalına katıl" düğmesini gösterir. Tanımsızsa düğme gizlenir.

Kanallara ilk gerçek mesaj, ilk uygun deprem olduğunda kendiliğinden gider. Sınamak için bir deprem beklemek istemezsen kanala elle bir mesaj atıp botun yazabildiğini kontrol et.

## 3. Web Push anahtarı (isteğe bağlı)

```powershell
node scripts/vapid.mjs
```

İki satır yazar. Değerleri Worker sırrı olarak gir:

```powershell
cd daemon
npx wrangler secret put VAPID_PUBLIC_KEY
npx wrangler secret put VAPID_PRIVATE_KEY
npx wrangler secret put VAPID_SUBJECT
```

- `VAPID_PUBLIC_KEY`: ilk satırdaki değer.
- `VAPID_PRIVATE_KEY`: ikinci satırdaki, `{` ile başlayan **tek satırlık JSON'un tamamı**.
- `VAPID_SUBJECT`: bir `mailto:` adresi, örn. `mailto:sen@ornek.com`.

Üç değer de tanımlı değilse `GET /v1/vapid` `404` verir ve Alert sayfası bildirim düğmesini çalıştırmaz.

## 4. Yavaş hat için `INGEST_TOKEN`

Rastgele bir değer üret ve **aynı değeri** iki yere yaz:

```powershell
$t = -join ((48..57) + (97..122) | Get-Random -Count 40 | ForEach-Object { [char]$_ })
$t
cd daemon
$t | npx wrangler secret put INGEST_TOKEN
```

Sonra GitHub deposunda **Settings → Secrets and variables → Actions → New repository secret**:

- `INGEST_TOKEN`: yukarıdaki değer.
- `WORKER_URL`: Worker adresin, örn. `https://vigil-daemon.<alt-alan>.workers.dev` (sonda `/` olmasın).

`slow-data.yml` iş akışı her 30 dakikada GDELT ve PortWatch verisini çekip Worker'a gönderir. İki sır yoksa iş akışı hata vermeden adımları atlar. **Zamanlanmış iş akışları yalnızca `main` dalında çalışır**; dal birleşene kadar elle çalıştırmak için yerelde:

```powershell
$env:WORKER_URL = "https://vigil-daemon.<alt-alan>.workers.dev"
$env:INGEST_TOKEN = "<değer>"
npx tsx scripts/data/slow.mjs
```

## 5. `ALLOWED_ORIGINS`, `SITE_URL` ve Worker'ı yayınla

`daemon/wrangler.toml` içindeki `[vars]` bölümünü kendi adreslerinle düzenle:

```toml
[vars]
ALLOWED_ORIGINS = "http://localhost:3000,https://<site-adresin>"
SITE_URL = "https://<site-adresin>"
```

`ALLOWED_ORIGINS` yalnızca bu adreslere CORS izni verir; tarayıcıdan Worker'a bu listede olmayan bir adresle erişilemez (yedek yol devreye girer). Sonra:

```powershell
cd daemon
npx wrangler deploy
```

Doğrula:

```powershell
curl https://vigil-daemon.<alt-alan>.workers.dev/v1/health
curl https://vigil-daemon.<alt-alan>.workers.dev/v1/state
```

`/v1/health` yanıtında `ok: true` ve kaynak durumları görünmeli (cron bir dakika içinde ilk turunu çalıştırır).

## 6. Site: derleme değişkenleri ve Cloudflare Pages

Site GitHub Actions ile derlenir ve Pages'e yüklenir (`.github/workflows/data.yml`, yalnızca `main`'e push'ta). `NEXT_PUBLIC_*` değerleri **derleme anında** siteye gömülür; bu yüzden Pages panosuna değil, GitHub'a girilir:

- **Secret** `WORKER_URL`: 4. adımdaki aynı Worker adresi. İş akışı bunu `NEXT_PUBLIC_WORKER_URL` olarak derlemeye verir.
- **Variable** (Secrets sekmesinin yanındaki *Variables*) `TELEGRAM_TR_URL`: Türkiye kanalının bağlantısı. İş akışı bunu `NEXT_PUBLIC_TELEGRAM_TR_URL` yapar.

Yerel derleme için `.env.local` dosyasına (depoya girmez):

```
NEXT_PUBLIC_WORKER_URL=https://vigil-daemon.<alt-alan>.workers.dev
NEXT_PUBLIC_TELEGRAM_TR_URL=https://t.me/<kanaladi>
```

## 7. GitHub sırları: site dağıtımı

**Settings → Secrets and variables → Actions** altında:

- `CLOUDFLARE_API_TOKEN`: Cloudflare → Profil → API Tokens → *Create Token*, izin **Cloudflare Pages: Edit**.
- `CLOUDFLARE_ACCOUNT_ID`: Workers & Pages sayfasının sağındaki hesap kimliği.

İkisi de yoksa dağıtım adımı hata vermeden atlanır (site derlenir, yüklenmez).

## 8. İlk kontrol

Site yayında olunca, telefonda:

1. `/alert` aç → ilini seç → "Bu cihazda bildirim aç" (iOS'ta önce Paylaş → Ana Ekrana Ekle).
2. "Kriz ekranını dene" ile tatbikatı aç; fener, düdük ve "İyiyim mesajı" düğmelerini dene.
3. Uçak moduna al, `/alert`'i yeniden aç: çanta, fener ve düdük çalışmalı.
4. `/about` sayfasında "Veri tazeliği" tablosunda her kaynağın `tamam` olduğunu gör.

## Kontrol komutları

```powershell
npx tsc --noEmit
npm run lint
npm test
npm run build
node scripts/serve-out.mjs 8098        # ayrı bir pencerede
node scripts/check-alert.mjs http://localhost:8098
node scripts/check-print-alert.mjs http://localhost:8098
node scripts/check-overflow.mjs http://localhost:8098
node scripts/check-contrast.mjs http://localhost:8098
node scripts/test-offline.mjs http://localhost:8098
```

Tarayıcı kontrolleri makinedeki Edge ya da Chrome'u `playwright-core` ile kullanır.
