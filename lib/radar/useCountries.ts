"use client";

import { useEffect, useMemo, useState } from "react";
import { buildCountries, type CountryFactsFile } from "@/core/laplace/countries";
import type { Country } from "@/core/laplace/types";
import { useLazyJson } from "@/lib/useLazyJson";
import { loadWorld, type World } from "./world";

/** The simulator's countries, loaded when SIMULATE is first opened. Null until the map geometry is in. */
export function useCountries(active: boolean): Country[] | null {
  const [world, setWorld] = useState<World | null>(null);
  useEffect(() => {
    let alive = true;
    if (active) loadWorld().then((w) => alive && setWorld(w), () => { /* the map shows no countries either; a reload retries */ });
    return () => { alive = false; };
  }, [active]);
  const facts = useLazyJson<CountryFactsFile>("/data/country_profiles.json", active);
  return useMemo(() => (world ? buildCountries(world, facts.data) : null), [world, facts.data]);
}
