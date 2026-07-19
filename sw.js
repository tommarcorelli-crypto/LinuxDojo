// sw.js — Service Worker LinuxDojo v46
const CACHE = "linuxdojo-v46";
const ASSETS = [
  "./","./index.html","./css/style.css",
  "./js/errors.js","./js/i18n.js",
  "./js/levels.js","./js/i18n/levels.en.js","./js/expert.js","./js/i18n/expert.en.js","./js/terminal.js","./js/fx.js","./js/gameshell.js","./js/i18n/world.en.js",
  "./js/challenges.js","./js/i18n/challenges.en.js","./js/oncall.js","./js/bandit.js","./js/i18n/bandit.en.js","./js/boss.js","./js/i18n/boss.en.js","./js/kata.js","./js/i18n/kata.en.js","./js/certificate.js","./js/quizzes.js","./js/i18n/quizzes.en.js","./js/glossary.js","./js/i18n/glossary.en.js","./js/daily.js","./js/i18n/daily.en.js","./js/profile.js","./js/game.js","./js/i18n/badges.en.js","./js/objectives.js","./js/i18n/objectives.en.js","./js/seasonal.js","./js/i18n/seasonal.en.js","./js/sw-register.js","./js/analytics.js",
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
