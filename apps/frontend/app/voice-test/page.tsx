import VoiceAgent from "@/components/VoiceAgent";

export default function VoiceTestPage() {
  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Voice Agent Loopback Test</h2>
      
      <div className="p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Test Instructions:</h3>
        <ol className="text-sm text-gray-600 space-y-2 mb-6">
          <li>1. Click <strong>Start</strong> to begin voice capture</li>
          <li>2. Speak into your microphone</li>
          <li>3. Watch for console logs and UI updates</li>
          <li>4. You should hear a beep sound when TTS responds</li>
          <li>5. Check browser console for detailed logs</li>
        </ol>
        
        <div className="p-4 border rounded bg-white">
          <VoiceAgent />
        </div>
      </div>
    </main>
  );
}
