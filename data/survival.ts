/**
 * Content for /survive. Rules for this file:
 *  - Only widely established, official-source guidance. Where a number comes from an agency we say which.
 *  - No medicine doses. Medical items link to the issuing health authority instead.
 *  - Links were checked on 2026-10-03; sites that block automated checks are marked `botBlocked`.
 */

export type ScenarioTag = "blackout" | "quake" | "nuclear" | "pandemic" | "ash" | "flood" | "heat";

export const SCENARIO_FILTERS: { id: ScenarioTag | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "blackout", label: "Power / comms outage" },
  { id: "quake", label: "Earthquake" },
  { id: "flood", label: "Flood / storm" },
  { id: "heat", label: "Heat wave" },
  { id: "pandemic", label: "Pandemic" },
  { id: "ash", label: "Ash / smoke" },
  { id: "nuclear", label: "Nuclear / radiation" },
];

export type BagCategory = "water" | "food" | "health" | "comms" | "documents" | "shelter" | "tools" | "household";

export const CATEGORY_LABEL: Record<BagCategory, string> = {
  water: "Water",
  food: "Food",
  health: "Health & hygiene",
  comms: "Communication & light",
  documents: "Documents & money",
  shelter: "Shelter & warmth",
  tools: "Tools",
  household: "Household needs",
};

export type BagItem = {
  id: string;
  tier: 1 | 2;
  category: BagCategory;
  name: string;
  why: string;
  tags: ScenarioTag[]; // scenarios where this item matters most; empty = always
  source?: { label: string; url: string };
};

const READY_KIT = { label: "Ready.gov: Build a kit", url: "https://www.ready.gov/kit" };
const READY_PLAN = { label: "Ready.gov: Make a plan", url: "https://www.ready.gov/plan" };
const STOP_BLEED = { label: "Stop the Bleed", url: "https://www.stopthebleed.org/" };
const WHO_KI = {
  label: "WHO: iodine thyroid blocking guidelines",
  url: "https://www.who.int/publications/i/item/9789241550185",
};

