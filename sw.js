// アプリ本体はネット優先で読むので、ファイルを差し替えるだけで更新が反映されます
const CACHE = "cardbook-v3";
const SHELL = ["./", "./index.html", "./cards.js", "./config.js", "./manifest.webmanifest",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"];
const CDN = ["https://cdn.jsdelivr.net/", "https://www.gstatic.com/firebasejs/", "https://fonts.googleapis.com/", "https://fonts.gstatic.com/"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // アプリ本体: ネット優先（更新をすぐ反映）、オフライン時はキャッシュ
  if (url.origin === location.origin) {
    e.respondWith(fetch(req, {cache: "no-cache"}).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
    }).catch(() => caches.match(req).then(r => r || caches.match("./index.html"))));
    return;
  }
  // QRライブラリ・フォント: キャッシュ優先
  if (CDN.some(p => req.url.startsWith(p))) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
    })));
  }
});
