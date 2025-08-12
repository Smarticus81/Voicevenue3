export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { agentTemplates } from '@/server/db/schema.org';

export async function GET(_req: NextRequest) {
  const rows = await db.select().from(agentTemplates);
  return NextResponse.json(rows);
}


