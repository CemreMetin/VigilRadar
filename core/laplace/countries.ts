import { haversineKm } from "../geo";
import { CHANNEL_IDS, SHOCKS } from "./shocks";
import type { Bilingual, ChannelId, Country, CountryExposure, Region, ShockId } from "./types";

type Exposure = Partial<Record<ChannelId, number>>;
type TableShock = Exclude<ShockId, "solar-g5">; // the solar storm follows latitude, see solarExposure
const ORDER: readonly TableShock[] = ["hormuz", "suez", "taiwan", "redsea-cables", "blacksea", "panama", "volcano-vei7"];

/** "e t f d m" in percent, one string per shock in ORDER: energy, trade, food, digital, macro. */
function profile(iso3: string, mapName: string, tr: string, region: Region, lat: number, lon: number, rows: string[], en = mapName): CountryExposure {
  const shocks: CountryExposure["shocks"] = {};
  ORDER.forEach((id, i) => {
    const n = rows[i].split(" ").map((v) => Number(v) / 100);
    shocks[id] = Object.fromEntries(CHANNEL_IDS.map((c, j) => [c, n[j]])) as Exposure;
  });
  return { iso3, mapName, name: { en, tr }, region, lat, lon, shocks };
}

// Structural dependency vectors of 44 key economies. They are calibrated judgements from public trade and energy
// statistics (EIA, UN Comtrade, FAO, TeleGeography), shown in the interface as evidence B, never as measurements.
//                                                               hormuz            suez              taiwan            redsea cables     blacksea          panama            volcano VEI7
const TABLE: CountryExposure[] = [
  profile("TUR", "Turkey", "Türkiye", "mena", 39.0, 35.2,                       ["60 45 45 5 70",  "45 78 40 5 60",  "10 40 5 55 40",  "5 35 5 45 30",   "70 70 78 5 65",  "5 10 10 0 8",    "30 25 55 15 45"], "Türkiye"),
  profile("USA", "United States of America", "ABD", "north-america", 39.8, -98.6, ["25 25 15 5 30",  "10 25 5 5 20",   "15 75 10 88 80", "2 8 0 20 12",    "10 8 6 2 18",    "50 75 55 2 40",  "35 35 45 15 40"], "United States"),
  profile("CHN", "China", "Çin", "east-asia", 35.0, 104.0,                      ["85 65 45 10 65", "25 60 20 5 40",  "20 90 20 92 85", "5 20 0 25 15",   "20 25 25 2 20",  "20 30 30 0 20",  "45 45 75 20 55"]),
  profile("DEU", "Germany", "Almanya", "europe", 51.1, 10.4,                    ["40 35 20 5 45",  "35 75 20 5 55",  "10 70 5 75 65",  "5 30 0 40 25",   "35 25 20 2 30",  "5 15 8 0 12",    "40 30 40 15 40"]),
  profile("JPN", "Japan", "Japonya", "east-asia", 36.5, 138.5,                  ["97 70 45 10 85", "20 40 15 5 30",  "30 85 20 90 82", "2 10 0 20 10",   "15 15 20 0 15",  "30 40 35 0 25",  "45 50 65 20 50"]),
  profile("KOR", "South Korea", "Güney Kore", "east-asia", 36.4, 127.9,         ["95 70 40 10 82", "15 40 10 5 30",  "30 88 15 85 82", "2 10 0 18 10",   "20 20 30 0 20",  "35 40 40 0 25",  "40 50 65 20 50"]),
  profile("IND", "India", "Hindistan", "south-asia", 22.0, 79.0,                ["85 55 65 10 75", "30 55 25 5 40",  "10 55 10 60 45", "10 40 5 75 40",  "30 20 35 2 25",  "5 8 5 0 6",      "40 40 85 15 60"]),
  profile("GBR", "United Kingdom", "Birleşik Krallık", "europe", 54.0, -2.5,    ["30 30 25 5 40",  "30 60 30 5 45",  "5 50 5 65 50",   "5 30 0 40 30",   "20 15 20 2 25",  "5 12 8 0 10",    "35 35 40 20 40"]),
  profile("FRA", "France", "Fransa", "europe", 46.6, 2.4,                       ["35 30 15 5 40",  "30 62 20 5 45",  "5 50 5 60 45",   "5 28 0 40 22",   "25 15 12 2 25",  "5 12 8 0 8",     "30 30 38 15 35"]),
  profile("ITA", "Italy", "İtalya", "europe", 42.8, 12.6,                       ["55 45 25 5 55",  "55 85 35 5 65",  "10 45 5 55 45",  "8 38 0 50 28",   "45 35 40 2 40",  "5 8 5 0 6",      "35 28 40 15 40"]),
  profile("ESP", "Spain", "İspanya", "europe", 40.2, -3.6,                      ["35 30 20 5 40",  "30 55 25 5 40",  "5 40 5 50 40",   "5 20 0 30 18",   "25 25 45 2 30",  "10 15 15 0 10",  "28 25 38 15 35"]),
  profile("NLD", "Netherlands", "Hollanda", "europe", 52.2, 5.3,                ["40 45 20 5 45",  "35 78 30 5 50",  "10 70 5 65 55",  "5 30 0 35 25",   "30 35 35 2 28",  "8 20 15 0 12",   "35 35 38 18 40"]),
  profile("POL", "Poland", "Polonya", "europe", 52.1, 19.4,                     ["30 20 15 5 35",  "15 40 10 5 28",  "5 45 5 45 38",   "3 15 0 22 15",   "35 25 15 2 35",  "2 5 3 0 5",      "40 25 38 12 38"]),
  profile("SWE", "Sweden", "İsveç", "europe", 62.0, 15.0,                       ["15 20 12 5 28",  "12 40 10 5 25",  "5 45 5 55 38",   "3 15 0 22 12",   "12 12 10 2 18",  "2 8 5 0 5",      "40 25 35 15 32"]),
  profile("NOR", "Norway", "Norveç", "europe", 61.0, 9.0,                       ["5 15 12 5 18",   "10 30 10 5 18",  "5 35 5 50 28",   "3 12 0 20 10",   "5 10 10 2 12",   "2 8 5 0 5",      "40 30 35 18 30"]),
  profile("FIN", "Finland", "Finlandiya", "europe", 64.0, 26.0,                 ["15 20 15 5 28",  "12 38 10 5 25",  "5 45 5 50 38",   "3 15 0 22 12",   "20 18 15 2 25",  "2 5 3 0 5",      "42 25 40 15 32"]),
  profile("CAN", "Canada", "Kanada", "north-america", 56.1, -106.3,             ["8 15 8 5 25",    "5 15 5 5 15",    "5 50 5 60 45",   "1 5 0 12 8",     "3 5 5 2 12",     "8 20 12 0 15",   "45 30 45 15 35"]),
  profile("MEX", "Mexico", "Meksika", "latam", 23.6, -102.5,                    ["15 15 20 5 28",  "5 10 5 5 12",    "5 55 5 55 45",   "1 5 0 10 6",     "10 8 15 2 18",   "15 35 25 0 22",  "20 20 40 10 30"]),
  profile("BRA", "Brazil", "Brezilya", "latam", -10.8, -53.0,                   ["20 15 40 5 25",  "5 15 20 5 12",   "5 40 5 45 35",   "1 5 0 10 6",     "25 15 8 2 20",   "5 15 10 0 8",    "15 20 30 10 25"]),
  profile("ARG", "Argentina", "Arjantin", "latam", -35.4, -65.2,                ["10 10 25 5 18",  "5 12 10 5 10",   "5 35 5 35 28",   "1 4 0 8 5",      "10 8 8 2 12",    "3 12 8 0 8",     "20 18 30 10 25"]),
  profile("RUS", "Russia", "Rusya", "eurasia", 61.5, 96.0,                      ["5 15 10 5 18",   "30 35 10 5 25",  "5 40 5 45 30",   "3 10 0 18 10",   "55 65 20 5 50",  "2 5 3 0 3",      "45 25 55 12 35"]),
  profile("UKR", "Ukraine", "Ukrayna", "europe", 49.0, 31.4,                    ["30 20 20 5 35",  "15 35 10 5 22",  "5 30 5 30 25",   "2 10 0 15 10",   "60 95 40 5 80",  "2 5 3 0 3",      "45 25 50 12 40"]),
  profile("EGY", "Egypt", "Mısır", "mena", 26.8, 30.0,                          ["25 35 45 5 45",  "35 95 55 5 90",  "5 35 5 40 28",   "10 45 5 85 45",  "35 55 95 5 75",  "3 5 8 0 5",      "20 25 70 10 50"]),
  profile("SAU", "Saudi Arabia", "Suudi Arabistan", "mena", 24.0, 45.0,         ["55 75 50 10 65", "20 45 35 5 28",  "5 35 5 40 25",   "10 30 5 60 28",  "5 20 40 2 18",   "2 5 5 0 3",      "10 20 45 10 25"]),
  profile("IRN", "Iran", "İran", "mena", 32.4, 54.3,                            ["80 90 60 15 85", "10 20 15 5 18",  "5 30 5 35 25",   "3 12 0 20 10",   "10 25 45 2 30",  "1 2 2 0 2",      "30 20 60 8 40"]),
  profile("ARE", "United Arab Emirates", "Birleşik Arap Emirlikleri", "mena", 24.0, 54.0, ["60 88 55 15 70", "20 55 35 5 30", "10 50 5 55 38", "10 35 5 65 32", "5 20 35 2 18", "2 8 5 0 5", "15 35 45 20 35"]),
  profile("QAT", "Qatar", "Katar", "mena", 25.3, 51.2,                          ["95 95 70 15 90", "40 40 35 5 40",  "5 35 5 45 28",   "10 30 5 55 28",  "3 15 30 2 12",   "5 8 5 0 5",      "10 30 45 18 32"]),
  profile("IRQ", "Iraq", "Irak", "mena", 33.0, 43.7,                            ["92 75 50 10 90", "10 25 30 5 18",  "3 25 3 30 20",   "3 12 0 25 10",   "10 20 45 2 28",  "1 2 3 0 2",      "20 18 60 8 38"]),
  profile("ISR", "Israel", "İsrail", "mena", 31.4, 35.0,                        ["25 25 20 5 35",  "25 55 30 5 35",  "10 55 5 65 48",  "8 30 0 45 22",   "25 25 45 2 25",  "2 8 8 0 5",      "18 25 40 18 30"]),
  profile("LBN", "Lebanon", "Lübnan", "mena", 33.9, 35.9,                       ["35 30 45 5 55",  "25 55 55 5 50",  "3 25 3 30 22",   "5 22 5 40 20",   "35 50 98 5 75",  "1 3 3 0 3",      "20 20 65 8 45"]),
  profile("TUN", "Tunisia", "Tunus", "africa", 34.0, 9.6,                       ["30 25 35 5 45",  "20 45 35 5 35",  "3 25 3 30 22",   "5 20 0 30 18",   "35 40 80 5 60",  "1 3 5 0 3",      "20 18 65 8 40"]),
  profile("MAR", "Morocco", "Fas", "africa", 31.8, -7.1,                        ["35 25 30 5 42",  "15 35 25 5 25",  "3 25 3 30 22",   "3 12 0 18 10",   "30 30 55 2 40",  "2 5 8 0 5",      "20 18 55 8 35"]),
  profile("ZAF", "South Africa", "Güney Afrika", "africa", -29.0, 25.0,         ["50 25 30 5 42",  "5 25 10 5 15",   "5 40 5 45 35",   "3 10 0 20 10",   "15 15 30 2 22",  "2 8 5 0 5",      "20 22 40 10 30"]),
  profile("NGA", "Nigeria", "Nijerya", "africa", 9.1, 8.7,                      ["25 20 45 5 35",  "10 25 20 5 18",  "3 30 3 30 22",   "2 8 0 15 8",     "15 18 55 2 35",  "1 3 3 0 3",      "12 15 60 8 38"]),
  profile("KEN", "Kenya", "Kenya", "africa", 0.2, 37.9,                         ["60 35 45 5 55",  "20 45 30 5 32",  "3 30 3 30 22",   "5 35 5 70 30",   "20 25 65 2 40",  "1 3 3 0 3",      "12 20 65 10 40"]),
  profile("PAK", "Pakistan", "Pakistan", "south-asia", 30.4, 69.3,              ["88 55 60 10 78", "15 35 25 5 25",  "3 35 3 40 28",   "10 30 5 65 28",  "20 20 55 2 35",  "1 3 3 0 3",      "30 25 78 10 52"]),
  profile("IDN", "Indonesia", "Endonezya", "se-asia", -2.5, 118.0,              ["45 30 35 5 40",  "5 20 15 5 15",   "10 55 5 55 45",  "3 10 0 20 10",   "10 10 40 2 18",  "2 8 8 0 5",      "55 90 90 60 85"]),
  profile("MYS", "Malaysia", "Malezya", "se-asia", 4.2, 102.0,                  ["30 35 30 5 35",  "10 40 15 5 22",  "15 75 5 65 60",  "5 15 0 28 14",   "8 10 25 2 15",   "3 10 8 0 6",     "35 65 65 40 55"]),
  profile("THA", "Thailand", "Tayland", "se-asia", 15.1, 101.0,                 ["70 40 30 5 60",  "10 38 15 5 22",  "10 65 5 60 52",  "3 12 0 22 12",   "10 10 25 2 15",  "3 8 8 0 5",      "35 50 70 30 50"]),
  profile("VNM", "Vietnam", "Vietnam", "se-asia", 16.2, 107.8,                  ["35 30 25 5 40",  "15 45 15 5 28",  "10 80 5 70 65",  "3 12 0 22 12",   "8 10 20 2 15",   "8 20 15 0 12",   "35 45 70 25 50"]),
  profile("TWN", "Taiwan", "Tayvan", "east-asia", 23.7, 121.0,                  ["75 50 30 8 65",  "15 40 10 5 28",  "90 98 55 98 96", "2 10 0 20 10",   "10 12 20 0 14",  "20 30 25 0 18",  "40 50 60 20 50"]),
  profile("AUS", "Australia", "Avustralya", "oceania", -25.7, 134.5,            ["35 25 15 5 28",  "8 22 5 5 15",    "10 55 5 60 45",  "3 10 0 20 10",   "5 5 5 2 10",     "3 8 5 0 5",      "30 65 55 35 45"]),
  profile("NZL", "New Zealand", "Yeni Zelanda", "oceania", -41.8, 172.8,        ["30 22 12 5 25",  "6 20 5 5 12",    "8 50 5 50 38",   "1 5 0 10 5",     "5 5 8 2 10",     "5 12 8 0 8",     "25 45 40 25 35"]),
  profile("CHL", "Chile", "Şili", "latam", -35.7, -71.5,                        ["20 15 15 5 25",  "5 12 5 5 10",    "5 45 5 40 35",   "1 4 0 8 5",      "8 8 10 2 12",    "20 45 25 0 22",  "18 18 28 8 22"]),
];

