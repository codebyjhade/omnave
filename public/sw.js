const CACHE_VERSION = 'v1';
const STATIC_CACHE = `omnave-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `omnave-runtime-${CACHE_VERSION}`;

// Assets to precache immediately
const PRECACHE_ASSETS = [
  '/home',
  '/library',
  '/profile',
  '/welcome',
  '/favicon.ico',
  '/icon.png',
  '/omnave.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('omnave-') && name !== STATIC_CACHE && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // 1. Static Assets (fonts, images, next/static files) -> CacheFirst
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|woff2|woff|ttf|css)$/)
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) return networkResponse;
          const responseToCache = networkResponse.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        });
      })
    );
    return;
  }

  // 2. Supabase API Requests or Page Documents -> StaleWhileRevalidate
  // For app pages (/home, /library) and Supabase reads
  const isAppPage = PRECACHE_ASSETS.includes(url.pathname) || url.pathname.startsWith('/lesson/');
  const isSupabaseRead = url.hostname.includes('supabase') && !event.request.url.includes('/storage/');

  if (isAppPage || isSupabaseRead) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Offline fallback if network fails
            return cachedResponse;
          });
          return cachedResponse || fetchPromise;
        });
      })
    );
  }
});