export const BAG_ITEMS: BagItem[] = [
  // ---------- Tier 1: grab-and-go, about 72 hours ----------
  { id: "water-3d", tier: 1, category: "water", name: "Drinking water for each person", why: "Ready.gov: one gallon (about 4 litres) per person per day for several days, for drinking and sanitation.", tags: [], source: READY_KIT },
  { id: "water-treat", tier: 1, category: "water", name: "Water filter or purification tablets", why: "Lets you refill from questionable sources. Follow the product's own instructions for use.", tags: ["flood", "blackout", "quake"] },
  { id: "food-3d", tier: 1, category: "food", name: "Ready-to-eat, non-perishable food", why: "Ready.gov: at least a several-day supply. Choose food you already eat and that needs no cooking.", tags: [], source: READY_KIT },
  { id: "opener", tier: 1, category: "food", name: "Manual can opener", why: "Listed by Ready.gov. Electric openers fail in a power cut.", tags: ["blackout"], source: READY_KIT },
  { id: "firstaid", tier: 1, category: "health", name: "First aid kit", why: "Listed by Ready.gov. A course (Red Cross, Kızılay or similar) matters more than the kit.", tags: [], source: READY_KIT },
  { id: "meds", tier: 1, category: "health", name: "Your regular medicines, plus a written list of names and doses", why: "Pharmacies may be closed or out of reach. Keep the list in your documents bag.", tags: [] },
  { id: "tourniquet", tier: 1, category: "health", name: "Tourniquet and gloves (only if you have been trained)", why: "Severe bleeding is a leading cause of preventable death after accidents and attacks; a short training course teaches when and how to use one.", tags: ["quake", "blackout"], source: STOP_BLEED },
  { id: "masks", tier: 1, category: "health", name: "Dust masks (N95 / FFP2)", why: "Ready.gov lists dust masks to help filter contaminated air. Also useful for ash, wildfire smoke and respiratory outbreaks.", tags: ["ash", "pandemic", "quake"], source: READY_KIT },
  { id: "hygiene", tier: 1, category: "health", name: "Moist towelettes, garbage bags, plastic ties", why: "Listed by Ready.gov for sanitation.", tags: [], source: READY_KIT },
  { id: "ki", tier: 1, category: "health", name: "Know your health authority's advice on potassium iodide (do not self-medicate)", why: "It only protects the thyroid from radioactive iodine, not from other radiation, and should be taken only when authorities say so. Doses are in the WHO guideline, not on this site.", tags: ["nuclear"], source: WHO_KI },
  { id: "radio", tier: 1, category: "comms", name: "Battery-powered or hand-crank radio (and a NOAA Weather Radio if you are in the US)", why: "Official instructions keep coming over broadcast radio when phones and internet do not.", tags: ["blackout", "nuclear", "flood", "quake"], source: READY_KIT },
  { id: "phone-power", tier: 1, category: "comms", name: "Phone chargers and a charged backup battery", why: "Listed by Ready.gov. Texts often work when calls do not.", tags: ["blackout"], source: READY_KIT },
  { id: "light", tier: 1, category: "comms", name: "Flashlight or headlamp, with spare batteries", why: "Listed by Ready.gov.", tags: [], source: READY_KIT },
  { id: "whistle", tier: 1, category: "comms", name: "Whistle", why: "Ready.gov: to signal for help, for example if trapped under debris.", tags: ["quake"], source: READY_KIT },
  { id: "contacts", tier: 1, category: "comms", name: "Paper list of contacts, meeting places and an out-of-town contact", why: "Phones die or lose contacts. Write the plan down and practise it.", tags: [], source: READY_PLAN },
  { id: "docs", tier: 1, category: "documents", name: "Copies of ID, insurance, medical information (waterproof bag)", why: "Replacing documents is much easier when you have copies. A password-protected digital copy helps too.", tags: [] },
  { id: "cash", tier: 1, category: "documents", name: "Some cash in small notes", why: "Card readers and ATMs fail in outages.", tags: ["blackout", "quake", "flood"] },
  { id: "warm", tier: 1, category: "shelter", name: "Warm layer, emergency blanket, sturdy shoes", why: "Staying warm and being able to walk over rubble or glass are basic needs.", tags: ["quake", "blackout", "flood"] },
  { id: "sheeting", tier: 1, category: "shelter", name: "Plastic sheeting, scissors and duct tape", why: "Ready.gov: to shelter in place by sealing a room.", tags: ["nuclear", "pandemic", "ash"], source: READY_KIT },
  { id: "maps", tier: 1, category: "tools", name: "Local paper map and a compass", why: "Ready.gov lists local maps. They work without batteries or GPS.", tags: ["blackout"], source: READY_KIT },
  { id: "wrench", tier: 1, category: "tools", name: "Wrench or pliers to turn off utilities", why: "Ready.gov lists this. Learn where your gas, water and power shut-offs are.", tags: ["quake", "flood"], source: READY_KIT },

  // ---------- Tier 2: staying at home / sheltering longer ----------
  { id: "water-more", tier: 2, category: "water", name: "More stored water than the minimum", why: "Several days is the official minimum. Check what your local authority recommends for your region; some advise a week or more.", tags: ["blackout", "flood", "quake"], source: { label: "Ready.gov: Water", url: "https://www.ready.gov/water" } },
  { id: "food-more", tier: 2, category: "food", name: "Shelf-stable food you normally eat, rotated", why: "Eat the oldest first and replace it, so the stock never expires unnoticed.", tags: [], source: { label: "Ready.gov: Food", url: "https://www.ready.gov/food" } },
  { id: "stove", tier: 2, category: "food", name: "Camping stove and fuel (use outdoors only)", why: "Burning fuel indoors can cause carbon monoxide poisoning.", tags: ["blackout", "flood"] },
  { id: "co-alarm", tier: 2, category: "tools", name: "Battery carbon monoxide alarm", why: "Outages push people to burn fuel indoors; the gas is invisible and odourless.", tags: ["blackout", "flood"] },
  { id: "power", tier: 2, category: "comms", name: "Large power bank or solar charger", why: "Keeps a radio and phone alive for days. Run generators outdoors only.", tags: ["blackout"] },
  { id: "sanitation", tier: 2, category: "health", name: "Extra hygiene supplies and sanitation bags", why: "When water pressure fails, sanitation becomes a health issue within days.", tags: ["blackout", "flood", "quake"] },
  { id: "sleep", tier: 2, category: "shelter", name: "Sleeping bags or blankets for everyone", why: "Heating may be down for days.", tags: ["blackout", "quake"] },
  { id: "tools2", tier: 2, category: "tools", name: "Work gloves, fire extinguisher, basic hand tools", why: "For small fires and clearing debris safely.", tags: ["quake"] },
  { id: "shelter-spot", tier: 2, category: "shelter", name: "Pick your sheltering room: a basement or the centre of the building, away from windows", why: "Ready.gov's guidance for a nuclear explosion is get inside, stay inside, stay tuned; stay in the most protective place for at least 24 hours unless officials say otherwise.", tags: ["nuclear"], source: { label: "Ready.gov: Nuclear explosion", url: "https://www.ready.gov/nuclear-explosion" } },
  { id: "pets", tier: 2, category: "household", name: "Pet food, water, medicines and a carrier", why: "Ready.gov includes pets in household planning.", tags: [], source: READY_PLAN },
  { id: "special", tier: 2, category: "household", name: "Supplies for babies, older adults, or anyone with medical or disability needs", why: "Ready.gov's plan starts by assessing your own household's needs.", tags: [], source: READY_PLAN },
  { id: "comfort", tier: 2, category: "household", name: "Books, cards, a few comforts for children", why: "Long waits are stressful. Calm helps everyone make better decisions.", tags: [] },
];

