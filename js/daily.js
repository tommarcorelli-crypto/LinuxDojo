// daily.js — Défi du jour : un défi par jour, +50 XP bonus, une seule fois

// Pool de défis quotidiens (indépendants du mode Défis normal)
const DAILY_POOL = [
  {
    title: "🔍 Traque d'erreurs",
    desc: "Un serveur a planté cette nuit. Trouve les lignes contenant <strong>ERROR</strong> dans <code>server.log</code>.",
    fs: { "server.log": { type:"file", content:"INFO démarrage\nERROR timeout DB\nINFO ok\nERROR disk full\nWARN memory low\nERROR crash\nINFO fin" } },
    check: (out) => /timeout|disk|crash/i.test(out) && !/warn/i.test(out),
    hint: "grep ERROR server.log"
  },
  {
    title: "📊 Comptage rapide",
    desc: "Combien de lignes contient <code>data.txt</code> ? Trouve le nombre exact.",
    fs: { "data.txt": { type:"file", content:"a\nb\nc\nd\ne\nf\ng\nh\ni\nj\nk\nl" } },
    check: (out) => /\b12\b/.test(out),
    hint: "wc -l data.txt"
  },
  {
    title: "🗂️ Chasse aux .log",
    desc: "Trouve tous les fichiers <code>.log</code> dans le répertoire courant.",
    fs: { "app.log":{type:"file",content:""}, "error.log":{type:"file",content:""}, "note.txt":{type:"file",content:""}, "config.json":{type:"file",content:""}, "debug.log":{type:"file",content:""} },
    check: (out) => /app\.log/.test(out) && /error\.log/.test(out) && /debug\.log/.test(out) && !/\.json|\.txt/.test(out),
    hint: "find . -name '*.log'"
  },
  {
    title: "🕵️ Cachette",
    desc: "Un fichier caché contient un secret. Liste TOUS les fichiers pour le repérer.",
    fs: { "visible.txt":{type:"file",content:""}, ".secret":{type:"file",content:"trouvé !"}, ".env":{type:"file",content:"KEY=x"} },
    check: (out) => /\.secret|\.env/.test(out),
    hint: "ls -a  ou  ls -la"
  },
  {
    title: "📝 Signature de version",
    desc: "Écris exactement <strong>v2.0.0</strong> dans un fichier nommé <code>VERSION</code>.",
    fs: {},
    check: (out, s) => s.redirect === "VERSION",
    hint: 'echo "v2.0.0" > VERSION'
  },
  {
    title: "🔤 Tri alphabétique",
    desc: "Trie <code>fruits.txt</code> par ordre alphabétique. La 1ère ligne du résultat doit commencer par 'a'.",
    fs: { "fruits.txt":{type:"file",content:"banane\npomme\nabricot\ncerise\nananas"} },
    check: (out) => { const l = out.split("\n").filter(Boolean); return l[0] === "abricot" || l[0] === "ananas"; },
    hint: "sort fruits.txt"
  },
  {
    title: "🔐 Décodage Base64",
    desc: "Le fichier <code>msg.b64</code> contient un message caché. Décode-le.",
    fs: { "msg.b64":{type:"file",content:"QmllbiBqb3XDqSA6KQ=="} },  // "Bien joué :)"
    check: (out) => /bien|jou/i.test(out),
    hint: "base64 -d msg.b64"
  },
  {
    title: "🧮 Comptage d'erreurs",
    desc: "Compte le nombre exact d'occurrences de <strong>ERROR</strong> dans <code>app.log</code>.",
    fs: { "app.log":{type:"file",content:"INFO\nERROR 1\nINFO\nERROR 2\nWARN\nERROR 3\nINFO"} },
    check: (out) => /\b3\b/.test(out),
    hint: "grep ERROR app.log | wc -l"
  },
  {
    title: "🎯 Extraction de colonne",
    desc: "Affiche uniquement les noms (1ère colonne) de <code>users.csv</code>.",
    fs: { "users.csv":{type:"file",content:"Alice,25,Paris\nBob,30,Lyon\nCarla,22,Nice"} },
    check: (out) => /alice/i.test(out) && /bob/i.test(out) && !/25|30|22/.test(out),
    hint: "awk -F',' '{print $1}' users.csv"
  },
  {
    title: "🔀 Renommage",
    desc: "Renomme <code>draft.txt</code> en <code>final.txt</code>.",
    fs: { "draft.txt":{type:"file",content:"brouillon"} },
    check: (out, s) => s.mv === "final.txt",
    hint: "mv draft.txt final.txt"
  },
  {
    title: "🧙 ROT13",
    desc: "Le fichier <code>msg.rot</code> est chiffré en ROT13. Déchiffre-le.",
    fs: { "msg.rot":{type:"file",content:"Uryyb Yvahk !"} },  // "Hello Linux !"
    check: (out) => /hello|linux/i.test(out),
    hint: "rot13 msg.rot"
  },
  {
    title: "🔎 Recherche insensible",
    desc: "Trouve toutes les lignes mentionnant Linux (LINUX, Linux, linux...) dans <code>notes.txt</code>.",
    fs: { "notes.txt":{type:"file",content:"J'aime Linux\nLINUX est puissant\nMac est différent\nlinux domine"} },
    check: (out) => (out.match(/linux/gi) || []).length >= 3,
    hint: "grep -i linux notes.txt"
  },
  {
    title: "👀 Juste le début",
    desc: "Le rapport est trop long. Affiche seulement ses <strong>2 premières lignes</strong>.",
    fs: { "rapport.txt":{type:"file",content:"résumé exécutif\nbudget validé\ndétails ennuyeux\nannexe 1\nannexe 2"} },
    check: (out) => /résumé|resume/.test(out) && /budget/.test(out) && !/annexe/.test(out),
    hint: "head -n 2 rapport.txt"
  },
  {
    title: "🏁 La fin de l'histoire",
    desc: "Affiche uniquement la <strong>dernière ligne</strong> de <code>course.txt</code> pour connaître le vainqueur.",
    fs: { "course.txt":{type:"file",content:"départ donné\nvirage serré\nchute dans le peloton\nsprint final\nvainqueur : turbo-escargot"} },
    check: (out) => /turbo-escargot/.test(out) && !/départ|depart/.test(out),
    hint: "tail -n 1 course.txt"
  },
  {
    title: "✂️ Chirurgie de colonnes",
    desc: "Extrais uniquement les <strong>prénoms</strong> (2e colonne) de <code>equipe.csv</code>, séparateur virgule.",
    fs: { "equipe.csv":{type:"file",content:"1,malik,capitaine\n2,sona,gardienne\n3,rex,attaquant"} },
    check: (out) => /malik/.test(out) && /sona/.test(out) && !/capitaine|gardienne/.test(out),
    hint: "cut -d',' -f2 equipe.csv"
  },
  {
    title: "🧬 Sans doublons",
    desc: "Compte combien d'<strong>espèces différentes</strong> contient <code>zoo.txt</code> (doublons exclus).",
    fs: { "zoo.txt":{type:"file",content:"panda\ntigre\npanda\nloutre\ntigre\npanda\nokapi"} },
    check: (out) => /\b4\b/.test(out),
    hint: "sort zoo.txt | uniq | wc -l   (ou sort -u zoo.txt | wc -l)"
  },
];

