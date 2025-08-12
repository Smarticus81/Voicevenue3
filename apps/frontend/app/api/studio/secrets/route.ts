export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { workspaceSecrets } from '@/server/db/schema.org';
import { eq } from 'drizzle-orm';

// Placeholder envelope for demo purposes (do not use in prod)
function fakeEncrypt(value: string): string { return btoa(unescape(encodeURIComponent(value))); }

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const workspaceId = url.searchParams.get('workspaceId');
  if (!workspaceId) return NextResponse.json({ ok: false, error: 'missing_workspace' }, { status: 400 });
  const rows = await db.select().from(workspaceSecrets).where(eq(workspaceSecrets.workspaceId, workspaceId));
  return NextResponse.json(rows.map((r) => ({ id: r.id, keyName: r.keyName, createdAt: r.createdAt })));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspaceId, keyName, value } = body || {};
    if (!workspaceId || !keyName || !value) return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
    await db
      .insert(workspaceSecrets)
      .values({ id: crypto.randomUUID(), workspaceId, keyName, ciphertext: fakeEncrypt(String(value)) });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ ok: false, error: 'missing_id' }, { status: 400 });
    await db.delete(workspaceSecrets).where(eq(workspaceSecrets.id, id));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 });
  }
}


