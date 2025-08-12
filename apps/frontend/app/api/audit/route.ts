export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { auditLogs } from '@/server/db/schema.org';
import { desc, eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const organizationId = url.searchParams.get('organizationId');
  if (!organizationId) return NextResponse.json({ ok: false, error: 'missing_org' }, { status: 400 });
  const rows = await db.select().from(auditLogs).where(eq(auditLogs.organizationId, organizationId)).orderBy(desc(auditLogs.at)).limit(200);
  return NextResponse.json(rows);
}


