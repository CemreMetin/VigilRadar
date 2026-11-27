// Every Turkish and English string of the simulator (VIGIL_V2_SPEC.md 0.6): names, domino templates, interface labels.
import type { Bilingual, ChannelId, ImpactTier, ShockId } from "./types";

const t = (en: string, tr: string): Bilingual => ({ en, tr });

export const CHANNEL_NAMES: Record<ChannelId, Bilingual> = {
  energy: t("Energy", "Enerji"),
  trade: t("Trade", "Ticaret"),
  food: t("Food", "Gıda"),
  digital: t("Digital", "Dijital"),
  macro: t("Prices", "Fiyatlar"),
};

export const TIER_NAMES: Record<ImpactTier, Bilingual> = {
  none: t("MINIMAL", "ÇOK DÜŞÜK"),
  low: t("LOW", "DÜŞÜK"),
  moderate: t("MODERATE", "ORTA"),
  high: t("HIGH", "YÜKSEK"),
  severe: t("SEVERE", "ÇOK YÜKSEK"),
};

export const ORDER_NAMES: Record<1 | 2 | 3, Bilingual> = {
  1: t("1st order · direct", "1. derece · doğrudan"),
  2: t("2nd order · supply chain", "2. derece · tedarik"),
  3: t("3rd order · global prices", "3. derece · küresel fiyat"),
};

export const SHOCK_COPY: Record<ShockId, { chip: Bilingual; name: Bilingual; summary: Bilingual }> = {
  hormuz: { chip: t("Hormuz", "Hürmüz"), name: t("Strait of Hormuz closure", "Hürmüz Boğazı kapanması"), summary: t("About a fifth of the world's seaborne oil and LNG is held back in the Gulf.", "Dünyanın deniz yoluyla taşınan petrol ve LNG'sinin yaklaşık beşte biri Körfez'de kalır.") },
  suez: { chip: t("Suez", "Süveyş"), name: t("Suez and Bab el-Mandeb disruption", "Süveyş ve Babülmendep kesintisi"), summary: t("Asia–Europe shipping reroutes around the Cape, adding 10 to 14 days.", "Asya–Avrupa hattı Ümit Burnu'na döner; yolculuk 10–14 gün uzar.") },
  taiwan: { chip: t("Taiwan", "Tayvan"), name: t("Major Taiwan disruption", "Tayvan'da büyük kesinti"), summary: t("A major quake or blockade halts advanced chip output and the East Asian corridor.", "Büyük bir deprem veya abluka ileri çip üretimini ve Doğu Asya koridorunu durdurur.") },
  "redsea-cables": { chip: t("Red Sea cables", "Kızıldeniz kabloları"), name: t("Red Sea cable cut", "Kızıldeniz kablo kopması"), summary: t("The Europe–Asia–East Africa subsea fibre corridor breaks at its narrowest point.", "Avrupa–Asya–Doğu Afrika denizaltı fiber koridoru en dar noktasında kopar.") },
  blacksea: { chip: t("Black Sea", "Karadeniz"), name: t("Black Sea export gate closure", "Karadeniz çıkış kapısının kapanması"), summary: t("Grain, sunflower oil, fertiliser and crude cannot leave the Black Sea.", "Tahıl, ayçiçek yağı, gübre ve ham petrol Karadeniz'den çıkamaz.") },
  panama: { chip: t("Panama", "Panama"), name: t("Panama Canal drought limits", "Panama Kanalı kuraklık kısıtı"), summary: t("Low water in Gatún Lake cuts daily transits between the US East Coast and Asia.", "Gatún Gölü'nde su düşünce ABD Doğu Kıyısı–Asya arasındaki günlük geçiş azalır.") },
  "volcano-vei7": { chip: t("VEI 7 eruption", "VEI 7 patlama"), name: t("Tambora-scale eruption", "Tambora ölçeğinde patlama"), summary: t("A sulphate veil cools the planet by 0.5–1 °C for one to two years and hits harvests.", "Sülfat örtüsü gezegeni 1–2 yıl boyunca 0,5–1 °C soğutur ve hasadı vurur.") },
  "solar-g5": { chip: t("G5 solar storm", "G5 güneş fırtınası"), name: t("Carrington-scale solar storm", "Carrington ölçeğinde güneş fırtınası"), summary: t("A G5 geomagnetic storm strains high-latitude grids and disrupts satellites, GNSS and HF radio.", "G5 jeomanyetik fırtına yüksek enlem şebekelerini zorlar; uydu, GNSS ve HF haberleşmeyi bozar.") },
};

