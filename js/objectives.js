// objectives.js — Objectifs / quêtes : des buts clairs à travers tous les modes,
// avec une récompense XP one-shot débloquée automatiquement quand le but est atteint.

// ── Lecture des progressions des autres modes (stockées séparément) ──────────
function _obLS(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; }
  catch { return fallback; }
}
function _banditDone()    { const a = _obLS("linuxdojo_bandit", []); return Array.isArray(a) ? a.length : 0; }
function _bossDone()      { const b = _obLS("linuxdojo_boss", {}); return (b && Array.isArray(b.defeated)) ? b.defeated.length : 0; }
function _kataBestScore() { const k = _obLS("linuxdojo_kata_best", {}); let m = 0; for (const id in k) if (k[id] && k[id].score > m) m = k[id].score; return m; }
function _challengeBest() { const n = parseInt(localStorage.getItem("linuxdojo_challenge_best"), 10); return isNaN(n) ? 0 : n; }
function _dailyDone()     { const d = _obLS("linuxdojo_daily", {}); return d && d.done ? 1 : 0; }
function _statTotal()     { return (typeof STATS !== "undefined" && STATS.total) ? STATS.total : 0; }
function _statCmd(c)      { return (typeof STATS !== "undefined" && STATS.cmd && STATS.cmd[c]) ? STATS.cmd[c] : 0; }
function _reviewTotal(g)  { return Object.values(g.reviewCounts || {}).reduce((a, b) => a + b, 0); }

// ── Liste des objectifs ──────────────────────────────────────────────────────
// cur(g) = valeur actuelle · target = valeur à atteindre · xp = récompense one-shot
const OBJECTIVES = [
  { id: "first",     icon: "🎯", title: "Premier pas",         desc: "Termine ta 1re mission",                    xp: 20, target: 1,   cur: g => g.completed.size },
  { id: "scenario1", icon: "📁", title: "Scénario 1 bouclé",   desc: "Termine les 6 missions du scénario 1",       xp: 40, target: 6,   cur: g => [1,2,3,4,5,6].filter(i => g.completed.has(i)).length },
  { id: "scenario8", icon: "🌱", title: "Ceinture Git",        desc: "Termine les 6 missions du scénario Git",     xp: 45, target: 6,   cur: g => [43,44,45,46,47,48].filter(i => g.completed.has(i)).length },
  { id: "scenario9", icon: "🌐", title: "Ceinture Réseau",     desc: "Termine les 6 missions du scénario SSH",     xp: 45, target: 6,   cur: g => [49,50,51,52,53,54].filter(i => g.completed.has(i)).length },
  { id: "typist",    icon: "⌨️", title: "Pianiste du shell",   desc: "Tape 50 commandes en tout",                  xp: 25, target: 50,  cur: () => _statTotal() },
  { id: "toolbox",   icon: "🧰", title: "Boîte à outils",      desc: "Utilise ls, cat et grep au moins une fois",  xp: 30, target: 3,   cur: () => ["ls","cat","grep"].filter(c => _statCmd(c) > 0).length },
  { id: "quiz1",     icon: "🎓", title: "Élève sérieux",       desc: "Réussis un quiz de fin de chapitre",         xp: 30, target: 1,   cur: g => g.quizzes.size },
  { id: "review",    icon: "🔁", title: "Mémoire vive",        desc: "Réussis 3 révisions (répétition espacée)",   xp: 25, target: 3,   cur: g => _reviewTotal(g) },
  { id: "daily",     icon: "📅", title: "Assidu",              desc: "Réussis un défi du jour",                    xp: 30, target: 1,   cur: () => _dailyDone() },
  { id: "bandit1",   icon: "🔓", title: "Infiltration",        desc: "Passe le 1er niveau d'Infiltration",         xp: 35, target: 1,   cur: () => _banditDone() },
  { id: "challenge", icon: "⚡", title: "Sang-froid",          desc: "Atteins 60 pts de record en mode Défis",     xp: 35, target: 60,  cur: () => _challengeBest() },
  { id: "badges3",   icon: "🏅", title: "Collectionneur",      desc: "Débloque 3 badges",                          xp: 40, target: 3,   cur: g => g.badges.length },
  { id: "hacker",    icon: "💻", title: "Sur la voie du Hacker", desc: "Atteins le rang Hacker (800 XP)",          xp: 60, target: 800, cur: g => g.xp },
  { id: "boss1",     icon: "⚔️", title: "Premier trophée",     desc: "Terrasse ton premier boss",                  xp: 40, target: 1,   cur: () => _bossDone() },
  { id: "bossall",   icon: "🐲", title: "Videur de donjon",    desc: "Terrasse les 5 boss (Sensei inclus)",        xp: 100, target: 5,  cur: () => _bossDone() },
  { id: "rtfm",      icon: "📖", title: "RTFM",                desc: "Consulte 3 pages de manuel (man cmd)",       xp: 20, target: 3,   cur: () => _statCmd("man") },
  { id: "eggs",      icon: "🥚", title: "Chasseur d'œufs",     desc: "Trouve 3 easter eggs (cowsay, sl, fortune…)", xp: 30, target: 3,  cur: () => ["cowsay","sl","fortune","vim","sudo"].filter(c => _statCmd(c) > 0).length },
  { id: "kata",      icon: "🥋", title: "Mémoire musculaire",  desc: "Atteins 70 pts de score sur un Kata",         xp: 35, target: 70,  cur: () => _kataBestScore() },
];

