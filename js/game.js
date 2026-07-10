// game.js — Logique principale LinuxDojo v3

const SAVE_KEY = "linuxdojo_v3";

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    const s = JSON.parse(raw);
    s.completed = new Set(s.completed || []);
    s.quizzes   = new Set(s.quizzes || []);
    if (!s.reviewCounts) s.reviewCounts = {};
    if (!s.objectives)   s.objectives = [];
    return s;
  } catch { return defaultSave(); }
}
function defaultSave() { return { xp: 0, completed: new Set(), badges: [], quizzes: new Set(), reviewCounts: {}, objectives: [] }; }
function persist() {
  const s = { ...GAME, completed: [...GAME.completed], quizzes: [...GAME.quizzes] };
  localStorage.setItem(SAVE_KEY, JSON.stringify(s));
}

// ── Statistiques de commandes ──────────────────────────────────
const STATS_KEY = "linuxdojo_stats";
function loadStats() { try { const s = JSON.parse(localStorage.getItem(STATS_KEY)) || {}; return { cmd: s.cmd || {}, total: s.total || 0, days: s.days || {} }; } catch { return { cmd:{}, total:0, days:{} }; } }
let STATS = loadStats();
function _dayKey(d) { d = d || new Date(); return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0"); }
function bumpStat(cmd) {
  if (!cmd) return;
  STATS.cmd[cmd] = (STATS.cmd[cmd] || 0) + 1;
  STATS.total++;
  STATS.days[_dayKey()] = (STATS.days[_dayKey()] || 0) + 1;
  localStorage.setItem(STATS_KEY, JSON.stringify(STATS));
  if (typeof objectivesTick === "function") objectivesTick();
}

// Boss vaincus (lus depuis la sauvegarde du mode Boss)
function bossKills() {
  try { return ((JSON.parse(localStorage.getItem("linuxdojo_boss")) || {}).defeated || []).length; }
  catch { return 0; }
}
function bossHasKilled(id) {
  try { return ((JSON.parse(localStorage.getItem("linuxdojo_boss")) || {}).defeated || []).includes(id); }
  catch { return false; }
}

const BADGES = [
  { id: "first_blood", label: "🩸 Premier sang",  cond: g => g.completed.size >= 1 },
  { id: "chapter1",    label: "📁 Explorateur",   cond: g => [1,2,3,4,5,6].every(id => g.completed.has(id)) },
  { id: "chapter2",    label: "✏️ Artisan",        cond: g => [7,8,9,10,11,12].every(id => g.completed.has(id)) },
  { id: "chapter3",    label: "🔍 Détective",     cond: g => [13,14,15,16,17,18].every(id => g.completed.has(id)) },
  { id: "chapter4",    label: "🔐 Gardien",       cond: g => [19,20,21,22,23,24].every(id => g.completed.has(id)) },
  { id: "chapter6",    label: "🛡️ Défenseur",     cond: g => [31,32,33,34,35,36].every(id => g.completed.has(id)) },
  { id: "chapter7",    label: "🤖 Automate",      cond: g => [37,38,39,40,41,42].every(id => g.completed.has(id)) },
  { id: "chapter8",    label: "🌱 Committeur",    cond: g => [43,44,45,46,47,48].every(id => g.completed.has(id)) },
  { id: "chapter9",    label: "🌐 Cyber-nomade",  cond: g => [49,50,51,52,53,54].every(id => g.completed.has(id)) },
  { id: "master",      label: "⚡ Maître Linux",  cond: g => g.completed.size >= 36 },
  { id: "xp100",       label: "💯 Centurion",     cond: g => g.xp >= 100 },
  { id: "xp500",       label: "🔥 Inferno",       cond: g => g.xp >= 500 },
  { id: "xp1000",      label: "👑 Légende",       cond: g => g.xp >= 1000 },
  { id: "boss1",       label: "⚔️ Tueur de Boss", cond: () => bossKills() >= 1 },
  { id: "boss4",       label: "🐉 Fléau des Monstres", cond: () => bossKills() >= 4 },
  { id: "blackbelt",   label: "🖤 Ceinture Noire", cond: () => bossHasKilled("sensei") },
];

function checkBadges() {
  BADGES.forEach(b => {
    if (!GAME.badges.includes(b.id) && b.cond(GAME)) {
      GAME.badges.push(b.id);
      if (typeof showAchievement === "function") {
        showAchievement(b.label.split(" ")[0], b.label.split(" ").slice(1).join(" "), "Badge débloqué !");
      } else {
        showToast("🏅 Badge débloqué : " + b.label);
      }
    }
  });
}

function showToast(msg) {
  const el = document.createElement("div");
  el.className = "toast-item";
  el.textContent = msg;
  document.getElementById("toast-container").appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function addXP(amount) {
  const before = getRank(GAME.xp);
  GAME.xp += amount;
  persist();
  updateXPBar();
  checkBadges();
  if (typeof checkObjectives === "function") checkObjectives();
  updateHomeStats();
  if (typeof updateNavRank === "function") updateNavRank();
  // Level up de rang ?
  const after = getRank(GAME.xp);
  if (after.name !== before.name) {
    setTimeout(() => {
      showAchievement(after.icon, "Nouveau rang : " + after.name, "Tu as atteint " + GAME.xp + " XP !");
      if (typeof SFX !== "undefined") SFX.levelup();
      burstParticles(window.innerWidth/2, window.innerHeight/2);
    }, 600);
  }
}

let GAME = loadSave();
let currentMission = null;
let hintLevel = 0; // 0 = rien révélé, 1 = tip, 2 = +syntaxe, 3 = +solution complète
let cmdHistory = [];
let histIdx = -1;

// Répétition espacée
let reviewMode = false;
let reviewQueue = [];
let reviewTotal = 0;
let reviewGood = 0;

const $ = id => document.getElementById(id);
const term = new Terminal($("terminal"));

// Navigation
function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  $("page-" + id).classList.add("active");
  document.querySelector('.nav-btn[data-page="' + id + '"]')?.classList.add("active");
  if (id === "explore"   && !gsInitialized) { initGameShell();  gsInitialized = true; }
  if (id === "challenge" && !chInitialized) { initChallenges(); chInitialized = true; }
  if (id === "bandit"    && !bnInitialized) { initBandit();     bnInitialized = true; }
  if (id === "boss") { if (!bsInitialized) { initBoss(); bsInitialized = true; } else if (bsObj) { bsObj.renderList(); } }
  if (id === "kata") { if (!ktInitialized) { initKata(); ktInitialized = true; } else if (ktObj) { ktObj.renderSelect(); } }
  if (id === "learn"     && !learnInit)     { initLearn();      learnInit = true; }
  if (id === "profile"   && typeof renderProfile === "function") { renderProfile(); }
  if (id === "sandbox"   && !sbInit) { initSandbox(); sbInit = true; }
  if (id === "glossary"  && typeof initGlossary === "function") { initGlossary(); }
  if (id === "home"      && typeof updateDailyBanner === "function") { updateDailyBanner(); }
  if (id === "home"      && typeof objectivesTick === "function")    { objectivesTick(); }
}

let sbInit = false;

let gsInitialized = false, chInitialized = false, bnInitialized = false, learnInit = false, bsInitialized = false, ktInitialized = false;

document.querySelectorAll(".nav-btn[data-page]").forEach(btn => {
  btn.addEventListener("click", () => showPage(btn.dataset.page));
});
document.querySelectorAll("[data-page]:not(.nav-btn)").forEach(el => {
  el.addEventListener("click", () => showPage(el.dataset.page));
});
$("nav-logo").addEventListener("click", () => showPage("home"));

function updateXPBar() {
  const lv  = Math.floor(GAME.xp / 100) + 1;
  const pct = GAME.xp % 100;
  $("nav-xp-fill").style.width = pct + "%";
  $("nav-lv").textContent    = "Lv " + lv;
  $("nav-xp-label").textContent = GAME.xp + " XP";
}

function updateHomeStats() {
  const done = GAME.completed.size;
  if (done > 0 || GAME.xp > 0) {
    $("home-stats-row").style.display = "flex";
    $("hs-xp").textContent     = GAME.xp;
    $("hs-done").textContent   = done;
    $("hs-lv").textContent     = Math.floor(GAME.xp / 100) + 1;
    $("hs-badges").textContent = GAME.badges.length;
  }
}

// MODE APPRENDRE
function initLearn() {
  renderSidebar();
  const all = CHAPTERS.flatMap(c => c.missions);
  loadMission(all.find(m => !GAME.completed.has(m.id)) || all[0]);
}

function renderSidebar() {
  const list = $("chapter-list");
  list.innerHTML = "";

  // Bouton Révision (répétition espacée) en tête
  const revBtn = document.createElement("button");
  const done = GAME.completed.size;
  revBtn.id = "btn-review";
  revBtn.className = "review-btn";
  revBtn.textContent = done >= 3 ? "🔁 Réviser (" + done + " acquis)" : "🔁 Révision (3 missions requises)";
  revBtn.disabled = done < 3;
  if (done >= 3) revBtn.addEventListener("click", startReview);
  list.appendChild(revBtn);

  CHAPTERS.forEach(ch => {
    const cdone = ch.missions.filter(m => GAME.completed.has(m.id)).length;
    const allDone = cdone === ch.missions.length;
    const block = document.createElement("div");
    block.className = "chapter-block";
    const header = document.createElement("div");
    header.className = "chapter-header";
    // Quiz : bouton 🎓 si chapitre terminé
    let quizHtml = "";
    if (allDone) {
      const passed = GAME.quizzes.has(ch.id);
      quizHtml = `<button class="quiz-btn" data-quiz="${ch.id}" title="Quiz du chapitre">${passed ? "🎓 ✓" : "🎓 Quiz"}</button>`;
    }
    header.innerHTML = '<span>' + ch.title + '</span>' + (quizHtml || ('<span class="chapter-progress">' + cdone + '/' + ch.missions.length + '</span>'));
    block.appendChild(header);
    ch.missions.forEach((m, i) => {
      const chPrev  = ch.id === 1 || GAME.completed.has(CHAPTERS[ch.id-2].missions.at(-1).id);
      const prev    = i === 0 || GAME.completed.has(ch.missions[i-1].id);
      const unlock  = chPrev && (i === 0 || prev || GAME.completed.has(m.id));
      const isDone  = GAME.completed.has(m.id);
      const active  = currentMission && currentMission.id === m.id;
      const item    = document.createElement("div");
      item.className = "mission-item" + (active?" active":"") + (isDone?" done":"") + (!unlock?" locked":"");
      item.innerHTML = '<span class="mi-icon">' + (isDone?"✓":(!unlock?"🔒":"○")) + '</span><div class="mi-info"><div class="mi-name">' + m.name + '</div><div class="mi-cmd">' + m.cmd + '</div></div>';
      if (unlock) item.addEventListener("click", () => loadMission(m));
      block.appendChild(item);
    });
    list.appendChild(block);
  });

  // Brancher les boutons quiz
  list.querySelectorAll(".quiz-btn").forEach(b => {
    b.addEventListener("click", (e) => { e.stopPropagation(); openQuiz(parseInt(b.dataset.quiz)); });
  });
}

function loadMission(m) {
  reviewMode = false;
  currentMission = m;
  resetHintUI();
  renderLesson(m.lesson);
  showView("lesson");
  renderSidebar();
}

function renderLesson(l) {
  if (!l) { showView("exercise"); loadExercise(); return; }
  $("lesson-title").innerHTML = l.title;
  $("lesson-intro").innerHTML = l.intro;
  $("lesson-syntax").textContent = l.syntax;
  const optEl = $("lesson-options");
  optEl.innerHTML = "";
  if (l.options && l.options.length) {
    $("lesson-options-block").style.display = "";
    l.options.forEach(o => {
      const row = document.createElement("div");
      row.className = "option-row";
      row.innerHTML = '<span class="option-flag">' + o.flag + '</span><span class="option-desc">' + o.desc + '</span>';
      optEl.appendChild(row);
    });
  } else { $("lesson-options-block").style.display = "none"; }
  const exEl = $("lesson-examples");
  exEl.innerHTML = "";
  l.examples.forEach(ex => {
    const row = document.createElement("div");
    row.className = "example-row";
    row.innerHTML = '<span class="example-cmd">$ ' + ex.cmd + '</span><span class="example-comment">' + ex.comment + '</span>';
    exEl.appendChild(row);
  });
  if (l.tip) {
    $("lesson-tip-block").style.display = "flex";
    $("lesson-tip").innerHTML = l.tip.replace(/`([^`]+)`/g, '<code>$1</code>');
  } else { $("lesson-tip-block").style.display = "none"; }
  $("lesson-scroll").scrollTop = 0;
}

function showView(id) {
  $("view-lesson").style.display   = id === "lesson"   ? "flex" : "none";
  $("view-exercise").style.display = id === "exercise" ? "flex" : "none";
}

function loadExercise() {
  const m = currentMission;
  $("mp-name").textContent   = m.name;
  $("mp-xp-tag").textContent = "+" + m.xp + " XP";
  $("mp-desc").innerHTML     = m.desc;
  resetHintUI();
  term.clear();
  term.loadFS(m.fs);
  $("prompt").textContent = term.promptStr();
  term.printInfo("══ Mission " + m.id + "/" + CHAPTERS.flatMap(c => c.missions).length + " ══");
  term.printOut("");
  $("cmd-input").focus();
}

function runLearnCommand(raw) {
  if (!raw.trim()) return;
  cmdHistory.unshift(raw); histIdx = -1;
  bumpStat(raw.split(/\s+/)[0]);
  const result = term.run(raw);
  $("prompt").textContent = term.promptStr();
  const output = result.output || "";
  if (currentMission) {
    let ok = false;
    try { ok = currentMission.check(output.toLowerCase(), term.state); } catch(e) {}
    if (ok) {
      if (reviewMode) setTimeout(onReviewSuccess, 200);
      else if (!GAME.completed.has(currentMission.id)) setTimeout(() => onMissionSuccess(currentMission), 200);
    }
  }
}

// ── Répétition espacée ─────────────────────────────────────────
function startReview() {
  const doneMissions = CHAPTERS.flatMap(c => c.missions).filter(m => GAME.completed.has(m.id));
  if (doneMissions.length < 3) return;
  // Priorité aux moins révisées (répétition espacée simple)
  doneMissions.sort((a, b) => (GAME.reviewCounts[a.id]||0) - (GAME.reviewCounts[b.id]||0) || Math.random() - 0.5);
  reviewQueue = doneMissions.slice(0, 3);
  reviewTotal = reviewQueue.length;
  reviewGood = 0;
  reviewMode = true;
  loadReviewItem();
}

function loadReviewItem() {
  const m = reviewQueue.shift();
  currentMission = m;
  resetHintUI();
  showView("exercise");
  $("mp-name").textContent   = "🔁 Révision — " + m.name;
  $("mp-xp-tag").textContent = "+10 XP";
  $("mp-desc").innerHTML     = m.desc;
  term.clear();
  term.loadFS(m.fs);
  term.printInfo("🔁 RÉVISION (" + (reviewTotal - reviewQueue.length) + "/" + reviewTotal + ") — sans leçon, de mémoire !");
  term.printOut("");
  $("cmd-input").focus();
}

function onReviewSuccess() {
  const m = currentMission;
  GAME.reviewCounts[m.id] = (GAME.reviewCounts[m.id]||0) + 1;
  reviewGood++;
  addXP(10);
  if (typeof SFX !== "undefined") SFX.success();
  term.printOk("✅ Correct ! +10 XP");
  persist();
  if (reviewQueue.length > 0) {
    setTimeout(loadReviewItem, 900);
  } else {
    reviewMode = false;
    setTimeout(() => {
      showToast("🔁 Révision terminée : " + reviewGood + "/" + reviewTotal + " réussies !");
      if (reviewGood === reviewTotal && typeof burstParticles === "function") burstParticles(window.innerWidth/2, window.innerHeight/2);
      // Retour à une mission normale
      const all = CHAPTERS.flatMap(c => c.missions);
      loadMission(all.find(x => !GAME.completed.has(x.id)) || all[0]);
    }, 900);
  }
}

function onMissionSuccess(m) {
  GAME.completed.add(m.id);
  if (typeof SFX !== "undefined") SFX.success();
  burstParticles(window.innerWidth/2, window.innerHeight/2);
  addXP(m.xp);
  renderSidebar();
  const all = CHAPTERS.flatMap(c => c.missions);
  const next = all.find(x => x.id === m.id + 1);
  $("win-title").textContent = "Mission accomplie !";
  $("win-xp").textContent    = "+" + m.xp + " XP — Total : " + GAME.xp + " XP";
  $("win-explanation").innerHTML = m.explanation || "";
  const br = $("win-badge-row");
  br.innerHTML = "";
  BADGES.filter(b => GAME.badges.includes(b.id)).slice(-2).forEach(b => {
    const pill = document.createElement("span");
    pill.className = "badge-pill";
    pill.textContent = b.label;
    br.appendChild(pill);
  });
  const bn2 = $("win-next");
  if (next) { bn2.style.display=""; bn2.onclick=()=>{closeModal("modal-win");loadMission(next);}; }
  else { bn2.style.display="none"; }
  openModal("modal-win");
}

$("btn-go-exercise").addEventListener("click", () => { showView("exercise"); loadExercise(); });
$("btn-back-lesson").addEventListener("click", () => { renderLesson(currentMission.lesson); showView("lesson"); });
$("run-btn").addEventListener("click", () => { const v=$("cmd-input").value.trim(); if(v){runLearnCommand(v);$("cmd-input").value="";} });
$("cmd-input").addEventListener("keydown", e => {
  if (e.key==="Enter") { runLearnCommand($("cmd-input").value.trim()); $("cmd-input").value=""; }
  else if (e.key==="Tab") { e.preventDefault(); term.autocomplete($("cmd-input")); }
  else if (e.key==="ArrowUp") { e.preventDefault(); if(histIdx<cmdHistory.length-1){histIdx++;$("cmd-input").value=cmdHistory[histIdx]||"";} }
  else if (e.key==="ArrowDown") { e.preventDefault(); if(histIdx>0){histIdx--;$("cmd-input").value=cmdHistory[histIdx]||"";}else{histIdx=-1;$("cmd-input").value="";} }
});
const HINT_TIERS = [
  { cost: 0, icon: "💡", label: "Indice",          costLabel: "gratuit", reveal: m => "💡 " + m.lesson.tip },
  { cost: 3, icon: "🔍", label: "Indice précis",    costLabel: "−3 XP",   reveal: m => "🔍 Syntaxe : <code>" + m.lesson.syntax + "</code>" },
  { cost: 5, icon: "✅", label: "Voir la solution", costLabel: "−5 XP",   reveal: m => "✅ Solution : <code>" + m.hint + "</code>" },
];

function renderHintButton() {
  const btn = $("btn-hint");
  if (!btn) return;
  if (hintLevel >= HINT_TIERS.length) {
    btn.disabled = true;
    btn.innerHTML = "✅ Indices épuisés";
    return;
  }
  btn.disabled = false;
  const tier = HINT_TIERS[hintLevel];
  const costClass = tier.cost === 0 ? "cost free" : "cost";
  btn.innerHTML = tier.icon + " " + tier.label + ' <span class="' + costClass + '">' + tier.costLabel + "</span>";
}

function resetHintUI() {
  hintLevel = 0;
  const ht = $("hint-text");
  if (ht) { ht.innerHTML = ""; ht.style.display = "none"; }
  renderHintButton();
}

$("btn-hint").addEventListener("click", () => {
  if (!currentMission || hintLevel >= HINT_TIERS.length) return;
  const tier = HINT_TIERS[hintLevel];
  const ht = $("hint-text");
  ht.innerHTML += (ht.innerHTML ? "<br>" : "") + tier.reveal(currentMission);
  ht.style.display = "inline";
  if (tier.cost > 0) { GAME.xp = Math.max(0, GAME.xp - tier.cost); persist(); updateXPBar(); }
  hintLevel++;
  renderHintButton();
});

// MODE EXPLORER
let gsObj = null;
function initGameShell() {
  gsObj = new GameShell($("explore-terminal"),$("explore-cmd"),$("explore-run"),null,$("explore-location-name"),$("explore-location-desc"),$("explore-visual"),$("explore-exits"));
  gsObj.init();
}

// MODE DÉFIS
let chObj = null;
function initChallenges() {
  chObj = new ChallengeMode({
    termEl:$("challenge-terminal"),inputEl:$("ch-cmd"),runBtn:$("ch-run"),
    descEl:$("ch-desc"),numEl:$("ch-num"),catEl:$("ch-category"),xpEl:$("ch-xp-reward"),
    timerBar:$("ch-timer-fill"),timerLbl:$("ch-timer-label"),skipBtn:$("ch-skip"),dotsEl:$("ch-dots"),
    comboEl:$("ch-combo"),bestEl:$("ch-best"),
  });
  chObj.init();
}

// MODE BOSS
let bsObj = null;
function initBoss() {
  bsObj = new BossMode({
    listEl:$("boss-list"), arenaEl:$("boss-arena"), avatarEl:$("boss-avatar"),
    nameEl:$("boss-name"), tagEl:$("boss-tagline"),
    hpFill:$("boss-hpfill"), hpText:$("boss-hptext"),
    heartsEl:$("boss-hearts"), phaseEl:$("boss-phase-label"), descEl:$("boss-desc"),
    timerFill:$("boss-timer-fill"), timerLbl:$("boss-timer-label"),
    hintBtn:$("boss-hint"), hintText:$("boss-hint-text"),
    termEl:$("boss-terminal"), inputEl:$("boss-cmd"), runBtn:$("boss-run"),
    fleeBtn:$("boss-flee"),
  });
  bsObj.init();
}

// MODE KATA
let ktObj = null;
function initKata() {
  ktObj = new KataMode($("kata-body"));
  ktObj.init();
}

// MODE BANDIT
let bnObj = null;
function initBandit() {
  bnObj = new BanditMode({
    termEl:$("bandit-terminal"),inputEl:$("bandit-cmd"),runBtn:$("bandit-run"),
    levelsList:$("bandit-levels-list"),badgeEl:$("bl-badge"),titleEl:$("bl-title"),
    descEl:$("bl-desc"),hintsEl:$("bl-hints"),winModal:$("modal-bandit-win"),
    winMsg:$("bandit-win-msg"),winNext:$("bandit-win-next"),winClose:$("bandit-win-close"),
  });
  bnObj.init();
}

// MODE BAC À SABLE
let sbTerm = null;
const SANDBOX_FS = {
  "README.txt":   { type:"file", content:"Bac à sable — terminal libre.\nToutes les commandes marchent. Aucun objectif.\nEssaie : ls -la · tree · man grep · head -3 poeme.txt · cut -d',' -f1 data.csv\n         sort doublons.txt | uniq -c · cat *.txt · echo \"hi\" | base64\nEt pour rire : cowsay yo · fortune · sl · sudo make me a sandwich · vim" },
  "notes.txt":    { type:"file", content:"TODO: apprendre grep\nTODO: maîtriser les pipes\nFAIT: installer Linux\nTODO: automatiser avec des scripts\nIDÉE: contribuer à l'open source" },
  "liste.txt":    { type:"file", content:"banane\npomme\ncerise\nabricot\nmangue\nkiwi" },
  "doublons.txt": { type:"file", content:"alpha\nalpha\nbeta\ngamma\ngamma\ngamma\ndelta" },
  "poeme.txt":    { type:"file", content:"Le shell est calme\nles pipes coulent sans fin\nsegfault soudain\n---\nvieux serveur ronronne\nun cron réveille la nuit\nles logs tombent en pluie\n---\nsudo sans réfléchir\nla prod ne répond plus\nle café est froid" },
  "data.csv":     { type:"file", content:"nom,role,ville\nAlice,dev,Paris\nBob,ops,Lyon\nCarla,design,Nice" },
  "script.sh":    { type:"file", perms:"-rwxr-xr-x", content:"#!/bin/bash\necho 'Hello depuis le bac à sable'\nfor i in 1 2 3; do echo \"tour $i\"; done" },
  "secret.b64":   { type:"file", content:"QmllbiBqb3XDqSA6KQ==" },
  "config.json":  { type:"file", content:'{\n  "env": "sandbox",\n  "debug": true,\n  "port": 3000\n}' },
  "logs":         { type:"dir" },
  "logs/app.log": { type:"file", content:"INFO boot ok\nWARN mémoire à 80%\nERROR timeout DB\nINFO retry\nERROR disque plein" },
  "backup.sh":    { type:"file", perms:"-rwxr-xr-x", content:'# Petit script d\'exemple — lance-le avec : bash backup.sh\necho "=== sauvegarde ==="\nfor f in *.txt; do\n  echo "-> copie de $f"\ndone\nif [ -f config.json ]; then\n  echo "config trouvee, on la garde aussi"\nfi\necho "=== termine ==="' },
  ".env":         { type:"file", content:"API_KEY=demo\nSECRET=change_me" },
};
function initSandbox() {
  sbTerm = new Terminal($("sandbox-terminal"));
  sbTerm.ps1User = "user@sandbox";
  sbTerm.loadFS(SANDBOX_FS, { system: true });
  sbTerm.printInfo("🧪 Bac à sable — tape 'help' pour la liste des commandes.");
  sbTerm.printInfo("Le système est explorable : cd / · ls /etc · cat /etc/passwd · tree /var ... (et /root est verrouillé 😏)");
  sbTerm.printInfo("Scripting : x=5 · echo $x · for f in *.txt; do echo $f; done · bash backup.sh");
  sbTerm.printOut("");
  const sbPrompt = document.querySelector(".sandbox-prompt");
  const input = $("sandbox-cmd");
  let hist = [], hi = -1;
  const run = () => {
    const v = input.value.trim(); if (!v) return;
    hist.unshift(v); hi = -1; input.value = "";
    bumpStat(v.split(/\s+/)[0]);
    sbTerm.run(v);
    if (sbPrompt) sbPrompt.textContent = sbTerm.promptStr();
  };
  $("sandbox-run").addEventListener("click", run);
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") run();
    else if (e.key === "Tab") { e.preventDefault(); sbTerm.autocomplete(input); }
    else if (e.key === "ArrowUp") { e.preventDefault(); if (hi < hist.length-1) { hi++; input.value = hist[hi]||""; } }
    else if (e.key === "ArrowDown") { e.preventDefault(); if (hi > 0) { hi--; input.value = hist[hi]||""; } else { hi=-1; input.value=""; } }
  });
  $("sandbox-reset").addEventListener("click", () => {
    sbTerm.loadFS(SANDBOX_FS, { system: true }); sbTerm.clear();
    sbTerm.printInfo("🧪 Bac à sable réinitialisé.");
    if (sbPrompt) sbPrompt.textContent = sbTerm.promptStr();
    if (typeof SFX !== "undefined") SFX.glitch();
  });
}

// Modales
function openModal(id)  { $(id).classList.add("open"); }
function closeModal(id) { $(id).classList.remove("open"); }

// Focus trap accessible : s'applique automatiquement à TOUTE modale ouverte
// (peu importe le fichier qui bascule la classe "open"), pour qu'un utilisateur
// au clavier ne puisse pas Tab-er "derrière" une boîte de dialogue ouverte.
(function setupModalFocusTrap() {
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  let activeModal = null;
  let lastFocused = null;

  function trapKeydown(e) {
    if (!activeModal) return;
    if (e.key === "Escape") { activeModal.classList.remove("open"); return; }
    if (e.key !== "Tab") return;
    const focusables = Array.from(activeModal.querySelectorAll(FOCUSABLE)).filter(el => el.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  document.querySelectorAll(".modal").forEach(modal => {
    new MutationObserver(() => {
      if (modal.classList.contains("open")) {
        activeModal = modal;
        lastFocused = document.activeElement;
        const focusables = modal.querySelectorAll(FOCUSABLE);
        (focusables[0] || modal).focus();
        document.addEventListener("keydown", trapKeydown, true);
      } else if (activeModal === modal) {
        activeModal = null;
        document.removeEventListener("keydown", trapKeydown, true);
        if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
      }
    }).observe(modal, { attributes: true, attributeFilter: ["class"] });
  });
})();

$("win-close").addEventListener("click", () => closeModal("modal-win"));
$("modal-win").addEventListener("click", e => { if(e.target===$("modal-win")) closeModal("modal-win"); });
$("quiz-close").addEventListener("click", () => closeModal("modal-quiz"));
$("modal-quiz").addEventListener("click", e => { if(e.target===$("modal-quiz")) closeModal("modal-quiz"); });

// ── EFFETS DE FOLIE : câblage ──────────────────────────────────
// Vignette CRT
const vignette = document.createElement("div");
vignette.id = "crt-vignette";
document.body.appendChild(vignette);

// Matrix rain en fond
let matrix = null;
try { matrix = new MatrixRain(); matrix.start(); } catch(e) {}

// Easter eggs (Konami)
try { new EasterEggs(); } catch(e) {}

// Bouton son
let soundOn = true;
const soundBtn = $("sound-toggle");
if (soundBtn) {
  soundBtn.addEventListener("click", () => {
    soundOn = !soundOn;
    SFX.enabled = soundOn;
    soundBtn.textContent = soundOn ? "🔊" : "🔇";
    if (soundOn) SFX.enter();
  });
}
// Bouton son dans le profil
const pfSound = $("pf-sound");
if (pfSound) {
  pfSound.addEventListener("click", () => {
    soundOn = !soundOn;
    SFX.enabled = soundOn;
    pfSound.textContent = soundOn ? "🔊 Son : ON" : "🔇 Son : OFF";
    if (soundBtn) soundBtn.textContent = soundOn ? "🔊" : "🔇";
  });
}
// Reset progression
const pfReset = $("pf-reset");
if (pfReset) {
  pfReset.addEventListener("click", () => {
    if (confirm("Réinitialiser toute ta progression ? C'est irréversible.")) {
      localStorage.removeItem(SAVE_KEY);
      GAME = defaultSave();
      updateXPBar(); updateHomeStats();
      if (typeof updateNavRank === "function") updateNavRank();
      if (typeof renderProfile === "function") renderProfile();
      SFX.glitch();
    }
  });
}

// Menu hamburger mobile
const hamburger = $("nav-hamburger");
const navLinks = $("nav-links");
if (hamburger && navLinks) {
  hamburger.addEventListener("click", () => navLinks.classList.toggle("open"));
  navLinks.querySelectorAll(".nav-btn").forEach(b => b.addEventListener("click", () => navLinks.classList.remove("open")));
}

// Son au clavier (tous les inputs)
document.querySelectorAll("input[type=text]").forEach(inp => {
  inp.addEventListener("keydown", e => {
    if (e.key === "Enter") SFX.enter();
    else if (e.key.length === 1) SFX.key();
  });
});

// Son d'erreur : on observe le terminal principal
const origPrintErr = Terminal.prototype.printErr;
Terminal.prototype.printErr = function(text) {
  if (typeof SFX !== "undefined") SFX.error();
  return origPrintErr.call(this, text);
};

// Glitch sur le logo au clic
$("nav-logo").addEventListener("click", () => {
  const t = document.querySelector(".nav-logo-text");
  if (t) glitchElement(t, 500);
});

// Init
if (typeof applyTheme === "function") applyTheme(currentThemeId());
updateXPBar();
updateHomeStats();
if (typeof updateNavRank === "function") updateNavRank();
if (typeof objectivesTick === "function") objectivesTick();
if (typeof initDailyModal === "function") initDailyModal();
if (typeof updateDailyBanner === "function") updateDailyBanner();
const dailyBtn = $("daily-banner-btn");
if (dailyBtn) dailyBtn.addEventListener("click", () => { if (typeof openDaily === "function") openDaily(); });

// Boot sequence au premier chargement
try {
  new BootSequence(() => {
    // Petit son de bienvenue
    if (soundOn) SFX.enter();
  }).run();
} catch(e) {}

