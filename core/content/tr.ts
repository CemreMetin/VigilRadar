// VIGIL.md Bölüm 10, kelimesi kelimesine. Bu dosyadaki metinleri değiştirme, ekleme veya çıkarma yapma.
export interface Content {
  afterQuake: string[]; // 10.2
  afterQuakeNote: string;
  feltMaybe: string[]; // 10.2-B
  nearPlant: string[]; // 10.2-C
  tsunami: string[]; // 10.3
  tsunamiNote: string;
  comms: { call112: string; radio: string; radioFreq: string; pmr: string; amateur: string }; // 10.5
  chokepointNotes: Record<"hormuz" | "suez" | "mandeb" | "malacca" | "panama" | "bosporus", { name: string; text: string; evidence: string }>; // 10.6
  conflictNote: string; // 10.1
  nothingToDo: string; // 10.1
  disclaimer: string; // 10.8
}

export const TR: Content = {
  afterQuake: [
    "Kendini ve yanındakileri kontrol et. Ayakkabı giy; yerde cam olabilir.",
    "Gaz, elektrik ve su vanalarını kapat. Kibrit, çakmak yakma.",
    "Çantanı al, merdivenden in (asansör kullanma), açık bir toplanma alanına git. Artçılar olacaktır.",
  ],
  afterQuakeNote: "Telefonla arama yapma; mesaj ve internet kullan. 112'yi yalnızca acil durumda ara.",
  feltMaybe: [
    "Evde gaz kokusu, yeni çatlak veya hasar var mı kontrol et.",
    "Artçı olabilir; devrilebilecek eşyalardan uzak dur.",
    "Resmi açıklamayı AFAD'dan izle. Hatları meşgul etme.",
  ],
  nearPlant: [
    "Bu bağlantı hasar bildirimi değildir. Santraller güçlü sarsıntıda otomatik durur.",
    "Resmi açıklamayı izle: AFAD, Nükleer Düzenleme Kurumu (NDK), IAEA.",
    "Yalnızca resmi talimat gelirse: içeride kal, kapı ve pencereleri kapat, havalandırmayı kapat. İyot tabletini resmi talimat olmadan kullanma.",
  ],
  tsunami: [
    "Hemen kıyıdan uzaklaş: en az 30 metre yükseğe ya da 3 kilometre içeriye git.",
    "Resmi uyarıyı bekleme. Güçlü ve uzun süren sarsıntı ya da denizin aniden çekilmesi başlı başına uyarıdır.",
    "İlk dalga en büyüğü olmayabilir. Resmi \"güvenli\" açıklaması gelmeden kıyıya dönme.",
  ],
  tsunamiNote: "Bu öneri kural tabanlıdır; resmi tsunami uyarısı değildir.",
  comms: {
    call112: "112 — acil çağrı.",
    radio: "Pilli radyo: TRT Radyo 1 / TRT FM. Frekans şehre göre değişir;",
    radioFreq: "frekansını Alert'e kaydet",
    pmr: "PMR446 Kanal 1 (446.00625 MHz): lisanssız el telsizi. Resmi acil kanalı değildir; yakın çevreyle haberleşme içindir. Şehir içinde menzil birkaç yüz metre ile birkaç kilometre arasıdır.",
    amateur: "145.500 MHz: amatör telsiz VHF çağrı frekansı. Dinlemek serbesttir; yayın yapmak lisans gerektirir.",
  },
  chokepointNotes: {
    hormuz: { name: "Hürmüz", text: "Deniz yoluyla taşınan petrolün ve LNG'nin büyük bir bölümü buradan geçer. Uzun süren bir aksama petrol ve doğal gaz fiyatını yükseltir; Türkiye'de etkisi haftalar içinde akaryakıt ve enerji maliyetinde görülür.", evidence: "B — makul projeksiyon" },
    suez: { name: "Süveyş", text: "Asya ile Avrupa arasındaki konteyner hattının ana geçidi. Kapanırsa gemiler Ümit Burnu'nu dolaşır; yolculuk yaklaşık 10–14 gün uzar, navlun ve teslim süreleri artar. Türkiye'nin Asya ithalatı doğrudan etkilenir.", evidence: "B — makul projeksiyon" },
    mandeb: { name: "Babülmendep", text: "Süveyş'in güney kapısı. Buradaki aksama Süveyş trafiğini de düşürür; etkisi Süveyş ile aynıdır.", evidence: "B — makul projeksiyon" },
    malacca: { name: "Malakka", text: "Doğu Asya'nın enerji ve sanayi tedarik hattı. Türkiye'ye etkisi dolaylıdır: elektronik ve ara malı fiyatları ile teslim süreleri.", evidence: "C — dolaylı etki" },
    panama: { name: "Panama", text: "Asya ile ABD'nin doğu kıyısı arasındaki hat. Kuraklık dönemlerinde geçiş kısıtlanır. Türkiye'ye etkisi sınırlıdır.", evidence: "C — dolaylı etki" },
    bosporus: { name: "İstanbul Boğazı", text: "Karadeniz tahılı ve petrolünün çıkış kapısı. Aksama bölge ticaretini ve İstanbul'u doğrudan etkiler.", evidence: "B — makul projeksiyon" },
  },
  conflictNote: "VigilRadar çatışma olayları için kişisel güvenlik talimatı vermez. Resmi kaynakları izle.",
  nothingToDo: "Yapman gereken bir şey yok.",
  disclaimer: "Vigil resmi bir uyarı sistemi değildir ve erken uyarı vermez. Veriler resmi ağlardan dakikalar içinde aktarılır; gecikme ve hata olabilir. Acil durumda 112'yi ara, AFAD'ın açıklamalarını izle.",
};
