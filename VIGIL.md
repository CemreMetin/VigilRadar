# VIGIL — PROJE BELGESİ

Sürüm: 2026-11-17 · Sahibi: Cemre (Radian Collective) · Durum: tasarım tamam, uygulama Faz 0'da

Bu, Vigil projesinin **tek belgesidir**. Projeyle ilgili her şey burada: ne olduğu, neden var olduğu, nasıl çalıştığı ve nasıl inşa edileceği. Eski dört belgenin (refactor promptu, teknik mimari, ürün spesifikasyonu, yol haritası) yerine geçer; onlar artık kullanılmaz.

## Bu belge nasıl okunur

| Kimsin? | Ne oku? |
|---|---|
| Projeyi ilk kez duyan biri | **Kısım A** (10 dakika). Teknik bilgi gerekmez. |
| Cemre | Kısım A'nın tamamı; Kısım B'den Bölüm 2 (kararlar), 10 (metinler) ve 14 (senin yapacakların). |
| Kodu yazacak kişi veya Claude Code | Kısım A'yı bağlam için bir kez oku, sonra **Kısım B'yi uygula**. |

**Çelişki kuralı:** Kısım A anlatır, Kısım B bağlar. İkisi çelişirse **Kısım B geçerlidir**. Kısım A hiçbir yeni gereksinim içermez; orada geçen her sayı Kısım B'deki bir kuralın sadeleştirilmiş halidir.

**Claude Code için tek cümlelik görev:** Kısım B'yi, Bölüm 0'daki çalışma kurallarına uyarak, Bölüm 13'teki faz sırasıyla uygula; soru sorma.

---
---

# KISIM A — VIGIL'İ ANLAMAK

## A1. Tek cümleyle

Vigil, dünyadaki büyük depremleri ve çatışmaları izleyip **"Ne oldu? Neyi etkileyebilir? Bana etkisi ne, ne yapmalıyım?"** sorularına sakin ve dürüst bir cevap veren, ücretsiz iki araçtır: bir web sitesi (**VigilRadar**) ve bir cep uygulaması (**VigilAlert**).

## A2. Neden var?

Kriz anında insanlar iki uçtan birine düşer: ya hiçbir şey bilmezler, ya da binlerce noktanın yanıp söndüğü haritalara bakıp ne yapacaklarını bilemezler. Mevcut araçların çoğu "her şeyi gösterir" ama "ne anlama geldiğini" söylemez.

Vigil'in eski hali de böyleydi: 23 senaryo sekmesi, 14 sayaç, binlerce askeri üs, kablo ve uydu katmanı. Etkileyici görünüyordu ama kimse neye bakacağını bilmiyordu.

Yeni Vigil üç fikir üzerine kurulu:

1. **Az göster, anlamlı göster.** Haritada yalnızca üç şey var: büyük depremler, doğrulanabilir çatışma kümeleri ve kritik varlıklar (nükleer santraller ile altı deniz boğazı).
2. **Bağlantıyı kur.** Bir felaket tek bir nokta değildir. Deprem bir santralin yakınındaysa ya da çatışma bir boğazın dibindeyse Vigil bunu bir çizgiyle gösterir. Buna **kaskat** (zincirleme etki) diyoruz.
3. **Dürüst ol.** Vigil bilmediği şeyi biliyormuş gibi yapmaz. Her verinin kaynağı, tarihi ve güvenilirlik etiketi görünür. Veri eskiyse ekranda "eski" yazar. Sana etkisi yoksa "sana etkisi yok" der.

## A3. İki ürün

### VigilRadar — analiz masası (web sitesi)
Bilgisayardan ya da telefondan açılan bir harita sitesi. Dünyada şu an önemli ne olduğunu ve bunun kritik altyapıya yakınlığını gösterir. Bir olaya tıklayınca dört başlıklı tek bir kart açılır: *Ne oldu? · Neyi etkileyebilir? · Sana etkisi · Ne yapmalısın?*

Kimin için: dünyada olanları anlamak isteyen meraklı insanlar, gazeteciler, öğrenciler, hazırlıklı olmak isteyen herkes.

### VigilAlert — cep kalkanı (telefona eklenen uygulama)
Aynı verinin sadeleştirilmiş, kişiye göre süzülmüş hali. İlini seçersin; yakınında güçlü bir deprem olduğunda sana bildirim gönderir ve "şimdi ne yapmalısın" ekranını açar. Sakin zamanlarda ise bir hazırlık defteridir: deprem çantası listesi, doğru bilinen yanlışlar, kendi radyo frekansın.

Kimin için: Türkiye'de yaşayan ve deprem sonrası ilk dakikalarda ne yapacağını bilmek isteyen herkes.

### İkisi arasındaki fark

| | VigilRadar | VigilAlert |
|---|---|---|
| Bakış | Dünya | Senin ilin |
| Ne zaman açılır | Merak ettiğinde | Bildirim geldiğinde ya da hazırlık yaparken |
| Ana soru | "Dünyada ne oluyor, neyi etkiliyor?" | "Bana ne oldu, şimdi ne yapmalıyım?" |
| Biçim | Harita + kart | Liste + büyük düğmeler |

İkisi **aynı beyni** kullanır: aynı veri, aynı kurallar. Yalnızca gösterdikleri farklıdır.

## A4. Vigil ne DEĞİLDİR (en önemli bölüm)

- **Erken uyarı sistemi değildir.** Bu, projenin başındaki hedefti ama mümkün olmadığı anlaşıldı. Resmi kurumlar (AFAD, Kandilli, USGS) bir depremin verisini sarsıntıdan **dakikalar sonra** yayınlar. Vigil bu veriyi hızla sana ulaştırır, ama sarsıntıdan önce haber veremez. Tek istisna tsunamidir: deprem ile dalga arasında gerçekten zaman vardır.
- **Telefonunla deprem ölçmez.** Bunun için aynı mahallede yüzlerce telefonun aynı anda veri göndermesi gerekir; bağımsız bir uygulama bunu başaramaz, telefonlar da arka planda buna izin vermez.
- **Resmi bir kurum değildir.** AFAD'ın ve 112'nin yerine geçmez.
- **Siren değildir.** Telefonun sessizdeyse bildirim ses çıkarmaz.
- **Seni takip etmez.** Konum izni istemez, hesap açtırmaz, reklam göstermez, para kazanmaz.
- **Her şeyi göstermez.** Uçak, gemi, uydu, askeri üs, kasırga, güneş fırtınası yoktur. Bilerek.

## A5. Bir örnekle nasıl çalışır

**Senaryo:** Salı öğleden sonra 14:32'de Malatya yakınında 6.4 büyüklüğünde bir deprem oluyor. Ayşe Elazığ'da yaşıyor ve VigilAlert'te ilini "Elazığ" seçmiş.

1. **14:33–14:35** — AFAD ve Kandilli depremi yayınlıyor. Vigil'in bekçi programı her dakika bu kurumlara baktığı için depremi görüyor.
2. **Tekilleştirme.** Aynı deprem dört kurumdan biraz farklı sayılarla gelir (6.3, 6.4, 6.5…). Vigil bunların aynı olay olduğunu anlar ve tek kayda indirir. Türkiye'deki depremlerde AFAD'ın değerini esas alır.
3. **"Kime ne kadar yakın?"** Vigil 81 ilin her biri için depremin uzaklığını ve derinliğini hesaplar. Elazığ merkeze 70 km: "güçlü hissedilmiş olabilir" (P1). Malatya 15 km: "yıkıcı olabilir" (P0). Ankara 500 km: seviye yok.
4. **"Neyi etkileyebilir?"** Vigil depremin çevresinde nükleer santral ya da boğaz var mı diye bakar. Bu örnekte yok; bağlantı çizilmez.
5. **Bildirim.** Ayşe'nin telefonuna şu gelir: *"M6.4 DEPREM — Elazığ merkezine 70 km · 14:32 · derinlik 9 km · İlinde güçlü hissedilmiş olabilir."* Aynı mesaj Vigil'in Telegram kanalına da düşer.
6. **Kriz ekranı.** Ayşe bildirime dokunur. Ekran siyah-kırmızıya döner ve yalnızca gerekli olanı gösterir: üç maddelik "şimdi ne yapmalı" listesi, haberleşme bilgileri, ve üç büyük düğme (ekranı fener yap, acil düdük, "iyiyim" mesajı hazırla).
7. **Radar'da.** Aynı anda siteyi açan biri haritada Malatya'da parlayan bir halka görür. Üst bantta "KÜRESEL: NOMINAL" yazar (çünkü dünya ölçeğinde olağanüstü değil), Malatya'yı seçmiş biri için ise "BÖLGEN: CRITICAL".
8. **Sonrası.** Bir saat sonra AFAD büyüklüğü 6.6'ya düzeltirse Vigil **bir kez** "GÜNCELLEME" gönderir. Artçılar için Ayşe'yi yarım saatte birden fazla rahatsız etmez.

**İkinci örnek (uzak olay):** Japonya'da 7.1 büyüklüğünde bir deprem oluyor, 180 km ötesinde bir nükleer santral var. Radar'da depremden santrale kesikli bir çizgi çekilir, küresel durum yükselir. Ayşe bu olaya tıklarsa kartta şunu okur: *"Sana doğrudan fiziksel etkisi yok."* ve santral için: *"Bu bir hasar bildirimi değildir; santraller güçlü sarsıntıda otomatik durur."* Telefonuna bildirim gitmez.

## A6. Ekranda ne görürsün

### Radar
Yalnızca üç bölge vardır, başka hiçbir şey yoktur:

```
┌────────────────────────────────────────────────────────────────┐
│ ÜST BANT: Vigil çalışıyor mu? Dünya ne durumda? Senin ilin?    │
├──────────────────────────────────────────────┬─────────────────┤
│                                              │ KART            │
│                 HARİTA                       │ Ne oldu?        │
│   ○ deprem   □ çatışma   ◇ santral  ═ boğaz  │ Neyi etkiler?   │
│   - - - kaskat çizgisi                       │ Sana etkisi     │
│                                              │ Ne yapmalısın?  │
├──────────────────────────────────────────────┴─────────────────┤
│ ALT SATIR: boğazların durumu · kaynaklar · hakkında            │
└────────────────────────────────────────────────────────────────┘
```

Üst banttaki durum dört değerden biridir:

| Durum | Anlamı |
|---|---|
| `NOMINAL` | Olağanüstü bir şey yok. |
| `ELEVATED` | Dikkat çeken bir olay var (ör. dünyada 6.5+ deprem). |
| `CRITICAL` | Ciddi bir olay ya da bir zincirleme etki var (ör. 7.5+ sığ deprem, santral yakınında olay). |
| `STALE` | Vigil'in verisi eski; ekrandakine güvenme. |

Durumun yanında her zaman **nedeni** yazar. Nedensiz alarm yoktur.

