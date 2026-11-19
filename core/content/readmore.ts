// "Daha fazla oku" bridge (VIGIL.md Faz 8): the one /library page that fits an event, or nothing.
// The ids are the scenario ids of data/scenarios.ts. Only real fits are listed: there is no page for a quake elsewhere,
// for conflict, for chokepoints or for a nuclear plant link, so those cards show no link.
type L = { tr: string; en: string };
export interface ReadMore { id: string; title: L; box: { south: number; north: number; west: number; east: number } }

export const READ_MORE: ReadMore[] = [
  { id: "marmara", title: { tr: "Marmara'da büyük bir deprem", en: "A large earthquake near Istanbul (Marmara)" }, box: { south: 39.8, north: 41.4, west: 26.0, east: 31.0 } },
  { id: "cascadia", title: { tr: "Cascadia deprem ve tsunami senaryosu", en: "Cascadia earthquake and tsunami scenario" }, box: { south: 40.0, north: 51.0, west: -130.0, east: -121.0 } },
];

export const readMoreFor = (lat: number, lon: number): ReadMore | null =>
  READ_MORE.find((r) => lat >= r.box.south && lat <= r.box.north && lon >= r.box.west && lon <= r.box.east) ?? null;
