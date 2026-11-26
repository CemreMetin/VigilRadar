// Text of /about (VIGIL.md 8.8 and 11). Turkish and English carry the same sections.
export interface About {
  title: string;
  is: { h: string; p: string };
  isNot: { h: string; items: string[] };
  evidence: { h: string; items: string[] };
  sources: { h: string; intro: string };
  privacy: { h: string; items: string[]; hosts: string; keys: string };
  back: string;
}

type L = { tr: string; en: string };
const PD: L = { tr: "Kamu malı", en: "Public domain" };
export const SOURCES: { name: string; use: L; license: L; url: string; credit?: string }[] = [
  { name: "USGS", use: { tr: "Depremler", en: "Earthquakes" }, license: PD, url: "https://earthquake.usgs.gov/" },
  { name: "EMSC", use: { tr: "Depremler", en: "Earthquakes" }, license: { tr: "CC BY 4.0", en: "CC BY 4.0" }, url: "https://www.seismicportal.eu/" },
  { name: "AFAD", use: { tr: "Depremler, Türkiye", en: "Earthquakes, Türkiye" }, license: { tr: "AFAD açık veri", en: "AFAD open data" }, url: "https://deprem.afad.gov.tr/" },
  { name: "KRDAE", use: { tr: "Depremler, Türkiye", en: "Earthquakes, Türkiye" }, license: { tr: "Atıf zorunlu", en: "Attribution required" }, url: "http://www.koeri.boun.edu.tr/", credit: "B.Ü. KRDAE Bölgesel Deprem-Tsunami İzleme ve Değerlendirme Merkezi" },
  { name: "NOAA / NWS (NTWC, PTWC)", use: { tr: "Tsunami bültenleri", en: "Tsunami bulletins" }, license: PD, url: "https://www.tsunami.gov/" },
  { name: "GDELT", use: { tr: "Çatışma haberleri", en: "Conflict reports" }, license: { tr: "Açık", en: "Open" }, url: "https://www.gdeltproject.org/" },
  { name: "IMF PortWatch", use: { tr: "Boğaz geçişleri", en: "Chokepoint transits" }, license: { tr: "Sources: UN Global Platform; IMF PortWatch (portwatch.imf.org)", en: "Sources: UN Global Platform; IMF PortWatch (portwatch.imf.org)" }, url: "https://portwatch.imf.org/" },
  { name: "GeoNuclearData", use: { tr: "Nükleer santral sahaları (yaklaşık koordinat)", en: "Nuclear plant sites (approximate coordinates)" }, license: { tr: "ODbL-1.0", en: "ODbL-1.0" }, url: "https://github.com/cristianst85/GeoNuclearData" },
  { name: "GeoNames", use: { tr: "Türkiye illeri", en: "Turkish provinces" }, license: { tr: "CC BY 4.0", en: "CC BY 4.0" }, url: "https://www.geonames.org/" },
  { name: "Natural Earth", use: { tr: "Ülke sınırları", en: "Country outlines" }, license: PD, url: "https://www.naturalearthdata.com/" },
];

export const ABOUT = {
  tr: {
    title: "Hakkında",
    is: { h: "Vigil nedir?", p: "VigilRadar, dünyadaki büyük fiziksel olayları (deprem, kinetik çatışma) ve bunların kritik altyapıya (nükleer santral, deniz boğazı) olası etkisini gösteren sakin, statik bir analiz masasıdır. Üç soruya cevap verir: Ne oldu? Neyi etkileyebilir? Bana etkisi ne, ne yapmalıyım?" },
    isNot: { h: "Ne değildir?", items: [
      "Resmi uyarı sistemi değildir.",
      "Erken uyarı vermez. Resmi sismoloji ağlarının verisi sarsıntıdan dakikalar sonra gelir; Vigil bu veriyi hızlı doğrulama ve sonrası rehberi olarak sunar.",
      "Hasar bildirimi değildir. Bir santrale bağlantı yalnızca yakınlığı gösterir.",
      "Çatışma olayları için kişisel güvenlik talimatı vermez.",
    ] },
    evidence: { h: "Kanıt etiketleri", items: [
      "A — resmi ölçüm. Resmi sismoloji ağlarının verisi; ön veri olabilir, revize edilebilir.",
      "B — makul projeksiyon veya medya bildirimi. Doğrulanmamıştır; çatışma konumları şehir düzeyindedir.",
      "C — dolaylı etki. Etki zincirinin uzak bir halkası.",
    ] },
    sources: { h: "Kaynaklar ve atıflar", intro: "Her veri kaynağı, lisansı ve kullanıldığı yer aşağıda. Santral koordinatları yaklaşıktır." },
    privacy: { h: "Gizlilik", items: [
      "Çerez, analitik, hata izleme servisi ve üçüncü taraf script yoktur.",
      "Hesap yok, konum yok. Sunucuda hiçbir kişisel veri saklanmaz.",
      "Bölge seçimin yalnızca tarayıcında durur; sunucuya gitmez.",
    ], hosts: "Tarayıcının bağlandığı adresler: bu site (Cloudflare Pages) ve Vigil Worker'ı. Worker'a ulaşılamazsa yedek yolda yalnızca earthquake.usgs.gov ve www.seismicportal.eu.", keys: "Tarayıcıda saklanan anahtarlar (hiçbiri sunucuya gitmez):" },
    back: "← Radar",
  },
  en: {
    title: "About",
    is: { h: "What is Vigil?", p: "VigilRadar is a calm, static analysis desk that shows large physical events (earthquakes, kinetic conflict) and their possible effect on critical infrastructure (nuclear plants, sea straits). It answers three questions: What happened? What could it affect? What does it mean for me, and what should I do?" },
    isNot: { h: "What it is not", items: [
      "It is not an official warning system.",
      "It gives no early warning. Data from the official seismology networks arrives minutes after the shaking; Vigil presents it as fast verification and guidance for afterwards.",
      "It is not a damage report. A link to a plant only shows proximity.",
      "It gives no personal safety instructions for conflict events.",
    ] },
    evidence: { h: "Evidence labels", items: [
      "A — official measurement. Data from the official seismology networks; it may be preliminary and revised.",
      "B — plausible projection or media report. Unverified; conflict locations are at city level.",
      "C — indirect effect. A distant link in the chain of effects.",
    ] },
    sources: { h: "Sources and credits", intro: "Every data source, its licence and where it is used. Plant coordinates are approximate." },
    privacy: { h: "Privacy", items: [
      "No cookies, analytics, error-tracking service or third-party script.",
      "No account, no location. No personal data is stored on any server.",
      "Your region choice stays in your browser; it is not sent to a server.",
    ], hosts: "Addresses your browser connects to: this site (Cloudflare Pages) and the Vigil Worker. If the Worker cannot be reached, the backup path connects only to earthquake.usgs.gov and www.seismicportal.eu.", keys: "Keys kept in your browser (none of them is sent to a server):" },
    back: "← Radar",
  },
} satisfies Record<"tr" | "en", About>;

/** The localStorage keys the site really uses (VIGIL.md 11); the test in lib/radar keeps this list true. */
export const STORAGE_KEYS = ["vigil.region", "vigil.lang", "vigil.lastState", "vigil.hintDismissed", "vigil.precached.v2"] as const;
