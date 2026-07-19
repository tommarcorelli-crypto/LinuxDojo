// terminal.js — Simulateur de terminal Linux

/* Squelette système en lecture seule (fusionné dans le bac à sable) */
const SYSTEM_FS = {
  "/etc":            { type:"dir" },
  "/etc/hostname":   { type:"file", content:"dojo" },
  "/etc/os-release": { type:"file", content:'NAME="DojoLinux"\nVERSION="4.0 (Kata)"\nID=dojolinux\nPRETTY_NAME="DojoLinux 4.0"' },
  "/etc/passwd":     { type:"file", content:"root:x:0:0:root:/root:/bin/bash\nuser:x:1000:1000:Apprenti:/home/user:/bin/bash\nsensei:x:1001:1001:Le Sensei:/home/sensei:/bin/zsh" },
  // Protégé pour de vrai : les permissions sont appliquées, cat échoue comme sur un vrai Linux
  "/etc/shadow":     { type:"file", perms:"-rw-------", owner:"root", group:"root", content:"root:$6$r0nD3LLa$K9vXqPzT...:19900:0:99999:7:::\nuser:$6$s3nS3i$xM4wQfRj...:19900:0:99999:7:::" },
  "/etc/motd":       { type:"file", content:"Bienvenue sur DojoLinux.\nLa voie du shell est longue, mais chaque commande te rapproche du sommet." },
  "/var":            { type:"dir" },
  "/var/log":        { type:"dir" },
  "/var/log/syslog": { type:"file", content:"kernel: DojoLinux boot ok\nsystemd: Started Terminal Simulator.\ncron: session opened for user\nkernel: tout est fichier" },
  "/tmp":            { type:"dir" },
  "/tmp/.rien":      { type:"file", content:"Il n'y a rien ici. Vraiment. Retourne t'entraîner." },
  "/usr":            { type:"dir" },
  "/usr/bin":        { type:"dir" },
  "/usr/bin/cowsay": { type:"file", perms:"-rwxr-xr-x", content:"(binaire ELF simulé — tape juste 'cowsay meuh')" },
  "/root":           { type:"dir", denied:true },
};

class Terminal {
  constructor(outputEl) {
    this.el = outputEl;
    this.root = "/home/user"; // racine de la mission
    this.cwd = this.root;
    this.ps1User = "user@dojo";
    this.fs = {};       // filesystem virtuel : clés = chemins ABSOLUS normalisés
    this.state = {};    // état interne (mkdir créé, cp, etc.) — valeurs telles que tapées
    this.cmdLog = [];   // historique de session (commande history)
    this._envVars = {}; // variables (shell + env) — lues par $VAR, echo, env
    this._blockLines = []; // buffer d'un bloc for/if/while en cours de saisie
    this._lastCode = 0; // code de retour de la dernière commande ($?)
    this._aliases = {}; // alias définis par l'utilisateur (alias ll='ls -la')
    this._jobs = [];    // jobs lancés en arrière-plan (cmd &)
    this._jobCounter = 0;
    this._git = null;   // dépôt git simulé (null tant que 'git init' n'a pas été fait)
    this._docker = null; // daemon docker simulé (images/conteneurs) — créé au premier usage
    this._services = null; // services systemd simulés — créés au premier systemctl/journalctl
    this._users = null;  // comptes simulés (useradd/passwd/usermod/groups/su) — lazy
    this._curUser = "user"; // utilisateur courant (changé par su, lu par whoami/id)
    this._suStack = [];  // pile des utilisateurs précédents avant chaque 'su' (pour 'exit')
    this._sshStack = []; // pile des prompts précédents avant chaque 'ssh' (pour 'exit')
    this._crontab = null; // crontab simulée de l'utilisateur (null = « no crontab »)
    this._nano = null;   // session d'édition nano en cours (null = pas en édition)
  }

  // Charge le filesystem d'une mission.
  // Les clés relatives ("notes.txt", "data/pass.txt") sont ancrées sous /home/user ;
  // les clés absolues ("/etc/hostname") sont gardées telles quelles.
  // opts.system = true → fusionne le squelette système (/etc, /var, /tmp, /root…).
  loadFS(fs, opts) {
    this.fs = {};
    const src = fs || {};
    if (opts && opts.system) {
      for (const [k, node] of Object.entries(SYSTEM_FS)) this.fs[k] = JSON.parse(JSON.stringify(node));
    }
    for (const [k, node] of Object.entries(src)) {
      const abs = k.startsWith("/") ? k : this.root + "/" + k;
      this.fs[this._normPath(abs)] = JSON.parse(JSON.stringify(node));
    }
    // La racine de mission existe toujours (même avec un FS vide)
    if (!this.fs[this.root]) this.fs[this.root] = { type: "dir", implied: true };
    // Crée les dossiers parents implicites (ex: "data/pass.txt" sans entrée "data")
    Object.keys(this.fs).forEach(k => this._ensureParents(k));
    this.cwd = this.root;
    this.state = {};
    this._envVars = {};
    this._blockLines = [];
    this._lastCode = 0;
    this._aliases = {};
    this._jobs = [];
    this._jobCounter = 0;
    this._git = null;
    this._docker = null;
    this._services = null;
    this._users = null;
    this._curUser = "user";
    this._suStack = [];
    this._sshStack = [];
    this._crontab = null;
    this._nano = null;
  }

  // ── Zone DNS simulée (partagée par dig / nslookup / curl) ─────
  _dnsZone() {
    return {
      "intranet.dojo.lan": "10.0.0.80",
      "dojo.lan": "10.0.0.10",
      "linuxdojo.io": "185.199.108.153",
    };
  }

  // ── Comptes utilisateurs simulés ──────────────────────────────
  // user (le joueur) a déjà un mot de passe ; root est verrouillé (pas de
  // mot de passe, comme sur Ubuntu) — su root échoue donc, c'est voulu.
  _initUsers() {
    if (this._users) return;
    this._users = {
      root: { uid: 0,    groups: ["root"],         hasPassword: false },
      user: { uid: 1000, groups: ["user", "sudo"], hasPassword: true },
    };
    this._nextUid = 1001;
  }

  // ── Services systemd simulés ──────────────────────────────────
  // Scénario de départ : nginx est tombé (failed) parce qu'apache2, resté
  // actif, occupe le port 80. ssh et cron tournent normalement.
  _initServices() {
    if (this._services) return;
    this._services = {
      nginx:   { active: false, failed: true,  enabled: false, pid: 0,    desc: "A high performance web server" },
      apache2: { active: true,  failed: false, enabled: true,  pid: 512,  desc: "The Apache HTTP Server" },
      ssh:     { active: true,  failed: false, enabled: true,  pid: 801,  desc: "OpenBSD Secure Shell server" },
      cron:    { active: true,  failed: false, enabled: true,  pid: 604,  desc: "Regular background program processing daemon" },
    };
  }

  // Journal simulé d'un service (journalctl -u NOM) — reflète son état courant.
  // Les messages systemd/nginx restent en anglais (comme sur un vrai Linux),
  // seuls la date et l'éventuel commentaire applicatif suivent la langue.
  _journal(unit) {
    const s = this._services[unit];
    const day = sh("juil. 16", "Jul 16");
    const at = (n, src, pid) => `${day} 08:0${n} serveur ${src}[${pid}]:`;
    if (unit === "nginx") {
      if (s.failed || !s.active) return [
        `${at(1, "systemd", 1)} Starting A high performance web server...`,
        `${at(1, "nginx", 1337)} nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)`,
        `${at(1, "nginx", 1337)} nginx: [emerg] still could not bind()`,
        `${at(1, "systemd", 1)} nginx.service: Control process exited, code=exited, status=1/FAILURE`,
        `${at(1, "systemd", 1)} Failed to start A high performance web server.`,
      ];
      return [
        `${at(2, "systemd", 1)} Starting A high performance web server...`,
        `${at(2, "systemd", 1)} Started A high performance web server.`,
        `${at(2, "nginx", 2001)} ` + sh("serveur web démarré, en écoute sur le port 80", "web server started, listening on port 80"),
      ];
    }
    if (unit === "apache2") return s.active
      ? [`${at(0, "systemd", 1)} Started The Apache HTTP Server.`, `${at(0, "apache2", 512)} AH00558: apache2: resuming normal operations, listening on port 80`]
      : [`${at(1, "systemd", 1)} Stopping The Apache HTTP Server...`, `${at(1, "systemd", 1)} Stopped The Apache HTTP Server.`];
    return [`${at(0, "systemd", 1)} Started ${s.desc}.`];
  }

  /* ── Chemins ───────────────────────────────────────────────── */
  // Normalise un chemin absolu : gère ".", "..", "//" — clampé à "/"
  _normPath(p) {
    const out = [];
    for (const seg of p.split("/")) {
      if (!seg || seg === ".") continue;
      if (seg === "..") { out.pop(); continue; }
      out.push(seg);
    }
    return "/" + out.join("/");
  }
  // Résout un argument utilisateur en chemin absolu normalisé
  _resolve(arg) {
    if (!arg || arg === "~") return this.root;
    let p;
    if (arg.startsWith("/"))       p = arg;
    else if (arg.startsWith("~/")) p = this.root + arg.slice(1);
    else                           p = this.cwd + "/" + arg;
    return this._normPath(p);
  }
  _parentOf(p) { const i = p.lastIndexOf("/"); return i <= 0 ? "/" : p.slice(0, i); }
  _baseOf(p)   { return p === "/" ? "/" : p.slice(p.lastIndexOf("/") + 1); }
  _isDir(p)    { if (p === "/") return true; const n = this.fs[p]; return !!n && n.type === "dir"; }
  _exists(p)   { return p === "/" || !!this.fs[p]; }
  // Enfants directs d'un dossier (noms de base, ordre d'insertion)
  _children(p) {
    const base = p === "/" ? "/" : p + "/";
    const seen = [];
    for (const k of Object.keys(this.fs)) {
      if (!k.startsWith(base) || k === p) continue;
      const rest = k.slice(base.length);
      if (!rest || rest.includes("/")) continue;
      seen.push(rest);
    }
    return seen;
  }
  // Un ancêtre (ou le chemin lui-même) est-il interdit d'accès ?
  _denied(p) {
    let cur = p;
    while (cur !== "/") {
      const n = this.fs[cur];
      if (n && n.denied) return cur;
      cur = this._parentOf(cur);
    }
    return null;
  }
  _ensureParents(p) {
    let cur = this._parentOf(p);
    while (cur !== "/" && !this.fs[cur]) {
      this.fs[cur] = { type: "dir", implied: true };
      cur = this._parentOf(cur);
    }
  }
  // ── Permissions réellement appliquées ─────────────────────────
  // Triade effective de l'utilisateur courant sur un nœud : owner (rwx 1-3)
  // s'il est propriétaire (ou root), sinon others (7-9). Les groupes sont
  // volontairement ignorés (simplification pédagogique du simulateur).
  _permTriad(node) {
    if ((this._curUser || "user") === "root") return "rwx";
    const perms = node.perms || (node.type === "dir" ? "drwxr-xr-x" : "-rw-r--r--");
    const owner = node.owner || "user";
    return owner === (this._curUser || "user") ? perms.slice(1, 4) : perms.slice(7, 10);
  }
  _canRead(node) { return this._permTriad(node).includes("r"); }
  _canExec(node) { return this._permTriad(node).includes("x"); }
  _permErr(cmdName, fname) {
    return sh(`${cmdName}: ${fname}: Permission non accordée 🔒\n💡 Regarde qui a le droit de quoi : ls -l — et corrige avec chmod (ou chown si le fichier ne t'appartient pas).`,
              `${cmdName}: ${fname}: Permission denied 🔒\n💡 Look at who may do what: ls -l — and fix it with chmod (or chown if the file isn't yours).`);
  }

  // Résout un argument fichier → { path, node } ou null.
  // denied: true = accès interdit (dossier verrouillé type /root, OU fichier
  // dont les permissions ne donnent pas le droit de lecture à l'utilisateur).
  _file(arg) {
    const p = this._resolve(arg);
    if (this._denied(p)) return { path: p, node: null, denied: true };
    const node = this.fs[p];
    if (!node) return null;
    if (node.type === "file" && !this._canRead(node)) return { path: p, node, denied: true };
    return { path: p, node };
  }
  // Affichage du cwd : /home/user/logs → ~/logs
  _display(p) {
    if (p === this.root) return "~";
    if (p.startsWith(this.root + "/")) return "~" + p.slice(this.root.length);
    return p;
  }
  promptStr() {
    if (this._nano) return `[nano ${this._nano.arg}]`;   // mode édition, voir _nanoInput()
    if (this._blockLines.length) return ">";   // continuation d'un bloc for/if/while
    return this.ps1User + ":" + this._display(this.cwd) + "$";
  }

  clear() {
    this.el.innerHTML = "";
  }

  // ── Affichage ──────────────────────────────────────────────────
  _line(text, cls = "t-out") {
    const d = document.createElement("div");
    d.className = "t-line " + cls;
    d.textContent = text || "";
    this.el.appendChild(d);
    this.el.scrollTop = this.el.scrollHeight;
    return d;
  }

  printPrompt(cmd) {
    const d = document.createElement("div");
    d.className = "t-line t-prompt-line";
    d.innerHTML = `<span class="t-ps1">${this._esc(this.promptStr())}</span><span class="t-cmd"> ${this._esc(cmd)}</span>`;
    this.el.appendChild(d);
  }

  printOut(text)  { if (text !== null && text !== "") this._line(text, "t-out"); }
  printErr(text)  { this._line(text, "t-err"); }
  printOk(text)   { this._line(text, "t-ok"); }
  printInfo(text) { this._line(text, "t-info"); }
  printWarn(text) { this._line(text, "t-warn"); }
  printSep()      { this._line("─".repeat(50), "t-sep"); }