const phase = (untilDay: number, label: Bilingual, text: Bilingual) => ({ untilDay, label, text });

/** Four phases per shock: what happens up to `untilDay`. The boundaries follow the channel onset and peak days in shocks.ts. */
export const SHOCK_PHASES: Record<ShockId, { untilDay: number; label: Bilingual; text: Bilingual }[]> = {
  hormuz: [
    phase(3, t("Shock", "İlk şok"), t("Tankers stop at the strait; spot oil and LNG prices jump and Gulf voyages are re-insured.", "Tankerler boğazda durur; spot petrol ve LNG fiyatı sıçrar, Körfez seferlerinin sigortası yeniden fiyatlanır.")),
    phase(14, t("Buffer drain", "Stok erimesi"), t("Cargoes already at sea arrive, then gaps open; importers draw down stocks, Asia first.", "Yoldaki yükler varır, sonra boşluk başlar; ithalatçılar stok eritir, önce Asya.")),
    phase(45, t("Price pass-through", "Fiyat yansıması"), t("Fuel, power and freight costs rise and press on inflation and trade balances.", "Yakıt, elektrik ve navlun maliyeti artar; enflasyonu ve dış ticaret dengesini zorlar.")),
    phase(180, t("Adjustment", "Uyum"), t("Fertiliser and diesel costs reach food prices; buyers switch suppliers and cut demand.", "Gübre ve mazot maliyeti gıda fiyatına ulaşır; alıcılar tedarikçi değiştirir, talebi kısar.")),
  ],
  suez: [
    phase(5, t("Diversion", "Rota sapması"), t("Ships queue or turn towards the Cape of Good Hope; war-risk and freight quotes rise.", "Gemiler bekler veya Ümit Burnu'na döner; savaş riski primi ve navlun teklifleri yükselir.")),
    phase(21, t("Longer route", "Uzayan rota"), t("Asia–Europe sailings take 10–14 days longer; arrivals at European ports show gaps.", "Asya–Avrupa seferleri 10–14 gün uzar; Avrupa limanlarında varışlar seyrekleşir.")),
    phase(60, t("Capacity squeeze", "Kapasite daralması"), t("More ships are tied up per cargo; freight and delivery times climb and canal revenue falls.", "Aynı yük için daha çok gemi gerekir; navlun ve teslim süresi artar, kanal geliri düşer.")),
    phase(180, t("New schedules", "Yeni tarifeler"), t("Carriers rebuild timetables around Africa; the added cost passes into consumer prices.", "Hatlar tarifeleri Afrika rotasına göre kurar; ek maliyet tüketici fiyatlarına geçer.")),
  ],
  taiwan: [
    phase(5, t("Shock", "İlk şok"), t("Advanced wafer fabs halt and East Asian shipping freezes; freight risk spikes across Taiwan, Japan and South Korea.", "İleri yonga fabrikaları durur, Doğu Asya deniz trafiği kilitlenir; Tayvan, Japonya ve Güney Kore'de navlun riski sıçrar.")),
    phase(25, t("Buffer drain", "Stok erimesi"), t("Semiconductor buffers deplete across US, Chinese and European cloud, electronics and automotive factories.", "ABD, Çin ve Avrupa'da bulut, elektronik ve otomotiv tesislerinin yonga stokları erir.")),
    phase(75, t("Production squeeze", "Üretim daralması"), t("Server, phone and vehicle assembly slows globally as replacement capacity cannot cover leading-edge nodes.", "En ileri üretim süreçlerinin yerini dolduracak kapasite olmadığı için sunucu, telefon ve araç montajı dünya genelinde yavaşlar.")),
    phase(180, t("Rerouting", "Yeniden yönlendirme"), t("Firms ration chips and redesign around legacy nodes; higher hardware costs pass into global prices.", "Şirketler yongayı paylaştırır, eski süreçlere göre yeniden tasarlar; artan donanım maliyeti fiyatlara geçer.")),
  ],
  "redsea-cables": [
    phase(3, t("Cable cut", "Kablo kopması"), t("Europe–Asia and East Africa traffic reroutes; latency rises and backup links congest.", "Avrupa–Asya ve Doğu Afrika trafiği yön değiştirir; gecikme artar, yedek hatlar tıkanır.")),
    phase(14, t("Congestion", "Tıkanma"), t("Operators buy capacity on longer paths; banking, cloud and logistics systems run slower.", "İşletmeciler uzun yollardan kapasite alır; banka, bulut ve lojistik sistemleri yavaşlar.")),
    phase(45, t("Repair", "Onarım"), t("Repair ships need permits and safe access; faults are spliced one segment at a time.", "Onarım gemileri izin ve güvenli erişim bekler; arızalar kesim kesim eklenir.")),
    phase(180, t("Restoration", "Geri dönüş"), t("Repaired segments return to service; operators add routes that avoid the narrow corridor.", "Onarılan kesimler devreye döner; işletmeciler dar koridordan kaçınan yeni rotalar ekler.")),
  ],
  blacksea: [
    phase(5, t("Closure", "Kapanma"), t("Black Sea loadings stop; ships wait on both sides of the straits and war-risk cover reprices.", "Karadeniz yüklemeleri durur; gemiler boğazların iki yanında bekler, savaş riski sigortası pahalanır.")),
    phase(30, t("Supply gap", "Arz açığı"), t("Grain, sunflower oil and fertiliser shipments are missed; importers draw down stocks.", "Tahıl, ayçiçek yağı ve gübre sevkiyatı gelmez; ithalatçılar stok eritir.")),
    phase(75, t("Price pressure", "Fiyat baskısı"), t("Bread, oil and feed prices rise; food import and subsidy bills grow.", "Ekmek, yağ ve yem fiyatı yükselir; gıda ithalat ve sübvansiyon faturası büyür.")),
    phase(180, t("Substitution", "İkame"), t("Cargo shifts to rail, road and river, and buyers turn to other origins at higher cost.", "Yük demiryolu, karayolu ve nehre kayar; alıcılar daha yüksek maliyetle başka kaynaklara döner.")),
  ],
  panama: [
    phase(7, t("Draft limits", "Draft kısıtı"), t("Low water in Gatún Lake cuts daily transit slots and the allowed draft.", "Gatún Gölü'nde su azalır; günlük geçiş hakkı ve izin verilen draft düşer.")),
    phase(30, t("Queues", "Kuyruk"), t("Slot auctions grow expensive; ships load lighter, wait or take other routes.", "Geçiş ihaleleri pahalanır; gemiler daha az yükler, bekler veya başka rotaya döner.")),
    phase(75, t("Delayed exports", "Geciken ihracat"), t("Grain, soybean and LNG cargoes from the Americas reach Asia later and cost more.", "Amerika'dan tahıl, soya ve LNG yükleri Asya'ya geç ve pahalı ulaşır.")),
    phase(180, t("Rationing", "Paylaştırma"), t("Limits last until rain refills the lake; higher shipping costs pass slowly into prices.", "Kısıt yağışlar gölü doldurana kadar sürer; taşıma maliyeti fiyatlara yavaşça geçer.")),
  ],
  "volcano-vei7": [
    phase(14, t("Eruption", "Patlama"), t("Ash and pyroclastic flows hit the region; nearby airspace and ports close.", "Kül ve piroklastik akıntılar bölgeyi vurur; yakındaki hava sahası ve limanlar kapanır.")),
    phase(30, t("Sulphate veil", "Sülfat örtüsü"), t("Sulphate aerosol spreads through the stratosphere and starts to dim sunlight.", "Sülfat aerosolü stratosfere yayılır ve güneş ışığını azaltmaya başlar.")),
    phase(120, t("Cooling", "Soğuma"), t("Temperatures fall and monsoon rain weakens; growing crops suffer and markets price it in.", "Sıcaklık düşer, muson yağışı zayıflar; tarladaki ürün zarar görür ve piyasa bunu fiyatlar.")),
    phase(180, t("Harvest loss", "Hasat kaybı"), t("Harvests come in short; food prices climb, hardest for import-dependent countries.", "Hasat eksik kalır; gıda fiyatı yükselir, en çok ithalata bağımlı ülkeler zorlanır.")),
  ],
  "solar-g5": [
    phase(1, t("Impact", "Çarpma"), t("Induced currents hit high-latitude grids; HF radio fades and GNSS positioning degrades.", "İndüklenen akımlar yüksek enlem şebekelerini vurur; HF radyo zayıflar, GNSS konumu bozulur.")),
    phase(3, t("Grid stress", "Şebeke zorlanması"), t("Operators shed load; damaged transformers cause regional blackouts and satellites report faults.", "İşletmeciler yük atar; hasarlı trafolar bölgesel kesintiye yol açar, uydular arıza bildirir.")),
    phase(30, t("Recovery", "Toparlanma"), t("Most lines return; areas with damaged transformers wait, and cold chains and logistics catch up.", "Hatların çoğu döner; trafosu hasarlı bölgeler bekler, soğuk zincir ve lojistik toparlanır.")),
    phase(180, t("Repair backlog", "Onarım kuyruğu"), t("Large transformers take months to replace; losses are tallied and grids are hardened.", "Büyük trafoların değişimi aylar alır; kayıplar hesaplanır, şebekeler güçlendirilir.")),
  ],
};

