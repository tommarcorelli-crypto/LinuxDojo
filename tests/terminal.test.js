// tests/terminal.test.js
// Suite de tests unitaires pour le simulateur de shell (js/terminal.js).
// Aucune dépendance externe : exécuter avec  node tests/terminal.test.js
//
// Ces tests protègent le cœur du projet (le parseur de commandes) contre
// les régressions lors de futures évolutions. Si un de ces tests casse
// après une modification de terminal.js, c'est probablement un vrai bug.

"use strict";
const path = require("path");

// Le simulateur appelle document.createElement() pour afficher les lignes
// à l'écran. En dehors du navigateur, on fournit un stub minimal : ses
// valeurs ne sont jamais lues par les tests (on ne regarde que le retour
// de term.run()), seule l'absence de crash compte.
if (typeof document === "undefined") {
  global.document = { createElement: () => ({}) };
}

const { Terminal } = require(path.join(__dirname, "..", "js", "terminal.js"));

// ─────────────────────────────────────────────────────────────────────────
// Mini framework de test (zéro dépendance)
// ─────────────────────────────────────────────────────────────────────────
let pass = 0, fail = 0;
const failures = [];

function makeTerm(fs, opts) {
  const el = { innerHTML: "", scrollTop: 0, scrollHeight: 0, appendChild() {} };
  const t = new Terminal(el);
  t.loadFS(fs || {}, opts);
  return t;
}

function runSeq(term, script) {
  // Exécute une séquence "cmd1 && cmd2 && cmd3" comme le fait le hint runner
  // des missions ; renvoie le résultat de la DERNIÈRE commande.
  let res = { output: "", error: false };
  for (const line of script.split("&&").map(s => s.trim())) {
    res = term.run(line);
  }
  return res;
}

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
function assertIncludes(haystack, needle, label) {
  assert((haystack || "").includes(needle), `${label || "sortie"} devrait contenir ${JSON.stringify(needle)}, reçu: ${JSON.stringify(haystack)}`);
}
function assertMatches(haystack, re, label) {
  assert(re.test(haystack || ""), `${label || "sortie"} devrait matcher ${re}, reçu: ${JSON.stringify(haystack)}`);
}
function assertEqual(actual, expected, label) {
  assert(actual === expected, `${label || "valeur"} attendu ${JSON.stringify(expected)}, reçu ${JSON.stringify(actual)}`);
}

// ═══════════════════════════════════════════════════════════════════════
// NAVIGATION & FICHIERS
// ═══════════════════════════════════════════════════════════════════════

test("ls liste les fichiers du dossier courant", () => {
  const t = makeTerm({ "a.txt": { type: "file", content: "1" }, "b.txt": { type: "file", content: "2" } });
  const r = t.run("ls");
  assertIncludes(r.output, "a.txt");
  assertIncludes(r.output, "b.txt");
});

test("cd change de dossier puis pwd le confirme", () => {
  const t = makeTerm({ "sub": { type: "dir" } });
  t.run("cd sub");
  const r = t.run("pwd");
  assertIncludes(r.output, "/sub");
});

test("cd .. remonte d'un niveau", () => {
  const t = makeTerm({ "sub": { type: "dir" } });
  t.run("cd sub");
  t.run("cd ..");
  const r = t.run("pwd");
  assert(!r.output.includes("/sub"), "ne devrait plus être dans sub");
});

test("mkdir crée un dossier utilisable ensuite", () => {
  const t = makeTerm({});
  t.run("mkdir projet");
  const r2 = runSeq(t, "cd projet && pwd");
  assertIncludes(r2.output, "/projet");
});

test("touch crée un fichier vide détectable par ls", () => {
  const t = makeTerm({});
  t.run("touch note.txt");
  const r = t.run("ls");
  assertIncludes(r.output, "note.txt");
});

test("cp copie le contenu d'un fichier", () => {
  const t = makeTerm({ "src.txt": { type: "file", content: "contenu original" } });
  t.run("cp src.txt dest.txt");
  const r = t.run("cat dest.txt");
  assertIncludes(r.output, "contenu original");
});

test("mv renomme un fichier (l'original disparaît)", () => {
  const t = makeTerm({ "old.txt": { type: "file", content: "x" } });
  t.run("mv old.txt new.txt");
  const r = t.run("ls");
  assertIncludes(r.output, "new.txt");
  assert(!r.output.includes("old.txt"), "old.txt ne devrait plus exister");
});

