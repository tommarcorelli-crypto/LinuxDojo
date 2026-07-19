// profile.js — Page profil : rang, stats, badges, anneaux, thèmes

/* ── Thèmes déblocables ────────────────────────────────────── */
const THEMES = [
  { id: "default", name: "Néon Violet", cls: "",             min: 0,    sw: "linear-gradient(135deg,#7c3aed,#3b82f6,#06b6d4)" },
  { id: "matrix",  name: "Matrix",      cls: "theme-matrix", min: 150,  sw: "linear-gradient(135deg,#16a34a,#22c55e,#4ade80)" },
  { id: "ocean",   name: "Abysses",     cls: "theme-ocean",  min: 300,  sw: "linear-gradient(135deg,#0369a1,#0ea5e9,#38bdf8)" },
  { id: "cyber",   name: "Cyberpunk",   cls: "theme-cyber",  min: 500,  sw: "linear-gradient(135deg,#ec4899,#8b5cf6,#06b6d4)" },
  { id: "amber",   name: "Rétro Ambre", cls: "theme-amber",  min: 800,  sw: "linear-gradient(135deg,#b45309,#f59e0b,#fbbf24)" },
  { id: "blood",   name: "Sang & Feu",  cls: "theme-blood",  min: 1200, sw: "linear-gradient(135deg,#7f1d1d,#dc2626,#f87171)" },
  { id: "synthwave", name: "Synthwave", cls: "theme-synthwave", min: 1600, sw: "linear-gradient(135deg,#ff2975,#b967ff,#01cdfe)" },
  { id: "vantablack", name: "Vantablack", cls: "theme-vantablack", min: 2200, sw: "linear-gradient(135deg,#111,#334155,#e2e8f0)" },
];
const THEME_KEY = "linuxdojo_theme";
function currentThemeId() { try { return localStorage.getItem(THEME_KEY) || "default"; } catch { return "default"; } }
function applyTheme(id) {
  const t = THEMES.find(x => x.id === id) || THEMES[0];
  // retire toute classe theme-* sans toucher aux autres (ex: rainbow-mode)
  document.body.className = document.body.className.replace(/\btheme-\S+/g, "").trim();
  if (t.cls) document.body.classList.add(t.cls);
  try { localStorage.setItem(THEME_KEY, t.id); } catch {}
}
function renderThemes() {
  const el = document.getElementById("pf-themes");
  if (!el) return;
  const xp = GAME.xp;
  const cur = currentThemeId();
  el.innerHTML = "";
  THEMES.forEach(t => {
    const locked = xp < t.min;
    const active = t.id === cur;
    const card = document.createElement("div");
    card.className = "theme-card" + (active ? " active" : "") + (locked ? " locked" : "");
    card.innerHTML = `<span class="theme-swatch" style="background:${t.sw}"></span>
      <div class="theme-meta"><div class="theme-name">${t.name}</div>
      <div class="theme-req">${locked ? "🔒 " + t.min + " XP" : "débloqué"}</div></div>`;
    if (!locked) card.addEventListener("click", () => {
      applyTheme(t.id);
      if (typeof SFX !== "undefined") SFX.enter();
      renderThemes();
    });
    el.appendChild(card);
  });
}

