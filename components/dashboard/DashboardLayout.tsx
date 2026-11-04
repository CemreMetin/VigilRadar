import type { CSSProperties, ReactNode } from "react";

/**
 * Page frame for the map view: three strict zones around a full-window map.
 *
 *   top bar  (scenario tabs)            macro context, which world am I looking at
 *   left     (layers of that scenario)  micro control, a glass overlay on the map
 *   bottom right of the map: view and camera controls
 *   right    (readouts + survival hub)  analysis and action, what does it mean, what do I do
 *   bottom   (status line)              system state
 *
 * Desktop (lg and up): the map is the background and the zones float over it, docked to the edges; every panel is
 * see-through. The brand, the scenario menu (centred) and the pages menu are three small panels over the map.
 * Narrow screens: no overlap; top bar, map, status line, then the two panels stack.
 * `themeColor` is the active scenario's colour: panel borders and the map vignette follow it.
 */
export default function DashboardLayout({
  themeColor,
  topBar,
  left,
  right,
  footer,
  map,
  mapOverlay,
  controls,
  alarm = false,
  banner,
}: {
  themeColor: string;
  topBar: ReactNode;
  left: ReactNode;
  right: ReactNode;
  footer: ReactNode;
  map: ReactNode;
  mapOverlay?: ReactNode;
  controls?: ReactNode;
  /** a CRITICAL alert is active: the top bar and the screen edge pulse red */
  alarm?: boolean;
  banner?: ReactNode;
}) {
  return (
    <div className={`map-view relative flex min-h-full flex-col lg:h-screen lg:overflow-hidden ${alarm ? "alarm-on" : ""}`} style={{ "--scn": themeColor } as CSSProperties}>
      <section className="relative order-2 h-[58vh] min-h-[320px] lg:absolute lg:inset-0 lg:order-none lg:h-auto lg:min-h-0" aria-label="Map">
        {map}
        {mapOverlay}
        {/* view and camera controls: bottom right of the open map, just left of the right panel */}
        <div className="absolute bottom-2 right-2 z-20 lg:bottom-[4.5rem] lg:right-[388px]">{controls}</div>
      </section>

      {alarm && <div className="alarm-frame no-print pointer-events-none fixed inset-0 z-50" aria-hidden />}

      {/* stacked bar below lg; on desktop the header has no box of its own (display: contents) and its three parts float over the map */}
      <header className={`panel-scn relative z-30 order-1 border-x-0 border-t-0 lg:contents ${alarm ? "alarm-bar" : ""}`}>{topBar}</header>
      {banner && <div className="relative z-40 order-1 px-2 py-1 lg:absolute lg:left-[270px] lg:right-[388px] lg:top-[calc(var(--topbar-h)+8px)] lg:p-0">{banner}</div>}

      <div className="panel-scn order-3 border-x-0 lg:absolute lg:bottom-1.5 lg:left-3 lg:right-[250px] lg:z-20 lg:order-none lg:border-x">{footer}</div>

      <aside className="panel-scn order-4 overflow-y-auto scroll-thin lg:absolute lg:bottom-11 lg:left-3 lg:top-[calc(var(--topbar-h)+4px)] lg:z-20 lg:w-[250px]" aria-label="Map layers for this scenario">
        {left}
      </aside>

      <aside className="panel-scn order-5 flex min-h-0 flex-col lg:absolute lg:bottom-11 lg:right-3 lg:top-[calc(var(--topbar-h)+4px)] lg:z-20 lg:w-[364px]" aria-label="Readouts and actions">
        {right}
      </aside>
    </div>
  );
}
