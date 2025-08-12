export const runtime = 'nodejs';

import { NextRequest } from 'next/server';

const sw = `
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open('bevpro-shell-v1');
    await cache.addAll(['/','/kiosk','/pos','/voice-test']);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  event.respondWith((async () => {
    const cache = await caches.open('bevpro-shell-v1');
    const cached = await cache.match(event.request);
    try {
      const fresh = await fetch(event.request);
      if (fresh && fresh.ok && url.origin === location.origin) {
        cache.put(event.request, fresh.clone());
      }
      return fresh;
    } catch (e) {
      if (cached) return cached;
      throw e;
    }
  })());
});
`;

export async function GET(_req: NextRequest) {
  return new Response(sw, { status: 200, headers: { 'Content-Type': 'application/javascript' } });
}


