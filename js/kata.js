// kata.js — Mode Kata : la mémoire musculaire du shell.
// Tape des enchaînements de vraies commandes le plus vite et le plus juste
// possible. Mesure WPM (mots/minute) et précision. Un kata = 8 commandes.

const KATAS = [
  {
    id: "bases", name: "Les Fondamentaux", emoji: "🥋", color: "#7c3aed",
    desc: "Les gestes de base, mille fois répétés.",
    cmds: ["ls -la", "cd /var/log", "pwd", "cat notes.txt", "mkdir projets", "cp app.js backup/", "mv old.txt new.txt", "rm -rf tmp"],
  },
  {
    id: "pipes", name: "Filtres & Pipes", emoji: "🔧", color: "#06b6d4",
    desc: "Relier les commandes, l'art du plombier.",
    cmds: ["grep -i error app.log", "cat access.log | wc -l", "sort noms.txt | uniq", "ps aux | grep nginx", "ls | grep .log", "cut -d',' -f1 data.csv", "tail -n 20 app.log", "history | grep ssh"],
  },
  {
    id: "perms", name: "Permissions", emoji: "🔐", color: "#f97316",
    desc: "Qui a le droit de quoi. rwx.",
    cmds: ["chmod +x deploy.sh", "chmod 600 secret.key", "chmod 755 script.sh", "ls -l /etc", "chown user:user file", "sudo systemctl restart nginx", "umask 022", "stat config.json"],
  },
  {
    id: "reseau", name: "Réseau", emoji: "🌐", color: "#3b82f6",
    desc: "Parler aux autres machines.",
    cmds: ["ping -c 4 google.com", "curl -I https://site.com", "ssh user@10.0.0.5", "scp file.txt user@host:/tmp", "netstat -tulpn", "dig example.com", "wget https://x.com/f.zip", "ss -ltn"],
  },
  {
    id: "decode", name: "Décodage", emoji: "🕵️", color: "#a78bfa",
    desc: "Percer les secrets encodés.",
    cmds: ["base64 -d secret.b64", "echo salut | base64", "rot13 cipher.txt", "xxd -r -p hex.txt", "cat msg | base64 -d", "md5sum fichier.iso", "sha256sum archive.tar.gz", "openssl rand -hex 16"],
  },
  {
    id: "sysadmin", name: "Sysadmin", emoji: "⚡", color: "#10b981",
    desc: "Le quotidien de l'administrateur.",
    cmds: ["df -h", "du -sh /var/*", "free -h", "top -b -n 1", "systemctl status ssh", "journalctl -u nginx", "crontab -l", "uptime"],
  },
  {
    id: "git", name: "Git", emoji: "🌱", color: "#f43f5e",
    desc: "Le versioning dans les doigts.",
    cmds: ["git init", "git status", "git add .", "git commit -m \"premier commit\"", "git log", "git branch feature", "git checkout -b hotfix", "git checkout main"],
  },
];

const KATA_BEST_KEY = "linuxdojo_kata_best";

class KataMode {
  constructor(bodyEl) {
    this.body = bodyEl;
    this.best = this._loadBest();
    this.reset();
  }

  _loadBest() { try { return JSON.parse(localStorage.getItem(KATA_BEST_KEY)) || {}; } catch { return {}; } }
  _saveBest() { localStorage.setItem(KATA_BEST_KEY, JSON.stringify(this.best)); }

  reset() {
    this.kata = null;
    this.idx = 0;
    this.startTime = 0;
    this.totalKeys = 0;
    this.errors = 0;
    this.targetChars = 0;
    this.tick = null;
  }

  init() { this.renderSelect(); }

  // ── Écran de sélection ──────────────────────────────────────
  renderSelect() {
    this.reset();
    this.body.innerHTML =
      '<div class="kata-intro">' +
        '<h2>🥋 Kata — la mémoire musculaire du shell</h2>' +
        '<p>Tape chaque commande le plus vite et le plus juste possible. Un kata = 8 commandes. ' +
        'On mesure ta vitesse (WPM) et ta précision. Répète, et tes doigts finiront par connaître le chemin.</p>' +
      '</div>' +
      '<div class="kata-grid" id="kata-grid"></div>';
    const grid = document.getElementById("kata-grid");
    KATAS.forEach(k => {
      const b = this.best[k.id];
      const card = document.createElement("div");
      card.className = "kata-card";
      card.style.setProperty("--kc", k.color);
      card.innerHTML =
        '<div class="kata-card-emoji">' + k.emoji + '</div>' +
        '<div class="kata-card-name">' + k.name + '</div>' +
        '<div class="kata-card-desc">' + k.desc + '</div>' +
        '<div class="kata-card-best">' + (b ? "★ Record : " + b.score + " (" + b.wpm + " WPM · " + b.acc + "%)" : "Jamais tenté") + '</div>';
      card.addEventListener("click", () => this.start(k));
      grid.appendChild(card);
    });
  }

