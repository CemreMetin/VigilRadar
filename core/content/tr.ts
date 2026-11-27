// Fixed card text. tr.ts and en.ts carry the same keys; the wording is global, with no country-specific emergency advice.
export interface Content {
  chokepointNotes: Record<"hormuz" | "suez" | "mandeb" | "malacca" | "panama" | "bosporus", { name: string; text: string; evidence: string }>;
  conflictNote: string;
  disclaimer: string;
}

export const TR: Content = {
  chokepointNotes: {
    hormuz: { name: "Hürmüz", text: "Deniz yoluyla taşınan petrolün ve LNG'nin büyük bir bölümü buradan geçer. Uzun süren bir aksama dünya genelinde petrol ve gaz fiyatını yükseltir; önce Asyalı ithalatçılar etkilenir, haftalar içinde yakıt, elektrik ve gübre maliyetine yansır.", evidence: "B — makul projeksiyon" },
    suez: { name: "Süveyş", text: "Asya ile Avrupa arasındaki konteyner hattının ana geçidi. Kapanırsa gemiler Ümit Burnu'nu dolaşır; yolculuk yaklaşık 10–14 gün uzar, dünya ticaretinde navlun ve teslim süreleri artar.", evidence: "B — makul projeksiyon" },
    mandeb: { name: "Babülmendep", text: "Süveyş'in güney kapısı. Buradaki aksama Süveyş trafiğini de düşürür; Asya–Avrupa taşımacılığı ve enerji akışı aynı biçimde etkilenir.", evidence: "B — makul projeksiyon" },
    malacca: { name: "Malakka", text: "Hint Okyanusu ile Doğu Asya arasındaki en kısa deniz yolu; bölgenin enerji ithalatının ve sanayi ihracatının büyük bölümünü taşır. Aksama enerji, elektronik ve ara malında dünya genelinde teslim süresini ve fiyatı artırır.", evidence: "B — makul projeksiyon" },
    panama: { name: "Panama", text: "Asya ile ABD'nin doğu kıyısı arasındaki hat. Kuraklık dönemlerinde geçiş kısıtlanır; kuyruk ve rota değişikliği en çok Amerika–Asya ticaretinde taşıma maliyetini artırır.", evidence: "B — makul projeksiyon" },
    bosporus: { name: "İstanbul Boğazı", text: "Karadeniz tahılı, yağlı tohumu ve ham petrolünün çıkış kapısı. Aksama dünya gıda arzını daraltır; maliyet en çok Orta Doğu ve Afrika'daki ithalata bağımlı ülkelerde artar.", evidence: "B — makul projeksiyon" },
  },
  conflictNote: "VigilRadar çatışma olayları için kişisel güvenlik talimatı vermez. Resmi kaynakları izle.",
  disclaimer: "VigilRadar resmi bir uyarı sistemi değildir ve erken uyarı vermez. Resmi deprem verisi sarsıntıdan dakikalar sonra gelir; her zaman yerel acil durum yetkililerine uy.",
};
