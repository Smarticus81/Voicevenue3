import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }

    // Return session for OpenAI Realtime API
    return Response.json({
      realtimeSessionId: sessionId,
      session: {
        id: sessionId,
        model: "gpt-4o-realtime-preview-2024-12-17",
        created_at: Date.now(),
      },
    });
  } catch (error) {
    console.error("Error creating session:", error);
    return Response.json({ error: "Failed to create session" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    
    // Forward audio to OpenAI
    const response = await fetch(`https://api.openai.com/v1/realtime/sessions/${data.realtimeSessionId}/audio`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "audio/wav",
      },
      body: data.audio,
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const result = await response.json();
    return Response.json(result);
  } catch (error) {
    console.error("Error processing audio:", error);
    return Response.json({ error: "Failed to process audio" }, { status: 500 });
  }
}