type Note = [string, ShockId, string, string, string]; // iso3, shock, English, Turkish, source
// Documented structural facts. Where one exists it opens the domino chain and carries evidence A.
const NOTES: Note[] = [
  ["JPN", "hormuz", "Japan buys more than 80% of its crude oil from the Middle East, most of it shipped through Hormuz.", "Japonya ham petrolünün %80'den fazlasını Orta Doğu'dan alır; çoğu Hürmüz'den geçer.", "EIA"],
  ["KOR", "hormuz", "South Korea buys most of its crude oil from Gulf producers that ship through Hormuz.", "Güney Kore ham petrolünün çoğunu Hürmüz'den sevkiyat yapan Körfez üreticilerinden alır.", "EIA"],
  ["IND", "hormuz", "India imports most of its crude oil, and a large share of it, with much of its LNG, comes through Hormuz.", "Hindistan ham petrolünün çoğunu ithal eder; bunun ve LNG'sinin büyük bölümü Hürmüz'den gelir.", "EIA"],
  ["QAT", "hormuz", "Nearly all of Qatar's LNG exports leave through Hormuz; there is no other sea route.", "Katar'ın LNG ihracatının neredeyse tamamı Hürmüz'den çıkar; başka deniz yolu yoktur.", "EIA"],
  ["IRQ", "hormuz", "Iraq ships most of its crude from Basra terminals, through Hormuz.", "Irak ham petrolünün çoğunu Basra terminallerinden, Hürmüz üzerinden sevk eder.", "EIA"],
  ["EGY", "suez", "Suez Canal fees are one of Egypt's main sources of foreign currency (about $9 billion in 2022/23).", "Süveyş Kanalı gelirleri Mısır'ın başlıca döviz kaynaklarından biridir (2022/23'te yaklaşık 9 milyar dolar).", "UNCTAD"],
  ["TWN", "taiwan", "Taiwan makes most of the world's most advanced logic chips; a blockade or damage stops that supply at the source.", "Dünyanın en ileri mantık çiplerinin çoğu Tayvan'da üretilir; abluka veya hasar bu arzı kaynağında keser.", "SIA"],
  ["USA", "taiwan", "Many chips designed by US firms are manufactured in Taiwan.", "ABD şirketlerinin tasarladığı birçok çip Tayvan'da üretilir.", "SIA"],
  ["EGY", "redsea-cables", "The fibre cables between Europe and Asia cross Egypt between the Red Sea and the Mediterranean.", "Avrupa ile Asya arasındaki fiber kablolar Kızıldeniz'den Akdeniz'e Mısır üzerinden geçer.", "TeleGeography"],
  ["EGY", "blacksea", "Egypt is one of the largest wheat importers, and Russia and Ukraine have supplied most of those imports.", "Mısır en büyük buğday ithalatçılarından biridir; bu ithalatın çoğunu Rusya ve Ukrayna sağlamıştır.", "FAO"],
  ["LBN", "blacksea", "Before 2022 Lebanon bought most of its wheat from Ukraine and Russia.", "Lübnan 2022 öncesinde buğdayının çoğunu Ukrayna ve Rusya'dan alıyordu.", "FAO"],
  ["TUR", "blacksea", "Türkiye is a major buyer of Black Sea wheat and sunflower oil, and the export route runs through the Bosporus.", "Türkiye Karadeniz buğdayı ve ayçiçek yağının büyük alıcısıdır; ihracat yolu İstanbul Boğazı'ndan geçer.", "UN Comtrade"],
  ["USA", "panama", "Much of the container trade between Asia and the US East Coast uses the Panama Canal.", "Asya ile ABD Doğu Kıyısı arasındaki konteyner ticaretinin büyük bölümü Panama Kanalı'nı kullanır.", "Panama Canal Authority"],
  ["IDN", "volcano-vei7", "Tambora is in Indonesia: the 1815 eruption destroyed villages and harvests on Sumbawa and Lombok.", "Tambora Endonezya'dadır: 1815 patlaması Sumbawa ve Lombok'ta köyleri ve hasadı yok etti.", "Raible et al. (2016)"],
  ["CAN", "solar-g5", "The March 1989 geomagnetic storm blacked out Québec for about nine hours.", "Mart 1989 jeomanyetik fırtınası Québec'i yaklaşık dokuz saat elektriksiz bıraktı.", "USGS Geomagnetism"],
];
for (const [iso3, shock, en, tr, source] of NOTES) {
  const c = TABLE.find((x) => x.iso3 === iso3)!;
  (c.notes ??= {})[shock] = { en, tr, source };
}

