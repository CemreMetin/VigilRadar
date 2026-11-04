"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

const SHEET_HEIGHT = { collapsed: "56px", half: "50dvh", full: "calc(100dvh - 24px)" } as const;
type SheetSize = keyof typeof SHEET_HEIGHT;
const SHEET_SIZES: SheetSize[] = ["collapsed", "half", "full"];

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
  // Focus mode: F hides the three panels so only the map and the ticker remain; F or Escape brings them back
  const [focus, setFocus] = useState(false);
  // below lg the two side panels share one bottom sheet with tabs: collapsed, half or full height
  const [sheetTab, setSheetTab] = useState<"layers" | "readout">("readout");
  const [sheetSize, setSheetSize] = useState<SheetSize>("collapsed");
  const dragStart = useRef<number | null>(null);
  const step = (dir: 1 | -1) => setSheetSize((s) => SHEET_SIZES[Math.min(2, Math.max(0, SHEET_SIZES.indexOf(s) + dir))]);
  const pickTab = (tab: "layers" | "readout") => {
    setSheetTab(tab);
    if (sheetSize === "collapsed") setSheetSize("half");
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || (e.target as HTMLElement).closest("input, textarea, select, [contenteditable]")) return;
      if (e.key.toLowerCase() === "f") setFocus((v) => !v);
      else if (e.key === "Escape") setFocus(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div data-focus={focus || undefined} className={`map-view relative flex min-h-full flex-col max-lg:pb-16 lg:h-screen lg:overflow-hidden ${alarm ? "alarm-on" : ""}`} style={{ "--scn": themeColor } as CSSProperties}>
      <section className="relative order-2 h-[58vh] min-h-[320px] lg:absolute lg:inset-0 lg:order-none lg:h-auto lg:min-h-0" aria-label="Map">
        {map}
        {mapOverlay}
        <button type="button" aria-pressed={focus} onClick={() => setFocus((v) => !v)} title="Hide or show the panels (F)" className="btn mono absolute right-2 top-2 z-40 min-h-11 px-3 text-body font-bold lg:left-(--left-edge) lg:right-auto lg:top-auto lg:bottom-[calc(var(--foot-h)+var(--gap)+16px)] lg:min-h-0 lg:px-2 lg:py-1">
          {focus ? "SHOW PANELS" : "FOCUS"}
        </button>
        {/* view and camera controls: bottom right of the open map, just left of the right panel */}
        <div className="absolute bottom-2 right-2 z-20 lg:bottom-[calc(var(--foot-h)+var(--gap)+16px)] lg:right-(--right-edge)">{controls}</div>
      </section>

      {alarm && <div className="alarm-frame no-print pointer-events-none fixed inset-0 z-50" aria-hidden />}

      {/* stacked bar below lg; on desktop the header has no box of its own (display: contents) and its three parts float over the map */}
      <header className={`focus-hide panel-scn relative z-30 order-1 border-x-0 border-t-0 lg:contents ${alarm ? "alarm-bar" : ""}`}>{topBar}</header>
      {banner && <div className="relative z-40 order-1 px-2 py-1 lg:absolute lg:left-(--left-edge) lg:right-(--right-edge) lg:top-[calc(var(--topbar-h)+8px)] lg:p-0">{banner}</div>}

      <div className="panel-scn order-3 border-x-0 lg:absolute lg:bottom-1.5 lg:left-(--gap) lg:right-(--left-w) lg:z-20 lg:order-none lg:border-x">{footer}</div>

      {/* one bottom sheet below lg (tabs Layers / Readout, drag or tap the handle); on desktop the wrapper disappears and the two panels dock to the sides */}
      <div
        className="focus-hide panel-scn order-4 max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-40 max-lg:flex max-lg:h-(--sheet-h) max-lg:flex-col max-lg:border-x-0 max-lg:border-b-0 lg:contents"
        style={{ "--sheet-h": SHEET_HEIGHT[sheetSize] } as CSSProperties}
        data-sheet={sheetSize}
      >
        <div className="flex shrink-0 items-stretch border-b border-line lg:hidden">
          <button
            type="button"
            aria-label={`Resize the panel, now ${sheetSize}. Drag, or press to change.`}
            aria-expanded={sheetSize !== "collapsed"}
            className="mono min-h-11 min-w-11 px-3 text-body font-bold touch-none"
            onPointerDown={(e) => (dragStart.current = e.clientY)}
            onPointerUp={(e) => {
              const dy = e.clientY - (dragStart.current ?? e.clientY);
              dragStart.current = null;
              if (dy < -30) step(1);
              else if (dy > 30) step(-1);
              else setSheetSize((s) => SHEET_SIZES[(SHEET_SIZES.indexOf(s) + 1) % 3]);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp") step(1);
              else if (e.key === "ArrowDown") step(-1);
              else if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSheetSize((s) => SHEET_SIZES[(SHEET_SIZES.indexOf(s) + 1) % 3]);
              }
            }}
          >
            {sheetSize === "full" ? "▼" : "▲"}
          </button>
          <div role="tablist" aria-label="Panels" className="flex flex-1">
            {(["layers", "readout"] as const).map((tab) => (
              <button key={tab} type="button" role="tab" aria-selected={sheetTab === tab} onClick={() => pickTab(tab)} className={`mono min-h-11 flex-1 text-body uppercase tracking-wider ${sheetTab === tab ? "font-bold text-fg" : "text-dim"}`}>
                {tab === "layers" ? "Layers" : "Readout"}
              </button>
            ))}
          </div>
        </div>
      <aside className={`panel-scn overflow-y-auto scroll-thin max-lg:min-h-0 max-lg:flex-1 max-lg:border-0 ${sheetTab === "layers" ? "" : "max-lg:hidden"} ${sheetSize === "collapsed" ? "max-lg:hidden" : ""} lg:absolute lg:bottom-(--foot-h) lg:left-(--gap) lg:top-[calc(var(--topbar-h)+4px)] lg:z-20 lg:w-(--left-w)`} aria-label="Map layers for this scenario">
        {left}
      </aside>

      <aside className={`panel-scn flex min-h-0 flex-col max-lg:flex-1 max-lg:border-0 ${sheetTab === "readout" ? "" : "max-lg:hidden"} ${sheetSize === "collapsed" ? "max-lg:hidden" : ""} lg:absolute lg:bottom-(--foot-h) lg:right-(--gap) lg:top-[calc(var(--topbar-h)+4px)] lg:z-20 lg:w-(--right-w)`} aria-label="Readouts and actions">
        {right}
      </aside>
      </div>
    </div>
  );
}
