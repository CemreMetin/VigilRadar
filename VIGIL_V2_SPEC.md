# VIGILRADAR v2 — MİMARİ ŞARTNAME (LIVE RADAR + LAPLACE CASCADE SIMULATOR)

Sürüm: 2026-11-27 · Sahibi: Cemre (Radian Collective) · Uygulayıcı: Claude Code  
Önceki sürüm arşivi: `VIGIL.md` (v1: VigilRadar + VigilAlert). Bu belge **v2** için tek bağlayıcı uygulama şartnamesidir.

---

## Bu belge nasıl kullanılır?
- **Cemre:** Kısım A'yı oku (3 dk). Beğenirsen Claude Code'a tek cümle ver:
  > `VIGIL_V2_SPEC.md dosyasını oku. Bölüm 0 kurallarına uyarak Kısım B'yi Faz 1'den Faz 6'ya sırayla uygula; soru sorma, her fazda tsc/lint/test/build yeşil olmadan geçme.`
- **Claude Code:** Kısım A'yı bağlam için bir kez oku, sonra **Kısım B'yi satır satır uygula**. Next.js 16.4.5 kuralları için `AGENTS.md` dosyasını dikkate al.

---
---

# KISIM A — VİZYON VE SADELEŞTİRME İLKESİ

## A1. VigilRadar v2 Nedir?
VigilRadar iki işi **tek bir sakin harita ekranında** birleştiren açık kaynaklı, **\$0/ay maliyetli**, sıfır-bakım bir küresel risk analiz masası ve **"What-If" Domino Simülatörüdür**:

1. **`LIVE` Modu (Canlı Radar):** Dünyada şu an gerçekleşen büyük depremleri (AFAD, Kandilli, USGS, EMSC), tsunami bültenlerini, doğrulanabilir çatışma kümelerini (GDELT) ve 6 deniz boğazının gemi trafiğini (IMF PortWatch) izleyip kritik altyapıya yakınlığını gösterir.
2. **`SIMULATE` Modu (Laplace Makinesi):** Rakiplerden (`WorldMonitor`, `IranMonitor`, `Liveuamap` vb.) ayrılan asıl özellik. Sadece *"burada bir şey oldu"* demek yerine, ***"Hürmüz %75 kapanırsa, Tayvan'da büyük deprem olursa ya da Kızıldeniz kabloları koparsa — SEÇTİĞİM ÜLKEYİ hangi 5 kanaldan, hangi sırayla ve kaç hafta içinde etkiler?"*** sorusunu deterministik, şeffaf ve görsel bir domino dalgası olarak oynatır.

## A2. Neden Sade? (Karmaşıklığa Karşı 4 Kırmızı Çizgi)
Eski `MONITORING` sitesi 15 ayrı sayfa, 20 katman kutucuğu ve menü içinde menüler yüzünden yorucuydu. v2 bu hatayı **asla** tekrarlamaz:
1. **Üst menüde yalnızca 3 başlık var:** `Map` (`/`) · `Scenarios` (`/library`) · `About` (`/about`) + `EN | TR`.
2. **Tek ekran, 2 temiz mod:** `LIVE` açıkken yalnızca canlı olaylar görünür; `SIMULATE` açılınca canlı noktalar solar ve yalnızca seçili şok, etki ısı haritası (ülke renkleri), animasyonlu yaylar ve seçili ülkenin domino kartı görünür. İkisi asla üst üste binmez.
3. **Sıfır açılır pencere, sıfır 20'li katman listesi, sıfır jargon duvarı:** İlk kez giren biri 5 saniyede bir şoka tıklar, zaman sürgüsünü oynatır, kendi ülkesine tıklar ve anlar.
4. **Sıfır AI falı, tam bilimsel dürüstlük:** Tüm Laplace hesaplamaları `core/laplace/` içinde şeffaf, deterministik TypeScript formülleriyle tarayıcıda çalışır. Her adımın yanında kanıt derecesi (`A / B / C`) ve gerçek kaynak (`EIA`, `IMF PortWatch`, `FAO`, `World Bank`, `TeleGeography`, `SIPRI`) yazar.

## A3. VigilAlert ve \$0/ay Otomatik Çalışma
- **VigilAlert (`/alert`) ve Web Push** şimdilik `git tag archive-vigil-alert` ile güvenle arşive alınır ve aktif siteden + Worker'dan çıkarılır. İleride geri dönülmek istenirse tüm kod git tarihinde eksiksiz durur.
- Web Push/abonelik yükü kalktığı için Cloudflare Worker'ın günlük KV yazma tüketimi **~400/1.000** seviyesinde, CPU süresi **<2 ms** (limit 10 ms) kalır → **ömür boyu \$0/ay, Pazar günü 2 dakikalık `/about` kontrolü dışında sıfır bakım.**

---
---

# KISIM B — BAĞLAYICI UYGULAMA ŞARTNAMESİ (CLAUDE CODE İÇİN)

## 0. ÇALIŞMA KURALLARI VE ANTİ-KARMAŞIKLIK SINIRLARI

1. **Soru sorma.** Belgenin cevaplamadığı küçük ayrıntıda en basit, en sade seçeneği uygula ve `docs/DECISIONS.md` dosyasına tek satır ekle (`tarih · karar · gerekçe`).
2. **Yeni ağır kütüphane ekleme.** Gerekli her şey (`maplibre-gl`, `next`, `react`, `tailwindcss`, `fflate`, `vitest`, `wrangler`, `tsx`) zaten kurulu. `package.json` içine yeni runtime bağımlılığı ekleme.
3. **Next.js 16 uyumu:** App Router dosyalarını düzenlemeden önce `AGENTS.md` notuna uy; statik export (`output: "export"`) asla bozulmasın.
4. **Görsel bütçe (kesin):**
   - Üst çubuk: tek satır (masaüstünde ≤ 52 px).
   - Alt kontrol çubuğu (`SIMULATE` modunda): tek satır (≤ 52 px).
   - Sağ bilgi çekmecesi: masaüstünde `380px`, mobilde alttan açılır çekmece (`max-h-[60dvh]`).
   - Haritanın üstüne binen çoklu yüzen cam panel, 10+ katman checkbox'ı, modal pencere, gölge veya neon parıltı **YASAK**. Mevcut mat koyu palet (`app/globals.css`: `--bg #050505`, `--panel-solid #0a0f14`, `--accent #00e5ff`, `--geo #ffb000`, `--conflict #ff6a00`, `--threat #ff003c`, 1 px düz kenarlık, `border-radius ≤ 2px`) korunur.
