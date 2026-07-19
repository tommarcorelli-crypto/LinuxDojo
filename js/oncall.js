// oncall.js — Salle d'astreinte : incidents générés aléatoirement, à diagnostiquer
// et réparer SANS leçon ni indication, comme une vraie astreinte. Rejouable à
// l'infini, score au temps. S'appuie uniquement sur des mécaniques du moteur déjà
// réellement dynamiques (systemctl/_services, crontab/_crontab, permissions/chmod,
// groupes/sudo, du -h sur le contenu réel des fichiers) — aucune commande n'a
// besoin d'un nouveau comportement pour que ce mode fonctionne.

// ── Générateurs d'incidents ─────────────────────────────────────────────
// Chaque générateur renvoie : { icon, title, brief, fs?, systemSetup?(term), check(term) }
// - fs        : fusionné via term.loadFS() (chemins relatifs → /home/user, absolus tels quels)
// - systemSetup : appelé APRÈS loadFS, pour préparer _services / _crontab / _users
// - check     : appelé après CHAQUE commande ; renvoie true quand l'incident est résolu

function _oncallPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function tplServiceDown() {
  if (Math.random() < 0.4) {
    // Réutilise le conflit de port nginx/apache2 déjà simulé nativement par le moteur.
    return {
      icon: "🌐",
      title: sh("Site web injoignable", "Website unreachable"),
      brief: sh(
        "Le monitoring signale que le site ne répond plus depuis 10 minutes. Aucun déploiement n'a eu lieu.",
        "Monitoring reports the website has been unreachable for 10 minutes. Nothing was deployed."
      ),
      systemSetup(term) { term._initServices(); },
      check(term) { return !!(term._services && term._services.nginx && term._services.nginx.active); }
    };
  }
  const pool = [
    { unit: "mysqld", desc: "MySQL Community Server" },
    { unit: "redis",  desc: "Advanced key-value store" },
    { unit: "docker", desc: "Docker Application Container Engine" },
  ];
  const svc = _oncallPick(pool);
  return {
    icon: "🛑",
    title: sh(`Service ${svc.unit} arrêté`, `${svc.unit} service down`),
    brief: sh(
      `Une alerte vient de tomber : le service ${svc.unit} est arrêté. Les applications qui en dépendent renvoient des erreurs.`,
      `An alert just fired: the ${svc.unit} service is down. Apps depending on it are erroring out.`
    ),
    systemSetup(term) {
      term._services = {
        [svc.unit]: { active: false, failed: true, enabled: true, pid: 0, desc: svc.desc },
        ssh:  { active: true, failed: false, enabled: true, pid: 801, desc: "OpenBSD Secure Shell server" },
        cron: { active: true, failed: false, enabled: true, pid: 604, desc: "Regular background program processing daemon" },
      };
    },
    check(term) { return !!(term._services && term._services[svc.unit] && term._services[svc.unit].active); }
  };
}

function tplPermBroken() {
  const pool = [
    { name: "deploy.sh",      content: "#!/bin/bash\necho \"Déploiement en cours...\"\nrsync -a build/ /var/www/\n" },
    { name: "backup.sh",      content: "#!/bin/bash\ntar czf /backups/site-$(date +%F).tar.gz /var/www\n" },
    { name: "healthcheck.sh", content: "#!/bin/bash\ncurl -sf http://localhost/ || exit 1\n" },
  ];
  const f = _oncallPick(pool);
  return {
    icon: "🔒",
    title: sh("Script en échec", "Script failing"),
    brief: sh(
      `Le script ${f.name}, qui tournait très bien hier, plante maintenant avec « Permission denied » dès qu'on l'exécute.`,
      `The ${f.name} script, which worked fine yesterday, now fails with "Permission denied" as soon as it's run.`
    ),
    fs: { [f.name]: { type: "file", perms: "-rw-r--r--", content: f.content } },
    check(term) {
      const node = term.fs[term._resolve(f.name)];
      return !!(node && node.perms && node.perms[3] === "x");
    }
  };
}

