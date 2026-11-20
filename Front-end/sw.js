const scope = new URL('./', self.location.href);
const cachePrefix = 'conectados-publico-' + scope.pathname + ':';
const cacheName = cachePrefix + 'v4';
const files = [
  'index.html','CSS/style.css','JS/ambiente.js','JS/conteudo.js','JS/jornada.js',
  'JS/companheiro.js','JS/institucional.js','JS/script.js','JS/evolucao.js','JS/painel.js',
  'JS/atualizacao.js','JS/aurora-guia.js','JS/aurora-perfil.js',
  'assets/aprender-juntos.jpg','assets/icone-192.png','assets/icone-512.png',
  'assets/opendyslexic-latin-400-normal.woff2','assets/opendyslexic-latin-700-normal.woff2',
  'manifest.webmanifest'
];
const shell = new URL('index.html',scope).href;

self.addEventListener('install', event => {
  const urls = files.map(file=>new Request(new URL(file,scope),{cache:'reload'}));
  event.waitUntil(caches.open(cacheName).then(cache=>cache.addAll(urls)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>
    (key.startsWith(cachePrefix) || (scope.pathname==='/' && /^conectados-publico-v[1-3]$/.test(key))) &&
    key!==cacheName).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const {request} = event;
  if (request.method!=='GET') return;
  const url = new URL(request.url);
  if (url.origin!==scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  const resource = url.pathname.slice(scope.pathname.length);
  if (request.mode==='navigate' && ['', 'index.html'].includes(resource)) {
    event.respondWith(fetch(request).catch(()=>caches.open(cacheName).then(cache=>cache.match(shell))));
  } else if (files.includes(resource) && resource!=='index.html') {
    event.respondWith(caches.open(cacheName).then(cache=>cache.match(new URL(resource,scope).href)).then(cached=>cached || fetch(request)));
  }
});
