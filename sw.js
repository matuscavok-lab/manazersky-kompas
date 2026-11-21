// ============================================================================
// Manažérsky Kompas v0.9 – Service Worker (Krok V09-5: Cache-First Zero-CDN Offline PWA)
// ============================================================================
const CACHE_VERSION = 'v0.9-build-1795284474';
const CACHE_NAME = `manazersky-kompas-${CACHE_VERSION}-cache`;

// Hlavné súbory aplikácie (Zero-CDN bundle obsahuje HTML, štýly, skripty a SVG ikony)
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
];

// Doplnkové lokálne štýly, skripty a ikony (ak sú servované samostatne počas vývoja)
const OPTIONAL_ASSETS = [
  './src/sw.js',
  './src/template.html',
  './vendor/tailwind.min.css',
  './vendor/tailwindcss.js',
  './vendor/react.production.min.js',
  './vendor/react-dom.production.min.js',
  './vendor/lucide-react.min.js',
  './vendor/html-to-image.js',
  './vendor/html2canvas.min.js',
];

// 1. Inštalácia Service Workera – predbežné uloženie index.html, štýlov, skriptov a ikon
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        try {
          await cache.addAll(CORE_ASSETS);
        } catch (err) {
          console.warn('[SW] Upozornenie pri ukladaní hlavných súborov do cache:', err);
        }
        // Bezpečné uloženie voliteľných lokálnych skriptov a štýlov
        await Promise.allSettled(
          OPTIONAL_ASSETS.map((url) =>
            fetch(url, { cache: 'no-cache' }).then((res) => {
              if (res && res.ok) {
                return cache.put(url, res);
              }
            })
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// 2. Aktivácia Service Workera – vyčistenie starých cache a okamžité prevzatie kontroly
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME && key.startsWith('manazersky-kompas-')) {
              return caches.delete(key);
            }
            return Promise.resolve();
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// Pomocná funkcia na rozpoznanie statických aktív (HTML, CSS štýly, JS skripty, ikony a manifest)
function isCacheableAsset(request, url) {
  const dest = request.destination || '';
  if (
    dest === 'document' ||
    dest === 'style' ||
    dest === 'script' ||
    dest === 'image' ||
    dest === 'font' ||
    dest === 'manifest'
  ) {
    return true;
  }
  return /\.(html|css|js|jsx|json|svg|png|ico|webp|woff2?)$/i.test(url.pathname);
}

// Počúvanie na správu o okamžitej aktivácii nového Service Workera
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 3. Fetch stratégia:
//    - Pre HTML dokument (index.html, ./): Network-First s okamžitým uložením do cache a offline zálohou.
//    - Pre lokálne statické aktíva: Cache-First so Stale-While-Revalidate aktualizáciou.
//    - Externé domény (Cloud AI, Gemini, Ollama) Service Worker vôbec nezachytáva.
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Spracúvame len GET požiadavky a http/https protokol vlastného pôvodu (same-origin)
  if (req.method !== 'GET' || !req.url.startsWith('http')) {
    return;
  }

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  // Inštalačné balíky (.exe, .apk) a priečinok /downloads/ sťahujeme priamo zo siete
  if (/\/downloads\/|\.(exe|apk|msi|zip)$/i.test(url.pathname)) {
    return;
  }

  const isHtmlDocument =
    req.mode === 'navigate' ||
    req.destination === 'document' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('/') ||
    (req.headers.get('accept') || '').includes('text/html');

  if (isHtmlDocument) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        try {
          const networkResponse = await fetch(req);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(req, networkResponse.clone()).catch(() => {});
            cache.put('./index.html', networkResponse.clone()).catch(() => {});
          }
          return networkResponse;
        } catch (err) {
          const cachedHtml =
            (await cache.match(req, { ignoreSearch: true })) ||
            (await cache.match('./index.html', { ignoreSearch: true })) ||
            (await cache.match('./', { ignoreSearch: true }));
          if (cachedHtml) return cachedHtml;
          return new Response('Offline – aplikácia ešte nie je uložená v lokálnej cache.', {
            status: 503,
            statusText: 'Offline',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        }
      })()
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(req, { ignoreSearch: true });

      const networkUpdatePromise = fetch(req)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (networkResponse.type === 'basic' ||
              networkResponse.type === 'cors' ||
              isCacheableAsset(req, url))
          ) {
            cache.put(req, networkResponse.clone()).catch(() => {});
          }
          return networkResponse;
        })
        .catch(() => null);

      if (cachedResponse) {
        if (typeof event.waitUntil === 'function') {
          event.waitUntil(networkUpdatePromise);
        }
        return cachedResponse;
      }

      const freshResponse = await networkUpdatePromise;
      if (freshResponse) {
        return freshResponse;
      }

      return new Response('Offline – požadovaný súbor nie je v lokálnej cache.', {
        status: 503,
        statusText: 'Offline',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    })()
  );
});
