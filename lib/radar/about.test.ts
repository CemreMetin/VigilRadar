import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ABOUT, STORAGE_KEYS } from "@/core/content/about";

describe("/about", () => {
  it("lists exactly the localStorage keys the code uses", () => {
    const used = new Set<string>();
    for (const f of ["lib/lang.ts", "lib/radar/load.ts", "lib/radar/region.ts"])
      for (const m of readFileSync(f, "utf8").matchAll(/"(vigil\.[A-Za-z]+)"/g)) used.add(m[1]);
    expect([...used].sort()).toEqual([...STORAGE_KEYS].sort());
  });
  it("both languages have the same sections", () => {
    expect(ABOUT.tr.isNot.items).toHaveLength(ABOUT.en.isNot.items.length);
    expect(ABOUT.tr.privacy.items).toHaveLength(ABOUT.en.privacy.items.length);
    expect(ABOUT.tr.evidence.items).toHaveLength(ABOUT.en.evidence.items.length);
  });
});
