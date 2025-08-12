import { NextResponse } from "next/server";
import { loadRegistry } from "@/server/tools/registry";
export const runtime = "nodejs";

export async function GET() {
  const reg = loadRegistry();
  const tools = Object.values(reg).map(({ name, description }) => ({ name, description }));
  return NextResponse.json({ tools });
}


