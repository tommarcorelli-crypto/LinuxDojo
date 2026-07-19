// tests/boss.test.js
// Suite de tests unitaires pour le mode Boss Rush (js/boss.js) : verrouillage
// tant que les 7 boss ne sont pas vaincus, enchaînement automatique des 7
// combats, cœurs PARTAGÉS sur tout le parcours (pas remis à 3 par boss),
// interruption propre (fuite / choix d'un combat normal), et calcul du
// record (meilleur temps) persisté en localStorage.
//
// Comme game.js, boss.js est écrit pour tourner dans un navigateur (DOM,
// setTimeout pour les transitions visuelles). On l'exécute dans un contexte
// vm isolé avec un DOM minimal "stub" et un Terminal factice — assez pour ne
// pas planter, pas assez pour être un vrai navigateur. setTimeout est
// synchrone (exécute le callback immédiatement) pour rendre l'enchaînement
// du Rush testable sans attendre : ce fichier teste la logique, pas le
// timing visuel.
//
// Exécuter avec  node tests/boss.test.js

"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

let pass = 0, fail = 0;
const failures = [];

function test(name, fn) {
  try { fn(); pass++; }
  catch (e) { fail++; failures.push({ name, error: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || "assertion échouée"); }
function assertEqual(a, b, label) {
  assert(a === b, `${label || "valeur"} attendue: ${JSON.stringify(b)}, reçue: ${JSON.stringify(a)}`);
}

function makeFakeElement() {
  const el = {
    classList: {
      _set: new Set(),
      add(c) { this._set.add(c); },
      remove(c) { this._set.delete(c); },
      toggle(c, force) {
        if (force === true) { this._set.add(c); return; }
        if (force === false) { this._set.delete(c); return; }
        this._set.has(c) ? this._set.delete(c) : this._set.add(c);
      },
      contains(c) { return this._set.has(c); },
    },
    style: {}, dataset: {}, textContent: "", innerHTML: "", value: "", disabled: false,
    addEventListener() {}, removeEventListener() {},
    appendChild() {}, remove() {}, focus() {},
    querySelectorAll() { return []; }, querySelector() { return null; }, closest() { return null; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 0, height: 0 }; },
  };
  return el;
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

// Terminal factice : boss.js n'appelle jamais son vrai parseur dans ces
// tests (on déclenche les victoires/défaites directement via les méthodes
// internes de BossMode), donc de simples no-op suffisent.
function FakeTerminal(el) {
  this.el = el;
  this.state = {};
  this.ps1User = "";
}
["clear", "printOut", "printOk", "printErr", "printWarn", "printInfo", "printSep", "loadFS", "autocomplete"]
  .forEach(m => { FakeTerminal.prototype[m] = function () {}; });
FakeTerminal.prototype.run = function () { return { output: "" }; };

function buildSandbox(localStorageOverride) {
  const sandbox = {
    document: {
      getElementById() { return makeFakeElement(); },
      createElement() { return makeFakeElement(); },
      querySelectorAll() { return []; },
      querySelector() { return null; },
      body: makeFakeElement(),
    },
    window: { innerWidth: 1024, innerHeight: 768 },
    localStorage: localStorageOverride || makeFakeLocalStorage(),
    Terminal: FakeTerminal,
    t(key, vars) { let s = String(key); if (vars) for (const k in vars) s = s.split("{" + k + "}").join(vars[k]); return s; },
    // setTimeout synchrone : exécute le callback immédiatement, pour que
    // l'enchaînement automatique du Rush (chaîne de boss) soit testable
    // sans attendre les délais visuels réels (1000ms / 1800ms).
    setTimeout(fn) { fn(); return 0; },
    clearInterval() {},
    setInterval() { return 0; },
    console,
  };
  vm.createContext(sandbox);
  return sandbox;
}

function loadBoss(localStorageOverride) {
  const src = fs.readFileSync(path.join(__dirname, "..", "js", "boss.js"), "utf8");
  const exportLine = "\nvar __TEST_EXPORTS__ = { BossMode: BossMode, BOSS_FIGHTS: BOSS_FIGHTS };\n";
  const sandbox = buildSandbox(localStorageOverride);
  vm.runInContext(src + exportLine, sandbox, { filename: "js/boss.js" });
  return { ...sandbox.__TEST_EXPORTS__, localStorage: sandbox.localStorage };
}

function makeBossMode(ctx, opts) {
  const el = () => makeFakeElement();
  return new ctx.BossMode({
    listEl: el(), arenaEl: el(), avatarEl: el(), nameEl: el(), tagEl: el(),
    hpFill: el(), hpText: el(), heartsEl: el(), phaseEl: el(), descEl: el(),
    timerFill: el(), timerLbl: el(), hintBtn: el(), hintText: el(),
    termEl: el(), inputEl: el(), runBtn: el(), fleeBtn: el(),
    rushPanelEl: el(), rushRecordEl: el(), rushStartBtn: el(), rushBadgeEl: el(),
    ...opts,
  });
}

// ═══════════════════════════════════════════════════════════════════════
// DONNÉES
// ═══════════════════════════════════════════════════════════════════════

test("BOSS_FIGHTS contient 7 combats, le Sensei ferme la marche et exige les 6 autres", () => {
  const ctx = loadBoss();
  assertEqual(ctx.BOSS_FIGHTS.length, 7, "nombre de boss");
  const last = ctx.BOSS_FIGHTS[ctx.BOSS_FIGHTS.length - 1];
  assertEqual(last.id, "sensei", "dernier combat");
  assertEqual(last.requires, 6, "verrou du Sensei");
});

// ═══════════════════════════════════════════════════════════════════════
// VERROUILLAGE DU RUSH
// ═══════════════════════════════════════════════════════════════════════

test("renderRushPanel() : verrouillé tant que les 7 boss ne sont pas tous vaincus", () => {
  const ctx = loadBoss(Object.assign(makeFakeLocalStorage(), {
  }));
  const ls = ctx.localStorage;
  ls.setItem("linuxdojo_boss", JSON.stringify({ defeated: ["kraken", "spectre"] }));
  const bs = makeBossMode(ctx);
  bs.init();
  assert(bs.rushPanelEl.classList.contains("locked"), "panneau verrouillé");
  assertEqual(bs.rushStartBtn.disabled, true, "bouton désactivé");
});

test("renderRushPanel() : déverrouillé une fois les 7 boss vaincus", () => {
  const ctx = loadBoss();
  const ls = ctx.localStorage;
  ls.setItem("linuxdojo_boss", JSON.stringify({ defeated: ctx.BOSS_FIGHTS.map(b => b.id) }));
  const bs = makeBossMode(ctx);
  bs.init();
  assert(!bs.rushPanelEl.classList.contains("locked"), "panneau déverrouillé");
  assertEqual(bs.rushStartBtn.disabled, false, "bouton activé");
});

test("startRush() refuse de démarrer si tous les boss ne sont pas vaincus", () => {
  const ctx = loadBoss();
  const ls = ctx.localStorage;
  ls.setItem("linuxdojo_boss", JSON.stringify({ defeated: ["kraken"] }));
  const bs = makeBossMode(ctx);
  bs.init();
  bs.startRush();
  assertEqual(bs.rush, false, "le Rush ne démarre pas");
  assertEqual(bs.boss, null, "aucun combat lancé");
});

// ═══════════════════════════════════════════════════════════════════════
// ENCHAÎNEMENT COMPLET DU RUSH
// ═══════════════════════════════════════════════════════════════════════

function makeUnlockedBoss() {
  const ctx = loadBoss();
  ctx.localStorage.setItem("linuxdojo_boss", JSON.stringify({ defeated: ctx.BOSS_FIGHTS.map(b => b.id) }));
  const bs = makeBossMode(ctx);
  bs.init();
  return { ctx, bs };
}

test("startRush() enchaîne sur le premier boss avec 3 cœurs pleins", () => {
  const { bs } = makeUnlockedBoss();
  bs.startRush();
  assertEqual(bs.rush, true, "rush actif");
  assertEqual(bs.boss.id, "kraken", "premier combat du rush");
  assertEqual(bs.hearts, 3, "3 cœurs au départ");
  assertEqual(bs.rushIdx, 0, "index de départ");
});

test("Rush complet : les 7 victoires s'enchaînent automatiquement jusqu'à la fin", () => {
  const { ctx, bs } = makeUnlockedBoss();
  bs.startRush();
  const seenOrder = [bs.boss.id];
  // Une victoire par boss ; setTimeout synchrone => le combat suivant est
  // déjà chargé (bs.boss) dès le retour de _victory().
  for (let i = 0; i < ctx.BOSS_FIGHTS.length; i++) {
    bs._victory();
    if (bs.boss) seenOrder.push(bs.boss.id);
  }
  assertEqual(bs.rush, false, "le rush est terminé");
  assertEqual(bs.rushIdx, ctx.BOSS_FIGHTS.length, "tous les boss comptés");
  assert(typeof bs.rushBest === "number" && bs.rushBest >= 0, "un temps a été enregistré");
  const stored = parseInt(ctx.localStorage.getItem("linuxdojo_bossrush_best"), 10);
  assertEqual(stored, bs.rushBest, "le record est persisté en localStorage");
});

test("Rush : un cœur perdu reste perdu d'un boss à l'autre (pas remis à 3)", () => {
  const { bs } = makeUnlockedBoss();
  bs.startRush();
  bs.hearts = 1; // simule 2 cœurs perdus pendant le combat contre kraken
  bs._victory(); // kraken vaincu -> enchaîne sur spectre
  assertEqual(bs.boss.id, "spectre", "boss suivant chargé");
  assertEqual(bs.hearts, 1, "les cœurs ne sont PAS réinitialisés en rush");
});

test("Rush : un K.O. arrête tout le parcours (pas de simple retry du combat)", () => {
  const { bs } = makeUnlockedBoss();
  bs.startRush();
  bs._defeat();
  assertEqual(bs.rush, false, "le rush s'arrête");
});

test("Choisir un combat normal dans la liste interrompt proprement un Rush en cours", () => {
  const { bs } = makeUnlockedBoss();
  bs.startRush();
  bs.startFight("spectre"); // pas de rushContinue => sortie du rush
  assertEqual(bs.rush, false, "rush interrompu");
  assertEqual(bs.hearts, 3, "cœurs remis à 3 hors rush");
  assertEqual(bs.boss.id, "spectre", "le combat normal démarre bien");
});

// ═══════════════════════════════════════════════════════════════════════
// FORMATAGE DU CHRONO
// ═══════════════════════════════════════════════════════════════════════

test("_fmtRushTime() formate en mm:ss", () => {
  const { bs } = makeUnlockedBoss();
  assertEqual(bs._fmtRushTime(5000), "00:05", "5 secondes");
  assertEqual(bs._fmtRushTime(65000), "01:05", "65 secondes");
  assertEqual(bs._fmtRushTime(600000), "10:00", "10 minutes");
});

// ═══════════════════════════════════════════════════════════════════════

console.log(`\n${pass} test(s) réussi(s), ${fail} échec(s) sur ${pass + fail} au total.\n`);
if (fail > 0) {
  console.log("Échecs :");
  failures.forEach(f => console.log(`  ✗ ${f.name}\n    ${f.error}`));
  console.log("");
  process.exit(1);
} else {
  console.log("✅ Tous les tests passent.");
}