test("rm supprime un fichier", () => {
  const t = makeTerm({ "a.txt": { type: "file", content: "x" } });
  t.run("rm a.txt");
  const r = t.run("ls");
  assert(!r.output.includes("a.txt"), "a.txt devrait avoir disparu");
});

test("rm -rf / est refusé (garde-fou de sécurité)", () => {
  const t = makeTerm({});
  const r = t.run("rm -rf /");
  assertEqual(r.error, true, "erreur attendue");
  assertIncludes(r.output.toLowerCase(), "sérieuse", "message de refus");
});

// ═══════════════════════════════════════════════════════════════════════
// TEXTE : cat, grep, sort, uniq, wc, cut, head, tail
// ═══════════════════════════════════════════════════════════════════════

test("cat affiche le contenu d'un fichier", () => {
  const t = makeTerm({ "f.txt": { type: "file", content: "bonjour\nmonde" } });
  const r = t.run("cat f.txt");
  assertIncludes(r.output, "bonjour");
  assertIncludes(r.output, "monde");
});

test("grep filtre les lignes correspondantes", () => {
  const t = makeTerm({ "log.txt": { type: "file", content: "ok\nERROR disque plein\nok\nERROR réseau" } });
  const r = t.run("grep ERROR log.txt");
  assertIncludes(r.output, "disque plein");
  assertIncludes(r.output, "réseau");
  assert(!r.output.includes("\nok"), "les lignes 'ok' ne doivent pas apparaître");
});

test("wc -l compte les lignes", () => {
  const t = makeTerm({ "f.txt": { type: "file", content: "a\nb\nc" } });
  const r = t.run("wc -l f.txt");
  assertIncludes(r.output, "3");
});

test("sort trie les lignes, uniq déduplique après sort", () => {
  const t = makeTerm({ "f.txt": { type: "file", content: "banane\npomme\nbanane\nabricot" } });
  const sorted = t.run("sort f.txt").output.split("\n");
  assertEqual(sorted[0], "abricot", "première ligne triée");
  const r = t.run("sort f.txt | uniq");
  const lines = r.output.split("\n");
  assertEqual(lines.length, 3, "3 valeurs uniques attendues");
});

// ═══════════════════════════════════════════════════════════════════════
// PIPES & REDIRECTIONS
// ═══════════════════════════════════════════════════════════════════════

test("pipe simple : cat | grep", () => {
  const t = makeTerm({ "f.txt": { type: "file", content: "chat\nchien\nchèvre" } });
  const r = t.run("cat f.txt | grep ch");
  assertIncludes(r.output, "chat");
  assertIncludes(r.output, "chèvre");
});

test("pipe en chaîne : cat | grep | wc -l", () => {
  const t = makeTerm({ "f.txt": { type: "file", content: "a1\nb2\na3\nb4\na5" } });
  const r = t.run("cat f.txt | grep a | wc -l");
  assertEqual(r.output.trim(), "3");
});

test("redirection > écrase le fichier", () => {
  const t = makeTerm({ "f.txt": { type: "file", content: "ancien contenu" } });
  t.run("echo nouveau > f.txt");
  const r = t.run("cat f.txt");
  assertEqual(r.output.trim(), "nouveau");
});

test("redirection >> ajoute au fichier", () => {
  const t = makeTerm({});
  t.run("echo ligne1 > f.txt");
  t.run("echo ligne2 >> f.txt");
  const r = t.run("cat f.txt");
  assertIncludes(r.output, "ligne1");
  assertIncludes(r.output, "ligne2");
});

// ═══════════════════════════════════════════════════════════════════════
// JOKERS, VARIABLES, SUBSTITUTION DE COMMANDE
// ═══════════════════════════════════════════════════════════════════════

test("les jokers *.txt filtrent correctement", () => {
  const t = makeTerm({
    "a.txt": { type: "file", content: "1" },
    "b.log": { type: "file", content: "2" },
    "c.txt": { type: "file", content: "3" },
  });
  const r = t.run("ls *.txt");
  assertIncludes(r.output, "a.txt");
  assertIncludes(r.output, "c.txt");
  assert(!r.output.includes("b.log"), "b.log ne doit pas matcher *.txt");
});

test("affectation de variable et lecture avec $", () => {
  const t = makeTerm({});
  t.run("x=42");
  const r = t.run("echo $x");
  assertEqual(r.output.trim(), "42");
});

test("substitution de commande $(...)", () => {
  const t = makeTerm({ "a.txt": {type:"file",content:"1"}, "b.txt": {type:"file",content:"2"} });
  const r = t.run("echo $(ls | wc -l)");
  assertEqual(r.output.trim(), "2");
});

