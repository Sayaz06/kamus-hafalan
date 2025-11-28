// ============================================================
// service-worker.js — Kamus Hafalan
// ============================================================

const CACHE = "kamus-cache-v1";

const FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./main.js",
  "./firebase.js",
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(FILES))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});