// ---------------- Communication without networks ----------------

export type CommsRow = {
  service: string;
  where: string;
  licence: string;
  detail: string;
};

export const COMMS_ROWS: CommsRow[] = [
  { service: "Text messages", where: "Anywhere with a signal", licence: "None", detail: "Emergency agencies generally advise texting rather than calling in a disaster: texts need less network capacity." },
  { service: "AM/FM (and shortwave) broadcast radio", where: "Everywhere", licence: "None (receive only)", detail: "Battery or hand-crank sets keep working without cell towers or internet. Local authorities use broadcast radio for official instructions." },
  { service: "NOAA Weather Radio", where: "United States", licence: "None (receive only)", detail: "Seven channels from 162.400 to 162.550 MHz; models with tone alert wake you for warnings." },
  { service: "PMR446 walkie-talkies", where: "Europe and other CEPT countries", licence: "Licence-free", detail: "About 446.0–446.2 MHz, maximum 0.5 W. Range is typically a kilometre or a few in towns, more in open terrain. Rules differ by country: check your regulator." },
  { service: "FRS / GMRS", where: "United States", licence: "FRS licence-free; GMRS needs an FCC licence", detail: "UHF channels around 462 and 467 MHz. FRS radios are sold everywhere; higher-power GMRS requires a licence." },
  { service: "Amateur (ham) radio", where: "Worldwide", licence: "Licence required to transmit", detail: "Calling frequencies include 146.520 MHz (2 m, United States), 446.000 MHz (70 cm, United States) and 145.500 MHz FM (IARU Region 1 calling). Check your national society's band plan before use." },
];

export const REGULATOR_LINKS = [
  { label: "FCC (United States)", url: "https://www.fcc.gov/" },
  { label: "Ofcom (United Kingdom)", url: "https://www.ofcom.org.uk/" },
  { label: "BTK (Türkiye)", url: "https://www.btk.gov.tr/" },
  { label: "IARU Region 1 (amateur radio, Europe/Africa/Middle East)", url: "https://www.iaru-r1.org/" },
  { label: "CEPT / ECC (European radio rules)", url: "https://www.cept.org/ecc/" },
];

// ---------------- Medical & official guides (links only) ----------------

export type GuideLink = {
  title: string;
  org: string;
  blurb: string;
  url: string;
  botBlocked?: boolean; // site blocks automated link checks; the page exists
};