  // ── Partie ──────────────────────────────────────────────────
  start(kata) {
    this.kata = kata;
    this.idx = 0;
    this.startTime = 0;
    this.totalKeys = 0;
    this.errors = 0;
    this.targetChars = 0;

    this.body.innerHTML =
      '<div class="kata-play">' +
        '<div class="kata-hud">' +
          '<span class="kata-hud-name">' + kata.emoji + ' ' + kata.name + '</span>' +
          '<span id="kata-progress">1 / ' + kata.cmds.length + '</span>' +
          '<span id="kata-wpm">0 WPM</span>' +
          '<span id="kata-acc">100%</span>' +
          '<span id="kata-time">0.0s</span>' +
          '<button class="btn-ghost" id="kata-quit">✕ Quitter</button>' +
        '</div>' +
        '<div class="kata-dots" id="kata-dots"></div>' +
        '<div class="kata-target" id="kata-target"></div>' +
        '<input id="kata-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="tape la commande ci-dessus...">' +
        '<div class="kata-hint">Entrée ou frappe complète pour valider · Échap pour quitter</div>' +
      '</div>';

    this.input = document.getElementById("kata-input");
    this.targetEl = document.getElementById("kata-target");
    this._renderDots();
    this._loadCmd();

    this.input.addEventListener("keydown", e => this._onKey(e));
    this.input.addEventListener("input", () => this._onInput());
    document.getElementById("kata-quit").addEventListener("click", () => this._stopTick() || this.renderSelect());
    setTimeout(() => this.input.focus(), 50);
  }

  _renderDots() {
    const dots = document.getElementById("kata-dots");
    if (!dots) return;
    dots.innerHTML = "";
    this.kata.cmds.forEach((_, i) => {
      const d = document.createElement("span");
      d.className = "kata-dot" + (i < this.idx ? " done" : "") + (i === this.idx ? " active" : "");
      dots.appendChild(d);
    });
  }

  _loadCmd() {
    this.target = this.kata.cmds[this.idx];
    this.input.value = "";
    this._paint();
    const p = document.getElementById("kata-progress");
    if (p) p.textContent = (this.idx + 1) + " / " + this.kata.cmds.length;
    this._renderDots();
  }

  // Coloration caractère par caractère
  _paint() {
    const typed = this.input.value;
    let html = "";
    for (let i = 0; i < this.target.length; i++) {
      const ch = this.target[i] === " " ? "&nbsp;" : this._esc(this.target[i]);
      let cls = "kc-pending";
      if (i < typed.length) cls = typed[i] === this.target[i] ? "kc-ok" : "kc-bad";
      else if (i === typed.length) cls = "kc-cur";
      html += '<span class="' + cls + '">' + ch + "</span>";
    }
    // caractères tapés en trop
    if (typed.length > this.target.length) {
      for (let i = this.target.length; i < typed.length; i++) html += '<span class="kc-bad">' + this._esc(typed[i] === " " ? "_" : typed[i]) + "</span>";
    }
    this.targetEl.innerHTML = html;
  }

