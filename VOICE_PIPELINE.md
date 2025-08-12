### Voice Pipelines: Dev Setup and Operation

This repo has two independent voice lanes for rapid isolation and debugging:

- OpenAI Realtime (WebRTC) lane
  - UI: `apps/frontend/components/OpenAIRealtimeWidget.tsx`
  - Server relay: `apps/frontend/app/api/voice/openai/sdp/route.ts`
  - Purpose: low-latency, multi-turn streaming via OpenAI Realtime

- Deepgram (ASR) + ElevenLabs (TTS) lane
  - UI: `apps/frontend/components/VoiceAgent.tsx`
  - WS bridge: `apps/frontend/server/voice/ws-server.ts`
  - NLU: `apps/frontend/app/api/voice/nlu/route.ts` (OpenAI chat for natural replies)
  - TTS: `apps/frontend/app/api/voice/tts/route.ts` (ElevenLabs, falls back to a 500ms beep)

Both lanes are button-driven and produce verbose logs for fast diagnosis.

---

#### 1) Environment
Create `apps/frontend/.env.local` with these keys:

- OpenAI (Realtime lane + NLU)
  - `OPENAI_API_KEY=sk-...`
  - `OPENAI_REALTIME_MODEL=gpt-4o-realtime-preview-2024-12-17` (Realtime)
  - `OPENAI_MODEL=gpt-4o-mini` (NLU chat responses)

- Deepgram (ASR WS lane)
  - `DEEPGRAM_API_KEY=...`
  - `DEEPGRAM_MODEL=nova-2` (or `nova-2-general`)

- ElevenLabs (TTS)
  - `ELEVENLABS_API_KEY=...`
  - `ELEVENLABS_VOICE_ID=Rachel` (or your preferred voice ID)

- Voice WS URL/Port (DG lane)
  - `NEXT_PUBLIC_VOICE_WS_PORT=8787`
  - Optionally: `NEXT_PUBLIC_VOICE_WS_URL=ws://localhost:8787`

Notes:
- Keys are loaded server-side; do not expose secrets in client env.
- The WS server also auto-loads `.env.local` or `.env` from repo root and `apps/frontend/`.

---

#### 2) Run
- Terminal A (Next.js):
  - `npm run frontend:dev`
  - Dev URL: `http://localhost:3000`

- Terminal B (Voice WS for DG lane):
  - `npm run voice:ws`
  - On start it logs: `[WS] listening on ws://localhost:8787 (deepgram)` when the key is present

Optional Windows helper: `start-voice-test.bat`

---

#### 3) Test Pages
- OpenAI lane: go to the page that renders `OpenAIRealtimeWidget` (e.g., `/dashboard`, lane = OpenAI).
  - Click Start (user-gesture required for mic)
  - Expect AI audio responses via OpenAI Realtime

- Deepgram + ElevenLabs lane: page that renders `VoiceAgent` (e.g., `/dashboard`, lane = DG+11) or `/voice-test`.
  - Click Start
  - Speak a short phrase and pause
  - Expect `[DG] partial/final:` logs in Terminal B and a natural ElevenLabs reply

---

#### 4) What Each Part Does
- `OpenAIRealtimeWidget.tsx`
  - Button-driven WebRTC: creates RTCPeerConnection, sends SDP to `/api/voice/openai/sdp`, receives streamed text+audio
  - Displays partial transcript and plays audio

- `openai/sdp/route.ts`
  - Server relay for OpenAI Realtime SDP exchange; validates upstream responses and returns `application/sdp`

- `VoiceAgent.tsx`
  - Button-driven mic capture via `AudioWorklet` → downsample to PCM16 16k → send buffers over WS
  - Receives ASR partials/finals → calls `/api/voice/nlu` → plays TTS from `/api/voice/tts`

- `server/voice/ws-server.ts`
  - Loads env, starts WS
  - If `DEEPGRAM_API_KEY` present: streams PCM16 16k mono to Deepgram; emits `{ type: "asr.partial", text, isFinal }`
  - Else: fake loopback emits canned partial/final