export const GUIDES: GuideLink[] = [
  { title: "Basic disaster supplies kit", org: "Ready.gov (US FEMA)", blurb: "The official checklist this page follows.", url: "https://www.ready.gov/kit" },
  { title: "Make a family emergency plan", org: "Ready.gov (US FEMA)", blurb: "Four steps: meet, assess, document, practise.", url: "https://www.ready.gov/plan" },
  { title: "Nuclear explosion: before, during, after", org: "Ready.gov (US FEMA)", blurb: "Get inside, stay inside, stay tuned; what to do about clothing and washing.", url: "https://www.ready.gov/nuclear-explosion" },
  { title: "Radiation emergencies", org: "Ready.gov (US FEMA)", blurb: "Power-plant incidents and dirty-bomb guidance.", url: "https://www.ready.gov/radiation" },
  { title: "Pandemic", org: "Ready.gov (US FEMA)", blurb: "Household preparation for a widespread illness.", url: "https://www.ready.gov/pandemic" },
  { title: "Earthquakes", org: "Ready.gov (US FEMA)", blurb: "Drop, cover, hold on; securing your home.", url: "https://www.ready.gov/earthquakes" },
  { title: "Power outages", org: "Ready.gov (US FEMA)", blurb: "Food safety, heating, medical devices.", url: "https://www.ready.gov/power-outages" },
  { title: "Floods", org: "Ready.gov (US FEMA)", blurb: "Before, during and after.", url: "https://www.ready.gov/floods" },
  { title: "Volcanoes and ashfall", org: "Ready.gov (US FEMA)", blurb: "Protecting lungs, vehicles and roofs.", url: "https://www.ready.gov/volcanoes" },
  { title: "Survival kit supplies", org: "American Red Cross", blurb: "A second, independent checklist.", url: "https://www.redcross.org/get-help/how-to-prepare-for-emergencies/survival-kit-supplies.html" },
  { title: "First aid training", org: "American Red Cross", blurb: "Courses; training beats a kit you cannot use.", url: "https://www.redcross.org/take-a-class/first-aid" },
  { title: "Stop the Bleed", org: "American College of Surgeons", blurb: "Short course on controlling severe bleeding, including tourniquets.", url: "https://www.stopthebleed.org/" },
  { title: "International first aid and resuscitation guidelines", org: "IFRC Global First Aid Reference Centre", blurb: "Evidence-based first aid guidance used by Red Cross and Red Crescent societies.", url: "https://www.globalfirstaidcentre.org/" },
  { title: "Iodine thyroid blocking: guidelines", org: "World Health Organization", blurb: "When and how potassium iodide is used in a radiological or nuclear emergency. Read it before a crisis, take it only on official advice.", url: "https://www.who.int/publications/i/item/9789241550185" },
  { title: "Radiation: health topics", org: "World Health Organization", blurb: "Plain-language background on radiation and health.", url: "https://www.who.int/health-topics/radiation" },
  { title: "Radiation emergencies", org: "US CDC", blurb: "Guidance for the public on radiation emergencies.", url: "https://www.cdc.gov/radiation-emergencies/", botBlocked: true },
  { title: "AFAD (disaster and emergency authority)", org: "Türkiye", blurb: "Official alerts and preparedness material in Turkish.", url: "https://www.afad.gov.tr/" },
  { title: "Kızılay (Turkish Red Crescent)", org: "Türkiye", blurb: "Courses and emergency support.", url: "https://www.kizilay.org.tr/" },
];

export const OFFLINE_READING = [
  { label: "Kiwix", url: "https://kiwix.org/", note: "Download Wikipedia or medical reference collections and read them with no internet." },
  { label: "Organic Maps", url: "https://organicmaps.app/", note: "Free offline maps with walking routes, built on OpenStreetMap." },
  { label: "OsmAnd", url: "https://osmand.net/", note: "Offline OpenStreetMap maps and navigation." },
];

