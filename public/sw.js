// Service worker mínimo: permite instalar la app y muestra una página si no hay internet.
// No guarda datos en caché: todo se consulta siempre al servidor (sin información desactualizada).
const OFFLINE_CACHE = 'horas-extras-offline-v1';
const OFFLINE_URLS = ['/offline.html', '/icons/icon-192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(OFFLINE_CACHE).then((cache) => cache.addAll(OFFLINE_URLS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== OFFLINE_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return; // solo páginas; el resto va directo a la red
  event.respondWith(fetch(event.request).catch(() => caches.match('/offline.html')));
});
