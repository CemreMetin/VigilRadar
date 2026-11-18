# Monitoring: Teknik Spesifikasyon (v0.4, Faz 1-7 uygulandı)

## Uygulama durumu (3 Ekim 2026): spesifikasyondan farklar

Aşağıdaki bölümler **tasarım niyetini** anlatır. Uygulanan hâl README.md ve sitenin `/methodology` sayfasındadır. Önemli sapmalar:

- **Faz 1-7 tamamlandı.** Sayfalar: `/`, `/scenarios` (+23 sayfa), `/survive`, `/trajectory`, `/nuclear`, `/health`, `/supervolcanoes`, `/country?c=ISO3` (statik export için `[iso]` yerine sorgu parametresi), `/links`, `/methodology`, `/sources`.
- **Çatışma katmanı GDELT'ten.** UCDP artık erişim jetonu istiyor, ACLED hesap istiyor; ikisi de anahtarsız çalışmıyor. GDELT günlük olay dosyalarından "silahlı çatışma" (CAMEO 19/20; askerî/silahlı grup aktörü veya iki farklı ülke; polis/suç hariç) süzülüyor. Olay doğrulaması değil, haberlerde ne kadar yer aldığıdır; konumlar çoğu zaman başkentlerdir.
- **Gerilim endeksi** 12 çift için GDELT'ten (Goldstein, maddi çatışma payı, ton, ani artış). Formül `/methodology#tension` sayfasında. Tahmin değildir. Çiftlere ABD-İran ve Rusya-Ukrayna eklendi.
- **Kül bulutu ve serpinti haritası yapılmadı (bilinçli karar).** Girdileri (rüzgâr, hedef, açı, verim) kimse önceden bilemez; kesin görünen bir harita bilimin söylediğinden fazlasını iddia eder. Yerine analoglar, yayımlanmış modeller (Xia 2022) ve canlı izleme listesi var.
- **Pandemi gezgini:** Brockmann & Helbing (2013) etkin mesafe yöntemi, OpenFlights (2017) ağı, 12 başlangıç şehri. Mutlak gün sayıları kabadır, sıralama bilgilendiricidir.
- **Güneş fırtınası:** merkezî dipol jeomanyetik enlem, WRI kurulu güç kapasitesi ve denizaltı kabloları. Gerçek şebeke riski için kaba bir vekildir.
- **Sayaçlar 10** (spesifikasyondaki "en fazla 8" sınırı gevşetildi): Doomsday Clock, başlık sayısı, sıcaklık, CO₂, Overshoot Day, WHO raporları, darboğazlar, silahlı çatışma haberleri, asteroidler, Kp.
- **Yapılmayanlar:** bileşik "Earth Pulse" skoru (ertelendi), 1950→2100 zaman çubuğu ve sıcaklık ısı haritası (yerine gözlem grafikleri + AR6 senaryo çubukları), ECDC/WOAH verisi (yalnızca bağlantı), IAEA PRIS (yerine 2019 civarı WRI verisi), ACLED/UCDP.
- **Atıflar** Crossref kaydına karşı, bağlantılar açılarak doğrulandı; bu süreçte bir yanlış atıf (Lloyd's raporu Chatham House'a atfedilmişti) yakalanıp düzeltildi. Bot engelleyen birkaç siteye (CDC, UNHCR, Smithsonian) doğrudan erişilemedi, sayfalar mevcut.
- **Statik export ayrıntıları:** `trailingSlash: false`, `experimental.prefetchInlining: false` ve derleme sonrası `scripts/flatten-segments.mjs` (Next 16.3 segment dosyalarını iç içe yazıp düz ad istiyordu; her `<Link>` ön yüklemesi 404 oluyordu). Yerel test için `scripts/serve-out.mjs`.
- **Arayüz (Ekim 2026, spesifikasyondaki §3 ve §8 çizimlerinin yerine geçer):** harita tam ekran; üç katı bölge: üst menü = iki satır, masaüstünde haritanın üstünde ekranın ortasında yüzer (marka sol üstte, sayfalar menüsü sağ üstte, her biri kendi küçük panelinde; tüm paneller yarı saydamdır, harita altlarında görünür; 1024 px altında düz, opak bir çubuk): 4 senaryo grubu (Overview; Human: Nuclear, Conflict, Bio; Earth: Volcano, Weather, Ice & Sea; Space: Solar, Orbit, Asteroid) ve altında seçili grubun senaryoları (1-4 tuşları grup seçer, aynı tuşa tekrar basmak sıradaki senaryoya geçer; her grup tek bir canlı renk kullanır: beyaz, kırmızı, kehribar, gök mavisi), sol panel = yalnızca seçili senaryonun harita katmanları, sağ panel = ilk bakışta yalnızca senaryo, sinyal ve ilk metrik; geri kalanı kapalı "More" bölümünde (Readout, Metrics, Links); hayatta kalma kartı hep görünür. Senaryo seçimi katmanları, kamerayı, panel kenar rengini ve harita vinyetini değiştirir. Düz 1px kenarlıklar; gölge ve parıltı yok. Ayrıntı için README.md "Design system" bölümü.
- **Yayın:** Cloudflare Pages + `.github/workflows/data.yml` (her push'ta ve saatte iki kez veriyi yenileyip derler ve yükler). Canlı adres: https://monitoring-9l7.pages.dev
- **Mimari sapma:** veritabanı, hesap ve sunucu fonksiyonu yok (bkz. README "Data and architecture"); bu yüzden §7'deki Postgres/SQLite ve SSE önerileri uygulanmadı, her şey statik JSON.
- **PWA çevrimdışı modu** Edge ile gerçekten sınandı (service worker, çevrimdışı sayfalar, kontrol listesi kalıcılığı). Harita arka planı yine internet ister.

# (v0.3 başlığı:) Teknik Spesifikasyon

Çalışma adı: **Monitoring**. Arayüz dili **İngilizce**, görsel yön **karanlık komuta merkezi**. Bu doküman Türkçedir.

> v0.2 → v0.3 (Gemini sohbetinden alınanlar, kod hariç): **Senaryolar** (süper volkan, nükleer kış, pandemi, güneş fırtınası...), **yan sayaçlar**, **"Neler yapabilirsiniz?" hayatta kalma merkezi**, **sunucu ağırlıklı/istemci hafif mimari** (telefon ve PC'de aynı hız), **PWA/çevrimdışı** ve **hacker analiz odası teması** (kırmızı/yeşil/mor/mavi). Bölüm 2.5-2.7 ve 7-8 buna göre yenilendi.
>
> v0.1 → v0.2: Proje "her şeyi gösteren dünya haritası" olmaktan çıkıp **birbirine bağlı risk alanlarını gösteren bir sistem** oldu. Sağlık/salgın, nükleer gerilim, süper volkanlar ve varoluşsal risk eklendi. Uçak ve uydu gibi temaya doğrudan bağlanmayan katmanlar sadeleştirildi.

## 1. Amaç ve ilkeler

"Dünya şu an ne durumda ve nereye gidiyor?" sorusunu, olayları birbirinden bağımsız noktalar olarak değil, **birbirine bağlı riskler** olarak göstermek.

1. **Her veri noktasının kaynağı görünür:** kaynak adı, son güncelleme, lisans.
2. **Gözlem, tahmin ve uzman kestirimi karışmaz.** Üç ayrı görsel dil: düz çizgi/dolu nokta (gözlem), kesikli amber (projeksiyon), noktalı mor (uzman kestirimi/forecast).
3. **Kendi "yok oluş olasılığımızı" üretmeyiz.** Olasılıklar yalnızca atıflı uzman kestirimleri ve forecast platformlarından gösterilir. Biz durum ve eğilim gösteririz.
4. **Bağlantılar iki türdür ve etiketlidir:** *hesaplanan* (konum/aktör/zaman) ve *kürate edilmiş nedensel* (kaynaklı, elle yazılmış). Yalnızca ikincisi nedensellik iddia eder.
5. **Kaynak çökerse site çökmez.** Her katman bağımsız, "live / stale / offline" rozetli.
6. **Tarayıcı kaynak API'lere doğrudan gitmez.** Her şey kendi backend'imizden geçer.

## 2. Altı risk alanı

Her alanın üç göstergesi vardır: **Now** (durum/uyarı seviyesi), **Trend** (30 gün / 1 yıl), **Long-term** (uzman kestirimi veya projeksiyon).

| # | Alan | İçerik |
|---|---|---|
| 1 | **Nuclear** | Cephanelikler, nükleer devletler arası gerilim çiftleri, Doomsday Clock, nükleer santraller ve çatışma bölgeleriyle ilişkisi |
| 2 | **Pandemic & Health** | Aktif salgınlar, hayvan hastalıkları (ör. H5N1), antimikrobiyal direnç, küresel sağlık göstergeleri |
| 3 | **Climate & Water** | Sıcaklık, CO₂, deniz seviyesi, buz örtüsü, kuraklık/su stresi, aşırı hava olayları (özetlenmiş) |
| 4 | **Geophysical** | Büyük depremler, aktif volkanlar, **süper volkan izleme listesi** (Yellowstone, Campi Flegrei...) |
| 5 | **Space** | Asteroid yakın geçişleri, güneş fırtınaları (Kp), uydu/enkaz özeti |
| 6 | **Conflict** | Aktif savaşlar ve çatışma olayları, çatışmanın diğer alanlarla kesişimi |

İsteğe bağlı 7. alan: **Emerging tech (AI, biyogüvenlik)**. Açık canlı veri yoktur, yalnızca uzman kestirimleri gösterilebilir. v1 dışında bırakıldı.

### 2.1 Nuclear alanı ayrıntısı

- **Cephanelik:** ülke bazında toplam/konuşlu başlık sayısı (FAS, SIPRI). Yıllık, statik.
- **Nükleer devletler:** ABD, Rusya, Çin, Fransa, Birleşik Krallık, Hindistan, Pakistan, İsrail (resmî olarak açıklanmamış), Kuzey Kore.
- **Gerilim çiftleri (dyad):** nükleer silahlı bir tarafı olan ve ilişkisi kötü ülke çiftleri. Başlangıç listesi: ABD-Rusya, ABD-Çin, Rusya-NATO (Fransa, İngiltere), Hindistan-Pakistan, Hindistan-Çin, Kuzey Kore-ABD/Güney Kore/Japonya, İsrail-İran (İran nükleer devlet değil ama eşik ülke olarak izlenir).
- **Gerilim endeksi (çift başına, 0-100):** şu girdilerin şeffaf, ağırlıkları açık birleşimi:
  - GDELT'ten iki ülke arasındaki olayların ortalama tonu/Goldstein ölçeği (son 30 gün),
  - aktif silahlı çatışma var mı (UCDP/ACLED, doğrudan taraf veya vekil),
  - son 90 günde askerî olay/test (elle/kürate: füze testi, hava sahası ihlali),
  - antlaşma durumu (New START vb., elle güncellenir).
  Endeks bir **tahmin değildir**, "ilişki ne kadar gergin" göstergesidir. `/methodology` sayfasında formülü açık olur.
- **Doomsday Clock:** yıllık, Bulletin of the Atomic Scientists değeri.
- **Nükleer santraller (IAEA PRIS):** çatışma ve deprem bölgeleriyle mekânsal bağ (ör. aktif çatışma sahasındaki santral).
- **Uzun vadeli kestirim:** nükleer savaş için uzman kestirimleri ve forecast platformları, atıflı.

### 2.2 Pandemic & Health ayrıntısı

- **Aktif salgınlar:** WHO Disease Outbreak News, ECDC haftalık tehdit raporu, CDC; hayvan hastalıkları için WOAH WAHIS ve USDA APHIS (H5N1).
- **Sağlık göstergeleri:** WHO Global Health Observatory ve Our World in Data (bulaşıcı hastalık yükü, aşı kapsaması, ölüm nedenleri).
- **Bağ noktası:** salgın bölgesi ↔ çatışma bölgesi (sağlık sistemi çöküşü), kuraklık/su stresi (kolera, tifo), nüfus yoğunluğu.
- **Uzun vadeli:** doğal ve yapay pandemi kestirimleri (atıflı).

### 2.3 Geophysical: süper volkan izleme

Küçük, sabit bir **watchlist** (10-15 kayıt), yüzlerce nokta değil:

| Volkan | Neden listede | Canlı izleme |
|---|---|---|
| Yellowstone (ABD) | Üç süper patlama geçmişi | USGS Yellowstone Volcano Observatory: uyarı seviyesi, deprem sayısı, yer deformasyonu |
| Campi Flegrei (İtalya) | Aktif yükselme ve deprem kümeleri | INGV bültenleri |
| Long Valley (ABD), Taupō (Yeni Zelanda), Toba (Endonezya), Aira (Japonya) | Geçmiş süper patlama kalderaları | Smithsonian GVP haftalık rapor, ulusal gözlemevleri |

Her kayıt için: son büyük patlama (VEI 7+), mevcut uyarı seviyesi, son 30 gün aktivite özeti, 100/300 km içindeki nüfus. **Not:** patlama tekrarlama aralığı bir tahmin değildir. Arayüz bunu açıkça belirtir.

### 2.4 Küresel yok oluş (varoluşsal risk) paneli

`/trajectory` altında, tüm alanlar için **atıflı uzman kestirimleri** tablosu (ör. Toby Ord, *The Precipice*, "önümüzdeki yüzyıl" kestirimleri; Metaculus ve benzeri forecast platformları). Her satır: kaynak, yıl, değer, belirsizlik. Kullanıcı farklı kaynakları yan yana karşılaştırır. Biz tek bir sayı seçmeyiz.

### 2.5 Senaryolar (Doomsday Projections)

Altı alan *verinin* organizasyonudur, senaryolar ise *kullanıcının* girişidir. Her senaryo, hangi alanların ve bağların yanacağını, hangi canlı göstergeleri izleyeceğini ve hangi simülasyon paketini yükleyeceğini tanımlar. Kullanıcı sekmelerden bir senaryo seçince harita atmosferi ve katmanlar değişir.

| # | Senaryo | Canlı tetikleyici göstergeler | Simülasyon paketi (önceden hesaplanmış) | Dayanak (atıf için, faz başında doğrulanır) |
|---|---|---|---|---|
| 1 | **Nuclear war & winter** | Gerilim çiftleri, Doomsday Clock, nükleer devletlerin katıldığı çatışmalar | Hedef bölgeleri için serpinti (fallout) alanı, rüzgar iklimatolojisine göre; is (soot) kaynaklı soğuma ve mahsul kaybı | Nükleer kış literatürü (Robock, Toon, Coupe vd.; Xia vd. 2022, *Nature Food*) |
| 2 | **Supervolcano** | Watchlist uyarı seviyeleri, bölgesel deprem kümeleri | Kül bulutu yayılımı (24 saat/7 gün), havacılık kapanma alanı, güneş ışığı azalması ve mahsul etkisi | USGS Ash3d, Tambora 1815 "yazsız yıl" analojisi |
| 3 | **Pandemic X** (doğal/yapay) | Aktif salgın akışı, BSL-4 laboratuvar konumları | Havayolu ağı üzerinden yayılım: şehir düğümleri, uçuş kenarları, varış süreleri; R₀ ve ölüm oranı için 3×3 hazır parametre ızgarası | Metapopülasyon SEIR modelleri (GLEAM benzeri), OpenFlights/hava yolu ağ verisi |
| 4 | **Dormant pathogens** (permafrost, "zombi virüs") | Permafrost erime haritası, Sibirya/Kanada ısınma anomalisi | Yalnızca harita katmanı, yayılım simülasyonu **yok** | Kanıt düzeyi **speculative**. Gerçek öncül: 2016 Yamal şarbon salgını. Varsayılan olarak "Speculative" rozetiyle |
| 5 | **Solar superstorm** | NOAA SWPC Kp/G ölçeği, güneş lekesi döngüsü | Jeomanyetik enlem maruziyeti, elektrik şebekesi ve denizaltı internet kabloları, etkilenen bölgeler | Carrington 1859, Quebec 1989 analojileri |
| 6 | **Asteroid / comet impact** | NeoWs ve Sentry yakın geçişleri, Torino ölçeği | Seçilen çap/hız için etki yarıçapları | Earth Impact Effects Program (Collins/Melosh) |
| 7 | **Climate tipping cascade** | CO₂, sıcaklık, buz örtüsü | AMOC, Grönland/Batı Antarktika, permafrost, Amazon için eşik ve senaryo (SSP) haritası | Armstrong McKay vd. 2022 (*Science*), IPCC AR6 |
| 8 | **Food & water collapse** | Su stresi, gıda güvensizliği, tedarik zinciri sayaçları | Çoklu tahıl ambarı kaybı etkisi, su gerilimi olan nehir havzaları (Nil, İndus...) ve komşu gerilim çiftleri | FEWS NET, IPC, WRI Aqueduct, FAO |

#### Kanıt kademesi (Evidence tier) ve genişletilmiş senaryo listesi

Proje kişisel, reklamsız ve sponsorsuz; amaç eğlence + bilgi. Bu yüzden senaryo sayısı geniş tutulur, ama her senaryo **kanıt kademesi** rozeti taşır. Kademe olasılık değil, **kanıt kalitesi** demektir (mekanizma bilinen mi, tarihsel öncül var mı, yayımlanmış model var mı).

| Kademe | Anlamı | Arayüzde |
|---|---|---|
| **A: Documented** | Tarihsel öncül ve yayımlanmış senaryo/model var | Varsayılan görünür |
| **B: Plausible** | Mekanizma biliniyor, model var ama belirsizlik yüksek | Varsayılan görünür |
| **C: Thought experiment** | Fiziksel olarak mümkün ama kanıt zayıf, çoğu zaman tartışmalı ya da eğlence amaçlı | Varsayılan **gizli**, "Show thought experiments" anahtarıyla açılır; her sayfada "speculative" bandı |

| Kademe | Senaryo | Not |
|---|---|---|
| A | Supervolcano eruption | Bölüm 2.5 tablosu |
| A | Nuclear war & winter | Bölüm 2.5 tablosu |
| A | Pandemic X (doğal) | Bölüm 2.5 tablosu |
| A | Solar superstorm (Carrington) | Bölüm 2.5 tablosu |
| A | Asteroid / comet impact | Bölüm 2.5 tablosu |
| A | **Cascadia megathrust deprem + tsunami** | USGS/OSU modelleri, 1700 depremi öncülü |
| A | **Marmara / İstanbul depremi** | Türkiye için yerel ilgi, AFAD/Kandilli/akademik senaryolar |
| A | **Megaflood (ARkStorm)** | USGS'nin yayımladığı Kaliforniya senaryosu |
| A | **Wet-bulb heat (yaşanamaz sıcak-nem bölgeleri)** | Sıcaklık-nem eşiği ve SSP projeksiyonları |
| A | **Antibiotic resistance (post-antibiotic era)** | WHO/Lancet AMR yük tahminleri |
| A | **Mega-drought & breadbasket failure** | Bölüm 2.5'teki Food & water ile birleştirilebilir |
| A | **Kessler syndrome** | Yörünge enkazı zincir çarpışması, NASA/ESA modelleri |
| B | Climate tipping cascade (AMOC, buz tabakaları, Amazon) | Bölüm 2.5 tablosu |
| B | Engineered pandemic | Yalnızca uzman kestirimi ve sağlık sistemi etkisi; patojen/yöntem detayı yok |
| B | Grid / cyber collapse (büyük çaplı kesinti) | Kritik altyapı bağımlılıkları |
| B | Ocean anoxia & acidification | Okyanus ekosistemi ve gıda zinciri |
| B | Biodiversity / pollinator collapse | Tarım verimi etkisi |
| B | Advanced AI risk | Canlı veri yok, yalnızca atıflı uzman kestirimleri (7. alan kararına bağlı) |
| C | Dormant pathogens (permafrost) | Bölüm 2.5 tablosu |
| C | Cumbre Vieja megatsunami | Büyük ölçüde çürütülmüş, tarihsel merak olarak |
| C | Gamma-ray burst / yakın süpernova | Gerçek fizik, son derece düşük olasılık |
| C | Pole reversal felaketi | Bilimsel konsensüs: yıkıcı değil, popüler mit |
| C | Vacuum decay, strangelet vb. | Yalnızca "fizik düşünce deneyi" olarak |

C kademesi eğlence kısmıdır, ama "bu abartılmış, bilim şöyle diyor" açıklamasını da içerir. Böylece hem merak giderilir hem yanlış bilgi yayılmaz.

**Simülasyon kuralları**
1. **Hiçbir simülasyon kullanıcı tıklayınca hesaplanmaz.** Tüm paketler çevrimdışı toplu işte (Python) önceden üretilir ve CDN'e statik dosya olarak konur. Kullanıcı yalnızca dosyayı çeker ve haritaya boyar. Gemini planındaki `/api/simulate` uç noktası bu yüzden kaldırıldı.
2. **Her paket "Illustrative scenario, not a forecast" etiketi taşır.** Varsayımlar (rüzgar iklimatolojisi, R₀, başlık sayısı vb.), model ve atıf paketin yanında görünür.
3. **Rüzgar verisi:** Windy API ticari ve lisans kısıtlıdır. Bunun yerine NOAA GFS / ERA5 iklimatolojisi kullanılır (açık veri).
4. **Senaryo sayfası yapısı:** Özet, canlı göstergeler, etki zinciri (bağ grafiği), simülasyon katmanı, uzman kestirimleri, ilgili sayaçlar, **"What can you do?" bağlantısı** (bölüm 2.7).

### 2.6 Yan sayaçlar (Doomsday Metrics)

Sağda sabit panel, en fazla 8 sayaç. Her sayaçta değer, eğilim oku, kaynak ve son güncelleme bulunur; tıklayınca ilgili senaryo veya alan açılır.

| Sayaç | Nasıl hesaplanır |
|---|---|
| **Doomsday Clock** | Bulletin of the Atomic Scientists'in yıllık değeri (gece yarısına saniye) |
| **Global Tension Level (1-5)** | Gerilim çiftlerinin birleşimi, formülü açık. **"DEFCON" adı kullanılmaz:** gerçek DEFCON halka açık değildir, bu yüzden sahte otorite izlenimi verir |
| **Supply-chain stress** | IMF PortWatch'tan Süveyş, Panama, Hürmüz, Malakka geçiş sayılarının normale göre sapması |
| **Warming** | NASA GISS son 12 ay ve 20 yıllık ortalama, +1.5 °C eşiğine tahmini yıl **aralığı** (tek tarih değil) |
| **CO₂** | NOAA GML Mauna Loa en son aylık ppm. "Canlı" değil, güncel aylık değer olarak etiketlenir |
| **Overshoot Day** | Global Footprint Network yıllık değeri |
| **Active outbreaks** | WHO DON son 90 günde açık salgın sayısı |
| **Space weather** | NOAA Kp / G ölçeği |

### 2.7 "What can you do?" (Action Hub, `/survive`)

Amaç: kullanıcıya yalnızca "son yaklaşıyor" demek yerine hazırlık yolu göstermek. Projenin en değerli modülü olarak ele alınır ve **tamamen çevrimdışı çalışır** (PWA).

| Modül | İçerik |
|---|---|
| **Bug-out bag** | Kademeli liste: Tier 1 (72 saat, hafif), Tier 2 (sığınak/uzun süreli). Kullanıcı işaretlediklerini cihazında görür (skor ve giriş sistemi yok). Senaryo seçilince ilgili kalemler öne çıkar (nükleer: iyot, sığınak; pandemi: maske, karantina) |
| **Comms** | Şebeke çöktüğünde haberleşme rehberi: PMR446, amatör bant planları (IARU), ülkeye göre acil durum frekansları. Yalnızca resmî düzenleyici kaynaklardan |
| **Offline maps** | Kullanıcının bölgesi için PMTiles/MBTiles dilimi indirme aracı (boyut sınırı ve bölge seçimi ile) |
| **Medical library** | İlk yardım ve taktik tıp (TCCC), radyasyon ve iyot kullanımı, karantina protokolleri. **Doz ve prosedürler yalnızca WHO/CDC/FEMA/AFAD gibi resmî kaynaklardan alıntılanır veya bağlanır, kendi metnimiz olmaz.** Belge lisansları kontrol edilir (ABD federal belgeleri genelde kamu malı) |
| **Food & water guides** | Uzun ömürlü gıda stoklama, rotasyon, su arıtma rehberleri, resmî kaynaklı |

**Depolama (karar):** Hazırlık skoru ve giriş/hesap sistemi **yok**. Checklist işaretleri yalnızca cihazda (IndexedDB/localStorage) durur, sunucu tarafı kullanıcı verisi tutulmaz. Konum bilgisi sunucuya gönderilmez, analitik varsa çerezsiz ve toplulaştırılmış olur. Reklam ve sponsorluk yok.

**Örnek veri şeması (yön gösterir, tek kullanıcılık):**
```ts
type BagItem = { id: string; tier: 1|2; category: 'water'|'medical'|'comms'|'shelter'|'food'|'power';
  name: string; why: string; scenarios: string[]; weight_g?: number; done: boolean };
```

## 3. Bağlantı modeli

Bu projenin ayırt edici yanı. Üç katman:

### 3.1 Varlıklar (nodes)
Ülkeler, risk alanları, sabit varlıklar (nükleer santral, süper volkan, büyük şehir, nükleer üs), olaylar (deprem, salgın, çatışma...).

### 3.2 Hesaplanan bağlar (otomatik)

| Tür | Kural | Örnek |
|---|---|---|
| **Mekânsal** | Olay, varlığın R km içinde | Aktif çatışma, santrale 50 km yakın; Yellowstone yakınında deprem kümesi |
| **Aktör** | Olay bir ülkeyi içeriyor | Rusya → cephanelik + aktif çatışmalar + gerilim çiftleri |
| **Maruziyet** | Olayın X km çevresindeki nüfus | Salgın, deprem, kuraklık için etkilenen insan sayısı (WorldPop/GPW özet katmanı) |
| **Zamansal** | Aynı bölgede kısa sürede birden fazla alan | Çatışma + kolera + kuraklık aynı ülkede; **yalnızca "birlikte görülüyor" olarak etiketlenir** |

### 3.3 Kürate edilmiş nedensel bağlar (elle yazılmış, kaynaklı)

Küçük bir graf (≈20-30 kenar), her kenarın atıf listesi vardır. Örnekler:

- Nükleer değişim → atmosferde is → **nükleer kış** → mahsul kaybı → kıtlık
- Süper patlama → **volkanik kış** → mahsul kaybı → kıtlık
- İklim → su stresi/kuraklık → göç ve çatışma riski
- Çatışma → sağlık sistemi çöküşü → salgın
- Salgın → ekonomik/siyasi istikrarsızlık → çatışma riski
- Güneş fırtınası → şebeke ve uydu arızası
- Kıtlık → siyasi istikrarsızlık → çatışma

Kenarlar `evidence: strong | moderate | speculative` etiketi taşır. Spekülatif kenarlar varsayılan olarak gizlidir.

### 3.4 Arayüzde nasıl görünür
- **Connections modu:** bir olay/ülke/varlık seçilince globe üzerinde bağlı öğeler arklarla vurgulanır, sağ panelde "Linked to" listesi çıkar.
- **`/links` sayfası:** alanlar arası kürate nedensel grafiği (etkileşimli), kenara tıklayınca kaynaklar.
- **Country profile (`/country/[iso]`):** o ülkenin cephanelik, gerilim çiftleri, aktif çatışmalar, salgınlar, su stresi, deprem/volkan maruziyeti tek sayfada.

## 4. Sadeleştirme: neyi çıkardık / küçülttük

| v0.1'de | v0.2 kararı | Neden |
|---|---|---|
| Canlı uçak katmanı (OpenSky) | **Çıkarıldı** (v1) | Tema ile doğrudan bağı yok, yüksek hacim ve hız limiti. İleride "salgın yayılım yolu" olarak geri gelebilir |
| 10 binlerce uydu noktası | **KPI'ya indirildi** | Aktif uydu, enkaz sayısı ve ISS tek panelde. Yörünge animasyonu yok |
| Tüm fırtına/yangın/sel (EONET tam akış) | **Yalnızca yüksek şiddet** | Climate alanında "özet" olarak: büyük kasırgalar, rekor ısı dalgaları, büyük yangınlar |
| M2.5+ depremler | **M5+ varsayılan** (M4.5+ seçenek) | Gürültüyü azaltır, risk için anlamlı olanlar kalır |
| USGS Water Services (ABD ağırlıklı) | **Çıkarıldı** | Küresel değil. Yerine Drought Monitor + GRACE-FO yer altı suyu |
| Çok sayıda iklim serisi | **4 seriye indirildi** | Sıcaklık anomalisi, CO₂, deniz seviyesi, Arktik buz |
| Ayrı demografi katmanı | **Maruziyet hesabına gömüldü** | Ayrı katman değil, etkilenen insan sayısı olarak kullanılır |
| Bileşik "Earth Pulse" skoru | **Ertelendi** | Yerine alan başına durum ışıkları. Tek skor, metodoloji tartışması çıkarır |

## 5. Sayfalar

| Rota | İçerik |
|---|---|
| `/` | Globe + alan seçici + olay akışı + 6 alanın durum şeridi |
| `/links` | Kürate nedensel graf ve kanıt düzeyleri |
| `/nuclear` | Cephanelik haritası, gerilim çiftleri matrisi, Doomsday Clock, santral-çatışma kesişimi |
| `/health` | Aktif salgınlar, hayvan hastalıkları, sağlık göstergeleri |
| `/supervolcanoes` | Watchlist, canlı durum, maruz kalan nüfus |
| `/trajectory` | İklim projeksiyonları (SSP senaryoları) ve varoluşsal risk kestirim tablosu |
| `/country/[iso]` | Ülke profili: tüm alanların kesişimi |
| `/event/[id]` | Olay detayı ve "Linked to" |
| `/scenarios/[id]` | Senaryo sayfası: canlı göstergeler, etki zinciri, simülasyon katmanı, uzman kestirimleri |
| `/survive` | Action Hub: bug-out bag, comms, çevrimdışı haritalar, tıbbi kütüphane (PWA, çevrimdışı) |
| `/sources`, `/methodology` | Kaynaklar, lisanslar, canlılık; gerilim endeksi ve bağ kuralları |

### Ana ekran

```
┌────────────────────────────────────────────────────────────────┐
│ MONITORING  UTC 14:32   ● 9/10 feeds live        [Live|Links]  │
├──────────────┬──────────────────────────────┬──────────────────┤
│ DOMAINS      │                              │ SELECTED         │
│ ● Nuclear  ▲ │                              │ Russia           │
│ ● Health   ─ │         3D GLOBE             │ 5,459 warheads   │
│ ● Climate  ▲ │   (arcs = links in           │ 3 tension pairs  │
│ ● Geophys. ─ │    Connections mode)         │ 2 active conflict│
│ ● Space    ─ │                              │ Linked to ▸      │
│ ● Conflict ▲ │                              │                  │
├──────────────┴──────────────────────────────┴──────────────────┤
│ Now | Trend | Long-term       ◀ ━━━━●━━━━ ▶   24h 7d 30d 1y    │
└────────────────────────────────────────────────────────────────┘
```

▲/─/▼ = alan başına 30 günlük eğilim oku. Renk yerine şekil de kullanılır (erişilebilirlik).

## 6. Veri kaynakları

> Erişilebilirlik, anahtar ve lisans koşulları faz başında tek tek doğrulanır. "Doğrula" = ilk kullanımdan önce güncel API durumuna bakılacak.

| Alan | Kaynak | Anahtar | Yenileme |
|---|---|---|---|
| Nuclear | FAS Status of World Nuclear Forces, SIPRI Yearbook | Yok | Yıllık, elle |
| Nuclear | Bulletin of the Atomic Scientists (Doomsday Clock) | Yok | Yıllık, elle |
| Nuclear | IAEA PRIS (santraller) | Yok (doğrula) | Aylık |
| Nuclear / Conflict | GDELT (ülke çifti ton ve olaylar) | Yok | Günlük |
| Conflict | UCDP, ACLED | ACLED kayıt | Günlük/haftalık |
| Health | WHO Disease Outbreak News | Yok (doğrula: RSS/API) | Günlük |
| Health | ECDC Communicable Disease Threats Report | Yok | Haftalık |
| Health | CDC, USDA APHIS, WOAH WAHIS (hayvan hastalıkları) | Yok (doğrula) | Günlük/haftalık |
| Health | WHO GHO API, Our World in Data | Yok | Aylık/yıllık |
| Geophysical | USGS depremler (M5+) | Yok | 5 dk |
| Geophysical | USGS YVO, INGV bültenleri, Smithsonian GVP | Yok | Günlük/haftalık |
| Climate | NASA GISS, NOAA GML (CO₂), NSIDC, NASA deniz seviyesi | Yok | Aylık |
| Climate | Drought Monitor, NASA GRACE-FO, NASA EONET (yüksek şiddet), NOAA NHC | Yok | Günlük |
| Projections | IPCC AR6 / CMIP6 özetleri | Yok | Statik, sürüm etiketli |
| Space | NASA NeoWs, JPL CAD/Sentry | NASA key | Günlük |
| Space | NOAA SWPC (Kp, güneş fırtınası uyarıları) | Yok | 5-15 dk |
| Space | CelesTrak (yalnızca sayısal özet) | Yok | Günlük |
| Exposure | WorldPop / GPW (önceden ızgara özeti) | Yok | Statik |
| Long-term | *The Precipice* tablosu, Metaculus ve benzeri | Yok (doğrula) | Elle / haftalık |
| Counters | IMF PortWatch (deniz geçiş noktaları), Global Footprint Network | Yok (doğrula) | Günlük/yıllık |
| Scenarios | Global BioLabs (BSL-4 konumları), OpenFlights (hava yolu ağı, statik) | Yok | Statik, yıllık |
| Scenarios | NOAA GFS / ERA5 (rüzgar iklimatolojisi), USGS Ash3d | Yok | Toplu iş |
| Scenarios | WRI Global Power Plant DB, TeleGeography (denizaltı kablolar) | Yok (doğrula lisans) | Statik |
| Scenarios | NSIDC (permafrost), WRI Aqueduct, FEWS NET, IPC | Yok | Aylık/yıllık |

## 7. Mimari

```
Kaynak API'ler → Ingestors (cron/worker) → normalize → DB (Postgres+PostGIS / SQLite)
                                                   │
                      Link engine (mekânsal/aktör/maruziyet/zamansal bağları üretir)
                                                   │
                                  Kendi API'miz (REST + SSE) → Next.js frontend
Kürate graf (links.yaml, kaynaklı) ───────────────┘
```

### 7.0 İlke: sunucu ağırlıklı, istemci hafif

Telefon ve bilgisayarda aynı akıcılık hedeflenir. İstemci hesap yapmaz, yalnızca hazır dosyayı çizer.

```
Ingestors + toplu işler (Python/Node, VPS veya zamanlanmış CI)
  ├─ her 5-15 dk: world_state.json (gzip, hedef < 300 KB) + ağır katmanlar için vektör karo/GeoJSON
  └─ günlük/yıllık: senaryo paketleri, link engine çıktısı, kürate graf
                      │
                 CDN (Cloudflare / Vercel edge)  ← kullanıcılar yalnızca statik dosya çeker
                      │
            Next.js + MapLibre: yalnızca boyar; PWA ile çevrimdışı önbellek
```

- Trafik patlamasında (gerçek bir kriz anında) yükü CDN taşır, kaynak API'lere istek sayısı kullanıcı sayısından bağımsızdır.
- Ağır noktalar (yangın, olay kümeleri) **sunucuda kümelenir**, istemci en çok birkaç bin nokta çizer.
- Animasyonlar (bağ arkları, yayılım hatları) önceden hesaplanmış rotalar üzerinde hafif WebGL/CSS interpolasyonuyla oynar. Parçacık sayısı sınırlıdır; `prefers-reduced-motion`, `Save-Data` ve düşük donanım algılandığında otomatik sadeleşir.
- Unity WebGL ve Flutter Web **kullanılmaz** (ağır paket, düşük cihazlarda yavaş, SEO ve PWA zayıf).

### 7.1 Bileşenler

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind. Harita: **MapLibre GL JS** (açık kaynak, anahtar ve sayfa yükü başına ücret yok) + gerekirse deck.gl. Varsayılan **düz (Mercator) harita**; küre projeksiyonu opsiyonel (masaüstünde). Bu karar globe.gl/CesiumJS önerisinin yerini aldı. Graf: D3 force veya Cytoscape. Grafikler: D3/visx. Mapbox kullanılabilir ama anahtar ve fiyatlandırma ister (açık karar, bölüm 11).
- **Basemap:** Koyu stil, kendi barındırdığımız PMTiles (Protomaps) ile hem CDN'den hızlı hem de çevrimdışı bölge dilimleri için aynı format.
- **PWA:** Service worker ile `world_state.json`, son senaryo paketleri ve `/survive` içeriği önbelleğe alınır; internet kesilse bile liste ve rehberler açılır.
- **Backend:** Sürekli çalışan API yok. Toplu işler `worker/` klasöründe; küçük sunucusuz fonksiyonlar yalnızca sağlık kontrolü ve eşitleme için. Aşağıdaki "API" tablosu **mantıksal** şemadır, üretimde bu uç noktaların çoğu statik dosya olarak sunulur (`/data/world_state.json`, `/data/scenarios/<id>.<ver>.json`, `/data/links.json`).
- **Link engine:** Yeni olay geldiğinde sabit varlıklarla (santral, süper volkan, ülke sınırı) PostGIS ile kesişim bakar, `links` tablosuna yazar. Kürate graf `data/links.yaml` dosyasında, sürüm kontrollü.
- **Depolama:** MVP SQLite (SpatiaLite) ya da doğrudan Postgres. Ağır olmayan veri yapısı sayesinde ücretsiz katman yeter.
- **Barındırma:** Vercel + cron ya da küçük VPS.

### Şemalar

```ts
type MonitorEvent = {
  id: string;                  // "<source>:<native_id>"
  domain: 'nuclear'|'health'|'climate'|'geophysical'|'space'|'conflict';
  kind: string;                // 'quake','outbreak','conflict_event','kp_storm',...
  title: string;
  severity: 0|1|2|3|4;
  lat?: number; lon?: number;  // salgınlarda bölge/ülke olabilir
  countries: string[];         // ISO3, aktör bağı için
  startedAt: string; updatedAt: string; endedAt?: string;
  source: { name: string; url: string; license: string };
  raw?: unknown;
};

type Link = {
  id: string;
  from: string; to: string;    // event id veya varlık id
  type: 'spatial'|'actor'|'exposure'|'temporal'|'causal';
  computed: boolean;           // true: link engine, false: kürate
  evidence?: 'strong'|'moderate'|'speculative';  // yalnızca causal
  distanceKm?: number;
  citations?: string[];
};

type Dyad = {
  a: string; b: string;        // ISO3
  tension: number;             // 0-100
  components: { tone: number; activeConflict: boolean; recentIncidents: number; treaty: string };
  updatedAt: string;
};
```

### API

| Uç nokta | Açıklama |
|---|---|
| `GET /api/events?domain=&since=&country=&minSeverity=` | Olaylar |
| `GET /api/links?for=<id>&type=` | Bir öğenin bağları |
| `GET /api/dyads` | Nükleer gerilim çiftleri |
| `GET /api/country/:iso` | Ülke profili özeti |
| `GET /api/watchlist/supervolcanoes` | Watchlist ve canlı durum |
| `GET /api/series/:name?scenario=` | İklim serileri/projeksiyonlar |
| `GET /api/forecasts` | Atıflı uzman kestirimleri |
| `GET /api/health` | Kaynak canlılığı |
| `GET /api/stream` (SSE) | Yeni olay ve uyarılar |

## 8. Tasarım sistemi

- **Zemin:** `#05080d`, yüzeyler `#0b111a` / `#121a26`.
- **Tema: hacker analiz odası.** Ultra koyu, ince neon kenarlıklı yarı saydam paneller (`rgba(10,15,20,.8)`), monospace sayılar.
- **Ana palet (Gemini taslağından):** zemin `#050505`; kırmızı `#FF003C` (tehdit: nükleer, çatışma); yeşil `#00FF41` (güvenli/eylem: hayatta kalma merkezi, haberleşme, sistem durumu); mor `#B026FF` (biyolojik tehdit); mavi `#00E5FF` (vurgu, su, iklim).
- **Alan renkleri:** Nuclear kırmızı, Conflict turuncu-kırmızı `#FF6A00`, Health mor, Climate & Water mavi, Geophysical amber `#FFB000`, Space soluk lavanta `#C9D1FF`. Yeşil yalnızca "güvenli/eylem" için ayrılmıştır.
- **Veri türü ayrımı renkle değil çizgi stiliyle yapılır:** gözlem dolu/düz çizgi, projeksiyon kesikli çizgi + `PROJ` etiketi, uzman kestirimi içi boş işaret + atıf. Renk tek başına anlam taşımaz (ikon/şekil de).
- **Tipografi:** monospace etiketler (JetBrains Mono / IBM Plex Mono), gövde sans.
- **Hareket:** yeni olay halka animasyonu, bağlar arc animasyonu. `prefers-reduced-motion` desteklenir.
- **Ton:** Görsel stil hacker odası olsa da **metin soğukkanlı ve olgusal** kalır ("Elevated", "Stable"). "INTRUSION DETECTED" tarzı sahte alarm metinleri ve parıltılı panik animasyonları yok. Parıltı yalnızca seçili/aktif öğelerde, düşük yoğunlukta.

## 9. Riskler

| Risk | Önlem |
|---|---|
| Gerilim endeksi ve bağların yanlış yorumlanması | Endeks "tahmin değil" etiketi, `/methodology`, bileşenleri açık |
| Nedensel iddiaların aşırılığı | Yalnızca kaynaklı kenarlar, kanıt düzeyi etiketi, spekülatif olanlar gizli |
| Panik/yanlış bilgi algısı (Yellowstone vb.) | Uyarı seviyesi ve "tekrarlama ≠ tahmin" notu her süper volkan kartında |
| Çatışma ve salgın verisinin hassasiyeti | Yalnızca yayımlanmış açık kaynak, doğrulama düzeyi görünür |
| Kaynak API değişikliği/limit | Ingestor başına önbellek, canlılık sayfası, yedek kaynak |
| Lisans (ACLED, bazı OWID/forecast verileri) | Ticari kullanım kararından önce lisans kontrolü |
| Kapsam şişmesi | Altı alan dışında yeni alan eklenmez, her faz çalışan ürün çıkarır |

## 10. Yol haritası

1. **Faz 1:** Toplu iş hattı, `world_state.json` + CDN, MapLibre koyu harita, hacker tema, alan seçici ve durum şeridi, USGS depremleri (M5+), `/sources`.
2. **Faz 2 (tamamlandı, 3 Ekim 2026):** Sayaç paneli (8 sayaç: Doomsday Clock, SIPRI başlık sayısı, sıcaklık, CO₂, Overshoot Day, WHO salgın raporları, gemi darboğazları, Kp), Nuclear katmanı (195 santral + 9 cephanelik baloncuğu), `/nuclear`.
   - Sapmalar: santral verisi IAEA PRIS yerine WRI GPPD v1.3 (CC BY 4.0, ~2019 vintage; PRIS Faz 5'e kaldı). "Aktif salgın sayısı" yerine "WHO raporu sayısı (90 gün)" kullanıldı, çünkü rapor sayısı salgın sayısı değildir. Sıcaklık sayacı 1951-1980 tabanlıdır, +1.5 °C hedefine kalan süre henüz gösterilmiyor (tabanlar farklı). Nükleer gerilim çiftleri Faz 4'te (GDELT ile).
   - Gerçek veri notları: SIPRI Yearbook 2026 (8 Haz 2026): toplam 12.187 başlık, askerî stok 9.745; New START Şubat 2026'da sona erdi. Doomsday Clock 85 sn (27 Oca 2026). Earth Overshoot Day 30 Temmuz 2026.
3. **Faz 3 (paralel, çoğu statik içerik):** `/survive` Action Hub: bug-out bag, Readiness Score, comms rehberi, tıbbi kütüphane (resmî kaynaklı), PWA/çevrimdışı.
4. **Faz 4:** Health akışı (WHO DON, ECDC, hayvan hastalıkları), süper volkan watchlist, gerilim çiftleri (GDELT).
5. **Faz 5:** Link engine ve Connections modu, ülke profilleri.
6. **Faz 6:** Senaryo paketleri, bu sırayla: Supervolcano, Pandemic X, Nuclear war & winter, Solar superstorm, ardından Asteroid, Climate tipping, Food & water; Dormant pathogens yalnızca harita katmanı.
7. **Faz 7:** Kürate nedensel graf (`/links`), uzman kestirimleri paneli, `/trajectory`, `/methodology`, cila ve performans testleri (orta seviye telefonda).

## 11. Açık kararlar

**Kararlar (kesinleşti):**
- Proje **kişisel**, reklam/sponsorluk yok. Amaç eğlence + bilgi.
- Harita motoru: **MapLibre GL + PMTiles**.
- **Hazırlık skoru yok, giriş/hesap sistemi yok.** Kullanıcı verisi yalnızca cihazda.
- Simülasyonlar başta **illustrative** etiketli.
- Senaryo listesi geniş; her biri **A/B/C kanıt kademesi** taşır, C varsayılan gizli (bölüm 2.5).

**Hâlâ açık (varsayılanla ilerlenir, istenirse değiştirilir):**
- Tıbbi içerik: yalnızca resmî kaynak bağlantıları/alıntılar, kendi dozaj metni yok (varsayılan).
- Gerilim çifti listesi: bölüm 2.1'deki başlangıç listesi (varsayılan).
- Kürate nedensel graf taslağını Claude çıkarır, kaynaklar elle doğrulanır (varsayılan).
- Advanced AI risk: B kademesinde, yalnızca atıflı uzman kestirimi olarak (varsayılan).
- Alan adı ve barındırma: ücretsiz katmanla başla (Cloudflare Pages/Vercel).
- Proje ticari mi, kişisel mi? ACLED ve bazı veri lisanslarını belirler.
- Gerilim çifti listesi: yukarıdaki başlangıç listesi yeterli mi, siyasi olarak hassas çiftler (ör. İsrail-İran) nasıl etiketlenecek?
- Kürate nedensel grafın ilk sürümünü kim yazacak/gözden geçirecek? (Öneri: ben taslak çıkarırım, kaynakları siz doğrularsınız.)
- Emerging tech (AI/biyogüvenlik) 7. alan olarak v1'e girsin mi? (Öneri: hayır.)

## Yazdırma

Her içerik sayfasında "Print this section" / "Print whole page" düğmeleri vardır; harita kendi yatay sayfasına basılır (açık kâğıt seçeneğiyle). Survive sayfasında işaretlenebilir kontrol listesi, doldurulacak hane planı ve cüzdan kartı (85 x 55 mm) yazdırılır. Her şey tarayıcıda çalışır, çevrimdışı kullanılabilir, hiçbir veri gönderilmez. Doğrulama: `scripts/check-print.mjs` (PDF'ler `out-print/` içine).
