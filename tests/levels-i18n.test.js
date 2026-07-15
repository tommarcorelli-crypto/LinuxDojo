// tests/levels-i18n.test.js
// Vérifie l'overlay de traduction des scénarios (js/i18n/levels.en.js) :
//   1. En LANG="en", CHAPTERS est bien traduit par overlayLevels().
//   2. En LANG="fr", CHAPTERS reste intact (aucune mutation).
//   3. Aucun overlay orphelin : tout id de chapitre/mission de LEVELS_EN
//      correspond à un id réel de CHAPTERS (attrape les fautes de frappe).
//   4. Les tableaux options/examples traduits ont la bonne longueur.
// Zéro dépendance : node tests/levels-i18n.test.js
//
// i18n.js + levels.js + levels.en.js sont concaténés et exécutés dans UN
// seul contexte vm (les déclarations const/let de niveau racine ne sont
// visibles que dans le même programme). Stubs navigateur minimaux ; on force
// la langue via navigator.language, et document.readyState="loading" pour
// que initI18n() reste différé (non exécuté ici).

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

const ROOT = path.join(__dirname, "..");
function read(rel) { return fs.readFileSync(path.join(ROOT, rel), "utf8"); }

// Charge i18n + levels + overlay dans un contexte vm, pour une langue donnée.
function load(navLang) {
  const store = {};
  const sandbox = {
    navigator: { language: navLang },
    localStorage: {
      getItem(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
      setItem(k, v) { store[k] = String(v); },
    },
    document: {
      readyState: "loading",
      documentElement: {},
      addEventListener() {},
      querySelectorAll() { return []; },
      querySelector() { return null; },
    },
    console,
  };
  const src =
    read("js/i18n.js") + "\n" +
    read("js/levels.js") + "\n" +
    read("js/i18n/levels.en.js") + "\n" +
    read("js/quizzes.js") + "\n" +
    read("js/i18n/quizzes.en.js") + "\n" +
    read("js/glossary.js") + "\n" +
    read("js/i18n/glossary.en.js") + "\n" +
    read("js/challenges.js") + "\n" +
    read("js/i18n/challenges.en.js") + "\n" +
    read("js/bandit.js") + "\n" +
    read("js/i18n/bandit.en.js") + "\n" +
    read("js/expert.js") + "\n" +
    read("js/i18n/expert.en.js") + "\n" +
    read("js/objectives.js") + "\n" +
    read("js/i18n/objectives.en.js") + "\n" +
    read("js/seasonal.js") + "\n" +
    read("js/i18n/seasonal.en.js") + "\n" +
    read("js/kata.js") + "\n" +
    read("js/i18n/kata.en.js") + "\n" +
    read("js/daily.js") + "\n" +
    read("js/i18n/daily.en.js") + "\n" +
    read("js/boss.js") + "\n" +
    read("js/i18n/boss.en.js") + "\n" +
    "var __EXPORTS__ = { CHAPTERS, LEVELS_EN, QUIZZES, QUIZZES_EN, GLOSSARY, GLOSSARY_EN, glossCat, " +
    "CHALLENGES, CHALLENGES_EN, BANDIT_LEVELS, BANDIT_LEVELS_EN, EXPERT_MISSIONS, EXPERT_MISSIONS_EN, " +
    "OBJECTIVES, OBJECTIVES_EN, SEASONAL_EVENTS, SEASONAL_EVENTS_EN, KATAS, KATAS_EN, DAILY_POOL, DAILY_POOL_EN, " +
    "BOSS_FIGHTS, BOSS_FIGHTS_EN, LANG };\n";
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: "levels-i18n-bundle.js" });
  return sandbox.__EXPORTS__;
}

function chapterById(chapters, id) { return chapters.find(c => c.id === id); }
function missionById(chapter, id) { return chapter.missions.find(m => m.id === id); }

// ═══════════════════════════════════════════════════════════════
// EN : l'overlay est appliqué
// ═══════════════════════════════════════════════════════════════
test("LANG=en : overlayLevels() traduit titre + scénario du chapitre 1", () => {
  const { CHAPTERS, LANG } = load("en-US");
  assertEqual(LANG, "en", "LANG");
  const ch1 = chapterById(CHAPTERS, 1);
  assert(/Scenario 1/.test(ch1.title), "titre chapitre 1 en anglais, reçu: " + ch1.title);
  assert(/SSH/.test(ch1.scenario), "scénario chapitre 1 en anglais, reçu: " + ch1.scenario);
});

