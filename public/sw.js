/* 年轮离线缓存：页面走网络优先、断网时用缓存；静态资源缓存优先；API 不缓存 */
const CACHE = 'rings-v1';
const SHELL = ['/', '/checkin', '/weekly', '/rings', '/plan', '/cards', '/manifest.webmanifest', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  const put = (res) => {
    if (res.ok) {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
    }
    return res;
  };

  if (url.pathname.startsWith('/_next/static/') || /\.(png|svg|webmanifest)$/.test(url.pathname)) {
    event.respondWith(caches.match(req).then((hit) => hit || fetch(req).then(put)));
    return;
  }

  event.respondWith(
    fetch(req)
      .then(put)
      .catch(() => caches.match(req).then((hit) => hit || caches.match('/'))),
  );
});