/** [English, Turkish, source] for one step of the domino chain: the mechanism through which the shock arrives. */
export const STEP_COPY: Record<ShockId, Record<ChannelId, [string, string, string]>> = {
  hormuz: {
    energy: ["Oil and LNG cargoes from the Gulf are delayed or lost; spot prices jump and stocks are drawn down.", "Körfez'den petrol ve LNG sevkiyatı gecikir veya kesilir; spot fiyatlar sıçrar, stoklar erir.", "EIA"],
    trade: ["Tanker insurance and freight rates rise; Gulf ports stop working normally.", "Tanker sigortası ve navlun yükselir; Körfez limanları normal çalışamaz.", "IMF PortWatch"],
    food: ["Gas-based fertiliser and diesel get expensive, which reaches food prices after a few weeks.", "Gaza dayalı gübre ve mazot pahalanır; birkaç hafta içinde gıda fiyatlarına yansır.", "FAO"],
    digital: ["Higher power costs press data centres and networks; the direct effect is small.", "Elektrik maliyeti veri merkezlerini ve ağları sıkıştırır; doğrudan etki küçüktür.", "IEA"],
    macro: ["Fuel prices feed into inflation, the trade balance and the exchange rate.", "Akaryakıt fiyatı enflasyona, dış ticaret dengesine ve kura yansır.", "IEA"],
  },
  suez: {
    energy: ["Crude, products and LNG take the longer route around Africa; delivery costs rise.", "Ham petrol, ürün ve LNG Afrika'yı dolaşır; teslim maliyeti artar.", "EIA"],
    trade: ["Container ships reroute around the Cape: 10–14 extra days, tighter capacity and higher freight.", "Konteyner gemileri Ümit Burnu'ndan döner: 10–14 gün ek süre, daralan kapasite, yüksek navlun.", "IMF PortWatch"],
    food: ["Grain, oil seed and food shipments arrive late and cost more to carry.", "Tahıl, yağlı tohum ve gıda sevkiyatı geç ve pahalıya gelir.", "UNCTAD"],
    digital: ["Hardware shipments are delayed; networks themselves are not affected.", "Donanım sevkiyatı gecikir; ağların kendisi etkilenmez.", "UNCTAD"],
    macro: ["Freight costs pass into import prices and inflation over one to three months.", "Navlun maliyeti 1–3 ayda ithalat fiyatlarına ve enflasyona geçer.", "UNCTAD"],
  },
  taiwan: {
    energy: ["Shipping risk in East Asian waters raises energy delivery costs.", "Doğu Asya sularındaki denizcilik riski enerji teslim maliyetini artırır.", "UN Comtrade"],
    trade: ["Container traffic through East Asia is disrupted; parts and finished goods stall.", "Doğu Asya konteyner trafiği aksar; parça ve mamul akışı tıkanır.", "UN Comtrade"],
    food: ["Farm machinery, inputs and cold-chain equipment that need chips are delayed.", "Çipe bağlı tarım makinesi, girdi ve soğuk zincir ekipmanı gecikir.", "UN Comtrade"],
    digital: ["Advanced chip supply stops; servers, phones and vehicles run short as stocks end.", "İleri çip arzı durur; stok bittikçe sunucu, telefon ve araç üretimi aksar.", "SIA"],
    macro: ["Factory stoppages and market stress hit growth, prices and investment.", "Fabrika duruşları ve piyasa stresi büyümeyi, fiyatları ve yatırımı vurur.", "SIA"],
  },
  "redsea-cables": {
    energy: ["Energy trading and logistics systems run on slower backup routes.", "Enerji ticareti ve lojistik sistemleri yavaş yedek hatlarda çalışır.", "ICPC"],
    trade: ["Booking, customs and payment systems that cross the corridor slow down.", "Koridordan geçen rezervasyon, gümrük ve ödeme sistemleri yavaşlar.", "ICPC"],
    food: ["The effect on food is indirect and small: payments and orders are delayed.", "Gıdaya etki dolaylı ve küçüktür: ödeme ve siparişler gecikir.", "ICPC"],
    digital: ["Europe–Asia traffic moves to longer paths: congestion, higher latency, repairs take weeks.", "Avrupa–Asya trafiği uzun yollara kayar: tıkanma, yüksek gecikme; onarım haftalar sürer.", "TeleGeography"],
    macro: ["Banks, markets and cloud services that depend on low latency are disturbed.", "Düşük gecikmeye bağlı banka, borsa ve bulut hizmetleri aksar.", "TeleGeography"],
  },
  blacksea: {
    energy: ["Black Sea crude and fuel loadings stop; replacement barrels cost more.", "Karadeniz ham petrol ve yakıt yüklemesi durur; ikame varil pahalıya gelir.", "UN Comtrade"],
    trade: ["Black Sea ports and the straits traffic fall; cargo moves to rail and road where it can.", "Karadeniz liman ve boğaz trafiği düşer; yük mümkün olan yerde demiryolu ve karayoluna kayar.", "IMF PortWatch"],
    food: ["Wheat, maize, sunflower oil and fertiliser supply tightens; import-dependent countries pay more.", "Buğday, mısır, ayçiçek yağı ve gübre arzı daralır; ithalata bağımlı ülkeler daha çok öder.", "FAO"],
    digital: ["Digital networks are hardly affected.", "Dijital ağlar neredeyse etkilenmez.", "UN Comtrade"],
    macro: ["Bread, oil and feed prices push inflation and food subsidy bills up.", "Ekmek, yağ ve yem fiyatı enflasyonu ve gıda sübvansiyon yükünü artırır.", "FAO"],
  },
  panama: {
    energy: ["US LNG and fuel cargoes to Asia take longer routes.", "ABD'den Asya'ya giden LNG ve yakıt yükleri uzun rotaya döner.", "UNCTAD"],
    trade: ["Fewer daily transits: queues, auctions for slots and detours around South America or by rail.", "Günlük geçiş azalır: kuyruk, geçiş hakkı ihaleleri, Güney Amerika veya demiryolu sapmaları.", "Panama Canal Authority"],
    food: ["Grain and soybean exports from the Americas to Asia are delayed and cost more.", "Amerika'dan Asya'ya tahıl ve soya ihracatı gecikir ve pahalanır.", "UNCTAD"],
    digital: ["Digital networks are not affected beyond hardware delays.", "Donanım gecikmesi dışında dijital ağlar etkilenmez.", "UNCTAD"],
    macro: ["Higher shipping costs pass slowly into consumer prices.", "Artan taşıma maliyeti tüketici fiyatlarına yavaşça geçer.", "IMF PortWatch"],
  },
  "volcano-vei7": {
    energy: ["A colder season raises heating demand; weak sunlight and rainfall hit solar and hydro output.", "Soğuk mevsim ısınma talebini artırır; zayıf güneş ve yağış güneş ve hidro üretimini düşürür.", "Raible et al. (2016)"],
    trade: ["Ash closes airspace and ports near the eruption; air freight is rerouted.", "Kül, patlama çevresinde hava sahasını ve limanları kapatır; hava kargo yön değiştirir.", "Robock (2000)"],
    food: ["Cooling and weaker monsoons cut harvests for one or two seasons; food prices climb.", "Soğuma ve zayıflayan muson 1–2 sezon hasadı düşürür; gıda fiyatı yükselir.", "FAO"],
    digital: ["Ash disturbs power and radio links near the eruption.", "Kül patlama çevresinde elektrik ve radyo bağlantılarını bozar.", "Robock (2000)"],
    macro: ["Food and energy costs raise inflation, insurance losses and public spending.", "Gıda ve enerji maliyeti enflasyonu, sigorta kaybını ve kamu harcamasını artırır.", "Raible et al. (2016)"],
  },
  "solar-g5": {
    energy: ["Induced currents can trip lines and damage transformers, mostly at high latitudes.", "İndüklenen akımlar özellikle yüksek enlemlerde hatları devre dışı bırakabilir, trafolara zarar verebilir.", "NOAA SWPC"],
    trade: ["Polar flights are diverted; satellite navigation errors slow shipping and logistics.", "Kutup uçuşları yön değiştirir; uydu seyrüsefer hataları denizcilik ve lojistiği yavaşlatır.", "NOAA SWPC"],
    food: ["Precision farming and cold chains suffer where power or GNSS fail.", "Elektrik veya GNSS kesilen yerlerde hassas tarım ve soğuk zincir aksar.", "Lloyd's / AER"],
    digital: ["GNSS positioning and timing, HF radio and some satellites degrade for days.", "GNSS konum ve zamanlaması, HF radyo ve bazı uydular günlerce bozulur.", "USGS Geomagnetism"],
    macro: ["Outages and satellite losses cost output and insurance payouts.", "Kesintiler ve uydu kayıpları üretim kaybı ve sigorta ödemesi doğurur.", "Lloyd's / AER"],
  },
};

