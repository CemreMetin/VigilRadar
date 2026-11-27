/**
 * Hex twins of the Taktil Minimalizm colour tokens in app/globals.css, for code that cannot read CSS variables
 * (MapLibre paint, Canvas cartographic glyphs, SVG attributes). Keep in step with app/globals.css.
 */
export const COLOR = {
  bg: "#121110",       // Warm Obsidian base / ocean
  surface: "#1C1A17",  // Espresso surface / land
  elevated: "#26231F", // Elevated surface
  fg: "#F4EFE6",       // Espresso cream primary text & selected outline
  dim: "#9C9488",      // Secondary warm grey
  mid: "#9C9488",
  stone: "#D6C7B2",    // Warm neutral accent
  accent: "#E05A2B",   // Primary Braun terracotta accent
  accentText: "#EE6E3E",
  threat: "#C84B4B",   // Matte crimson (map fills & strokes)
  conflict: "#E05A2B", // Terracotta
  bio: "#B47EA6",      // Muted plum
  geo: "#D99B26",      // Matte amber
  space: "#8AB2C2",    // Muted observatory steel (subsea cables & digital)
  safe: "#5B8C6A",     // Matte sage green
  land: "#1C1A17",     // --panel-solid: a country without impact on the map
  border: "#2E2A25",   // Subtle warm coastline/country border
} as const;

/** Map-only contrast colours: points and lines over the warm choropleth. Menus keep COLOR. */
export const MAP = {
  coast: "#3E3831",                       // country borders in LIVE
  coastSim: "rgba(244, 239, 230, 0.22)",  // country borders over the coloured countries
  cream: "#F4EFE6",
  stone: "#D6C7B2",
  gold: "#F2B84B",
  hot: "#FF6A45",
  coral: "#F25F5C",
  steel: "#79C7DC",
} as const;

export const LAYER = {
  sun: "#E5B95C",
  labs: "#C985A8",
  cold: "#769FB6",
  windLow: "#8AB2C2",
  stormMid: "#5B8C6A",
  satellites: "#8AB2C2",
  cableDim: "#5D7885",
  pandemicMid: "#B47EA6",
  pandemicLate: "#D6BDD0",
  pale: "#E5C4BD",
} as const;
