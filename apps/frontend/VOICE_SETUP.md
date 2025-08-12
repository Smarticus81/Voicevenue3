# Voice Application Setup

This guide helps you set up and troubleshoot the voice application.

## Quick Start

1. **Start both servers:**
   ```bash
   npm run dev:all
   ```
   
   This starts:
   - Next.js dev server on port 3000
   - WebSocket server on port 8787

2. **Check status:**
   Visit `http://localhost:3000/voice-status` to verify all services are running.

## Manual Setup

If you prefer to run servers separately:

1. **Start Next.js server:**
   ```bash
   npm run dev
   ```

2. **Start WebSocket server:**
   ```bash
   npm run dev:voice
   ```

## Environment Variables

Ensure these are set in `.env.local`:

```env
# OpenAI Realtime
OPENAI_API_KEY=your_openai_api_key
OPENAI_REALTIME_MODEL=gpt-4o-realtime-preview-2024-12-17

# Deepgram (for VoiceAgent)
DEEPGRAM_API_KEY=your_deepgram_api_key
DEEPGRAM_MODEL=nova-2-general

# ElevenLabs (for TTS)
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=Rachel

# WebSocket
VOICE_WS_PORT=8787
```

## Troubleshooting

### Common Issues

1. **"RTCPeerConnection's signalingState is 'closed'"**
   - The WebRTC connection is being closed prematurely
   - Fixed: Added proper connection state management and retry logic

2. **"WebSocket connection failed"**
   - WebSocket server is not running
   - Solution: Run `npm run dev:voice`

3. **"401 Unauthorized" on OpenAI API**
   - Invalid or missing OpenAI API key
   - Check your `.env.local` file

4. **"Invalid SDP response format"**
   - OpenAI API returned malformed SDP
   - Fixed: Added SDP validation

### Debug Steps

1. Check the status page: `http://localhost:3000/voice-status`
2. Open browser console for detailed error messages
3. Ensure microphone permissions are granted
4. Verify all environment variables are set correctly

## Components

- **OpenAIRealtimeWidget**: Uses OpenAI's realtime API for voice interaction
- **VoiceAgent**: Uses Deepgram for speech recognition and ElevenLabs for TTS

## API Endpoints

- `/api/voice/openai/sdp` - OpenAI realtime SDP negotiation
- `/api/voice/nlu` - Natural language understanding
- `/api/voice/tts` - Text-to-speech
- `/api/voice/tools` - Tool execution
- `/api/tools/list` - Available tools

## Architecture

```
Browser (WebRTC) ←→ OpenAI Realtime API
Browser (WebSocket) ←→ Deepgram API
Browser (HTTP) ←→ ElevenLabs API
```
