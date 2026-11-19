// Text of /alert (VIGIL.md 9 and 10.4, 10.7, 10.9, 10.10). Turkish is the source; English follows the same structure.
type L = { tr: string; en: string };

export const BAG: { id: string; title: L; items: { id: string; text: L }[] }[] = [
  { id: "core", title: { tr: "Temel", en: "Essentials" }, items: [
    { id: "water", text: { tr: "içme suyu (kişi başı günde 3–4 litre, 3 günlük)", en: "drinking water (3–4 litres per person per day, for 3 days)" } },
    { id: "food", text: { tr: "bozulmayan yiyecek", en: "non-perishable food" } },
    { id: "firstaid", text: { tr: "ilk yardım seti", en: "first-aid kit" } },
    { id: "meds", text: { tr: "düzenli kullandığın ilaçlar", en: "the medicines you take regularly" } },
    { id: "flashlight", text: { tr: "el feneri ve yedek pil", en: "flashlight and spare batteries" } },
    { id: "radio", text: { tr: "pilli veya kurmalı radyo", en: "battery or hand-crank radio" } },
    { id: "whistle", text: { tr: "düdük", en: "whistle" } },
    { id: "power", text: { tr: "powerbank ve kablo", en: "power bank and cable" } },
  ] },
  { id: "docs", title: { tr: "Belgeler ve para", en: "Documents and money" }, items: [
    { id: "papers", text: { tr: "kimlik, tapu, sigorta belgelerinin fotokopisi", en: "photocopies of ID, title deed and insurance documents" } },
    { id: "cash", text: { tr: "bir miktar nakit", en: "some cash" } },
    { id: "numbers", text: { tr: "yakınlarının telefon numaraları kâğıda yazılı", en: "your relatives' phone numbers written on paper" } },
  ] },
  { id: "shelter", title: { tr: "Korunma", en: "Protection" }, items: [
    { id: "blanket", text: { tr: "battaniye veya uyku tulumu", en: "blanket or sleeping bag" } },
    { id: "rain", text: { tr: "yağmurluk", en: "raincoat" } },
    { id: "socks", text: { tr: "yedek çorap ve iç çamaşırı", en: "spare socks and underwear" } },
    { id: "mask", text: { tr: "toz maskesi", en: "dust mask" } },
    { id: "gloves", text: { tr: "iş eldiveni", en: "work gloves" } },
  ] },
  { id: "hygiene", title: { tr: "Hijyen ve araç", en: "Hygiene and tools" }, items: [
    { id: "wipes", text: { tr: "ıslak mendil, sabun, tuvalet kâğıdı", en: "wet wipes, soap, toilet paper" } },
    { id: "knife", text: { tr: "çok amaçlı çakı", en: "multi-tool knife" } },
    { id: "matches", text: { tr: "kibrit veya çakmak (su geçirmez kapta)", en: "matches or a lighter (in a waterproof container)" } },
  ] },
  { id: "if", title: { tr: "Varsa", en: "If applicable" }, items: [
    { id: "glasses", text: { tr: "yedek gözlük", en: "spare glasses" } },
    { id: "baby", text: { tr: "bebek maması ve bezi", en: "baby food and diapers" } },
    { id: "pet", text: { tr: "evcil hayvan maması", en: "pet food" } },
  ] },
];
export const BAG_TOTAL = BAG.reduce((n, c) => n + c.items.length, 0);
export const BAG_IDS = new Set(BAG.flatMap((c) => c.items.map((i) => i.id)));

export const MYTHS: { q: L; a: L }[] = [
  { q: { tr: "\"Hayat üçgeni en güvenli yerdir.\"", en: "\"The triangle of life is the safest place.\"" }, a: { tr: "AFAD'ın önerdiği yöntem Çök-Kapan-Tutun'dur: çök, başını ve enseni koru, sağlam bir eşyaya tutun.", en: "The method AFAD recommends is Drop-Cover-Hold On: drop down, protect your head and neck, hold on to something sturdy." } },
  { q: { tr: "\"Sarsıntı sırasında dışarı koşmalıyım.\"", en: "\"I should run outside during the shaking.\"" }, a: { tr: "Sarsıntı sürerken merdiven, asansör ve balkon en tehlikeli yerlerdir. Sarsıntı bitince çık.", en: "While the shaking lasts, stairs, elevators and balconies are the most dangerous places. Go out when it stops." } },
  { q: { tr: "\"Kapı kasasının altı güvenlidir.\"", en: "\"A doorway is a safe place.\"" }, a: { tr: "Günümüz binalarında kapı kasası diğer yerlerden daha sağlam değildir.", en: "In today's buildings a doorframe is no stronger than anywhere else." } },
  { q: { tr: "\"Küçük depremler büyüğünü önler.\"", en: "\"Small earthquakes prevent a big one.\"" }, a: { tr: "Küçük depremlerin büyük depremi engellediğine dair bir kanıt yoktur. Depremin zamanı önceden bilinemez.", en: "There is no evidence that small earthquakes prevent a large one. The time of an earthquake cannot be known in advance." } },
  { q: { tr: "\"Depremden sonra yakınlarımı aramalıyım.\"", en: "\"After an earthquake I should call my relatives.\"" }, a: { tr: "Hatlar kilitlenir ve acil çağrılar geçemez. Kısa mesaj ya da internet kullan.", en: "Lines jam and emergency calls cannot get through. Use text messages or the internet." } },
];

