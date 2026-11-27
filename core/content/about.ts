// Text of /about (VIGIL_V2_SPEC.md 5.3). Turkish and English carry the same sections.
export interface About {
  title: string;
  is: { h: string; p: string };
  isNot: { h: string; items: string[] };
  evidence: { h: string; items: string[] };
  sources: { h: string; intro: string };
  privacy: { h: string; items: string[]; hosts: string; keys: string; olderKeys: string };
}

type L = { tr: string; en: string };
const PD: L = { tr: "Kamu malı", en: "Public domain" };
const CITED: L = { tr: "Atıf; veri sitede dağıtılmaz", en: "Cited; no data redistributed" };
const MODEL = (tr: string, en: string): L => ({ tr: `Simülasyon modeli: ${tr}`, en: `Simulation model: ${en}` });
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
  { name: "EIA", use: MODEL("petrol ve LNG geçişleri", "oil and LNG flows"), license: PD, url: "https://www.eia.gov/international/analysis/special-topics/World_Oil_Transit_Chokepoints" },
  { name: "IEA", use: MODEL("enerji arzı", "energy supply"), license: CITED, url: "https://www.iea.org/" },
  { name: "UNCTAD", use: MODEL("deniz taşımacılığı", "maritime transport"), license: CITED, url: "https://unctad.org/topic/transport-and-trade-logistics/review-of-maritime-transport" },
  { name: "UN Comtrade", use: MODEL("ticaret bağımlılığı", "trade dependency"), license: CITED, url: "https://comtradeplus.un.org/" },
  { name: "FAO", use: MODEL("gıda ve tahıl bağımlılığı", "food and grain dependency"), license: CITED, url: "https://www.fao.org/faostat/" },
  { name: "World Bank", use: MODEL("açlık ve su stresi göstergeleri", "hunger and water stress indicators"), license: { tr: "CC BY 4.0", en: "CC BY 4.0" }, url: "https://data.worldbank.org/" },
  { name: "TeleGeography", use: { tr: "Denizaltı kabloları (harita katmanı ve simülasyon modeli)", en: "Submarine cables (map layer and simulation model)" }, license: { tr: "CC BY-NC-SA 3.0, yalnızca ticari olmayan kullanım", en: "CC BY-NC-SA 3.0, non-commercial use only" }, url: "https://www.submarinecablemap.com/" },
  { name: "ICPC", use: MODEL("kablo onarımı", "cable repair"), license: CITED, url: "https://www.iscpc.org/" },
  { name: "SIA", use: MODEL("çip üretimi", "chip production"), license: CITED, url: "https://www.semiconductors.org/" },
  { name: "Panama Canal Authority", use: MODEL("kanal geçişleri", "canal transits"), license: CITED, url: "https://pancanal.com/en/" },
  { name: "Robock (2000); Raible et al. (2016)", use: MODEL("volkanik soğuma", "volcanic cooling"), license: CITED, url: "https://doi.org/10.1029/1998RG000054" },
  { name: "NOAA SWPC", use: MODEL("güneş fırtınası etkileri", "solar storm effects"), license: PD, url: "https://www.swpc.noaa.gov/noaa-scales-explanation" },
  { name: "USGS Geomagnetism; Lloyd's / AER", use: MODEL("şebeke riski", "power grid risk"), license: CITED, url: "https://www.usgs.gov/programs/geomagnetism" },
];

