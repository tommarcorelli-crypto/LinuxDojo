// tests/challenges.test.js
// Suite de tests unitaires pour les défis chrono (js/challenges.js) qui
// exploitent les commandes d'administration récemment ajoutées (systemctl,
// journalctl, crontab, dig/nslookup — défis 21-24). On fait vraiment tourner
// le simulateur de shell (js/terminal.js) sur la `fs` de chaque défi, avec la
// solution attendue, et on vérifie que `check()` valide — comme un joueur qui
// tape la bonne commande. On vérifie aussi qu'une commande à côté échoue.
//
// Exécuter avec  node tests/challenges.test.js

"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

if (typeof document === "undefined") {
  global.document = { createElement: () => ({}) };
}
if (typeof global.sh === "undefined") global.sh = (fr) => fr;
if (typeof global.LANG === "undefined") global.LANG = "fr";
if (typeof global.dateLocale === "undefined") global.dateLocale = () => "fr-FR";

const { Terminal } = require(path.join(__dirname, "..", "js", "terminal.js"));

let pass = 0, fail = 0;
const failures = [];

function test(name, fn) {
  try { fn(); pass++; }
  catch (e) { fail++; failures.push({ name, error: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || "assertion échouée"); }

function makeEl() { return { innerHTML: "", appendChild() {}, scrollTop: 0, scrollHeight: 0 }; }

// challenges.js n'est pas un module Node (déclarations top-level `const`) :
// on le charge dans un contexte vm et on récupère CHALLENGES via une ligne
// `var` ajoutée à la suite, comme pour game.js/boss.js dans les autres suites.
function loadChallenges() {
  const src = fs.readFileSync(path.join(__dirname, "..", "js", "challenges.js"), "utf8");
  const sandbox = { console };
  vm.createContext(sandbox);
  vm.runInContext(src + "\nvar __EXPORT__ = CHALLENGES;\n", sandbox, { filename: "js/challenges.js" });
  return sandbox.__EXPORT__;
}

function runSolution(ch, solution) {
  const t = new Terminal(makeEl());
  t.loadFS(ch.fs);
  const result = t.run(solution);
  const out = (result.output || "").toLowerCase();
  return { ok: !!ch.check(out, t.state), out: result.output };
}

const CHALLENGES = loadChallenges();
function byId(id) {
  const ch = CHALLENGES.find(c => c.id === id);
  assert(ch, `le défi ${id} existe`);
  return ch;
}

// ═══════════════════════════════════════════════════════════════════════
// DÉFI 21 — Services (systemctl status)
// ═══════════════════════════════════════════════════════════════════════

test("Défi 21 : 'systemctl status nginx' valide le défi Services", () => {
  const ch = byId(21);
  const { ok, out } = runSolution(ch, "systemctl status nginx");
  assert(ok, "la solution officielle doit réussir : " + out);
});

test("Défi 21 : consulter un AUTRE service (ssh) ne valide pas le défi", () => {
  const ch = byId(21);
  const { ok } = runSolution(ch, "systemctl status ssh");
  assert(!ok, "un autre service ne doit pas valider le défi nginx");
});

// ═══════════════════════════════════════════════════════════════════════
// DÉFI 22 — Logs (journalctl -u)
// ═══════════════════════════════════════════════════════════════════════

test("Défi 22 : 'journalctl -u nginx' valide le défi Logs", () => {
  const ch = byId(22);
  const { ok, out } = runSolution(ch, "journalctl -u nginx");
  assert(ok, "la solution officielle doit réussir : " + out);
});

test("Défi 22 : les logs d'un autre service (cron) ne valident pas le défi", () => {
  const ch = byId(22);
  const { ok } = runSolution(ch, "journalctl -u cron");
  assert(!ok, "les logs d'un autre service ne doivent pas valider le défi nginx");
});

// ═══════════════════════════════════════════════════════════════════════
// DÉFI 23 — Planification (crontab fichier)
// ═══════════════════════════════════════════════════════════════════════

test("Défi 23 : 'crontab taches.cron' valide le défi Planification", () => {
  const ch = byId(23);
  const { ok, out } = runSolution(ch, "crontab taches.cron");
  assert(ok, "la solution officielle doit réussir : " + out);
});

test("Défi 23 : 'crontab -l' seul (sans avoir rien installé) ne valide pas le défi", () => {
  const ch = byId(23);
  const { ok } = runSolution(ch, "crontab -l");
  assert(!ok, "lister une crontab vide ne doit pas valider l'installation");
});

// ═══════════════════════════════════════════════════════════════════════
// DÉFI 24 — Réseau (dig / nslookup)
// ═══════════════════════════════════════════════════════════════════════

test("Défi 24 : 'dig intranet.dojo.lan' valide le défi Réseau", () => {
  const ch = byId(24);
  const { ok, out } = runSolution(ch, "dig intranet.dojo.lan");
  assert(ok, "la solution officielle (dig) doit réussir : " + out);
});

test("Défi 24 : 'nslookup intranet.dojo.lan' (solution alternative) valide aussi le défi", () => {
  const ch = byId(24);
  const { ok, out } = runSolution(ch, "nslookup intranet.dojo.lan");
  assert(ok, "la solution alternative (nslookup) doit réussir : " + out);
});

test("Défi 24 : résoudre un AUTRE nom de la zone ne valide pas le défi", () => {
  const ch = byId(24);
  const { ok } = runSolution(ch, "dig dojo.lan");
  assert(!ok, "un autre nom résolu ne doit pas valider le défi intranet.dojo.lan");
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