export const PROFILES: readonly CountryExposure[] = TABLE;

// The other 132 features of world.json: map name | ISO alpha-3 | ISO alpha-2 | region. world.json carries names only.
const OTHERS = `Afghanistan|AFG|AF|south-asia;Albania|ALB|AL|europe;Algeria|DZA|DZ|africa;Angola|AGO|AO|africa;Armenia|ARM|AM|eurasia;Austria|AUT|AT|europe;Azerbaijan|AZE|AZ|eurasia;Bahamas|BHS|BS|latam;Bangladesh|BGD|BD|south-asia;Belarus|BLR|BY|europe;Belgium|BEL|BE|europe;Belize|BLZ|BZ|latam;Benin|BEN|BJ|africa;Bhutan|BTN|BT|south-asia;Bolivia|BOL|BO|latam;Bosnia and Herz.|BIH|BA|europe;Botswana|BWA|BW|africa;Brunei|BRN|BN|se-asia;Bulgaria|BGR|BG|europe;Burkina Faso|BFA|BF|africa;Burundi|BDI|BI|africa;Cambodia|KHM|KH|se-asia;Cameroon|CMR|CM|africa;Central African Rep.|CAF|CF|africa;Chad|TCD|TD|africa;Colombia|COL|CO|latam;Congo|COG|CG|africa;Costa Rica|CRI|CR|latam;Croatia|HRV|HR|europe;Cuba|CUB|CU|latam;Cyprus|CYP|CY|europe;Czechia|CZE|CZ|europe;Côte d'Ivoire|CIV|CI|africa;Dem. Rep. Congo|COD|CD|africa;Denmark|DNK|DK|europe;Djibouti|DJI|DJ|africa;Dominican Rep.|DOM|DO|latam;Ecuador|ECU|EC|latam;El Salvador|SLV|SV|latam;Eq. Guinea|GNQ|GQ|africa;Eritrea|ERI|ER|africa;Estonia|EST|EE|europe;Ethiopia|ETH|ET|africa;Falkland Is.|FLK|FK|latam;Fiji|FJI|FJ|oceania;Fr. S. Antarctic Lands|ATF|TF|oceania;Gabon|GAB|GA|africa;Gambia|GMB|GM|africa;Georgia|GEO|GE|eurasia;Ghana|GHA|GH|africa;Greece|GRC|GR|europe;Greenland|GRL|GL|north-america;Guatemala|GTM|GT|latam;Guinea|GIN|GN|africa;Guinea-Bissau|GNB|GW|africa;Guyana|GUY|GY|latam;Haiti|HTI|HT|latam;Honduras|HND|HN|latam;Hungary|HUN|HU|europe;Iceland|ISL|IS|europe;Ireland|IRL|IE|europe;Jamaica|JAM|JM|latam;Jordan|JOR|JO|mena;Kazakhstan|KAZ|KZ|eurasia;Kosovo|XKX|XK|europe;Kuwait|KWT|KW|mena;Kyrgyzstan|KGZ|KG|eurasia;Laos|LAO|LA|se-asia;Latvia|LVA|LV|europe;Lesotho|LSO|LS|africa;Liberia|LBR|LR|africa;Libya|LBY|LY|mena;Lithuania|LTU|LT|europe;Luxembourg|LUX|LU|europe;Macedonia|MKD|MK|europe;Madagascar|MDG|MG|africa;Malawi|MWI|MW|africa;Mali|MLI|ML|africa;Mauritania|MRT|MR|africa;Moldova|MDA|MD|europe;Mongolia|MNG|MN|east-asia;Montenegro|MNE|ME|europe;Mozambique|MOZ|MZ|africa;Myanmar|MMR|MM|se-asia;N. Cyprus|XNC||mena;Namibia|NAM|NA|africa;Nepal|NPL|NP|south-asia;New Caledonia|NCL|NC|oceania;Nicaragua|NIC|NI|latam;Niger|NER|NE|africa;North Korea|PRK|KP|east-asia;Oman|OMN|OM|mena;Palestine|PSE|PS|mena;Panama|PAN|PA|latam;Papua New Guinea|PNG|PG|oceania;Paraguay|PRY|PY|latam;Peru|PER|PE|latam;Philippines|PHL|PH|se-asia;Portugal|PRT|PT|europe;Puerto Rico|PRI|PR|latam;Romania|ROU|RO|europe;Rwanda|RWA|RW|africa;S. Sudan|SSD|SS|africa;Senegal|SEN|SN|africa;Serbia|SRB|RS|europe;Sierra Leone|SLE|SL|africa;Slovakia|SVK|SK|europe;Slovenia|SVN|SI|europe;Solomon Is.|SLB|SB|oceania;Somalia|SOM|SO|africa;Somaliland|XSL||africa;Sri Lanka|LKA|LK|south-asia;Sudan|SDN|SD|africa;Suriname|SUR|SR|latam;Switzerland|CHE|CH|europe;Syria|SYR|SY|mena;Tajikistan|TJK|TJ|eurasia;Tanzania|TZA|TZ|africa;Timor-Leste|TLS|TL|se-asia;Togo|TGO|TG|africa;Trinidad and Tobago|TTO|TT|latam;Turkmenistan|TKM|TM|eurasia;Uganda|UGA|UG|africa;Uruguay|URY|UY|latam;Uzbekistan|UZB|UZ|eurasia;Vanuatu|VUT|VU|oceania;Venezuela|VEN|VE|latam;W. Sahara|ESH|EH|africa;Yemen|YEM|YE|mena;Zambia|ZMB|ZM|africa;Zimbabwe|ZWE|ZW|africa;eSwatini|SWZ|SZ|africa`;
// Names Intl has no region code for
const OWN_NAMES: Record<string, Bilingual> = { XNC: { en: "N. Cyprus", tr: "Kuzey Kıbrıs" }, XSL: { en: "Somaliland", tr: "Somaliland" } };