function renderProfile() {
  const xp   = GAME.xp;
  const rank = getRank(xp);
  const next = getNextRank(xp);

  // Avatar + rang
  const av = document.getElementById("pf-avatar");
  if (av) av.textContent = rank.icon;
  const rn = document.getElementById("pf-rank");
  if (rn) { rn.textContent = rankName(rank); rn.style.color = rank.color; }
  const sub = document.getElementById("pf-sub");
  if (sub) sub.textContent = t("profile.rankSub", { xp, lv: Math.floor(xp/100)+1 });

  // Barre vers le prochain rang
  const fill = document.getElementById("pf-rank-fill");
  const nextTxt = document.getElementById("pf-next");
  if (fill) {
    if (next) {
      const span = next.min - rank.min;
      const prog = ((xp - rank.min) / span) * 100;
      fill.style.width = Math.min(100, prog) + "%";
      if (nextTxt) nextTxt.textContent = (next.min - xp) + " XP avant le rang " + next.name + " " + next.icon;
    } else {
      fill.style.width = "100%";
      if (nextTxt) nextTxt.textContent = "🔥 Rang maximum atteint !";
    }
  }

  // Série de défis quotidiens
  const streakEl = document.getElementById("pf-streak");
  if (streakEl && typeof dailyStreak === "function") {
    const s = dailyStreak();
    const b = (typeof dailyBest === "function") ? dailyBest() : 0;
    if (s >= 1)      streakEl.textContent = "🔥 Série quotidienne : " + s + " j  ·  record " + b + " j";
    else if (b >= 1) streakEl.textContent = "🔥 Série rompue  ·  record " + b + " j";
    else             streakEl.textContent = "";
  }

  // Objectifs (débloque ceux atteints puis affiche la grille profil)
  if (typeof objectivesTick === "function") objectivesTick();

  // Anneaux de progression par mode
  const rings = document.getElementById("pf-rings");
  if (rings) {
    const learnDone = GAME.completed.size;
    const learnTotal = (typeof CHAPTERS !== "undefined") ? CHAPTERS.flatMap(c => c.missions).length : 36;
    const bossTotal = (typeof BOSS_FIGHTS !== "undefined") ? BOSS_FIGHTS.length : 6;
    const bossDone  = (typeof bossKills === "function") ? bossKills() : 0;
    const data = [
      { label: "Apprendre",    done: learnDone, total: learnTotal, color: "#7c3aed", icon: "📖" },
      { label: "Boss",         done: bossDone, total: bossTotal, color: "#ef4444", icon: "⚔️" },
      { label: "Badges",       done: GAME.badges.length, total: (typeof BADGES !== "undefined") ? BADGES.length : 12, color: "#eab308", icon: "🏅" },
      { label: "Niveau",       done: Math.floor(xp/100)+1, total: 25, color: "#06b6d4", icon: "⚡" },
    ];
    rings.innerHTML = "";
    data.forEach(d => {
      const pct = Math.min(100, (d.done/d.total)*100);
      const circ = 2 * Math.PI * 40;
      const offset = circ - (pct/100)*circ;
      const ring = document.createElement("div");
      ring.className = "profile-ring";
      ring.innerHTML = `
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="8"/>
          <circle cx="50" cy="50" r="40" fill="none" stroke="${d.color}" stroke-width="8"
                  stroke-dasharray="${circ}" stroke-dashoffset="${offset}"
                  stroke-linecap="round" transform="rotate(-90 50 50)"
                  style="transition:stroke-dashoffset 1s cubic-bezier(0.2,0.9,0.3,1);filter:drop-shadow(0 0 6px ${d.color})"/>
          <text x="50" y="46" text-anchor="middle" font-size="20">${d.icon}</text>
          <text x="50" y="64" text-anchor="middle" font-size="13" fill="#e2e8f0" font-family="monospace">${d.done}/${d.total}</text>
        </svg>
        <div class="profile-ring-label">${d.label}</div>`;
      rings.appendChild(ring);
    });
  }

  // Badges
  const badgesEl = document.getElementById("pf-badges");
  if (badgesEl) {
    badgesEl.innerHTML = "";
    BADGES.forEach(b => {
      const unlocked = GAME.badges.includes(b.id);
      const el = document.createElement("div");
      el.className = "profile-badge " + (unlocked ? "unlocked" : "locked") + (b.secret ? " profile-badge-secret" : "");
      const name = unlocked ? b.label.split(" ").slice(1).join(" ") : (b.secret ? "???" : b.label.split(" ").slice(1).join(" "));
      el.innerHTML = `<div class="profile-badge-icon">${unlocked ? b.label.split(" ")[0] : "🔒"}</div><div class="profile-badge-name">${name}</div>`;
      badgesEl.appendChild(el);
    });
  }
  renderBadgesShare(rank, xp);

  renderStats();
  renderHeatmap();
  renderThemes();
  if (typeof renderCertificate === "function") renderCertificate();
  if (typeof renderBelts === "function") renderBelts();
  renderErrorLogStatus();
}

