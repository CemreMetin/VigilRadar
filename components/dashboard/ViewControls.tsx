"use client";

import type { MapControls } from "../MapView";
import type { RefObject } from "react";

/** Map view and camera buttons, bottom right of the map: projection, zoom, reset to the scenario's view. */
export default function ViewControls({
  globe,
  locked,
  onGlobe,
  controls,
}: {
  globe: boolean;
  /** this scenario needs the globe: the 2D button is off */
  locked: boolean;
  onGlobe: (v: boolean) => void;
  controls: RefObject<MapControls | null>;
}) {
  const b = "btn mono h-8 min-w-8 px-2 text-xs font-bold";
  return (
    <div className="panel-glass flex flex-col gap-px p-1" role="group" aria-label="Map view and camera">
      <div className="flex gap-px">
        <button type="button" aria-pressed={!globe} disabled={locked} title={locked ? "This scenario needs the globe" : undefined} onClick={() => onGlobe(false)} className={`${b} flex-1`}>2D</button>
        <button type="button" aria-pressed={globe} onClick={() => onGlobe(true)} className={`${b} flex-1`}>3D</button>
      </div>
      <div className="flex gap-px">
        <button type="button" onClick={() => controls.current?.zoomIn()} className={b} aria-label="Zoom in">+</button>
        <button type="button" onClick={() => controls.current?.zoomOut()} className={b} aria-label="Zoom out">−</button>
        <button type="button" onClick={() => controls.current?.reset()} className={`${b} flex-1`} title="Back to this scenario's view">RESET</button>
      </div>
    </div>
  );
}
