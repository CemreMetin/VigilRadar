import assert from "node:assert/strict";
import { filterBases, nuclearBaseIds } from "./bases";

const bases: [string, string, number, number, string, string][] = [
  ["Q1", "Minot AFB", 48.416, -101.358, "United States", "air"],
  ["Q2", "Old Soviet base", 55, 37, "Soviet Union", "base"],
  ["Q3", "Port", 59.9, 30.3, "Russia", "naval"],
  ["Q4", "Camp", 50, 10, "Germany", "base"],
];
const all = new Set(["air", "naval", "base"]);
assert.equal(filterBases(bases, { kinds: all, country: "", historical: false }).length, 3); // the Soviet entry is hidden
assert.equal(filterBases(bases, { kinds: all, country: "", historical: true }).length, 4);
assert.equal(filterBases(bases, { kinds: new Set(["naval"]), country: "", historical: true }).length, 1);
assert.equal(filterBases(bases, { kinds: all, country: "Germany", historical: false })[0][0], "Q4");

const sites = [["Minot Air Force Base", 48.416, -101.358, "strategic-forces", "US", "x", "y"], ["Moscow", 55.75, 37.6, "capital", "RU", "x", "y"]] as never;
const nuc = nuclearBaseIds(bases, sites);
assert.deepEqual([...nuc], ["Q1"]); // a capital never marks a base
console.log("bases filter: all checks passed");
