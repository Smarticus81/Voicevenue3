export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { venueSettings } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { owner, organization, consents } = body || {};
    if (!owner?.name || !owner?.email || !organization?.name) {
      return NextResponse.json({ ok: false, error: 'missing fields' }, { status: 400 });
    }

    const slug = organization.slug || organization.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Seed venue settings so kiosk shows user's brand name immediately
    try {
      const rows = await db.select().from(venueSettings).where(eq(venueSettings.venueId, slug));
      if (!rows.length) {
        await db.insert(venueSettings).values({
          venueId: slug,
          extras: { venueName: organization.name },
        } as any);
      }
    } catch {}

    const res = NextResponse.json({ ok: true, user: { id: 'u_demo', email: owner.email }, organization: { slug } });
    res.cookies.set('session_user', 'u_demo', { path: '/', httpOnly: false });
    res.cookies.set('venue_id', slug, { path: '/', httpOnly: false });
    return res;
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 });
  }
}