### Alert
İki hali vardır:
- **Barış modu** (her zamanki hal): ilinin durumu, bildirim ayarı, 72 saatlik çanta listesi, kendi radyo frekansın, doğru bilinen yanlışlar ve bir "tatbikat" düğmesi.
- **Kriz modu** (bildirim geldiğinde): siyah ekran, büyük yazı, yapılacaklar, üç araç düğmesi. Başka hiçbir şey yok.

## A7. Perde arkası: üç parça

Vigil üç küçük parçadan oluşur. Hiçbirinde klasik anlamda bir sunucu ya da veritabanı yoktur; bu yüzden ucuzdur ve kalabalıkta çökmez.

1. **Site** — Radar ve Alert'in ekranları. Önceden hazırlanmış dosyalardan ibarettir ve Cloudflare'in dağıtım ağında durur. Yüz bin kişi aynı anda girse de dayanır.
2. **Bekçi** — Cloudflare üzerinde her dakika bir kez uyanan küçük bir program. Deprem kurumlarına bakar, kuralları uygular, gerekiyorsa bildirim gönderir ve sonucu tek bir özet dosyaya yazar. Site bu özeti dakikada bir okur.
3. **Toplayıcı** — GitHub üzerinde yarım saatte bir çalışan bir iş. Ağır ve yavaş verileri (çatışma haberleri, boğaz trafiği) işleyip bekçiye teslim eder.

**Güvenlik ağı:** Bekçi çalışmazsa site pes etmez; depremleri doğrudan USGS ve EMSC'den kendisi çeker ve aynı kuralları tarayıcıda uygular. Ekranda "YEDEK KAYNAK" yazar. O da olmazsa "STALE" yazar ve en son bildiğini saatiyle gösterir. **Vigil hiçbir zaman eski veriyi güncelmiş gibi göstermez.**

## A8. Veriler nereden geliyor

| Ne | Kimden | Ne sıklıkla | Ne kadar güvenilir |
|---|---|---|---|
| Türkiye depremleri | AFAD, Kandilli Rasathanesi | Dakikada bir | Resmi kurum; ilk dakikalarda "ön veri" |
| Dünya depremleri | USGS (ABD), EMSC (Avrupa) | Dakikada bir | Resmi kurum |
| Tsunami uyarıları | ABD tsunami uyarı merkezleri | 5 dakikada bir | Resmi; Pasifik ve Atlantik ağırlıklı |
| Çatışma olayları | GDELT (dünya haberlerini tarayan açık veri) | 30 dakikada bir | **Düşük.** Makine haberlerden çıkarır; doğrulanmamıştır |
| Boğaz trafiği | IMF PortWatch | Günlük, birkaç gün gecikmeli | İyi ama canlı değil |
| Nükleer santraller | GeoNuclearData (açık veri) | Sabit liste | Konumlar yaklaşık |
| İller | GeoNames (açık veri) | Sabit liste | İyi |

Çatışma verisi zayıf olduğu için Vigil onu sıkı bir süzgeçten geçirir: tek bir haber yetmez; aynı bölgede en az üç olay ve en az üç ayrı haber kaynağı gerekir, konumun da şehir düzeyinde belli olması şarttır. Yine de ekranda her zaman "medya bildirimi, doğrulanmamış" etiketi durur.

## A9. Vigil nasıl karar veriyor (sade anlatım)

**Deprem sana ne kadar yakın? (P0 / P1 / P2)**
Büyüklük arttıkça etki alanı genişler. Vigil büyüklüğe, ilin merkezine uzaklığa ve derinliğe bakarak üç seviyeden birini verir:

| Seviye | Anlamı | Örnek | Bildirim |
|---|---|---|---|
| **P0** | Yıkıcı olabilir | 7.0 büyüklük, 150 km içinde | Gider |
| **P1** | Güçlü hissedilmiş olabilir | 6.0 büyüklük, 100 km içinde | Gider |
| **P2** | Hissedilmiş olabilir | 5.0 büyüklük, 120 km içinde | Gitmez; yalnızca uygulamada görünür |

Bu bir **kaba tahmindir**, resmi şiddet haritası değildir; ekranda da öyle yazar. Tam tablo Kısım B, Bölüm 5.1 ve 5.3'tedir.

**Bir olay bir varlığa ne zaman bağlanır?**
- Deprem → santral: büyüklüğe göre değişen bir mesafe içindeyse (5.0 için 25 km, 7.0 için 250 km).
- Deprem → boğaz: 6.5 ve üzeri, 150 km içinde.
- Çatışma → santral: 50 km içinde. Çatışma → boğaz: 150 km içinde.

**Yanlış alarmı nasıl önlüyor?**
- En ciddi bildirim (P0) için ya iki kurumun aynı depremi doğrulaması ya da tek kurumun verisinin 90 saniye ayakta kalması gerekir.
- Bir kurum depremi geri çekerse "İPTAL" gönderilir.
- Aylardır süren bir durum (ör. çatışma bölgesindeki bir santral) "kronik" sayılır: haritada görünür ama alarmı sürekli açık tutmaz.

## A10. Gizlilik

- Hesap yok. Konum izni yok. Analitik, çerez, reklam yok.
- İl seçimin, çanta listen ve radyo frekansın **yalnızca kendi cihazında** durur.
- Bildirim açarsan sunucuda tek bir şey saklanır: tarayıcının verdiği anonim bildirim adresi ve seçtiğin il. Kapatınca silinir.

## A11. Maliyet ve sınırlar

Vigil ücretsizdir ve gelir amacı yoktur. Cloudflare ve GitHub'ın ücretsiz planlarında çalışacak şekilde tasarlandı. Bunun bedeli:
- Bekçi günde 100.000 isteğe cevap verebilir. Aşılırsa site yedek kaynağa geçer; çökmez.
- Telefon bildirimi kalabalık abone sayısında gecikebilir. Bu yüzden ana kanal Telegram'dır; orada sınır yoktur.

## A12. Proje nerede, sırada ne var?

Tasarım bitti. Uygulama dokuz adımda yapılacak:

| Faz | Ne yapılır | Bitince ne olur |
|---|---|---|
| 0 | Mevcut kod incelenir, derleme düzeltilir, eski sekme ve sayaçlar alt sayfalara taşınır | Site yeniden derlenir, ana ekran boşalır |
| 1 | Karar kuralları (beyin) yazılır ve test edilir | Kurallar geçmiş depremlerle doğrulanmış olur |
| 2 | Sabit veriler hazırlanır (santraller, iller, dünya haritası) | Harita çizilebilir |
| 3 | Bekçi yazılır (depremler, tsunami) | Canlı veri akar |
| 4 | Radar ekranı yazılır | **Radar kullanılabilir** |
| 5 | Toplayıcı yazılır (çatışma, boğazlar) | Radar tamamlanır |
| 6 | Bildirimler (Telegram, telefon) | Uyarılar gider |
| 7 | Alert uygulaması | **Alert kullanılabilir** |
| 8 | Çeviri, erişilebilirlik, kurulum kılavuzu | Yayına hazır |

Kodu Claude Code yazar. Cemre'nin elle yapması gereken birkaç kurulum adımı vardır (Telegram botu, anahtarlar); Kısım B, Bölüm 14'te listelenmiştir.

## A13. Bilinen zayıf noktalar (gizlemiyoruz)

- P0/P1/P2 mesafeleri kaba bir tahmindir; zemin yapısını, fay yönünü bilmez.
- Çatışma verisi gürültülüdür; süzgece rağmen yanlış ya da eksik olabilir.
- Akdeniz ve Ege için resmi bir tsunami beslemesi yok; Türkiye kıyıları için Vigil kendi basit kuralını kullanır ve bunun resmi uyarı olmadığını söyler.
- Güvenlik metinleri (Kısım B, Bölüm 10) genel kabul görmüş önerilere dayanır; yayından önce AFAD'ın güncel rehberiyle karşılaştırılmalıdır.
- AFAD'ın veri adresi bu belge yazılırken canlı doğrulanamadı; çalışmazsa sistem diğer üç kaynakla devam eder.

## A14. Sözlük

