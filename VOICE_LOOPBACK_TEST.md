# Voice Agent Loopback Test

This is a self-contained test environment to isolate voice agent issues.

## Quick Start

1. **Start the test environment:**
   ```bash
   # Option 1: Use the batch file (Windows)
   start-voice-test.bat
   
   # Option 2: Manual start
   npm run voice:ws    # Terminal 1 - WebSocket server
   npm run frontend:dev # Terminal 2 - Next.js server
   ```

2. **Open the test page:**
   - Navigate to: http://localhost:3000/voice-test
   - Or use the dashboard: http://localhost:3000/dashboard (select "Deepgram + ElevenLabs")

3. **Test the voice agent:**
   - Click **Start** to begin voice capture
   - Speak into your microphone
   - Watch for console logs and UI updates
   - You should hear a beep sound when TTS responds

## What This Tests

### ✅ WebSocket Server (Port 8787)
- Receives binary audio chunks from client
- Sends fake ASR responses every ~1 second
- Logs connection events and data received

### ✅ API Stubs
- **NLU** (`/api/voice/nlu`): Echoes received text
- **TTS** (`/api/voice/tts`): Returns 500ms beep sound

### ✅ VoiceAgent Component
- WebSocket connection to fake ASR server
- Audio capture via MediaRecorder
- NLU/TTS API calls
- Console logging at all critical points

## Expected Behavior

1. **WebSocket Server Terminal:**
   ```
   [WS] listening on ws://localhost:8787
   [WS] client connected ::1
   [WS] received ~xxxx bytes across 5 chunks
   ```

2. **Browser Console:**
   ```
   [VA] mount; WS_URL= ws://localhost:8787
   [VA] startCmd() → ws://localhost:8787
   [WS] open
   [WS] message: {"type":"asr.partial","text":"testing one","isFinal":false}
   [WS] message: {"type":"asr.partial","text":"testing one two","isFinal":true}
   [VA] speak() I heard: testing one two
   ```

3. **UI Updates:**
   - Status changes to "cmd"
   - Partial text shows "testing one two"
   - Audio plays (beep sound)

## Troubleshooting

### No WebSocket Connection
- Check if port 8787 is available
- Verify `NEXT_PUBLIC_VOICE_WS_URL` in `.env.local`
- Ensure WebSocket server is running

### No Audio Capture
- Check browser permissions for microphone
- Ensure using HTTPS or localhost
- Check browser console for MediaRecorder errors

### No TTS Audio
- Check browser autoplay settings
- Verify `/api/voice/tts` endpoint is accessible
- Check network tab for API calls

## Next Steps

Once this loopback test works, we can:
1. Replace fake WebSocket server with real OpenAI/Deepgram ASR
2. Replace TTS stub with real ElevenLabs/OpenAI TTS
3. Replace NLU stub with real intent processing

The client-side code remains unchanged - only the server endpoints need updating.