export const SIM_UI = {
  live: t("LIVE", "CANLI"),
  simulate: t("SIMULATE", "SİMÜLE"),
  mode: t("Mode", "Mod"),
  shocks: t("Choose a shock", "Şok seç"),
  impact: t("Impact", "Etki"),
  peak: t("Peak", "Zirve"),
  day: t("Day", "Gün"),
  channels: t("5 channels", "5 kanal"),
  chain: t("Domino chain", "Domino zinciri"),
  most: t("Most affected", "En çok etkilenenler"),
  severity: t("Severity", "Şiddet"),
  time: t("Day (1–180)", "Gün (1–180)"),
  play: t("Play", "Oynat"),
  pause: t("Pause", "Durdur"),
  share: t("Share", "Paylaş"),
  copied: t("Copied", "Kopyalandı"),
  copyFailed: t("Link is in the address bar", "Bağlantı adres çubuğunda"),
  country: t("Country", "Ülke"),
  findCountry: t("Type a country…", "Ülke yaz…"),
  noCountry: t("No country matches", "Eşleşen ülke yok"),
  deepRead: t("Scientific background", "Bilimsel arka plan"),
  honesty: t("A deterministic dependency model: not a forecast, a simulation of structural vulnerability.", "Deterministik bağımlılık modeli — tahmin değil, yapısal kırılganlık simülasyonudur."),
  fallbackModel: t("C — regional / global spillover model (no country profile)", "C — bölgesel / küresel yansıma modeli (ülke profili yok)"),
  profileModel: t("B — country dependency profile", "B — ülke bağımlılık profili"),
  loading: t("Loading the map…", "Harita yükleniyor…"),
  simulateThis: t("Run impact simulation", "Etkiyi simüle et"),
  globalIndex: t("Global Impact Index", "Küresel Etki Endeksi"),
  pickHint: t("Click any country on the map to inspect its domino chain", "Domino zincirini görmek için haritada bir ülkeye tıkla"),
  clear: t("Global", "Küresel"),
  clearLabel: t("Clear the country and show the global overview", "Ülke seçimini kaldır ve küresel görünüme dön"),
  mapLabel: t("World map coloured by the simulated impact on each country. The country picker is the keyboard alternative.", "Ülkeleri simüle edilen etkiye göre renklendiren dünya haritası. Klavye için ülke seçiciyi kullan."),
  legend: t("Impact colours", "Etki renkleri"),
} as const;

export const HUB_UI = {
  simulations: t("Interactive Impact Simulations", "Etkileşimli Etki Simülasyonları"),
  open: t("Simulate on map", "Haritada simüle et"),
  atlases: t("Reference Atlases", "Başvuru Atlasları"),
  links: t("Causal Web", "Nedensellik Ağı"),
  nuclear: t("Nuclear", "Nükleer"),
  supervolcanoes: t("Supervolcanoes", "Süper volkanlar"),
  trajectory: t("Climate Trajectory", "İklim Gidişatı"),
  metrics: t("Live Counters", "Canlı Sayaçlar"),
} as const;

export const dayRange = (from: number, to: number): Bilingual =>
  from === to ? t(`Day ${from}`, `Gün ${from}`) : t(`Day ${from}–${to}`, `Gün ${from}–${to}`);