| Terim | Anlamı |
|---|---|
| **Kaskat** | Zincirleme etki. Bir olayın başka bir şeyi (santral, boğaz) etkileme olasılığı. |
| **Bağlantı / yay** | Haritada olaydan varlığa çekilen kesikli çizgi. |
| **Varlık** | Vigil'in izlediği sabit kritik noktalar: nükleer santraller ve altı boğaz. |
| **Episantr** | Depremin yeryüzündeki merkez noktası. |
| **Hiposantral mesafe** | Depremin yer altındaki odağına olan gerçek uzaklık (yüzey mesafesi + derinlik birlikte). |
| **P0 / P1 / P2** | Bir depremin belirli bir il için önem seviyesi (A9). |
| **NOMINAL / ELEVATED / CRITICAL / STALE** | Üst banttaki dört durum (A6). |
| **Kronik** | Bir haftadan uzun süren bağlantı; gösterilir ama alarmı yükseltmez. |
| **Yedek yol** | Bekçi çalışmadığında sitenin depremleri doğrudan kurumlardan çekmesi. |
| **Kanıt etiketi** | Verinin güvenilirliği: A (resmi ölçüm), B (makul / medya bildirimi), C (dolaylı tahmin). |
| **PAGER** | USGS'in bir depremin olası can ve mal kaybı için verdiği renk (yeşil, sarı, turuncu, kırmızı). |
| **GDELT / CAMEO** | GDELT dünya haberlerini tarayan açık veritabanı; CAMEO onun olay türü kodlaması. |
| **PortWatch** | IMF'nin boğazlardan geçen gemi sayısını yayınlayan açık verisi. |
| **PWA** | Mağazadan indirmeden, tarayıcıdan "ana ekrana ekle" ile kurulan uygulama. Alert budur. |
| **Web Push** | PWA'nın telefona bildirim gönderme yolu. |
| **VAPID** | Web Push için gereken anahtar çifti. |
| **Worker** | "Bekçi"nin teknik adı: Cloudflare üzerinde çalışan küçük program. |
| **KV** | Bekçinin not defteri: Cloudflare'in basit anahtar-değer deposu. |
| **Cron** | "Her dakika çalış" gibi zamanlama. |
| **core/** | Karar kurallarının bulunduğu kod klasörü; site, bekçi ve testler aynısını kullanır. |
| **Service worker** | Alert'in internetsiz çalışmasını ve bildirim almasını sağlayan tarayıcı parçası. |

---
---

# KISIM B — UYGULAMA ŞARTNAMESİ

Bu kısım bağlayıcıdır. Kodu yazan kişi ya da Claude Code buradaki her kararı olduğu gibi uygular. "Bölüm N" atıfları bu kısmın numaralı bölümlerini gösterir.


## 0. ÇALIŞMA KURALLARI (önce bunu oku)

1. **Soru sorma.** Bu belgedeki her karar verilmiştir. Belgenin cevaplamadığı bir ayrıntıyla karşılaşırsan en basit, en az bağımlılık getiren seçeneği uygula ve `docs/DECISIONS.md` dosyasına tek satırla yaz (`tarih · karar · gerekçe`). Durma, devam et.
2. **Yalnızca kod, test ve bu belgenin istediği dokümanları yaz.** Yeni özellik icat etme. Bölüm 1.3'teki "yapılmayacaklar" listesi kesindir.
3. **Uydurma veri yasak.** Koordinat, frekans, güvenlik talimatı, etki notu gibi içerikleri kendin üretme. Hepsi ya Bölüm 10'da kelimesi kelimesine verilmiştir ya da Bölüm 4'teki kaynaklardan script ile çekilir.
4. **Şemayı varsayma, yokla.** Her dış kaynak için önce `scripts/probe/` altında tek bir canlı istek atan script yaz, gerçek yanıtı `scripts/probe/samples/` altına kaydet, adaptörü o örneğe göre yaz. Bu belgedeki alan adları "beklenen"dir; canlı yanıt farklıysa canlı yanıt kazanır.
5. **Bir kaynak çalışmıyorsa** (403, şema bozuk, CORS yok): adaptörü `enabled: false` ile bırak, `DECISIONS.md`'ye yaz, diğerleriyle devam et. Hiçbir tek kaynak sistemi durduramaz.
6. **Gizli anahtar yoksa özellik kapalı çalışır.** Telegram veya VAPID anahtarı tanımlı değilse ilgili kanal sessizce devre dışı kalır, hata fırlatmaz.
7. **Silme, taşı.** Mevcut 23 senaryo ve 14 sayaç silinmez (Faz 0).
8. **Her faz sonunda:** `typecheck`, `lint`, `test`, `build` yeşil olmalı; sonra tek commit (`faz-N: özet`). Yeşil değilse sonraki faza geçme.
9. **Ağır kütüphane ekleme.** İzinli yeni bağımlılıklar: `maplibre-gl` (zaten var), `world-atlas`, `topojson-client`, `@pushforge/builder`, `fflate` (yalnızca script'lerde zip açmak için), `vitest`, `wrangler`. Bunların dışında bağımlılık ekleme.
10. **Dil:** Kod ve yorumlar İngilizce. Arayüz metinleri Türkçe + İngilizce (Bölüm 8.6).

---

## 1. ÜRÜN TANIMI

### 1.1 VigilRadar
Dünyadaki büyük fiziksel olayları (deprem, kinetik çatışma) ve bunların kritik altyapıya (nükleer santral, deniz boğazı) olası etkisini gösteren, sakin, statik bir analiz masası. Üç soruya cevap verir: **Ne oldu? Neyi etkileyebilir? Bana etkisi ne, ne yapmalıyım?**

### 1.2 VigilAlert
Aynı çekirdeği kullanan cep kalkanı. **Erken uyarı sistemi değildir.** Resmi sismoloji ağlarının verisi sarsıntıdan dakikalar sonra gelir; Alert bu veriyi kullanıcının iline göre değerlendirip "ne oldu, sana ne kadar yakın, şimdi ne yapmalısın" bilgisini iletir. Gerçek ön uyarı süresi yalnızca tsunamide vardır.

Arayüzde ve bildirimlerde "erken uyarı", "siren", "sıfır gecikme" ifadeleri **kullanılmaz**. Kullanılacak ifade: "hızlı doğrulama ve sonrası rehberi".

### 1.3 Yapılmayacaklar (kesin)
- Telefon ivmeölçeriyle deprem tespiti.
- GPS/konum izni istemek. Kamera, mikrofon, rehber izni istemek.
- Kullanıcı hesabı, üyelik, analitik, üçüncü taraf script, Google Fonts, harita karo sunucusu.
- Uçak/gemi/uydu/askeri üs/kablo katmanları. Nükleer cephanelik katmanı (açık ve güvenilir veri yok, kullanıcıya eylem üretmiyor).
- Kasırga ve uzay havası (Kp) alarmları. v1 kapsamı: deprem, tsunami, kinetik çatışma, boğaz akışı.
- React Native / Expo. Alert bir PWA'dır.
- Çatışma olayları için kişisel güvenlik talimatı vermek.
- Reklam, bağış butonu, gelir özelliği. İki ürün de ücretsizdir.

---

## 2. ÇÖZÜLMÜŞ ÇELİŞKİLER

| Konu | Karar |
|---|---|
| Etki mesafesi (50 / 100 / 150 km) | Sabit mesafe yok. Büyüklüğe göre ölçeklenen tablo (Bölüm 5.4). |
| Çatışma filtresi (Goldstein < -7) | Goldstein kullanılmaz. CAMEO olay kodu + konum hassasiyeti + çoklu kaynak (Bölüm 5.6). |
| Deprem kaynakları | USGS + EMSC (küresel), AFAD + Kandilli (Türkiye). |
| Alert eşikleri (küresel M7+) | Kullanıcının iline uzaklık + büyüklük + derinlikten P0/P1/P2 (Bölüm 5.3). |
| Tsunami / kasırga / Kp | Tsunami var. Kasırga ve Kp yok. |
| Sayaçların yeri | Senaryolar `/library`, sayaçlar `/metrics`. |
| Üst bant metni | `VIGILRADAR // LIVE` veya `VIGILRADAR // STALE`. Durum ayrı alanda. |
| "Su şebekesi" | v1'de yok. Metinlerden çıkar. |
| Ülke tespiti (`cf-ipcountry`) | Kullanılmaz. Tarayıcı saat dilimi `Europe/Istanbul` ise il seçimi önerilir. Sunucuya bir şey gitmez. |
| "Sıfır veritabanı" | Dürüst ifade: "Hesap yok, konum yok. Bildirim açarsan yalnızca anonim bildirim adresin ve seçtiğin il saklanır." |
| Bildirim kanalı | Telegram kanalı + PWA Web Push, ikisi birden. |
| Kapsam | Harita küresel. Bölge seçici: `Küresel` + Türkiye'nin 81 ili. |
| Durum göstergesi | İki ayrı gösterge: `KÜRESEL` ve `BÖLGEN`. Dördüncü durum: `STALE`. |
| "5 Boğaz Açık" | Kullanılmaz. Yerine: `6 boğaz izleniyor · sapma yok · veri: <tarih>`. |
| Harita tabanı | Karo sunucusu yok. `world-atlas` ülke poligonları yerel GeoJSON olarak çizilir. |
| Mevcut kod | Ana ekran sıfırdan yazılır; eski içerik taşınır. |

---

## 3. MİMARİ

```
                 HIZLI HAT (dakikada 1)                       YAVAŞ HAT (30 dakikada 1)
   USGS  EMSC  AFAD  Kandilli  NTWC/PTWC                      GDELT export   IMF PortWatch
     └────┴─────┴──────┴─────────┘                                  └────────┬───────┘
                 │                                                           │
     ┌───────────▼───────────────┐   POST /v1/ingest/slow     ┌──────────────▼─────────┐
     │ Cloudflare Worker          │◄───────────────────────────│ GitHub Actions          │
     │ "vigil-daemon" (cron)      │   (Bearer INGEST_TOKEN)    │ scripts/data/slow.mjs   │
     │ core/ ile değerlendirir    │                            └─────────────────────────┘
     │ KV: state, subs, sent      │
     └──┬─────────┬───────────┬───┘
        │         │           │
   Telegram    Web Push    GET /v1/state  ◄──── Radar ve Alert (60 sn'de bir, sekme görünürken)
                                                   │ Worker'a ulaşamazsa:
                                                   └──► USGS + EMSC'den doğrudan çek, core/ ile tarayıcıda hesapla
```

İlkeler:
- **`core/` saf TypeScript'tir** (DOM yok, Node API yok, `fetch` yok). Worker, tarayıcı ve testler aynı kodu kullanır.
- Statik site (Next.js static export, Cloudflare Pages) veritabanına bağlı değildir. Worker çökse bile Radar yedek yoldan çalışır.
- Veri güncellemesi **site derlemesi tetiklemez**. Yavaş hat Worker'a POST eder.

### 3.1 Depo yerleşimi (mevcut yapıya ekle; var olan klasör adlarına uy)

```
core/                      saf mantık + tipler + config
  config.ts                TÜM eşikler burada (Bölüm 5.1)
  types.ts
  geo.ts                   haversine, hiposantral mesafe, büyük daire yayı
  quakes/normalize.ts      kaynak başına adaptör (ham -> QuakeEvent)
  quakes/merge.ts          tekilleştirme
  severity.ts              P0/P1/P2
  cascade.ts               bağlantı kuralları
  status.ts                KÜRESEL / BÖLGEN durumu
  tsunami.ts
  conflict.ts              kümeleme
  chokepoints.ts           sapma hesabı
  content/                 Bölüm 10 metinleri (tr.ts, en.ts)
  __tests__/  __fixtures__/
daemon/
  wrangler.toml
  src/index.ts             fetch + scheduled
  src/sources/*.ts         usgs, emsc, afad, kandilli, tsunami
  src/notify/telegram.ts  webpush.ts  policy.ts
  src/store.ts             KV erişimi, yazma bütçesi
scripts/
  probe/                   canlı şema yoklama + samples/
  data/build-plants.mjs  build-places.mjs  build-world.mjs  slow.mjs
public/data/static/        plants.json  places.tr.json  world.json  chokepoints.json
public/sw.js  public/manifest.webmanifest
app/ (veya mevcut router)  /  /alert  /library  /metrics  /about
docs/  CURRENT_STATE.md  DECISIONS.md  SETUP.md
```

---

## 4. VERİ KAYNAKLARI

Her kaynak için önce yoklama script'i (Kural 0.4). Her istekte `User-Agent: VigilRadar/1.0 (+site adresi)` gönder.

### 4.1 Hızlı hat (Worker, dakikada 1)

| Kaynak | Adres | Not |
|---|---|---|
| USGS | `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson` | GeoJSON. Beklenen alanlar: `id`, `properties.mag/place/time/updated/alert/tsunami/status`, `geometry.coordinates=[boylam,enlem,derinlikKm]`. Kamu malı. CORS açık (yedek yol için gerekli; yokla). |
| EMSC | `https://www.seismicportal.eu/fdsnws/event/1/query?format=json&minmag=4&limit=200&orderby=time&start=<son 24 saat ISO>` | OpenAPI: `…/fdsnws/event/1/openapi.json`. Lisans CC BY 4.0, atıf zorunlu. CORS'u yokla. WebSocket **kullanma**. |
| AFAD | Birincil: `GET https://deprem.afad.gov.tr/apiv2/event/filter?start=<YYYY-MM-DD HH:mm:ss>&end=<…>&minmag=3.5&orderby=timedesc` · Yedek: `POST https://deprem.afad.gov.tr/EventData/GetEventsByFilter` gövde `{"EventSearchFilterList":[{"FilterType":8,"Value":<başlangıç ISO>},{"FilterType":9,"Value":<bitiş ISO>}],"Skip":0,"Take":100,"SortDescriptor":{"field":"eventDate","dir":"desc"}}` | Birincil adres bu belge yazılırken canlı doğrulanmadı; yokla, çalışmazsa yedeği kullan. İkisi de çalışmazsa `enabled:false`. |
| Kandilli | `http://www.koeri.boun.edu.tr/scripts/lst0.asp` | HTML içinde `<pre>` bloğu, sabit genişlikli satırlar, kodlama `windows-1254`. Sütunlar: tarih, saat, enlem, boylam, derinlik, MD, ML, Mw, yer, çözüm niteliği. Büyüklük: Mw varsa Mw, yoksa ML, yoksa MD. Atıf zorunlu: "B.Ü. KRDAE Bölgesel Deprem-Tsunami İzleme ve Değerlendirme Merkezi". Ayrıştırma başarısızsa o turu atla. |
| Tsunami (NTWC) | `https://www.tsunami.gov/events/xml/PAAQAtom.xml` | Atom. Her 5 dakikada bir çek. |
| Tsunami (PTWC) | `https://www.tsunami.gov/events/xml/PHEBAtom.xml` | Atom. Her 5 dakikada bir çek. |

**Saat dilimi doğrulaması (zorunlu test):** AFAD ve Kandilli zamanlarının UTC mi yerel mi (UTC+3) olduğunu varsayma. Yoklama script'i aynı depremi EMSC ile eşleştirip farkı ölçsün (≈0 ise UTC, ≈3 saat ise yerel) ve sonucu adaptörde sabit olarak kullan; `DECISIONS.md`'ye yaz.

Tsunami Atom ayrıştırma: `entry` başına `title`, `updated`, `geo:lat`, `geo:long`, `summary`, CAP bağlantısı. Seviye, `summary`/`title` içindeki anahtar kelimeden çıkar: `Warning` → `warning`, `Advisory` → `advisory`, `Watch` → `watch`, `Information`/`Threat` yok → `info`. Yalnızca son 24 saatteki girdiler etkin sayılır. XML için kütüphane ekleme; dar kapsamlı regex/ayrıştırıcı yaz ve örnek dosyalarla test et.

### 4.2 Yavaş hat (GitHub Actions, 30 dakikada 1)

**GDELT 2.0 Events**
- Son dosya: `http://data.gdeltproject.org/gdeltv2/lastupdate.txt` (ilk satırdaki `.export.CSV.zip` adresi).
- Dosya adı deseni: `http://data.gdeltproject.org/gdeltv2/YYYYMMDDHHMMSS.export.CSV.zip`, 15 dakikalık adımlar (00, 15, 30, 45). Her çalıştırmada son 24 saatin 96 dosyasını indir (durumsuz); eksik dosyayı atla.
- Sekmeyle ayrılmış, başlıksız, 61 sütun. Kullanılacak 0-tabanlı indeksler: `0` GLOBALEVENTID, `1` SQLDATE, `26` EventCode, `27` EventBaseCode, `28` EventRootCode, `31` NumMentions, `32` NumSources, `33` NumArticles, `51` ActionGeo_Type, `52` ActionGeo_FullName, `53` ActionGeo_CountryCode, `56` ActionGeo_Lat, `57` ActionGeo_Long, `59` DATEADDED, `60` SOURCEURL. İndeksleri ilk dosyada doğrula (sütun 56/57 sayısal ve geçerli enlem/boylam olmalı, sütun 28 iki haneli kod olmalı); tutmazsa script hata ile çıksın.
- Zip açmak için `fflate`.

**IMF PortWatch**
- Boğaz listesi: `https://services9.arcgis.com/weJ1QsnbMYJlCHdG/arcgis/rest/services/PortWatch_chokepoints_database/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=json`
- Günlük geçişler: `https://services9.arcgis.com/weJ1QsnbMYJlCHdG/arcgis/rest/services/Daily_Chokepoints_Data/FeatureServer/0/query?where=portid%3D'<ID>'&outFields=*&orderByFields=date%20DESC&resultRecordCount=120&f=json`
- `portid` değerlerini **sabit yazma**. Boğaz listesinden ad eşleştirerek çöz (büyük/küçük harf duyarsız "içerir"): `hormuz`, `suez`, `mandeb`, `malacca`, `panama`, `bosporus`. Bulunamayan boğaz `available:false` olur. Çözülen kimlikleri ve koordinatları `public/data/static/chokepoints.json`'a yaz.
- Alan adlarını örnek yanıttan oku (beklenen: tarih alanı, toplam geçiş sayısı alanı). Servis çağrı başına 1000 kayıt döndürür.
- Veri birkaç gün gecikmelidir. Arayüzde her zaman "veri: <son tarih>" göster. Atıf: "Sources: UN Global Platform; IMF PortWatch (portwatch.imf.org)".

### 4.3 Statik veri (script ile bir kez üret, depoya işle)

| Dosya | Kaynak | Kural |
|---|---|---|
| `plants.json` | GeoNuclearData — `https://github.com/cristianst85/GeoNuclearData` (denormalize JSON; depo içindeki tam yolu script bulsun) | Lisans ODbL-1.0, atıf zorunlu. Durumu `Operational` veya `Under Construction` olan reaktörleri al, aynı santralin reaktörlerini tek sahaya indir (ad kökü + 5 km içinde), çıktı: `{id,name,country,lat,lon,status,reactors}`. Koordinatlar yaklaşıktır; arayüzde belirt. |
| `places.tr.json` | GeoNames — `https://download.geonames.org/export/dump/TR.zip` (CC BY 4.0) | `featureCode=ADM1` satırlarından 81 il: `{code:"TR-06", plate:6, name, lat, lon, coastal}`. Plaka kodu ad eşleştirmesiyle (01 Adana … 81 Düzce). 81 kayıt çıkmazsa script hata versin. |
| `world.json` | npm `world-atlas/countries-110m.json` | `topojson-client` ile GeoJSON'a çevir, yalnızca geometri + ad. |

`coastal: true` olan iller (tam liste): Artvin, Rize, Trabzon, Giresun, Ordu, Samsun, Sinop, Kastamonu, Bartın, Zonguldak, Düzce, Sakarya, Kocaeli, İstanbul, Kırklareli, Tekirdağ, Edirne, Çanakkale, Balıkesir, Bursa, Yalova, İzmir, Aydın, Muğla, Antalya, Mersin, Adana, Hatay.

---

## 5. ÇEKİRDEK MANTIK (`core/`)

### 5.1 Config (tek dosya, başka yerde sayı yok)

```ts
export const CONFIG = {
  quake: {
    globalMinMag: 5.0,          // haritada küresel alt sınır
    trMinMag: 4.0,              // TR kutusu içinde alt sınır
    trBox: { minLat: 34, maxLat: 43, minLon: 24, maxLon: 46 },
    keepDays: 7,
    merge: { maxDtSec: 60, maxDistKm: 150 },
    sourcePriorityTR: ['afad', 'kandilli', 'emsc', 'usgs'],
    sourcePriorityWorld: ['usgs', 'emsc', 'afad', 'kandilli'],
  },
  // [minMag, P0 km, P1 km, P2 km] — hiposantral mesafe; null = bu seviye yok
  severityTable: [
    [4.0, null, null, 30],
    [4.5, null, 15, 60],
    [5.0, null, 40, 120],
    [5.5, 15, 80, 200],
    [6.0, 40, 100, 300],
    [6.5, 80, 150, 500],
    [7.0, 150, 250, 800],
    [7.5, 250, 350, 1000],
  ],
  provinceExtentKm: 25,         // il merkezine mesafeden düşülür (alt sınır 0)
  // [minMag, santral bağlantı yarıçapı km] — episantr mesafesi
  plantLinkTable: [[5.0, 25], [5.5, 50], [6.0, 100], [6.5, 150], [7.0, 250], [7.5, 400]],
  chokepointQuake: { minMag: 6.5, radiusKm: 150 },
  conflict: {
    rootCodes: ['19', '20'], extraBaseCodes: ['183'],
    geoTypes: [3, 4],            // yalnızca şehir düzeyi konum
    cellDeg: 0.5, windowHours: 24,
    minEvents: 3, minDistinctDomains: 3,
    plantRadiusKm: 50, chokepointRadiusKm: 150,
    ttlHours: 48,
  },
  chokepoint: { recentDays: 7, baselineDays: 90, deviation: -0.25, severe: -0.5, staleDays: 10 },
  status: {
    quakeWindowHours: 24, pagerWindowHours: 72,
    elevatedMag: 6.5, criticalMag: 7.5, criticalMaxDepthKm: 70,
    chronicDays: 7,
  },
  tsunamiRuleTR: { minMag: 6.5, maxDepthKm: 70, coastRadiusKm: 100 },
  stale: { fastMinutes: 15, conflictHours: 3 },
  notify: {
    p0ConfirmSources: 2, p0SingleSourceWaitSec: 90,
    p1CooldownMin: 30, updateMagDelta: 0.3,
    globalChannel: { minMag: 7.0, maxDepthKm: 100 },
    pushBatch: 20, pushTtlSec: 3600,
  },
  poll: { clientSec: 60, heartbeatMin: 5 },
} as const;
```

### 5.2 Deprem normalizasyonu ve tekilleştirme
- Her adaptör `QuakeEvent {source, sourceId, timeMs(UTC), lat, lon, depthKm, mag, magType?, place, pagerAlert?, usgsTsunami?, updatedMs}` döndürür.
- Kabul: TR kutusu içindeyse `mag ≥ 4.0`, dışındaysa `mag ≥ 5.0`.
- İki kayıt aynı olaydır: `|Δt| ≤ 60 sn` **ve** episantr mesafesi `≤ 150 km`.
- Birleşik olay `MergedQuake {id, sources[], best, firstSeenMs, ...}`. `best` alanları öncelik sırasına göre (TR kutusunda TR sırası, dışında dünya sırası) ilk mevcut kaynaktan alınır. `id` = ilk görülen kaynağın `source:sourceId` değeri, sonradan değişmez.
- 7 günden eski olaylar atılır. Daha önce görülmüş bir olay hiçbir kaynakta 2 tur üst üste yoksa `retracted:true` olur (yalnızca son 6 saatteki olaylar için kontrol et).

### 5.3 İle göre önem derecesi (P0 / P1 / P2)
```
d    = max(0, haversine(il merkezi, episantr) − provinceExtentKm)
R    = sqrt(d² + depthKm²)
satır = severityTable içinde minMag ≤ mag olan en büyük satır
seviye = R ≤ P0 ise P0; R ≤ P1 ise P1; R ≤ P2 ise P2; değilse yok
```
Anlamları (arayüz metni): **P0** "Yıkıcı olabilir", **P1** "Güçlü hissedilmiş olabilir", **P2** "Hissedilmiş olabilir". Her yerde şu not gösterilir: "Kaba tahmindir; resmi şiddet haritası değildir."

### 5.4 Kaskat bağlantıları
Bağlantı `Link {id, fromKind:'quake'|'conflict', fromId, toKind:'plant'|'chokepoint', toId, distanceKm, rule, startedMs, chronic}`.

| Kural | Koşul |
|---|---|
| `quake→plant` | Episantr mesafesi ≤ `plantLinkTable`'da büyüklüğe karşılık gelen yarıçap. Olay son 24 saatte. |
| `quake→chokepoint` | `mag ≥ 6.5` ve mesafe ≤ 150 km. Son 24 saat. |
| `conflict→plant` | Küme merkezi santrale ≤ 50 km. |
| `conflict→chokepoint` | Küme merkezi boğaza ≤ 150 km. |

- Aynı `(fromKind, toId)` çifti 7 günden uzun süredir kesintisiz etkinse `chronic:true` olur. Kronik bağlantı haritada gösterilir ama durumu yükseltmez.
- Santral kartında her zaman şu cümle yer alır: "Bu bir hasar bildirimi değildir. Santraller güçlü sarsıntıda otomatik durur; bağlantı yalnızca yakınlığı gösterir."

### 5.5 Tsunami
- NTWC/PTWC `warning` → küresel CRITICAL; `advisory`/`watch` → küresel ELEVATED.
- **Türkiye kıyı kuralı (resmi uyarı değildir, kural tabanlıdır):** `mag ≥ 6.5`, `depth ≤ 70 km` ve episantr `coastal:true` bir il merkezine ≤ 100 km ise, o il için `tsunamiAdvice:true`. Bildirime ve karta Bölüm 10.3 metni eklenir. USGS `tsunami=1` bayrağı da aynı etkiyi doğurur.

### 5.6 Çatışma kümeleri (yavaş hat)
1. Satır kabulü: `EventRootCode ∈ {19, 20}` veya `EventBaseCode = 183`; `ActionGeo_Type ∈ {3, 4}`; enlem/boylam dolu; **ve aktör kuralı**: taraflardan birinin türü (`Actor1Type1..3Code`, `Actor2Type1..3Code`; sütun 12–14 ve 22–24) `COP` (polis) veya `CRM` (suç) ise satır atılır; aksi halde en az bir taraf `MIL`, `REB`, `SEP` veya `INS` türünde olmalı ya da iki tarafın ülke kodu (`Actor1CountryCode`, `Actor2CountryCode`; sütun 7 ve 17) dolu ve farklı olmalı. Amaç kentsel suç ve polis haberlerinin (ör. Philadelphia, Miami) çatışma sayılmasını önlemektir. Sütunlar ilk dosyada doğrulanır.
2. `GLOBALEVENTID`'ye göre tekilleştir.
3. 0,5° ızgara hücresine ata. Hücre başına: olay sayısı, `SOURCEURL` alan adlarının ayrık sayısı, ortalama konum, en sık `ActionGeo_FullName`, en yüksek `NumSources`'lu 3 kaynak adresi.
4. Küme kabulü: `olay ≥ 3` **ve** `ayrık alan adı ≥ 3`.
5. Çıktı `ConflictCluster {id:hücre, lat, lon, label, events, domains, lastSeenMs, sampleUrls[3]}`. Son görülmeden 48 saat sonra düşer.
6. Kanıt etiketi her zaman: **"B — medya bildirimi, doğrulanmamış. Konum şehir düzeyindedir."**

### 5.7 Boğaz akışı
`recent` = son 7 günün ortalama günlük geçişi; `baseline` = ondan önceki 90 günün ortalaması. `dev = recent/baseline − 1`. `dev ≤ −0.25` → `deviation`; `≤ −0.5` → `severe`. Son veri tarihi 10 günden eskiyse `stale`.

### 5.8 Durum
**KÜRESEL**
- `STALE`: hızlı hat kalp atışı 15 dakikadan eski. Diğer her şeyi ezer.
- `CRITICAL`: (son 24 sa) `mag ≥ 7.5` ve `depth ≤ 70` · PAGER `orange|red` (72 sa) · tsunami `warning` · kronik olmayan **deprem** `→plant` bağlantısı · boğaz `severe`.
- `ELEVATED`: (son 24 sa) `mag ≥ 6.5` · PAGER `yellow` · tsunami `advisory|watch` · kronik olmayan `→chokepoint` bağlantısı · kronik olmayan **çatışma** `→plant` bağlantısı · boğaz `deviation`.
- **Kanıt sınırı:** çatışma kaynaklı bağlantılar (`conflict→plant`, `conflict→chokepoint`) küresel durumu en fazla `ELEVATED` yapar; `CRITICAL` yalnızca deprem, tsunami, PAGER ve boğaz `severe` kaynaklarından gelir. Çatışma bağlantısı kartta ve haritada aynen görünür; yalnızca durum bandını yükseltmesi sınırlıdır (kanıt etiketi B: medya bildirimi).
- Aksi halde `NOMINAL`.

**BÖLGEN** (il seçiliyse): son 24 saatte o il için P0 veya `tsunamiAdvice` → `CRITICAL`; P1 → `ELEVATED`; aksi halde `NOMINAL`. İl seçili değilse gösterge "—" ve "İlini seç" bağlantısı.

Her durumun yanında tek satırlık **neden** gösterilir (ör. `M6.8 · Kamçatka · 3 sa önce`). Nedensiz durum gösterilmez.

---

## 6. WORKER (`daemon/`)

### 6.1 Zamanlama
`crons = ["* * * * *"]`. Her tur: USGS, EMSC, AFAD, Kandilli paralel çek (kaynak başına 8 sn zaman aşımı, `Promise.allSettled`); dakika 5'in katıysa tsunami beslemeleri de. Sonra: birleştir → bağlantıları hesapla → durumu hesapla → bildirim politikası → gerekiyorsa KV yaz.

### 6.2 KV (bağlama adı `VIGIL`) — ücretsiz plan bütçesi günde 1000 yazma
| Anahtar | İçerik | Yazma kuralı |
|---|---|---|
| `state` | Bölüm 6.4'teki tam JSON | Yalnızca içerik özeti (hash) değiştiyse. |
| `hb` | `{fastMs, sources:{usgs:{ok,ms},…}}` | 5 dakikada bir. |
| `slow` | Yavaş hat çıktısı | `/v1/ingest/slow` geldiğinde. |
| `sent:<eventId>:<region>:<tür>` | `1`, TTL 7 gün | Bildirim gönderilince. |
| `sub:<region>:<hash>` | Abonelik | Abone olunca. |
| `pushq:<eventId>:<region>` | Kuyruk imleci | Dağıtım sürerken. |

Bir turda en fazla 10 KV yazması yap; aşarsan kalanları sonraki tura bırak. `state` okuması istek başına tek `get` olmalı.

### 6.3 HTTP uçları
| Uç | Açıklama |
|---|---|
| `GET /v1/state` | `state` + `hb` + `slow` birleşik JSON. `Cache-Control: public, max-age=30`. |
| `GET /v1/vapid` | `{publicKey}` veya anahtar yoksa `404`. |
| `POST /v1/push/subscribe` | Gövde `{subscription:{endpoint,keys:{p256dh,auth}}, region:"TR-06"|"GLOBAL", lang:"tr"|"en"}`. |
| `POST /v1/push/unsubscribe` | Gövde `{endpoint}`. |
| `POST /v1/ingest/slow` | `Authorization: Bearer <INGEST_TOKEN>`; gövde ≤ 512 KB. |
| `GET /v1/health` | `{ok, fastAgeSec, sources}`. |

Güvenlik: CORS yalnızca `ALLOWED_ORIGINS` (virgülle ayrılmış env). Abonelik gövdesi ≤ 2 KB; `endpoint` `https:` olmalı ve ana makine şu soneklerden biriyle bitmeli: `fcm.googleapis.com`, `push.services.mozilla.com`, `push.apple.com`, `notify.windows.com` (aksi halde `400`). `region` geçerli il kodu veya `GLOBAL` olmalı. IP adresi veya başlık kaydetme, loglama.

### 6.4 `state` biçimi
```ts
type State = {
  v: 1; generatedMs: number; fastMs: number;
  sources: Record<'usgs'|'emsc'|'afad'|'kandilli'|'tsunami', { ok: boolean; ms: number }>;
  quakes: MergedQuake[];            // son 7 gün
  tsunami: TsunamiBulletin[];       // son 24 saat
  conflicts: ConflictCluster[]; conflictsMs: number | null;
  chokepoints: ChokepointFlow[];    // {id,name,lat,lon,recent,baseline,dev,level,dataThrough,available}
  links: Link[];
  global: { level: 'NOMINAL'|'ELEVATED'|'CRITICAL'|'STALE'; reason: string | null };
  provinceLevels: Record<string /*eventId*/, Record<string /*TR-xx*/, 'P0'|'P1'|'P2'>>; // yalnızca seviyesi olan iller
};
```
`BÖLGEN` durumu istemcide hesaplanır (il seçimi sunucuya gitmez).

### 6.5 Ortam değişkenleri
`ALLOWED_ORIGINS`, `SITE_URL`, `INGEST_TOKEN`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_TR`, `TELEGRAM_CHAT_GLOBAL`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`. Hepsi isteğe bağlıdır; eksik olan özelliği kapatır.

### 6.6 Bilinen sınırlar (README'ye yaz, çözmeye çalışma)
- Ücretsiz planda Worker günde 100.000 istek alır; aşıldığında istemci yedek yola düşer (Bölüm 8.5). Bu tasarım gereğidir.
- Ücretsiz planda Web Push dağıtımı tur başına 20 abonedir; büyük abone sayısında gecikir. Telegram bu sınırdan etkilenmez ve birincil kanaldır.

---

## 7. BİLDİRİMLER

### 7.1 Politika (`daemon/src/notify/policy.ts`, saf fonksiyon, testli)
| Tetik | Koşul | Hedef |
|---|---|---|
| İl P0 | Olay ≥ 2 kaynakta görüldü **veya** tek kaynakta ilk görülmeden 90 sn geçti ve hâlâ listede | O ilin push aboneleri + TR Telegram kanalı |
| İl P1 | Hemen. O il için son 30 dakikada P1 gönderilmediyse | O ilin push aboneleri + TR Telegram kanalı |
| İl P2 | Bildirim yok (yalnızca uygulama içi) | — |
| Küresel | `mag ≥ 7.0` ve `depth ≤ 100` · PAGER `orange|red` · tsunami `warning` | `GLOBAL` push aboneleri + küresel Telegram kanalı |
| Güncelleme | Büyüklük ≥ 0,3 değişti veya il seviyesi değişti | Aynı hedef, olay başına en fazla 1 kez, başlıkta `GÜNCELLEME` |
| İptal | `retracted:true` | Aynı hedef, 1 kez, başlıkta `İPTAL` |

TR Telegram kanalına olay başına **tek mesaj** gider; etkilenen iller mesajda listelenir (P0 illeri, sonra P1 illeri; 8'den fazlaysa "+N il").

### 7.2 Metin şablonları (TR; EN karşılıklarını aynı yapıda yaz)
```
M{mag} DEPREM — {il} merkezine {km} km
{HH:mm} · derinlik {d} km · kaynak: {AFAD|Kandilli|EMSC|USGS}
{P0: "İlinde yıkıcı olabilir." | P1: "İlinde güçlü hissedilmiş olabilir."}
{tsunamiAdvice ise: "Kıyıdaysan hemen yüksek bir yere çık."}
Ne yapmalı: {SITE_URL}/alert?e={id}
```
Telegram mesajının son satırı: `Bu bir erken uyarı değildir; sarsıntı sonrası bilgilendirmedir.`

### 7.3 Telegram
`POST https://api.telegram.org/bot<TOKEN>/sendMessage`, gövde `{chat_id, text, disable_web_page_preview:true}`. Düz metin (parse_mode yok). Hata olursa bir sonraki turda 1 kez yeniden dene.

