const CACHE="hh-v1";
const ASSETS=["./","./index.html","./styles.css","./app.js","./config.js","./manifest.json","./location-engine.js","./climate-service.js"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener("fetch",e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
