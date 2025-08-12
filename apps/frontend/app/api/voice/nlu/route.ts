import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { text } = await req.json().catch(() => ({ text: "" }));
  const input = (text || "").trim();

  const key = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini";

  if (!key || !input) {
    return NextResponse.json({ say: input ? input : "…nothing?" });
  }

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 100,
        messages: [
          { role: "system", content: "You are Bev, an expert bartender and voice assistant. You work in a busy bar taking orders and managing inventory. Keep responses SHORT (1-2 sentences), conversational, and bar-focused. Confirm orders like 'Got it, two shots of tequila for table five'. For inventory questions, give realistic bar responses like 'We have about 15 shots of whiskey left'. Never mention images or descriptions - focus on voice orders and bar operations." },
          { role: "user", content: input },
        ],
      }),
    });

    if (!r.ok) {
      const t = await r.text().catch(() => "");
      console.error("[NLU] OpenAI error", r.status, t);
      return NextResponse.json({ say: input });
    }

    const data = await r.json();
    const say = data?.choices?.[0]?.message?.content?.trim() || input;
    return NextResponse.json({ say });
  } catch (err) {
    console.error("[NLU] error", err);
    return NextResponse.json({ say: input });
  }
}