export interface PlanField { id: "meet1" | "meet2" | "contact" | "who" | "where"; label: L; hint: L; lines: number }
export const PLAN: PlanField[] = [
  { id: "meet1", label: { tr: "Buluşma noktası 1 — mahalle", en: "Meeting point 1 — neighbourhood" }, hint: { tr: "Evinin yakınındaki açık alan. Resmi toplanma alanını e-Devlet'teki AFAD toplanma alanı sorgulamasından öğren.", en: "An open area near your home. Find the official assembly area through the AFAD assembly area query on e-Devlet." }, lines: 1 },
  { id: "meet2", label: { tr: "Buluşma noktası 2 — mahalle dışı", en: "Meeting point 2 — outside the neighbourhood" }, hint: { tr: "Birinci noktaya ulaşılamazsa gidilecek ikinci yer.", en: "The second place to go if the first cannot be reached." }, lines: 1 },
  { id: "contact", label: { tr: "Şehir dışından irtibat kişisi (ad + telefon)", en: "Out-of-town contact (name + phone)" }, hint: { tr: "Herkes kendi durumunu bu kişiye bildirir. Afetten sonra şehir içi hatlar kilitlenince başka şehirdeki birine ulaşmak çoğu zaman daha kolaydır.", en: "Everyone reports their own status to this person. After a disaster, when local lines jam, reaching someone in another city is often easier." }, lines: 1 },
  { id: "who", label: { tr: "Kim kimi alacak", en: "Who picks up whom" }, hint: { tr: "Okuldaki çocuklar, yaşlılar, bakım gerektiren biri, evcil hayvanlar.", en: "Children at school, elderly people, anyone who needs care, pets." }, lines: 3 },
  { id: "where", label: { tr: "Evde nerede ne var", en: "What is where at home" }, hint: { tr: "Gaz vanası, su vanası, elektrik sigortası, deprem çantası.", en: "Gas valve, water valve, electrical fuse box, earthquake kit." }, lines: 3 },
];