### 7.4 Web Push
- Kütüphane: `@pushforge/builder` (Workers uyumlu, bağımlılıksız). Uyumsuz çıkarsa RFC 8291 (aes128gcm) + RFC 8292 (VAPID) WebCrypto ile `webpush.ts` içinde elle uygula.
- Yük: `{id, level, title, body, url}`; `TTL: 3600`; `Urgency: high`.
- Yanıt `404`/`410` ise aboneliği sil.
- Dağıtım tur başına 20 abone; kalanlar `pushq` imleciyle sonraki turlarda.

---

## 8. VIGILRADAR ARAYÜZÜ (`/`)

### 8.1 Yerleşim — yalnızca üç bölge
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ VIGILRADAR // LIVE     KÜRESEL: ELEVATED · M6.8 Kamçatka · 3 sa    [ Ankara ▾ ]│
│                        BÖLGEN:  NOMINAL                                 TR | EN │
├───────────────────────────────────────────────────────┬──────────────────────┤
│                                                       │ NE OLDU?             │
│                     HARİTA                            │ NEYİ ETKİLEYEBİLİR?  │
│   (ülke poligonları, olaylar, varlıklar, yaylar)      │ SANA ETKİSİ          │
│                                                       │ NE YAPMALISIN?       │
├───────────────────────────────────────────────────────┴──────────────────────┤
│ 6 boğaz izleniyor · sapma yok · veri: 12 Kas   |  kaynaklar · hakkında        │
└──────────────────────────────────────────────────────────────────────────────┘
```
- Masaüstü: kart sağda 380 px, olay seçilince açılır. Mobil (< 768 px): alttan çekmece.
- Olay seçili değilken kart kapalıdır; yalnızca alt satır görünür.
- Yüzen menü, sekme, sayaç, katman seçici **yok**.

### 8.2 Harita
- MapLibre, karo ve glif sunucusu olmadan. Stil: arka plan + `world.json` dolgu ve 1 px sınır çizgisi. **Sembol/metin katmanı kullanma** (glif gerektirir); etiketler yalnızca seçili/etkin öğeler için HTML işaretleyici olarak eklenir.
- Katmanlar (hepsi GeoJSON kaynak):
  1. **Deprem:** daire; yarıçap büyüklükle artar (M5 → 4 px, M8 → 22 px, üstel), opaklık derinlikle azalır (0 km → 0.9, 300 km+ → 0.35), yaşla solar (7 günde → 0.25). Son 24 saattekiler halka ile vurgulanır.
  2. **Çatışma kümesi:** içi boş kare, boyut olay sayısına göre 3 kademe.
  3. **Varlıklar:** santral = küçük elmas, boğaz = küçük çift çizgi simgesi (ikisi de `circle`/`line` katmanlarıyla çizilebilir, ikon dosyası gerekmez). Varsayılan soluk gri, opaklık 0.35. Etkin bağlantısı olan varlık renklenir ve yavaşça nabız atar; kronik bağlantıda nabız yok, kesikli çerçeve.
  4. **Kaskat yayları:** kaynaktan varlığa büyük daire yayı (64 nokta), 1 px, `line-dasharray [2,2]`.
- `prefers-reduced-motion` varsa animasyon yok.
- İl seçiliyse harita ilk açılışta Türkiye'ye, değilse dünyaya oturur.
- Öğeye tıklama/dokunma kartı açar; klavye ile erişim için kartın üstünde "son olaylar" listesi (en fazla 10 satır) bulunur.

### 8.3 Triage kartı
1. **Ne oldu?** Tür, büyüklük, yer, yerel saat + "x dk/sa önce", derinlik, kaynak(lar), kanıt etiketi. Deprem: `A — resmi sismoloji ağı` (+ "ön veri" notu). Çatışma: Bölüm 5.6 etiketi + 3 kaynak bağlantısı.
2. **Neyi etkileyebilir?** Bağlantı listesi: varlık adı, mesafe, kural metni (ör. "M7.1 için 250 km içinde"). Bağlantı yoksa: "Bağlı kritik varlık yok."
3. **Sana etkisi.** İl seçiliyse: il merkezine mesafe + P seviyesi metni. Seviye yoksa tam olarak: **"Sana doğrudan fiziksel etkisi yok."** Bağlı varlık bir boğazsa Bölüm 10.6'daki etki notu.
4. **Ne yapmalısın?** Bölüm 10.1 karar tablosuna göre kontrol listesi + frekans bloğu (Bölüm 10.5). P seviyesi yoksa ve bağlantı yoksa bu bölüm tek satırdır: "Yapman gereken bir şey yok."

Boğaza tıklanınca kart: 7 günlük ortalama, 90 günlük temel, sapma yüzdesi, veri tarihi, 30 günlük mini çizgi (SVG, kütüphanesiz), etki notu.

### 8.4 Bölge seçici
Açılır liste: `Küresel` + 81 il (yazarak süzme, Türkçe karaktere duyarsız). Seçim `localStorage['vigil.region']`'da durur. İlk ziyarette saat dilimi `Europe/Istanbul` ise seçicinin yanında küçük "İlini seç" ipucu çıkar; kapatılınca bir daha çıkmaz. Hiçbir ağ isteği yapılmaz.

### 8.5 Veri alma ve yedek yol
- `GET {WORKER_URL}/v1/state`, sekme görünürken 60 saniyede bir (`visibilitychange` ile duraklat).
- İstek başarısızsa veya `fastMs` 15 dakikadan eskiyse **yedek yol**: tarayıcıdan USGS ve EMSC'yi doğrudan çek, `core/` ile birleştir ve bağlantıları hesapla. Üst bantta `// LIVE` yerine `// YEDEK KAYNAK` yaz; çatışma ve boğaz bölümlerinde "veri yok" göster.
- İkisi de başarısızsa `// STALE` ve son başarılı verinin saati. Son başarılı `state` `localStorage`'da saklanır.
- `NEXT_PUBLIC_WORKER_URL` tanımlı değilse doğrudan yedek yol kullanılır (yerel geliştirme için).

