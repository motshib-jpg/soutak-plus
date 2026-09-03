const CACHE_VERSION = "soutakplus-v8";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const CORE = [
  "/","/index.html","/content.html","/products.html","/services.html","/sponsors.html","/about.html","/contact.html","/privacy.html","/terms.html","/404.html",
  "/assets/css/style.css","/assets/js/config.js","/assets/js/supabase-client.js","/assets/js/app.js","/assets/js/content.js","/assets/js/store.js","/assets/js/forms.js","/assets/js/services.js","/assets/js/ads.js","/assets/js/rewarded-ads.js","/assets/js/reward-gate.js",
  "/downloads/creator-starter-guide.md","/downloads/content-templates.md","/downloads/first-audience-roadmap.md","/assets/images/icon.svg","/manifest.webmanifest"
];
self.addEventListener("install", event => {event.waitUntil(caches.open(STATIC_CACHE).then(cache => cache.addAll(CORE)));self.skipWaiting();});
self.addEventListener("activate", event => {event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("soutakplus-")&&key!==STATIC_CACHE).map(key=>caches.delete(key)))));self.clients.claim();});
self.addEventListener("fetch", event => {
  const req=event.request;if(req.method!=="GET")return;const url=new URL(req.url);
  if(url.pathname.endsWith("/admin.html")||url.pathname.endsWith("/login.html")||url.hostname.includes("supabase.co"))return;
  if(req.mode==="navigate"){
    event.respondWith(fetch(req).then(res=>{if(res.ok&&url.origin===self.location.origin){const copy=res.clone();caches.open(STATIC_CACHE).then(cache=>cache.put(req,copy))}return res;}).catch(async()=>await caches.match(req)||await caches.match("/index.html")));
    return;
  }
  event.respondWith(caches.match(req).then(cached=>{const network=fetch(req).then(res=>{if(res.ok&&url.origin===self.location.origin){const copy=res.clone();caches.open(STATIC_CACHE).then(cache=>cache.put(req,copy))}return res;}).catch(()=>cached);return cached||network;}));
});
