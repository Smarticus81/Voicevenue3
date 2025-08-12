export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body || {};
    
    if (!email || !password) {
      return NextResponse.json({ ok: false, error: 'Email and password required' }, { status: 400 });
    }

    // Simple demo authentication - in production, verify against your user database
    // For now, accept any email/password combination for demo purposes
    const user = { 
      id: 'u_demo', 
      email: email,
      name: email.split('@')[0] 
    };

    // Extract organization from email domain or use a default
    const domain = email.split('@')[1] || 'demo';
    const orgSlug = domain.split('.')[0] || 'demo-venue';

    const res = NextResponse.json({ 
      ok: true, 
      user,
      organization: { slug: orgSlug }
    });
    
    // Set session cookies
    res.cookies.set('session_user', user.id, { 
      path: '/', 
      httpOnly: false,
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });
    res.cookies.set('venue_id', orgSlug, { 
      path: '/', 
      httpOnly: false,
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });
    
    return res;
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: 'Login failed' }, { status: 500 });
  }
}
