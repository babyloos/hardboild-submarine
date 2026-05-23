/**
 * Service Worker — Hardboild Submarine PWA
 * キャッシュ戦略: Network-first (ゲームはリアルタイム通信が必須)
 * 静的アセット（CSS/JS/HTML）のみキャッシュ
 */

const CACHE_NAME = "hbs-v1";
const STATIC_ASSETS = [
  "/",
  "/game",
  "/dist/main.js",
  "/dist/game.js",
  "/assets/css/lobby.css",
  "/assets/css/game.css",
  "/manifest.json"
];

// Install: pre-cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first, fallback to cache
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Socket.io and API calls: always network
  if (url.pathname.startsWith("/socket.io") || url.pathname.startsWith("/api")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Update cache with fresh response
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