  _esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  _onKey(e) {
    if (e.key === "Escape") { e.preventDefault(); this._stopTick(); this.renderSelect(); return; }
    if (!this.startTime && (e.key.length === 1 || e.key === "Enter")) this._startTimer();
    if (e.key === "Enter") { e.preventDefault(); if (this.input.value === this.target) this._advance(); else { if (typeof SFX !== "undefined") SFX.error(); this._flashBad(); } return; }
    // Comptage de précision : une frappe de caractère
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      this.totalKeys++;
      const expected = this.target[this.input.value.length];
      if (e.key !== expected) this.errors++;
    }
  }

  _onInput() {
    this._paint();
    if (this.input.value === this.target) this._advance();
  }

  _advance() {
    if (typeof SFX !== "undefined") SFX.key();
    this.targetChars += this.target.length;
    this.idx++;
    if (this.idx >= this.kata.cmds.length) { this._finish(); return; }
    // petit flash vert
    this.targetEl.classList.add("kata-flash");
    setTimeout(() => this.targetEl && this.targetEl.classList.remove("kata-flash"), 200);
    this._loadCmd();
  }

  _flashBad() {
    if (!this.input) return;
    this.input.classList.add("kata-shake");
    setTimeout(() => this.input && this.input.classList.remove("kata-shake"), 300);
  }

  _startTimer() {
    this.startTime = performance.now();
    this.tick = setInterval(() => this._updateHud(), 100);
  }
  _stopTick() { if (this.tick) { clearInterval(this.tick); this.tick = null; } return true; }

  _elapsedMin() { return Math.max(0.001, (performance.now() - this.startTime) / 60000); }
  _wpm() { const chars = this.targetChars + (this.input ? this.input.value.length : 0); return Math.round((chars / 5) / this._elapsedMin()); }
  _acc() { return this.totalKeys ? Math.max(0, Math.round(((this.totalKeys - this.errors) / this.totalKeys) * 100)) : 100; }

  _updateHud() {
    const w = document.getElementById("kata-wpm");
    const a = document.getElementById("kata-acc");
    const t = document.getElementById("kata-time");
    if (w) w.textContent = this._wpm() + " WPM";
    if (a) a.textContent = this._acc() + "%";
    if (t) t.textContent = ((performance.now() - this.startTime) / 1000).toFixed(1) + "s";
  }

  _finish() {
    this._stopTick();
    const wpm = this._wpm();
    const acc = this._acc();
    const seconds = ((performance.now() - this.startTime) / 1000).toFixed(1);
    const score = Math.max(1, Math.round(wpm * acc / 100));

    const prev = this.best[this.kata.id];
    const isRecord = !prev || score > prev.score;
    if (isRecord) { this.best[this.kata.id] = { score, wpm, acc }; this._saveBest(); }

    // Récompense XP (une fois par run, modeste) + culture stats
    const xpGain = Math.round(score / 5) + (acc === 100 ? 10 : 0);
    if (typeof addXP === "function") addXP(xpGain);
    if (typeof SFX !== "undefined") SFX.levelup();
    if (typeof burstParticles === "function") burstParticles(window.innerWidth / 2, window.innerHeight / 2);

    // Note façon arts martiaux
    const grade = acc === 100 && wpm >= 60 ? "PARFAIT 🏆" : score >= 70 ? "Maître 🥋" : score >= 45 ? "Ceinture Marron" : score >= 25 ? "Ceinture Verte" : "Ceinture Blanche";

    this.body.innerHTML =
      '<div class="kata-result">' +
        '<div class="kata-result-grade">' + grade + '</div>' +
        '<div class="kata-result-name">' + this.kata.emoji + ' ' + this.kata.name + (isRecord ? ' <span class="kata-record">★ NOUVEAU RECORD</span>' : '') + '</div>' +
        '<div class="kata-result-stats">' +
          '<div class="krs"><span>' + wpm + '</span><label>WPM</label></div>' +
          '<div class="krs"><span>' + acc + '%</span><label>Précision</label></div>' +
          '<div class="krs"><span>' + seconds + 's</span><label>Temps</label></div>' +
          '<div class="krs krs-score"><span>' + score + '</span><label>Score</label></div>' +
        '</div>' +
        '<div class="kata-result-xp">+' + xpGain + ' XP' + (acc === 100 ? '  ·  sans-faute !' : '') + '</div>' +
        '<div class="kata-result-btns">' +
          '<button class="btn-primary" id="kata-again">↻ Refaire ce kata</button>' +
          '<button class="btn-ghost" id="kata-menu">Autres katas</button>' +
        '</div>' +
      '</div>';
    document.getElementById("kata-again").addEventListener("click", () => this.start(this.kata));
    document.getElementById("kata-menu").addEventListener("click", () => this.renderSelect());

    if (typeof checkBadges === "function") checkBadges();
    if (typeof objectivesTick === "function") objectivesTick();
  }
}

if (typeof module !== "undefined") module.exports = { KATAS };
