export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { invokeMcpTool } from '../../../../server/mcp/mcp-router';

export async function POST(req: NextRequest) {
  const { tool, params } = await req.json();
  if (!tool) return NextResponse.json({ success: false, error: 'tool required' }, { status: 400 });
  const result = await invokeMcpTool(tool, params || {});
  return NextResponse.json({ success: true, result });
}