- `voice/nlu/route.ts`
  - Uses OpenAI chat (`gpt-4o-mini`) to produce short, natural replies; falls back to echo if key is missing

- `voice/tts/route.ts`
  - Uses ElevenLabs (MP3) if key present; else returns a 500ms WAV beep for deterministic audio

---

#### 5) Common Issues & Fixes
- Mic not starting / NotAllowedError
  - Both lanes are button-driven. Click Start; allow the mic prompt.

- No devices / NotFoundError
  - Check `http://localhost:3000/check-devices.html` to list detected microphones

- WS prints `(fake)` and never `(deepgram)`
  - Ensure `DEEPGRAM_API_KEY` is in `apps/frontend/.env.local` and restart `npm run voice:ws`

- Deepgram 400 or schema error
  - Typically bad model or params; current defaults use PCM16 16k (`linear16`) and `model=nova-2`
  - The server logs upstream errors and the first few received messages

- EADDRINUSE 8787
  - Kill the previous process or set a new port in `.env.local` and restart. The server also attempts incremental fallback.

- No audio playback
  - Browser may require user interaction. We already gate playback; click Start, then speak.

---

#### 6) Quick Verification Checklist
- OpenAI lane: Start → speak → see partial text → hear immediate AI audio
- DG lane: Start → see `[WS→DG] forwarded …` → `[DG] partial:` / `[DG] final:` → hear ElevenLabs
- NLU: Replies are concise and natural (no more "I heard …")

---

#### 7) Where to Tune
- Deepgram endpointing / sensitivity: adjust in `ws-server.ts` (e.g., endpointing, language)
- NLU prompt: `voice/nlu/route.ts` system message
- TTS voice: `ELEVENLABS_VOICE_ID`
- Realtime voice: `OpenAIRealtimeWidget` voice prop and session config

---

## A. User Journey: From Landing → Live Voice Agent

1) Landing (`/`)
- Primary CTAs: Get Started, View Demo, Create POS
- Theme toggle (light/dark), glass UI

2) Choose Path
- View Demo → `/dashboard` (explore features)
- Create POS → `/pos/setup` (tables, menu, wake word quick-setup)
- Build Agent → `/dashboard/agent-builder` (guided wizard)

3) POS Setup (`/pos/setup`)
- Add tables/locations and starter menu items
- Set custom wake word + fuzziness
- Save → Redirect to `/pos`

4) Agent Builder Wizard (`/dashboard/agent-builder`)
- Step 1: Pick lane (OpenAI Realtime or Deepgram+ElevenLabs), set `venueId` and `agentId`
- Step 2: Enable tools (toggle list with descriptions)
- Step 3: Review & Save → Get launch links
- Launch kiosk directly in selected lane

5) Kiosk (`/kiosk?venueId=...&agentId=...&lane=openai|dg11`)
- If staff PIN is configured, brief overlay appears; otherwise bypassed
- Visible lane toggle: OpenAI or DG+11
- Start button → mic on → wake phrase (configurable) or push-to-talk

6) Live Orders & Inventory
- NLU endpoint `/api/nlu/resolve-run` uses robust parser `parseOrder()` to normalize:
  - Intent `order.add` with `{ qty, unit: item|shot|oz, drink, tableName?, tabName? }`
  - Calls POS API `/api/pos/order` to add line items
  - Inventory decrement by item/shot/oz is supported downstream via bottle-size mapping

7) Settings (`/dashboard/settings`)
- Vendors (ASR/TTS), region, realtime voice/model
- Wake tuning (confidence, VAD), optional kiosk PIN

8) Latency Lab (`/dashboard/latency-lab`)
- Benchmark ASR/TTS combinations and pin fastest for the venue

9) Reports & Diagnostics
- Closing report (`/dashboard/reports/closing`), Diagnostics panel, Alerts

---

## B. Files & Structure (key paths)

