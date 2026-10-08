const CACHE_NAME = "burnies-v29";
const SHELL = [
  "./", "./index.html", "./styles.css?v=29", "./manifest.webmanifest",
  "./js/app.js?v=29", "./js/data.js?v=29", "./js/plan.js?v=29", "./js/scoring.js?v=29", "./js/storage.js?v=29", "./js/calendar.js?v=29",
  "./assets/fonts/InstrumentSans-Medium.woff2", "./assets/fonts/InstrumentSans-SemiBold.woff2", "./assets/fonts/InstrumentSans-Bold.woff2",
  "./assets/icons/favicon.svg", "./assets/icons/icon-192.png", "./assets/icons/icon-512.png",
  "./assets/icons/icon-maskable-512.png", "./assets/icons/apple-touch-icon.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL)));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", event => {
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin || event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok && ["style", "script", "image", "font"].includes(event.request.destination)) {
      const copy = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => event.request.mode === "navigate" ? caches.match("./index.html") : Response.error())));
});
