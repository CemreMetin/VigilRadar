import { ageLabel } from "@/lib/format";
import { utcClock } from "@/lib/format";
import type { WorldState } from "@/lib/types";

/**
 * Bottom status line: system state in plain terms. The wording is thematic but always true:
 * the uplink is "lost" only when data failed to load, "degraded" only when feeds are stale or failing.
 */
export default function StatusBar({
  world,
  loadError,
  now,
  liveFeeds,
  totalFeeds,
  stale,
  failed,
  summary,
}: {
  world: WorldState | null;
  loadError: string | null;
  now: number | null;
  liveFeeds: number;
  totalFeeds: number;
  stale: boolean;
  failed: string[];
  summary: string;
}) {
  const state = !world
    ? loadError
      ? { text: "UPLINK LOST", color: "var(--threat)", dot: "bg-threat" }
      : { text: "INITIALIZING FEEDS", color: "var(--fg-dim)", dot: "bg-dim" }
    : stale || liveFeeds < totalFeeds
      ? { text: "UPLINK DEGRADED", color: "var(--geo)", dot: "bg-geo" }
      : { text: "UPLINK NOMINAL", color: "var(--safe)", dot: "bg-safe live-dot" };

  return (
    <div className="mono flex flex-wrap items-center gap-x-5 gap-y-1 px-3 py-1.5 text-[11px]" role="status">
      <span className="flex items-center gap-2 font-bold" style={{ color: state.color }} title={failed.length ? `Not updating: ${failed.join(", ")}` : undefined}>
        <span className={`inline-block h-2 w-2 rounded-full ${state.dot}`} aria-hidden />
        <span className={world ? "" : "caret"}>{state.text}</span>
        {world && <span className="font-light text-dim">{liveFeeds}/{totalFeeds} feeds</span>}
      </span>
      <span className="font-light text-dim">
        UTC <span className="font-bold text-fg">{now ? utcClock(now) : "--:--:--"}</span>
      </span>
      {world && now && <span className="font-light text-dim">DATA AGE {ageLabel(world.generatedAt, now)}</span>}
      {summary && <span className="min-w-0 truncate font-light text-dim">{summary}</span>}
    </div>
  );
}
