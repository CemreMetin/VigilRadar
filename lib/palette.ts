/**
 * Hex twins of the colour tokens in app/globals.css, for code that cannot read CSS variables (MapLibre paint, SVG attributes).
 * COLOR follows the tokens; LAYER holds the few map-layer colours that carry their own meaning. Keep both in step with the CSS.
 */
export const COLOR = {
  bg: "#050505",
  fg: "#d7e2ea",
  dim: "#9aa8b3",
  mid: "#9aa8b3",
  threat: "#ff003c",
  conflict: "#ff6a00",
  bio: "#b026ff",
  accent: "#00e5ff",
  geo: "#ffb000",
  space: "#c9d1ff",
} as const;

export const LAYER = {
  sun: "#ffd24a",
  labs: "#ff6ad5",
  cold: "#4a90ff",
  windLow: "#7fd3ff",
  stormMid: "#2fd4b0",
  satellites: "#6fa8ff",
  cableDim: "#4a6a78",
  pandemicMid: "#d58cff",
  pandemicLate: "#f0d4ff",
  pale: "#ffd6de",
} as const;