Frontend app (Next.js)
- `apps/frontend/app/page.tsx` — Landing page (premium glass UI)
- `apps/frontend/app/layout.tsx` — Global layout, theme provider, manifest
- `apps/frontend/components/ClientGlobals.tsx` — Client-only loader (SW, palette)
- `apps/frontend/components/shell/DashboardShell.tsx` — App shell
- `apps/frontend/components/shell/AppSidebar.tsx` — Global nav
- `apps/frontend/app/dashboard/page.tsx` — Dashboard tiles
- `apps/frontend/app/dashboard/agent-builder/page.tsx` — Agent Builder (wizard)
- `apps/frontend/app/kiosk/page.tsx` — Kiosk, lane toggle, optional PIN
- `apps/frontend/components/kiosk/PinLockOverlay.tsx` — PIN lock (optional)
- `apps/frontend/components/OpenAIRealtimeWidget.tsx` — OpenAI Realtime (WebRTC)
- `apps/frontend/components/VoiceAgent.tsx` — Deepgram + ElevenLabs lane (WS)
- `apps/frontend/components/PWAInstall.tsx` — Install button (PWA)

APIs
- `apps/frontend/app/api/voice/openai/sdp/route.ts` — Realtime SDP relay
- `apps/frontend/app/api/voice/tts/route.ts` — TTS (OpenAI or ElevenLabs)
- `apps/frontend/app/api/voice/nlu/route.ts` — Small-talk fallback (chat)
- `apps/frontend/app/api/nlu/resolve-run/route.ts` — Intent resolver (shots/oz/items → POS)
- `apps/frontend/app/api/pos/order/route.ts` — POS order intake (unit-aware)
- `apps/frontend/app/api/pos/setup/route.ts` — POS setup wizard backend
- `apps/frontend/app/api/pos/search/route.ts` — Menu search
- `apps/frontend/app/api/settings/vendor/route.ts` — Venue vendor/region settings
- `apps/frontend/app/api/settings/wakeword/route.ts` — Custom wake word (DB)
- `apps/frontend/app/api/settings/pin/route.ts` — Staff PIN set/verify
- `apps/frontend/app/api/voice/ws-url/route.ts` — Locate active WS port (DG)

Voice & NLU core
- `apps/frontend/server/voice/ws-server.ts` — DG WS bridge (PCM16 → Deepgram)
- `apps/frontend/server/voice/intent-mapper.ts` — Robust order parser (regex normalization)
- `data/intents.yaml` — Intent catalogue (includes unified `order.add`)

Utilities
- `apps/frontend/lib/bottle-mapping.ts` — Bottle size → ml/oz/shots mapping
- `apps/frontend/lib/inventory-utils.ts` — Decrement inventory (item/shot/oz)
- `apps/frontend/lib/wake-word.ts` — Fuzzy wake word utility (Levenshtein)
- `apps/frontend/components/voice/useWakeWord.ts` — Client hook for wake phrase

Database & tracing
- `apps/frontend/server/db/schema.ts` — Core schema incl. `venue_settings`
- `apps/frontend/server/db/schema.pos.ts` — POS schema (tables, menu, orders)
- `apps/frontend/scripts/migrate-db.ts` — Idempotent table creation + seeds
- `apps/frontend/server/tracing/trace.ts` — Trace + spans helpers

Kiosk/UX resilience
- `apps/frontend/components/net/useOnline.ts` — Online/offline hook
- `apps/frontend/components/net/OfflineBanner.tsx` — Offline banner

---

## C. End-to-End Flow (OpenAI lane example)
1. `/kiosk?...&lane=openai` → Start → WebRTC → `/api/voice/openai/sdp`
2. User speaks: “add two shots of tequila to table five”
3. Client calls `/api/nlu/resolve-run` with text
4. `parseOrder()` normalizes → `{ intent:'order.add', qty:2, unit:'shot', drink:'tequila', tableName:'five' }`
5. Server posts to `/api/pos/order` with items `[ { name:'tequila', qty:2, unit:'shot' } ]`
6. POS persists order lines; downstream inventory can decrement shots via bottle mapping
7. Resolver responds with `say` → TTS plays confirmation

## D. End-to-End Flow (DG+11 lane example)
1. `/kiosk?...&lane=dg11` → Start → WS streams PCM16 to DG
2. ASR finals trigger client to call `/api/nlu/resolve-run`
3. Steps 4–7 identical to above
