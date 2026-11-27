// Fixed card text. tr.ts and en.ts carry the same keys; the wording is global, with no country-specific emergency advice.
export interface ChokepointNote {
  name: string;
  share: string;
  cargo: string;
  width: string;
  detour: string;
  text: string;
  evidence: string;
  source: string;
}
export interface Content {
  chokepointNotes: Record<"hormuz" | "suez" | "mandeb" | "malacca" | "panama" | "bosporus", ChokepointNote>;
  conflictNote: string;
  disclaimer: string;
}

export const TR: Content = {
  chokepointNotes: {
    hormuz: {
      name: "Hürmüz Boğazı",
      share: "Deniz yolu petrol ve LNG'nin ~%20'si",
      cargo: "Ham petrol, LNG, petrol ürünleri",
      width: "En dar 33 km (2 millik iki şerit)",
      detour: "Kısıtlı boru hatları (Doğu-Batı, Habşan–Füceyre)",
      text: "Deniz yoluyla taşınan petrolün ve LNG'nin yaklaşık beşte biri buradan geçer. Uzun süren bir aksama küresel enerji fiyatlarını hızla yükseltir; önce Asyalı ithalatçılar etkilenir, haftalar içinde yakıt, elektrik ve gübre maliyetine yansır.",
      evidence: "B — makul projeksiyon",
      source: "EIA · IMF PortWatch",
    },
    suez: {
      name: "Süveyş Kanalı",
      share: "Küresel deniz ticaretinin ~%12'si (~%30 konteyner)",
      cargo: "Konteyner yükü, ham petrol, LNG, tahıl",
      width: "193 km uzunluk · tek/çift şeritli yapay kanal",
      detour: "Ümit Burnu (+10–14 gün sefer süresi)",
      text: "Asya ile Avrupa arasındaki konteyner hattının ana geçidi. Kapanırsa gemiler Afrika'yı dolaşır; seferler 10–14 gün uzar, dünya ticaretinde navlun ve teslim süreleri artar.",
      evidence: "B — makul projeksiyon",
      source: "UNCTAD · IMF PortWatch",
    },
    mandeb: {
      name: "Babülmendep Boğazı",
      share: "Süveyş'in güney kapısı (~%12 küresel deniz ticareti)",
      cargo: "Konteyner, ham petrol, rafine yakıt, LNG",
      width: "En dar ~29 km (Perim Adası iki kanala böler)",
      detour: "Ümit Burnu (+10–14 gün)",
      text: "Kızıldeniz'in güney girişi ve Süveyş'in kilidi. Buradaki güvenlik riski doğrudan Süveyş trafiğini düşürür; Asya–Avrupa taşımacılığı ve enerji akışı aynı biçimde etkilenir.",
      evidence: "B — makul projeksiyon",
      source: "EIA · IMF PortWatch",
    },
    malacca: {
      name: "Malakka Boğazı",
      share: "Küresel deniz ticaretinin ~%25–30'u",
      cargo: "Ham petrol, LNG, elektronik, sanayi malları",
      width: "En dar ~2,7 km (Phillip Kanalı)",
      detour: "Lombok veya Sunda Boğazı (+2–3 gün)",
      text: "Hint Okyanusu ile Doğu Asya arasındaki en kısa deniz yolu; Çin, Japonya ve Güney Kore'nin enerji ithalatı ile sanayi ihracatının ana damarı. Aksama enerji ve ara malı fiyatlarını küresel ölçekte yükseltir.",
      evidence: "B — makul projeksiyon",
      source: "EIA · UNCTAD",
    },
    panama: {
      name: "Panama Kanalı",
      share: "Küresel deniz ticaretinin ~%5'i",
      cargo: "Konteyner, ABD LNG'si, tahıl, soya",
      width: "82 km uzunluk · Gatún Gölü tatlı su kilitleri",
      detour: "Macellan Boğazı / Horn Burnu veya ABD demiryolu",
      text: "Asya ile ABD'nin doğu kıyısı arasındaki ana geçit. Kuraklık dönemlerinde Gatún Gölü seviyesi düşünce geçiş kısıtlanır; kuyruk ve sapmalar Amerika–Asya ticaretinde maliyeti artırır.",
      evidence: "B — makul projeksiyon",
      source: "Panama Canal Authority · UNCTAD",
    },
    bosporus: {
      name: "İstanbul Boğazı",
      share: "Karadeniz tahıl ve petrol ihracat kapısı",
      cargo: "Buğday, mısır, ayçiçek yağı, ham petrol, gübre",
      width: "30 km uzunluk · en dar ~700 m",
      detour: "Tuna nehri, demiryolu ve karayolu (düşük kapasite)",
      text: "Karadeniz tahılı, yağlı tohumu ve ham petrolünün açık denize tek çıkışı. Aksama dünya gıda arzını daraltır; maliyet en çok Orta Doğu ve Afrika'daki ithalata bağımlı ülkelerde artar.",
      evidence: "B — makul projeksiyon",
      source: "FAO · IMF PortWatch",
    },
  },
  conflictNote: "VigilRadar çatışma olayları için kişisel güvenlik talimatı vermez. Resmi kaynakları izle.",
  disclaimer: "VigilRadar resmi bir uyarı sistemi değildir ve erken uyarı vermez. Resmi deprem verisi sarsıntıdan dakikalar sonra gelir; her zaman yerel acil durum yetkililerine uy.",
};
