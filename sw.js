const CACHE_NAME = "toros-admin-v2";

const STATIC_ASSETS = [
  "/logo.png",
  "/manifest.json"
];

self.addEventListener("install", event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );

  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  if (
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("script.google.com")
  ) {
    event.respondWith(fetch(request));
    return;
  }

  if (
    url.pathname === "/" ||
    url.pathname.startsWith("/admin")
  ) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      return cached || fetch(request).then(response => {
        const copy = response.clone();

        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, copy).catch(() => {});
        });

        return response;
      });
    })
  );
});
