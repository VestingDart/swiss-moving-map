export default function CockpitPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="mb-6 rounded border border-yellow-400 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
        <strong>Disclaimer:</strong> Demonstration prototype. Not a certified
        avionics system. Not approved for operational flight use.
      </div>
      <h1 className="text-3xl font-bold">Cockpit Companion</h1>
      <p className="mt-4 text-gray-500">
        Pilot EFB-companion view — coming in Phase 1.
      </p>
    </main>
  );
}
