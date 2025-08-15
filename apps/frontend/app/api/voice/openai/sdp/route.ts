export const runtime = 'nodejs';
import { NextRequest } from 'next/server';
import { db } from '@/server/db/client';
import { venueSettings } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const sdp = await req.text();
    if (!sdp) {
      return new Response('Missing SDP', { status: 400 });
    }

    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      console.error('OPENAI_API_KEY not configured');
      return new Response('OpenAI API key not configured', { status: 500 });
    }

    // Optional: venue-aware model selection and agent instructions
    const u = new URL(req.url);
    const venueId = u.searchParams.get('venueId') || 'demo-venue';
    const agentId = u.searchParams.get('agentId') || 'demo-agent';
    
    const rows = await db.select().from(venueSettings).where(eq(venueSettings.venueId, venueId));
    const vs = rows[0];
    const model = (vs?.realtimeModel || process.env.OPENAI_REALTIME_MODEL || 'gpt-4o-realtime-preview-2024-12-17');

    // Load agent instructions from database
    const { systemConfig } = await import('../../../../../server/db/schema');
    const agentConfigKey = `agent:${agentId}:config`;
    const agentResult = await db.select({ 
      config_key: systemConfig.config_key, 
      config_value: systemConfig.config_value 
    }).from(systemConfig).where(eq(systemConfig.config_key, agentConfigKey)).limit(1);

    const { getDefaultInstructions } = await import('@/server/prompts/system-prompts');
    let instructions = getDefaultInstructions();
    
    if (agentResult.length > 0) {
      try {
        // Handle both string and object formats
        const configValue = agentResult[0].config_value;
        const agentConfig = typeof configValue === 'string' ? JSON.parse(configValue) : configValue;
        if (agentConfig.personality) {
          instructions = agentConfig.personality;
        }
      } catch (e) {
        console.error('Failed to parse agent config:', e);
      }
    }

    // Create session with custom instructions
    const sessionBody = JSON.stringify({
      instructions: instructions,
      voice: "sage",
      input_audio_format: "pcm16",
      output_audio_format: "pcm16",
      input_audio_transcription: {
        model: "whisper-1"
      },
      turn_detection: {
        type: "server_vad",
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 800
      }
    });

    console.log(`[OpenAI] Starting session with instructions: ${instructions.substring(0, 100)}...`);

    // Ensure header is ASCII-safe to avoid ByteString issues; move config to query/body alternative
    const r = await fetch(`https://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}&session=${encodeURIComponent(sessionBody)}` , {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'OpenAI-Beta': 'realtime=v1',
        'Content-Type': 'application/sdp',
        'Accept': 'application/sdp',
        // Do not send non-ASCII JSON in custom header (caused ByteString error on Windows)
      },
      body: sdp,
    });

    if (!r.ok) {
      const body = await r.text();
      return new Response(body || `OpenAI upstream error (${r.status})`, { status: r.status });
    }

    const answer = await r.text();
    
    if (!answer || !answer.startsWith('v=')) {
      return new Response('Invalid SDP response from OpenAI', { status: 502 });
    }

    return new Response(answer, { 
      headers: { 'Content-Type': 'application/sdp' } 
    });
  } catch (error) {
    console.error('SDP route error:', error);
    return new Response(`Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`, { 
      status: 500 
    });
  }
}


