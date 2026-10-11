import { ageLabel } from "@/lib/format";
import { utcClock } from "@/lib/format";
import type { Overdue } from "@/lib/reviews";
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
  overdue,
  freshnessOpen,
  onFreshness,
}: {
  world: WorldState | null;
  loadError: string | null;
  now: number | null;
  liveFeeds: number;
  totalFeeds: number;
  stale: boolean;
  failed: string[];
  summary: string;
  overdue: Overdue[];
  freshnessOpen: boolean;
  onFreshness: () => void;
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
      <button
        type="button"
        aria-pressed={freshnessOpen}
        aria-expanded={freshnessOpen}
        onClick={onFreshness}
        className="btn px-2 py-0.5 text-[11px] font-bold"
        title="Per-feed latency and exact update times"
      >
        FRESHNESS
      </button>
      {overdue.length > 0 && (
        <button
          type="button"
          onClick={onFreshness}
          className="font-bold"
          style={{ color: "var(--geo)" }}
          title={overdue.map((o) => `${o.label}: review was due ${o.reviewBy} (${o.source})`).join("; ")}
        >
          ⚠ {overdue.length} MANUAL {overdue.length === 1 ? "FIGURE" : "FIGURES"} PAST REVIEW DATE
        </button>
      )}
      {summary && <span className="min-w-0 truncate font-light text-dim">{summary}</span>}
      <span className="font-light text-dim">
        Map ©{" "}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">OpenStreetMap</a>
        {" · "}
        <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer" className="underline">CARTO</a>
        {" · "}
        <a href="https://maplibre.org" target="_blank" rel="noopener noreferrer" className="underline">MapLibre</a>
      </span>
    </div>
  );
}