### 8.6 Dil ve erişilebilirlik
- `core/content/tr.ts` ve `en.ts`; i18n kütüphanesi yok. Varsayılan: `navigator.language` `tr` ile başlıyorsa Türkçe. Seçim `localStorage`.
- Renk tek başına anlam taşımaz: her durumun metni vardır. Kontrast AA. Tüm etkileşimler klavyeyle yapılabilir.

### 8.7 Tasarım
Mevcut tasarım belirteçleri (ultra koyu, monospace, mat, 1 px düz kenarlık) varsa onları kullan. Yoksa: zemin `#0A0B0D`, panel `#101216`, kenarlık `#1F2329`, metin `#C9CED6`, soluk `#6B7280`, amber `#D98E2B`, kırmızı `#D6423A`, nominal `#7D8A80`. Yazı: sistem monospace yığını; uzak font yükleme. Gölge, gradyan, yuvarlak köşe (> 2 px) yok.

### 8.8 Diğer sayfalar
- `/library`: eski 23 senaryo, olduğu gibi (Faz 0). `/metrics`: eski 14 sayaç. Ana ekrandan yalnızca alt satırdaki bağlantılarla ulaşılır.
- `/about`: ne olduğu, ne olmadığı ("Resmi uyarı sistemi değildir"), kaynaklar ve atıflar (USGS, EMSC CC BY 4.0, AFAD, KRDAE, NOAA/NWS, GDELT, IMF PortWatch, GeoNuclearData ODbL, GeoNames CC BY 4.0, Natural Earth), gizlilik (Bölüm 11), kanıt etiketlerinin anlamı.