function localName(iso3: string, iso2: string, mapName: string): Bilingual {
  if (OWN_NAMES[iso3]) return OWN_NAMES[iso3];
  const of = (lang: string) => { try { return new Intl.DisplayNames([lang], { type: "region" }).of(iso2) ?? mapName; } catch { return mapName; } };
  return { en: of("en"), tr: of("tr") };
}

export interface WorldFeature { properties: { name: string }; geometry: { type: string; coordinates: unknown } }
/** The part of public/data/country_profiles.json the fallback model reads. */
export interface CountryFacts { lat?: number; lon?: number; hunger?: { value: number } | null; water?: { value: number } | null }
export type CountryFactsFile = { countries: Record<string, CountryFacts> };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Centre of the bounding box of the largest part, so overseas territories do not move the point into the sea. */
export function centroid(geometry: WorldFeature["geometry"]): { lat: number; lon: number } {
  const polygons = (geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates) as [number, number][][][];
  let best = { area: -1, lat: 0, lon: 0 };
  for (const [ring] of polygons) {
    let w = Infinity, e = -Infinity, s = Infinity, n = -Infinity;
    for (const [x, y] of ring) { w = Math.min(w, x); e = Math.max(e, x); s = Math.min(s, y); n = Math.max(n, y); }
    const area = (e - w) * (n - s);
    if (area > best.area) best = { area, lat: (s + n) / 2, lon: ((((w + e) / 2 + 180) % 360) + 360) % 360 - 180 };
  }
  return { lat: best.lat, lon: best.lon };
}