function tplCronBroken() {
  const pool = [
    { real: "/opt/scripts/backup.sh",  wrong: "/opt/backup.sh",  label: sh("sauvegarde nocturne", "nightly backup") },
    { real: "/opt/scripts/cleanup.sh", wrong: "/opt/cleanup.sh", label: sh("nettoyage des logs", "log cleanup") },
  ];
  const s = _oncallPick(pool);
  return {
    icon: "⏱️",
    title: sh("Tâche planifiée silencieuse", "Silent scheduled job"),
    brief: sh(
      `La tâche de ${s.label} ne s'est pas exécutée depuis 3 jours d'après les logs. Pourtant personne n'a touché à la crontab... ou presque.`,
      `The ${s.label} job hasn't run in 3 days according to the logs. Nobody touched the crontab though... or did they.`
    ),
    fs: { [s.real]: { type: "file", perms: "-rwxr-xr-x", content: "#!/bin/bash\necho ok\n" } },
    systemSetup(term) { term._crontab = [`0 3 * * * ${s.wrong}`]; },
    check(term) { return !!(term._crontab && term._crontab.some(l => l.includes(s.real))); }
  };
}

function tplSudoMissing() {
  return {
    icon: "🔑",
    title: sh("Rapport d'audit inaccessible", "Audit report unreadable"),
    brief: sh(
      "Le responsable sécurité réclame le contenu de /var/log/audit.log pour l'incident d'hier. Ton compte n'a pas encore les bons droits.",
      "The security lead wants the contents of /var/log/audit.log for yesterday's incident. Your account doesn't have the right privileges yet."
    ),
    systemSetup(term) {
      term.fs["/var/log/audit.log"] = { type: "file", perms: "-rw-------", owner: "root", content: "type=AVC msg=audit(1737000000.123:456): granted\n" };
      term._ensureParents("/var/log/audit.log");
      term._initUsers();
      term._users.user.groups = ["user"]; // pas encore dans le groupe sudo, exprès
    },
    check(term) { return !!(term._users && term._users.user && term._users.user.groups.includes("sudo")); }
  };
}

function tplDiskBloat() {
  const dir = _oncallPick(["/var/log", "/home/user/tmp"]);
  const big = "debug.log";
  return {
    icon: "💾",
    title: sh("Disque presque plein", "Disk almost full"),
    brief: sh(
      `L'alerte « espace disque faible » vient de se déclencher. Quelque chose grossit anormalement dans ${dir}.`,
      `The "low disk space" alert just fired. Something is growing abnormally in ${dir}.`
    ),
    fs: {
      [dir + "/" + big]: { type: "file", content: "X".repeat(50000) + "\n" },
      [dir + "/app.log"]: { type: "file", content: "INFO ok\nINFO ok\n" },
    },
    check(term) {
      const node = term.fs[term._resolve(dir + "/" + big)];
      return !node || (node.content || "").length < 5000; // supprimé, vidé ou fortement réduit
    }
  };
}

const ONCALL_TEMPLATES = [tplServiceDown, tplPermBroken, tplCronBroken, tplSudoMissing, tplDiskBloat];

// ── Mode de jeu ──────────────────────────────────────────────────────────
class OncallMode {
  constructor(opts) {
    this.termEl    = opts.termEl;
    this.inputEl   = opts.inputEl;
    this.runBtn    = opts.runBtn;
    this.briefEl   = opts.briefEl;
    this.titleEl   = opts.titleEl;
    this.iconEl    = opts.iconEl;
    this.timerBar  = opts.timerBar;
    this.timerLbl  = opts.timerLbl;
    this.skipBtn   = opts.skipBtn;
    this.scoreEl   = opts.scoreEl;
    this.bestEl    = opts.bestEl;
    this.streakEl  = opts.streakEl;

    this.timer     = null;
    this.elapsed   = 0;
    this.score     = 0;
    this.streak    = 0;
    this.solved    = 0;
    this.lastTitle = null;
    this.BEST_KEY  = "linuxdojo_oncall_best";
    this.best      = this._loadBest();
    this.term      = new Terminal(this.termEl);
    this.term.ps1User = "user@astreinte";

    this._bindEvents();
  }

