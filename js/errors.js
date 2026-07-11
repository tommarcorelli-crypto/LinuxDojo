// errors.js — Suivi d'erreurs auto-hébergé (LinuxDojo)
//
// Chargé en tout premier (avant tous les autres scripts) pour capturer les
// erreurs JS et les rejets de promesse non gérés, où qu'ils surviennent.
// Pas de service tiers (Sentry & co) : tout reste en local, dans
// localStorage, cohérent avec le reste du jeu ("PWA 100% gratuite, zéro
// compte requis"). Le joueur peut copier son journal d'erreurs depuis la
// page Profil pour le transmettre en cas de bug — c'est la seule façon
// d'être notifié d'un problème chez un vrai joueur sans backend.

const ERR_LOG_KEY = "linuxdojo_errors";
const ERR_LOG_MAX = 20;       // ring buffer : on ne garde que les N dernières erreurs distinctes
const ERR_DEDUPE_MS = 5000;   // une même erreur répétée sous 5s n'ajoute pas de ligne, juste un compteur

function _loadErrorLog() {
  try {
    const v = JSON.parse(localStorage.getItem(ERR_LOG_KEY));
    return Array.isArray(v) ? v : [];
  } catch { return []; }
}

function _saveErrorLog(list) {
  try { localStorage.setItem(ERR_LOG_KEY, JSON.stringify(list)); } catch {}
}

// Construit une entrée à partir d'un ErrorEvent / PromiseRejectionEvent,
// avec des valeurs par défaut robustes (tous les champs d'un ErrorEvent ne
// sont pas garantis selon le navigateur/l'origine de l'erreur).
function _normalize(type, detail) {
  const now = new Date().toISOString();
  return {
    type,                                   // "error" | "unhandledrejection"
    message: String(detail.message || "").slice(0, 300),
    source: String(detail.source || "").slice(0, 200),
    line: detail.line || 0,
    col: detail.col || 0,
    stack: String(detail.stack || "").slice(0, 500),
    ua: (typeof navigator !== "undefined" && navigator.userAgent) || "",
    firstSeen: now,
    lastSeen: now,
    count: 1,
  };
}

function logError(type, detail) {
  const entry = _normalize(type, detail);
  const log = _loadErrorLog();
  const last = log[log.length - 1];
  const isDupe = last
    && last.message === entry.message
    && last.source === entry.source
    && last.line === entry.line
    && (Date.now() - new Date(last.lastSeen).getTime()) < ERR_DEDUPE_MS;

  if (isDupe) {
    last.count++;
    last.lastSeen = entry.lastSeen;
  } else {
    log.push(entry);
    if (log.length > ERR_LOG_MAX) log.shift();
  }
  _saveErrorLog(log);
  console.warn("[LinuxDojo] Erreur capturée :", entry.message, entry);
}

function getErrorLog() { return _loadErrorLog(); }
function clearErrorLog() { _saveErrorLog([]); }

if (typeof window !== "undefined") {
  window.addEventListener("error", (e) => {
    logError("error", {
      message: e.message,
      source: e.filename,
      line: e.lineno,
      col: e.colno,
      stack: e.error && e.error.stack,
    });
  });

  window.addEventListener("unhandledrejection", (e) => {
    const reason = e.reason;
    logError("unhandledrejection", {
      message: reason && reason.message ? reason.message : String(reason),
      stack: reason && reason.stack,
    });
  });
}