5. **Üst menü sınırı (kesin):** Tüm sayfalarda ortak navigasyonda en fazla **3** ana bağlantı: `Map` (`/`), `Scenarios` (`/library`), `About` (`/about`) + `EN | TR`. Eski `MONITORING` adı ve 15 maddelik `PagesMenu` açılır listesi kaldırılır.
6. **Çift dil (EN + TR):** Kod ve yorumlar İngilizce; tüm yeni arayüz metinleri hem **İngilizce** hem **Türkçe** (`core/content/` ve `core/laplace/copy.ts`). Varsayılan dil: `navigator.language` `tr` ile başlıyorsa TR, değilse EN.
7. **Mevcut hazineyi koru, kırıkları düzelt:** `/library`, `/library/[id]`, `/links`, `/nuclear`, `/supervolcanoes`, `/trajectory`, `/metrics`, `/country`, `/survive`, `/methodology`, `/sources`, `/glossary` sayfaları silinmez; yalnızca kırık linkleri (`/?sc=...`) düzeltilir ve ortak `VIGILRADAR` başlığına bağlanır.
8. **Her faz kapısı:** Her faz sonunda şu dört komut yeşil olmadan sonraki faza geçme ve tek commit at (`v2-faz-N: özet`):
   ```powershell
   npx tsc --noEmit
   npm run lint
   npm test
   npm run build
   ```

---

## 1. FAZ 1 — VIGILALERT ARŞİVLEME VE TEMEL BUG DÜZELTMELERİ

