// Every threshold of the core logic lives here (VIGIL.md 5.1). No numbers elsewhere.
export const CONFIG = {
  quake: {
    globalMinMag: 5.0, // lower bound on the global map
    trMinMag: 4.0, // lower bound inside the Turkey box
    trBox: { minLat: 34, maxLat: 43, minLon: 24, maxLon: 46 },
    keepDays: 7,
    merge: { maxDtSec: 60, maxDistKm: 150 },
    sourcePriorityTR: ["afad", "kandilli", "emsc", "usgs"],
    sourcePriorityWorld: ["usgs", "emsc", "afad", "kandilli"],
  },
  // [minMag, P0 km, P1 km, P2 km]: hypocentral distance; null = no such level
  severityTable: [
    [4.0, null, null, 30],
    [4.5, null, 15, 60],
    [5.0, null, 40, 120],
    [5.5, 15, 80, 200],
    [6.0, 40, 100, 300],
    [6.5, 80, 150, 500],
    [7.0, 150, 250, 800],
    [7.5, 250, 350, 1000],
  ],
  provinceExtentKm: 25, // subtracted from the distance to the province centre (floor 0)
  // [minMag, plant link radius km]: epicentre distance
  plantLinkTable: [[5.0, 25], [5.5, 50], [6.0, 100], [6.5, 150], [7.0, 250], [7.5, 400]],
  chokepointQuake: { minMag: 6.5, radiusKm: 150 },
  conflict: {
    rootCodes: ["19", "20"], extraBaseCodes: ["183"],
    geoTypes: [3, 4], // city-level locations only
    cellDeg: 0.5, windowHours: 24,
    minEvents: 3, minDistinctDomains: 3,
    plantRadiusKm: 50, chokepointRadiusKm: 150,
    ttlHours: 48,
  },
  chokepoint: { recentDays: 7, baselineDays: 90, deviation: -0.25, severe: -0.5, staleDays: 10 },
  status: {
    quakeWindowHours: 24, pagerWindowHours: 72,
    elevatedMag: 6.5, criticalMag: 7.5, criticalMaxDepthKm: 70,
    chronicDays: 7,
  },
  tsunamiRuleTR: { minMag: 6.5, maxDepthKm: 70, coastRadiusKm: 100 },
  stale: { fastMinutes: 15, conflictHours: 3 },
  notify: {
    p0ConfirmSources: 2, p0SingleSourceWaitSec: 90,
    p1CooldownMin: 30, updateMagDelta: 0.3,
    globalChannel: { minMag: 7.0, maxDepthKm: 100 },
    pushBatch: 20, pushTtlSec: 3600,
  },
  poll: { clientSec: 60, heartbeatMin: 5 },
} as const;