/** Geomagnetically induced currents grow towards the poles (|latitude| 35 to 65 degrees). */
export function solarExposure(lat: number): Record<ChannelId, number> {
  const f = clamp((Math.abs(lat) - 35) / 30, 0.1, 1);
  return { energy: f, trade: 0.2 + 0.5 * f, food: 0.05 + 0.15 * f, digital: 0.35 + 0.55 * f, macro: 0.2 + 0.5 * f };
}

const NEAR_KM = 2500;
const NEAR_BONUS = 0.35;

/** The universal model for a country without a profile: global spillover, hunger and water stress, distance to the shock. */
function fallbackShocks(at: { lat: number; lon: number }, facts: CountryFacts | undefined): CountryExposure["shocks"] {
  const hunger = facts?.hunger?.value ?? 0;
  const foodExtra = (hunger > 10 ? Math.min(0.25, (hunger - 10) / 60) : 0) + ((facts?.water?.value ?? 0) > 40 ? 0.05 : 0);
  return Object.fromEntries(SHOCKS.map((s) => {
    if (s.id === "solar-g5") return [s.id, solarExposure(at.lat)];
    const near = NEAR_BONUS * Math.max(0, 1 - haversineKm(at, s) / NEAR_KM);
    const e = Object.fromEntries(CHANNEL_IDS.map((c) => {
      const base = (s.globalSpillover[c] ?? 0) + near * s.channels[c].weight;
      return [c, clamp(base + (c === "food" && base > 0 ? foodExtra : 0), 0, 1)];
    }));
    return [s.id, e];
  }));
}

