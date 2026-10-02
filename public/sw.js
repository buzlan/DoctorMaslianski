/*
 * Minimal service worker for a later Web Push step.
 * It does not intercept fetches and does not store responses.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