/** Radiation shelter guidance (Ready.gov). Shown on /survive and in the preparedness pack. */
export const SHELTER_GUIDANCE = {
  lead: "Official guidance (Ready.gov) is three words:",
  leadBold: "get inside, stay inside, stay tuned.",
  bullets: [
    "Go to the nearest solid building, away from windows. A basement or the middle of a building is best.",
    "If you are caught outside by a blast, Ready.gov advises lying face down to protect your skin, then getting indoors within about 10 minutes, before fallout arrives.",
    "Stay for at least 24 hours unless officials say otherwise or you face an immediate danger. Close windows, doors and air intakes.",
    "Afterwards, remove outer clothing (this removes up to 90% of radioactive material, per Ready.gov), wash with soap and water, and avoid unsealed outdoor food until authorities say it is safe.",
    "Potassium iodide is not a general radiation pill. Take it only if your health authority tells you to.",
  ],
  sources: [
    { label: "Ready.gov: Nuclear explosion", url: "https://www.ready.gov/nuclear-explosion" },
    { label: "WHO iodine thyroid blocking guideline", url: "https://www.who.int/publications/i/item/9789241550185" },
  ],
};

/**
 * Turkish text for /survive, next to the English above. Official quotes stay in the original language with a Turkish
 * translation marked as a translation. Numbers, units and source names are unchanged.
 */
