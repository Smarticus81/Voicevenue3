export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { agentManifests } from '@/server/db/schema.org';
import { and, eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const workspaceId = url.searchParams.get('workspaceId');
  if (!workspaceId) return NextResponse.json({ ok: false, error: 'missing_workspace' }, { status: 400 });
  const rows = await db.select().from(agentManifests).where(eq(agentManifests.workspaceId, workspaceId));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspaceId, manifestJson } = body || {};
    if (!workspaceId || !manifestJson) return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
    const id = crypto.randomUUID();
    await db.insert(agentManifests).values({ id, workspaceId, version: 1, manifestJson, status: 'active' });
    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, manifestJson } = body || {};
    if (!id || !manifestJson) return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
    // naive: bump version client-side or here; for now just overwrite
    await db.update(agentManifests).set({ manifestJson }).where(eq(agentManifests.id, id));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 });
  }
}


