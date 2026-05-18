const CACHE_NAME = "toros-admin-v10-no-invoice-cache";

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

  // Never cache API calls
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request, { cache: "no-store" }));
    return;
  }

  // Never cache invoice pages
  if (url.pathname.startsWith("/invoice")) {
    event.respondWith(fetch(request, { cache: "no-store" }));
    return;
  }

  // Never cache the service worker itself
  if (url.pathname === "/sw.js") {
    event.respondWith(fetch(request, { cache: "no-store" }));
    return;
  }

  // Admin and inspection pages: network first, fallback to cache
  if (
    url.pathname === "/" ||
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/inspection")
  ) {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, copy).catch(() => {});
          });
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static assets: cache first
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, copy).catch(() => {});
        });
        return response;
      });
    })
  );
});

self.addEventListener("push", event => {
  let data = {
    title: "Toro's Auto Care",
    body: "New notification",
    url: "/admin"
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (err) {}
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "Toro's Auto Care", {
      body: data.body || "New notification",
      icon: "/logo.png",
      badge: "/logo.png",
      vibrate: [100, 50, 100],
      tag: data.tag || data.dedupeKey || undefined,
      renotify: true,
      requireInteraction: false,
      data: {
        url: data.url || "/admin",
        dedupeKey: data.dedupeKey || ""
      },
      actions: [
        { action: "open", title: "Open" },
        { action: "dismiss", title: "Dismiss" }
      ]
    })
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/admin";

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
