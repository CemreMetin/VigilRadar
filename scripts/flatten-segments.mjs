// Post-build fix for the static export.
// Next 16.3 writes route-segment payloads into nested folders (out/survive/__next.survive/__PAGE__.txt)
// but the client asks for flattened names (out/survive/__next.survive.__PAGE__.txt). Without the flat
// files every <Link> prefetch is a 404. This copies each nested file to its flat name. Safe to re-run.
import { copyFileSync, existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "out");
let copied = 0;

function walkFlat(dir, prefix, base) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      walkFlat(full, `${prefix}.${name}`, base);
    } else if (name.endsWith(".txt")) {
      const flat = join(base, `${prefix}.${name}`);
      if (!existsSync(flat)) {
        copyFileSync(full, flat);
        copied++;
      }
    }
  }
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (!statSync(full).isDirectory()) continue;
    if (name.startsWith("__next.")) walkFlat(full, name, dir);
    else if (name !== "_next" && name !== "vendor" && name !== "data") walk(full);
  }
}

if (existsSync(OUT)) {
  walk(OUT);
  const next = JSON.parse(readFileSync(join(process.cwd(), "node_modules/next/package.json"), "utf8")).version;
  console.log(`flatten-segments: ${copied} files copied (Next ${next})`);
  // Guard: if a future Next writes flat files itself (copied 0) or changes layout, say so instead of failing silently.
  if (copied === 0) console.warn("flatten-segments: nothing copied. Next may now emit flat segment files; check whether this script is still needed.");
  if (!existsSync(join(OUT, "survive.txt")) && !existsSync(join(OUT, "survive/index.txt")) && !existsSync(join(OUT, "survive.html"))) {
    console.error("flatten-segments: expected export output is missing");
    process.exit(1);
  }
}
