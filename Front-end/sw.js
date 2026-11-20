const CACHE_PREFIX = 'conectados-publico-';
const CACHE = CACHE_PREFIX + 'v1';
const FILES = [
  '/index.html','/CSS/style.css','/JS/conteudo.js','/JS/jornada.js',
  '/JS/companheiro.js','/JS/institucional.js','/JS/script.js',
  '/assets/aprender-juntos.jpg','/assets/icone-192.png','/assets/icone-512.png',
  '/assets/opendyslexic-latin-400-normal.woff2','/assets/opendyslexic-latin-700-normal.woff2',
  '/manifest.webmanifest'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key =>
    key.startsWith(CACHE_PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate' && ['/', '/index.html'].includes(url.pathname)) {
    event.respondWith(fetch(request).catch(() => caches.match('/index.html')));
  } else if (FILES.includes(url.pathname) && url.pathname !== '/index.html') {
    event.respondWith(caches.match(url.pathname).then(cached => cached || fetch(request)));
  }
});
