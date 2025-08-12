export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  
  // Clear session cookies
  res.cookies.set('session_user', '', { 
    path: '/', 
    maxAge: 0 
  });
  res.cookies.set('venue_id', '', { 
    path: '/', 
    maxAge: 0 
  });
  
  return res;
}
