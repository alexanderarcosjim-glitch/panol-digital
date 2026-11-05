// Guarda la app en el celular para que abra aunque no haya señal.
const CACHE = "panol-v1";
const SHELL = ["./", "index.html", "config.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];
const CDN = ["www.gstatic.com/firebasejs", "cdnjs.cloudflare.com", "cdn.jsdelivr.net", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const same = url.origin === self.location.origin;
  const cdn = CDN.some(h => (url.host + url.pathname).startsWith(h));
  if (!same && !cdn) return; // Firestore y Auth van directo a la red
  // Red primero (para recibir actualizaciones); si no hay señal, usa lo guardado.
  e.respondWith(
    fetch(req).then(res => {
      if (res && (res.ok || res.type === "opaque")) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: same }).then(r => r || caches.match("index.html")))
  );
});
