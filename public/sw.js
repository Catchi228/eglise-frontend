// Service worker placeholder to avoid 404s in dev/prod.
// If you later add offline caching, replace this file.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

