// profile.js — Page profil : rang, stats, badges, anneaux, thèmes

/* ── Thèmes déblocables ────────────────────────────────────── */
const THEMES = [
  { id: "default", name: "Néon Violet", cls: "",             min: 0,    sw: "linear-gradient(135deg,#7c3aed,#3b82f6,#06b6d4)" },
  { id: "matrix",  name: "Matrix",      cls: "theme-matrix", min: 150,  sw: "linear-gradient(135deg,#16a34a,#22c55e,#4ade80)" },
  { id: "ocean",   name: "Abysses",     cls: "theme-ocean",  min: 300,  sw: "linear-gradient(135deg,#0369a1,#0ea5e9,#38bdf8)" },
  { id: "cyber",   name: "Cyberpunk",   cls: "theme-cyber",  min: 500,  sw: "linear-gradient(135deg,#ec4899,#8b5cf6,#06b6d4)" },
  { id: "amber",   name: "Rétro Ambre", cls: "theme-amber",  min: 800,  sw: "linear-gradient(135deg,#b45309,#f59e0b,#fbbf24)" },
  { id: "blood",   name: "Sang & Feu",  cls: "theme-blood",  min: 1200, sw: "linear-gradient(135deg,#7f1d1d,#dc2626,#f87171)" },
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
  if (rn) { rn.textContent = rank.name; rn.style.color = rank.color; }
  const sub = document.getElementById("pf-sub");
  if (sub) sub.textContent = xp + " XP · Niveau " + (Math.floor(xp/100)+1);

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
    const learnTotal = 30;
    const data = [
      { label: "Apprendre",    done: learnDone, total: learnTotal, color: "#7c3aed", icon: "📖" },
      { label: "Badges",       done: GAME.badges.length, total: 9, color: "#eab308", icon: "🏅" },
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
      el.className = "profile-badge " + (unlocked ? "unlocked" : "locked");
      el.innerHTML = `<div class="profile-badge-icon">${unlocked ? b.label.split(" ")[0] : "🔒"}</div><div class="profile-badge-name">${b.label.split(" ").slice(1).join(" ")}</div>`;
      badgesEl.appendChild(el);
    });
  }

  renderStats();
  renderThemes();
}

function updateNavRank() {
  const rank = getRank(GAME.xp);
  const icon = document.querySelector("#nav-rank .rank-icon");
  const name = document.getElementById("nav-rank-name");
  if (icon) icon.textContent = rank.icon;
  if (name) { name.textContent = rank.name; name.style.color = rank.color; }
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
