"use client";

import Link from "next/link";
import { useRadar } from "@/lib/radar/useRadar";

// Temporary: shows where the data came from until the top bar and the map arrive (Faz 4, steps 2 and 3).
const LABEL = { worker: "LIVE", backup: "YEDEK KAYNAK", stale: "STALE" } as const;

export default function RadarShell() {
  const { loaded, done } = useRadar();
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mono text-title">VIGILRADAR // {loaded ? LABEL[loaded.source] : done ? "NO DATA" : "..."}</h1>
      {loaded && (
        <p className="mono mt-4 text-body text-dim">
          {loaded.state.global.level}{loaded.state.global.reason ? ` · ${loaded.state.global.reason}` : ""} · {loaded.state.quakes.length} quakes ·
          data {new Date(loaded.lastOkMs).toISOString().slice(11, 16)}Z
        </p>
      )}
      <p className="mt-6 flex gap-6 text-read">
        <Link href="/library" className="text-accent hover:underline">Library</Link>
        <Link href="/metrics" className="text-accent hover:underline">Metrics</Link>
      </p>
    </main>
  );
}
