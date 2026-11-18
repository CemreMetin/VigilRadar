import Link from "next/link";

// Temporary shell (VIGIL.md Faz 0). The old main screen lives on as components/Dashboard.tsx, unused until Faz 4.
export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mono text-title">VIGIL</h1>
      <p className="mt-4 flex gap-6 text-read">
        <Link href="/library" className="text-accent hover:underline">Library</Link>
        <Link href="/metrics" className="text-accent hover:underline">Metrics</Link>
      </p>
    </main>
  );
}
