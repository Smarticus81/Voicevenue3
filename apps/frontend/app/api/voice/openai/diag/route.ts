import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const hasKey = Boolean(process.env.OPENAI_API_KEY);
  const model = process.env.OPENAI_REALTIME_MODEL || process.env.OPENAI_MODEL;
  
  return NextResponse.json({ 
    hasKey, 
    model,
    keyPrefix: process.env.OPENAI_API_KEY?.substring(0, 7) || "none"
  });
}