const DAILY_KEY = "linuxdojo_daily";  // { date: "YYYY-MM-DD", done: false, idx: N }

function _fmtKey(d) {
  return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
}
function _todayKey() { return _fmtKey(new Date()); }
function _yesterdayKey() { const d = new Date(); d.setDate(d.getDate() - 1); return _fmtKey(d); }
function _daysSinceRef() {
  const d = new Date(); const ref = new Date(2020,0,1);
  return Math.floor((d - ref) / 86400000);
}
function _dayIndex() {
  // Index déterministe basé sur le nombre de jours depuis 2020-01-01
  const days = _daysSinceRef();
  return ((days % DAILY_POOL.length) + DAILY_POOL.length) % DAILY_POOL.length;
}
// Numéro de défi façon Wordle : croît chaque jour, indépendant de la taille du pool
// (le pool boucle, mais le numéro affiché continue toujours d'avancer)
function _dayNumber() { return _daysSinceRef() + 1; }
function _loadDaily() {
  try { return JSON.parse(localStorage.getItem(DAILY_KEY)) || {}; } catch { return {}; }
}
function _saveDaily(state) { try { localStorage.setItem(DAILY_KEY, JSON.stringify(state)); } catch {} }

function dailyStatus() {
  const st = _loadDaily();
  const today = _todayKey();
  return (st.date === today && st.done) ? "done" : "todo";
}