/** Interface strings of the Alert page. */
const tr = {
  title: "VigilAlert", back: "Radar'a dön",
  region: "BÖLGEN", nominal: "NOMINAL", pick: "İlini seç", pickFirst: "Önce il seç", noFelt: "Son 7 günde ilinde hissedilir deprem yok",
  felt: "Son 7 günde ilin için olaylar",
  notify: "Bildirimler", telegram: "Telegram kanalına katıl", pushOn: "Bu cihazda bildirim aç", pushOff: "Bildirimi kapat", pushDone: "Bu cihazda bildirim açık.",
  pushUnsupported: "Bu tarayıcı Web Push desteklemiyor.", pushDenied: "Bildirim izni verilmedi.", pushOffline: "Bildirim sunucusuna ulaşılamadı.", pushNoServer: "Bildirim sunucusu henüz açık değil.",
  iosHint: "iOS'ta bildirim için önce Ana Ekrana ekle: Paylaş → Ana Ekrana Ekle.",
  silentNote: "Telefon sessizdeyse bildirim ses çıkarmaz. Bu bir erken uyarı değildir.",
  bag: "72 saat çantası", bagReset: "Hepsini temizle", radio: "Yerel radyo frekansım", radioHint: "Şehrindeki TRT Radyo 1 veya TRT FM frekansını şimdiden öğren ve buraya yaz. Kriz ekranında görünecek.", radioPlaceholder: "örn. TRT FM 99,5",
  myths: "Doğru bilinen yanlışlar", drill: "Kriz ekranını dene", drillLabel: "TATBİKAT",
  plan: "Aile planı", planNote: "Yalnızca bu cihazda durur.", planName: "Ad soyad", planRel1: "Yakın 1 telefon", planRel2: "Yakın 2 telefon", planBlood: "Kan grubu", planMeds: "Düzenli ilaç", planAllergy: "Alerji", planHealth: "Sağlık (isteğe bağlı; yalnızca cihazda durur ve yalnızca doldurursan basılır)",
  print: "Yazdır", printNote: "Elektrik ve internet gidince kâğıt çalışmaya devam eder.", printBag: "Çanta listesini yazdır", printPlan: "Aile planını yazdır", printCard: "Cüzdan kartını yazdır",
  sheetBag: "72 saat çantası", sheetPlan: "Aile planı", sheetCard: "Cüzdan kartı", cut: "Kesik çizgiden kes, cüzdanında taşı.", front: "ÖN YÜZ", backSide: "ARKA YÜZ", household: "Hane", date: "Tarih",
  card112: "112 — acil çağrı", cardRadio: "Radyo", cardPmr: "PMR446 Kanal 1", cardTail: "Hatlar yoğunsa arama yapma, mesaj at.", cardLoc: "İl", cardMeet1: "Buluşma 1", cardMeet2: "Buluşma 2", cardContact: "Şehir dışı irtibat", cardRel: "Yakın",
  crisis: "DEPREM", kmFrom: "merkezine {km} km", agoMin: "{n} dk önce", srcLabel: "kaynak", doNow: "ŞİMDİ NE YAPMALI", comms: "HABERLEŞME", radioSaved: "Kayıtlı radyo frekansın", radioMissing: "frekansını Alert'e kaydet",
  tools: "ARAÇLAR", torch: "EKRANI FENER YAP", whistle: "ACİL DÜDÜK", whistleStop: "DÜDÜĞÜ DURDUR", whistleNote: "Pil tüketir. Çantandaki gerçek düdük daha etkilidir.", okMsg: "İYİYİM MESAJI HAZIRLA", okText: "İyiyim. {yer} bölgesindeyim. Hatlar yoğun, mesajla yazın.",
  normal: "Normal moda dön", torchClose: "Kapatmak için dokun", meet: "Buluşma noktaları", contact: "İrtibat kişisi", unknownEvent: "Bildirimdeki olay şu an verilerde yok; genel talimat gösteriliyor.", planShown: "AİLE PLANI",
  offlineNote: "Çevrimdışı çalışır: çanta, rehber, fener ve düdük internet olmadan da açılır.", offlineSave: "Çevrimdışı için kaydet", offlineSaved: "Çevrimdışı kaydedildi.",
  noList: "Bu olay için bir liste yok.", sevNow: "Şu an sana göre",
} as const;
const en: Record<keyof typeof tr, string> = {
  title: "VigilAlert", back: "Back to Radar",
  region: "YOUR REGION", nominal: "NOMINAL", pick: "Pick your province", pickFirst: "Pick a province first", noFelt: "No earthquake felt in your province in the last 7 days",
  felt: "Events for your province in the last 7 days",
  notify: "Notifications", telegram: "Join the Telegram channel", pushOn: "Turn on notifications on this device", pushOff: "Turn notifications off", pushDone: "Notifications are on for this device.",
  pushUnsupported: "This browser does not support Web Push.", pushDenied: "Notification permission was not granted.", pushOffline: "Could not reach the notification server.", pushNoServer: "The notification server is not switched on yet.",
  iosHint: "On iOS, add to the Home Screen first: Share → Add to Home Screen.",
  silentNote: "If the phone is on silent, the notification makes no sound. This is not an early warning.",
  bag: "72-hour kit", bagReset: "Clear all", radio: "My local radio frequency", radioHint: "Find out the frequency of TRT Radyo 1 or TRT FM in your city now and write it here. It will show on the crisis screen.", radioPlaceholder: "e.g. TRT FM 99.5",
  myths: "Common myths, corrected", drill: "Try the crisis screen", drillLabel: "DRILL",
  plan: "Family plan", planNote: "Stays on this device only.", planName: "Full name", planRel1: "Relative 1 phone", planRel2: "Relative 2 phone", planBlood: "Blood type", planMeds: "Regular medicine", planAllergy: "Allergy", planHealth: "Health (optional; stays on the device and prints only if you fill it in)",
  print: "Print", printNote: "Paper keeps working when power and internet are gone.", printBag: "Print the kit list", printPlan: "Print the family plan", printCard: "Print the wallet card",
  sheetBag: "72-hour kit", sheetPlan: "Family plan", sheetCard: "Wallet card", cut: "Cut along the dashed line and keep it in your wallet.", front: "FRONT", backSide: "BACK", household: "Household", date: "Date",
  card112: "112 — emergency call", cardRadio: "Radio", cardPmr: "PMR446 Channel 1", cardTail: "If lines are busy, do not call; send a message.", cardLoc: "Province", cardMeet1: "Meeting 1", cardMeet2: "Meeting 2", cardContact: "Out-of-town contact", cardRel: "Relative",
  crisis: "EARTHQUAKE", kmFrom: "{km} km from the centre", agoMin: "{n} min ago", srcLabel: "source", doNow: "WHAT TO DO NOW", comms: "COMMUNICATION", radioSaved: "Your saved radio frequency", radioMissing: "save your frequency in Alert",
  tools: "TOOLS", torch: "SCREEN AS FLASHLIGHT", whistle: "EMERGENCY WHISTLE", whistleStop: "STOP THE WHISTLE", whistleNote: "It drains the battery. The real whistle in your kit is more effective.", okMsg: "PREPARE AN \"I'M OK\" MESSAGE", okText: "I'm OK. I'm in the {yer} area. Lines are busy, please write by message.",
  normal: "Back to normal mode", torchClose: "Tap to close", meet: "Meeting points", contact: "Contact person", unknownEvent: "The event in the notification is not in the data right now; showing the general instructions.", planShown: "FAMILY PLAN",
  offlineNote: "Works offline: the kit, guidance, flashlight and whistle open without internet.", offlineSave: "Save for offline", offlineSaved: "Saved for offline.",
  noList: "There is no list for this event.", sevNow: "For you right now",
};
export type AlertKey = keyof typeof tr;
export const ALERT = { tr: tr as Record<AlertKey, string>, en };
