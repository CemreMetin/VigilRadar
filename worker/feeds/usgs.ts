import type { MonitorEvent } from "../../lib/types";
import { fetchOpen } from "../http";

export const USGS_URL =
  "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson";

function quakeSeverity(mag: number): 0 | 1 | 2 | 3 | 4 {
  if (mag >= 7) return 4;
  if (mag >= 6) return 3;
  if (mag >= 5) return 2;
  return 1;
}

export async function usgsQuakes(): Promise<MonitorEvent[]> {
  const res = await fetchOpen(USGS_URL, 20_000);
  const json = (await res.json()) as {
    features: {
      id: string;
      properties: {
        mag: number | null;
        time: number;
        updated: number;
        url: string;
        title: string;
      };
      geometry: { coordinates: [number, number, number] };
    }[];
  };
  const events: MonitorEvent[] = [];
  for (const f of json.features) {
    const mag = f.properties.mag;
    if (mag == null) continue;
    const [lon, lat, depth] = f.geometry.coordinates;
    events.push({
      id: `usgs:${f.id}`,
      domain: "geophysical",
      kind: "quake",
      title: f.properties.title,
      severity: quakeSeverity(mag),
      magnitude: mag,
      depthKm: depth,
      lat,
      lon,
      countries: [],
      startedAt: new Date(f.properties.time).toISOString(),
      updatedAt: new Date(f.properties.updated).toISOString(),
      url: f.properties.url,
      source: {
        name: "USGS Earthquake Hazards Program",
        url: "https://earthquake.usgs.gov/",
        license: "Public domain (US Government work)",
      },
    });
  }
  return events;
}
