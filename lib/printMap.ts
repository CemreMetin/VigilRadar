import type { Map as MlMap } from "maplibre-gl";

export type PrintMapOptions = {
  title: string;
  /** one line per active layer or legend entry */
  legend: string[];
  /** light paper: invert the dark basemap so it does not use a page of toner */
  light: boolean;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The map canvas as a PNG, taken right after a fresh render (the map is created with preserveDrawingBuffer, so the pixels survive). */
export async function captureMap(map: MlMap): Promise<string> {
  if (!map.loaded() || map.isMoving()) await Promise.race([new Promise((r) => map.once("idle", r)), sleep(5000)]);
  await new Promise<void>((r) => {
    map.once("render", () => r());
    map.triggerRepaint();
  });
  return map.getCanvas().toDataURL("image/png");
}

/** A round scale length (km) that is about a quarter of the map width, at the centre of the map. */
function scale(map: MlMap): { km: number; frac: number } {
  const w = map.getContainer().clientWidth || 1;
  const mPerPx = (40075016.686 * Math.cos((map.getCenter().lat * Math.PI) / 180)) / (512 * 2 ** map.getZoom());
  const raw = (mPerPx * w * 0.25) / 1000;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const km = [1, 2, 5, 10].map((m) => m * mag).reduce((a, b) => (Math.abs(b - raw) < Math.abs(a - raw) ? b : a));
  return { km, frac: Math.min(1, (km * 1000) / (mPerPx * w)) };
}

const el = (tag: string, cls: string, text?: string) => {
  const e = document.createElement(tag);
  e.className = cls;
  if (text) e.textContent = text;
  return e;
};

/**
 * Prints the map on its own landscape page: title, the image in a thin black frame, the legend, a scale note, "N ↑", dates and the basemap credit.
 * The sheet is built when asked, shown through html[data-print="map"], and removed again on afterprint.
 */
export async function printMap(map: MlMap, opt: PrintMapOptions, dataAsOf: string) {
  const png = await captureMap(map);
  const today = new Date().toISOString().slice(0, 10);
  const { km, frac } = scale(map);
  const sheet = el("div", "map-print");

  sheet.append(el("h1", "mono", opt.title));
  const fit = el("div", "map-fit"); // as wide as the image, so the scale bar below is a true fraction of the picture
  const frame = el("div", "map-frame");
  const img = document.createElement("img");
  img.src = png;
  img.alt = opt.title;
  if (opt.light) img.className = "light-paper";
  frame.append(img);
  const bar = el("span", "map-scale-bar");
  bar.style.width = `${(frac * 100).toFixed(1)}%`;
  const row = el("div", "map-meta");
  row.append(el("span", "mono", `${km.toLocaleString("en-US")} km at the map centre; the scale varies across the map`), el("span", "map-north mono", "N ↑"));
  fit.append(frame, bar, row);
  sheet.append(fit);

  if (opt.legend.length) {
    const ul = el("ul", "map-legend");
    for (const l of opt.legend) ul.append(el("li", "", l));
    sheet.append(el("p", "label", "Active layers and legend"), ul);
  }
  sheet.append(el("p", "map-credit", `Basemap © CARTO, © OpenStreetMap contributors. Printed ${today}; data as of ${dataAsOf}. VigilRadar · monitoring-9l7.pages.dev`));

  document.body.append(sheet);
  document.documentElement.dataset.print = "map";
  const done = () => {
    sheet.remove();
    delete document.documentElement.dataset.print;
    window.removeEventListener("afterprint", done);
  };
  window.addEventListener("afterprint", done);
  await img.decode().catch(() => {}); // the image must be decoded before the print dialog freezes the page
  window.print();
}

/** The data date shown on prints, from the same world_state.json the map reads. */
export async function dataDate(): Promise<string> {
  try {
    const w = (await (await fetch("/data/world_state.json")).json()) as { generatedAt: string };
    return w.generatedAt.slice(0, 10);
  } catch {
    return "n/a";
  }
}