// ═══════════════════════════════════════════════════════════════════════
// SCRIPTING : for, if, bash
// ═══════════════════════════════════════════════════════════════════════

test("boucle for itère sur les fichiers correspondants", () => {
  const t = makeTerm({
    "a.txt": { type: "file", content: "1" },
    "b.txt": { type: "file", content: "2" },
  });
  const r = runSeq(t, 'for f in *.txt; do echo $f; done');
  assertIncludes(r.output, "a.txt");
  assertIncludes(r.output, "b.txt");
});

test("if [ -f fichier ] détecte la présence d'un fichier", () => {
  const t = makeTerm({ "present.txt": { type: "file", content: "x" } });
  const r = runSeq(t, 'if [ -f present.txt ]; then echo oui; else echo non; fi');
  assertIncludes(r.output, "oui");
});

test("bash exécute un script multi-lignes", () => {
  const t = makeTerm({
    "deploy.sh": { type: "file", content: "echo debut\necho fin" },
  });
  const r = t.run("bash deploy.sh");
  assertIncludes(r.output, "debut");
  assertIncludes(r.output, "fin");
});

// ═══════════════════════════════════════════════════════════════════════
// PERMISSIONS : chmod, chown, chgrp
// ═══════════════════════════════════════════════════════════════════════

test("chmod +x rend un script exécutable", () => {
  const t = makeTerm({ "s.sh": { type: "file", content: "echo hi" } });
  t.run("chmod +x s.sh");
  const r = t.run("ls -l s.sh");
  assertMatches(r.output, /x/, "les droits d'exécution doivent apparaître");
});

test("chown change le propriétaire visible dans ls -l", () => {
  const t = makeTerm({ "f.txt": { type: "file", content: "x" } });
  t.run("chown sensei:dojo f.txt");
  const r = t.run("ls -l f.txt");
  assertIncludes(r.output, "sensei");
  assertIncludes(r.output, "dojo");
});

test("chgrp change uniquement le groupe", () => {
  const t = makeTerm({ "f.txt": { type: "file", content: "x" } });
  t.run("chgrp admins f.txt");
  const r = t.run("ls -l f.txt");
  assertIncludes(r.output, "admins");
});

// ═══════════════════════════════════════════════════════════════════════
// UTILITAIRES : alias, xargs, diff, jobs/fg
// ═══════════════════════════════════════════════════════════════════════

test("alias crée un raccourci utilisable immédiatement", () => {
  const t = makeTerm({ "a.txt": { type: "file", content: "x" } });
  t.run("alias ll='ls -la'");
  const r = t.run("ll");
  assertIncludes(r.output, "a.txt");
});

test("unalias supprime un alias existant", () => {
  const t = makeTerm({});
  t.run("alias ll='ls -la'");
  t.run("unalias ll");
  const r = t.run("ll");
  assertEqual(r.error, true, "ll ne devrait plus être reconnu");
});

test("diff détecte une ligne différente entre deux fichiers", () => {
  const t = makeTerm({
    "a.txt": { type: "file", content: "ligne1\nligne2\nligne3" },
    "b.txt": { type: "file", content: "ligne1\nligneX\nligne3" },
  });
  const r = t.run("diff a.txt b.txt");
  assertIncludes(r.output, "ligne2");
  assertIncludes(r.output, "ligneX");
});

test("diff ne produit rien pour deux fichiers identiques", () => {
  const t = makeTerm({
    "a.txt": { type: "file", content: "même contenu" },
    "b.txt": { type: "file", content: "même contenu" },
  });
  const r = t.run("diff a.txt b.txt");
  assertEqual(r.output.trim(), "");
});

test("xargs applique une commande à chaque token reçu", () => {
  const t = makeTerm({ "a.txt": {type:"file",content:"1"}, "b.txt": {type:"file",content:"22"} });
  const r = t.run("echo a.txt b.txt | xargs wc -l");
  assertMatches(r.output, /a\.txt/);
  assertMatches(r.output, /b\.txt/);
});

test("cmd & crée un job listé par jobs, puis récupérable par fg", () => {
  const t = makeTerm({});
  const bg = t.run("echo tache_de_fond &");
  assertMatches(bg.output, /^\[1\] \d+/, "un numéro de job doit être retourné");
  const jobsOut = t.run("jobs");
  assertIncludes(jobsOut.output, "echo tache_de_fond");
  const fgOut = t.run("fg");
  assertIncludes(fgOut.output, "tache_de_fond");
  const jobsAfter = t.run("jobs");
  assertEqual(jobsAfter.output, "", "plus aucun job après fg");
});