/* ── Heatmap d'activité (style GitHub, 12 semaines) ────────── */
function renderHeatmap() {
  const el = document.getElementById("pf-heatmap");
  if (!el) return;
  const days = (typeof STATS !== "undefined" && STATS.days) ? STATS.days : {};

  const today = new Date(); today.setHours(0,0,0,0);
  const dow = (today.getDay() + 6) % 7;              // lundi = 0
  const start = new Date(today);
  start.setDate(start.getDate() - dow - 77);          // 11 semaines avant le lundi courant

  const fmt = d => d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
  const lvl = n => n === 0 ? "" : n < 10 ? " hm-l1" : n < 25 ? " hm-l2" : n < 50 ? " hm-l3" : " hm-l4";

  let cells = "";
  let activeDays = 0, totalCmds = 0;
  for (let i = 0; i < 84; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    if (d > today) { cells += '<div class="hm-cell hm-future"></div>'; continue; }
    const n = days[fmt(d)] || 0;
    if (n > 0) { activeDays++; totalCmds += n; }
    const label = d.toLocaleDateString("fr-FR", { weekday:"short", day:"numeric", month:"short" });
    cells += `<div class="hm-cell${lvl(n)}" title="${n} commande${n>1?"s":""} — ${label}"></div>`;
  }

  el.innerHTML =
    '<div class="hm-grid">' + cells + '</div>' +
    '<div class="hm-legend"><span style="margin-right:6px">' + totalCmds + ' commandes sur 12 semaines</span>' +
    '<span>moins</span><span class="hm-cell"></span><span class="hm-cell hm-l1"></span><span class="hm-cell hm-l2"></span><span class="hm-cell hm-l3"></span><span class="hm-cell hm-l4"></span><span>plus</span></div>';

  const count = document.getElementById("pf-heatmap-count");
  if (count) count.textContent = activeDays + " jour" + (activeDays > 1 ? "s" : "") + " actif" + (activeDays > 1 ? "s" : "");
}

/* ── Partage social des badges ─────────────────────────────── */
function _badgesShareText(rank, xp) {
  const unlocked = BADGES.filter(b => GAME.badges.includes(b.id) && !b.secret);
  const secretsUnlocked = BADGES.filter(b => GAME.badges.includes(b.id) && b.secret).length;
  const lines = [
    "LinuxDojo — " + GAME.badges.length + "/" + BADGES.length + " badges débloqués 🏅",
  ];
  if (unlocked.length) {
    lines.push(unlocked.slice(0, 8).map(b => b.label.split(" ")[0]).join(" "));
  }
  if (secretsUnlocked > 0) lines.push("dont " + secretsUnlocked + " badge(s) secret(s) 🤫");
  lines.push("Rang : " + rankName(rank) + " " + rank.icon + " · " + xp + " XP");
  lines.push("https://tommarcorelli.github.io/LinuxDojo/");
  return lines.join("\n");
}

function shareBadges() {
  const rank = getRank(GAME.xp);
  const text = _badgesShareText(rank, GAME.xp);
  const done = () => { if (typeof showToast === "function") showToast("📋 Résultat copié — colle-le où tu veux !"); };
  const share = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => prompt("Copie ton résultat :", text));
    } else {
      prompt("Copie ton résultat :", text);
    }
  };
  if (navigator.share) {
    navigator.share({ text, title: "LinuxDojo — Mes badges" }).catch(err => {
      if (err && err.name !== "AbortError") share(); // AbortError = l'utilisateur a fermé la fenêtre de partage, pas d'échec à gérer
    });
  } else {
    share();
  }
}

function renderBadgesShare(rank, xp) {
  const host = document.getElementById("pf-badges-share");
  if (!host) return;
  if (!GAME.badges.length) { host.innerHTML = ""; return; }
  host.innerHTML = '<button class="btn-ghost" id="pf-badges-share-btn" type="button">📋 Partager mes badges</button>';
  const btn = document.getElementById("pf-badges-share-btn");
  if (btn) btn.addEventListener("click", shareBadges);
}

/* ── Export / Import de sauvegarde ─────────────────────────── */
function _b64EncodeUnicode(s) { return btoa(unescape(encodeURIComponent(s))); }
function _b64DecodeUnicode(s) { return decodeURIComponent(escape(atob(s))); }

function exportSave() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("linuxdojo")) data[k] = localStorage.getItem(k);
  }
  const code = _b64EncodeUnicode(JSON.stringify({ v: 1, exportedAt: new Date().toISOString(), data }));
  const done = () => { if (typeof showToast === "function") showToast("📤 Sauvegarde copiée dans le presse-papier !"); };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code).then(done).catch(() => prompt("Copie ce code de sauvegarde :", code));
  } else {
    prompt("Copie ce code de sauvegarde :", code);
  }
}

