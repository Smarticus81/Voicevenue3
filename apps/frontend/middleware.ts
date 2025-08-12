import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;
  const isApi = pathname.startsWith('/api/');

  // Require auth for app surfaces (builder, dashboard, settings)
  const requiresAuth = !isApi && (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/build') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/onboarding')
  );

  const hasSession = Boolean(req.cookies.get('session_user'));
  if (requiresAuth && !hasSession && !pathname.startsWith('/signup') && !pathname.startsWith('/login')) {
    const next = encodeURIComponent(url.pathname + (url.search || ''));
    return NextResponse.redirect(new URL(`/login?next=${next}`, req.url));
  }
  // Resolve org/workspace from subdomain or path
  // Example: acme.bevpro.app → org=acme; /w/acme/ws → org=acme, ws=ws
  const host = req.headers.get('host') || '';
  let orgFromSub = '';
  if (host.includes('.')) {
    const [sub] = host.split('.');
    if (sub && sub !== 'www' && sub !== 'localhost') orgFromSub = sub;
  }

  // Inject org/workspace into request headers for server handlers (optional)
  const res = NextResponse.next();
  if (orgFromSub) res.headers.set('x-org-slug', orgFromSub);
  return res;
}

export const config = {
  matcher: ['/((?!_next|static|images|icons|favicon.ico).*)'],
};


