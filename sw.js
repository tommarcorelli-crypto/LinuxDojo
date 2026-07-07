// sw.js — Service Worker LinuxDojo v11
const CACHE = "linuxdojo-v11";
const ASSETS = [
  "./","./index.html","./style.css",
  "./levels.js","./terminal.js","./fx.js","./gameshell.js",
  "./challenges.js","./bandit.js","./boss.js","./kata.js","./certificate.js","./quizzes.js","./glossary.js","./daily.js","./profile.js","./game.js","./objectives.js",
  "./manifest.json",
  "./icons/icon-192.png?v=8","./icons/icon-512.png?v=8"
];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => { e.respondWith(caches.match(e.request).then(c => c || fetch(e.request))); });