function importSave() {
  const code = prompt("Colle ton code de sauvegarde LinuxDojo :");
  if (!code) return;
  try {
    const parsed = JSON.parse(_b64DecodeUnicode(code.trim()));
    if (!parsed || typeof parsed.data !== "object") throw new Error("format");
    const keys = Object.keys(parsed.data).filter(k => k.startsWith("linuxdojo"));
    if (!keys.length) throw new Error("vide");
    if (!confirm("Importer cette sauvegarde ? Elle remplacera ta progression actuelle (" + keys.length + " clés).")) return;
    keys.forEach(k => localStorage.setItem(k, parsed.data[k]));
    location.reload();
  } catch (e) {
    alert("❌ Code de sauvegarde invalide.");
  }
}

// ── Journal d'erreurs (js/errors.js) ────────────────────────
// Affiche combien d'erreurs JS ont été capturées côté joueur, avec un
// bouton pour copier un rapport (même mécanique presse-papier/repli que
// exportSave) et un pour vider le journal.
function renderErrorLogStatus() {
  const status = document.getElementById("pf-err-status");
  if (!status || typeof getErrorLog !== "function") return;
  const log = getErrorLog();
  if (!log.length) {
    status.textContent = "Aucune erreur détectée 👍";
  } else {
    const total = log.reduce((sum, e) => sum + (e.count || 1), 0);
    status.textContent = `⚠️ ${log.length} erreur(s) distincte(s) (${total} occurrence(s) au total)`;
  }
}

function copyErrorReport() {
  if (typeof getErrorLog !== "function") return;
  const log = getErrorLog();
  if (!log.length) { if (typeof showToast === "function") showToast("Aucune erreur à copier 👍"); return; }
  const report = JSON.stringify({ exportedAt: new Date().toISOString(), errors: log }, null, 2);
  const done = () => { if (typeof showToast === "function") showToast("📋 Rapport d'erreurs copié !"); };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(report).then(done).catch(() => prompt("Copie ce rapport d'erreurs :", report));
  } else {
    prompt("Copie ce rapport d'erreurs :", report);
  }
}

function clearErrorReport() {
  if (typeof clearErrorLog !== "function") return;
  clearErrorLog();
  renderErrorLogStatus();
  if (typeof showToast === "function") showToast("🗑️ Journal d'erreurs vidé.");
}

// Câblage des boutons (les scripts sont chargés en fin de body, le DOM existe)
(() => {
  const ex = document.getElementById("pf-export");
  const im = document.getElementById("pf-import");
  const nm = document.getElementById("pf-name");
  const ec = document.getElementById("pf-err-copy");
  const ev = document.getElementById("pf-err-clear");
  if (ex) ex.addEventListener("click", exportSave);
  if (im) im.addEventListener("click", importSave);
  if (nm && typeof setNinjaName === "function") nm.addEventListener("click", setNinjaName);
  if (ec) ec.addEventListener("click", copyErrorReport);
  if (ev) ev.addEventListener("click", clearErrorReport);
})();

function updateNavRank() {
  const rank = getRank(GAME.xp);
  const badge = document.getElementById("nav-rank");
  const icon = document.querySelector("#nav-rank .rank-icon");
  const name = document.getElementById("nav-rank-name");
  if (badge) badge.style.setProperty("--rank-color", rank.color);
  if (icon) icon.textContent = rank.icon;
  if (name) { name.textContent = rankName(rank); name.style.color = rank.color; }
}

function renderStats() {
  const el = document.getElementById("pf-stats");
  if (!el) return;
  const stats = (typeof STATS !== "undefined") ? STATS : { cmd:{}, total:0 };
  const entries = Object.entries(stats.cmd || {}).sort((a,b) => b[1]-a[1]).slice(0, 6);
  if (!entries.length) { el.innerHTML = '<p style="color:var(--text-dim);font-size:13px">Aucune commande tapée pour l\'instant. Lance un mode et reviens !</p>'; return; }
  const max = entries[0][1];
  el.innerHTML = `<p style="color:var(--text-dim);font-size:12px;margin-bottom:12px">${stats.total} commandes tapées au total</p>` +
    entries.map(([cmd, n]) => {
      const pct = Math.round((n/max)*100);
      return `<div class="stat-bar-row">
        <span class="stat-bar-cmd">${cmd}</span>
        <div class="stat-bar-track"><div class="stat-bar-fill" style="width:${pct}%"></div></div>
        <span class="stat-bar-count">${n}×</span>
      </div>`;
    }).join("");
}
