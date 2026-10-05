import type { ReactNode } from "react";

/**
 * Page frame for the map view.
 *
 * Desktop (lg and up): the map fills the whole window and everything else floats over it, docked to the
 * edges: header on top, scenario cards across the top centre, filters on the left, metrics and the
 * survival card on the right. Panels are flat and solid so the map stays readable around them.
 *
 * Narrow screens: no overlap. Header, scenario cards, map, then the two panels stack in that order.
 */
export default function DashboardLayout({
  header,
  scenarios,
  map,
  mapOverlay,
  left,
  right,
}: {
  header: ReactNode;
  scenarios: ReactNode;
  map: ReactNode;
  mapOverlay?: ReactNode;
  left: ReactNode;
  right: ReactNode;
}) {
  return (
    <div className="relative flex min-h-full flex-col lg:h-screen lg:overflow-hidden">
      {/* map: a normal block on small screens, the full-window background on large ones */}
      <section className="relative order-3 h-[58vh] min-h-[320px] lg:absolute lg:inset-0 lg:order-none lg:h-auto lg:min-h-0" aria-label="Map">
        {map}
        {mapOverlay}
      </section>

      <header className="panel relative z-30 order-1 border-x-0 border-t-0 lg:absolute lg:inset-x-0 lg:top-0">{header}</header>

      <div className="order-2 border-b border-line bg-bg/0 px-3 py-2 lg:absolute lg:left-[270px] lg:right-[388px] lg:top-14 lg:z-20 lg:border-0 lg:p-0">
        {scenarios}
      </div>

      <aside className="panel order-4 overflow-y-auto scroll-thin lg:absolute lg:bottom-9 lg:left-3 lg:top-14 lg:z-20 lg:w-[250px]" aria-label="Filters">
        {left}
      </aside>

      <aside className="panel order-5 flex min-h-0 flex-col lg:absolute lg:bottom-9 lg:right-3 lg:top-14 lg:z-20 lg:w-[364px]" aria-label="Metrics and actions">
        {right}
      </aside>
    </div>
  );
}