---

## 9. VIGILALERT ARAYÜZÜ (`/alert`)

PWA: `manifest.webmanifest` (`start_url: /alert`, `display: standalone`, koyu tema), elle yazılmış `public/sw.js` (Workbox yok).

### 9.1 Barış modu (varsayılan)
1. **Durum satırı:** `BÖLGEN: NOMINAL` + son 7 günde ilin için P2 ve üzeri olay listesi (yoksa "Son 7 günde ilinde hissedilir deprem yok").
2. **Bildirimler:** iki seçenek yan yana — "Telegram kanalına katıl" (bağlantı `NEXT_PUBLIC_TELEGRAM_TR_URL`, tanımsızsa gizle) ve "Bu cihazda bildirim aç" (Web Push; il seçilmemişse önce il seçtir). iOS'ta standalone değilse düğme yerine "Ana ekrana ekle" yönergesi (Paylaş → Ana Ekrana Ekle). Altında dürüst not: "Telefon sessizdeyse bildirim ses çıkarmaz. Bu bir erken uyarı değildir."
3. **72 saat çantası:** Bölüm 10.4 listesi, işaretlenebilir, `localStorage`. Üstte ilerleme sayacı (`7/18`).
4. **Yerel radyo frekansım:** kullanıcının elle yazdığı tek satır (`localStorage`), açıklama: "Şehrindeki TRT Radyo 1 veya TRT FM frekansını şimdiden öğren ve buraya yaz. Kriz ekranında görünecek."
5. **Doğru bilinen yanlışlar:** Bölüm 10.7.
6. **Tatbikat:** "Kriz ekranını dene" düğmesi; kriz modunu sabit örnek olayla ve her yerde `TATBİKAT` etiketiyle açar.
7. **Aile planı:** Bölüm 10.9'daki alanlar, doldurulabilir form. Yalnızca `localStorage['vigil.plan']`'da durur. Kriz modunda "Haberleşme" bloğunun altında buluşma noktaları ve irtibat kişisi gösterilir.
8. **Yazdır:** üç düğme — "Çanta listesini yazdır", "Aile planını yazdır" (doldurulmuş ya da boş form), "Cüzdan kartını yazdır" (Bölüm 10.10, 85×55 mm, kesim çizgili). Yalnızca tarayıcının yazdırma işlevi ve `@media print` CSS'i kullanılır; hiçbir veri dışarı gitmez. Üstte not: "Elektrik ve internet gidince kâğıt çalışmaya devam eder."

