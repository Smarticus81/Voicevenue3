export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { db } from '../../../../server/db/client';
import { drinks } from '../../../../server/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    const sample = await db
      .select({ name: drinks.name, category: drinks.category, price: drinks.price })
      .from(drinks)
      .limit(5);

    const countRes = await db.execute(sql`select count(*)::int as c from ${drinks}`);
    const total = Array.isArray(countRes) ? (countRes[0] as any)?.c : (countRes as any).rows?.[0]?.c;

    return NextResponse.json({ ok: true, db: 'connected', total_drinks: total ?? null, sample });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? 'db error' }, { status: 500 });
  }
}


