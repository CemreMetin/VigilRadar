import RadarScreen from "@/components/radar/RadarScreen";

// The old main screen lives on as components/Dashboard.tsx, unused (VIGIL.md Faz 0).
export default function Home() {
  return (
    <>
      {/* Preloaded only on the map route so content pages do not fetch unused map geometry. */}
      <link rel="preload" href="/data/static/world.json" as="fetch" crossOrigin="anonymous" />
      <RadarScreen />
    </>
  );
}