export const ABOUT = {
  tr: {
    title: "Hakkında",
    is: { h: "VigilRadar nedir?", p: "VigilRadar, dünyadaki büyük fiziksel olayları (deprem, kinetik çatışma) ve bunların kritik altyapıya (nükleer santral, deniz boğazı) olası etkisini gösteren sakin, statik bir analiz masasıdır. Üç soruya cevap verir: Ne oldu? Yakında hangi altyapı var? Küresel ölçekte ne anlama gelir? SİMÜLE modundaki Küresel Etki Simülatörü dördüncü bir soru sorar: büyük bir şok bir ülkeyi hangi kanallardan, hangi sırayla ve ne kadar sürede etkiler? Bu deterministik bir bağımlılık modelidir, yapay zekâ tahmini değildir: aynı girdiler her zaman aynı sonucu verir ve hesap tarayıcında yapılır." },
    isNot: { h: "Ne değildir?", items: [
      "Resmi uyarı sistemi değildir.",
      "Erken uyarı vermez. Resmi sismoloji ağlarının verisi sarsıntıdan dakikalar sonra gelir; Vigil bu veriyi hızlı doğrulama ve bağlam için sunar.",
      "Hasar bildirimi değildir. Bir santrale bağlantı yalnızca yakınlığı gösterir.",
      "Çatışma olayları için kişisel güvenlik talimatı vermez.",
    ] },
    evidence: { h: "Kanıt etiketleri", items: [
      "A — resmi ölçüm (sismoloji ağları; ön veri olabilir) veya simülatörde belgelenmiş bir yapısal olgu.",
      "B — makul projeksiyon veya medya bildirimi. Doğrulanmamıştır; çatışma konumları şehir düzeyindedir. Simülatörde: 49 ülkelik bağımlılık profili; katsayılar kamuya açık istatistiklere bakılarak elle ayarlanmıştır, ölçüm değildir.",
      "C — dolaylı etki. Etki zincirinin uzak bir halkası. Simülatörde: profili olmayan ülkeler için bölgesel / küresel yansıma modeli.",
    ] },
    sources: { h: "Kaynaklar ve atıflar", intro: "Her veri kaynağı, lisansı ve kullanıldığı yer aşağıda. Santral koordinatları yaklaşıktır." },
    privacy: { h: "Gizlilik", items: [
      "Çerez, analitik, hata izleme servisi ve üçüncü taraf script yoktur.",
      "Hesap yok, konum yok. Sunucuda hiçbir kişisel veri saklanmaz.",
      "Dil seçimin ve son gösterilen veri yalnızca tarayıcında durur; sunucuya gitmez.",
    ], hosts: "Tarayıcının bağlandığı adresler: bu site (Cloudflare Pages) ve Vigil Worker'ı. Worker'a ulaşılamazsa yedek yolda yalnızca earthquake.usgs.gov ve www.seismicportal.eu.", keys: "Tarayıcıda saklanan anahtarlar (hiçbiri sunucuya gitmez):", olderKeys: "Eski içerik sayfaları (örneğin Survive) işaretlediğin maddeleri ve seçimlerini de yalnızca bu tarayıcıda tutar." },
  },
  en: {
    title: "About",
    is: { h: "What is VigilRadar?", p: "VigilRadar is a calm, static analysis desk that shows large physical events (earthquakes, kinetic conflict) and their possible effect on critical infrastructure (nuclear plants, sea straits). It answers three questions: What happened? Which infrastructure is nearby? What does it mean globally? The Global Impact Simulator in SIMULATE mode asks a fourth: through which channels, in what order and how soon would a large shock reach a country? It is a deterministic dependency model, not an AI forecast: the same inputs always give the same result, and it is computed in your browser." },
    isNot: { h: "What it is not", items: [
      "It is not an official warning system.",
      "It gives no early warning. Data from the official seismology networks arrives minutes after the shaking; Vigil presents it for fast verification and context.",
      "It is not a damage report. A link to a plant only shows proximity.",
      "It gives no personal safety instructions for conflict events.",
    ] },
    evidence: { h: "Evidence labels", items: [
      "A — official measurement (seismology networks; may be preliminary), or in the simulator a documented structural fact.",
      "B — plausible projection or media report. Unverified; conflict locations are at city level. In the simulator: a dependency profile of 49 countries, its coefficients set by hand from public statistics, not measured.",
      "C — indirect effect. A distant link in the chain of effects. In the simulator: the regional / global spillover model for countries without a profile.",
    ] },
    sources: { h: "Sources and credits", intro: "Every data source, its licence and where it is used. Plant coordinates are approximate." },
    privacy: { h: "Privacy", items: [
      "No cookies, analytics, error-tracking service or third-party script.",
      "No account, no location. No personal data is stored on any server.",
      "Your language choice and the last data shown stay in your browser; they are not sent to a server.",
    ], hosts: "Addresses your browser connects to: this site (Cloudflare Pages) and the Vigil Worker. If the Worker cannot be reached, the backup path connects only to earthquake.usgs.gov and www.seismicportal.eu.", keys: "Keys kept in your browser (none of them is sent to a server):", olderKeys: "Older content pages (for example Survive) also keep your ticked items and choices in this browser only." },
  },
} satisfies Record<"tr" | "en", About>;

/** The localStorage keys the site really uses (VIGIL.md 11); the test in lib/radar keeps this list true. */
export const STORAGE_KEYS = ["vigil.lang", "vigil.lastState", "vigil.precached.v2"] as const;
