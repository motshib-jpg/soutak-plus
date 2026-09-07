const CACHE_VERSION = "soutakplus-v14-survival-hardening";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const CORE = [
  "/",
  "/index.html",
  "/content.html",
  "/services.html",
  "/sponsors.html",
  "/about.html",
  "/editorial.html",
  "/contact.html",
  "/privacy.html",
  "/terms.html",
  "/404.html",
  "/assets/css/style.css",
  "/assets/css/polish.css",
  "/assets/js/config.js",
  "/assets/js/app.js",
  "/assets/js/reader-tools.js",
  "/assets/js/forms.js",
  "/assets/js/ads.js",
  "/assets/images/icon.svg",
  "/manifest.webmanifest"
];

const NEVER_CACHE_PATHS = [
  "/admin.html",
  "/login.html",
  "/account.html",
  "/product.html",
  "/products.html",
  "/post.html"
];

function isNeverCache(url) {
  if (url.origin !== self.location.origin) return true;
  if (url.pathname.startsWith("/api/")) return true;
  return NEVER_CACHE_PATHS.some(path => url.pathname === path);
}

self.addEventListener("install", event => {
  event.waitUntil(caches.open(STATIC_CACHE).then(cache => cache.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key.startsWith("soutakplus-") && key !== STATIC_CACHE).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (isNeverCache(url) || url.hostname.endsWith("supabase.co")) {
    event.respondWith(fetch(req, { cache: "no-store" }));
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).then(res => {
        if (res.ok && url.origin === self.location.origin) {
          const copy = res.clone();
          caches.open(STATIC_CACHE).then(cache => cache.put(req, copy));
        }
        return res;
      }).catch(async () => await caches.match(req) || await caches.match("/index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(res => {
        if (res.ok && url.origin === self.location.origin) {
          const copy = res.clone();
          caches.open(STATIC_CACHE).then(cache => cache.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
