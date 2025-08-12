export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { db } from '@/server/db/client';
import { workspaces } from '@/server/db/schema.org';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const org = url.searchParams.get('org') || 'demo';
  const ws = url.searchParams.get('ws') || 'default';

  // Look up workspace for branding (optional for now)
  let name = `BevPro – ${org}`;
  let themeColor = '#0ea5e9';
  let backgroundColor = '#0b1220';
  let icons: any[] = [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
  ];

  try {
    const rows = await db.select().from(workspaces).where(eq(workspaces.slug, ws));
    const w = rows[0] as any;
    if (w?.pwaBrand?.name) name = String(w.pwaBrand.name);
    if (w?.pwaBrand?.themeColor) themeColor = String(w.pwaBrand.themeColor);
    if (w?.pwaBrand?.backgroundColor) backgroundColor = String(w.pwaBrand.backgroundColor);
    if (w?.pwaBrand?.icons) icons = w.pwaBrand.icons;
  } catch {}

  const manifest = {
    name,
    short_name: name,
    start_url: `/w/${org}/${ws}`,
    display: 'standalone',
    theme_color: themeColor,
    background_color: backgroundColor,
    icons,
  };

  return new Response(JSON.stringify(manifest), {
    status: 200,
    headers: { 'Content-Type': 'application/manifest+json' },
  });
}