// ═══════════════════════════════════════════════════════════════════════
// RÉSEAU : ssh, scp, netstat
// ═══════════════════════════════════════════════════════════════════════

test("ssh change le prompt et expose l'hôte/utilisateur dans le state", () => {
  const t = makeTerm({});
  const r = t.run("ssh admin@webserver01");
  assertEqual(r.error, false);
  assertEqual(t.state.sshHost, "webserver01");
  assertEqual(t.state.sshUser, "admin");
  assertIncludes(t.promptStr(), "admin@webserver01");
});

test("ssh refuse un format invalide (pas de user@hôte)", () => {
  const t = makeTerm({});
  const r = t.run("ssh webserver01");
  assertEqual(r.error, true);
});

test("netstat liste des services en LISTEN", () => {
  const t = makeTerm({});
  const r = t.run("netstat");
  assertMatches(r.output, /LISTEN/);
});

test("scp échoue si le fichier source n'existe pas", () => {
  const t = makeTerm({});
  const r = t.run("scp absent.txt admin@webserver01:/var/www");
  assertEqual(r.error, true);
});

test("scp réussit et enregistre fichier/hôte/chemin dans le state", () => {
  const t = makeTerm({ "deploy.sh": { type: "file", content: "echo hi" } });
  t.run("scp deploy.sh admin@webserver01:/var/www");
  assertEqual(t.state.scp.file, "deploy.sh");
  assertEqual(t.state.scp.host, "webserver01");
});

test("exit en SSH déconnecte et restaure le prompt local", () => {
  const t = makeTerm({});
  t.run("ssh admin@webserver01");
  assertIncludes(t.promptStr(), "webserver01");
  const r = t.run("exit");
  assertIncludes(r.output.toLowerCase(), "fermée");
  assertEqual(t.state.sshExit, "webserver01");
  assert(!t.promptStr().includes("webserver01"), "le prompt doit être revenu en local");
});

test("exit hors SSH garde l'ancien easter egg (pas de fausse déconnexion)", () => {
  const t = makeTerm({});
  const r = t.run("exit");
  assertIncludes(r.output.toLowerCase(), "dojo");
});

// ═══════════════════════════════════════════════════════════════════════
// GIT (simulation)
// ═══════════════════════════════════════════════════════════════════════

test("git refuse toute commande avant 'git init'", () => {
  const t = makeTerm({});
  const r = t.run("git status");
  assertEqual(r.error, true);
  assertIncludes(r.output.toLowerCase(), "git init");
});

test("cycle complet : init → add → commit → log", () => {
  const t = makeTerm({ "app.py": { type: "file", content: "print(1)" } });
  t.run("git init");
  t.run("git add app.py");
  const commitRes = t.run('git commit -m "premier commit"');
  assertIncludes(commitRes.output, "premier commit");
  const logRes = t.run("git log");
  assertIncludes(logRes.output, "premier commit");
});

test("git commit échoue si rien n'est en scène", () => {
  const t = makeTerm({ "app.py": { type: "file", content: "x" } });
  t.run("git init");
  const r = t.run('git commit -m "rien"');
  assertEqual(r.error, true);
});

test("git checkout -b crée et bascule sur une nouvelle branche", () => {
  const t = makeTerm({});
  t.run("git init");
  t.run("git checkout -b feature-x");
  const r = t.run("git branch");
  assertMatches(r.output, /\*\s*feature-x/, "feature-x doit être marquée comme branche active");
});

test("git status affiche 'propre' une fois tout committé", () => {
  const t = makeTerm({ "a.txt": { type: "file", content: "x" } });
  t.run("git init");
  t.run("git add .");
  t.run('git commit -m "init"');
  const r = t.run("git status");
  assertIncludes(r.output.toLowerCase(), "propre");
});

// ═══════════════════════════════════════════════════════════════════════
// ROBUSTESSE
// ═══════════════════════════════════════════════════════════════════════

test("une commande inconnue renvoie une erreur propre (pas de crash)", () => {
  const t = makeTerm({});
  const r = t.run("blablabla_inexistant");
  assertEqual(r.error, true);
});

test("cat sur un fichier inexistant renvoie une erreur (pas de crash)", () => {
  const t = makeTerm({});
  const r = t.run("cat ne_existe_pas.txt");
  assertEqual(r.error, true);
});

test("une ligne vide ne crashe pas", () => {
  const t = makeTerm({});
  const r = t.run("");
  assertEqual(r.error, false);
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
