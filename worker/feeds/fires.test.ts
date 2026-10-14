import assert from "node:assert/strict";
import { gridFires } from "./fires";

const csv = [
  "latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,confidence,version,bright_ti5,frp,daynight",
  "10.10,20.10,330,0.4,0.4,2026-10-14,0100,N,n,2.0NRT,290,5.5,N",
  "10.20,20.30,330,0.4,0.4,2026-10-14,0100,N,h,2.0NRT,290,12.0,N",
  "10.30,20.40,330,0.4,0.4,2026-10-14,0100,N,l,2.0NRT,290,99.0,N",
  "-33.80,151.20,340,0.4,0.4,2026-10-14,0100,N,n,2.0NRT,300,3.0,D",
].join("\n");
const cells = gridFires(csv);
assert.equal(cells.length, 2); // the two northern pixels share a 0.5 degree cell
const north = cells.find((c) => c[0] > 0)!;
assert.equal(north[2], 2); // low-confidence pixel dropped
assert.equal(north[3], 12); // strongest FRP kept
assert.throws(() => gridFires("a,b\n1,2"));
console.log("fire grid: all checks passed");
