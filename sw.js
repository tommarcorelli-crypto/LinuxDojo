// sw.js — Service Worker LinuxDojo v17
const CACHE = "linuxdojo-v17";
const ASSETS = [
  "./","./index.html","./css/style.css",
  "./js/errors.js",
  "./js/levels.js","./js/expert.js","./js/terminal.js","./js/fx.js","./js/gameshell.js",
  "./js/challenges.js","./js/bandit.js","./js/boss.js","./js/kata.js","./js/certificate.js","./js/quizzes.js","./js/glossary.js","./js/daily.js","./js/profile.js","./js/game.js","./js/objectives.js","./js/seasonal.js","./js/sw-register.js",
  "./manifest.json",
  "./icons/icon-192.png?v=9","./icons/icon-512.png?v=9",
  "./icons/icon-192-maskable.png?v=9","./icons/icon-512-maskable.png?v=9"
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  // Pas de skipWaiting() automatique : on attend le feu vert de l'onglet
  // (voir sw-register.js) pour ne pas recharger la page en pleine mission.
});
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => { e.respondWith(caches.match(e.request).then(c => c || fetch(e.request))); });
self.addEventListener("message", e => { if (e.data === "SKIP_WAITING") self.skipWaiting(); });