// Série en cours : nombre de jours consécutifs. 0 si la série est rompue
// (dernier défi ni aujourd'hui ni hier).
function dailyStreak() {
  const st = _loadDaily();
  if (st.date === _todayKey() || st.date === _yesterdayKey()) return st.streak || 0;
  return 0;
}
function dailyBest() { return _loadDaily().best || 0; }

function updateDailyBanner() {
  const status = dailyStatus();
  const badge = document.getElementById("daily-banner-status");
  const sub   = document.getElementById("daily-banner-sub");
  const btn   = document.getElementById("daily-banner-btn");
  const dayName = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  if (!badge || !sub || !btn) return;

  // Puce de série 🔥
  const streakChip = document.getElementById("daily-banner-streak");
  if (streakChip) {
    const s = dailyStreak();
    if (s >= 2) { streakChip.style.display = ""; streakChip.textContent = "🔥 " + s + " j"; }
    else { streakChip.style.display = "none"; }
  }
  if (status === "done") {
    badge.textContent = " ✓";
    badge.style.color = "var(--green-li)";
    sub.textContent = "Reviens demain pour un nouveau défi.";
    btn.textContent = "Revoir";
  } else {
    badge.textContent = "";
    sub.textContent = "Résous le défi du " + dayName + " pour +50 XP bonus.";
    btn.textContent = "Relever le défi";
  }
}

// État de la modale
let _dailyTerm = null;
let _dailyAttempts = 0;  // tentatives ratées depuis l'ouverture (remis à zéro à chaque ouverture)

function openDaily() {
  const idx = _dayIndex();
  const ch  = DAILY_POOL[idx];
  const state = _loadDaily();
  const today = _todayKey();
  const alreadyDone = state.date === today && state.done;

  const _s = dailyStreak();
  document.getElementById("daily-date").textContent = "📅 " + new Date().toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" }) + (_s >= 2 ? "  ·  🔥 " + _s + " j" : "");
  document.getElementById("daily-reward").textContent = alreadyDone ? "✓ Terminé aujourd'hui" : "+50 XP bonus";
  document.getElementById("daily-title").textContent = ch.title;
  document.getElementById("daily-desc").innerHTML = ch.desc + (alreadyDone ? '<br><span style="color:var(--green-li);font-size:12px">Tu peux le refaire pour t\'entraîner (sans récompense).</span>' : "");
  document.getElementById("daily-status").innerHTML = alreadyDone ? _dailyShareBlock(state) : "";
  _dailyAttempts = 0;

  // Init terminal si pas déjà fait
  const termEl = document.getElementById("daily-terminal");
  termEl.innerHTML = "";
  _dailyTerm = new Terminal(termEl);
  _dailyTerm.ps1User = "user@jour";
  _dailyTerm.loadFS(ch.fs);
  _dailyTerm.printInfo("🎯 " + ch.title);
  _dailyTerm.printOut("");
  _dailyTerm.printOut("Astuce cachée : " + (alreadyDone ? ch.hint : "clique 3 fois sur le titre pour voir l'indice"));

  // Astuce à révéler
  let clicks = 0;
  const titleEl = document.getElementById("daily-title");
  titleEl.style.cursor = "pointer";
  titleEl.onclick = () => {
    clicks++;
    if (clicks === 3 && !alreadyDone) {
      _dailyTerm.printInfo("💡 " + ch.hint);
      titleEl.onclick = null;
    }
  };

  document.getElementById("modal-daily").classList.add("open");
  setTimeout(() => document.getElementById("daily-cmd").focus(), 150);
}

