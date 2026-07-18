const CACHE="shauli-daily-v8";
const ASSETS=["./","./index.html","./styles.css?v=3","./app.js?v=4","./manifest.webmanifest","./data/briefing.json"];
self.addEventListener("install",event=>event.waitUntil(Promise.all([caches.open(CACHE).then(cache=>cache.addAll(ASSETS)),self.skipWaiting()])));
self.addEventListener("activate",event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))),self.clients.claim()])));
self.addEventListener("fetch",event=>event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response}).catch(()=>caches.match(event.request))));