// ── Vérifie & débloque automatiquement les objectifs atteints ────────────────
function checkObjectives() {
  if (typeof GAME === "undefined") return false;
  if (!GAME.objectives) GAME.objectives = [];
  let claimedAny = false;

  OBJECTIVES.forEach(o => {
    if (GAME.objectives.includes(o.id)) return;
    let cur = 0;
    try { cur = o.cur(GAME); } catch { cur = 0; }
    if (cur >= o.target) {
      GAME.objectives.push(o.id);
      claimedAny = true;
      // Récompense directe (on évite addXP pour ne pas ré-entrer dans checkObjectives)
      GAME.xp += o.xp;
      if (typeof showAchievement === "function") {
        showAchievement(o.icon, "Objectif : " + o.title, "+" + o.xp + " XP");
      } else if (typeof showToast === "function") {
        showToast(o.icon + " Objectif accompli : " + o.title + " (+" + o.xp + " XP)");
      }
    }
  });

  if (claimedAny) {
    if (typeof persist === "function") persist();
    if (typeof updateXPBar === "function") updateXPBar();
    if (typeof updateHomeStats === "function") updateHomeStats();
    if (typeof updateNavRank === "function") updateNavRank();
    if (typeof checkBadges === "function") checkBadges();
  }
  return claimedAny;
}

// ── Rendu du panneau "Objectifs" (accueil + profil) ──────────────────────────
function _renderObjInto(grid, countEl) {
  if (!grid || typeof GAME === "undefined") return;

  const claimed = new Set(GAME.objectives || []);
  const doneCount = OBJECTIVES.filter(o => claimed.has(o.id)).length;
  if (countEl) countEl.textContent = doneCount + " / " + OBJECTIVES.length;

  grid.innerHTML = "";
  OBJECTIVES.forEach(o => {
    let cur = 0;
    try { cur = Math.max(0, o.cur(GAME)); } catch { cur = 0; }
    const done = claimed.has(o.id) || cur >= o.target;
    const pct = Math.min(100, Math.round((Math.min(cur, o.target) / o.target) * 100));
    const card = document.createElement("div");
    card.className = "obj-card" + (done ? " done" : "");
    card.innerHTML =
      '<div class="obj-icon">' + (done ? "✅" : o.icon) + '</div>' +
      '<div class="obj-body">' +
        '<div class="obj-title">' + o.title + '</div>' +
        '<div class="obj-desc">' + o.desc + '</div>' +
        '<div class="obj-bar"><div class="obj-bar-fill" style="width:' + pct + '%"></div></div>' +
      '</div>' +
      '<div class="obj-xp">' + (done ? "✓" : "+" + o.xp + " XP") + '</div>';
    grid.appendChild(card);
  });
}

function renderObjectives() {
  // Accueil
  _renderObjInto(document.getElementById("obj-grid"),    document.getElementById("obj-count"));
  // Profil
  _renderObjInto(document.getElementById("pf-obj-grid"), document.getElementById("pf-obj-count"));
}

// Débloque les objectifs déjà atteints puis rafraîchit l'affichage.
function objectivesTick() {
  checkObjectives();
  renderObjectives();
}
