import type { Counter, CounterRow, Tone } from "../../lib/types";
import { fetchOpen } from "../http";

const BASE = "https://services9.arcgis.com/weJ1QsnbMYJlCHdG/arcgis/rest/services/Daily_Chokepoints_Data/FeatureServer/0/query";

// IMF PortWatch chokepoint ids (see PortWatch_chokepoints_database).
const CHOKEPOINTS: Record<string, string> = {
  chokepoint1: "Suez Canal",
  chokepoint2: "Panama Canal",
  chokepoint3: "Bosporus Strait",
  chokepoint4: "Bab el-Mandeb Strait",
  chokepoint5: "Malacca Strait",
  chokepoint6: "Strait of Hormuz",
  chokepoint7: "Cape of Good Hope",
  chokepoint8: "Gibraltar Strait",
  chokepoint9: "Dover Strait",
  chokepoint11: "Taiwan Strait",
};

const DISRUPTED_BELOW = -25; // % vs trailing 12-month mean

function fmtPct(p: number): string {
  const r = Math.round(p);
  return r === 0 ? "0%" : `${r > 0 ? "+" : "−"}${Math.abs(r)}%`;
}

type Attr = { date: string | number; portid: string; n_total: number };

function dayKey(d: string | number): string {
  return typeof d === "number" ? new Date(d).toISOString().slice(0, 10) : String(d).slice(0, 10);
}

async function fetchAll(): Promise<Attr[]> {
  const since = new Date(Date.now() - 430 * 86_400_000).toISOString().slice(0, 10);
  const ids = Object.keys(CHOKEPOINTS).map((i) => `'${i}'`).join(",");
  const out: Attr[] = [];
  // The server caps a page at its own maxRecordCount (1000 today), so page until it says
  // there is no more (exceededTransferLimit) rather than assuming a page size.
  for (let offset = 0; offset < 20_000; ) {
    const params = new URLSearchParams({
      where: `portid IN (${ids}) AND date >= '${since}'`,
      outFields: "date,portid,n_total",
      returnGeometry: "false",
      orderByFields: "date ASC",
      resultOffset: String(offset),
      resultRecordCount: "1000",
      f: "json",
    });
    const res = await fetchOpen(`${BASE}?${params}`);
    const json = (await res.json()) as {
      features?: { attributes: Attr }[];
      exceededTransferLimit?: boolean;
      error?: { message: string };
    };
    if (json.error) throw new Error(json.error.message);
    const batch = json.features ?? [];
    out.push(...batch.map((f) => f.attributes));
    offset += batch.length;
    if (batch.length === 0 || !json.exceededTransferLimit) break;
  }
  return out;
}

export async function portwatchCounter(): Promise<Counter[]> {
  const data = await fetchAll();
  if (data.length === 0) throw new Error("no PortWatch rows");

  const byPort = new Map<string, { d: string; n: number }[]>();
  for (const r of data) {
    if (r.n_total == null) continue;
    const list = byPort.get(r.portid) ?? [];
    list.push({ d: dayKey(r.date), n: r.n_total });
    byPort.set(r.portid, list);
  }

  const results: { name: string; pct: number }[] = [];
  let asOf = "";
  for (const [id, name] of Object.entries(CHOKEPOINTS)) {
    const list = (byPort.get(id) ?? []).sort((a, b) => a.d.localeCompare(b.d));
    if (list.length < 120) continue;
    const recent = list.slice(-7);
    const base = list.slice(0, -7).slice(-365);
    const mean = (a: { n: number }[]) => a.reduce((s, x) => s + x.n, 0) / a.length;
    const baseMean = mean(base);
    if (baseMean <= 0) continue;
    results.push({ name, pct: ((mean(recent) - baseMean) / baseMean) * 100 });
    const lastDay = list[list.length - 1].d;
    if (lastDay > asOf) asOf = lastDay;
  }
  if (results.length === 0) throw new Error("not enough PortWatch history");

  results.sort((a, b) => a.pct - b.pct);
  const disrupted = results.filter((r) => r.pct <= DISRUPTED_BELOW).length;
  const tone: Tone = disrupted >= 3 ? "high" : disrupted >= 1 ? "elevated" : "normal";
  const rows: CounterRow[] = results.map((r) => ({
    label: r.name,
    value: fmtPct(r.pct),
    tone: r.pct <= DISRUPTED_BELOW ? "high" : r.pct <= -10 ? "elevated" : "normal",
  }));

  return [
    {
      id: "chokepoints",
      label: "Shipping chokepoints",
      domain: "conflict",
      value: `${disrupted}/${results.length}`,
      numeric: disrupted,
      unit: `below ${DISRUPTED_BELOW}% of normal`,
      tone,
      trendLabel: `Lowest: ${results[0].name} ${fmtPct(results[0].pct)}`,
      note: `Average daily ship transits over the last 7 days vs the average of the previous 12 months, per chokepoint. A drop can come from war, weather, drought (Panama), or rerouting; it does not say why. PortWatch publishes with a delay of several days.`,
      asOf,
      cadence: "weekly (source lags ~days)",
      source: {
        name: "IMF PortWatch (with Oxford University)",
        url: "https://portwatch.imf.org/",
        license: "Open data with attribution; verify terms before redistributing raw data",
      },
      rows,
    },
  ];
}