  _esc(s) {
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

  // ── Suggestion de fichier (si faute de frappe) ─────────────
  _suggestFile(name) {
    const files = this._children(this.cwd);
    if (!files.length) return null;
    // Cherche un fichier qui commence pareil
    const startsWith = files.find(f => f.startsWith(name.slice(0, 3)));
    if (startsWith) return startsWith;
    // Cherche par distance de Levenshtein simplifiée
    let best = null, bestScore = Infinity;
    files.forEach(f => {
      const score = this._levenshtein(name.toLowerCase(), f.toLowerCase());
      if (score < bestScore && score <= 3) { bestScore = score; best = f; }
    });
    return best;
  }

  _levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({length: m+1}, (_, i) => Array.from({length: n+1}, (_, j) => i === 0 ? j : j === 0 ? i : 0));
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++)
        dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    return dp[m][n];
  }

  // ── Commande introuvable — message pédagogique ─────────────
  _cmdNotFound(cmd, args) {
    // Typos fréquentes
    const typos = {
      "sl": sh("ls (tu as inversé les lettres — essaie : ls)", "ls (you swapped the letters — try: ls)"),
      "ks": "ls",
      "cd..": sh("cd .. (il faut un espace : cd ..)", "cd .. (you need a space: cd ..)"),
      "cd/": sh("cd / (il faut un espace : cd /)", "cd / (you need a space: cd /)"),
      "lsa": sh("ls -a (il faut un tiret : ls -a)", "ls -a (you need a dash: ls -a)"),
      "lsl": sh("ls -l (il faut un tiret : ls -l)", "ls -l (you need a dash: ls -l)"),
      "gerp": "grep",
      "grpe": "grep",
      "cta": "cat",
      "car": "cat",
      "mdir": "mkdir",
      "mkd": "mkdir",
      "mkdr": "mkdir",
      "tuch": "touch",
      "touc": "touch",
      "gre": "grep",
      "fin": "find",
      "pythoon": "python3",
      "pyhon": "python3",
    };

    if (typos[cmd]) {
      return sh(`${cmd}: commande introuvable\n💡 Voulais-tu dire : ${typos[cmd]} ?`, `${cmd}: command not found\n💡 Did you mean: ${typos[cmd]} ?`);
    }

    // Commandes connues proches
    const known = ["ls","cd","cat","less","more","pwd","mkdir","touch","cp","mv","rm","chmod","chown","chgrp","grep","find","wc","sort","echo","ps","kill","whoami","id","df","ln","tar","curl","sed","awk","clear","help","head","tail","uniq","cut","tr","tree","du","date","uname","hostname","uptime","free","history","man","whatis","env","ping","alias","unalias","xargs","diff","jobs","fg","git","ssh","scp","netstat","docker","systemctl","journalctl","useradd","passwd","usermod","groups","su","sudo","crontab","ip","dig","nslookup","nano"];
    const close = known.find(k => this._levenshtein(cmd, k) <= 2);
    if (close) {
      return sh(`${cmd}: commande introuvable\n💡 Voulais-tu dire : ${close} ?`, `${cmd}: command not found\n💡 Did you mean: ${close} ?`);
    }

    // Option invalide détectée (ex: ls -x)
    if (args.length && args[0].startsWith("-")) {
      const cmdHelp = {
        "ls":    sh("Options valides pour ls : -l (détails), -a (cachés), -la (les deux), -h (tailles lisibles)", "Valid options for ls: -l (details), -a (hidden), -la (both), -h (readable sizes)"),
        "grep":  sh("Options valides pour grep : -i (casse), -n (numéros), -r (récursif), -v (inverser), -c (compter)", "Valid options for grep: -i (case), -n (numbers), -r (recursive), -v (invert), -c (count)"),
        "find":  sh("Options valides pour find : -name 'motif', -type f, -type d, -mtime N, -size +NM", "Valid options for find: -name 'pattern', -type f, -type d, -mtime N, -size +NM"),
        "tar":   sh("Options valides pour tar : -czf (créer), -xzf (extraire), -tzf (lister)", "Valid options for tar: -czf (create), -xzf (extract), -tzf (list)"),
        "chmod": sh("Exemples chmod : chmod +x script.sh | chmod 755 script.sh | chmod 600 secret.key", "chmod examples: chmod +x script.sh | chmod 755 script.sh | chmod 600 secret.key"),
      };
      if (cmdHelp[cmd]) return sh(`${cmd}: option invalide '${args[0]}'\n💡 ${cmdHelp[cmd]}`, `${cmd}: invalid option '${args[0]}'\n💡 ${cmdHelp[cmd]}`);
    }

    return sh(`${cmd}: commande introuvable\nTape 'help' pour voir les commandes disponibles.`, `${cmd}: command not found\nType 'help' to see the available commands.`);
  }

  // ── Autocomplétion Tab ─────────────────────────────────────
  // Appelle cette méthode depuis le keydown de l'input
  autocomplete(inputEl) {
    const val   = inputEl.value;
    const parts = val.trimStart().split(" ");
    const last  = parts[parts.length - 1];

    // Complétion de commande (premier mot)
    if (parts.length === 1) {
      const cmds = ["ls","cd","cat","less","more","pwd","mkdir","touch","cp","mv","rm","chmod","chown","chgrp","grep","find","wc","sort","echo","ps","kill","whoami","id","df","ln","tar","curl","sed","awk","clear","help","head","tail","uniq","cut","tr","tree","du","date","uname","hostname","uptime","free","history","man","whatis","env","export","ping","base64","rot13","xxd","for","while","if","test","seq","bash","true","false","alias","unalias","xargs","diff","jobs","fg","git","ssh","scp","netstat","docker","systemctl","journalctl","useradd","passwd","usermod","groups","su","crontab","ip","dig","nslookup","sudo","nano"];
      const matches = cmds.filter(c => c.startsWith(last));
      if (matches.length === 1) {
        inputEl.value = matches[0] + " ";
      } else if (matches.length > 1) {
        this.printOut("");
        this.printOut(matches.join("  "), "t-info");
        // Compléter jusqu'au préfixe commun
        const prefix = this._commonPrefix(matches);
        if (prefix.length > last.length) inputEl.value = prefix;
      }
      return;
    }

    // Complétion de fichier/dossier (arguments) — gère les chemins (logs/ap<Tab>)
    if (!last) return;
    const slash = last.lastIndexOf("/");
    const dirPart = slash >= 0 ? last.slice(0, slash + 1) : "";     // préfixe tapé (gardé tel quel)
    const namePart = slash >= 0 ? last.slice(slash + 1) : last;      // segment à compléter
    const dirPath = dirPart ? this._resolve(dirPart) : this.cwd;
    if (!this._isDir(dirPath) || this._denied(dirPath)) return;
    const files = this._children(dirPath).map(n => this._isDir(dirPath === "/" ? "/" + n : dirPath + "/" + n) ? n + "/" : n);
    const matches2 = files.filter(f => f.startsWith(namePart));
    if (matches2.length === 1) {
      parts[parts.length - 1] = dirPart + matches2[0];
      inputEl.value = parts.join(" ") + (matches2[0].endsWith("/") ? "" : " ");
    } else if (matches2.length > 1) {
      this.printOut("");
      this.printOut(matches2.join("  "), "t-info");
      const prefix = this._commonPrefix(matches2);
      if (prefix.length > namePart.length) {
        parts[parts.length - 1] = dirPart + prefix;
        inputEl.value = parts.join(" ");
      }
    }
  }

  _commonPrefix(arr) {
    if (!arr.length) return "";
    let prefix = arr[0];
    for (let i = 1; i < arr.length; i++) {
      while (!arr[i].startsWith(prefix)) prefix = prefix.slice(0, -1);
    }
    return prefix;
  }

  // ── Base64 (navigateur : atob/btoa ; node/test : Buffer) ───
  _b64decode(s) {
    if (typeof atob === "function") {
      return decodeURIComponent(escape(atob(s)));
    }
    return Buffer.from(s, "base64").toString("utf8");
  }
  _b64encode(s) {
    if (typeof btoa === "function") {
      return btoa(unescape(encodeURIComponent(s)));
    }
    return Buffer.from(s, "utf8").toString("base64");
  }

  // ── Exécution ──────────────────────────────────────────────────
  // Point d'entrée : affiche le prompt, gère les blocs multi-lignes
  // (for/if/while), puis délègue à _execScript ou _execSimple.
  run(raw) {
    if (!raw.trim() && !this._blockLines.length && !this._nano) return { output: "", error: false };
    this.printPrompt(raw);
    if (raw.trim()) this.cmdLog.push(raw.trim());

    // Mode édition nano : chaque ligne tapée est une sous-commande de l'éditeur
    // (:N texte, :a, :d N, ^O, ^X…), pas une commande shell — voir _nanoInput().
    if (this._nano) return this._nanoInput(raw);

    // Accumulation d'un bloc for/if/while jusqu'à équilibre (do…done / if…fi)
    if (this._blockLines.length || this._hasShellKeyword(raw)) {
      this._blockLines.push(raw);
      if (this._blockBalance(this._blockLines.join("\n")) > 0) {
        return { output: "", error: false, pending: true };
      }
      const script = this._blockLines.join("\n");
      this._blockLines = [];
      return this._execScript(script);
    }

    return this._execSimple(raw, false);
  }

  // Exécute une commande simple (avec pipes/redirections/affectations),
  // après expansion des variables et substitutions de commande.
  _execSimple(raw, silent) {
    // Enchaînement && : chaque segment est ré-exécuté comme une commande à part entière,
    // dans l'ordre, en s'arrêtant au premier échec — comme un vrai shell.
    if (this._hasUnquoted(raw, "&&") >= 0) {
      const segments = this._splitUnquoted(raw, "&&").map(s => s.trim()).filter(Boolean);
      let res = { output: "", error: false };
      for (const seg of segments) {
        res = this._execSimple(seg, silent);
        if (res.error) break;
      }
      return res;
    }

    let line = this._expandLine(this._stripComment(raw)).trim();
    if (!line) return { output: "", error: false };

    // Affectation de variable : NAME=valeur (toute la ligne)
    const asg = line.match(/^([A-Za-z_]\w*)=(.*)$/);
    if (asg) {
      this._envVars[asg[1]] = this._stripQuotes(asg[2]);
      this.state.assign = asg[1];
      this._lastCode = 0;
      return { output: "", error: false };
    }

    // Exécution en arrière-plan : cmd & (le enchaînement cmd1 && cmd2 est traité plus haut)
    let background = false;
    if (this._hasUnquoted(line, "&") >= 0 && !line.endsWith("&&")) {
      const idx = line.length - 1;
      if (line[idx] === "&" && line[idx - 1] !== "&") {
        background = true;
        line = line.slice(0, idx).trim();
      }
    }

    let res;
    if (this._hasUnquoted(line, "|") >= 0)       res = this._runPipe(line, silent);
    else if (this._hasUnquoted(line, ">>") >= 0) res = this._runRedirect(line, true);
    else if (this._hasUnquoted(line, ">") >= 0)  res = this._runRedirect(line, false);
    else                                         res = this._exec(this._parse(line), "", silent);
    this._lastCode = res.error ? 1 : 0;

    if (background) {
      this._jobCounter++;
      const pid = 2000 + this._jobCounter;
      this._jobs.push({ id: this._jobCounter, pid, cmd: line, output: res.output, error: res.error, done: false });
      this._lastCode = 0;
      return { output: `[${this._jobCounter}] ${pid}`, error: false };
    }
    return res;
  }

  // Index de la 1re occurrence NON entre guillemets de `sep` (ou -1)
  _hasUnquoted(line, sep) {
    let q = "";
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q) { if (c === q) q = ""; continue; }
      if (c === "'" || c === '"') { q = c; continue; }
      if (line.startsWith(sep, i)) return i;
    }
    return -1;
  }
  // Découpe sur les occurrences NON entre guillemets de `sep`
  _splitUnquoted(line, sep) {
    const parts = []; let cur = "", q = "";
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q) { cur += c; if (c === q) q = ""; continue; }
      if (c === "'" || c === '"') { q = c; cur += c; continue; }
      if (line.startsWith(sep, i)) { parts.push(cur); cur = ""; i += sep.length - 1; continue; }
      cur += c;
    }
    parts.push(cur);
    return parts;
  }

  // ── Interpréteur de scripts (for / if / while / test) ──────────
  _hasShellKeyword(raw) {
    return this._splitStatements(raw).some(s => /^(for|while|if)\b/.test(s.trim()));
  }
  // Solde des ouvreurs (for/while/if) moins les fermeurs (done/fi)
  _blockBalance(text) {
    let bal = 0;
    for (const s of this._splitStatements(text)) {
      const w = s.trim().split(/\s+/)[0];
      if (w === "for" || w === "while" || w === "if") bal++;
      else if (w === "done" || w === "fi") bal--;
    }
    return bal;
  }
  // Découpe un script en instructions (séparées par ; ou newline),
  // en respectant les guillemets et $( … ), et en ôtant les commentaires #.
  _splitStatements(text) {
    const out = [];
    let cur = "", q = "", sub = 0;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { cur += c; if (c === q) q = ""; continue; }
      if (c === '"' || c === "'") { q = c; cur += c; continue; }
      if (c === "$" && text[i + 1] === "(") { sub++; cur += "$("; i++; continue; }
      if (c === ")" && sub > 0) { sub--; cur += c; continue; }
      if (c === "#" && (i === 0 || /\s/.test(text[i - 1])) && sub === 0) { while (i < text.length && text[i] !== "\n") i++; continue; }
      if ((c === ";" || c === "\n") && sub === 0) { if (cur.trim()) out.push(cur.trim()); cur = ""; continue; }
      cur += c;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  _execScript(text) {
    let nodes;
    try { nodes = this._parseBlocks(this._splitStatements(text)); }
    catch (e) { this.printErr(sh("bash: erreur de syntaxe : ", "bash: syntax error: ") + e.message); return { output: "", error: true }; }
    const prev = this._scriptOut;
    this._scriptOut = [];
    try { this._evalNodes(nodes); }
    catch (e) { this.printErr("bash: " + e.message); this._scriptOut = prev; return { output: "", error: true }; }
    const out = this._scriptOut.join("\n");
    this._scriptOut = prev;
    return { output: out, error: false };
  }
  // Construit un arbre {cmd|for|while|if} à partir des instructions
  _parseBlocks(stmts) {
    const root = [];
    const stack = [];
    const body = () => stack.length ? stack[stack.length - 1].body : root;
    const pushCmd = (arr, s) => { if (s && s.trim()) arr.push({ type: "cmd", cmd: s.trim() }); };
    for (const raw of stmts) {
      const s = raw.trim();
      const w = s.split(/\s+/)[0];
      if (w === "for") {
        const m = s.match(/^for\s+([A-Za-z_]\w*)\s+in\s+(.*)$/);
        if (!m) throw new Error(sh("for : syntaxe attendue « for x in … »", "for: expected syntax « for x in … »"));
        const node = { type: "for", name: m[1], itemsRaw: m[2], body: [] };
        body().push(node); stack.push({ node, body: node.body });
      } else if (w === "while") {
        const node = { type: "while", cond: s.slice(5).trim(), body: [] };
        body().push(node); stack.push({ node, body: node.body });
      } else if (w === "if") {
        const node = { type: "if", branches: [{ cond: s.slice(2).trim(), body: [] }], elseBody: null };
        body().push(node); stack.push({ node, body: node.branches[0].body });
      } else if (w === "do") { pushCmd(body(), s.slice(2).trim()); }
      else if (w === "then") { pushCmd(body(), s.slice(4).trim()); }
      else if (w === "elif") {
        const fr = stack[stack.length - 1]; if (!fr || !fr.node.branches) throw new Error(sh("elif sans if", "elif without if"));
        const br = { cond: s.slice(4).trim(), body: [] }; fr.node.branches.push(br); fr.body = br.body;
      } else if (w === "else") {
        const fr = stack[stack.length - 1]; if (!fr || !fr.node.branches) throw new Error(sh("else sans if", "else without if"));
        fr.node.elseBody = []; fr.body = fr.node.elseBody; pushCmd(fr.body, s.slice(4).trim());
      } else if (s === "done" || s === "fi") {
        if (!stack.length) throw new Error(sh("« " + s + " » sans bloc ouvert", "« " + s + " » with no open block")); stack.pop();
      } else { pushCmd(body(), s); }
    }
    if (stack.length) throw new Error(sh("bloc non fermé (il manque done/fi)", "unclosed block (missing done/fi)"));
    return root;
  }
  _evalNodes(nodes) {
    for (const n of nodes) {
      if (n.type === "cmd") { const r = this._execSimple(n.cmd, false); if (this._scriptOut && r && r.output) this._scriptOut.push(r.output); }
      else if (n.type === "for") {
        const items = this._expandWords(n.itemsRaw);
        for (const it of items) { this._envVars[n.name] = it; this._evalNodes(n.body); }
      } else if (n.type === "while") {
        let guard = 0;
        while (this._condTrue(n.cond)) { this._evalNodes(n.body); if (++guard >= 1000) { this.printErr("while : arrêt de sécurité (1000 tours)"); break; } }
      } else if (n.type === "if") {
        let taken = false;
        for (const br of n.branches) { if (this._condTrue(br.cond)) { this._evalNodes(br.body); taken = true; break; } }
        if (!taken && n.elseBody) this._evalNodes(n.elseBody);
      }
    }
  }
  _condTrue(cond) { return !this._execSimple(cond, true).error; }

  // ── Expansion (variables, $( … ), guillemets, jokers) ──────────
  _stripQuotes(s) {
    s = s.trim();
    if ((s[0] === '"' && s[s.length - 1] === '"') || (s[0] === "'" && s[s.length - 1] === "'")) return this._expandLine(s.slice(1, -1));
    return this._expandLine(s);
  }
  // Substitution de commande $( … ) puis expansion des variables (quote-aware)
  _expandLine(str) {
    // 1. $( … ) → sortie de la commande
    let out = "", i = 0;
    while (i < str.length) {
      if (str[i] === "$" && str[i + 1] === "(") {
        let depth = 1, j = i + 2, inner = "";
        while (j < str.length && depth > 0) {
          if (str[j] === "(") depth++;
          else if (str[j] === ")") { depth--; if (depth === 0) break; }
          inner += str[j]; j++;
        }
        const r = this._execSimple(inner, true);
        out += (r.output || "").replace(/\n+/g, " ").trim();
        i = j + 1;
      } else { out += str[i]; i++; }
    }
    // 2. $VAR / ${VAR} / $? — expansé partout SAUF dans les guillemets simples
    let res = "", q = "";
    for (let k = 0; k < out.length; k++) {
      const c = out[k];
      if (c === "'" || c === '"') {        // suivi de l'état de guillemet (les chars sont conservés)
        if (q === c) q = ""; else if (!q) q = c;
        res += c; continue;
      }
      if (c === "$" && q !== "'") {         // pas d'expansion dans les single quotes
        if (out[k + 1] === "?") { res += String(this._lastCode); k++; continue; }
        let name = "", br = out[k + 1] === "{";
        let m = k + (br ? 2 : 1);
        while (m < out.length && /[A-Za-z0-9_]/.test(out[m])) { name += out[m]; m++; }
        if (br && out[m] === "}") m++;
        if (name) { res += this._varValue(name); k = m - 1; continue; }
      }
      res += c;
    }
    return res;
  }
  // Retire un commentaire # en fin de ligne (hors guillemets)
  _stripComment(s) {
    let q = "";
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (q) { if (c === q) q = ""; continue; }
      if (c === "'" || c === '"') { q = c; continue; }
      if (c === "#" && (i === 0 || /\s/.test(s[i - 1]))) return s.slice(0, i);
    }
    return s;
  }
  _varValue(name) {
    if (this._envVars && this._envVars[name] !== undefined) return this._envVars[name];
    const std = { HOME: "/home/user", USER: "user", SHELL: "/bin/bash", PWD: this.cwd, HOSTNAME: "dojo",
                  PATH: "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin" };
    return std[name] !== undefined ? std[name] : "";
  }
  // Développe une liste de mots (pour « for x in … ») : expansion + split + jokers
  _expandWords(raw) {
    const expanded = this._expandLine(raw);
    const words = this._parse(expanded);
    const out = [];
    words.forEach(w => { const g = w.includes("*") ? this._globList(w) : null; if (g) out.push(...g); else out.push(w); });
    return out;
  }

  _parse(s) {
    // Simple split qui gère les guillemets
    const parts = [];
    let cur = "";
    let inQ = false;
    let qChar = "";
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (inQ) {
        if (c === qChar) { inQ = false; }
        else { cur += c; }
      } else if (c === '"' || c === "'") {
        inQ = true; qChar = c;
      } else if (c === " " || c === "\t") {
        if (cur) { parts.push(cur); cur = ""; }
      } else {
        cur += c;
      }
    }
    if (cur) parts.push(cur);
    return parts;
  }

  _runPipe(raw, silent) {
    const segments = this._splitUnquoted(raw, "|").map(s => s.trim()).filter(Boolean);
    let prevOut = "";
    let lastOut = "";
    let lastErr = false;
    for (let i = 0; i < segments.length; i++) {
      const parts = this._parse(segments[i]);
      const res = this._exec(parts, prevOut, true);
      prevOut = res.output;
      lastOut = res.output;
      lastErr = res.error;
    }
    if (!silent && lastOut) lastOut.split("\n").forEach(l => this.printOut(l));
    return { output: lastOut, error: lastErr };
  }

  _runRedirect(raw, append) {
    const sep = append ? ">>" : ">";
    const idx = this._hasUnquoted(raw, sep);
    const left  = raw.slice(0, idx);
    const fname = raw.slice(idx + sep.length).trim();
    const parts = this._parse(left.trim());
    const res = this._exec(parts, "", true);
    if (fname) {
      const abs = this._resolve(fname);
      if (append && this.fs[abs] && this.fs[abs].type === "file") {
        this.fs[abs].content = (this.fs[abs].content || "") + "\n" + res.output;
        this.state.append = fname;
      } else {
        this.fs[abs] = { type: "file", content: res.output };
        this._ensureParents(abs);
        if (append) this.state.append = fname;
      }
      this.state.redirect = fname;
      // pas d'affichage, redirigé
    }
    return { output: res.output, error: false };
  }

  // ── Expansion de glob (*.txt, logs/*.log → fichiers correspondants) ────
  // Retourne des chemins utilisables comme arguments (préfixe dossier conservé).
  _globList(pattern) {
    if (!pattern.includes("*")) return null;
    const slash = pattern.lastIndexOf("/");
    const dirPart = slash >= 0 ? pattern.slice(0, slash + 1) : "";
    const patSeg  = slash >= 0 ? pattern.slice(slash + 1) : pattern;
    if (patSeg.includes("/") || !patSeg.includes("*")) return null;
    const dirPath = dirPart ? this._resolve(dirPart) : this.cwd;
    if (!this._isDir(dirPath) || this._denied(dirPath)) return null;
    const rx = new RegExp("^" + patSeg.split("*").map(s => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$");
    const matches = this._children(dirPath)
      .filter(n => rx.test(n) && !this._isDir(dirPath === "/" ? "/" + n : dirPath + "/" + n))
      .map(n => dirPart + n);
    return matches.length ? matches : null;
  }
  // Étend chaque argument non-option contenant * (si au moins un fichier correspond)
  _expandFileArgs(args) {
    const out = [];
    args.forEach(a => {
      if (!a.startsWith("-") && a.includes("*")) {
        const m = this._globList(a);
        if (m) { out.push(...m); return; }
      }
      out.push(a);
    });
    return out;
  }

  // ── Mini-éditeur nano (mode plein écran texte) ──────────────────
  // GNU nano réel : Ctrl+O enregistre (reste ouvert), Ctrl+X enregistre-et-quitte.
  // Faute de curses dans ce terminal en lignes, les combos se TAPENT littéralement
  // (^O, ^X) — le clavier réel les câble aussi en vrai raccourcis côté UI (gameshell).
  // Édition ligne par ligne : ":N texte" remplace la ligne N, ":a texte" ajoute,
  // ":i N texte" insère avant N, ":d N" supprime, ":p" réaffiche le buffer,
  // ":q" quitte SANS enregistrer (refusé si modifié — ":q!" force l'abandon).
  // Ouvre (ou crée) un fichier en mode édition. Ne pose PAS de contrôle d'écriture
  // (comme le reste du moteur : > et >> n'en posent pas non plus), seule la
  // LECTURE est vérifiée à l'ouverture (cohérent avec cat).
  _nanoOpen(pathArg) {
    const p = this._resolve(pathArg);
    const existing = this.fs[p];
    if (existing && existing.type === "dir") {
      return { out: sh(`nano : « ${pathArg} » est un dossier`, `nano: "${pathArg}" is a directory`), err: true };
    }
    if (this._denied(p) || (existing && existing.type === "file" && !this._canRead(existing))) {
      return { out: this._permErr("nano", pathArg), err: true };
    }
    const content = existing ? (existing.content || "") : "";
    this._nano = { path: p, arg: pathArg, lines: content.split("\n"), dirty: false };
    this.state.nanoOpen = pathArg;
    const header = sh(`GNU nano — ${pathArg}${existing ? "" : " (Nouveau fichier)"}`, `GNU nano — ${pathArg}${existing ? "" : " (New File)"}`);
    const help = sh(
      "💡 :N texte (remplacer la ligne N) · :a texte (ajouter) · :i N texte (insérer avant N) · :d N (supprimer) · :p (réafficher) · ^O (enregistrer) · ^X (enregistrer + quitter) · :q! (quitter sans enregistrer)",
      "💡 :N text (replace line N) · :a text (append) · :i N text (insert before N) · :d N (delete) · :p (redisplay) · ^O (save) · ^X (save & exit) · :q! (quit without saving)"
    );
    return { out: `${header}\n${this._nanoDump()}\n\n${help}`, err: false };
  }

  _nanoDump() {
    const n = this._nano;
    if (n.lines.length === 0 || (n.lines.length === 1 && n.lines[0] === "")) return sh("(vide)", "(empty)");
    return n.lines.map((l, i) => `${String(i + 1).padStart(3, " ")} │ ${l}`).join("\n");
  }

  _nanoSave() {
    const n = this._nano;
    const prev = this.fs[n.path];
    this.fs[n.path] = { type: "file", content: n.lines.join("\n") };
    if (prev) { if (prev.owner) this.fs[n.path].owner = prev.owner; if (prev.perms) this.fs[n.path].perms = prev.perms; }
    this._ensureParents(n.path);
    n.dirty = false;
    this.state.nanoSave = n.arg;
  }

  _nanoInput(raw) {
    const n = this._nano;
    const line = raw.trim();
    let out = "", err = false, closing = false;

    if (!line || line === ":p") {
      out = this._nanoDump();
    } else if (/^\^x$/i.test(line) || line === ":x") {
      if (n.dirty) { this._nanoSave(); out = sh(`[ Écrit ${n.lines.length} lignes ]`, `[ Wrote ${n.lines.length} lines ]`); }
      closing = true;
    } else if (/^\^o$/i.test(line) || line === ":w") {
      this._nanoSave();
      out = sh(`[ Écrit ${n.lines.length} lignes ]`, `[ Wrote ${n.lines.length} lines ]`);
    } else if (line === ":q!") {
      closing = true;
    } else if (line === ":q") {
      if (n.dirty) {
        out = sh("Modifications non enregistrées 💡 ^X pour enregistrer et quitter, ou :q! pour tout abandonner.", "Unsaved changes 💡 ^X to save and exit, or :q! to discard everything.");
        err = true;
      } else closing = true;
    } else {
      let m;
      if ((m = line.match(/^:a\s?(.*)$/))) {
        n.lines.push(m[1]); n.dirty = true; out = this._nanoDump();
      } else if ((m = line.match(/^:i\s+(\d+)\s?(.*)$/))) {
        const idx = parseInt(m[1], 10) - 1;
        if (idx < 0 || idx > n.lines.length) { out = sh(`nano : pas de ligne ${m[1]}`, `nano: no line ${m[1]}`); err = true; }
        else { n.lines.splice(idx, 0, m[2]); n.dirty = true; out = this._nanoDump(); }
      } else if ((m = line.match(/^:d\s+(\d+)$/))) {
        const idx = parseInt(m[1], 10) - 1;
        if (idx < 0 || idx >= n.lines.length) { out = sh(`nano : pas de ligne ${m[1]}`, `nano: no line ${m[1]}`); err = true; }
        else { n.lines.splice(idx, 1); n.dirty = true; out = this._nanoDump(); }
      } else if ((m = line.match(/^:(\d+)\s?(.*)$/))) {
        const idx = parseInt(m[1], 10) - 1;
        if (idx < 0 || idx > n.lines.length) { out = sh(`nano : pas de ligne ${m[1]}`, `nano: no line ${m[1]}`); err = true; }
        else { n.lines[idx] = m[2]; n.dirty = true; out = this._nanoDump(); }
      } else {
        out = sh(
          "nano : commande inconnue. 💡 :N texte · :a texte · :i N texte · :d N · :p · ^O · ^X · :q!",
          "nano: unknown command. 💡 :N text · :a text · :i N text · :d N · :p · ^O · ^X · :q!"
        );
        err = true;
      }
    }

    if (out) { if (err) this.printErr(out); else out.split("\n").forEach(l => this.printOut(l)); }
    if (closing) this._nano = null;
    this._lastCode = err ? 1 : 0;
    return { output: out, error: err };
  }

  // ── Commandes ──────────────────────────────────────────────────
  _exec(parts, stdin = "", silent = false) {
    const [cmd, ...args] = parts;
    if (!cmd) return { output: "", error: false };

    // Expansion d'alias (une seule couche, anti-boucle simple)
    if (this._aliases && this._aliases[cmd] && !this._inAlias) {
      this._inAlias = true;
      const res = this._exec([...this._parse(this._aliases[cmd]), ...args], stdin, silent);
      this._inAlias = false;
      return res;
    }

    // sudo : élévation ponctuelle vers root, suite logique directe des permissions
    // appliquées + comptes utilisateurs. Autorisé si root (déjà tout permis) ou si
    // l'utilisateur courant appartient au groupe "sudo" (cf. usermod -aG sudo, scénario
    // 12). La commande cible est ré-exécutée avec _curUser = "root" (donc _permTriad()
    // lui accorde rwx partout), puis l'identité d'origine est restaurée — sudo ne change
    // PAS l'utilisateur de façon persistante, contrairement à su. Early-return exact
    // comme l'expansion d'alias juste au-dessus : `silent` est transmis tel quel, donc
    // ça compose naturellement avec pipes (sudo cat /etc/shadow | wc -l) et scripts.
    if (cmd === "sudo") {
      this._initUsers();
      const sudoArgs = args.filter(a => a !== "-n" && a !== "-S" && a !== "-i");
      if (sudoArgs.join(" ").includes("sandwich")) {           // xkcd 149, préservé
        const msg = sh("D'accord. 🥪", "Okay. 🥪");
        if (!silent) this.printOut(msg);
        return { output: msg, error: false };
      }
      if (!sudoArgs.length) {
        const msg = sh("usage : sudo COMMANDE [ARGS]", "usage: sudo COMMAND [ARGS]");
        if (!silent) this.printErr(msg);
        return { output: msg, error: true };
      }
      const me = this._users[this._curUser] || this._users.user;
      const allowed = this._curUser === "root" || (me.groups || []).includes("sudo");
      if (!allowed) {
        const msg = sh(
          `${this._curUser} n'apparaît pas dans le fichier sudoers. Cet incident sera signalé. 👮\n💡 Il faut appartenir au groupe sudo : usermod -aG sudo ${this._curUser}${this._curUser !== "root" ? " (root uniquement)" : ""}.`,
          `${this._curUser} is not in the sudoers file. This incident will be reported. 👮\n💡 You need to be in the sudo group: usermod -aG sudo ${this._curUser}${this._curUser !== "root" ? " (root only)" : ""}.`
        );
        if (!silent) this.printErr(msg);
        this.state.sudoDenied = this._curUser;
        return { output: msg, error: true };
      }
      const prevUser = this._curUser;
      this._curUser = "root";
      let res;
      try {
        res = this._exec(sudoArgs, stdin, silent);
      } finally {
        this._curUser = prevUser;
      }
      this.state.sudo = sudoArgs[0];
      return res;
    }

    // Exécution d'un script par chemin : ./script.sh, /home/user/x.sh, dossier/x.sh
    // Contrairement à `bash x.sh` (qui ne demande que la lecture), cette forme
    // exige le bit x — comme sur un vrai système.
    if (cmd.includes("/")) {
      const p = this._resolve(cmd);
      if (this._exists(p) && !this._isDir(p)) {
        if (!this._canExec(this.fs[p])) {
          const msg = sh(`bash: ${cmd}: Permission non accordée 🔒\n💡 Deux issues : rends-le exécutable (chmod +x ${cmd}) ou lance-le via l'interpréteur (bash ${cmd}).`, `bash: ${cmd}: Permission denied 🔒\n💡 Two ways out: make it executable (chmod +x ${cmd}) or run it through the interpreter (bash ${cmd}).`);
          if (!silent) this.printErr(msg);
          return { output: msg, error: true };
        }
        if (!silent) return this._execScript(this.fs[p].content || "");
        // en contexte silencieux (condition), on n'exécute pas de sous-script
        return { output: "", error: false };
      }
      if (this._exists(p) && this._isDir(p)) { if (!silent) this.printErr(`${cmd}: ${cmd}: est un dossier`); return { output: "", error: true }; }
    }

    let out = "";
    let err = false;

    switch (cmd) {

      case "bash":
      case "sh":
      case "source":
      case ".": {
        const file = args.filter(a => !a.startsWith("-"))[0];
        if (!file) { out = sh(`${cmd}: indique un script à exécuter\nExemple : bash deploy.sh`, `${cmd}: specify a script to run\nExample: bash deploy.sh`); err = true; break; }
        const f = this._file(file);
        if (f && f.denied) { out = this._permErr(cmd, file); err = true; break; }
        if (!f || !f.node) { out = sh(`${cmd}: ${file}: fichier introuvable`, `${cmd}: ${file}: file not found`); err = true; break; }
        if (f.node.type === "dir") { out = sh(`${cmd}: ${file}: est un dossier`, `${cmd}: ${file}: is a directory`); err = true; break; }
        if (silent) return { output: "", error: false };
        return this._execScript(f.node.content || "");
      }

      case "test":
      case "[": {
        let a = args.slice();
        if (cmd === "[") { if (a[a.length - 1] === "]") a.pop(); else return { output: sh("[: manque le « ] » final", "[: missing closing « ] »"), error: true }; }
        let truth = false;
        if (a.length === 3) {
          const [x, op, y] = a;
          const nx = parseFloat(x), ny = parseFloat(y);
          if (op === "=" || op === "==") truth = x === y;
          else if (op === "!=") truth = x !== y;
          else if (op === "-eq") truth = nx === ny;
          else if (op === "-ne") truth = nx !== ny;
          else if (op === "-lt") truth = nx < ny;
          else if (op === "-le") truth = nx <= ny;
          else if (op === "-gt") truth = nx > ny;
          else if (op === "-ge") truth = nx >= ny;
        } else if (a.length === 2) {
          const [op, v] = a;
          if (op === "-z") truth = !v;
          else if (op === "-n") truth = !!v;
          else if (op === "-f") { const p = this._resolve(v); truth = this._exists(p) && !this._isDir(p); }
          else if (op === "-d") truth = this._isDir(this._resolve(v));
          else if (op === "-e") truth = this._exists(this._resolve(v));
        } else if (a.length === 1) {
          truth = !!a[0];
        }
        return { output: "", error: !truth };   // code de retour : 0 = vrai
      }

      case "seq": {
        const nums = args.filter(a => !a.startsWith("-")).map(Number);
        let start = 1, end = 0, step = 1;
        if (nums.length === 1) { end = nums[0]; }
        else if (nums.length === 2) { start = nums[0]; end = nums[1]; }
        else if (nums.length >= 3) { start = nums[0]; step = nums[1]; end = nums[2]; }
        const res = [];
        if (step > 0) for (let i = start; i <= end; i += step) res.push(i);
        else if (step < 0) for (let i = start; i >= end; i += step) res.push(i);
        out = res.join("\n");
        break;
      }

      case "true":  return { output: "", error: false };
      case "false": return { output: "", error: true };

      case "ls": {
        const hasA = args.some(a => a.startsWith("-") && a.includes("a"));
        const hasL = args.some(a => a.startsWith("-") && a.includes("l"));
        const target = args.find(a => !a.startsWith("-"));

        let dirPath = this.cwd;       // dossier dont on liste le contenu
        let files;                    // noms affichés
        let nodeFor;                  // name → node (pour -l)

        if (target && target.includes("*")) {
          const g = this._globList(target);
          if (!g) { out = sh(`ls: ${target}: Aucun fichier ou dossier de ce type`, `ls: ${target}: No such file or directory`); err = true; break; }
          files = g;
          nodeFor = n => this.fs[this._resolve(n)];
        } else if (target) {
          const p = this._resolve(target);
          const deniedAt = this._denied(p);
          if (deniedAt) { out = sh(`ls: impossible d'ouvrir '${target}': Permission non accordée 🔒`, `ls: cannot open '${target}': Permission denied 🔒`); err = true; break; }
          if (!this._exists(p)) { out = sh(`ls: ${target}: Aucun fichier ou dossier de ce type`, `ls: ${target}: No such file or directory`); err = true; break; }
          if (!this._isDir(p)) { files = [target]; nodeFor = () => this.fs[p]; }
          else { dirPath = p; }
        }
        if (!files) {
          files = this._children(dirPath);
          nodeFor = n => this.fs[dirPath === "/" ? "/" + n : dirPath + "/" + n];
        }

        if (!hasA) files = files.filter(f => !this._baseOf(f).startsWith("."));
        else if (!target || this._isDir(this._resolve(target))) files = [".", "..", ...files];

        if (!files.length) { out = ""; break; }
        if (hasL) {
          out = files.map(f => {
            const node = (f === "." || f === "..") ? { type: "dir" } : (nodeFor(f) || { type: "file" });
            const perms = node.perms || (node.type === "dir" ? "drwxr-xr-x" : "-rw-r--r--");
            const size = node.content ? node.content.length : (node.type === "dir" ? 4096 : 0);
            return `${perms}  1 ${node.owner || "user"} ${node.group || "user"} ${String(size).padStart(6)}  ${f}`;
          }).join("\n");
        } else {
          // Dans un pipe ou une redirection, ls sort une entrée par ligne (comme le vrai ls)
          out = files.join(silent ? "\n" : "  ");
        }
        break;
      }

      case "cat": {
        const fnames = this._expandFileArgs(args.filter(a => !a.startsWith("-")));
        if (!fnames.length) {
          if (stdin) { out = stdin; break; }
          out = sh("cat: manque le nom de fichier\nUsage : cat FICHIER\nExemple : cat readme.txt\n\nAstuce : tape 'ls' pour voir les fichiers disponibles.", "cat: missing file name\nUsage: cat FILE\nExample: cat readme.txt\n\nTip: type 'ls' to see the available files."); err = true; break;
        }
        const chunks = [];
        for (const fname of fnames) {
          const f = this._file(fname);
          if (f && f.denied) { out = this._permErr("cat", fname); err = true; break; }
          if (!f) {
            const sugg = this._suggestFile(fname);
            out = sh(`cat: ${fname}: Aucun fichier ou dossier de ce type${sugg ? "\nVoulais-tu dire : " + sugg + " ?" : "\n\nTape 'ls' pour voir les fichiers disponibles."}`, `cat: ${fname}: No such file or directory${sugg ? "\nDid you mean: " + sugg + " ?" : "\n\nType 'ls' to see the available files."}`);
            err = true; break;
          }
          if (f.node.type === "dir") { out = sh(`cat: ${fname}: est un dossier\nPour lister son contenu : ls ${fname}`, `cat: ${fname}: is a directory\nTo list its contents: ls ${fname}`); err = true; break; }
          chunks.push(f.node.content || "");
        }
        if (err) break;
        out = chunks.join("\n");
        break;
      }

      case "less":
      case "more": {
        const fname = args[0];
        if (!fname) { out = sh(`${cmd}: manque le nom de fichier`, `${cmd}: missing file name`); err = true; break; }
        const f = this._file(fname);
        if (f && f.denied) { out = this._permErr(cmd, fname); err = true; break; }
        if (!f || !f.node) { out = sh(`${cmd}: ${fname}: Aucun fichier ou dossier de ce type`, `${cmd}: ${fname}: No such file or directory`); err = true; break; }
        out = f.node.content || "";
        break;
      }

      case "pwd": {
        out = this.cwd;
        break;
      }

      case "cd": {
        const target = args[0] || "~";
        if (target === "~" || target === "") {
          this.cwd = this.root;
          this.state.cwd = "home";
          out = "";
          break;
        }
        const p = this._resolve(target);
        const deniedAt = this._denied(p);
        if (deniedAt) { out = sh(`cd: ${target}: Permission non accordée 🔒\n(Il faudrait être root pour entrer dans ${deniedAt}.)`, `cd: ${target}: Permission denied 🔒\n(You'd need to be root to enter ${deniedAt}.)`); err = true; break; }
        if (!this._exists(p)) {
          const sugg = this._suggestFile(this._baseOf(p));
          out = sh(`cd: ${target}: Aucun fichier ou dossier de ce type${sugg && this._isDir(this._resolve(sugg)) ? "\nVoulais-tu dire : cd " + sugg + " ?" : "\n\nTape 'ls' pour voir les dossiers disponibles."}`, `cd: ${target}: No such file or directory${sugg && this._isDir(this._resolve(sugg)) ? "\nDid you mean: cd " + sugg + " ?" : "\n\nType 'ls' to see the available directories."}`);
          err = true; break;
        }
        if (!this._isDir(p)) { out = sh(`cd: ${target}: N'est pas un dossier`, `cd: ${target}: Not a directory`); err = true; break; }
        this.cwd = p;
        this.state.cwd = p === this.root ? "home" : this._baseOf(p);
        out = "";
        break;
      }

      case "mkdir": {
        const hasP = args.includes("-p");
        const p = args.filter(a => !a.startsWith("-"))[0];
        if (!p) { out = sh("mkdir: manque un opérande\nUsage : mkdir NOM_DOSSIER\nExemple : mkdir projets", "mkdir: missing operand\nUsage: mkdir DIR_NAME\nExample: mkdir projets"); err = true; break; }
        const abs = this._resolve(p);
        if (this._exists(abs)) { out = sh(`mkdir: impossible de créer '${p}': Le fichier existe`, `mkdir: cannot create '${p}': File exists`); err = true; break; }
        const parent = this._parentOf(abs);
        if (!this._isDir(parent) && !hasP) {
          out = sh(`mkdir: impossible de créer '${p}': le dossier parent n'existe pas\n💡 Utilise -p pour créer toute l'arborescence : mkdir -p ${p}`, `mkdir: cannot create '${p}': parent directory doesn't exist\n💡 Use -p to create the whole tree: mkdir -p ${p}`);
          err = true; break;
        }
        this.fs[abs] = { type: "dir" };
        this._ensureParents(abs);
        this.state.mkdir = p;
        out = "";
        break;
      }

      case "touch": {
        const p = args[0];
        if (!p) { out = sh("touch: manque le nom du fichier", "touch: missing file name"); err = true; break; }
        const abs = this._resolve(p);
        if (!this._isDir(this._parentOf(abs))) { out = sh(`touch: '${p}': le dossier parent n'existe pas`, `touch: '${p}': parent directory doesn't exist`); err = true; break; }
        if (!this.fs[abs]) this.fs[abs] = { type: "file", content: "" };
        this.state.touch = p;
        out = "";
        break;
      }

      case "cp": {
        const hasR = args.some(a => a.startsWith("-") && a.includes("r"));
        const noFlag = args.filter(a => !a.startsWith("-"));
        if (noFlag.length < 2) { out = sh("cp: manque les arguments\nUsage : cp SOURCE DESTINATION\nExemple : cp config.json config.backup.json\n\nPour copier un dossier entier : cp -r dossier/ copie/", "cp: missing arguments\nUsage: cp SOURCE DESTINATION\nExample: cp config.json config.backup.json\n\nTo copy a whole directory: cp -r folder/ copy/"); err = true; break; }
        const [src, dst] = noFlag;
        const srcAbs = this._resolve(src);
        if (!this._exists(srcAbs)) {
          const sugg = this._suggestFile(src);
          out = sh(`cp: ${src}: Aucun fichier ou dossier de ce type${sugg ? "\nVoulais-tu dire : cp " + sugg + " " + (dst||"destination") + " ?" : ""}`, `cp: ${src}: No such file or directory${sugg ? "\nDid you mean: cp " + sugg + " " + (dst||"destination") + " ?" : ""}`);
          err = true; break;
        }
        if (this._isDir(srcAbs) && !hasR) { out = sh(`cp: -r non spécifié ; omission du dossier '${src}'\n💡 Pour copier un dossier : cp -r ${src} ${dst}`, `cp: -r not specified; omitting directory '${src}'\n💡 To copy a directory: cp -r ${src} ${dst}`); err = true; break; }
        let dstAbs = this._resolve(dst);
        if (this._isDir(dstAbs)) dstAbs = dstAbs + "/" + this._baseOf(srcAbs);   // cp fichier dossier/
        this.fs[dstAbs] = JSON.parse(JSON.stringify(this.fs[srcAbs]));
        if (this._isDir(srcAbs)) {
          // copie récursive du sous-arbre
          for (const k of Object.keys(this.fs)) {
            if (k.startsWith(srcAbs + "/")) this.fs[dstAbs + k.slice(srcAbs.length)] = JSON.parse(JSON.stringify(this.fs[k]));
          }
        }
        this._ensureParents(dstAbs);
        this.state.cp = dst;
        out = "";
        break;
      }

      case "mv": {
        const [src, dst] = args.filter(a => !a.startsWith("-"));
        if (!src || !dst) { out = sh("mv: manque les arguments\nUsage : mv SOURCE DESTINATION\nExemple (renommer) : mv ancien.txt nouveau.txt\nExemple (déplacer) : mv fichier.txt dossier/", "mv: missing arguments\nUsage: mv SOURCE DESTINATION\nExample (rename): mv old.txt new.txt\nExample (move): mv file.txt folder/"); err = true; break; }
        const srcAbs = this._resolve(src);
        if (!this._exists(srcAbs)) {
          const sugg = this._suggestFile(src);
          out = sh(`mv: ${src}: Aucun fichier ou dossier de ce type${sugg ? "\nVoulais-tu dire : mv " + sugg + " " + dst + " ?" : ""}`, `mv: ${src}: No such file or directory${sugg ? "\nDid you mean: mv " + sugg + " " + dst + " ?" : ""}`);
          err = true; break;
        }
        let dstAbs = this._resolve(dst);
        if (this._isDir(dstAbs)) dstAbs = dstAbs + "/" + this._baseOf(srcAbs);   // mv fichier dossier/
        // déplace le nœud + son sous-arbre éventuel
        const moves = [[srcAbs, dstAbs]];
        for (const k of Object.keys(this.fs)) {
          if (k.startsWith(srcAbs + "/")) moves.push([k, dstAbs + k.slice(srcAbs.length)]);
        }
        for (const [from, to] of moves) { this.fs[to] = this.fs[from]; delete this.fs[from]; }
        this._ensureParents(dstAbs);
        this.state.mv = dst;
        out = "";
        break;
      }

      case "rm": {
        const flags = args.filter(a => a.startsWith("-")).join("");
        const targets = this._expandFileArgs(args.filter(a => !a.startsWith("-")));
        if ((flags.includes("r") && flags.includes("f")) && (targets[0] === "/" || targets[0] === "/*")) {
          out = sh("💀 rm -rf / — SÉRIEUSEMENT ?!\n\nSur un vrai système, tu viendrais d'effacer TOUT :\nle système, tes fichiers, tes regrets... tout.\n\nLe dojo te pardonne. Un vrai serveur, non.\n(GNU rm moderne refuse d'ailleurs avec --no-preserve-root)", "💀 rm -rf / — SERIOUSLY?!\n\nOn a real system, you'd have just erased EVERYTHING:\nthe system, your files, your regrets... everything.\n\nThe dojo forgives you. A real server won't.\n(modern GNU rm actually refuses with --no-preserve-root)");
          err = true; break;
        }
        const p = targets[0];
        if (!p) { out = sh("rm: manque le nom du fichier\nUsage : rm FICHIER\nExemple : rm temp.log\n\n⚠️  Attention : pas de corbeille sous Linux, la suppression est définitive !", "rm: missing file name\nUsage: rm FILE\nExample: rm temp.log\n\n⚠️  Warning: no trash on Linux, deletion is permanent!"); err = true; break; }
        const firstAbs = this._resolve(p);
        if (!this._exists(firstAbs)) {
          const sugg = this._suggestFile(p);
          out = sh(`rm: impossible de supprimer '${p}': Aucun fichier ou dossier de ce type${sugg ? "\nVoulais-tu dire : rm " + sugg + " ?" : ""}`, `rm: cannot remove '${p}': No such file or directory${sugg ? "\nDid you mean: rm " + sugg + " ?" : ""}`);
          err = true; break;
        }
        const hasR = flags.includes("r");
        if (this._isDir(firstAbs) && !hasR) { out = sh(`rm: impossible de supprimer '${p}': est un dossier\n💡 Pour supprimer un dossier et son contenu : rm -r ${p}`, `rm: cannot remove '${p}': is a directory\n💡 To remove a directory and its contents: rm -r ${p}`); err = true; break; }
        targets.forEach(t => {
          const abs = this._resolve(t);
          if (!this.fs[abs]) return;
          if (this._isDir(abs)) { for (const k of Object.keys(this.fs)) if (k.startsWith(abs + "/")) delete this.fs[k]; }
          delete this.fs[abs];
        });
        this.state.rm = p;
        out = "";
        break;
      }

      case "chmod": {
        const target = args[args.length - 1];
        if (!target || args.length < 2) { out = sh("chmod: manque les arguments\nUsage : chmod DROITS FICHIER\nExemples : chmod +x script.sh · chmod 600 secret.key · chmod u+x s.sh", "chmod: missing arguments\nUsage: chmod PERMS FILE\nExamples: chmod +x script.sh · chmod 600 secret.key · chmod u+x s.sh"); err = true; break; }
        const abs = this._resolve(target);
        const mode = args[0];
        if (this.fs[abs]) {
          const node = this.fs[abs];
          let perms = node.perms || (node.type === "dir" ? "drwxr-xr-x" : "-rw-r--r--");
          if (/^[0-7]{3}$/.test(mode)) {
            // Mode numérique : chaque chiffre encode une triade (4=r, 2=w, 1=x)
            const tri = d => (d & 4 ? "r" : "-") + (d & 2 ? "w" : "-") + (d & 1 ? "x" : "-");
            perms = perms[0] + tri(+mode[0]) + tri(+mode[1]) + tri(+mode[2]);
          } else {
            // Mode symbolique : [ugoa]±rwx (chmod +x = toutes les triades, comme le vrai)
            const m = mode.match(/^([ugoa]*)([+-])([rwx]+)$/);
            if (!m) { out = sh(`chmod: mode invalide : « ${mode} »\nExemples valides : 600, 644, 755, +x, u+x, go-w`, `chmod: invalid mode: '${mode}'\nValid examples: 600, 644, 755, +x, u+x, go-w`); err = true; break; }
            const [, who, op, letters] = m;
            const triads = [perms.slice(1, 4).split(""), perms.slice(4, 7).split(""), perms.slice(7, 10).split("")];
            const idx = { r: 0, w: 1, x: 2 };
            const apply = t => { for (const L of letters) t[idx[L]] = op === "+" ? L : "-"; };
            const targets = (!who || who.includes("a")) ? [0, 1, 2]
              : [..."ugo"].map((c, i) => who.includes(c) ? i : -1).filter(i => i >= 0);
            targets.forEach(i => apply(triads[i]));
            perms = perms[0] + triads.map(t => t.join("")).join("");
          }
          node.perms = perms;
        }
        this.state.chmod = target;
        out = "";
        break;
      }

      case "chown": {
        if (!args[1]) { out = sh("chown: manque les arguments\nUsage : chown UTILISATEUR[:GROUPE] FICHIER\nExemple : chown sensei:sensei secret.key", "chown: missing arguments\nUsage: chown USER[:GROUP] FILE\nExample: chown sensei:sensei secret.key"); err = true; break; }
        const target = args[args.length - 1];
        const abs = this._resolve(target);
        if (!this.fs[abs]) { out = sh(`chown: impossible d'accéder à '${target}': Aucun fichier ou dossier de ce type`, `chown: cannot access '${target}': No such file or directory`); err = true; break; }
        const [owner, group] = args[0].split(":");
        if (owner) this.fs[abs].owner = owner;
        if (group) this.fs[abs].group = group;
        this.state.chown = target;
        out = "";
        break;
      }

      case "chgrp": {
        if (!args[1]) { out = sh("chgrp: manque les arguments\nUsage : chgrp GROUPE FICHIER\nExemple : chgrp sensei secret.key", "chgrp: missing arguments\nUsage: chgrp GROUP FILE\nExample: chgrp sensei secret.key"); err = true; break; }
        const target = args[args.length - 1];
        const abs = this._resolve(target);
        if (!this.fs[abs]) { out = sh(`chgrp: impossible d'accéder à '${target}': Aucun fichier ou dossier de ce type`, `chgrp: cannot access '${target}': No such file or directory`); err = true; break; }
        this.fs[abs].group = args[0];
        this.state.chgrp = target;
        out = "";
        break;
      }

      case "git": {
        const sub = args[0];
        if (!sub) {
          out = sh("usage: git <commande> [<args>]\n\nCommandes courantes :\n   init       Crée un dépôt Git vide\n   status     Affiche l'état du dépôt\n   add        Ajoute des fichiers à l'index (staging)\n   commit     Enregistre les modifications\n   log        Affiche l'historique des commits\n   branch     Liste ou crée des branches\n   checkout   Change de branche", "usage: git <command> [<args>]\n\nCommon commands:\n   init       Create an empty Git repository\n   status     Show the repository state\n   add        Add files to the index (staging)\n   commit     Record changes\n   log        Show the commit history\n   branch     List or create branches\n   checkout   Switch branch");
          err = true; break;
        }
        if (sub !== "init" && !this._git) {
          out = sh("fatal: pas un dépôt git (ni aucun des dossiers parents) : .git\n💡 Lance d'abord : git init", "fatal: not a git repository (or any of the parent directories): .git\n💡 Run first: git init");
          err = true; break;
        }

        if (sub === "init") {
          this._git = { branch: "main", branches: ["main"], staged: new Set(), committed: new Set(), log: [] };
          const abs = this._resolve(".git");
          this.fs[abs] = { type: "dir" };
          this._ensureParents(abs);
          this.state.gitInit = true;
          out = sh(`Dépôt Git vide initialisé dans ${this.cwd}/.git/`, `Initialized empty Git repository in ${this.cwd}/.git/`);
          break;
        }

        if (sub === "status") {
          const allFiles = Object.keys(this.fs)
            .filter(k => k.startsWith(this.cwd + "/") && !this._isDir(k) && !k.includes("/.git"))
            .map(k => k.slice(this.cwd.length + 1));
          const staged = [...this._git.staged];
          const untracked = allFiles.filter(f => !this._git.committed.has(f) && !this._git.staged.has(f));
          const L = [sh(`Sur la branche ${this._git.branch}`, `On branch ${this._git.branch}`)];
          if (!this._git.log.length) L.push("", sh("Aucun commit pour l'instant", "No commits yet"));
          if (staged.length) L.push("", sh("Modifications qui seront validées :", "Changes to be committed:"), ...staged.map(f => sh(`\tnouveau fichier :   ${f}`, `\tnew file:   ${f}`)));
          if (untracked.length) L.push("", sh("Fichiers non suivis :", "Untracked files:"), sh("  (utilisez « git add <fichier> » pour les inclure)", "  (use \"git add <file>\" to include them)"), ...untracked.map(f => `\t${f}`));
          if (!staged.length && !untracked.length) L.push("", sh("rien à valider, la copie de travail est propre", "nothing to commit, working tree clean"));
          this.state.gitStatus = true;
          out = L.join("\n");
          break;
        }

        if (sub === "add") {
          const targets = args.slice(1);
          if (!targets.length) { out = sh("Rien de spécifié, rien ajouté.\nUsage : git add <fichier>   ou   git add .", "Nothing specified, nothing added.\nUsage: git add <file>   or   git add ."); err = true; break; }
          if (targets.includes(".")) {
            Object.keys(this.fs)
              .filter(k => k.startsWith(this.cwd + "/") && !this._isDir(k) && !k.includes("/.git"))
              .forEach(k => this._git.staged.add(k.slice(this.cwd.length + 1)));
          } else {
            for (const t of targets) {
              const abs = this._resolve(t);
              if (!this._exists(abs)) { out = sh(`fatal: le chemin '${t}' ne correspond à aucun fichier connu de git`, `fatal: pathspec '${t}' did not match any files`); err = true; break; }
              this._git.staged.add(abs.slice(this.cwd.length + 1));
            }
          }
          if (!err) out = "";
          this.state.gitAdd = [...this._git.staged];
          break;
        }

        if (sub === "commit") {
          const mIdx = args.indexOf("-m");
          const msg = mIdx >= 0 ? this._stripQuotes(args.slice(mIdx + 1).join(" ")) : null;
          if (!msg) { out = sh("git commit: il faut un message\nUsage : git commit -m \"message du commit\"", "git commit: a message is required\nUsage: git commit -m \"commit message\""); err = true; break; }
          if (!this._git.staged.size) { out = sh('rien à valider (utilisez "git add" pour suivre des fichiers)', 'nothing to commit (use "git add" to track files)'); err = true; break; }
          const hash = Math.random().toString(16).slice(2, 9);
          const files = [...this._git.staged];
          files.forEach(f => this._git.committed.add(f));
          this._git.log.unshift({ hash, msg, files, branch: this._git.branch });
          this._git.staged.clear();
          out = `[${this._git.branch} ${hash}] ${msg}\n ` + sh(`${files.length} fichier(s) modifié(s)`, `${files.length} file(s) changed`);
          this.state.gitCommit = msg;
          this.state.gitCommitCount = this._git.log.length;
          break;
        }

        if (sub === "log") {
          if (!this._git.log.length) { out = sh(`fatal: votre branche actuelle '${this._git.branch}' ne contient encore aucun commit`, `fatal: your current branch '${this._git.branch}' does not have any commits yet`); err = true; break; }
          out = this._git.log.map(c => `commit ${c.hash}${"0".repeat(33)}\n` + sh("Auteur", "Author") + ` : user <user@dojo>\n\n    ${c.msg}\n`).join("\n");
          this.state.gitLog = true;
          break;
        }

        if (sub === "branch") {
          const name = args[1];
          if (!name) { out = this._git.branches.map(b => (b === this._git.branch ? "* " : "  ") + b).join("\n"); break; }
          if (this._git.branches.includes(name)) { out = sh(`fatal: une branche nommée '${name}' existe déjà`, `fatal: a branch named '${name}' already exists`); err = true; break; }
          this._git.branches.push(name);
          this.state.gitBranch = name;
          out = "";
          break;
        }

        if (sub === "checkout") {
          const create = args[1] === "-b";
          const name = create ? args[2] : args[1];
          if (!name) { out = sh("usage: git checkout <branche>\n       git checkout -b <nouvelle-branche>", "usage: git checkout <branch>\n       git checkout -b <new-branch>"); err = true; break; }
          if (create) {
            if (this._git.branches.includes(name)) { out = sh(`fatal: une branche nommée '${name}' existe déjà`, `fatal: a branch named '${name}' already exists`); err = true; break; }
            this._git.branches.push(name);
          } else if (!this._git.branches.includes(name)) {
            out = sh(`error: pathspec '${name}' ne correspond à aucun fichier connu de git`, `error: pathspec '${name}' did not match any file(s) known to git`); err = true; break;
          }
          this._git.branch = name;
          this.state.gitCheckout = name;
          out = create ? sh(`Basculement sur la nouvelle branche '${name}'`, `Switched to a new branch '${name}'`) : sh(`Basculement sur la branche '${name}'`, `Switched to branch '${name}'`);
          break;
        }

        out = sh(`git: '${sub}' n'est pas une commande git. Voir 'git --help'.`, `git: '${sub}' is not a git command. See 'git --help'.`);
        err = true;
        break;
      }

      case "docker": {
        if (!this._docker) this._docker = { images: [], containers: [] };
        const sub = args[0];
        if (!sub) {
          out = sh("Usage :  docker COMMANDE\n\nCommandes courantes :\n  build    Construit une image à partir d'un Dockerfile\n  images   Liste les images locales\n  run      Démarre un conteneur\n  ps       Liste les conteneurs\n  logs     Affiche les logs d'un conteneur\n  stop     Arrête un conteneur\n  rm       Supprime un conteneur arrêté", "Usage:  docker COMMAND\n\nCommon commands:\n  build    Build an image from a Dockerfile\n  images   List local images\n  run      Start a container\n  ps       List containers\n  logs     Show a container's logs\n  stop     Stop a container\n  rm       Remove a stopped container");
          err = true; break;
        }

        if (sub === "build") {
          const tIdx = args.indexOf("-t");
          const name = tIdx >= 0 ? args[tIdx + 1] : null;
          if (!name) { out = sh("docker build: il faut nommer l'image avec -t\nUsage : docker build -t nom .", "docker build: the image must be named with -t\nUsage: docker build -t name ."); err = true; break; }
          const dfPath = this._resolve("Dockerfile");
          if (!this.fs[dfPath]) { out = sh("unable to prepare context: unable to evaluate symlinks in Dockerfile path: lstat Dockerfile: no such file or directory\n💡 Un Dockerfile est requis dans le dossier courant.", "unable to prepare context: unable to evaluate symlinks in Dockerfile path: lstat Dockerfile: no such file or directory\n💡 A Dockerfile is required in the current directory."); err = true; break; }
          const id = Math.random().toString(16).slice(2, 14);
          this._docker.images = this._docker.images.filter(i => i.name !== name);
          this._docker.images.push({ name, id });
          this.state.dockerBuild = name;
          out = sh(`Envoi du contexte de build au démon Docker\nÉtape 1/3 : FROM node:18\nÉtape 2/3 : COPY . /app\nÉtape 3/3 : CMD ["node", "server.js"]\nImage construite avec succès : ${id}\nTaguée : ${name}:latest`, `Sending build context to Docker daemon\nStep 1/3: FROM node:18\nStep 2/3: COPY . /app\nStep 3/3: CMD ["node", "server.js"]\nSuccessfully built ${id}\nSuccessfully tagged ${name}:latest`);
          break;
        }

        if (sub === "images") {
          const header = "REPOSITORY   TAG       IMAGE ID       SIZE";
          out = this._docker.images.length
            ? [header, ...this._docker.images.map(i => `${i.name}        latest    ${i.id.slice(0, 12)}   128MB`)].join("\n")
            : header;
          this.state.dockerImages = true;
          break;
        }

        if (sub === "run") {
          const detached = args.includes("-d");
          const nameIdx = args.indexOf("--name");
          const cname = nameIdx >= 0 ? args[nameIdx + 1] : "conteneur" + (this._docker.containers.length + 1);
          const image = args[args.length - 1];
          if (!image || image.startsWith("-")) { out = sh("docker: manque le nom de l'image\nUsage : docker run -d --name nom image", "docker: missing image name\nUsage: docker run -d --name name image"); err = true; break; }
          const found = this._docker.images.find(i => i.name === image || i.name === image.split(":")[0]);
          if (!found) { out = sh(`Unable to find image '${image}:latest' locally\ndocker: Error response from daemon: pull access denied for ${image}\n💡 Construis d'abord l'image avec docker build -t ${image} .`, `Unable to find image '${image}:latest' locally\ndocker: Error response from daemon: pull access denied for ${image}\n💡 Build the image first with docker build -t ${image} .`); err = true; break; }
          if (this._docker.containers.find(c => c.name === cname && c.status === "running")) { out = `docker: Error response from daemon: Conflict. The container name "/${cname}" is already in use.`; err = true; break; }
          const id = Math.random().toString(16).slice(2, 14);
          this._docker.containers.push({ id, name: cname, image, status: "running" });
          this.state.dockerRun = cname;
          out = detached ? id : sh("Serveur démarré sur le port 3000\n(Ctrl+C pour arrêter — ou lance avec -d pour le mode détaché)", "Server started on port 3000\n(Ctrl+C to stop — or run with -d for detached mode)");
          break;
        }

        if (sub === "ps") {
          const all = args.includes("-a");
          const list = this._docker.containers.filter(c => all || c.status === "running");
          const header = "CONTAINER ID   IMAGE     STATUS         NAMES";
          out = list.length
            ? [header, ...list.map(c => `${c.id.slice(0, 12)}   ${c.image}     ${c.status === "running" ? "Up 2 minutes" : "Exited (0)"}   ${c.name}`)].join("\n")
            : header;
          this.state.dockerPs = true;
          break;
        }

        if (sub === "logs") {
          const cname = args[1];
          const c = this._docker.containers.find(c => c.name === cname);
          if (!c) { out = `Error: No such container: ${cname}`; err = true; break; }
          out = sh("npm start\n> monapp@1.0.0 start\n> node server.js\n\nServeur démarré sur le port 3000\nEn attente de connexions...", "npm start\n> monapp@1.0.0 start\n> node server.js\n\nServer started on port 3000\nWaiting for connections...");
          this.state.dockerLogs = cname;
          break;
        }

        if (sub === "stop") {
          const cname = args[1];
          const c = this._docker.containers.find(c => c.name === cname && c.status === "running");
          if (!c) { out = `Error response from daemon: No such container: ${cname}`; err = true; break; }
          c.status = "exited";
          this.state.dockerStop = cname;
          out = cname;
          break;
        }

        if (sub === "rm") {
          const cname = args[1];
          const idx = this._docker.containers.findIndex(c => c.name === cname);
          if (idx < 0) { out = `Error: No such container: ${cname}`; err = true; break; }
          if (this._docker.containers[idx].status === "running") { out = `Error response from daemon: You cannot remove a running container ${cname}. Stop it first.`; err = true; break; }
          this._docker.containers.splice(idx, 1);
          this.state.dockerRm = cname;
          out = cname;
          break;
        }

        out = sh(`docker: '${sub}' n'est pas une commande docker.\nVoir 'docker --help'.`, `docker: '${sub}' is not a docker command.\nSee 'docker --help'.`);
        err = true;
        break;
      }

      case "systemctl": {
        this._initServices();
        const sub = args[0];
        const unit = (args[1] || "").replace(/\.service$/, "");
        if (!sub) {
          out = sh("Usage :  systemctl COMMANDE [UNITÉ]\n\nCommandes courantes :\n  status    Affiche l'état d'un service\n  start     Démarre un service\n  stop      Arrête un service\n  restart   Redémarre un service\n  enable    Active le démarrage automatique au boot\n  disable   Désactive le démarrage automatique\n  list-units --type=service   Liste les services", "Usage:  systemctl COMMAND [UNIT]\n\nCommon commands:\n  status    Show a service's state\n  start     Start a service\n  stop      Stop a service\n  restart   Restart a service\n  enable    Enable automatic start at boot\n  disable   Disable automatic start\n  list-units --type=service   List services");
          err = true; break;
        }

        if (sub === "list-units" || sub === "list-unit-files") {
          const rows = Object.entries(this._services).map(([n, s]) =>
            `${(n + ".service").padEnd(18)} loaded ${s.failed ? "failed   failed " : s.active ? "active   running" : "inactive dead   "} ${s.desc}`);
          out = "UNIT               LOAD   ACTIVE   SUB     DESCRIPTION\n" + rows.join("\n");
          this.state.sysList = true;
          break;
        }

        if (!unit) { out = sh(`systemctl ${sub} : il manque le nom du service\nUsage : systemctl ${sub} NOM`, `systemctl ${sub}: missing service name\nUsage: systemctl ${sub} NAME`); err = true; break; }
        const svc = this._services[unit];
        if (!svc) { out = `Unit ${unit}.service could not be found.`; err = true; break; }

        if (sub === "status") {
          const stateLine = svc.failed
            ? "failed (Result: exit-code)"
            : svc.active ? "active (running)" : "inactive (dead)";
          const dot = svc.failed ? "×" : svc.active ? "●" : "○";
          out = [
            `${dot} ${unit}.service - ${svc.desc}`,
            `     Loaded: loaded (/lib/systemd/system/${unit}.service; ${svc.enabled ? "enabled" : "disabled"}; preset: enabled)`,
            `     Active: ${stateLine}`,
            svc.failed ? sh(`    Process: ExecStart=/usr/sbin/${unit} (code=exited, status=1/FAILURE)\n💡 Le service a planté au démarrage. Consulte ses logs : journalctl -u ${unit}`, `    Process: ExecStart=/usr/sbin/${unit} (code=exited, status=1/FAILURE)\n💡 The service crashed at startup. Check its logs: journalctl -u ${unit}`) : `   Main PID: ${svc.active ? svc.pid + " (" + unit + ")" : "n/a"}`,
          ].join("\n");
          this.state.sysStatus = unit;
          break;
        }

        if (sub === "start" || sub === "restart") {
          // Conflit pédagogique : nginx ne peut pas démarrer tant qu'apache2 occupe le port 80
          if (unit === "nginx" && this._services.apache2 && this._services.apache2.active) {
            svc.failed = true; svc.active = false;
            out = sh(`Job for nginx.service failed because the control process exited with error code.\nSee "systemctl status nginx" and "journalctl -u nginx" for details.\n💡 Un autre service occupe peut-être déjà le port 80...`, `Job for nginx.service failed because the control process exited with error code.\nSee "systemctl status nginx" and "journalctl -u nginx" for details.\n💡 Another service may already be squatting port 80...`);
            err = true; break;
          }
          svc.active = true; svc.failed = false;
          this.state[sub === "start" ? "sysStart" : "sysRestart"] = unit;
          out = ""; // comme le vrai systemctl : silencieux quand tout va bien
          break;
        }

        if (sub === "stop") {
          svc.active = false; svc.failed = false;
          this.state.sysStop = unit;
          out = "";
          break;
        }

        if (sub === "enable") {
          svc.enabled = true;
          this.state.sysEnable = unit;
          out = `Created symlink /etc/systemd/system/multi-user.target.wants/${unit}.service → /lib/systemd/system/${unit}.service.`;
          break;
        }

        if (sub === "disable") {
          svc.enabled = false;
          this.state.sysDisable = unit;
          out = `Removed "/etc/systemd/system/multi-user.target.wants/${unit}.service".`;
          break;
        }

        out = sh(`systemctl : commande inconnue « ${sub} »\nEssaie : status, start, stop, restart, enable, disable, list-units`, `systemctl: unknown command "${sub}"\nTry: status, start, stop, restart, enable, disable, list-units`);
        err = true;
        break;
      }

      case "journalctl": {
        this._initServices();
        const uIdx = args.indexOf("-u");
        const unit = uIdx >= 0 ? (args[uIdx + 1] || "").replace(/\.service$/, "") : null;
        const nIdx = args.indexOf("-n");
        const nLines = nIdx >= 0 ? parseInt(args[nIdx + 1], 10) || 10 : 0;
        if (uIdx >= 0 && !unit) { out = sh("journalctl : il manque le nom du service après -u\nUsage : journalctl -u NOM", "journalctl: missing service name after -u\nUsage: journalctl -u NAME"); err = true; break; }
        if (unit && !this._services[unit]) { out = `-- No entries --\n💡 Unit ${unit}.service ${sh("introuvable", "not found")}.`; err = true; break; }
        let lines;
        if (unit) {
          lines = this._journal(unit);
          this.state.journalUnit = unit;
        } else {
          lines = Object.keys(this._services).flatMap(u => this._journal(u).slice(-2));
          this.state.journal = true;
        }
        if (nLines > 0) lines = lines.slice(-nLines);
        out = lines.join("\n");
        break;
      }

      case "useradd": {
        this._initUsers();
        const mkHome = args.includes("-m");
        const name = args.find(a => !a.startsWith("-"));
        if (!name) { out = sh("useradd : il manque le nom du compte\nUsage : useradd -m NOM", "useradd: missing account name\nUsage: useradd -m NAME"); err = true; break; }
        if (this._users[name]) { out = sh(`useradd : l'utilisateur « ${name} » existe déjà`, `useradd: user '${name}' already exists`); err = true; break; }
        const uid = this._nextUid++;
        this._users[name] = { uid, groups: [name], hasPassword: false };
        if (mkHome) {
          this.fs["/home/" + name] = { type: "dir" };
          this._ensureParents("/home/" + name);
          this.state.useraddHome = true;
        }
        // /etc/passwd gagne sa ligne, comme sur un vrai système
        const pw = this.fs["/etc/passwd"];
        if (pw && pw.type === "file") pw.content = (pw.content || "").replace(/\n?$/, "") + `\n${name}:x:${uid}:${uid}::/home/${name}:/bin/bash`;
        this.state.useradd = name;
        out = ""; // comme le vrai useradd : silencieux quand tout va bien
        break;
      }

      case "passwd": {
        this._initUsers();
        const name = args.find(a => !a.startsWith("-")) || this._curUser;
        const u = this._users[name];
        if (!u) { out = sh(`passwd : l'utilisateur « ${name} » n'existe pas`, `passwd: user '${name}' does not exist`); err = true; break; }
        u.hasPassword = true;
        this.state.passwd = name;
        out = sh("Nouveau mot de passe : ********\nRetapez le nouveau mot de passe : ********\npasswd : mot de passe mis à jour avec succès", "New password: ********\nRetype new password: ********\npasswd: password updated successfully");
        break;
      }

      case "usermod": {
        this._initUsers();
        const flagStr = args.filter(a => a.startsWith("-")).join("");
        const rest = args.filter(a => !a.startsWith("-"));
        const hasA = flagStr.includes("a"), hasG = flagStr.includes("G");
        if (!hasG || rest.length < 2) { out = sh("usermod : usage : usermod -aG GROUPE UTILISATEUR\n(-a = ajouter au groupe, sans écraser les groupes existants)", "usermod: usage: usermod -aG GROUP USER\n(-a = append to the group, without wiping the existing ones)"); err = true; break; }
        const [group, name] = rest;
        const u = this._users[name];
        if (!u) { out = sh(`usermod : l'utilisateur « ${name} » n'existe pas`, `usermod: user '${name}' does not exist`); err = true; break; }
        if (hasA) {
          if (!u.groups.includes(group)) u.groups.push(group);
          this.state.usermodAG = `${name}:${group}`;
        } else {
          // -G sans -a : REMPLACE les groupes secondaires — le piège classique,
          // fidèlement simulé (la leçon du scénario 12 le désamorce)
          u.groups = [name, group].filter((g, i, a) => a.indexOf(g) === i);
          this.state.usermodG = `${name}:${group}`;
        }
        out = "";
        break;
      }

      case "groups": {
        this._initUsers();
        const name = args.find(a => !a.startsWith("-")) || this._curUser;
        const u = this._users[name];
        if (!u) { out = sh(`groups : « ${name} » : utilisateur inexistant`, `groups: '${name}': no such user`); err = true; break; }
        this.state.groups = name;
        out = `${name} : ${u.groups.join(" ")}`;
        break;
      }

      case "su": {
        this._initUsers();
        const name = args.find(a => a !== "-" && !a.startsWith("-")) || "root";
        const u = this._users[name];
        if (!u) { out = sh(`su : l'utilisateur ${name} n'existe pas`, `su: user ${name} does not exist`); err = true; break; }
        if (name === this._curUser) { out = sh(`Tu es déjà ${name}.`, `You already are ${name}.`); break; }
        if (!u.hasPassword) {
          out = sh(`Mot de passe :\nsu : Échec de l'authentification\n💡 Ce compte n'a pas de mot de passe — définis-le d'abord : passwd ${name}`, `Password:\nsu: Authentication failure\n💡 This account has no password — set one first: passwd ${name}`);
          err = true; break;
        }
        this._suStack.push({ ps1: this.ps1User, user: this._curUser });
        this._curUser = name;
        this.ps1User = this.ps1User.replace(/^[^@]+/, name);
        this.state.su = name;
        out = "";
        break;
      }

      case "crontab": {
        const sub = args[0];
        if (!sub) {
          out = sh("Usage :  crontab [-l | -r | fichier]\n  -l        affiche la crontab actuelle\n  -r        supprime TOUTE la crontab\n  fichier   installe le contenu du fichier comme crontab", "Usage:  crontab [-l | -r | file]\n  -l        show the current crontab\n  -r        remove the WHOLE crontab\n  file      install the file's contents as the crontab");
          err = true; break;
        }
        if (sub === "-l") {
          if (!this._crontab) { out = sh(`aucune crontab pour ${this._curUser}`, `no crontab for ${this._curUser}`); err = true; break; }
          out = this._crontab.join("\n");
          this.state.crontabL = true;
          break;
        }
        if (sub === "-r") {
          if (!this._crontab) { out = sh(`aucune crontab pour ${this._curUser}`, `no crontab for ${this._curUser}`); err = true; break; }
          this._crontab = null;
          this.state.crontabR = true;
          out = ""; // comme le vrai : suppression silencieuse, sans confirmation
          break;
        }
        if (sub === "-e") {
          out = sh("(pas d'éditeur interactif dans le dojo)\n💡 Fais comme les admins qui scriptent leurs serveurs : écris tes lignes dans un fichier, puis installe-le avec :  crontab fichier", "(no interactive editor in the dojo)\n💡 Do it like admins who script their servers: write your lines in a file, then install it with:  crontab file");
          break;
        }
        // crontab FICHIER — installe le contenu du fichier
        const abs = this._resolve(sub);
        const f = this.fs[abs];
        if (!f || f.type !== "file") { out = sh(`crontab : impossible d'ouvrir « ${sub} » : fichier introuvable`, `crontab: can't open '${sub}': no such file`); err = true; break; }
        const lines = (f.content || "").split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("#"));
        if (!lines.length) { out = sh(`crontab : « ${sub} » ne contient aucune tâche`, `crontab: '${sub}' contains no job`); err = true; break; }
        // Un champ de temps valide : * , */N , N , N-M , listes (1,15) et pas (N-M/S)
        const field = /^(\*(\/\d+)?|\d+(-\d+)?(\/\d+)?(,\d+(-\d+)?)*)$/;
        const bad = lines.findIndex(l => {
          if (/^@(reboot|hourly|daily|weekly|monthly|yearly)\s+\S/.test(l)) return false;
          const tok = l.split(/\s+/);
          return tok.length < 6 || !tok.slice(0, 5).every(tf => field.test(tf));
        });
        if (bad >= 0) {
          out = sh(`"${sub}":${bad + 1}: syntaxe invalide — attendu 5 champs de temps puis une commande\n(minute heure jour-du-mois mois jour-de-semaine commande)\ncrontab : erreurs dans le fichier, installation annulée`, `"${sub}":${bad + 1}: invalid syntax — expected 5 time fields then a command\n(minute hour day-of-month month day-of-week command)\ncrontab: errors in crontab file, can't install`);
          err = true; break;
        }
        this._crontab = lines;
        this.state.crontabInstall = sub;
        out = ""; // installation silencieuse, comme le vrai
        break;
      }

      case "alias": {
        if (!args.length) {
          const entries = Object.entries(this._aliases);
          out = entries.length ? entries.map(([k, v]) => `alias ${k}='${v}'`).join("\n") : "";
          break;
        }
        const joined = args.join(" ");
        const m = joined.match(/^([A-Za-z_][\w.-]*)=(.*)$/);
        if (!m) { out = sh("alias: usage : alias nom='commande'\nExemple : alias ll='ls -la'", "alias: usage: alias name='command'\nExample: alias ll='ls -la'"); err = true; break; }
        this._aliases[m[1]] = this._stripQuotes(m[2]);
        this.state.alias = m[1];
        out = "";
        break;
      }

      case "unalias": {
        const name = args[0];
        if (!name) { out = sh("unalias: manque le nom de l'alias\nUsage : unalias NOM", "unalias: missing alias name\nUsage: unalias NAME"); err = true; break; }
        if (!this._aliases[name]) { out = sh(`unalias: ${name}: alias introuvable`, `unalias: ${name}: alias not found`); err = true; break; }
        delete this._aliases[name];
        out = "";
        break;
      }

      case "jobs": {
        if (!this._jobs.length) { out = ""; break; }
        out = this._jobs.map(j => `[${j.id}]+  ${j.done ? sh("Terminé", "Done") : sh("En cours", "Running")}              ${j.cmd} &`).join("\n");
        break;
      }

      case "fg": {
        if (!this._jobs.length) { out = sh("fg: aucun job en arrière-plan\n💡 Lance une commande avec « & » pour créer un job (ex: sleep 5 &)", "fg: no background jobs\n💡 Run a command with \"&\" to create a job (e.g. sleep 5 &)"); err = true; break; }
        const spec = args[0] ? args[0].replace("%", "") : null;
        const target = spec ? this._jobs.find(j => String(j.id) === spec) : this._jobs[this._jobs.length - 1];
        if (!target) { out = sh(`fg: %${spec}: job introuvable`, `fg: %${spec}: no such job`); err = true; break; }
        out = (target.output ? target.output + "\n" : "") + `${target.cmd}`;
        this._jobs = this._jobs.filter(j => j !== target);
        break;
      }

      case "xargs": {
        let a = args.slice();
        let n = null;
        const nIdx = a.indexOf("-n");
        if (nIdx >= 0) { n = parseInt(a[nIdx + 1], 10) || 1; a.splice(nIdx, 2); }
        const tokens = (stdin || "").split(/\s+/).filter(Boolean);
        if (!tokens.length) { out = ""; break; }
        const baseCmd = a.length ? a : ["echo"];
        const batches = [];
        if (n) { for (let i = 0; i < tokens.length; i += n) batches.push(tokens.slice(i, i + n)); }
        else batches.push(tokens);
        const outs = [];
        for (const b of batches) {
          const r = this._exec([...baseCmd, ...b], "", true);
          if (r.output) outs.push(r.output);
        }
        out = outs.join("\n");
        break;
      }

      case "diff": {
        const files = args.filter(a => !a.startsWith("-"));
        if (files.length < 2) { out = sh("diff: il faut deux fichiers\nUsage : diff FICHIER1 FICHIER2", "diff: two files are required\nUsage: diff FILE1 FILE2"); err = true; break; }
        const f1 = this._file(files[0]);
        const f2 = this._file(files[1]);
        if (f1 && f1.denied) { out = this._permErr("diff", files[0]); err = true; break; }
        if (f2 && f2.denied) { out = this._permErr("diff", files[1]); err = true; break; }
        if (!f1 || !f1.node) { out = sh(`diff: ${files[0]}: Aucun fichier ou dossier de ce type`, `diff: ${files[0]}: No such file or directory`); err = true; break; }
        if (!f2 || !f2.node) { out = sh(`diff: ${files[1]}: Aucun fichier ou dossier de ce type`, `diff: ${files[1]}: No such file or directory`); err = true; break; }
        const l1 = (f1.node.content || "").split("\n");
        const l2 = (f2.node.content || "").split("\n");
        const max = Math.max(l1.length, l2.length);
        const lines = [];
        for (let i = 0; i < max; i++) {
          const va = l1[i], vb = l2[i];
          if (va === vb) continue;
          if (va !== undefined && vb !== undefined) { lines.push(`${i + 1}c${i + 1}`, `< ${va}`, "---", `> ${vb}`); }
          else if (va !== undefined) { lines.push(`${i + 1}d${i}`, `< ${va}`); }
          else { lines.push(`${i + 1}a${i + 1}`, `> ${vb}`); }
        }
        out = lines.join("\n");
        break;
      }

      case "grep": {
        const flags = args.filter(a => a.startsWith("-")).join("");
        const noFlag = args.filter(a => !a.startsWith("-"));
        const caseFlag = flags.includes("i");
        const numFlag  = flags.includes("n");
        const invFlag  = flags.includes("v");
        const cntFlag  = flags.includes("c");
        const pattern  = noFlag[0];
        let   fname    = noFlag[1];
        if (!pattern) { out = sh("grep: manque le motif de recherche\nUsage : grep MOTIF FICHIER\nExemple : grep ERROR app.log\n\nOptions utiles :\n  -i  ignorer la casse\n  -n  afficher les numéros de ligne\n  -v  inverser (lignes SANS le motif)\n  -c  compter les résultats", "grep: missing search pattern\nUsage: grep PATTERN FILE\nExample: grep ERROR app.log\n\nUseful options:\n  -i  ignore case\n  -n  show line numbers\n  -v  invert (lines WITHOUT the pattern)\n  -c  count the results"); err = true; break; }

        if (fname && fname.includes("*")) {
          const g = this._globList(fname);
          if (g) fname = g[0];
        }
        let content = stdin;
        if (fname) {
          const f = this._file(fname);
          if (f && f.denied) { out = this._permErr("grep", fname); err = true; break; }
          if (!f || !f.node) { out = sh(`grep: ${fname}: Aucun fichier ou dossier de ce type`, `grep: ${fname}: No such file or directory`); err = true; break; }
          content = f.node.content || "";
        }

        const lines = content.split("\n");
        let matched = lines
          .map((l, i) => ({ line: l, num: i + 1 }))
          .filter(({ line }) => caseFlag ? line.toLowerCase().includes(pattern.toLowerCase()) : line.includes(pattern));
        if (invFlag) {
          const keep = new Set(matched.map(m => m.num));
          matched = lines.map((l, i) => ({ line: l, num: i + 1 })).filter(m => !keep.has(m.num));
        }
        if (cntFlag) { out = String(matched.length); break; }
        out = matched.map(({ line, num }) => numFlag ? `${num}:${line}` : line).join("\n");
        break;
      }

      case "find": {
        const nameIdx = args.indexOf("-name");
        const pat = nameIdx >= 0 ? (args[nameIdx + 1] || "").replace(/['"]/g, "") : "";
        const typeIdx = args.indexOf("-type");
        const typeWanted = typeIdx >= 0 ? args[typeIdx + 1] : "";
        // point de départ : premier argument non-option (par défaut ".")
        const startArg = args.find((a, i) => !a.startsWith("-") && args[i-1] !== "-name" && args[i-1] !== "-type") || ".";
        const startAbs = startArg === "." ? this.cwd : this._resolve(startArg);
        if (!this._isDir(startAbs)) { out = sh(`find: '${startArg}': Aucun dossier de ce type`, `find: '${startArg}': No such directory`); err = true; break; }
        const rx = pat ? new RegExp("^" + pat.split("*").map(s => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$") : null;
        const results = [];
        const prefix = startAbs === "/" ? "" : startAbs;
        for (const k of Object.keys(this.fs).sort()) {
          if (k !== startAbs && !k.startsWith(prefix + "/")) continue;
          if (this._denied(k)) continue;
          const isDir = this._isDir(k);
          if (typeWanted === "f" && isDir) continue;
          if (typeWanted === "d" && !isDir) continue;
          const base = this._baseOf(k);
          if (rx && !rx.test(base)) continue;
          const rel = k === startAbs ? "." : "." + k.slice(prefix.length);
          results.push(startArg === "." || startArg.startsWith(".") ? rel : k);
        }
        out = results.join("\n");
        break;
      }

      case "wc": {
        const hasL = args.includes("-l");
        const hasW = args.includes("-w");
        const hasC = args.includes("-c");
        const fnames = this._expandFileArgs(args.filter(a => !a.startsWith("-")));
        const count = (content, fname) => {
          const lines = content.split("\n").length;
          const words = content.split(/\s+/).filter(Boolean).length;
          const chars = content.length;
          if (hasL) return `${lines}${fname ? " " + fname : ""}`;
          if (hasW) return `${words}${fname ? " " + fname : ""}`;
          if (hasC) return `${chars}${fname ? " " + fname : ""}`;
          return `${lines} ${words} ${chars}${fname ? " " + fname : ""}`;
        };
        if (!fnames.length) { out = count(stdin, ""); break; }
        const rows = [];
        for (const fname of fnames) {
          const f = this._file(fname);
          if (f && f.denied) { out = this._permErr("wc", fname); err = true; break; }
          if (!f || !f.node) { out = sh(`wc: ${fname}: Aucun fichier ou dossier de ce type`, `wc: ${fname}: No such file or directory`); err = true; break; }
          rows.push(count(f.node.content || "", fname));
        }
        if (err) break;
        out = rows.join("\n");
        break;
      }

      case "sort": {
        const fname = this._expandFileArgs(args.filter(a => !a.startsWith("-")))[0];
        const flags = args.filter(a => a.startsWith("-")).join("");
        const rev  = flags.includes("r");
        const num  = flags.includes("n");
        const uniq = flags.includes("u");
        let content = stdin;
        if (fname) {
          const f = this._file(fname);
          if (f && f.denied) { out = this._permErr("sort", fname); err = true; break; }
          if (!f || !f.node) { out = sh(`sort: impossible de lire: ${fname}: Aucun fichier ou dossier de ce type`, `sort: cannot read: ${fname}: No such file or directory`); err = true; break; }
          content = f.node.content || "";
        }
        let lines = content.split("\n").filter(Boolean);
        if (uniq) lines = [...new Set(lines)];
        lines.sort(num ? (a, b) => parseFloat(a) - parseFloat(b) : (a, b) => a.localeCompare(b));
        if (rev) lines.reverse();
        out = lines.join("\n");
        break;
      }

      case "echo": {
        // Les variables/substitutions sont déjà résolues par _expandLine (quote-aware).
        let a = args.slice();
        if (a[0] === "-n" || a[0] === "-e") a = a.slice(1);
        out = a.join(" ");
        break;
      }

      case "env":
      case "printenv": {
        const base = {
          HOME: "/home/user", USER: "user", SHELL: "/bin/bash", PWD: this.cwd, LANG: sh("fr_FR.UTF-8", "en_US.UTF-8"),
          PATH: "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin", TERM: "xterm-256color",
          ...(this._envVars || {})
        };
        out = Object.entries(base).map(([k, v]) => `${k}=${v}`).join("\n");
        break;
      }

      case "export": {
        const kv = args.join(" ").match(/^(\w+)=(.*)$/);
        if (!kv) { out = sh("export: usage: export NOM=valeur", "export: usage: export NAME=value"); err = true; break; }
        this._envVars[kv[1]] = kv[2].replace(/^["']|["']$/g, "");
        this.state.export = kv[1];
        out = "";
        break;
      }

      case "ps": {
        out = [
          "USER       PID %CPU %MEM    COMMAND",
          "user         1  0.0  0.1    /sbin/init",
          "user       101  0.0  0.3    bash",
          "user      1234  2.1  1.4    nginx",
          "user      1235  0.0  0.8    python3 app.py",
          "user      9999  0.1  0.2    ps aux"
        ].join("\n");
        break;
      }

      case "kill": {
        const pid = args.filter(a => !a.startsWith("-"))[0];
        if (!pid) { out = sh("kill: manque le PID\nUsage : kill PID\nExemple : kill 1234\n\nPour forcer l'arrêt : kill -9 PID\nPour trouver les PIDs : ps aux", "kill: missing PID\nUsage: kill PID\nExample: kill 1234\n\nTo force the stop: kill -9 PID\nTo find the PIDs: ps aux"); err = true; break; }
        this.state.kill = pid;
        out = sh(`[Processus ${pid} terminé]`, `[Process ${pid} terminated]`);
        break;
      }

      case "whoami": { out = this._curUser; break; }
      case "id": {
        this._initUsers();
        const who = args.find(a => !a.startsWith("-")) || this._curUser;
        const u = this._users[who];
        if (!u) { out = `id: '${who}': ` + sh("utilisateur inexistant", "no such user"); err = true; break; }
        const gidOf = g => g === "root" ? 0 : g === "sudo" ? 27 : g === who ? u.uid : 1000;
        out = `uid=${u.uid}(${who}) gid=${gidOf(who)}(${who}) ` + sh("groupes", "groups") + `=${u.groups.map(g => `${gidOf(g)}(${g})`).join(",")}`;
        break;
      }

      case "df": {
        out = [
          "Filesystem      Size  Used Avail Use% Mounted on",
          "/dev/sda1        50G   12G   36G  25% /",
          "tmpfs           2.0G     0  2.0G   0% /dev/shm",
          "tmpfs           2.0G  1.2M  2.0G   1% /run"
        ].join("\n");
        break;
      }

      case "ln": {
        const sFlag = args.includes("-s");
        const noFlag2 = args.filter(a => !a.startsWith("-"));
        const dst2 = noFlag2[1];
        if (sFlag && dst2) {
          this.state.symlink = dst2;
          out = "";
        } else {
          out = sh("ln: arguments invalides", "ln: invalid arguments"); err = true;
        }
        break;
      }

      case "tar": {
        const fIdx = args.indexOf("-f") >= 0 ? args.indexOf("-f") + 1 : args.findIndex(a => a.endsWith(".tar.gz") || a.endsWith(".tar"));
        const fname2 = args[fIdx] || args.find(a => a.includes(".tar"));
        if (fname2) {
          this.state.tar = fname2;
          out = "";
        } else {
          out = sh("tar: manque le nom d'archive\nUsage : tar -czf ARCHIVE.tar.gz DOSSIER/\nExemple : tar -czf backup.tar.gz www/\n\nPour extraire : tar -xzf archive.tar.gz\nPour lister : tar -tzf archive.tar.gz", "tar: missing archive name\nUsage: tar -czf ARCHIVE.tar.gz FOLDER/\nExample: tar -czf backup.tar.gz www/\n\nTo extract: tar -xzf archive.tar.gz\nTo list: tar -tzf archive.tar.gz");
          err = true;
        }
        break;
      }

      case "curl": {
        const url = args.find(a => a.startsWith("http"));
        const headOnly = args.includes("-I");
        if (!url) { out = sh("curl: manque l'URL", "curl: missing URL"); err = true; break; }
        this.state.curl = url;
        if (headOnly) this.state.curlI = true;
        const um = url.match(/^https?:\/\/([^\/:]+)(?::(\d+))?/);
        const uHost = um ? um[1] : "";
        const uPort = um && um[2] ? um[2] : "80";
        // Hôtes internes simulés (zone DNS du dojo) — l'intranet a déménagé sur :8080
        if (uHost === "intranet.dojo.lan" || uHost === "10.0.0.80") {
          if (uPort !== "8080") {
            out = sh(`curl: (7) Failed to connect to ${uHost} port ${uPort} : Connexion refusée\n💡 La machine répond (le DNS et le réseau sont bons), mais RIEN n'écoute sur ce port.`, `curl: (7) Failed to connect to ${uHost} port ${uPort}: Connection refused\n💡 The machine answers (DNS and network are fine), but NOTHING listens on this port.`);
            err = true; break;
          }
          out = headOnly
            ? "HTTP/1.1 200 OK\nServer: nginx/1.24.0\nContent-Type: text/html; charset=utf-8\nContent-Length: 154"
            : sh(`HTTP/1.1 200 OK\n<!DOCTYPE html>\n<html><head><title>Intranet du dojo</title></head>\n<body><h1>Bienvenue sur l'intranet du dojo 🥋</h1>\n<p>Migré sur le port 8080 pendant la maintenance du week-end.</p></body></html>`, `HTTP/1.1 200 OK\n<!DOCTYPE html>\n<html><head><title>Dojo intranet</title></head>\n<body><h1>Welcome to the dojo intranet 🥋</h1>\n<p>Migrated to port 8080 during the weekend maintenance.</p></body></html>`);
          break;
        }
        if (/\.(lan|local)$/.test(uHost) && !this._dnsZone()[uHost]) {
          out = `curl: (6) Could not resolve host: ${uHost}`;
          err = true; break;
        }
        out = headOnly
          ? "HTTP/1.1 200 OK\nContent-Type: text/html; charset=UTF-8\nContent-Length: 1256"
          : `HTTP/1.1 200 OK\n<!DOCTYPE html>\n<html><head><title>Example Domain</title></head>\n<body><h1>Example Domain</h1></body></html>`;
        break;
      }

      case "ip": {
        const sub = args[0];
        if (sub === "a" || sub === "addr" || sub === "address") {
          out = [
            "1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 state UNKNOWN",
            "    inet 127.0.0.1/8 scope host lo",
            "2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 state UP",
            "    link/ether 52:54:00:d0:4a:07 brd ff:ff:ff:ff:ff:ff",
            "    inet 10.0.0.42/24 brd 10.0.0.255 scope global dynamic eth0",
          ].join("\n");
          this.state.ipA = true;
          break;
        }
        if (sub === "r" || sub === "route") {
          out = "default via 10.0.0.1 dev eth0 proto dhcp src 10.0.0.42 metric 100\n10.0.0.0/24 dev eth0 proto kernel scope link src 10.0.0.42";
          this.state.ipR = true;
          break;
        }
        out = sh("Usage :  ip a (adresses) · ip r (routes)", "Usage:  ip a (addresses) · ip r (routes)");
        err = true;
        break;
      }

      case "dig": {
        const name = args.find(a => !a.startsWith("-") && !a.startsWith("@"));
        if (!name) { out = sh("dig : il manque le nom à résoudre\nUsage : dig NOM", "dig: missing the name to resolve\nUsage: dig NAME"); err = true; break; }
        this.state.dig = name;
        const ipAddr = this._dnsZone()[name.replace(/\.$/, "")];
        if (!ipAddr) {
          out = `; <<>> DiG 9.18 <<>> ${name}\n;; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN, id: 4212\n;; QUESTION SECTION:\n;${name}.\t\tIN\tA\n\n;; SERVER: 10.0.0.1#53(10.0.0.1)`;
          break;
        }
        out = `; <<>> DiG 9.18 <<>> ${name}\n;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 4212\n;; ANSWER SECTION:\n${name}.\t\t3600\tIN\tA\t${ipAddr}\n\n;; Query time: 0 msec\n;; SERVER: 10.0.0.1#53(10.0.0.1)`;
        break;
      }

      case "nslookup": {
        const name = args.find(a => !a.startsWith("-"));
        if (!name) { out = sh("nslookup : il manque le nom à résoudre\nUsage : nslookup NOM", "nslookup: missing the name to resolve\nUsage: nslookup NAME"); err = true; break; }
        this.state.nslookup = name;
        const ipAddr = this._dnsZone()[name];
        if (!ipAddr) { out = `Server:\t\t10.0.0.1\nAddress:\t10.0.0.1#53\n\n** server can't find ${name}: NXDOMAIN`; err = true; break; }
        out = `Server:\t\t10.0.0.1\nAddress:\t10.0.0.1#53\n\nName:\t${name}\nAddress: ${ipAddr}`;
        break;
      }

      case "sed": {
        const expr = args.find(a => a.startsWith("s/"));
        const fname3 = args.filter(a => !a.startsWith("-") && !a.startsWith("s/")).pop();
        let content2 = stdin;
        if (fname3) {
          const f3 = this._file(fname3);
          if (f3 && f3.denied) { out = this._permErr("sed", fname3); err = true; break; }
          if (f3 && f3.node) content2 = f3.node.content || "";
        }
        if (expr) {
          const m = expr.match(/^s\/([^\/]+)\/([^\/]*)\/([g]?)$/);
          if (m) {
            const [, from, to, flag] = m;
            if (flag === "g") {
              out = content2.split("\n").map(l => l.split(from).join(to)).join("\n");
            } else {
              out = content2.split("\n").map(l => l.replace(from, to)).join("\n");
            }
          } else {
            out = sh("sed: expression invalide", "sed: invalid expression"); err = true;
          }
        } else {
          out = content2;
        }
        break;
      }

      case "awk": {
        // -F peut être séparé ("-F" ",") ou collé ("-F,")
        let fSep = " ";
        const fIdx = args.indexOf("-F");
        if (fIdx >= 0 && args[fIdx+1]) fSep = args[fIdx+1];
        else {
          const collapsed = args.find(a => a.startsWith("-F") && a.length > 2);
          if (collapsed) fSep = collapsed.slice(2);
        }
        const prog = args.find(a => a.includes("{print"));
        const fname4 = args.filter(a => !a.startsWith("-F") && a !== "-F" && !a.startsWith("{") && a !== fSep).pop();
        let content3 = stdin;
        if (fname4) {
          const f4 = this._file(fname4);
          if (f4 && f4.denied) { out = this._permErr("awk", fname4); err = true; break; }
          if (f4 && f4.node) content3 = f4.node.content || "";
        }
        if (prog) {
          const colM = prog.match(/\$(\d+)/);
          const col = colM ? parseInt(colM[1]) - 1 : 0;
          out = content3.split("\n").filter(Boolean).map(l => (l.split(fSep)[col] || "")).join("\n");
        } else {
          out = content3;
        }
        break;
      }

      case "base64": {
        const dec = args.includes("-d") || args.includes("--decode");
        const fname = args.filter(a => !a.startsWith("-"))[0];
        let src = stdin;
        if (fname) {
          const f = this._file(fname);
          if (f && f.denied) { out = this._permErr("base64", fname); err = true; break; }
          if (!f || !f.node) { out = sh(`base64: ${fname}: Fichier introuvable`, `base64: ${fname}: File not found`); err = true; break; }
          src = f.node.content || "";
        }
        src = (src || "").trim();
        try {
          if (dec) out = this._b64decode(src);
          else out = this._b64encode(src);
        } catch(e) { out = sh("base64: entrée invalide", "base64: invalid input"); err = true; }
        break;
      }

      case "rot13": {
        const fname = args.filter(a => !a.startsWith("-"))[0];
        let src = stdin;
        if (fname) {
          const f = this._file(fname);
          if (f && f.denied) { out = this._permErr("rot13", fname); err = true; break; }
          if (f && f.node) src = f.node.content || "";
        }
        out = (src || "").replace(/[a-zA-Z]/g, c => {
          const base = c <= "Z" ? 65 : 97;
          return String.fromCharCode((c.charCodeAt(0) - base + 13) % 26 + base);
        });
        break;
      }

      case "xxd": {
        const rev = args.includes("-r");
        const plain = args.includes("-p");
        const fname = args.filter(a => !a.startsWith("-"))[0];
        let src = stdin;
        if (fname) {
          const f = this._file(fname);
          if (f && f.denied) { out = this._permErr("xxd", fname); err = true; break; }
          if (f && f.node) src = f.node.content || "";
        }
        src = src || "";
        if (rev && plain) {
          // hex → texte
          const hex = src.replace(/\s+/g, "");
          try {
            out = (hex.match(/.{1,2}/g) || []).map(h => String.fromCharCode(parseInt(h, 16))).join("");
          } catch(e) { out = sh("xxd: hex invalide", "xxd: invalid hex"); err = true; }
        } else if (plain) {
          // texte → hex compact
          out = src.split("").map(c => c.charCodeAt(0).toString(16).padStart(2, "0")).join("");
        } else {
          // dump simple
          out = src.split("").map(c => c.charCodeAt(0).toString(16).padStart(2, "0")).join(" ");
        }
        break;
      }

      case "head":
      case "tail": {
        let n = 10;
        const nIdx = args.indexOf("-n");
        if (nIdx >= 0 && args[nIdx+1]) n = parseInt(args[nIdx+1]) || 10;
        else {
          const dash = args.find(a => /^-\d+$/.test(a));
          if (dash) n = parseInt(dash.slice(1));
        }
        const realNames = this._expandFileArgs(args.filter((a, i) => !a.startsWith("-") && !(args[i-1] === "-n" && /^\d+$/.test(a))));
        const fname = realNames[0];
        let content = stdin;
        if (fname) {
          const f = this._file(fname);
          if (f && f.denied) { out = this._permErr(cmd, fname); err = true; break; }
          if (!f || !f.node) { out = sh(`${cmd}: ${fname}: Aucun fichier ou dossier de ce type`, `${cmd}: ${fname}: No such file or directory`); err = true; break; }
          content = f.node.content || "";
        }
        const lines = content.split("\n");
        out = (cmd === "head" ? lines.slice(0, n) : lines.slice(-n)).join("\n");
        break;
      }

      case "uniq": {
        const cFlag = args.includes("-c");
        const fname = this._expandFileArgs(args.filter(a => !a.startsWith("-")))[0];
        let content = stdin;
        if (fname) {
          const f = this._file(fname);
          if (f && f.denied) { out = this._permErr("uniq", fname); err = true; break; }
          if (!f || !f.node) { out = sh(`uniq: ${fname}: Aucun fichier ou dossier de ce type`, `uniq: ${fname}: No such file or directory`); err = true; break; }
          content = f.node.content || "";
        }
        const lines = content.split("\n");
        const res = [];
        let prev = null, cnt = 0;
        const flush = () => { if (prev !== null) res.push(cFlag ? `${String(cnt).padStart(7)} ${prev}` : prev); };
        lines.forEach(l => {
          if (l === prev) cnt++;
          else { flush(); prev = l; cnt = 1; }
        });
        flush();
        out = res.join("\n");
        break;
      }

      case "cut": {
        // cut -d',' -f1  ou  -d, -f 1  ou  -f1,3
        let sep = "\t", fields = null;
        args.forEach((a, i) => {
          if (a.startsWith("-d")) sep = a.length > 2 ? a.slice(2).replace(/^["']|["']$/g, "") : (args[i+1] || "\t");
          if (a.startsWith("-f")) fields = a.length > 2 ? a.slice(2) : (args[i+1] || "");
        });
        if (!fields) { out = sh("cut: il faut préciser les champs\nUsage : cut -d',' -f1 fichier.csv\n  -d  séparateur (ex: -d',')\n  -f  numéro(s) de colonne (ex: -f1 ou -f1,3)", "cut: you must specify the fields\nUsage: cut -d',' -f1 file.csv\n  -d  separator (e.g. -d',')\n  -f  column number(s) (e.g. -f1 or -f1,3)"); err = true; break; }
        const wanted = fields.split(",").map(x => parseInt(x)).filter(x => !isNaN(x));
        const fname = this._expandFileArgs(args.filter((a, i) => !a.startsWith("-") && args[i-1] !== "-d" && args[i-1] !== "-f"))[0];
        let content = stdin;
        if (fname) {
          const f = this._file(fname);
          if (f && f.denied) { out = this._permErr("cut", fname); err = true; break; }
          if (!f || !f.node) { out = sh(`cut: ${fname}: Aucun fichier ou dossier de ce type`, `cut: ${fname}: No such file or directory`); err = true; break; }
          content = f.node.content || "";
        }
        out = content.split("\n").map(l => {
          const cols = l.split(sep);
          return wanted.map(w => cols[w-1] ?? "").join(sep);
        }).join("\n");
        break;
      }

      case "tr": {
        // tr 'a-z' 'A-Z'  ·  tr -d 'x'
        const del = args.includes("-d");
        const sets = args.filter(a => !a.startsWith("-"));
        const expand = (s) => {
          let res = "";
          for (let i = 0; i < s.length; i++) {
            if (s[i+1] === "-" && s[i+2]) {
              const a = s.charCodeAt(i), b = s.charCodeAt(i+2);
              for (let c = a; c <= b; c++) res += String.fromCharCode(c);
              i += 2;
            } else res += s[i];
          }
          return res;
        };
        const from = expand(sets[0] || "");
        if (!from) { out = sh("tr: usage: tr 'a-z' 'A-Z'  (ou tr -d 'x' pour supprimer)", "tr: usage: tr 'a-z' 'A-Z'  (or tr -d 'x' to delete)"); err = true; break; }
        let src = stdin || "";
        if (del) {
          out = src.split("").filter(c => !from.includes(c)).join("");
        } else {
          const to = expand(sets[1] || "");
          if (!to) { out = sh("tr: il manque le second ensemble\nExemple : tr 'a-z' 'A-Z'", "tr: the second set is missing\nExample: tr 'a-z' 'A-Z'"); err = true; break; }
          out = src.split("").map(c => {
            const i = from.indexOf(c);
            return i >= 0 ? (to[Math.min(i, to.length-1)]) : c;
          }).join("");
        }
        break;
      }

      case "tree": {
        const startArg = args.find(a => !a.startsWith("-"));
        const startAbs = startArg ? this._resolve(startArg) : this.cwd;
        if (!this._isDir(startAbs)) { out = sh(`tree: ${startArg}: N'est pas un dossier`, `tree: ${startArg}: Not a directory`); err = true; break; }
        let nd = 0, nf = 0;
        const res = [startArg || "."];
        const walk = (dir, indent) => {
          const kids = this._children(dir);
          kids.forEach((name, i) => {
            const full = dir === "/" ? "/" + name : dir + "/" + name;
            const isLast = i === kids.length - 1;
            const isDir = this._isDir(full);
            const deniedHere = this.fs[full] && this.fs[full].denied;
            res.push(indent + (isLast ? "└── " : "├── ") + name + (isDir ? "/" : "") + (deniedHere ? " 🔒" : ""));
            if (isDir) nd++; else nf++;
            if (isDir && !deniedHere) walk(full, indent + (isLast ? "    " : "│   "));
          });
        };
        walk(startAbs, "");
        res.push("");
        res.push(sh(`${nd} répertoire${nd>1?"s":""}, ${nf} fichier${nf>1?"s":""}`, `${nd} director${nd>1?"ies":"y"}, ${nf} file${nf>1?"s":""}`));
        out = res.join("\n");
        break;
      }

      case "du": {
        const files = Object.keys(this.fs).filter(k =>
          (k === this.cwd || k.startsWith(this.cwd === "/" ? "/" : this.cwd + "/")) && !this._isDir(k) && !this._denied(k));
        out = files.map(k => {
          const size = (this.fs[k].content || "").length;
          const h = args.includes("-h") ? (size > 1024 ? (size/1024).toFixed(1)+"K" : size+"B") : Math.max(1, Math.ceil(size/512));
          const rel = "." + k.slice(this.cwd === "/" ? 0 : this.cwd.length);
          return `${h}\t${rel}`;
        }).join("\n") || "0\t.";
        break;
      }

      case "date": {
        out = new Date().toLocaleString(dateLocale(), { weekday:"long", day:"numeric", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit", second:"2-digit" });
        break;
      }

      case "uname": {
        out = args.includes("-a")
          ? "Linux dojo 6.8.0-dojo #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux"
          : "Linux";
        break;
      }

      case "hostname": { out = "dojo"; break; }

      case "uptime": {
        const mins = Math.floor(performance.now() / 60000);
        out = ` ${new Date().toLocaleTimeString(dateLocale())} up ${mins} min,  1 user,  load average: 0.42, 0.13, 0.07`;
        break;
      }

      case "free": {
        out = sh([
          "               total       utilisé      libre",
          "Mem:        16384 Mo      4242 Mo    12142 Mo",
          "Swap:        2048 Mo         0 Mo     2048 Mo"
        ].join("\n"), [
          "               total        used        free",
          "Mem:        16384 MB      4242 MB    12142 MB",
          "Swap:        2048 MB         0 MB     2048 MB"
        ].join("\n"));
        break;
      }

      case "history": {
        out = this.cmdLog.map((c, i) => `  ${String(i+1).padStart(3)}  ${c}`).join("\n") || sh("(historique vide)", "(history empty)");
        break;
      }

      case "man": {
        const topic = args[0];
        if (!topic) { out = sh("Quelle page de manuel voulez-vous ?\nUsage : man COMMANDE   (ex: man grep)", "What manual page do you want?\nUsage: man COMMAND   (e.g. man grep)"); err = true; break; }
        if (typeof GLOSSARY === "undefined") { out = sh(`man: pas de manuel pour ${topic}`, `man: no manual entry for ${topic}`); err = true; break; }
        const entry = GLOSSARY.find(g => g.cmd === topic || g.cmd.split(" ")[0] === topic || g.cmd.split(" / ").includes(topic));
        if (!entry) { out = sh(`man: aucune entrée de manuel pour ${topic}\n💡 Consulte l'onglet Glossaire pour la liste complète.`, `man: no manual entry for ${topic}\n💡 Check the Glossary tab for the full list.`); err = true; break; }
        this.state.man = topic;
        const L = [];
        L.push(`${topic.toUpperCase()}(1)                    ${sh("Manuel LinuxDojo", "LinuxDojo Manual")}                    ${topic.toUpperCase()}(1)`);
        L.push("");
        L.push(sh("NOM", "NAME"));
        L.push(`       ${entry.cmd} — ${entry.desc}`);
        L.push("");
        L.push("SYNOPSIS");
        L.push(`       ${entry.syntax}`);
        if (entry.options && entry.options.length) {
          L.push("");
          L.push("OPTIONS");
          entry.options.forEach(o => L.push(`       ${o[0].padEnd(14)} ${o[1]}`));
        }
        if (entry.examples && entry.examples.length) {
          L.push("");
          L.push(sh("EXEMPLES", "EXAMPLES"));
          entry.examples.forEach(e => L.push(`       $ ${e[0].padEnd(28)} # ${e[1]}`));
        }
        out = L.join("\n");
        break;
      }

      case "whatis": {
        const topic = args[0];
        if (!topic || typeof GLOSSARY === "undefined") { out = sh(`whatis: usage: whatis COMMANDE`, `whatis: usage: whatis COMMAND`); err = true; break; }
        const entry = GLOSSARY.find(g => g.cmd === topic || g.cmd.split(" ")[0] === topic);
        out = entry ? `${topic} (1) — ${entry.desc}` : sh(`${topic} : rien d'approprié.`, `${topic}: nothing appropriate.`);
        if (!entry) err = true;
        break;
      }

      case "ping": {
        const host = args.find(a => !a.startsWith("-")) || "localhost";
        this.state.ping = host;
        out = sh([
          `PING ${host} (127.0.0.1) 56(84) octets de données.`,
          `64 octets de ${host}: icmp_seq=1 ttl=64 temps=0.042 ms`,
          `64 octets de ${host}: icmp_seq=2 ttl=64 temps=0.038 ms`,
          `64 octets de ${host}: icmp_seq=3 ttl=64 temps=0.040 ms`,
          "",
          `--- statistiques ping ${host} ---`,
          "3 paquets transmis, 3 reçus, 0% perte de paquets"
        ].join("\n"), [
          `PING ${host} (127.0.0.1) 56(84) bytes of data.`,
          `64 bytes from ${host}: icmp_seq=1 ttl=64 time=0.042 ms`,
          `64 bytes from ${host}: icmp_seq=2 ttl=64 time=0.038 ms`,
          `64 bytes from ${host}: icmp_seq=3 ttl=64 time=0.040 ms`,
          "",
          `--- ${host} ping statistics ---`,
          "3 packets transmitted, 3 received, 0% packet loss"
        ].join("\n"));
        break;
      }

      case "ssh": {
        const target = args.find(a => !a.startsWith("-"));
        if (!target) { out = sh("usage: ssh utilisateur@hôte", "usage: ssh user@host"); err = true; break; }
        const m = target.match(/^([\w.-]+)@([\w.-]+)$/);
        if (!m) { out = sh(`ssh: format invalide, attendu utilisateur@hôte (reçu '${target}')`, `ssh: invalid format, expected user@host (got '${target}')`); err = true; break; }
        const [, sshUser, sshHost] = m;
        this._sshStack.push(this.ps1User);
        this.ps1User = `${sshUser}@${sshHost}`;
        this.state.sshHost = sshHost;
        this.state.sshUser = sshUser;
        out = sh(`Bienvenue sur ${sshHost} !\nDernière connexion : aujourd'hui depuis 10.0.0.1\nConnecté — tape 'exit' pour te déconnecter.`, `Welcome to ${sshHost}!\nLast login: today from 10.0.0.1\nConnected — type 'exit' to disconnect.`);
        break;
      }

      case "scp": {
        const src = args.find(a => !a.includes("@") && !a.startsWith("-"));
        const dest = args.find(a => a.includes("@"));
        if (!src || !dest) { out = sh("usage: scp fichier utilisateur@hôte:/chemin", "usage: scp file user@host:/path"); err = true; break; }
        if (!this._exists(this._resolve(src))) { out = sh(`scp: ${src}: Aucun fichier ou dossier de ce type`, `scp: ${src}: No such file or directory`); err = true; break; }
        const dm = dest.match(/^([\w.-]+)@([\w.-]+):(.*)$/);
        if (!dm) { out = sh(`scp: destination invalide, attendu utilisateur@hôte:/chemin (reçu '${dest}')`, `scp: invalid destination, expected user@host:/path (got '${dest}')`); err = true; break; }
        this.state.scp = { file: src, host: dm[2], path: dm[3] || "~" };
        out = `${src}                                    100%   1KB   1.0MB/s   00:00`;
        break;
      }

      case "netstat":
      case "ss": {
        this.state.netstat = true;
        out = [
          sh("Proto  Local Address       État        Programme", "Proto  Local Address       State       Program"),
          "tcp    0.0.0.0:22          LISTEN      sshd",
          "tcp    0.0.0.0:80          LISTEN      nginx",
          "tcp    127.0.0.1:3306      LISTEN      mysqld",
          "tcp    0.0.0.0:443         LISTEN      nginx",
        ].join("\n");
        break;
      }

      /* ── Easter eggs & culture Linux ─────────────────────── */
      case "cowsay": {
        const msg = (stdin || args.join(" ") || sh("Meuh ?", "Moo?")).trim();
        const line = "─".repeat(Math.min(msg.length + 2, 42));
        out = [
          ` ┌${line}┐`,
          ` │ ${msg} │`,
          ` └${line}┘`,
          "        \\   ^__^",
          "         \\  (oo)\\_______",
          "            (__)\\       )\\/\\",
          "                ||----w |",
          "                ||     ||"
        ].join("\n");
        break;
      }

      case "fortune": {
        const F = LANG === "en" ? [
          "\"Everything is a file.\" — UNIX philosophy",
          "\"Speak little, pipe a lot.\" — Shell wisdom",
          "There is no cloud, just someone else's computer.",
          "chmod 777 is rarely the answer. Almost never. No.",
          "A good admin is a lazy admin: they automate everything.",
          "\"rm -rf\" doesn't forgive. Think before Enter.",
          "The most dangerous command: the one you copy-paste without reading.",
          "Debugging is being a detective in a crime where you're also the culprit.",
          "Ctrl+C, Ctrl+V: the two pillars of modern software engineering.",
          "If it doesn't work: man. If it works: commit."
        ] : [
          "« Tout est fichier. » — Philosophie UNIX",
          "« Parle peu, pipe beaucoup. » — Sagesse du shell",
          "Il n'y a pas de nuage, juste l'ordinateur de quelqu'un d'autre.",
          "chmod 777 est rarement la réponse. Presque jamais. Non.",
          "Un bon admin est un admin paresseux : il automatise tout.",
          "« rm -rf » ne pardonne pas. Réfléchis avant Entrée.",
          "La commande la plus dangereuse : celle qu'on copie-colle sans lire.",
          "Debugger, c'est être détective dans un crime dont tu es aussi le coupable.",
          "Ctrl+C, Ctrl+V : les deux piliers du génie logiciel moderne.",
          "Si ça marche pas : man. Si ça marche : commit."
        ];
        out = F[Math.floor(Math.random() * F.length)];
        break;
      }

      case "sl": {
        out = [
          sh("🚂 Tchou tchou ! Tu as encore tapé 'sl' au lieu de 'ls'...", "🚂 Choo choo! You typed 'sl' instead of 'ls' again..."),
          "",
          "      ====        ________                ___________",
          "  _D _|  |_______/        \\__I_I_____===__|_________|",
          "   |(_)---  |   H\\________/ |   |        =|___ ___|  ",
          "   /     |  |   H  |  |     |   |         ||_| |_||  ",
          "  |      |  |   H  |__--------------------| [___] |  ",
          "  | ________|___H__/__|_____/[][]~\\_______|       |  ",
          "  |/ |   |-----------I_____I [][] []  D   |=======|__",
          "",
          sh("(le vrai 'sl' sous Linux affiche une locomotive qui traverse ton terminal)", "(the real 'sl' on Linux shows a locomotive crossing your terminal)")
        ].join("\n");
        break;
      }

      case "boo": {
        if (typeof getActiveSeasonalEvent === "function" && getActiveSeasonalEvent() && getActiveSeasonalEvent().id === "halloween") {
          out = [
            "         .-\"\"\"-.",
            "        / .===. \\",
            "        \\/ 6 6 \\/       👻 BOOOOO !",
            "        ( \\___/ )",
            "     ___ooo_ooo___",
            "",
            sh("Tu as réveillé le fantôme du dojo. Un cadeau spectral t'attend...", "You woke the dojo's ghost. A spectral gift awaits you..."),
          ].join("\n");
          if (typeof markSeasonalSecret === "function") markSeasonalSecret("halloween");
        } else {
          out = sh("🎃 ...rien ne se passe. (Cette commande semble liée à une certaine fête d'automne — reviens fin octobre.)", "🎃 ...nothing happens. (This command seems tied to a certain autumn holiday — come back in late October.)");
        }
        break;
      }

      case "noel":
      case "joyeuxnoel": {
        if (typeof getActiveSeasonalEvent === "function" && getActiveSeasonalEvent() && getActiveSeasonalEvent().id === "noel") {
          out = [
            "            🌟",
            "           /★\\",
            "          /★★★\\",
            "         /★★★★★\\",
            "        /★★★★★★★\\",
            "       /★★★★★★★★★\\",
            "            ‖‖",
            "",
            sh("🎄 Joyeux Noël, ninja du terminal ! Un cadeau t'attend...", "🎄 Merry Christmas, terminal ninja! A gift awaits you..."),
          ].join("\n");
          if (typeof markSeasonalSecret === "function") markSeasonalSecret("noel");
        } else {
          out = sh("🎄 ...rien ne se passe. (Cette commande semble liée à une certaine fête de fin d'année — reviens en décembre.)", "🎄 ...nothing happens. (This command seems tied to a certain end-of-year holiday — come back in December.)");
        }
        break;
      }

      case "vim":
      case "vi": {
        out = sh("Tu es entré dans Vim.\n\n⚠️  Statistiquement, tu vas y rester coincé 2 heures.\nPour sortir : Échap puis :q!  (ici, tape juste :q!)", "You entered Vim.\n\n⚠️  Statistically, you'll be stuck here for 2 hours.\nTo exit: Esc then :q!  (here, just type :q!)");
        this.state.vim = true;
        break;
      }
      case ":q!":
      case ":wq": {
        out = this.state.vim ? sh("Ouf. Tu es sorti de Vim. Peu y parviennent du premier coup. 🏆", "Phew. You escaped Vim. Few manage it on the first try. 🏆") : sh("E492: Commande inconnue (tu n'es même pas dans Vim)", "E492: Not an editor command (you're not even in Vim)");
        this.state.vim = false;
        break;
      }
      case "nano": {
        const target = args.filter(a => !a.startsWith("-"))[0];
        if (!target) { out = sh("usage : nano FICHIER", "usage: nano FILE"); err = true; break; }
        if (silent) { out = ""; break; } // pas d'édition interactive en contexte silencieux (pipe/condition)
        const res = this._nanoOpen(target);
        out = res.out; err = res.err;
        break;
      }
      case "emacs": { out = sh("Emacs : un excellent système d'exploitation.\nIl ne lui manque qu'un bon éditeur de texte. 😈", "Emacs: a great operating system.\nIt just lacks a good text editor. 😈"); break; }

      case "exit":
      case "logout": {
        if (this._suStack.length) {
          const prev = this._suStack.pop();
          const left = this._curUser;
          this._curUser = prev.user;
          this.ps1User = prev.ps1;
          this.state.suExit = left;
          out = sh(`déconnexion — retour à ${prev.user}`, `logout — back to ${prev.user}`);
          break;
        }
        if (this._sshStack.length) {
          const prevUser = this._sshStack.pop();
          const leftHost = this.state.sshHost;
          this.ps1User = prevUser;
          this.state.sshExit = leftHost;
          out = sh(`Connexion à ${leftHost} fermée.`, `Connection to ${leftHost} closed.`);
          break;
        }
        out = sh("On ne quitte pas le dojo aussi facilement. 🥋\n(Ferme l'onglet si tu veux vraiment partir... lâcheur.)", "You don't leave the dojo that easily. 🥋\n(Close the tab if you really want to go... quitter.)");
        break;
      }

      case "clear":
        this.clear();
        return { output: "", error: false };

      case "help":
        out = sh([
          "═══ COMMANDES DU DOJO ═══",
          "Navigation   : ls [-la], cd, pwd, tree, find",
          "Fichiers     : cat, less, head, tail, touch, mkdir, cp, mv, rm, ln -s, chmod, nano (éditeur)",
          "Texte        : grep [-invc], sort, uniq [-c], wc [-lwc], cut -d -f, tr, sed, awk",
          "Système      : ps aux, kill, whoami, id, df -h, du, free, uptime, uname -a, date",
          "Propriété    : chown user:groupe fichier, chgrp groupe fichier",
          "Environnement: echo $VAR, env, export VAR=x, history, hostname, alias nom='cmd', unalias",
          "Réseau       : curl [-I], ping, ip a, ip r, dig NOM, nslookup NOM, ssh utilisateur@hôte, scp fichier user@hôte:/chemin, netstat",
          "Décodage     : base64 [-d], rot13, xxd -r -p",
          "Comparaison  : diff fichier1 fichier2",
          "Enchaînement : cmd | xargs [-n N] autre_cmd",
          "Tâches de fond: cmd &, jobs, fg [%N]",
          "Aide         : man CMD, whatis CMD, help",
          "",
          "Pipes & redirections :  cmd1 | cmd2   ·   cmd > fichier   ·   cmd >> fichier (ajout)",
          "Jokers :  cat *.txt  ·  rm *.log  ·  ls logs/*.log",
          "Chemins RÉELS : cd logs/2024 · cd .. · cd / · cd ~ · cat /etc/hostname · find /var -name '*.log'",
          "Scripting :  x=5 · echo $x · $(cmd) · for f in *.txt; do ... done · if [ ... ]; then ... fi · bash script.sh",
          "Git :  git init · git add . · git commit -m \"msg\" · git log · git branch · git checkout -b nom",
          "Docker :  docker build -t nom . · docker images · docker run -d --name nom image · docker ps [-a] · docker logs nom · docker stop nom",
          "Services :  systemctl status|start|stop|restart|enable NOM · systemctl list-units --type=service · journalctl -u NOM [-n N]",
          "Utilisateurs :  useradd -m NOM · passwd NOM · usermod -aG GROUPE NOM · groups NOM · id NOM · su NOM (exit pour revenir) · sudo CMD (si groupe sudo)",
          "Planification :  crontab FICHIER (installe) · crontab -l (affiche) · crontab -r (supprime tout)",
          "Astuces : Tab autocomplète (même les chemins) · ↑/↓ historique · Ctrl+R recherche dans l'historique · man grep pour le manuel",
          "Touche ? (hors saisie) : ouvre l'écran des raccourcis clavier",
          "",
          "🥚 Il paraît que le dojo cache des secrets... (cowsay ? sl ? fortune ? vim ?)",
          "🎃 ...et parfois, à certaines périodes de l'année, il en cache encore d'autres."
        ].join("\n"), [
          "═══ DOJO COMMANDS ═══",
          "Navigation   : ls [-la], cd, pwd, tree, find",
          "Files        : cat, less, head, tail, touch, mkdir, cp, mv, rm, ln -s, chmod, nano (editor)",
          "Text         : grep [-invc], sort, uniq [-c], wc [-lwc], cut -d -f, tr, sed, awk",
          "System       : ps aux, kill, whoami, id, df -h, du, free, uptime, uname -a, date",
          "Ownership    : chown user:group file, chgrp group file",
          "Environment  : echo $VAR, env, export VAR=x, history, hostname, alias name='cmd', unalias",
          "Network      : curl [-I], ping, ip a, ip r, dig NAME, nslookup NAME, ssh user@host, scp file user@host:/path, netstat",
          "Decoding     : base64 [-d], rot13, xxd -r -p",
          "Comparison   : diff file1 file2",
          "Chaining     : cmd | xargs [-n N] other_cmd",
          "Background   : cmd &, jobs, fg [%N]",
          "Help         : man CMD, whatis CMD, help",
          "",
          "Pipes & redirections:  cmd1 | cmd2   ·   cmd > file   ·   cmd >> file (append)",
          "Wildcards:  cat *.txt  ·  rm *.log  ·  ls logs/*.log",
          "REAL paths: cd logs/2024 · cd .. · cd / · cd ~ · cat /etc/hostname · find /var -name '*.log'",
          "Scripting:  x=5 · echo $x · $(cmd) · for f in *.txt; do ... done · if [ ... ]; then ... fi · bash script.sh",
          "Git:  git init · git add . · git commit -m \"msg\" · git log · git branch · git checkout -b name",
          "Docker:  docker build -t name . · docker images · docker run -d --name name image · docker ps [-a] · docker logs name · docker stop name",
          "Services:  systemctl status|start|stop|restart|enable NAME · systemctl list-units --type=service · journalctl -u NAME [-n N]",
          "Users:  useradd -m NAME · passwd NAME · usermod -aG GROUP NAME · groups NAME · id NAME · su NAME (exit to come back) · sudo CMD (if in sudo group)",
          "Scheduling:  crontab FILE (install) · crontab -l (show) · crontab -r (remove all)",
          "Tips: Tab autocompletes (even paths) · ↑/↓ history · Ctrl+R search in history · man grep for the manual",
          "Key ? (outside input): opens the keyboard shortcuts screen",
          "",
          "🥚 They say the dojo hides secrets... (cowsay? sl? fortune? vim?)",
          "🎃 ...and sometimes, at certain times of year, it hides even more."
        ].join("\n"));
        break;

      default:
        // Erreurs pédagogiques — suggestions selon la proximité
        out = this._cmdNotFound(cmd, args);
        err = true;
    }

    if (!silent) {
      if (err) {
        if (out) this.printErr(out);   // pas de ligne rouge vide (ex: test/[ échoué)
      } else if (out !== null && out !== "") {
        out.split("\n").forEach(l => this.printOut(l));
      }
    }

    return { output: out, error: err };
  }
}

if (typeof module !== "undefined") module.exports = { Terminal, SYSTEM_FS };
