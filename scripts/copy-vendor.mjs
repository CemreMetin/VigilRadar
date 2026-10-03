// MapLibre v6 ships its web worker as ES modules. Bundlers (Turbopack) mangle the
// worker URL, so we serve the worker files ourselves from public/vendor/ and
// point MapLibre at them with setWorkerUrl().
import { copyFileSync, mkdirSync } from "node:fs";

const src = "node_modules/maplibre-gl/dist";
const dst = "public/vendor";
mkdirSync(dst, { recursive: true });
for (const f of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  copyFileSync(`${src}/${f}`, `${dst}/${f}`);
}
console.log("copied maplibre worker files to", dst);
