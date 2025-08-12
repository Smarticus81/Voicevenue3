// Minimal offline shell + asset cache
const CACHE = "bevpro-v2";
const ASSETS = [
  "/", "/dashboard", "/kiosk",
  "/bev-embed.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network-first for API, cache-first for assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isAPI = url.pathname.startsWith("/api/");
  const isPost = event.request.method === "POST";
  
  // Skip caching for API calls and POST requests
  if (isAPI || isPost) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((net) => {
        // Only cache GET requests
        if (event.request.method === "GET") {
          const clone = net.clone();
          caches.open(CACHE).then((c) => c.put(event.request, clone));
        }
        return net;
      }).catch(() => {
        // Return cached version if network fails
        if (cached) return cached;
        // Return a proper Response object if nothing is cached
        return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
      });
      return cached || fetchPromise;
    })
  );
});