  _loadBest() { try { const v = parseInt(localStorage.getItem(this.BEST_KEY)); return v > 0 ? v : 0; } catch { return 0; } }
  _saveBest() { if (this.best === 0 || this.elapsed < this.best) { this.best = this.elapsed; try { localStorage.setItem(this.BEST_KEY, String(this.best)); } catch {} } }

  init() { this._updateStats(); this._newIncident(); }

  _bindEvents() {
    this.runBtn.addEventListener("click", () => this._run());
    this.inputEl.addEventListener("keydown", e => {
      if (e.key === "Enter") this._run();
      else if (e.key === "Tab") { e.preventDefault(); this.term.autocomplete(this.inputEl); }
    });
    this.skipBtn.addEventListener("click", () => { this.streak = 0; this._updateStats(); this._newIncident(); });
  }

  _newIncident() {
    clearInterval(this.timer);
    // Évite de tomber deux fois de suite sur exactement le même intitulé
    let inc, tries = 0;
    do { inc = _oncallPick(ONCALL_TEMPLATES)(); tries++; }
    while (inc.title === this.lastTitle && tries < 5);
    this.lastTitle = inc.title;
    this.incident = inc;

    this.term.clear();
    this.term.loadFS(inc.fs || {});
    if (inc.systemSetup) inc.systemSetup(this.term);

    this.iconEl.textContent  = inc.icon;
    this.titleEl.textContent = inc.title;
    this.briefEl.textContent = inc.brief;

    this.term.printErr(sh("🚨 INCIDENT — " + inc.title, "🚨 INCIDENT — " + inc.title));
    this.term.printOut(inc.brief);
    this.term.printOut("");

    this._startTimer();
    this.inputEl.focus();
  }

  _run() {
    const raw = this.inputEl.value.trim();
    if (!raw) return;
    this.inputEl.value = "";
    if (typeof bumpStat === "function") bumpStat(raw.split(/\s+/)[0]);

    this.term.run(raw);

    let solved = false;
    try { solved = this.incident.check(this.term); } catch (e) {}

    if (solved) this._resolve();
  }

  _resolve() {
    clearInterval(this.timer);
    this.streak++;
    this.solved++;
    const gain = Math.max(20, 300 - this.elapsed * 3);
    this.score += gain;
    this._saveBest();
    this._updateStats();
    setTimeout(() => {
      this.term.printOk(sh(
        `✅ Incident résolu en ${this.elapsed}s ! +${gain} pts`,
        `✅ Incident resolved in ${this.elapsed}s! +${gain} pts`
      ));
      if (typeof addXP === "function") addXP(Math.min(30, Math.round(gain / 10)));
      if (typeof SFX !== "undefined") SFX.success();
      if (typeof trackEvent === "function") trackEvent("oncall-solved");
      setTimeout(() => this._newIncident(), 1400);
    }, 150);
  }

  _startTimer() {
    this.elapsed = 0;
    this._updateTimer();
    this.timer = setInterval(() => { this.elapsed++; this._updateTimer(); }, 1000);
  }

  _updateTimer() {
    const pct = Math.min(100, (this.elapsed / 180) * 100);
    this.timerBar.style.width = pct + "%";
    this.timerBar.style.background = pct < 33 ? "var(--grad-main)" : pct < 66 ? "var(--orange)" : "var(--red)";
    const m = Math.floor(this.elapsed / 60), s = this.elapsed % 60;
    this.timerLbl.textContent = (m > 0 ? m + ":" + String(s).padStart(2, "0") : s + "s");
  }

  _updateStats() {
    if (this.scoreEl)  this.scoreEl.textContent  = sh(`Score : ${this.score}`, `Score: ${this.score}`);
    if (this.bestEl)   this.bestEl.textContent   = this.best > 0 ? sh(`★ Record : ${this.best}s`, `★ Best: ${this.best}s`) : "";
    if (this.streakEl) this.streakEl.textContent = this.streak > 1 ? sh(`🔥 ${this.streak} d'affilée`, `🔥 ${this.streak} in a row`) : "";
  }
}
