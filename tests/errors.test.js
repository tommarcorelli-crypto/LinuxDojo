// tests/errors.test.js
// Suite de tests unitaires pour le suivi d'erreurs (js/errors.js) :
// capture, déduplication, ring buffer, export/vidage. Aucune dépendance
// externe : exécuter avec  node tests/errors.test.js
//
// Même approche que game.test.js : errors.js s'exécute dans un contexte vm
// avec un stub minimal de window/localStorage (il enregistre des listeners
// "error"/"unhandledrejection" au chargement).

"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

// ─────────────────────────────────────────────────────────────────────────
// Mini framework de test (zéro dépendance) — identique à game.test.js
// ─────────────────────────────────────────────────────────────────────────
let pass = 0, fail = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    pass++;
  } catch (e) {
    fail++;
    failures.push({ name, error: e.message });
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion échouée");
}
function assertEqual(a, b, label) {
  assert(a === b, `${label || "valeur"} attendue: ${JSON.stringify(b)}, reçue: ${JSON.stringify(a)}`);
}

function makeFakeLocalStorage() {
  const store = {};
  return {
    getItem(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem(k, v) { store[k] = String(v); },
    removeItem(k) { delete store[k]; },
    _dump() { return store; },
  };
}

function buildSandbox() {
  const listeners = {};
  const fakeWindow = {
    addEventListener(type, cb) { (listeners[type] = listeners[type] || []).push(cb); },
    removeEventListener() {},
    __dispatch(type, evt) { (listeners[type] || []).forEach(cb => cb(evt)); },
  };
  const sandbox = {
    window: fakeWindow,
    localStorage: makeFakeLocalStorage(),
    navigator: { userAgent: "test-agent" },
    console,
  };
  vm.createContext(sandbox);
  return sandbox;
}

const EXPORTED = ["getErrorLog", "clearErrorLog", "logError", "ERR_LOG_MAX", "ERR_DEDUPE_MS"];

function loadErrors() {
  const src = fs.readFileSync(path.join(__dirname, "..", "js", "errors.js"), "utf8");
  const exportLine = `\nvar __TEST_EXPORTS__ = { ${EXPORTED.map(n => `${n}: ${n}`).join(", ")} };\n`;
  const sandbox = buildSandbox();
  vm.runInContext(src + exportLine, sandbox, { filename: "js/errors.js" });
  return { ...sandbox.__TEST_EXPORTS__, window: sandbox.window, localStorage: sandbox.localStorage };
}

// ═══════════════════════════════════════════════════════════════════════
// CAPTURE DE BASE
// ═══════════════════════════════════════════════════════════════════════

test("aucune erreur au départ", () => {
  const ctx = loadErrors();
  assertEqual(ctx.getErrorLog().length, 0, "journal vide au départ");
});

test("window.onerror capturé et journalisé", () => {
  const ctx = loadErrors();
  ctx.window.__dispatch("error", { message: "boom", filename: "js/game.js", lineno: 42, colno: 3 });
  const log = ctx.getErrorLog();
  assertEqual(log.length, 1, "une entrée journalisée");
  assertEqual(log[0].message, "boom", "message");
  assertEqual(log[0].source, "js/game.js", "source");
  assertEqual(log[0].line, 42, "line");
  assertEqual(log[0].count, 1, "count initial");
});

test("unhandledrejection capturé et journalisé", () => {
  const ctx = loadErrors();
  ctx.window.__dispatch("unhandledrejection", { reason: new Error("promesse ratée") });
  const log = ctx.getErrorLog();
  assertEqual(log.length, 1, "une entrée journalisée");
  assertEqual(log[0].type, "unhandledrejection", "type");
  assertEqual(log[0].message, "promesse ratée", "message extrait de reason.message");
});

test("unhandledrejection avec reason non-Error (ex: string rejetée)", () => {
  const ctx = loadErrors();
  ctx.window.__dispatch("unhandledrejection", { reason: "juste une string" });
  const log = ctx.getErrorLog();
  assertEqual(log[0].message, "juste une string", "reason converti en message");
});

// ═══════════════════════════════════════════════════════════════════════
// DÉDUPLICATION
// ═══════════════════════════════════════════════════════════════════════

test("deux erreurs identiques rapprochées fusionnent (compteur incrémenté)", () => {
  const ctx = loadErrors();
  const err = { message: "boom", filename: "js/game.js", lineno: 10, colno: 1 };
  ctx.window.__dispatch("error", err);
  ctx.window.__dispatch("error", err);
  ctx.window.__dispatch("error", err);
  const log = ctx.getErrorLog();
  assertEqual(log.length, 1, "une seule ligne pour 3 occurrences identiques");
  assertEqual(log[0].count, 3, "compteur cumulé");
});

test("deux erreurs différentes (message différent) restent séparées", () => {
  const ctx = loadErrors();
  ctx.window.__dispatch("error", { message: "boom A", filename: "js/game.js", lineno: 10 });
  ctx.window.__dispatch("error", { message: "boom B", filename: "js/game.js", lineno: 10 });
  assertEqual(ctx.getErrorLog().length, 2, "deux entrées distinctes");
});

test("même message mais fichier différent reste séparé", () => {
  const ctx = loadErrors();
  ctx.window.__dispatch("error", { message: "boom", filename: "js/game.js", lineno: 10 });
  ctx.window.__dispatch("error", { message: "boom", filename: "js/terminal.js", lineno: 10 });
  assertEqual(ctx.getErrorLog().length, 2, "deux entrées distinctes (source différente)");
});

// ═══════════════════════════════════════════════════════════════════════
// RING BUFFER (limite de taille)
// ═══════════════════════════════════════════════════════════════════════

test("le journal ne dépasse jamais ERR_LOG_MAX entrées distinctes", () => {
  const ctx = loadErrors();
  for (let i = 0; i < 30; i++) {
    ctx.window.__dispatch("error", { message: "erreur n°" + i, filename: "js/game.js", lineno: i });
  }
  const log = ctx.getErrorLog();
  assert(log.length <= 20, `le journal devrait être plafonné (obtenu: ${log.length})`);
});

test("le ring buffer garde les entrées les plus récentes (FIFO)", () => {
  const ctx = loadErrors();
  for (let i = 0; i < 25; i++) {
    ctx.window.__dispatch("error", { message: "erreur n°" + i, filename: "js/game.js", lineno: i });
  }
  const log = ctx.getErrorLog();
  const last = log[log.length - 1];
  assertEqual(last.message, "erreur n°24", "la toute dernière erreur doit être présente");
  assert(!log.some(e => e.message === "erreur n°0"), "la toute première erreur doit avoir été évincée");
});

// ═══════════════════════════════════════════════════════════════════════
// VIDAGE / ROBUSTESSE
// ═══════════════════════════════════════════════════════════════════════

test("clearErrorLog() vide le journal", () => {
  const ctx = loadErrors();
  ctx.window.__dispatch("error", { message: "boom", filename: "js/game.js", lineno: 1 });
  assertEqual(ctx.getErrorLog().length, 1);
  ctx.clearErrorLog();
  assertEqual(ctx.getErrorLog().length, 0, "journal vidé");
});

test("un localStorage qui lève une exception à l'écriture ne casse pas la capture", () => {
  const ctx = loadErrors();
  ctx.localStorage.setItem = () => { throw new Error("QuotaExceededError"); };
  // Ne doit pas lancer d'exception non gérée jusqu'ici dans le test :
  ctx.window.__dispatch("error", { message: "boom", filename: "js/game.js", lineno: 1 });
  assert(true, "logError() ne doit pas propager l'exception de setItem");
});

test("une entrée trop longue (message/stack) est tronquée", () => {
  const ctx = loadErrors();
  const longMsg = "x".repeat(1000);
  ctx.window.__dispatch("error", { message: longMsg, filename: "js/game.js", lineno: 1 });
  const log = ctx.getErrorLog();
  assert(log[0].message.length <= 300, "message tronqué à 300 caractères max");
});

// ═══════════════════════════════════════════════════════════════════════
// RAPPORT FINAL
// ═══════════════════════════════════════════════════════════════════════

console.log(`\n${pass} test(s) réussi(s), ${fail} échec(s) sur ${pass + fail} au total.\n`);
if (failures.length) {
  console.log("── Détail des échecs ──");
  failures.forEach(f => console.log(`✗ ${f.name}\n  → ${f.error}`));
  process.exitCode = 1;
} else {
  console.log("✅ Tous les tests passent.");
}
