const CACHE_NAME = "baby-food-plan-v14";
const ASSETS = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/app.js",
  "./js/store.js",
  "./js/categories.js",
  "./js/views.js",
  "./js/sync.js",
  "./js/theme.js",
  "./data/plan.json",
  "./data/weeks.json",
  "./data/groceries.json",
  "./manifest.webmanifest",
  "./icons/icon-180.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  // cache: "reload" bypasses the browser's HTTP cache (GitHub Pages sends
  // max-age=600), so a new worker never fills its cache with stale files.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS.map((url) => new Request(url, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Only the app's own files are cached. Cross-origin requests (the GitHub
  // API used for backups) always go straight to the network.
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (event.request.method === "GET" && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => cached);
    })
  );
});

// Lets the page ask which version is running (shown in Settings).
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "version" && event.ports[0]) {
    event.ports[0].postMessage(CACHE_NAME.replace("baby-food-plan-", ""));
  }
});