### 9.2 Kriz modu
Tetik: `?e=<id>` ile açılış (bildirime dokunma) · seçili il için son 60 dakikada P0/P1 olay · tatbikat.
- Tüm gezinme gizlenir. Zemin saf siyah `#000`, vurgu kırmızı, metin beyaz, büyük punto.
- Başlık: `M7.2 DEPREM — MERKEZİNE 45 KM` + saat + "x dk önce" + kaynak.
- **Şimdi ne yapmalı:** Bölüm 10.1'e göre liste (deprem yakın / tsunami).
- **Haberleşme:** Bölüm 10.5 bloğu + kullanıcının kaydettiği radyo frekansı.
- **Araçlar (büyük düğmeler):**
  - `EKRANI FENER YAP`: tam ekran beyaz `<div>` + Screen Wake Lock (destek yoksa sessizce atla). Dokununca kapanır. Kamera flaşı **kullanma** (izin gerektirir).
  - `ACİL DÜDÜK`: Web Audio, ~3200 Hz kare dalga, SOS deseni (3 kısa, 3 uzun, 3 kısa), döngüde; tekrar dokununca durur. Altında not: "Pil tüketir. Çantandaki gerçek düdük daha etkilidir."
  - `İYİYİM MESAJI HAZIRLA`: `sms:?body=` bağlantısı, metin: "İyiyim. [yer] bölgesindeyim. Hatlar yoğun, mesajla yazın." (destek varsa `navigator.share`).
- En altta: `Normal moda dön`.