test("LANG=en : mission 1 traduite (name, lesson, desc, hint, explanation)", () => {
  const { CHAPTERS } = load("en-US");
  const m1 = missionById(chapterById(CHAPTERS, 1), 1);
  assertEqual(m1.name, "Step 1 — See what's there", "name");
  assert(/List files/.test(m1.lesson.title), "lesson.title");
  assert(/flashlight/.test(m1.lesson.intro), "lesson.intro");
  assert(/current directory/.test(m1.desc), "desc");
  assert(/list files/i.test(m1.hint), "hint");
  assert(/starting point/.test(m1.explanation), "explanation");
});

test("LANG=en : options et examples de la mission 1 traduits (par index)", () => {
  const { CHAPTERS } = load("en-US");
  const m1 = missionById(chapterById(CHAPTERS, 1), 1);
  // Les flags/cmd ne changent pas, seuls desc/comment sont traduits
  assertEqual(m1.lesson.options[0].flag, "-l", "flag inchangé");
  assert(/Long format/.test(m1.lesson.options[0].desc), "option desc traduite");
  assert(/current directory/.test(m1.lesson.examples[0].comment), "example comment traduit");
});

// ═══════════════════════════════════════════════════════════════
// FR : rien n'est modifié
// ═══════════════════════════════════════════════════════════════
test("LANG=fr : CHAPTERS reste en français (overlay inactif)", () => {
  const { CHAPTERS } = load("fr-FR");
  const ch1 = chapterById(CHAPTERS, 1);
  assert(/Scénario 1/.test(ch1.title), "titre reste FR, reçu: " + ch1.title);
  const m1 = missionById(ch1, 1);
  assert(/Voir ce qu'il y a/.test(m1.name), "name reste FR");
});

// ═══════════════════════════════════════════════════════════════
// Intégrité : pas d'overlay orphelin, longueurs de tableaux cohérentes
// ═══════════════════════════════════════════════════════════════
test("aucun id d'overlay orphelin (chapitre/mission inexistant dans CHAPTERS)", () => {
  const { CHAPTERS, LEVELS_EN } = load("fr-FR");
  const problems = [];
  for (const chId of Object.keys(LEVELS_EN)) {
    const ch = chapterById(CHAPTERS, Number(chId));
    if (!ch) { problems.push("chapitre " + chId); continue; }
    const miss = LEVELS_EN[chId].missions || {};
    for (const mId of Object.keys(miss)) {
      if (!missionById(ch, Number(mId))) problems.push("mission " + mId + " (chap " + chId + ")");
    }
  }
  assert(problems.length === 0, "overlays orphelins : " + problems.join(", "));
});

test("options/examples traduits ont la même longueur que la source", () => {
  const { CHAPTERS, LEVELS_EN } = load("fr-FR"); // FR pour lire les longueurs source
  const problems = [];
  for (const chId of Object.keys(LEVELS_EN)) {
    const ch = chapterById(CHAPTERS, Number(chId));
    const miss = LEVELS_EN[chId].missions || {};
    for (const mId of Object.keys(miss)) {
      const src = missionById(ch, Number(mId));
      const ov = miss[mId];
      if (!ov.lesson || !src.lesson) continue;
      if (ov.lesson.options && src.lesson.options && ov.lesson.options.length !== src.lesson.options.length)
        problems.push(`options mission ${mId}: ${ov.lesson.options.length}≠${src.lesson.options.length}`);
      if (ov.lesson.examples && src.lesson.examples && ov.lesson.examples.length !== src.lesson.examples.length)
        problems.push(`examples mission ${mId}: ${ov.lesson.examples.length}≠${src.lesson.examples.length}`);
    }
  }
  assert(problems.length === 0, "longueurs incohérentes : " + problems.join(", "));
});

// ═══════════════════════════════════════════════════════════════
// Complétude : chaque chapitre/mission a un overlay (Phase B finie)
// ═══════════════════════════════════════════════════════════════
test("chaque chapitre et chaque mission de CHAPTERS a un overlay EN", () => {
  const { CHAPTERS, LEVELS_EN } = load("fr-FR");
  const missing = [];
  for (const ch of CHAPTERS) {
    const co = LEVELS_EN[ch.id];
    if (!co) { missing.push("chapitre " + ch.id); continue; }
    if (!co.title || !co.scenario) missing.push("chap " + ch.id + " (title/scenario)");
    for (const m of ch.missions) {
      const mo = (co.missions || {})[m.id];
      if (!mo) { missing.push("mission " + m.id); continue; }
      for (const f of ["name", "desc", "hint", "explanation"]) {
        if (!mo[f]) missing.push(`mission ${m.id} (champ ${f})`);
      }
    }
  }
  assert(missing.length === 0, "overlays manquants : " + missing.join(", "));
});

// ═══════════════════════════════════════════════════════════════
// Littéraux : filenames / chemins / valeurs identiques en EN
// (un <code> contenant . ou / ne doit JAMAIS être traduit, sinon
//  le joueur tape une valeur qui ne passe pas le check)
// ═══════════════════════════════════════════════════════════════
function codeLiterals(s) {
  const out = [];
  if (!s) return out;
  for (const m of s.matchAll(/<code>([^<]*)<\/code>/g)) {
    if (/[.\/]/.test(m[1])) out.push(m[1]);
  }
  return out;
}
test("les <code> avec . ou / (fichiers, chemins, hôtes, valeurs) sont identiques en EN", () => {
  const { CHAPTERS, LEVELS_EN } = load("fr-FR");
  const problems = [];
  for (const ch of CHAPTERS) {
    const co = LEVELS_EN[ch.id] || {};
    for (const m of ch.missions) {
      const ov = (co.missions || {})[m.id];
      if (!ov) continue;
      const frLits = [
        ...codeLiterals(m.desc), ...codeLiterals(m.hint), ...codeLiterals(m.explanation),
      ];
      const enText = (ov.desc || "") + "\n" + (ov.hint || "") + "\n" + (ov.explanation || "");
      for (const lit of frLits) {
        if (!enText.includes(lit)) problems.push(`mission ${m.id}: « ${lit} » absent de la version EN`);
      }
    }
  }
  assert(problems.length === 0, problems.join(" | "));
});

// ═══════════════════════════════════════════════════════════════
// Quiz : overlay appliqué, réponses inchangées, complétude
// ═══════════════════════════════════════════════════════════════
test("LANG=en : overlayQuizzes() traduit questions et options", () => {
  const { QUIZZES } = load("en-US");
  const q1 = QUIZZES[1][0];
  assert(/hidden files/i.test(q1.q), "question 1 chap 1 en anglais, reçu: " + q1.q);
  assert(q1.options.includes("ls -a"), "options conservées");
  assertEqual(q1.answer, 1, "answer inchangé");
});

test("LANG=fr : QUIZZES reste en français", () => {
  const { QUIZZES } = load("fr-FR");
  assert(/cachés/.test(QUIZZES[1][0].q), "question reste FR");
});

test("chaque quiz a un overlay EN complet (même nb de questions et d'options)", () => {
  const { QUIZZES, QUIZZES_EN } = load("fr-FR");
  const problems = [];
  for (const chId of Object.keys(QUIZZES)) {
    const src = QUIZZES[chId], ov = QUIZZES_EN[chId];
    if (!ov) { problems.push("chapitre " + chId + " sans overlay quiz"); continue; }
    if (ov.length !== src.length) { problems.push(`chap ${chId}: ${ov.length}≠${src.length} questions`); continue; }
    src.forEach((question, i) => {
      if (!ov[i].q) problems.push(`chap ${chId} Q${i + 1}: question non traduite`);
      if (!ov[i].options || ov[i].options.length !== question.options.length)
        problems.push(`chap ${chId} Q${i + 1}: nb d'options incohérent`);
    });
  }
  assert(problems.length === 0, problems.join(" | "));
});

// ═══════════════════════════════════════════════════════════════
// Glossaire : overlay appliqué, cat = clé FR conservée, complétude
// ═══════════════════════════════════════════════════════════════
test("LANG=en : overlayGlossary() traduit desc/syntax mais garde cat en FR (clé de filtrage)", () => {
  const { GLOSSARY } = load("en-US");
  const ls = GLOSSARY.find(g => g.cmd === "ls");
  assert(/Lists files/.test(ls.desc), "desc traduite, reçu: " + ls.desc);
  assert(/\[path\]/.test(ls.syntax), "syntax traduite (path)");
  assertEqual(ls.cat, "Navigation", "cat reste la clé FR");           // ici identique fr/en
  const grep = GLOSSARY.find(g => g.cmd === "grep");
  assertEqual(grep.cat, "Recherche", "cat garde la clé FR (pas 'Search')");
  assert(grep.options[0][1] === "ignores case", "option desc traduite, [0] flag inchangé (" + grep.options[0][0] + ")");
});

test("glossCat() traduit le LIBELLÉ de catégorie pour l'affichage (en) / identité (fr)", () => {
  const en = load("en-US");
  assertEqual(en.glossCat("Recherche"), "Search", "libellé EN");
  assertEqual(en.glossCat("Tout"), "All", "libellé EN 'Tout'");
  const fr = load("fr-FR");
  assertEqual(fr.glossCat("Recherche"), "Recherche", "libellé FR = identité");
});

test("LANG=fr : GLOSSARY reste en français", () => {
  const { GLOSSARY } = load("fr-FR");
  assert(/Liste les fichiers/.test(GLOSSARY.find(g => g.cmd === "ls").desc), "desc reste FR");
});

test("chaque commande du glossaire a un overlay EN (desc/syntax) et des longueurs cohérentes", () => {
  const { GLOSSARY, GLOSSARY_EN } = load("fr-FR");
  const problems = [];
  for (const g of GLOSSARY) {
    const ov = GLOSSARY_EN[g.cmd];
    if (!ov) { problems.push("commande « " + g.cmd + " » sans overlay"); continue; }
    if (!ov.desc) problems.push(g.cmd + ": desc manquante");
    if (!ov.syntax) problems.push(g.cmd + ": syntax manquante");
    if (ov.options && ov.options.length !== g.options.length) problems.push(`${g.cmd}: options ${ov.options.length}≠${g.options.length}`);
    if (ov.examples && ov.examples.length !== g.examples.length) problems.push(`${g.cmd}: examples ${ov.examples.length}≠${g.examples.length}`);
  }
  assert(problems.length === 0, problems.join(" | "));
});

test("toutes les catégories du glossaire ont un libellé EN dans GLOSS_CATS_EN", () => {
  const { GLOSSARY, glossCat } = load("en-US");
  const cats = new Set(["Tout", ...GLOSSARY.map(g => g.cat)]);
  const untranslated = [...cats].filter(c => glossCat(c) === c && c !== "Git" && c !== "Navigation" && c !== "Scripting");
  assert(untranslated.length === 0, "catégories sans libellé EN distinct : " + untranslated.join(", "));
});

// ═══════════════════════════════════════════════════════════════
// Modes annexes (Phase C) : défis + infiltration
// ═══════════════════════════════════════════════════════════════
test("LANG=en : overlayArray traduit les défis (category + desc), FR intact sinon", () => {
  const en = load("en-US");
  const c1en = en.CHALLENGES.find(c => c.id === 1);
  assert(/current directory/i.test(c1en.desc), "desc défi 1 en anglais");
  const fr = load("fr-FR");
  const c1fr = fr.CHALLENGES.find(c => c.id === 1);
  assert(/répertoire courant/.test(c1fr.desc), "desc reste FR");
});

test("chaque défi et chaque niveau d'infiltration a un overlay EN (desc)", () => {
  const { CHALLENGES, CHALLENGES_EN, BANDIT_LEVELS, BANDIT_LEVELS_EN } = load("fr-FR");
  const problems = [];
  for (const c of CHALLENGES) {
    const ov = CHALLENGES_EN[c.id];
    if (!ov || !ov.desc || !ov.category) problems.push("défi " + c.id);
  }
  for (const lv of BANDIT_LEVELS) {
    const ov = BANDIT_LEVELS_EN[lv.id];
    if (!ov || !ov.desc || !ov.title) problems.push("infiltration " + lv.id);
  }
  assert(problems.length === 0, "overlays manquants : " + problems.join(", "));
});

test("LANG=en : titres d'infiltration gardent le séparateur « — » (rendu de la liste)", () => {
  const { BANDIT_LEVELS } = load("en-US");
  const bad = BANDIT_LEVELS.filter(lv => !lv.title.includes("—"));
  assert(bad.length === 0, "titres sans « — » : " + bad.map(l => l.id).join(", "));
});

test("LANG=en : missions Expert, objectifs et événements saisonniers traduits ; FR intact", () => {
  const en = load("en-US");
  assert(/Noise elimination/.test(en.EXPERT_MISSIONS.find(m => m.id === 9001).name), "expert 9001 EN");
  assertEqual(en.OBJECTIVES.find(o => o.id === "first").title, "First step", "objectif 'first' EN");
  assertEqual(en.SEASONAL_EVENTS.find(e => e.id === "noel").name, "Christmas", "Noël → Christmas");
  const fr = load("fr-FR");
  assertEqual(fr.OBJECTIVES.find(o => o.id === "first").title, "Premier pas", "objectif reste FR");
});

test("LANG=en : katas et défis du jour traduits (name/desc, title/desc), FR intact", () => {
  const en = load("en-US");
  assertEqual(en.KATAS.find(k => k.id === "bases").name, "The Fundamentals", "kata 'bases' EN");
  assert(/first commit/.test(en.KATAS.find(k => k.id === "git").cmds[3]), "kata Git : message de commit traduit");
  assert(/Error hunt/.test(en.DAILY_POOL[0].title), "daily 0 titre EN");
  const fr = load("fr-FR");
  assertEqual(fr.KATAS.find(k => k.id === "bases").name, "Les Fondamentaux", "kata reste FR");
  assert(/premier commit/.test(fr.KATAS.find(k => k.id === "git").cmds[3]), "kata Git FR : commit inchangé");
});

test("LANG=en : boss traduits (name/story/taunts/winText + phases), FR intact", () => {
  const en = load("en-US");
  const kraken = en.BOSS_FIGHTS.find(b => b.id === "kraken");
  assertEqual(kraken.name, "The Kraken of Logs", "boss kraken name EN");
  assert(/tentacle/i.test(kraken.phases[0].desc) || /biggest file/i.test(kraken.phases[0].desc), "phase 1 desc EN");
  assert(en.BOSS_FIGHTS.find(b => b.id === "sensei").phases[4].desc.includes("peur"), "épreuve 5 garde 'peur' (mot du fichier)");
  const fr = load("fr-FR");
  assertEqual(fr.BOSS_FIGHTS.find(b => b.id === "kraken").name, "Le Kraken des Logs", "boss reste FR");
});

test("complétude : chaque boss + chaque phase a un overlay EN (name/story/winText/phases)", () => {
  const { BOSS_FIGHTS, BOSS_FIGHTS_EN } = load("fr-FR");
  const problems = [];
  for (const b of BOSS_FIGHTS) {
    const ov = BOSS_FIGHTS_EN[b.id];
    if (!ov) { problems.push("boss " + b.id); continue; }
    for (const f of ["name", "tagline", "story", "winText"]) if (!ov[f]) problems.push(b.id + "." + f);
    if (!Array.isArray(ov.taunts) || ov.taunts.length !== b.taunts.length) problems.push(b.id + ".taunts");
    if (!Array.isArray(ov.phases) || ov.phases.length !== b.phases.length) { problems.push(b.id + ".phases(len)"); continue; }
    ov.phases.forEach((p, i) => { if (!p.title || !p.desc || !p.hint) problems.push(b.id + ".phase" + i); });
  }
  assert(problems.length === 0, "overlays boss manquants : " + problems.join(", "));
});

test("complétude : chaque kata et chaque défi du jour a un overlay EN", () => {
  const { KATAS, KATAS_EN, DAILY_POOL, DAILY_POOL_EN } = load("fr-FR");
  const problems = [];
  for (const k of KATAS) {
    const ov = KATAS_EN[k.id];
    if (!ov || !ov.name || !ov.desc) problems.push("kata " + k.id);
  }
  if (DAILY_POOL_EN.length !== DAILY_POOL.length) problems.push("daily: " + DAILY_POOL_EN.length + "≠" + DAILY_POOL.length + " entrées");
  DAILY_POOL_EN.forEach((ov, i) => { if (!ov.title || !ov.desc) problems.push("daily #" + i); });
  assert(problems.length === 0, "overlays manquants : " + problems.join(", "));
});

test("complétude : chaque mission Expert, objectif et événement a un overlay EN", () => {
  const { EXPERT_MISSIONS, EXPERT_MISSIONS_EN, OBJECTIVES, OBJECTIVES_EN, SEASONAL_EVENTS, SEASONAL_EVENTS_EN } = load("fr-FR");
  const problems = [];
  for (const m of EXPERT_MISSIONS) {
    const ov = EXPERT_MISSIONS_EN[m.id];
    if (!ov || !ov.name || !ov.desc || !ov.explanation) problems.push("expert " + m.id);
  }
  for (const o of OBJECTIVES) {
    const ov = OBJECTIVES_EN[o.id];
    if (!ov || !ov.title || !ov.desc) problems.push("objectif " + o.id);
  }
  for (const e of SEASONAL_EVENTS) {
    const ov = SEASONAL_EVENTS_EN[e.id];
    if (!ov || !ov.name || !ov.banner) problems.push("saisonnier " + e.id);
  }
  assert(problems.length === 0, "overlays manquants : " + problems.join(", "));
});

// ─────────────────────────────────────────────────────────────────────────
console.log(`\n${pass} test(s) réussi(s), ${fail} échec(s) sur ${pass + fail} au total.\n`);
if (fail > 0) {
  console.log("❌ Échecs :");
  failures.forEach(f => console.log(`  • ${f.name}\n    → ${f.error}`));
  process.exit(1);
} else {
  console.log("✅ Tous les tests passent.");
}
