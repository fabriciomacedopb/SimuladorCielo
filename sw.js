const CACHE_NAME = 'proposta-pagamentos-v2.8.4';
const CORE = [
  './', './index.html', './manifest.json',
  './css/app.css', './css/app-base.css', './css/app-components.css',
  './css/dashboard.css', './css/proposta.css', './css/brand-fixes.css', './css/rate-charts.css', './css/pdf-center.css', './css/simulation-labels.css', './css/print.css', './css/print-tuning.css', './css/print-layout-v2.css',
  './config/parametros.js',
  './js/app.js', './js/state.js', './js/formatters.js', './js/cartoes.js', './js/pix.js',
  './js/equipamentos.js', './js/antecipacao.js', './js/cobranca.js', './js/mais-vantagens.js',
  './js/beneficios.js', './js/calculos.js', './js/validacao.js', './js/storage.js', './js/print.js', './js/rate-charts.js',
  './js/dashboard.js', './js/proposta.js', './js/ui-shell.js', './js/ui-steps-cards.js',
  './js/ui-steps-brands.js', './js/ui-steps-operations.js', './js/ui-steps-commercial.js',
  './js/ui-steps-final.js', './js/ui-results.js', './js/ui-saved.js',
  './assets/bb.svg', './assets/cielo.svg', './assets/icons/app-icon.svg',
  './assets/logos/visa.png', './assets/logos/mastercard-clean.svg', './assets/logos/elo.png', './assets/logos/diners-amex-clean.svg'
];
self.addEventListener('install',(event)=>{event.waitUntil(caches.open(CACHE_NAME).then((cache)=>cache.addAll(CORE)));self.skipWaiting();});
self.addEventListener('activate',(event)=>{event.waitUntil(caches.keys().then((keys)=>Promise.all(keys.filter((key)=>key!==CACHE_NAME).map((key)=>caches.delete(key)))));self.clients.claim();});
async function networkFirst(request,fallback){try{const response=await fetch(request,{cache:'no-store'});if(response&&response.ok&&new URL(request.url).origin===self.location.origin){const cache=await caches.open(CACHE_NAME);cache.put(request,response.clone());}return response;}catch(error){return (await caches.match(request))||(fallback?await caches.match(fallback):undefined)||Response.error();}}
self.addEventListener('fetch',(event)=>{if(event.request.method!=='GET')return;const url=new URL(event.request.url);if(url.origin!==self.location.origin)return;const isDynamicCode=event.request.mode==='navigate'||event.request.destination==='script'||event.request.destination==='style'||event.request.destination==='worker'||event.request.destination==='document';if(isDynamicCode){event.respondWith(networkFirst(event.request,event.request.mode==='navigate'?'./index.html':null));return;}event.respondWith(caches.match(event.request).then((cached)=>cached||fetch(event.request).then((response)=>{if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then((cache)=>cache.put(event.request,copy));}return response;})));});