### 9.3 Service worker
- Eski sitenin elle yazılmış service worker'ı ve "çevrimdışı kaydet" düğmesi (`public/sw.js`, `components/OfflineButton.tsx`) Edge'de sınanmıştı. Sıfırdan yazmak yerine bunlardan başla; eski sayfaların önbelleklerini bozma.
- Önbelleğe al: `/alert` kabuğu, statik veriler, içerik. Statikler cache-first; `/v1/state` network-first, başarısızsa son kopya.
- `push`: yükten bildirim göster (`tag = id`, P0'da `requireInteraction: true`). `notificationclick`: `url`'yi aç veya var olan pencereyi öne getir.
- Çevrimdışıyken `/alert` açılmalı; çanta, rehber, fener, düdük çalışmalı.

---

## 10. SABİT İÇERİK (kelimesi kelimesine kullan; EN çevirisini sadık yap, ekleme/çıkarma yapma)

### 10.1 Hangi liste ne zaman
| Durum | Liste |
|---|---|
| Deprem, ilin için P0 veya P1 | 10.2 |
| Deprem, ilin için P2 | 10.2-B |
| `tsunamiAdvice` veya resmi tsunami uyarısı + kullanıcı ili kıyıda | 10.3 (10.2'den önce) |
| Bağlı varlık santral ve il merkezi santrale ≤ 100 km | 10.2-C ek olarak |
| Çatışma olayı | Liste yok. Metin: "VigilRadar çatışma olayları için kişisel güvenlik talimatı vermez. Resmi kaynakları izle." |
| Hiçbiri | "Yapman gereken bir şey yok." |

### 10.2 Deprem sonrası — ilk 10 dakika
1. Kendini ve yanındakileri kontrol et. Ayakkabı giy; yerde cam olabilir.
2. Gaz, elektrik ve su vanalarını kapat. Kibrit, çakmak yakma.
3. Çantanı al, merdivenden in (asansör kullanma), açık bir toplanma alanına git. Artçılar olacaktır.

Ek satır: "Telefonla arama yapma; mesaj ve internet kullan. 112'yi yalnızca acil durumda ara."

**10.2-B (hissedilmiş olabilir):**
1. Evde gaz kokusu, yeni çatlak veya hasar var mı kontrol et.
2. Artçı olabilir; devrilebilecek eşyalardan uzak dur.
3. Resmi açıklamayı AFAD'dan izle. Hatları meşgul etme.

**10.2-C (yakında nükleer santral):**
1. Bu bağlantı hasar bildirimi değildir. Santraller güçlü sarsıntıda otomatik durur.
2. Resmi açıklamayı izle: AFAD, Nükleer Düzenleme Kurumu (NDK), IAEA.
3. Yalnızca resmi talimat gelirse: içeride kal, kapı ve pencereleri kapat, havalandırmayı kapat. İyot tabletini resmi talimat olmadan kullanma.

### 10.3 Tsunami (kıyıdaysan)
1. Hemen kıyıdan uzaklaş: en az 30 metre yükseğe ya da 3 kilometre içeriye git.
2. Resmi uyarıyı bekleme. Güçlü ve uzun süren sarsıntı ya da denizin aniden çekilmesi başlı başına uyarıdır.
3. İlk dalga en büyüğü olmayabilir. Resmi "güvenli" açıklaması gelmeden kıyıya dönme.

Not: "Bu öneri kural tabanlıdır; resmi tsunami uyarısı değildir."

### 10.4 72 saat çantası
**Temel:** içme suyu (kişi başı günde 3–4 litre, 3 günlük) · bozulmayan yiyecek · ilk yardım seti · düzenli kullandığın ilaçlar · el feneri ve yedek pil · pilli veya kurmalı radyo · düdük · powerbank ve kablo.
**Belgeler ve para:** kimlik, tapu, sigorta belgelerinin fotokopisi · bir miktar nakit · yakınlarının telefon numaraları kâğıda yazılı.
**Korunma:** battaniye veya uyku tulumu · yağmurluk · yedek çorap ve iç çamaşırı · toz maskesi · iş eldiveni.
**Hijyen ve araç:** ıslak mendil, sabun, tuvalet kâğıdı · çok amaçlı çakı · kibrit veya çakmak (su geçirmez kapta).
**Varsa:** yedek gözlük · bebek maması ve bezi · evcil hayvan maması.

### 10.5 Haberleşme bloğu
- **112** — acil çağrı.
- **Pilli radyo:** TRT Radyo 1 / TRT FM. Frekans şehre göre değişir; {kullanıcının kaydettiği frekans veya "frekansını Alert'e kaydet"}.
- **PMR446 Kanal 1 (446.00625 MHz):** lisanssız el telsizi. Resmi acil kanalı değildir; yakın çevreyle haberleşme içindir. Şehir içinde menzil birkaç yüz metre ile birkaç kilometre arasıdır.
- **145.500 MHz:** amatör telsiz VHF çağrı frekansı. Dinlemek serbesttir; yayın yapmak lisans gerektirir.

Bu bloğa başka frekans **ekleme**. İl bazlı frekans tablosu üretme.

### 10.6 Boğaz etki notları (kartta "Sana etkisi" altında, kanıt etiketiyle)
- **Hürmüz** — Deniz yoluyla taşınan petrolün ve LNG'nin büyük bir bölümü buradan geçer. Uzun süren bir aksama petrol ve doğal gaz fiyatını yükseltir; Türkiye'de etkisi haftalar içinde akaryakıt ve enerji maliyetinde görülür. `B — makul projeksiyon`
- **Süveyş** — Asya ile Avrupa arasındaki konteyner hattının ana geçidi. Kapanırsa gemiler Ümit Burnu'nu dolaşır; yolculuk yaklaşık 10–14 gün uzar, navlun ve teslim süreleri artar. Türkiye'nin Asya ithalatı doğrudan etkilenir. `B — makul projeksiyon`
- **Babülmendep** — Süveyş'in güney kapısı. Buradaki aksama Süveyş trafiğini de düşürür; etkisi Süveyş ile aynıdır. `B — makul projeksiyon`
- **Malakka** — Doğu Asya'nın enerji ve sanayi tedarik hattı. Türkiye'ye etkisi dolaylıdır: elektronik ve ara malı fiyatları ile teslim süreleri. `C — dolaylı etki`
- **Panama** — Asya ile ABD'nin doğu kıyısı arasındaki hat. Kuraklık dönemlerinde geçiş kısıtlanır. Türkiye'ye etkisi sınırlıdır. `C — dolaylı etki`
- **İstanbul Boğazı** — Karadeniz tahılı ve petrolünün çıkış kapısı. Aksama bölge ticaretini ve İstanbul'u doğrudan etkiler. `B — makul projeksiyon`

### 10.7 Doğru bilinen yanlışlar
- **"Hayat üçgeni en güvenli yerdir."** AFAD'ın önerdiği yöntem Çök-Kapan-Tutun'dur: çök, başını ve enseni koru, sağlam bir eşyaya tutun.
- **"Sarsıntı sırasında dışarı koşmalıyım."** Sarsıntı sürerken merdiven, asansör ve balkon en tehlikeli yerlerdir. Sarsıntı bitince çık.
- **"Kapı kasasının altı güvenlidir."** Günümüz binalarında kapı kasası diğer yerlerden daha sağlam değildir.
- **"Küçük depremler büyüğünü önler."** Küçük depremlerin büyük depremi engellediğine dair bir kanıt yoktur. Depremin zamanı önceden bilinemez.
- **"Depremden sonra yakınlarımı aramalıyım."** Hatlar kilitlenir ve acil çağrılar geçemez. Kısa mesaj ya da internet kullan.

### 10.8 Sabit uyarı metni (her sayfanın altında)
"Vigil resmi bir uyarı sistemi değildir ve erken uyarı vermez. Veriler resmi ağlardan dakikalar içinde aktarılır; gecikme ve hata olabilir. Acil durumda 112'yi ara, AFAD'ın açıklamalarını izle."

---

### 10.9 Aile planı (alanlar ve açıklamaları)
1. **Buluşma noktası 1 — mahalle:** Evinin yakınındaki açık alan. "Resmi toplanma alanını e-Devlet'teki AFAD toplanma alanı sorgulamasından öğren."
2. **Buluşma noktası 2 — mahalle dışı:** "Birinci noktaya ulaşılamazsa gidilecek ikinci yer."
3. **Şehir dışından irtibat kişisi (ad + telefon):** "Herkes kendi durumunu bu kişiye bildirir. Afetten sonra şehir içi hatlar kilitlenince başka şehirdeki birine ulaşmak çoğu zaman daha kolaydır."
4. **Kim kimi alacak:** "Okuldaki çocuklar, yaşlılar, bakım gerektiren biri, evcil hayvanlar."
5. **Evde nerede ne var:** "Gaz vanası, su vanası, elektrik sigortası, deprem çantası."

### 10.10 Cüzdan kartı (85×55 mm, iki yüz)
- **Ön yüz:** Ad soyad · il · buluşma noktası 1 ve 2 · şehir dışı irtibat kişisi ve telefonu · iki yakının telefonu.
- **Arka yüz:** `112 — acil çağrı` · radyo frekansın (Alert'e kaydettiğin) · `PMR446 Kanal 1` · isteğe bağlı: kan grubu, düzenli kullandığın ilaç, alerji · alt satır: "Hatlar yoğunsa arama yapma, mesaj at."
- Boş alanlar yazdırmada el ile doldurulacak çizgi olarak çıkar. Sağlık alanları yalnızca cihazda durur ve yalnızca kullanıcı doldurursa basılır.

## 11. GİZLİLİK

- Çerez, analitik, hata izleme servisi, üçüncü taraf script yok.
- Tarayıcının bağlandığı adresler: site (Cloudflare Pages), Worker; yalnızca yedek yolda USGS ve EMSC. `/about` sayfasında açıkça listele.
- `localStorage` anahtarları: `vigil.region`, `vigil.lang`, `vigil.bag`, `vigil.radio`, `vigil.lastState`, `vigil.hintDismissed`. Hiçbiri sunucuya gitmez.
- Sunucuda saklanan tek kişisel veri: Web Push abonelik adresi + seçilen il + dil. Abonelikten çıkınca silinir.
- `Content-Security-Policy` ekle (Pages `_headers`): `default-src 'self'`; `connect-src` yalnızca Worker adresi, `earthquake.usgs.gov`, `www.seismicportal.eu`; `worker-src 'self' blob:` (MapLibre için).

---

## 12. TESTLER VE KABUL KRİTERLERİ

`vitest`, `core/__tests__/`. Sabit örnekler `core/__fixtures__/` altında, yoklama script'lerinin kaydettiği gerçek yanıtlardan türetilir.

**Zorunlu senaryolar**
1. **Kahramanmaraş 2023-02-06** (M7.8, 37.23K 37.01D, derinlik 10 km): Kahramanmaraş, Gaziantep, Hatay ve Malatya → P0. Ankara → P2 (2023'te Ankara'da sarsıntı hafif hissedildi; P0/P1 çıkması tablonun hatalı olduğunu gösterir). Akkuyu sahasına (36.14K 33.54D) `quake→plant` bağlantısı oluşur. Küresel → CRITICAL.
2. **Tohoku 2011-03-11** (M9.1, 38.30K 142.37D, derinlik 29 km): Fukushima Daiichi'ye bağlantı oluşur. Küresel → CRITICAL.
3. **Santrale 90 km'de M5.0:** bağlantı oluşmaz, küresel NOMINAL.
4. **Fiji, M7.0, derinlik 550 km:** küresel ELEVATED (CRITICAL değil), hiçbir il için seviye yok, küresel kanal bildirimi **gitmez** (derinlik > 100).
5. **İstanbul'un 12 km altında M5.8:** İstanbul → P0.
6. **Aynı deprem dört kaynaktan** (±20 sn, ±40 km, büyüklükler 6.9/7.0/7.1/7.0): tek `MergedQuake`; TR kutusunda `best.source = afad`.
7. **Büyüklük 6.9 → 7.2 revizyonu:** bir `GÜNCELLEME` bildirimi, ikincisi gitmez.
8. **Geri çekilen olay:** bir `İPTAL` bildirimi.
9. **P0 tek kaynak:** 90 saniye dolmadan bildirim gitmez; ikinci kaynak gelince hemen gider.
10. **P1 bekleme süresi:** aynı ile 30 dakika içinde ikinci P1 gitmez, P0 gider.
11. **Kronik bağlantı:** 8 gün süren `conflict→plant` durumu yükseltmez.
12. **Çatışma kümesi:** 3 olay / 2 alan adı → küme değil; 3 olay / 3 alan adı → küme; `ActionGeo_Type=1` satırları yok sayılır.
13. **Boğaz sapması:** −%30 → `deviation`; −%55 → `severe`; son veri 11 gün önce → `stale`.
14. **STALE:** kalp atışı 16 dakika önce → küresel STALE, başka her şeyi ezer.
15. **Tsunami TR kuralı:** İzmir açığında M6.8, derinlik 15 km → İzmir için `tsunamiAdvice`; Konya için yok.
16. **Adaptörler:** her kaynak için gerçek örnek yanıt → beklenen `QuakeEvent[]`; bozuk yanıt → boş dizi, istisna yok.
17. **Abonelik doğrulama:** `http:` adres, bilinmeyen ana makine, geçersiz il kodu → `400`.

**Uçtan uca kabul**
- `next build` statik dışa aktarım üretir; `/`, `/alert`, `/library`, `/metrics`, `/about` açılır.
- Ağ sekmesinde üçüncü taraf istek yok (Worker ve yedek yoldaki iki kaynak dışında).
- Ağ kapalıyken `/alert` açılır; çanta, fener, düdük çalışır.
- `wrangler deploy --dry-run` başarılı.
- Ana ekranda tam olarak üç bölge var; eski sekme ve sayaçların hiçbiri ana ekranda render edilmiyor.

---

## 13. FAZLAR (sırayla; her biri tek commit)

**Faz 0 — Keşif ve canlandırma**
- **Depo hakkında bilinenler (2026-11-18):** Next.js 16.4.5 (App Router, statik export), React 19, Tailwind 4, MapLibre 6, `fflate` ve `wrangler` zaten kurulu. Next 16'da kırıcı değişiklikler var: kod yazmadan önce `AGENTS.md`'nin işaret ettiği `node_modules/next/dist/docs/` rehberini oku. Mevcut `worker/` klasörü eski Node veri hattıdır (`npm run data`); **silme, adını değiştirme**, eski `/library` ve `/metrics` sayfaları ona bağlı olabilir. Yeni Cloudflare Worker bu yüzden `daemon/` klasörüne yazılır. `.github/workflows/` altında `data.yml` ve `alerts.yml` var. Eski tasarım belgeleri `docs/archive/` içindedir; yalnızca geçmişi anlamak için bak, oradaki hiçbir karar geçerli değildir.
- Depoyu oku; `docs/CURRENT_STATE.md` yaz (çatı sürümü, router, paket yöneticisi, derleme adımları, mevcut tasarım belirteçleri, veri iş akışları).
- Derlemeyi yeşile çevir (`scripts/flatten-segments.mjs` dahil; gereksizse kaldır ve gerekçesini yaz).
- Mevcut ana ekran bileşenlerini silmeden taşı: senaryolar → `/library`, sayaçlar → `/metrics`. Ana sayfa geçici olarak boş bir kabuk olur.
- `.github/workflows/` altındaki veri iş akışını incele: site derlemesini tetikleyen zamanlanmış veri işlerini devre dışı bırak (Faz 5 yenisini getirir). Dağıtım iş akışı yalnızca `main`'e push'ta çalışsın; `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` yoksa dağıtım adımı hata vermeden atlanmalı.

**Faz 1 — `core/`**: config, tipler, geo, normalize, merge, severity, cascade, status, tsunami, conflict, chokepoints + Bölüm 12'nin 1–6 ve 11–15. testleri (7–10 bildirim testleri Faz 6'da, adaptör testleri Faz 3'te).

**Faz 2 — Statik veri**: `build-plants`, `build-places`, `build-world` script'leri; çıktılar `public/data/static/`'e işlenir. Doğrulamalar: 81 il, 28 kıyı ili, en az 150 santral sahası, Akkuyu listede.

**Faz 3 — Worker hızlı hat**: yoklama script'leri + örnekler, dört deprem adaptörü, tsunami, KV katmanı ve yazma bütçesi, `/v1/state`, `/v1/health`, cron. Test 16.

**Faz 4 — Radar arayüzü**: Bölüm 8'in tamamı, yedek yol dahil. `/about`.

**Faz 5 — Yavaş hat**: `scripts/data/slow.mjs` (GDELT + PortWatch), `/v1/ingest/slow`, `.github/workflows/slow-data.yml` (`*/30 * * * *`, sırlar: `WORKER_URL`, `INGEST_TOKEN`; sır yoksa adım atlanır). Radar'da çatışma katmanı ve boğaz kartı.

**Faz 6 — Bildirimler**: politika + testler 7–10 ve 17, Telegram, Web Push, abonelik uçları.

**Faz 7 — Alert PWA**: Bölüm 9'un tamamı (aile planı ve yazdırma dahil), manifest, service worker (eski koddan başlayarak), çevrimdışı test. Yazdırma çıktılarını mevcut `scripts/check-print.mjs` ile PDF'e dönüştürüp sayfa sayısını ve kartın 85×55 mm olduğunu doğrula.

**Faz 8 — Kapanış**:
- **Veri tazeliği tablosu** (`/about`): her kaynak için son başarılı çekim, en yeni olayın zamanı ve durum (`ok` / hata). Bekçinin `hb.sources` verisinden; yavaş hat için `slow` zaman damgaları.
- **"Daha fazla oku" köprüsü:** triage kartının en altında, ilgili bir `/library` sayfası varsa tek bağlantı. Eşleşme listesini mevcut `/library` sayfa kimliklerinden seç (ör. Hürmüz → çatışma/enerji senaryosu); uygun sayfa yoksa bağlantı gösterme. Listeyi `core/content/` içinde tut ve `DECISIONS.md`'ye yaz.
- **Tarayıcı kontrolleri:** mevcut `scripts/check-contrast.mjs`, `check-overflow.mjs`, `test-offline.mjs` ve `check-print.mjs`'i yeni `/`, `/alert` ve `/about` sayfalarını da kapsayacak şekilde güncelle ve çalıştır.
- EN çevirileri, erişilebilirlik geçişi, CSP başlıkları, `README.md`, `docs/SETUP.md` (Bölüm 14'ü adım adım, komutlarıyla yaz), `docs/DECISIONS.md` gözden geçirme.

---

## 14. İNSANIN YAPACAKLARI (Claude Code yapmaz; `docs/SETUP.md`'ye komutlarıyla yaz)

1. `wrangler login`; KV ad alanı oluştur (`wrangler kv namespace create VIGIL`) ve kimliğini `wrangler.toml`'a yaz.
2. Telegram: BotFather ile bot oluştur; iki genel kanal aç (Türkiye, Küresel); botu ikisine yönetici ekle; `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_TR`, `TELEGRAM_CHAT_GLOBAL` sırlarını gir.
3. VAPID anahtarı üret (`npx @pushforge/builder vapid`); `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (bir `mailto:` adresi) sırlarını gir.
4. Rastgele bir `INGEST_TOKEN` üret; hem Worker sırrına hem GitHub Actions sırrına yaz. `WORKER_URL`'yi GitHub sırrına ekle.
5. `ALLOWED_ORIGINS` ve `SITE_URL`'yi ayarla; `wrangler deploy`.
6. Cloudflare Pages ortam değişkenleri: `NEXT_PUBLIC_WORKER_URL`, `NEXT_PUBLIC_TELEGRAM_TR_URL`.
7. GitHub sırları: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` (site dağıtımı için).

Bu adımların hiçbiri yapılmamışken de site derlenmeli ve yedek yol üzerinden çalışmalıdır.

---

## 15. SONRAKİ SÜRÜM (v2) ADAYLARI — v1'de YAPILMAZ

- **Orman yangınları:** NASA FIRMS VIIRS (ücretsiz `FIRMS_MAP_KEY`). Eski kod: `worker/feeds/fires.ts`. Kural taslağı: seçili ilin merkezine yakın aktif yangın kümesi → Alert'te bilgilendirme ve yangın kontrol listesi. Kurallar ve metinler yazılmadan başlanmaz.
- **Yanardağ izleme listesi:** eski `/supervolcanoes` verisi. Türkiye'ye etkisi düşük; kaskat katmanına ancak açık bir kuralla girer.