export const TR = {
  filters: { all: "Tümü", blackout: "Elektrik / iletişim kesintisi", quake: "Deprem", flood: "Sel / fırtına", heat: "Sıcak hava dalgası", pandemic: "Salgın", ash: "Kül / duman", nuclear: "Nükleer / radyasyon" } as Record<ScenarioTag | "all", string>,
  tiers: { 1: "Hazır çanta (yaklaşık 72 saat)", 2: "Evde kalma (daha uzun)" } as Record<1 | 2, string>,
  categories: { water: "Su", food: "Yiyecek", health: "Sağlık ve hijyen", comms: "İletişim ve aydınlatma", documents: "Belgeler ve para", shelter: "Barınma ve ısınma", tools: "Aletler", household: "Hane ihtiyaçları" } as Record<BagCategory, string>,
  items: {
    "water-3d": ["Kişi başına içme suyu", "Ready.gov: kişi başına günde bir galon (yaklaşık 4 litre), birkaç gün için; içmek ve temizlik için."],
    "water-treat": ["Su filtresi veya arıtma tableti", "Şüpheli kaynaklardan su almanızı sağlar. Ürünün kendi kullanım talimatına uyun."],
    "food-3d": ["Hazır yenebilen, bozulmayan yiyecek", "Ready.gov: en az birkaç günlük yiyecek. Zaten yediğiniz, pişirme gerektirmeyen yiyecekleri seçin."],
    opener: ["Elde kullanılan konserve açacağı", "Ready.gov listesinde var. Elektrikli açacaklar elektrik kesilince işe yaramaz."],
    firstaid: ["İlk yardım çantası", "Ready.gov listesinde var. Çantadan çok bir ilk yardım kursu (Kızılay veya benzeri) önemlidir."],
    meds: ["Düzenli kullandığınız ilaçlar ve adlarını ve dozlarını gösteren yazılı bir liste", "Eczaneler kapalı veya ulaşılamaz olabilir. Listeyi belge çantanızda tutun."],
    tourniquet: ["Turnike ve eldiven (yalnızca eğitim aldıysanız)", "Ağır kanama, kaza ve saldırılardan sonra önlenebilir ölümlerin önde gelen nedenlerindendir; kısa bir eğitim ne zaman ve nasıl kullanılacağını öğretir."],
    masks: ["Toz maskesi (N95 / FFP2)", "Ready.gov, kirli havayı süzmeye yardımcı olması için toz maskelerini listeler. Kül, orman yangını dumanı ve solunum yoluyla bulaşan salgınlarda da işe yarar."],
    hygiene: ["Islak mendil, çöp torbası, plastik bağ", "Ready.gov tarafından temizlik için listelenmiştir."],
    ki: ["Sağlık otoritenizin potasyum iyodür tavsiyesini öğrenin (kendi kendinize ilaç almayın)", "Yalnızca tiroidi radyoaktif iyottan korur, diğer radyasyondan korumaz ve yalnızca yetkililer söylediğinde alınmalıdır. Dozlar bu sitede değil, WHO kılavuzundadır."],
    radio: ["Pilli veya kollu radyo (ABD'deyseniz NOAA Hava Radyosu da)", "Telefon ve internet çalışmadığında da resmi talimatlar yayın radyosundan gelmeye devam eder."],
    "phone-power": ["Telefon şarj aletleri ve dolu bir yedek pil", "Ready.gov listesinde var. Aramalar çalışmasa da kısa mesajlar çoğu zaman gider."],
    light: ["El feneri veya kafa lambası, yedek pillerle", "Ready.gov listesinde var."],
    whistle: ["Düdük", "Ready.gov: yardım çağırmak için, örneğin enkaz altında kalırsanız."],
    contacts: ["Kişilerin, buluşma yerlerinin ve şehir dışındaki bir irtibat kişisinin kâğıt listesi", "Telefonlar bozulur veya kişileri kaybeder. Planı yazın ve prova edin."],
    docs: ["Kimlik, sigorta ve sağlık bilgilerinin kopyaları (su geçirmez torba)", "Kopyanız varsa belgeleri yenilemek çok daha kolaydır. Şifreli bir dijital kopya da yardımcı olur."],
    cash: ["Küçük banknotlardan bir miktar nakit", "Kesintilerde kart okuyucular ve ATM'ler çalışmaz."],
    warm: ["Sıcak tutan bir kat, acil durum battaniyesi, sağlam ayakkabı", "Sıcak kalmak ve enkaz ya da cam üzerinde yürüyebilmek temel ihtiyaçlardır."],
    sheeting: ["Plastik örtü, makas ve koli bandı", "Ready.gov: bir odayı sızdırmaz hale getirerek içeride korunmak için."],
    maps: ["Yerel kâğıt harita ve pusula", "Ready.gov yerel haritaları listeler. Pil veya GPS olmadan çalışırlar."],
    wrench: ["Tesisatı kapatmak için İngiliz anahtarı veya pense", "Ready.gov listesinde var. Gaz, su ve elektrik vanalarının nerede olduğunu öğrenin."],
    "water-more": ["Asgari miktardan fazla depolanmış su", "Birkaç gün, resmi asgari miktardır. Bölgeniz için yerel yönetimin önerisine bakın; bazıları bir hafta veya daha fazlasını önerir."],
    "food-more": ["Normalde yediğiniz, rafta dayanıklı yiyecekler; düzenli yenilenerek", "Önce en eskiyi yiyin ve yerine yenisini koyun; böylece stok fark edilmeden bozulmaz."],
    stove: ["Kamp ocağı ve yakıt (yalnızca açık havada kullanın)", "Kapalı yerde yakıt yakmak karbonmonoksit zehirlenmesine yol açabilir."],
    "co-alarm": ["Pilli karbonmonoksit alarmı", "Kesintiler insanları kapalı yerde yakıt yakmaya iter; gaz görünmez ve kokusuzdur."],
    power: ["Büyük güç bankası veya güneş enerjili şarj aleti", "Radyoyu ve telefonu günlerce çalışır tutar. Jeneratörleri yalnızca açık havada çalıştırın."],
    sanitation: ["Ek hijyen malzemesi ve atık torbaları", "Su basıncı düştüğünde temizlik birkaç gün içinde sağlık sorununa dönüşür."],
    sleep: ["Herkes için uyku tulumu veya battaniye", "Isıtma günlerce kesik kalabilir."],
    tools2: ["İş eldiveni, yangın söndürücü, temel el aletleri", "Küçük yangınlar için ve enkazı güvenle kaldırmak için."],
    "shelter-spot": ["Barınma odanızı seçin: bodrum veya binanın ortası, pencerelerden uzak", "Ready.gov'un nükleer patlama rehberi: içeri girin, içeride kalın, haberleri takip edin; yetkililer aksini söylemedikçe en az 24 saat en korunaklı yerde kalın."],
    pets: ["Evcil hayvan maması, su, ilaç ve taşıma kafesi", "Ready.gov evcil hayvanları hane planına dahil eder."],
    special: ["Bebekler, yaşlılar veya sağlık ya da engellilik ihtiyacı olanlar için malzeme", "Ready.gov planı, kendi hanenizin ihtiyaçlarını değerlendirerek başlar."],
    comfort: ["Kitaplar, kâğıt oyunları, çocuklar için birkaç rahatlatıcı şey", "Uzun beklemeler stresli olur. Sakinlik herkesin daha iyi karar vermesine yardım eder."],
  } as Record<string, [string, string]>,
  plan: {
    steps: [
      ["Buluşun.", "Uyarıları nasıl alacağınızı, nerede barınacağınızı, nasıl ayrılacağınızı ve hane halkının birbiriyle nasıl iletişim kuracağını konuşun."],
      ["Değerlendirin.", "Sağlık ihtiyaçlarını, engellilikleri, çocukları, yaşlı yakınları ve evcil hayvanları not edin."],
      ["Yazın.", "Kişileri, evinizin yakınındaki bir buluşma yerini, bölgenizin dışında bir buluşma yerini ve şehir dışındaki bir irtibat kişisini yazın."],
      ["Prova edin.", "Kimsenin prova etmediği plan, stres altında çöker."],
    ] as [string, string][],
    stepsSource: "Adımlar Ready.gov'dan: Make a plan.",
  },
  shelter: {
    lead: "Resmi rehber (Ready.gov) üç sözcüktür:",
    quote: "get inside, stay inside, stay tuned",
    translation: "(çeviri: içeri girin, içeride kalın, haberleri takip edin)",
    bullets: [
      "En yakın sağlam binaya, pencerelerden uzağa gidin. Bodrum veya binanın ortası en iyisidir.",
      "Patlamada dışarıda yakalanırsanız Ready.gov, cildinizi korumak için yüzüstü yatmayı, sonra serpinti gelmeden yaklaşık 10 dakika içinde içeri girmeyi önerir.",
      "Yetkililer aksini söylemedikçe veya acil bir tehlike yoksa en az 24 saat içeride kalın. Pencereleri, kapıları ve hava girişlerini kapatın.",
      "Sonrasında dış giysilerinizi çıkarın (Ready.gov'a göre bu, radyoaktif maddenin %90'a kadarını uzaklaştırır), sabun ve suyla yıkanın ve yetkililer güvenli olduğunu söyleyene kadar ambalajsız dış mekân yiyeceklerinden kaçının.",
      "Potasyum iyodür genel bir radyasyon hapı değildir. Yalnızca sağlık otoriteniz söylerse alın.",
    ],
    sourceLabel: "Kaynak:",
  },
  page: {
    title: "Ne yapabilirsiniz?",
    intro: "Resmi kaynaklardan sakin bir hazırlık rehberi: plan, kontrol listesi, barınma, iletişim, çevrimdışı haritalar. Çevrimdışı çalışır ve hesap gerektirmez.",
    keyPoints: [
      "Hazırlık sıradan ve yereldir: su, yiyecek, ışık, ilaç, haber almanın bir yolu ve hane halkının prova ettiği bir plan.",
      "Aynı çanta deprem, sel, uzun süreli elektrik kesintisi veya salgın dalgası için işe yarar.",
      "Radyasyon acil durumunda resmi tavsiye üç sözcüktür: içeri girin, içeride kalın, haberleri takip edin.",
      "Hiçbir şey hesap gerektirmez; işaretleriniz bu cihazdan çıkmaz.",
    ],
    sections: { plan: "Plan", bag: "Kontrol listesi", shelter: "Radyasyondan korunma", comms: "İletişim", maps: "Çevrimdışı haritalar", guides: "Resmi rehberler" } as Record<string, string>,
    checklistTitle: "Acil durum çantası kontrol listesi",
  },
  afad: {
    title: "AFAD: Afet ve Acil Durum Yönetimi Başkanlığı (Türkiye)",
    note: "Türkiye'deyseniz resmi rehberler için AFAD'a bakın. Aşağıdaki bağlantılar ABD ve uluslararası kurumlara aittir ve İngilizcedir.",
    url: "https://www.afad.gov.tr",
  },
};
