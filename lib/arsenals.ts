import raw from "@/data/arsenals.json";
import type { Arsenals } from "./types";

// JSON imports widen tuples to number[]; the shape is checked by hand when the file is edited.
export const arsenals = raw as unknown as Arsenals;
