export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { usageEvents } from '@/server/db/schema.org';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { organizationId, workspaceId, metric, qty } = body || {};
    if (!organizationId || !metric || typeof qty === 'undefined') return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
    await db.insert(usageEvents).values({ id: crypto.randomUUID(), organizationId, workspaceId, metric, qty: String(qty) as any });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 });
  }
}


