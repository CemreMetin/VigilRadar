"use client";

import type { Alert } from "@/lib/alerts";
import { relTime } from "@/lib/format";

/**
 * The live alarm strip, shown over the map under the top bar. CRITICAL alerts are matte red and (with the frame
 * and top bar in DashboardLayout) pulse slowly; notices are a calm amber line with no motion and no sound.
 * Acknowledging hides the alert on this device only.
 */
export default function AlarmBar({
  critical,
  notices,
  now,
  muted,
  locked,
  onMute,
  onView,
  onAck,
}: {
  critical: Alert[];
  notices: Alert[];
  now: number | null;
  muted: boolean;
  locked: boolean;
  onMute: (m: boolean) => void;
  onView: (a: Alert) => void;
  onAck: (ids: string[]) => void;
}) {
  const shown = critical[0] ?? notices[0];
  if (!shown) return null;
  const isCritical = shown.level === "critical";
  const more = (isCritical ? critical.length : notices.length) - 1;
  const color = isCritical ? "#ff1a3c" : "var(--geo)";

  return (
    <div
      role={isCritical ? "alert" : "status"}
      className="mono flex flex-wrap items-center gap-x-3 gap-y-1 border px-3 py-1.5 text-body"
      style={{ borderColor: color, background: `color-mix(in srgb, ${color} ${isCritical ? 26 : 12}%, var(--panel-solid))` }}
    >
      <span className="font-bold tracking-wider" style={{ color: isCritical ? "#fff" : color }}>
        {isCritical ? "CRITICAL" : "NOTICE"}
      </span>
      <span className="min-w-0 flex-1 truncate">
        <span className="font-bold text-fg">{shown.title}</span>
        <span className="text-dim"> · {shown.detail} · {now ? relTime(shown.at, now) : ""}</span>
        {more > 0 && <span className="text-dim"> · +{more} more</span>}
      </span>
      <button type="button" className="btn px-2 py-0.5 text-body font-bold" style={{ "--c": color } as React.CSSProperties} onClick={() => onView(shown)}>
        VIEW
      </button>
      <button type="button" className="btn px-2 py-0.5 text-body font-bold" style={{ "--c": color } as React.CSSProperties} onClick={() => onAck([shown.id])}>
        ACK
      </button>
      {isCritical && (
        <button
          type="button"
          aria-pressed={muted}
          onClick={() => onMute(!muted)}
          className="btn px-2 py-0.5 text-body font-bold"
          style={{ "--c": color } as React.CSSProperties}
          title={locked ? "Click anywhere on the page to allow sound" : muted ? "Turn the alarm tone on" : "Mute the alarm tone"}
        >
          {muted ? "SOUND OFF" : locked ? "CLICK FOR SOUND" : "SOUND ON"}
        </button>
      )}
    </div>
  );
}
