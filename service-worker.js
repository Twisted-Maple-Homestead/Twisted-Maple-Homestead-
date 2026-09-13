const CACHE="hh-v3";
const ASSETS=["./","./index.html","./styles.css","./app.js","./offspring-fix.js","./input-validation.js","./config.js","./manifest.json","./location-engine.js","./climate-service.js"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener("fetch",e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
