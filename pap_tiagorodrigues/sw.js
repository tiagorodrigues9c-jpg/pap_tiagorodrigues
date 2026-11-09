const CACHE_NAME = "vila-nova-digital-v7";
const APP_SHELL = [
  "index.html",
  "pages/admin.html", "pages/agendamento.html", "pages/area-pessoal.html",
  "pages/atendimento.html", "pages/emergencia.html", "pages/eventos.html",
  "pages/indicadores.html", "pages/mapa.html", "pages/mobilidade.html",
  "pages/noticias.html", "pages/offline.html", "pages/participacao.html",
  "pages/residuos.html", "pages/servicos.html", "pages/sobre.html",
  "assets/css/styles.css", "assets/css/portal-enhancements.css",
  "assets/js/app.js", "assets/js/portal-enhancements.js",
  "assets/js/admin.js", "manifest.webmanifest"
];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
    return response;
  }).catch(() => event.request.mode === "navigate" ? caches.match("pages/offline.html") : Response.error())));
});