function _dailyRun() {
  const idx = _dayIndex();
  const ch  = DAILY_POOL[idx];
  const input = document.getElementById("daily-cmd");
  const raw = input.value.trim();
  if (!raw) return;
  input.value = "";
  if (typeof bumpStat === "function") bumpStat(raw.split(/\s+/)[0]);

  const result = _dailyTerm.run(raw);
  const out = result.output || "";

  let ok = false;
  try { ok = ch.check(out.toLowerCase(), _dailyTerm.state); } catch(e) {}
  if (!ok) { _dailyAttempts++; return; }

  const state = _loadDaily();
  const today = _todayKey();
  const first = !(state.date === today && state.done);

  if (first) {
    // Mise à jour de la série : +1 si le dernier défi datait d'hier, sinon on repart à 1
    const streak = (state.date === _yesterdayKey()) ? (state.streak || 0) + 1 : 1;
    const best   = Math.max(state.best || 0, streak);
    const attempts = _dailyAttempts + 1;  // tentatives ratées + le coup gagnant

    const streakBonus = Math.min((streak - 1) * 5, 50);   // +5 XP/jour de série, plafonné à +50
    const gain = 50 + streakBonus;
    _saveDaily({ date: today, done: true, idx, streak, best, attempts, gain, dayNumber: _dayNumber() });

    if (typeof addXP === "function") addXP(gain);
    if (typeof SFX !== "undefined") SFX.success();
    if (typeof burstParticles === "function") burstParticles(window.innerWidth/2, window.innerHeight*0.35);
    _dailyTerm.printOk("✅ Défi du jour réussi ! +" + gain + " XP" + (streakBonus ? "  (série 🔥" + streak + " → +" + streakBonus + " bonus)" : " bonus"));
    document.getElementById("daily-status").innerHTML =
      '<div class="daily-success">🎉 Bravo ! ' + (streak >= 2 ? "Série de 🔥" + streak + " jours ! " : "") + 'Reviens demain pour la continuer.</div>' +
      _dailyShareBlock(_loadDaily());
    if (typeof showAchievement === "function")
      showAchievement(streak >= 2 ? "🔥" : "📅", streak >= 2 ? "Série de " + streak + " jours" : "Défi du jour", "+" + gain + " XP");
    updateDailyBanner();
  } else {
    _dailyTerm.printOk("✅ Correct ! (déjà validé aujourd'hui)");
  }
}

// ── Grille partageable façon Wordle ─────────────────────────
// Construit une chaîne de blocs 🟥/🟩 représentant le nombre de tentatives
// (plafonné visuellement à 5 échecs affichés, au-delà on résume avec un chiffre)
function _dailyShareGrid(attempts) {
  const fails = Math.max(0, (attempts || 1) - 1);
  if (fails <= 5) return "🟥".repeat(fails) + "🟩";
  return "🟥×" + fails + " 🟩";
}

function _dailyShareText(state) {
  const grid = _dailyShareGrid(state.attempts);
  const lines = [
    "LinuxDojo — Défi #" + (state.dayNumber || _dayNumber()),
    grid,
  ];
  if ((state.streak || 0) >= 2) lines.push("🔥 Série de " + state.streak + " jours");
  lines.push("+" + (state.gain || 50) + " XP");
  lines.push("https://tommarcorelli.github.io/LinuxDojo/");
  return lines.join("\n");
}

function _dailyShareBlock(state) {
  if (!state || !state.attempts) return "";
  return '<div class="daily-share">' +
    '<div class="daily-share-grid">' + _dailyShareGrid(state.attempts) + '</div>' +
    '<button id="daily-share-btn" class="btn-ghost" type="button">📋 Partager mon résultat</button>' +
    '</div>';
}

function shareDailyResult() {
  const state = _loadDaily();
  if (!state || !state.attempts) return;
  const text = _dailyShareText(state);
  const done = () => { if (typeof showToast === "function") showToast("📋 Résultat copié — colle-le où tu veux !"); };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => prompt("Copie ton résultat :", text));
  } else {
    prompt("Copie ton résultat :", text);
  }
}

function initDailyModal() {
  const runBtn = document.getElementById("daily-run");
  const input  = document.getElementById("daily-cmd");
  const close  = document.getElementById("daily-close");
  if (!runBtn || !input) return;
  runBtn.addEventListener("click", _dailyRun);
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") _dailyRun();
    else if (e.key === "Tab") { e.preventDefault(); if (_dailyTerm) _dailyTerm.autocomplete(input); }
  });
  close.addEventListener("click", () => document.getElementById("modal-daily").classList.remove("open"));
  document.getElementById("modal-daily").addEventListener("click", e => {
    if (e.target.id === "modal-daily") document.getElementById("modal-daily").classList.remove("open");
    else if (e.target.id === "daily-share-btn") shareDailyResult();
  });
}
