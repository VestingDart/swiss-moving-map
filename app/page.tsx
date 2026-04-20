import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-4xl font-bold">Swiss Inflight Display</h1>
      <p className="text-gray-500">Conceptual prototype — select a view:</p>
      <nav className="flex flex-col gap-3 text-center">
        <Link href="/" className="rounded border px-6 py-3 hover:bg-gray-50">
          Cabin Display (/)
        </Link>
        <Link href="/crew" className="rounded border px-6 py-3 hover:bg-gray-50">
          Crew Panel (/crew)
        </Link>
        <Link
          href="/cockpit"
          className="rounded border px-6 py-3 hover:bg-gray-50"
        >
          Cockpit Companion (/cockpit)
        </Link>
        <Link
          href="/control"
          className="rounded border px-6 py-3 hover:bg-gray-50"
        >
          Dev Controller (/control)
        </Link>
      </nav>
      <p className="text-xs text-gray-400">
        Unsolicited conceptual prototype. Not affiliated with or endorsed by
        Swiss International Air Lines.
      </p>
    </main>
  );
}