/**
 * Every country on the map: the profiles plus the fallback for the rest. `facts` (country_profiles.json) is loaded
 * lazily in the browser; without it the fallback uses the map geometry and no hunger or water figures.
 */
export function buildCountries(world: { features: WorldFeature[] }, facts: CountryFactsFile | null): Country[] {
  const profiles = new Map(PROFILES.map((p) => [p.mapName, p]));
  const others = new Map(OTHERS.split(";").map((row) => { const [mapName, iso3, iso2, region] = row.split("|"); return [mapName, { iso3, iso2, region: region as Region }]; }));
  return world.features.flatMap((f): Country[] => {
    const mapName = f.properties.name;
    const p = profiles.get(mapName);
    if (p) return [{ ...p, profiled: true, shocks: { ...p.shocks, "solar-g5": solarExposure(p.lat) } }];
    const o = others.get(mapName);
    if (!o) return [];
    const own = facts?.countries[o.iso3];
    const at = own && Number.isFinite(own.lat) && Number.isFinite(own.lon) ? { lat: own.lat!, lon: own.lon! } : centroid(f.geometry);
    return [{ iso3: o.iso3, mapName, name: localName(o.iso3, o.iso2, mapName), region: o.region, ...at, profiled: false, shocks: fallbackShocks(at, own) }];
  });
}
