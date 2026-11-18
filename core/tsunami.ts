import { CONFIG } from "./config";
import { haversineKm } from "./geo";
import type { Province, QuakeEvent, TsunamiBulletin, TsunamiLevel } from "./types";

const HOUR = 3_600_000;
const RANK: Record<TsunamiLevel, number> = { info: 0, watch: 1, advisory: 2, warning: 3 };

const FIELD = (xml: string, tag: string) => xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`))?.[1]?.trim() ?? "";
const LEVEL_WORDS: [RegExp, TsunamiLevel][] = [[/warning/i, "warning"], [/advisory/i, "advisory"], [/watch/i, "watch"]];

/**
 * NTWC/PTWC Atom feed. The level comes from the "Category:" line of the summary; the free text of the summary
 * mentions all three words even in a plain information statement, so it is never searched. Without a category
 * the title is searched. Information and Threat map to `info`. A bad answer gives an empty list.
 */
export function parseTsunami(xml: string): TsunamiBulletin[] {
  try {
    return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].flatMap(([, e]) => {
      const title = FIELD(e, "title");
      const category = e.match(/<strong>Category:<\/strong>\s*([A-Za-z]+)/)?.[1] ?? title;
      const level = LEVEL_WORDS.find(([re]) => re.test(category))?.[1] ?? "info";
      const b = { level, title, timeMs: Date.parse(FIELD(e, "updated")), lat: Number(FIELD(e, "geo:lat")), lon: Number(FIELD(e, "geo:long")) };
      return [b.timeMs, b.lat, b.lon].every(Number.isFinite) ? [b] : [];
    });
  } catch { return []; }
}

/**
 * Turkey coastal rule (VIGIL.md 5.5), rule based and not an official warning: a shallow M6.5+ quake whose
 * epicentre is within 100 km of a coastal province centre. USGS tsunami=1 stands in for the magnitude/depth test.
 */
export function provinceTsunamiAdvice(p: Province, q: QuakeEvent): boolean {
  const r = CONFIG.tsunamiRuleTR;
  const strong = q.mag >= r.minMag && q.depthKm <= r.maxDepthKm;
  return p.coastal && (strong || q.usgsTsunami === true) && haversineKm(p, q) <= r.coastRadiusKm;
}

export function tsunamiAdviceProvinces(provinces: readonly Province[], q: QuakeEvent): string[] {
  return provinces.filter((p) => provinceTsunamiAdvice(p, q)).map((p) => p.code);
}

/** The strongest NTWC/PTWC bulletin of the last 24 hours that counts (watch or above). */
export function activeTsunami(bulletins: readonly TsunamiBulletin[], nowMs: number): TsunamiBulletin | null {
  const live = bulletins.filter((b) => RANK[b.level] > 0 && nowMs - b.timeMs <= 24 * HOUR);
  return live.sort((a, b) => RANK[b.level] - RANK[a.level] || b.timeMs - a.timeMs)[0] ?? null;
}
