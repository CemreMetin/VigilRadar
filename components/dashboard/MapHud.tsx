/**
 * Decoration over the map, never interactive: a scenario-coloured vignette (the "map theme"), faint
 * scanlines, and corner brackets that frame the open part of the map between the panels.
 * Remounted on scenario change so the theme fades in. Hidden on narrow screens and when printing.
 */
export default function MapHud({ color, id }: { color: string; id: string }) {
  const bracket = "absolute h-4 w-4 hidden lg:block";
  const line = `1.5px solid color-mix(in srgb, ${color} 75%, transparent)`;
  return (
    <div key={id} className="theme-in no-print pointer-events-none absolute inset-0 z-[5]" aria-hidden>
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(ellipse at 50% -5%, color-mix(in srgb, ${color} 18%, transparent), transparent 58%)` }}
      />
      <div className="scanlines absolute inset-0" />
      {/* frame around the open map area: left panel 262px, right panel 376px, top bar 76px, bottom bar 52px */}
      <div className="absolute hidden lg:block" style={{ left: 266, right: 380, top: 76, bottom: 54 }}>
        <span className={bracket} style={{ left: 0, top: 0, borderLeft: line, borderTop: line }} />
        <span className={bracket} style={{ right: 0, top: 0, borderRight: line, borderTop: line }} />
        <span className={bracket} style={{ left: 0, bottom: 0, borderLeft: line, borderBottom: line }} />
        <span className={bracket} style={{ right: 0, bottom: 0, borderRight: line, borderBottom: line }} />
      </div>
    </div>
  );
}