### 1.1 VigilAlert'i Arşivle ve Temizle
1. İlk iş olarak mevcut temiz durumu etiketle (etiket zaten varsa atla):
   `git tag -a archive-vigil-alert -m "Archive VigilAlert PWA and Web Push before v2 Laplace pivot"`
   *(Eğer ortam `.git` yazımına izin vermezse `docs/DECISIONS.md`'ye not düşüp devam et; kullanıcı elle etiketler.)*
2. Şu Alert dosyalarını sil (git tarihinde `archive-vigil-alert` ile tam olarak saklı kalacaklar):
   - `app/alert/`
   - `components/alert/`
   - `lib/alert/`
   - `core/content/alert.ts`
   - `scripts/check-alert.mjs`
   - `scripts/check-print-alert.mjs`
   - `daemon/src/subs.ts`
   - `daemon/src/notify/webpush.ts`
   - `daemon/src/__tests__/webpush.test.ts`
   - `scripts/vapid.mjs`
3. `daemon/` temizliği:
   - `daemon/src/http.ts`: `/v1/vapid`, `/v1/push/subscribe`, `/v1/push/unsubscribe` uçlarını kaldır. `GET /v1/state`, `GET /v1/health`, `POST /v1/ingest/slow` aynen kalır.
   - `daemon/src/env.ts`: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` alanlarını kaldır.
   - `daemon/src/notify/dispatch.ts`: Web Push dağıtımını (`deliverPush`, `push` kuyruğu, `on.push`) kaldır; isteğe bağlı **Telegram** kanalı sırlar tanımlıysa çalışmaya devam etsin (sır yoksa sıfır KV okuma/yazma).
   - `daemon/src/__tests__/notify.test.ts` ve `daemon/src/__tests__/daemon.test.ts`: kaldırılan push/subscribe testlerini çıkar, kalan Telegram + state + health + ingest testlerini yeşil tut.
4. Site / PWA temizliği:
   - `public/manifest.webmanifest`: `start_url: "/"`, `shortcuts` içinde `/alert` yerine `[{ name: "Radar", url: "/" }, { name: "Laplace", url: "/?mode=sim" }, { name: "Scenarios", url: "/library" }]`.
   - `public/sw.js`: `push` ve `notificationclick` dinleyicilerini kaldır; çevrimdışı navigasyon yedeği `/` olsun.
   - `components/PwaRegister.tsx`: precache listesi `["/", "/library", "/about", "/manifest.webmanifest"]`, flag `"vigil.precached.v2"`.
   - `components/radar/RadarScreen.tsx`: footer'dan `/alert` linkini kaldır.
   - `core/content/about.ts`: gizlilik metninden Web Push/abonelik cümlesini çıkar ("Sunucuda hiçbir kişisel veri saklanmaz" — artık %100 doğru!). `STORAGE_KEYS` listesini yeni gerçek anahtarlarla eşle: `["vigil.region", "vigil.lang", "vigil.lastState", "vigil.hintDismissed", "vigil.precached.v2"]`.
   - `lib/radar/about.test.ts`: tarama listesinden `components/alert/AlertScreen.tsx` dosyasını çıkar.
   - `scripts/check-overflow.mjs`, `scripts/check-contrast.mjs`, `scripts/test-offline.mjs`: `/alert` yollarını `/?mode=sim&shock=hormuz` ve `/library` ile güncelle.

### 1.2 Gerçek Kod Bug'larını Düzelt (v1 Denetim Bulguları)
1. **`retracted` (Geri Çekilen Deprem) Takibi:**
   - Sorun: `core/quakes/merge.ts` ve `daemon/src/index.ts` içinde hiçbir kod `retracted: true` üretmiyor; `policy.ts`'teki iptal mantığı ölü kod olarak kalmış.
   - Çözüm:
     - `MergedQuake` tipine isteğe bağlı `missedTurns?: number` ekle (`core/types.ts`).
     - `mergeQuakes(prev, incoming, nowMs, okSources?)` fonksiyonuna bu turda başarılı yanıt veren kaynaklar (`okSources?: ReadonlySet<QuakeSource>`) parametresi ekle (eski çağrılarla geriye dönük uyumlu, varsayılan `undefined`).
     - Son **6 saat** içindeki mevcut bir olayın tüm `sources` üyeleri o turda `okSources` içinde yer alan kaynaklara ait olduğu halde `incoming` listesinde **hiçbiri** yoksa `missedTurns = (prev.missedTurns ?? 0) + 1`; herhangi biri tekrar görünürse `missedTurns = 0`.
     - `missedTurns >= 2` olunca `retracted = true` set et. (Bir kaynak hata verip zaman aşımına uğradıysa `okSources` içinde olmayacağı için sahte geri çekme üretmez!)
     - `core/build-state.ts`: `ok` haritasından `okSources` setini oluşturup `mergeQuakes`'e geçir.
     - `core/__tests__/quakes.test.ts`: 2 tur üst üste kaybolan son 6 saatlik olayın `retracted: true` olduğunu, kaynak çökmüşse `retracted` olmadığını test et.
2. **Telegram Mesaj Düzeltmeleri (`daemon/src/notify/message.ts`):**
   - Kıyı tsunami satırını elle `mag >= minMag && depth <= maxDepth` kontrolü yerine `core/tsunami.ts` içindeki `provinceTsunamiAdvice` ile hesapla (100 km kıyı mesafesi + `usgsTsunami` bayrağı tutarlı olsun; `Notice` tipine `usgsTsunami?: boolean` ekle).
   - Saat biçimine zaman dilimi ekle: TR mesajlarında `TRT` (UTC+3), GLOBAL mesajlarda `UTC` (`new Date(ms).toISOString().slice(11, 16) + " UTC"`).
   - Telegram mesajındaki bağlantı `${siteUrl}/?q=${encodeURIComponent(n.eventId)}` olarak Radar'da ilgili depremi doğrudan açsın (`/alert` kaldırıldığı için).
3. **Harita Boşta 60 FPS Pil Tüketimi (`components/radar/RadarMap.tsx`):**
   - `pulse()` içindeki `requestAnimationFrame` döngüsü yalnızca animasyonlu bir öğe (`hasHalo` veya aktif simülasyon yayları) varsa ve `prefers-reduced-motion` kapalıysa çalışsın; boşta dururken `cancelAnimationFrame` ile tamamen dursun.

---

## 2. FAZ 2 — LAPLACE DETERMİNİSTİK KASKAT MOTORU (`core/laplace/`)

Tamamen saf TypeScript (DOM yok, `fetch` yok, Node API yok). Tarayıcıda 60fps sıfır maliyetle çalışır.

### 2.1 Dosya Yapısı
```
core/laplace/
  types.ts          tipler: ShockId, ChannelId, ShockDef, CountryProfile, SimulationResult, DominoStep
  shocks.ts         8 kanonik küresel şok tanımı + zaman/kanal profilleri + gerçek kaynak atıfları
  countries.ts      ~40 kilit ekonomi bağımlılık vektörü + world.json ad eşleme tablosu + genel yedek (fallback) üretici
  engine.ts         saf simülasyon fonksiyonları: simulate(), dominoChain(), encodeSimQuery(), decodeSimQuery()
  copy.ts           EN + TR şok açıklamaları, kanal adları ve domino şablonları
  __tests__/
    laplace.test.ts kapsamlı birim testleri
```

### 2.2 Veri Tipleri (`core/laplace/types.ts`)
```ts
export type ShockId =
  | "hormuz"
  | "suez"
  | "taiwan"
  | "redsea-cables"
  | "blacksea"
  | "panama"
  | "volcano-vei7"
  | "solar-g5";

export type ChannelId = "energy" | "trade" | "food" | "digital" | "macro";
export type ImpactTier = "none" | "low" | "moderate" | "high" | "severe";
export type EvidenceGrade = "A" | "B" | "C";

export interface ShockDef {
  id: ShockId;
  lat: number;
  lon: number;
  /** Which contextual infrastructure layer lights up on the map during this shock */
  infra: "chokepoint" | "cables" | "volcano" | "plants" | "grid";
  /** Optional link to existing /library/[id] deep-dive page */
  libraryId?: string;
  /** Optional link to live PortWatch chokepoint key */
  chokepointKey?: "hormuz" | "suez" | "mandeb" | "malacca" | "panama" | "bosporus";
  /** Relative channel weights (0..1) and timing in days */
  channels: Record<ChannelId, { weight: number; onsetDay: number; peakDay: number; persistence: number }>;
  /** Global spillover floor for non-direct countries (0..0.45) */
  globalSpillover: Partial<Record<ChannelId, number>>;
  sources: string[]; // e.g. ["EIA", "IMF PortWatch", "UN Comtrade"]
}

export interface CountryExposure {
  iso3: string;
  /** Exact `properties.name` in `public/data/static/world.json` */
  mapName: string;
  name: { en: string; tr: string };
  region: "europe" | "mena" | "east-asia" | "south-asia" | "se-asia" | "north-america" | "latam" | "africa" | "oceania" | "eurasia";
  lat: number;
  lon: number;
  /** Calibrated structural exposure 0..1 per shock */
  shocks: Partial<Record<ShockId, Partial<Record<ChannelId, number>>>>;
  /** Concise grounded structural note per shock (optional override for top impacted countries) */
  notes?: Partial<Record<ShockId, { en: string; tr: string; source: string }>>;
}

export interface CountryImpact {
  iso3: string;
  mapName: string;
  name: { en: string; tr: string };
  lat: number;
  lon: number;
  total: number; // 0..100
  channels: Record<ChannelId, number>; // 0..100
  dominant: ChannelId;
  tier: ImpactTier;
  order: 1 | 2 | 3; // 1 = direct physical/corridor, 2 = regional/supply, 3 = global price spillover
  peakWindowDays: [number, number];
  profiled: boolean; // true = explicit 40-country profile (Evidence B), false = universal fallback (Evidence C)
}

export interface DominoStep {
  step: 1 | 2 | 3;
  timing: { en: string; tr: string }; // e.g. "Day 1–3" / "Gün 1–3"
  evidence: EvidenceGrade;
  channel: ChannelId;
  text: { en: string; tr: string };
  source: string;
}

export interface CascadeArc {
  iso3: string;
  mapName: string;
  from: [number, number]; // [lon, lat]
  to: [number, number];
  score: number; // 0..100
  channel: ChannelId;
  order: 1 | 2 | 3;
}

export interface SimulationResult {
  shock: ShockDef;
  severity: number; // 0.1..1.0
  day: number; // 1..180
  byIso3: Record<string, CountryImpact>;
  byMapName: Record<string, CountryImpact>;
  topAffected: CountryImpact[]; // sorted desc by total, top 12
  arcs: CascadeArc[]; // top 14 countries with total >= 18
  globalIndex: number; // 0..100 weighted summary
}
```

### 2.3 8 Kanonik Şok Tanımı (`core/laplace/shocks.ts`)
Her şok gerçek dünya mekaniğine dayanır:
1. **`hormuz`** (`26.56, 56.25`, `infra: "chokepoint"`, `chokepointKey: "hormuz"`):
   - Küresel deniz petrolünün ~%20'si ve LNG'nin ~%20'si.
   - Baskın kanallar: `energy` (onset 1g, peak 14g), `macro` (onset 5g, peak 30g), `trade` (onset 3g, peak 21g), `food` (gübre/enerji maliyeti, onset 21g, peak 60g).
   - Kaynaklar: `EIA`, `IMF PortWatch`, `IEA`.
2. **`suez`** (`30.0, 32.55`, `infra: "chokepoint"`, `chokepointKey: "suez"`):
   - Asya–Avrupa konteyner hattı + Babülmendep. Ümit Burnu'na yönelim +10–14 gün.
   - Baskın kanallar: `trade` (onset 2g, peak 21g), `energy` (onset 5g, peak 25g), `macro` (navlun/enflasyon, onset 10g, peak 45g), `food` (onset 14g, peak 45g).
   - Kaynaklar: `IMF PortWatch`, `UNCTAD`, `EIA`.
3. **`taiwan`** (`23.7, 120.96`, `infra: "cables"`):
   - Küresel ileri mantık çiplerinin (~%90) ve Doğu Asya konteyner/kablo koridorunun kesintisi.
   - Baskın kanallar: `digital` (onset 3g, peak 45g), `trade` (onset 2g, peak 30g), `macro` (onset 7g, peak 60g).
   - Kaynaklar: `SIA`, `UN Comtrade`, `TeleGeography`.
4. **`redsea-cables`** (`12.6, 43.3`, `infra: "cables"`):
   - Kızıldeniz / Babülmendep dar geçidindeki Avrupa–Asya–Doğu Afrika denizaltı fiber koridoru kopması (haritada `public/data/cables.json` aydınlanır!).
   - Baskın kanallar: `digital` (onset 1g, peak 7g, onarım ~30–60g), `macro` (finans/bulut gecikmesi, onset 1g, peak 14g), `trade` (onset 2g, peak 14g).
   - Kaynaklar: `TeleGeography`, `ICPC`.
5. **`blacksea`** (`41.12, 29.07`, `infra: "chokepoint"`, `chokepointKey: "bosporus"`):
   - Karadeniz tahıl, ayçiçek yağı, gübre ve ham petrol çıkış kapısı (İstanbul Boğazı / Karadeniz limanları).
   - Baskın kanallar: `food` (onset 5g, peak 30g), `energy` (onset 3g, peak 21g), `trade` (onset 2g, peak 18g), `macro` (onset 10g, peak 45g).
   - Kaynaklar: `FAO`, `IMF PortWatch`, `UN Comtrade`.
6. **`panama`** (`9.08, -79.9`, `infra: "chokepoint"`, `chokepointKey: "panama"`):
   - Şiddetli kuraklık / Gatún Gölü seviye düşüşü nedeniyle günlük geçiş kısıtı (ABD Doğu Kıyısı–Asya konteyner, tahıl, LNG).
   - Baskın kanallar: `trade` (onset 3g, peak 30g), `food` (onset 10g, peak 45g), `energy` (onset 7g, peak 30g), `macro` (onset 14g, peak 60g).
   - Kaynaklar: `Panama Canal Authority`, `IMF PortWatch`, `UNCTAD`.
7. **`volcano-vei7`** (`-8.25, 118.0`, `infra: "volcano"`, `libraryId: "supervolcano"`):
   - Tambora 1815 ölçeğinde (VEI 7) stratosferik sülfat örtüsü: 1–2 yıl boyunca 0,5–1,0 °C küresel soğuma, havacılık kesintisi ve hasat kaybı.
   - Baskın kanallar: `trade` (havacılık/kül, onset 1g, peak 14g), `food` (hasat/fiyat şoku, onset 30g, peak 150g), `macro` (onset 21g, peak 120g), `energy` (kış ısınma talebi, onset 45g, peak 150g).
   - Kaynaklar: `Robock (2000)`, `Raible et al. (2016)`, `FAO`.
8. **`solar-g5`** (`62.0, 0.0`, `infra: "grid"`, `libraryId: "solar-storm"`):
   - Carrington ölçeğinde (G5) jeomanyetik fırtına: yüksek enlem (|lat| ≥ 45°) elektrik şebekelerinde GIC transformatör riski, GNSS/uydu ve HF haberleşme kesintisi.
   - Baskın kanallar: `digital` (GNSS/uydu, onset 1g, peak 3g), `energy` (yüksek enlem şebeke, onset 1g, peak 7g), `trade` (havacılık/lojistik, onset 1g, peak 10g), `macro` (onset 3g, peak 30g).
   - Kaynaklar: `NOAA SWPC`, `Lloyds / AER`, `USGS Geomagnetism`.

### 2.4 ~40 Kilit Ekonomi + 176 Ülke Yedek Modeli (`core/laplace/countries.ts`)
- **40 Kilit Ülke** (her birinin `mapName` alanı `public/data/static/world.json` içindeki `properties.name` ile **birebir** eşleşmeli — testle doğrulanır!):
  `TUR` (`Turkey`), `USA` (`United States of America`), `CHN` (`China`), `DEU` (`Germany`), `JPN` (`Japan`), `KOR` (`South Korea`), `IND` (`India`), `GBR` (`United Kingdom`), `FRA` (`France`), `ITA` (`Italy`), `ESP` (`Spain`), `NLD` (`Netherlands`), `POL` (`Poland`), `SWE` (`Sweden`), `NOR` (`Norway`), `FIN` (`Finland`), `CAN` (`Canada`), `MEX` (`Mexico`), `BRA` (`Brazil`), `ARG` (`Argentina`), `RUS` (`Russia`), `UKR` (`Ukraine`), `EGY` (`Egypt`), `SAU` (`Saudi Arabia`), `IRN` (`Iran`), `ARE` (`United Arab Emirates`), `QAT` (`Qatar`), `IRQ` (`Iraq`), `ISR` (`Israel`), `LBN` (`Lebanon`), `TUN` (`Tunisia`), `MAR` (`Morocco`), `ZAF` (`South Africa`), `NGA` (`Nigeria`), `KEN` (`Kenya`), `PAK` (`Pakistan`), `IDN` (`Indonesia`), `MYS` (`Malaysia`), `THA` (`Thailand`), `VNM` (`Vietnam`), `TWN` (`Taiwan`), `AUS` (`Australia`), `NZL` (`New Zealand`), `CHL` (`Chile`). *(44 ülke — hepsi `world.json` içinde mevcut!)*
- **Kalan ~132 Ülke İçin Otomatik Yedek Model:**
  - `public/data/country_profiles.json` içindeki `lat`, `lon`, `hunger.value`, `water.value`, `plants` verileri + `world.json` ad listesi kullanılarak derleme/çalışma anında otomatik türetilir:
    - `globalSpillover` tabanı + `food` kanalında `hunger` kırılganlık çarpanı (`hunger > 10` ise +0.25'e kadar),
    - `solar-g5` için enlem formülü (`clamp((|lat| - 35) / 30, 0.1, 1.0)`),
    - Şok merkezine coğrafi yakınlık bonusu (`haversineKm < 2500 km` için yumuşak bölgesel katsayı).
  - Bu sayede haritada **tıklanabilen 176 ülkenin tamamı** anlamlı skor, 5 kanal ve 3 adımlı domino zinciri üretir; profili olmayan ülkelerde açıkça `C — bölgesel / küresel yansıma modeli` yazar.

### 2.5 Deterministik Dalga Matematiği (`core/laplace/engine.ts`)
- **Zaman dalgası fonksiyonu `waveFactor(day, onsetDay, peakDay, persistence)`:**
  - `day < onsetDay`: `0.08 * (day / Math.max(1, onsetDay))` (erken piyasa/beklenti sinyali)
  - `onsetDay <= day <= peakDay`: yumuşak S-eğrisi (smoothstep `0.08 → 1.0`)
  - `day > peakDay`: `persistence + (1 - persistence) * Math.exp(-(day - peakDay) / 90)` (bazı şoklar ör. kablo kesintisi zamanla onarılır `persistence ≈ 0.35`, bazıları ör. volkanik soğuma kalıcıdır `persistence ≈ 0.85`).
- **Kanal skoru:** `Math.round(100 * clamp(rawExposure * shock.channels[ch].weight * severity * waveFactor(...), 0, 1))`
- **Toplam ülke skoru:** 5 kanalın ağırlıklı bileşimi (en yüksek kanalın ağırlığı baskın olacak şekilde: `0.55 * maxChannel + 0.45 * avgTop3Channels`, 0..100 tamsayı) → böylece tek bir kanalda çok sert vurulan ülke (ör. Hürmüz'de Japonya'nın enerjisi) ortalama yüzünden yapay olarak sönük kalmaz.
- **Tier eşikleri:** `< 12` `none`, `12–29` `low`, `30–54` `moderate`, `55–74` `high`, `≥ 75` `severe`.
- **URL serileştirme (`encodeSimQuery` / `decodeSimQuery`):**
  - `?mode=sim&shock=hormuz&sev=75&day=30&country=TUR`
  - Geçersiz parametrelerde güvenli varsayılanlara (`shock: "hormuz"`, `sev: 75`, `day: 30`) düşer.

---

## 3. FAZ 3 — LAPLACE ETKİLEŞİMLİ HARİTA VE ARAYÜZÜ (`/`)

### 3.1 Yerleşim (Tek Ekran, 2 Mod — Sıfır Karmaşa)
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ VIGILRADAR   [ ● LIVE | ◈ SIMULATE ]   Map · Scenarios · About   [TR|EN]     │
├──────────────────────────────────────────────────────────┬───────────────────┤
│ (SIMULATE modunda tek satır 8 şok çipi:)                 │  IMPACT: TURKEY   │
│ [Hormuz][Suez][Taiwan][Red Sea Cables][Black Sea]...     │  68/100 · HIGH    │
│                                                          │  Peak: Day 14–45  │
│                    MAPLIBRE HARİTA                       │                   │
│  • LIVE: depremler, çatışmalar, santraller, boğazlar     │  5 CHANNELS:      │
│  • SIMULATE:                                             │  Energy   ████░   │
│    - 176 ülke ısı haritası (choropleth)                  │  Trade    ███░░   │
│    - Şok merkezi + bağlamsal altyapı (kablo/boğaz/kaldera)│ Food     ██░░░   │
│    - Animasyonlu domino yayları (top 14 ülke)            │  Digital  █░░░░   │
│    - Herhangi bir ülkeye tıkla → sağ kart anında açılır  │  Prices   ████░   │
│                                                          │                   │
│                                                          │  DOMINO CHAIN:    │
│                                                          │  1. Day 1 [A] ... │
│                                                          │  2. Wk 2  [B] ... │
│                                                          │  3. Mo 1  [B] ... │
│                                                          │                   │
│                                                          │  MOST AFFECTED:   │
│                                                          │  JPN 89 · KOR 84… │
├──────────────────────────────────────────────────────────┴───────────────────┤
│ SIMULATE ALT ÇUBUK: Severity [━━● 75%]  [▶] Day 30 [━━●━━━ 180]   [Share ↗] │
│ LIVE ALT ÇUBUK:     KÜRESEL: NOMINAL · 6 boğaz izleniyor · kaynaklar/hakkında│
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Harita Görsel Kalitesi (`components/radar/RadarMap.tsx` + `lib/radar/laplaceGeo.ts`)
- **Isı Haritası Renk Skalası (Mat, Bilimsel, Yüksek Kontrast):**
  - `none` (<12): `#0a0f14` (normal kara rengi)
  - `low` (12–29): `#1d2b38` (soğuk çelik mavi)
  - `moderate` (30–54): `#7a4a0b` (mat amber)
  - `high` (55–74): `#b84309` (yanık turuncu)
  - `severe` (≥75): `#b51636` (derin sinyal kırmızısı)
  - **Seçili ülke kenarlığı:** 2 px `#00e5ff` (cyan) vurgu katmanı (`world-selected-line`).
- **Bağlamsal Altyapı Katmanı (Sadece İlgili Şokta Açılır — Karmaşa Yok!):**
  - `infra === "cables"` (`redsea-cables`, `taiwan`): `/data/cables.json` ince cyan çizgilerle (opacity `0.38`) yüklenir (lazy fetch — yalnızca bu şoklar seçildiğinde indirilir!).
  - `infra === "volcano"` (`volcano-vei7`): `data/supervolcanoes.json` 6 kaldera işaretlenir.
  - `infra === "chokepoint"`: 6 deniz boğazı belirginleşir.
  - `infra === "grid"` (`solar-g5`): 50°K ve 50°G yüksek enlem bandı ince kesikli enlem çizgisiyle gösterilir.
- **Animasyonlu Domino Yayları:**
  - Şok merkezinden en çok etkilenen 14 ülkeye `greatCircle(..., 48)` yayları çizilir.
  - Yay kalınlığı skora göre (`1px–2.5px`), rengi baskın kanala göre (`energy: --geo`, `trade: --accent`, `food: --safe`, `digital: --space`, `macro: --conflict`).
  - `prefers-reduced-motion` kapalıysa şok merkezinde tek, sakin genişleyen halka animasyonu çalışır.
- **Harita Tıklaması:**
  - `SIMULATE` modunda `world-fill` katmanına tıklamak o ülkeyi seçer (`selectedCountry = iso3`), sağ çekmeceyi o ülkeye odaklar.
  - `LIVE` modunda mevcut davranış korunur; ayrıca bir boğaza tıklandığında (veya boğaza bağlı bir olaya tıklandığında) Triage kartında tek bir düğme çıkar: **`"Laplace'ta simüle et →"`** (tıklanınca doğrudan `SIMULATE` modunda o boğazı açar).
- **Zaman Oynatıcı (`▶ Play`):**
  - Tıklanınca `day` değeri `1`'den `180`'e yaklaşık 9 saniyede akar (60fps değil, ~12–15 adım/sn güncellenerek MapLibre'yi hiç yormadan pürüzsüz oynatır). Sona gelince durur; kullanıcı sürgüyü sürüklerse otomatik duraklatır.
- **URL Paylaşımı (`Share ↗`):**
  - Mevcut simülasyon durumunu URL'ye yazar (`window.history.replaceState`) ve `navigator.clipboard.writeText(url)` ile kopyalar; düğmede 2 sn `"Kopyalandı"` / `"Copied"` gösterir.
  - Sayfa `?mode=sim&shock=...` ile açılırsa doğrudan o simülasyon yüklenir; `?q=<eventId>` ile açılırsa `LIVE` modunda o deprem seçili açılır.

### 3.3 Laplace Sağ Paneli (`components/laplace/LaplacePanel.tsx`)
- **Üst:** Şok adı + 1 cümlelik net özet + ülke seçici (`CountryPicker`: yazarak süzme, 176 ülke + hızlı kısayol çipleri: `TR`, `DE`, `JP`, `US`, `EG`, `IN`).
- **Ülke Özeti:** Toplam skor (`0–100`) + şiddet etiketi (`LOW / MODERATE / HIGH / SEVERE`) + dalga sırası (`1. derece doğrudan` / `2. derece tedarik` / `3. derece küresel fiyat`) + zirve zamanı (`Gün 14–45`).
- **5 Kanal Çubuğu:** `Energy`, `Trade`, `Food`, `Digital`, `Prices` — düz 1 px çerçeveli mat barlar + sayısal değer.
- **3 Adımlı Domino Zinciri:** Numaralı 3 kısa madde, her birinde zaman etiketi (`Gün 1–3`), kanıt rozeti (`[A]`, `[B]`, `[C]`), düz Türkçe/İngilizce açıklama ve kaynak (`EIA`, `FAO` vb.).
- **En Çok Etkilenenler:** O gün için en yüksek skorlu 6 ülke tek tıkla seçilebilir kompakt liste.
- **Derin Okuma Köprüsü:** Şokun karşılık gelen `/library/[id]` sayfası varsa tek satır bağlantı (`"Bilimsel arka plan →"`).
- **Alt Not (Dürüstlük):** `"Deterministik bağımlılık modeli — tahmin değil, yapısal kırılganlık simülasyonudur."`

### 3.4 Performans Kuralları ve Hız Bütçesi (Zorunlu)
Eski `MONITORING` sitesi 15+ dış harita karosu, 1,5 MB eşzamanlı JSON (`orbit.json`, `military_bases.json`, `cables.json` vb.), WebGL üstü `backdrop-filter: blur`, eksik CDN önbellek başlıkları ve sürekli dönen JS döngüleri yüzünden yavaştı. v2 aşağıdaki **7 kuralı** zorunlu kılar:

1. **0 ms İlk Çizim (`localStorage` stale-while-revalidate):** `lib/radar/useRadar.ts` açılışta `localStorage['vigil.lastState']` varsa ilk render'da hemen haritayı doldurur, arka planda `/v1/state` gelince sessizce tazeler (Worker yanıtı beklenirken boş harita gösterilmez).
2. **Şelalesiz (Zero-Waterfall) Yükleme:** `app/layout.tsx` içinde `/data/static/world.json` için `<link rel="preload" href="/data/static/world.json" as="fetch" crossOrigin="anonymous" />` ekle; JS ayrıştırılırken harita geometrisi paralel insin.
3. **Geometriyi Yeniden Göndermeden 60 FPS Boyama (`setPaintProperty`):** `SIMULATE` modunda `severity` veya `day` sürgüsü kayarken 176 ülkenin GeoJSON geometrisini (`world`) asla yeniden `setData` etme! Yalnızca `map.setPaintProperty("world-fill", "fill-color", ["match", ["get", "name"], ...pairs, "#0a0f14"])` çağır — GPU'da anlık boyanır. `world` GeoJSON harita açılışında yalnızca **1 kez** yüklenir.
4. **Sıkı Lazy-Loading:**
   - Ana ekran (`/`) ilk açılışta yalnızca `world.json` (~45 KB gz) ve `/v1/state` (~8 KB gz) çeker.
   - `/data/cables.json` (180 KB) **yalnızca** kullanıcı `redsea-cables` veya `taiwan` şokunu seçtiğinde bir kez indirilir ve bellekte önbelleğe alınır.
   - `/data/country_profiles.json` (47 KB) yalnızca `SIMULATE` moduna geçildiğinde bir kez yüklenir.
   - Eski `orbit.json` (359 KB), `military_bases.json` (265 KB), `airports.json`, `places.json`, `satellite.js` ana ekrana **asla** import edilmez.
5. **Sıfır Boşta Döngü ve Gereksiz Re-render:**
   - `requestAnimationFrame` yalnızca görünür bir animasyon (etkin halka/şok halkası) varken çalışır; `LIVE` nominal veya `prefers-reduced-motion` durumunda tamamen durur.
   - `RadarMap` props'larında `onSelect` kararlı ref/callback olmalı; `useNow()` 30 sn'de bir tik attığında tüm GeoJSON katmanları ve DOM marker'ları baştan yaratılmamalı (yalnızca `state` veya simülasyon sonucu değiştiğinde güncelle).
   - WebGL haritası üstünde `backdrop-filter: blur(...)` **yasak** (mobilde GPU kompozitini kilitler).
6. **Agresif CDN Önbelleği (`public/_headers`):**
   - `/_next/static/*`, `/vendor/*`, `/icons/*` için `Cache-Control: public, max-age=31536000, immutable`.
   - `/data/static/*` için `Cache-Control: public, max-age=86400, stale-while-revalidate=604800`.
   - İkinci ziyarette ağdan neredeyse sıfır statik bayt iner.
7. **Mobil Performans Kapısı (`scripts/perf-check.mjs`):**
   - `perf-check.mjs` içindeki eski `/?sc=overview` yolunu `/?mode=sim&shock=hormuz&day=30` ile güncelle ve Faz 6'da çalıştır.
   - Hedef bütçe (4× yavaşlatılmış mobil CPU): ilk açılışta transfer edilen veri **≤ 80 KB gzip**, sürgü ve zaman oynatıcıda sıfır takılma.

---

## 4. FAZ 4 — TEK VE SADE `VIGILRADAR` NAVİGASYONU + SCENARIOS VİTRİNİ

1. **Ortak Üst Çubuk (`components/SiteNav.tsx`):**
   - Marka adını `MONITORING` yerine **`VIGILRADAR`** yap.
   - `PagesMenu` 15 maddelik açılır menüsünü **kaldır**.
   - Üst çubukta yalnızca **3** bağlantı + dil düğmesi (`LangSwitch`) kalsın:
     - `Map` (`/`)
     - `Scenarios` (`/library`)
     - `About` (`/about`)
   - Ana sayfadaki (`components/radar/TopBar.tsx`) navigasyon da aynı 3 bağlantıyı + `[ LIVE | SIMULATE ]` anahtarını taşır; tüm sitede tek dil, tek estetik olur.
2. **Scenarios Sayfasını Sadeleştir ve Canlandır (`app/library/page.tsx`):**
   - En üste **"Interactive Laplace Simulations (8)"** grid'i ekle: 8 şokun kartları, her kartta 1 satır özet + **`"Simulate on map →"`** (`/?mode=sim&shock=<id>`).
   - Hemen altında kompakt **"Reference Atlases"** şeridi (4 temiz link): `Causal Web (/links)` · `Nuclear (/nuclear)` · `Supervolcanoes (/supervolcanoes)` · `Climate Trajectory (/trajectory)` · `Live Counters (/metrics)`. *(Böylece eski tüm bilimsel içerik kaybolmadan, üst menüyü kirletmeden tek noktadan ulaşılır olur.)*
   - Altında mevcut 23 bilimsel senaryo (Tier A / B / C) aynen kalır.
3. **Kırık Eski Harita Linklerini Temizle:**
   - Kod tabanındaki tüm `/?sc=...` linklerini (`app/supervolcanoes/page.tsx`, `components/scenarios/NuclearModule.tsx` ve diğerleri) uygun yeni hedeflere yönlendir (`/?mode=sim&shock=volcano-vei7`, `/?mode=sim&shock=hormuz`, `/` vb.).

---

## 5. FAZ 5 — SIFIR BAKIM CI/CD, `/about` VE AÇIK KAYNAK GITHUB README

1. **`.github/workflows/data.yml` sadeleştirme:**
   - Eski `npm run data` (30 günlük eski GDELT + CelesTrak indirme) ve `npm run alerts -- --no-send` adımlarını **kaldır** (bu eski `public/data/*.json` dosyaları zaten repoda statik anlık görüntü olarak duruyor; her deploy'da eski feed yüzünden kırılmasın).
   - `data.yml` yalnızca `main` push'unda (ve isteğe bağlı `workflow_dispatch`): `npm ci` → `npm test` → `npx next typegen && npx tsc --noEmit && npm run lint` → `npm run build` → Cloudflare Pages deploy (`vigilradar`). Toplam süre ~1,5 dakika!
   - `NEXT_PUBLIC_TELEGRAM_TR_URL` yalnızca tanımlıysa geçmeye devam edebilir; `NEXT_PUBLIC_WORKER_URL` `secrets.WORKER_URL`'den gelir.
2. **`.github/workflows/slow-data.yml` optimizasyonu:**
   - Public repoda `*/30 * * * *` ücretsiz ve sınırsız. Private repoda kota dostu olması için `npm ci` yerine yalnızca `fflate` ve `tsx` çalıştıran hafif bir adım (veya mevcut `npm ci` cache'li + yorumda private repo için `0 * * * *` notu).
3. **`/about` güncellemesi (`core/content/about.ts` + `components/radar/AboutView.tsx`):**
   - "VigilRadar nedir?" bölümüne Laplace Cascade Simulator açıklamasını ekle ("Deterministik bağımlılık modeli, AI tahmini değil").
   - Kaynak listesine Laplace model kaynaklarını (`EIA`, `UNCTAD`, `FAO`, `World Bank`, `TeleGeography`, `SIA`, `NOAA SWPC`) ekle.
   - `SiteNav` ekle (tüm sayfalarla tek üst çubuk).
4. **Açık Kaynak Vitrin `README.md` (`CemreMetin` / Sunday Hunter Üçlemesi Stili):**
   - **Dil ve ton:** İngilizce ana gövde (+ sonda kısa Türkçe özet). Ton: Cemre'nin `tess-planet-hunter` / `subsurface-ghost-hunter` / `ztf-shadow-hunter` repolarındaki **hafif esprili, samimi, kendini tiye alan ama teknik olarak jilet gibi keskin ve eğitici** üslup (kurumsal pazarlama jargonu ve yapay AI süsleri yasak).
   - **Onaylı açılış bloğu (kelimesi kelimesine kullan):**
     ```markdown
     # VigilRadar

     ![Next.js](https://img.shields.io/badge/Next.js-16%20Static-000000?logo=nextdotjs&logoColor=white)
     ![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers%20%2B%20Pages-F38020?logo=cloudflare&logoColor=white)
     ![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-30m%20Autopilot-2088FF?logo=githubactions&logoColor=white)
     ![Cost](https://img.shields.io/badge/Cost-%240%2Fmonth-2ea44f)

     This started two months ago as a private side project called **Monitoring** that has been quietly running online ever since. The problem was that I got way too carried away: twenty map layers, satellites, military bases, eighteen live counters, twenty-three apocalypse essays... opening my own dashboard exhausted even me.

     While dusting off old projects from my private archive to clean up my portfolio (and hopefully land a job), I decided to rescue it and open-source it — with a brutal haircut. I archived the earthquake early-warning experiment in a git tag after physics and government API latency politely defeated it, stripped out the blinking-pin chaos every "God's Eye" map already does, and rebuilt **VigilRadar** around the one thing I actually wanted to exist:

     A calm, **$0/month** live global risk desk paired with a pocket-sized **Laplace's Demon** — a deterministic domino-effect simulator where you can clog a strait, cut a subsea cable corridor, or trigger a volcanic winter, drag time forward from Day 1 to Day 180, and see *which* countries get hit, *through which channels*, and *why*.

     > **Yes, an EE student shipped a Next.js app:** I usually live in Python and signal/data pipelines, so turning this into a fast web app took some teamwork. The vision, architecture, data rules, and ruthless simplification are mine — **Antigravity** and **Claude Code** handled the TypeScript grind, map optimization, and Cloudflare wiring while I kept yelling at them to make the UI simpler.
     ```
   - **Devamındaki zorunlu bölümler:**
     1. **Küçük bağlantı tablosu (4 satır):** Sunday Hunter Üçlemesi (`TESS Planet Hunter`, `Subsurface Ghost Hunter`, `ZTF Shadow & Blindspot Hunter`) + **VigilRadar** (sıfır maliyetli otomatik bulut + Pazar kahvesi kontrolü felsefesinin devamı).
     2. **`### My Twist on Global Risk Monitoring` (4 madde):**
        - *Dominoes, not blinking pins* (nokta değil, 5 kanallı etki dalgası ve Gün 1→180 zaman oynatıcı).
        - *Transparent math, zero AI fortune-telling* (LLM falı yok; EIA/IMF/FAO/World Bank/TeleGeography kaynaklı, `A/B/C` kanıt etiketli saf TypeScript graf).
        - *Zero-cost autopilot (`$0/month`)* (Cloudflare Pages + 1 dk Worker + 30 dk GitHub Actions + Worker düşerse tarayıcıdan doğrudan USGS/EMSC yedek yolu).
        - *Brutally honest about what it is NOT* (erken uyarı değil, hasar raporu değil, kehanet değil).
     3. **`## What It Tracks & Simulates`:** Canlı 4 veri akışı + 8 interaktif Laplace şoku ve 5 kanalın sade, eğitici açıklaması.
     4. **`## How It Works`:** Mermaid `flowchart TD` mimari diyagramı (Hızlı Hat → Cloudflare Worker/KV → Statik Site + Yavaş Hat GitHub Actions + Tarayıcı Laplace Motoru).
     5. **`## Run Locally / Deploy Your Own ($0/month)`** (`npm ci && npm run dev`, `docs/SETUP.md` bağlantısı) + **`## Contributing`** (yeni şok veya ülke profili PR rehberi) + **Kaynaklar & Lisans**.
5. **`docs/SETUP.md` güncellemesi:**
   - VAPID / Web Push adımını kaldır (artık gerekmiyor!).
   - Kurulumu 4 temiz adıma indir: (1) Cloudflare KV & Worker deploy, (2) `INGEST_TOKEN` + GitHub Secrets, (3) `main`'e merge & Pages deploy, (4) İsteğe bağlı Telegram kanalı.

---

## 6. FAZ 6 — TESTLER, KABUL KRİTERLERİ VE DOĞRULAMA

### 6.1 Zorunlu Yeni Testler (`core/laplace/__tests__/laplace.test.ts`)
1. **Harita bütünlüğü:** `core/laplace/countries.ts` içindeki her ülkenin `mapName` değeri `public/data/static/world.json` içindeki bir `Feature.properties.name` ile birebir eşleşir (0 kayıp).
2. **Tam kapsama:** `world.json` içindeki 176 ülkenin tamamı herhangi bir şok için geçerli `0..100` skor ve 3 adımlı boş olmayan domino zinciri döndürür.
3. **Monotonluk ve zaman dinamiği:** `severity` arttıkça toplam skor azalmaz; `hormuz` için `JPN` enerji skoru `day=14`'te `day=1`'den yüksektir; `redsea-cables` için `day=7` `digital` skoru `day=150`'den yüksektir (onarım sönümü).
4. **Gerçek dünya mantık testleri:**
   - `hormuz` (sev=0.8, day=20): `JPN`, `KOR`, `IND` enerji skoru > `USA` ve `BRA`.
   - `suez` (sev=0.8, day=25): `EGY`, `DEU`, `ITA`, `TUR` ticaret skoru ≥ 45.
   - `taiwan` (sev=0.8, day=40): `USA`, `CHN`, `JPN`, `KOR`, `DEU` dijital skoru ≥ 55.
   - `blacksea` (sev=0.8, day=30): `EGY`, `TUR`, `LBN` gıda skoru > `CAN` ve `AUS`.
   - `solar-g5` (sev=0.9, day=3): `NOR`, `SWE`, `CAN` enerji/dijital skoru > `IDN` ve `BRA`.
5. **URL serileştirme:** `encodeSimQuery` → `decodeSimQuery` round-trip tam eşitlik; bozuk query string güvenli varsayılanlara düşer.
6. **`retracted` testi:** 2 tur üst üste canlı kaynaklardan kaybolan son 6 saatlik deprem `retracted: true` olur; kaynak hata verdiğinde geri çekilmez.

### 6.2 Faz Sırası (Her Faz Tek Commit)
| Faz | Kapsam | Commit |
|---|---|---|
| **Faz 1** | VigilAlert arşivi + Worker/SW/test temizliği + `retracted`, `message.ts`, `RadarMap` rAF bug fix | `v2-faz-1: archive alert, slim worker, fix retracted and map loop` |
| **Faz 2** | `core/laplace/` motoru, 8 şok, 44 ülke profili + 176 ülke yedek modeli + tüm Vitest testleri | `v2-faz-2: laplace deterministic cascade engine and tests` |
| **Faz 3** | Ana ekranda `LIVE | SIMULATE` modu, choropleth ısı haritası, domino yayları, bağlamsal altyapı, zaman oynatıcı, URL paylaşımı | `v2-faz-3: interactive laplace simulator map and country impact drawer` |
| **Faz 4** | Ortak 3 bağlantılı `VIGILRADAR` üst çubuğu, `/library` Scenarios vitrini, kırık `/?sc=` link temizliği | `v2-faz-4: unified minimal nav and scenarios hub` |
| **Faz 5** | CI sadeleştirme (`data.yml`, `slow-data.yml`), `/about` ve `SETUP.md` güncellemesi, açık kaynak `README.md` | `v2-faz-5: zero-maintenance CI, transparent about and open-source README` |
| **Faz 6** | Tam doğrulama (`tsc`, `lint`, `test`, `build`, tarayıcı overflow/contrast/offline kontrolleri) | `v2-faz-6: verification and polish` |

### 6.3 Nihai Kabul Kriterleri
- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` tamamı yeşil.
- Ana ekranda üst çubukta yalnızca 3 sayfa linki + `[LIVE | SIMULATE]` var; eski `MONITORING` yazısı hiçbir yerde yok.
- `SIMULATE` modunda 8 şokun hepsi çalışıyor, 176 ülkenin herhangi birine tıklanınca 5 kanal + 3 adımlı domino zinciri çıkıyor, zaman sürgüsü harita renklerini ve yaylarını canlı güncelliyor.
- `/?mode=sim&shock=hormuz&sev=80&day=30&country=TUR` adresi doğrudan o simülasyonla açılıyor.
- Tarayıcı ağ sekmesinde üçüncü taraf izleyici/script yok; yalnızca statik site + Worker (yedek yolda USGS/EMSC).
- Worker `wrangler deploy --dry-run` temiz; KV yazma maliyeti ~400/gün, ücretsiz planda sıfır bakım.
