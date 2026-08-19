const CACHE_NAME = 'proposta-pagamentos-v2.2.1';
const CORE = [
  './', './index.html', './manifest.json',
  './css/app.css',
  './css/app-base.css',
  './css/app-components.css', './css/dashboard.css', './css/proposta.css', './css/print.css',
  './config/parametros.js',
  './js/app.js', './js/state.js', './js/formatters.js', './js/cartoes.js', './js/pix.js',
  './js/equipamentos.js', './js/antecipacao.js', './js/cobranca.js', './js/mais-vantagens.js',
  './js/beneficios.js', './js/calculos.js', './js/validacao.js', './js/storage.js',
  './js/dashboard.js', './js/proposta.js', './js/ui-shell.js', './js/ui-steps-cards.js',
  './js/ui-steps-brands.js', './js/ui-steps-operations.js', './js/ui-steps-commercial.js',
  './js/ui-steps-final.js', './js/ui-results.js', './js/ui-saved.js',
  './assets/bb.svg', './assets/cielo.svg', './assets/icons/app-icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok && new URL(event.request.url).origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      });
    })
  );
});