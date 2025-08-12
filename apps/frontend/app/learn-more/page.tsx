import Link from "next/link";

export default function LearnMore() {
  return (
    <main className="min-h-screen text-white bg-gradient-to-b from-gray-900 to-gray-800 px-6 py-12">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold">Learn More</h1>
        <p className="text-white/80">
          BevPro Studio helps staff run tabs, add orders, and keep inventory in check — hands-free. Just say
          what you need. Bev listens and confirms out loud.
        </p>
        <ul className="list-disc list-inside space-y-2 text-white/80">
          <li>Fast voice: OpenAI Realtime or Deepgram + ElevenLabs</li>
          <li>Tabs, orders, and low‑stock alerts</li>
          <li>Kiosk mode with a staff PIN</li>
          <li>Print‑ready closing report</li>
        </ul>
        <div className="flex gap-3 pt-2">
          <Link href="/dashboard" className="px-5 py-3 rounded-xl bg-emerald-500 text-black font-semibold">Open Dashboard</Link>
          <Link href="/kiosk?venueId=demo-venue&agentId=demo-agent&lane=dg11" className="px-5 py-3 rounded-xl bg-white/10 border border-white/20">Try Kiosk</Link>
        </div>
      </div>
    </main>
  );
}



