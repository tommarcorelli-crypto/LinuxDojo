// terminal.js — Simulateur de terminal Linux

/* Squelette système en lecture seule (fusionné dans le bac à sable) */
const SYSTEM_FS = {
  "/etc":            { type:"dir" },
  "/etc/hostname":   { type:"file", content:"dojo" },
  "/etc/os-release": { type:"file", content:'NAME="DojoLinux"\nVERSION="4.0 (Kata)"\nID=dojolinux\nPRETTY_NAME="DojoLinux 4.0"' },
  "/etc/passwd":     { type:"file", content:"root:x:0:0:root:/root:/bin/bash\nuser:x:1000:1000:Apprenti:/home/user:/bin/bash\nsensei:x:1001:1001:Le Sensei:/home/sensei:/bin/zsh" },
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
    this._sshStack = []; // pile des prompts précédents avant chaque 'ssh' (pour 'exit')
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
    this._sshStack = [];
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
  // Résout un argument fichier → { path, node } ou null
  _file(arg) {
    const p = this._resolve(arg);
    if (this._denied(p)) return { path: p, node: null, denied: true };
    const node = this.fs[p];
    return node ? { path: p, node } : null;
  }
  // Affichage du cwd : /home/user/logs → ~/logs
  _display(p) {
    if (p === this.root) return "~";
    if (p.startsWith(this.root + "/")) return "~" + p.slice(this.root.length);
    return p;
  }
  promptStr() {
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
      "sl": "ls (tu as inversé les lettres — essaie : ls)",
      "ks": "ls",
      "cd..": "cd .. (il faut un espace : cd ..)",
      "cd/": "cd / (il faut un espace : cd /)",
      "lsa": "ls -a (il faut un tiret : ls -a)",
      "lsl": "ls -l (il faut un tiret : ls -l)",
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
      return `${cmd}: commande introuvable\n💡 Voulais-tu dire : ${typos[cmd]} ?`;
    }

    // Commandes connues proches
    const known = ["ls","cd","cat","less","more","pwd","mkdir","touch","cp","mv","rm","chmod","chown","chgrp","grep","find","wc","sort","echo","ps","kill","whoami","id","df","ln","tar","curl","sed","awk","clear","help","head","tail","uniq","cut","tr","tree","du","date","uname","hostname","uptime","free","history","man","whatis","env","ping","alias","unalias","xargs","diff","jobs","fg","git","ssh","scp","netstat"];
    const close = known.find(k => this._levenshtein(cmd, k) <= 2);
    if (close) {
      return `${cmd}: commande introuvable\n💡 Voulais-tu dire : ${close} ?`;
    }

    // Option invalide détectée (ex: ls -x)
    if (args.length && args[0].startsWith("-")) {
      const cmdHelp = {
        "ls":    "Options valides pour ls : -l (détails), -a (cachés), -la (les deux), -h (tailles lisibles)",
        "grep":  "Options valides pour grep : -i (casse), -n (numéros), -r (récursif), -v (inverser), -c (compter)",
        "find":  "Options valides pour find : -name 'motif', -type f, -type d, -mtime N, -size +NM",
        "tar":   "Options valides pour tar : -czf (créer), -xzf (extraire), -tzf (lister)",
        "chmod": "Exemples chmod : chmod +x script.sh | chmod 755 script.sh | chmod 600 secret.key",
      };
      if (cmdHelp[cmd]) return `${cmd}: option invalide '${args[0]}'\n💡 ${cmdHelp[cmd]}`;
    }

    return `${cmd}: commande introuvable\nTape 'help' pour voir les commandes disponibles.`;
  }

  // ── Autocomplétion Tab ─────────────────────────────────────
  // Appelle cette méthode depuis le keydown de l'input
  autocomplete(inputEl) {
    const val   = inputEl.value;
    const parts = val.trimStart().split(" ");
    const last  = parts[parts.length - 1];

    // Complétion de commande (premier mot)
    if (parts.length === 1) {
      const cmds = ["ls","cd","cat","less","more","pwd","mkdir","touch","cp","mv","rm","chmod","chown","chgrp","grep","find","wc","sort","echo","ps","kill","whoami","id","df","ln","tar","curl","sed","awk","clear","help","head","tail","uniq","cut","tr","tree","du","date","uname","hostname","uptime","free","history","man","whatis","env","export","ping","base64","rot13","xxd","for","while","if","test","seq","bash","true","false","alias","unalias","xargs","diff","jobs","fg","git","ssh","scp","netstat"];
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
    if (!raw.trim() && !this._blockLines.length) return { output: "", error: false };
    this.printPrompt(raw);
    if (raw.trim()) this.cmdLog.push(raw.trim());

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

    // Exécution en arrière-plan : cmd & (mais pas cmd &&, non géré ici)
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
    catch (e) { this.printErr("bash: erreur de syntaxe : " + e.message); return { output: "", error: true }; }
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
        if (!m) throw new Error("for : syntaxe attendue « for x in … »");
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
        const fr = stack[stack.length - 1]; if (!fr || !fr.node.branches) throw new Error("elif sans if");
        const br = { cond: s.slice(4).trim(), body: [] }; fr.node.branches.push(br); fr.body = br.body;
      } else if (w === "else") {
        const fr = stack[stack.length - 1]; if (!fr || !fr.node.branches) throw new Error("else sans if");
        fr.node.elseBody = []; fr.body = fr.node.elseBody; pushCmd(fr.body, s.slice(4).trim());
      } else if (s === "done" || s === "fi") {
        if (!stack.length) throw new Error("« " + s + " » sans bloc ouvert"); stack.pop();
      } else { pushCmd(body(), s); }
    }
    if (stack.length) throw new Error("bloc non fermé (il manque done/fi)");
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

    // Exécution d'un script par chemin : ./script.sh, /home/user/x.sh, dossier/x.sh
    if (cmd.includes("/")) {
      const p = this._resolve(cmd);
      if (this._exists(p) && !this._isDir(p)) {
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
        if (!file) { out = `${cmd}: indique un script à exécuter\nExemple : bash deploy.sh`; err = true; break; }
        const f = this._file(file);
        if (!f || !f.node) { out = `${cmd}: ${file}: fichier introuvable`; err = true; break; }
        if (f.node.type === "dir") { out = `${cmd}: ${file}: est un dossier`; err = true; break; }
        if (silent) return { output: "", error: false };
        return this._execScript(f.node.content || "");
      }

      case "test":
      case "[": {
        let a = args.slice();
        if (cmd === "[") { if (a[a.length - 1] === "]") a.pop(); else return { output: "[: manque le « ] » final", error: true }; }
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
          if (!g) { out = `ls: ${target}: Aucun fichier ou dossier de ce type`; err = true; break; }
          files = g;
          nodeFor = n => this.fs[this._resolve(n)];
        } else if (target) {
          const p = this._resolve(target);
          const deniedAt = this._denied(p);
          if (deniedAt) { out = `ls: impossible d'ouvrir '${target}': Permission non accordée 🔒`; err = true; break; }
          if (!this._exists(p)) { out = `ls: ${target}: Aucun fichier ou dossier de ce type`; err = true; break; }
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
          out = "cat: manque le nom de fichier\nUsage : cat FICHIER\nExemple : cat readme.txt\n\nAstuce : tape 'ls' pour voir les fichiers disponibles."; err = true; break;
        }
        const chunks = [];
        for (const fname of fnames) {
          const f = this._file(fname);
          if (f && f.denied) { out = `cat: ${fname}: Permission non accordée 🔒`; err = true; break; }
          if (!f) {
            const sugg = this._suggestFile(fname);
            out = `cat: ${fname}: Aucun fichier ou dossier de ce type${sugg ? "\nVoulais-tu dire : " + sugg + " ?" : "\n\nTape 'ls' pour voir les fichiers disponibles."}`;
            err = true; break;
          }
          if (f.node.type === "dir") { out = `cat: ${fname}: est un dossier\nPour lister son contenu : ls ${fname}`; err = true; break; }
          chunks.push(f.node.content || "");
        }
        if (err) break;
        out = chunks.join("\n");
        break;
      }

      case "less":
      case "more": {
        const fname = args[0];
        if (!fname) { out = `${cmd}: manque le nom de fichier`; err = true; break; }
        const f = this._file(fname);
        if (!f || !f.node) { out = `${cmd}: ${fname}: Aucun fichier ou dossier de ce type`; err = true; break; }
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
        if (deniedAt) { out = `cd: ${target}: Permission non accordée 🔒\n(Il faudrait être root pour entrer dans ${deniedAt}.)`; err = true; break; }
        if (!this._exists(p)) {
          const sugg = this._suggestFile(this._baseOf(p));
          out = `cd: ${target}: Aucun fichier ou dossier de ce type${sugg && this._isDir(this._resolve(sugg)) ? "\nVoulais-tu dire : cd " + sugg + " ?" : "\n\nTape 'ls' pour voir les dossiers disponibles."}`;
          err = true; break;
        }
        if (!this._isDir(p)) { out = `cd: ${target}: N'est pas un dossier`; err = true; break; }
        this.cwd = p;
        this.state.cwd = p === this.root ? "home" : this._baseOf(p);
        out = "";
        break;
      }

      case "mkdir": {
        const hasP = args.includes("-p");
        const p = args.filter(a => !a.startsWith("-"))[0];
        if (!p) { out = "mkdir: manque un opérande\nUsage : mkdir NOM_DOSSIER\nExemple : mkdir projets"; err = true; break; }
        const abs = this._resolve(p);
        if (this._exists(abs)) { out = `mkdir: impossible de créer '${p}': Le fichier existe`; err = true; break; }
        const parent = this._parentOf(abs);
        if (!this._isDir(parent) && !hasP) {
          out = `mkdir: impossible de créer '${p}': le dossier parent n'existe pas\n💡 Utilise -p pour créer toute l'arborescence : mkdir -p ${p}`;
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
        if (!p) { out = "touch: manque le nom du fichier"; err = true; break; }
        const abs = this._resolve(p);
        if (!this._isDir(this._parentOf(abs))) { out = `touch: '${p}': le dossier parent n'existe pas`; err = true; break; }
        if (!this.fs[abs]) this.fs[abs] = { type: "file", content: "" };
        this.state.touch = p;
        out = "";
        break;
      }

      case "cp": {
        const hasR = args.some(a => a.startsWith("-") && a.includes("r"));
        const noFlag = args.filter(a => !a.startsWith("-"));
        if (noFlag.length < 2) { out = "cp: manque les arguments\nUsage : cp SOURCE DESTINATION\nExemple : cp config.json config.backup.json\n\nPour copier un dossier entier : cp -r dossier/ copie/"; err = true; break; }
        const [src, dst] = noFlag;
        const srcAbs = this._resolve(src);
        if (!this._exists(srcAbs)) {
          const sugg = this._suggestFile(src);
          out = `cp: ${src}: Aucun fichier ou dossier de ce type${sugg ? "\nVoulais-tu dire : cp " + sugg + " " + (dst||"destination") + " ?" : ""}`;
          err = true; break;
        }
        if (this._isDir(srcAbs) && !hasR) { out = `cp: -r non spécifié ; omission du dossier '${src}'\n💡 Pour copier un dossier : cp -r ${src} ${dst}`; err = true; break; }
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
        if (!src || !dst) { out = "mv: manque les arguments\nUsage : mv SOURCE DESTINATION\nExemple (renommer) : mv ancien.txt nouveau.txt\nExemple (déplacer) : mv fichier.txt dossier/"; err = true; break; }
        const srcAbs = this._resolve(src);
        if (!this._exists(srcAbs)) {
          const sugg = this._suggestFile(src);
          out = `mv: ${src}: Aucun fichier ou dossier de ce type${sugg ? "\nVoulais-tu dire : mv " + sugg + " " + dst + " ?" : ""}`;
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
          out = "💀 rm -rf / — SÉRIEUSEMENT ?!\n\nSur un vrai système, tu viendrais d'effacer TOUT :\nle système, tes fichiers, tes regrets... tout.\n\nLe dojo te pardonne. Un vrai serveur, non.\n(GNU rm moderne refuse d'ailleurs avec --no-preserve-root)";
          err = true; break;
        }
        const p = targets[0];
        if (!p) { out = "rm: manque le nom du fichier\nUsage : rm FICHIER\nExemple : rm temp.log\n\n⚠️  Attention : pas de corbeille sous Linux, la suppression est définitive !"; err = true; break; }
        const firstAbs = this._resolve(p);
        if (!this._exists(firstAbs)) {
          const sugg = this._suggestFile(p);
          out = `rm: impossible de supprimer '${p}': Aucun fichier ou dossier de ce type${sugg ? "\nVoulais-tu dire : rm " + sugg + " ?" : ""}`;
          err = true; break;
        }
        const hasR = flags.includes("r");
        if (this._isDir(firstAbs) && !hasR) { out = `rm: impossible de supprimer '${p}': est un dossier\n💡 Pour supprimer un dossier et son contenu : rm -r ${p}`; err = true; break; }
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
        if (!target || args.length < 2) { out = "chmod: manque les arguments\nUsage : chmod DROITS FICHIER\nExemples : chmod +x script.sh · chmod 600 secret.key"; err = true; break; }
        const abs = this._resolve(target);
        if (this.fs[abs]) {
          const mode = args[0];
          this.fs[abs].perms = mode === "600" ? "-rw-------" : mode === "644" ? "-rw-r--r--" : "-rwxr-xr-x";
        }
        this.state.chmod = target;
        out = "";
        break;
      }

      case "chown": {
        if (!args[1]) { out = "chown: manque les arguments\nUsage : chown UTILISATEUR[:GROUPE] FICHIER\nExemple : chown sensei:sensei secret.key"; err = true; break; }
        const target = args[args.length - 1];
        const abs = this._resolve(target);
        if (!this.fs[abs]) { out = `chown: impossible d'accéder à '${target}': Aucun fichier ou dossier de ce type`; err = true; break; }
        const [owner, group] = args[0].split(":");
        if (owner) this.fs[abs].owner = owner;
        if (group) this.fs[abs].group = group;
        this.state.chown = target;
        out = "";
        break;
      }

      case "chgrp": {
        if (!args[1]) { out = "chgrp: manque les arguments\nUsage : chgrp GROUPE FICHIER\nExemple : chgrp sensei secret.key"; err = true; break; }
        const target = args[args.length - 1];
        const abs = this._resolve(target);
        if (!this.fs[abs]) { out = `chgrp: impossible d'accéder à '${target}': Aucun fichier ou dossier de ce type`; err = true; break; }
        this.fs[abs].group = args[0];
        this.state.chgrp = target;
        out = "";
        break;
      }

      case "git": {
        const sub = args[0];
        if (!sub) {
          out = "usage: git <commande> [<args>]\n\nCommandes courantes :\n   init       Crée un dépôt Git vide\n   status     Affiche l'état du dépôt\n   add        Ajoute des fichiers à l'index (staging)\n   commit     Enregistre les modifications\n   log        Affiche l'historique des commits\n   branch     Liste ou crée des branches\n   checkout   Change de branche";
          err = true; break;
        }
        if (sub !== "init" && !this._git) {
          out = "fatal: pas un dépôt git (ni aucun des dossiers parents) : .git\n💡 Lance d'abord : git init";
          err = true; break;
        }

        if (sub === "init") {
          this._git = { branch: "main", branches: ["main"], staged: new Set(), committed: new Set(), log: [] };
          const abs = this._resolve(".git");
          this.fs[abs] = { type: "dir" };
          this._ensureParents(abs);
          this.state.gitInit = true;
          out = `Dépôt Git vide initialisé dans ${this.cwd}/.git/`;
          break;
        }

        if (sub === "status") {
          const allFiles = Object.keys(this.fs)
            .filter(k => k.startsWith(this.cwd + "/") && !this._isDir(k) && !k.includes("/.git"))
            .map(k => k.slice(this.cwd.length + 1));
          const staged = [...this._git.staged];
          const untracked = allFiles.filter(f => !this._git.committed.has(f) && !this._git.staged.has(f));
          const L = [`Sur la branche ${this._git.branch}`];
          if (!this._git.log.length) L.push("", "Aucun commit pour l'instant");
          if (staged.length) L.push("", "Modifications qui seront validées :", ...staged.map(f => `\tnouveau fichier :   ${f}`));
          if (untracked.length) L.push("", "Fichiers non suivis :", "  (utilisez « git add <fichier> » pour les inclure)", ...untracked.map(f => `\t${f}`));
          if (!staged.length && !untracked.length) L.push("", "rien à valider, la copie de travail est propre");
          this.state.gitStatus = true;
          out = L.join("\n");
          break;
        }

        if (sub === "add") {
          const targets = args.slice(1);
          if (!targets.length) { out = "Rien de spécifié, rien ajouté.\nUsage : git add <fichier>   ou   git add ."; err = true; break; }
          if (targets.includes(".")) {
            Object.keys(this.fs)
              .filter(k => k.startsWith(this.cwd + "/") && !this._isDir(k) && !k.includes("/.git"))
              .forEach(k => this._git.staged.add(k.slice(this.cwd.length + 1)));
          } else {
            for (const t of targets) {
              const abs = this._resolve(t);
              if (!this._exists(abs)) { out = `fatal: le chemin '${t}' ne correspond à aucun fichier connu de git`; err = true; break; }
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
          if (!msg) { out = "git commit: il faut un message\nUsage : git commit -m \"message du commit\""; err = true; break; }
          if (!this._git.staged.size) { out = 'rien à valider (utilisez "git add" pour suivre des fichiers)'; err = true; break; }
          const hash = Math.random().toString(16).slice(2, 9);
          const files = [...this._git.staged];
          files.forEach(f => this._git.committed.add(f));
          this._git.log.unshift({ hash, msg, files, branch: this._git.branch });
          this._git.staged.clear();
          out = `[${this._git.branch} ${hash}] ${msg}\n ${files.length} fichier(s) modifié(s)`;
          this.state.gitCommit = msg;
          this.state.gitCommitCount = this._git.log.length;
          break;
        }

        if (sub === "log") {
          if (!this._git.log.length) { out = `fatal: votre branche actuelle '${this._git.branch}' ne contient encore aucun commit`; err = true; break; }
          out = this._git.log.map(c => `commit ${c.hash}${"0".repeat(33)}\nAuteur : user <user@dojo>\n\n    ${c.msg}\n`).join("\n");
          this.state.gitLog = true;
          break;
        }

        if (sub === "branch") {
          const name = args[1];
          if (!name) { out = this._git.branches.map(b => (b === this._git.branch ? "* " : "  ") + b).join("\n"); break; }
          if (this._git.branches.includes(name)) { out = `fatal: une branche nommée '${name}' existe déjà`; err = true; break; }
          this._git.branches.push(name);
          this.state.gitBranch = name;
          out = "";
          break;
        }

        if (sub === "checkout") {
          const create = args[1] === "-b";
          const name = create ? args[2] : args[1];
          if (!name) { out = "usage: git checkout <branche>\n       git checkout -b <nouvelle-branche>"; err = true; break; }
          if (create) {
            if (this._git.branches.includes(name)) { out = `fatal: une branche nommée '${name}' existe déjà`; err = true; break; }
            this._git.branches.push(name);
          } else if (!this._git.branches.includes(name)) {
            out = `error: pathspec '${name}' ne correspond à aucun fichier connu de git`; err = true; break;
          }
          this._git.branch = name;
          this.state.gitCheckout = name;
          out = create ? `Basculement sur la nouvelle branche '${name}'` : `Basculement sur la branche '${name}'`;
          break;
        }

        out = `git: '${sub}' n'est pas une commande git. Voir 'git --help'.`;
        err = true;
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
        if (!m) { out = "alias: usage : alias nom='commande'\nExemple : alias ll='ls -la'"; err = true; break; }
        this._aliases[m[1]] = this._stripQuotes(m[2]);
        this.state.alias = m[1];
        out = "";
        break;
      }

      case "unalias": {
        const name = args[0];
        if (!name) { out = "unalias: manque le nom de l'alias\nUsage : unalias NOM"; err = true; break; }
        if (!this._aliases[name]) { out = `unalias: ${name}: alias introuvable`; err = true; break; }
        delete this._aliases[name];
        out = "";
        break;
      }

      case "jobs": {
        if (!this._jobs.length) { out = ""; break; }
        out = this._jobs.map(j => `[${j.id}]+  ${j.done ? "Terminé" : "En cours"}              ${j.cmd} &`).join("\n");
        break;
      }

      case "fg": {
        if (!this._jobs.length) { out = "fg: aucun job en arrière-plan\n💡 Lance une commande avec « & » pour créer un job (ex: sleep 5 &)"; err = true; break; }
        const spec = args[0] ? args[0].replace("%", "") : null;
        const target = spec ? this._jobs.find(j => String(j.id) === spec) : this._jobs[this._jobs.length - 1];
        if (!target) { out = `fg: %${spec}: job introuvable`; err = true; break; }
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
        if (files.length < 2) { out = "diff: il faut deux fichiers\nUsage : diff FICHIER1 FICHIER2"; err = true; break; }
        const f1 = this._file(files[0]);
        const f2 = this._file(files[1]);
        if (!f1 || !f1.node) { out = `diff: ${files[0]}: Aucun fichier ou dossier de ce type`; err = true; break; }
        if (!f2 || !f2.node) { out = `diff: ${files[1]}: Aucun fichier ou dossier de ce type`; err = true; break; }
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
        if (!pattern) { out = "grep: manque le motif de recherche\nUsage : grep MOTIF FICHIER\nExemple : grep ERROR app.log\n\nOptions utiles :\n  -i  ignorer la casse\n  -n  afficher les numéros de ligne\n  -v  inverser (lignes SANS le motif)\n  -c  compter les résultats"; err = true; break; }

        if (fname && fname.includes("*")) {
          const g = this._globList(fname);
          if (g) fname = g[0];
        }
        let content = stdin;
        if (fname) {
          const f = this._file(fname);
          if (!f || !f.node) { out = `grep: ${fname}: Aucun fichier ou dossier de ce type`; err = true; break; }
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
        if (!this._isDir(startAbs)) { out = `find: '${startArg}': Aucun dossier de ce type`; err = true; break; }
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
          if (!f || !f.node) { out = `wc: ${fname}: Aucun fichier ou dossier de ce type`; err = true; break; }
          rows.push(count(f.node.content || "", fname));
        }
        if (err) break;
        out = rows.join("\n");
        break;
      }

      case "sort": {
        const fname = this._expandFileArgs(args.filter(a => !a.startsWith("-")))[0];
        const rev  = args.includes("-r");
        const num  = args.includes("-n");
        const uniq = args.includes("-u");
        let content = stdin;
        if (fname) {
          const f = this._file(fname);
          if (!f || !f.node) { out = `sort: impossible de lire: ${fname}: Aucun fichier ou dossier de ce type`; err = true; break; }
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
          HOME: "/home/user", USER: "user", SHELL: "/bin/bash", PWD: this.cwd, LANG: "fr_FR.UTF-8",
          PATH: "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin", TERM: "xterm-256color",
          ...(this._envVars || {})
        };
        out = Object.entries(base).map(([k, v]) => `${k}=${v}`).join("\n");
        break;
      }

      case "export": {
        const kv = args.join(" ").match(/^(\w+)=(.*)$/);
        if (!kv) { out = "export: usage: export NOM=valeur"; err = true; break; }
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
        if (!pid) { out = "kill: manque le PID\nUsage : kill PID\nExemple : kill 1234\n\nPour forcer l'arrêt : kill -9 PID\nPour trouver les PIDs : ps aux"; err = true; break; }
        this.state.kill = pid;
        out = `[Processus ${pid} terminé]`;
        break;
      }

      case "whoami": { out = "user"; break; }
      case "id":     { out = "uid=1000(user) gid=1000(user) groupes=1000(user),27(sudo)"; break; }

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
          out = "ln: arguments invalides"; err = true;
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
          out = "tar: manque le nom d'archive\nUsage : tar -czf ARCHIVE.tar.gz DOSSIER/\nExemple : tar -czf backup.tar.gz www/\n\nPour extraire : tar -xzf archive.tar.gz\nPour lister : tar -tzf archive.tar.gz";
          err = true;
        }
        break;
      }

      case "curl": {
        const url = args.find(a => a.startsWith("http"));
        if (!url) { out = "curl: manque l'URL"; err = true; break; }
        out = `HTTP/1.1 200 OK\n<!DOCTYPE html>\n<html><head><title>Example Domain</title></head>\n<body><h1>Example Domain</h1></body></html>`;
        break;
      }

      case "sed": {
        const expr = args.find(a => a.startsWith("s/"));
        const fname3 = args.filter(a => !a.startsWith("-") && !a.startsWith("s/")).pop();
        let content2 = stdin;
        if (fname3) {
          const f3 = this._file(fname3);
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
            out = "sed: expression invalide"; err = true;
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
          if (!f || !f.node) { out = `base64: ${fname}: Fichier introuvable`; err = true; break; }
          src = f.node.content || "";
        }
        src = (src || "").trim();
        try {
          if (dec) out = this._b64decode(src);
          else out = this._b64encode(src);
        } catch(e) { out = "base64: entrée invalide"; err = true; }
        break;
      }

      case "rot13": {
        const fname = args.filter(a => !a.startsWith("-"))[0];
        let src = stdin;
        if (fname) {
          const f = this._file(fname);
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
          if (f && f.node) src = f.node.content || "";
        }
        src = src || "";
        if (rev && plain) {
          // hex → texte
          const hex = src.replace(/\s+/g, "");
          try {
            out = (hex.match(/.{1,2}/g) || []).map(h => String.fromCharCode(parseInt(h, 16))).join("");
          } catch(e) { out = "xxd: hex invalide"; err = true; }
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
          if (!f || !f.node) { out = `${cmd}: ${fname}: Aucun fichier ou dossier de ce type`; err = true; break; }
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
          if (!f || !f.node) { out = `uniq: ${fname}: Aucun fichier ou dossier de ce type`; err = true; break; }
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
        if (!fields) { out = "cut: il faut préciser les champs\nUsage : cut -d',' -f1 fichier.csv\n  -d  séparateur (ex: -d',')\n  -f  numéro(s) de colonne (ex: -f1 ou -f1,3)"; err = true; break; }
        const wanted = fields.split(",").map(x => parseInt(x)).filter(x => !isNaN(x));
        const fname = this._expandFileArgs(args.filter((a, i) => !a.startsWith("-") && args[i-1] !== "-d" && args[i-1] !== "-f"))[0];
        let content = stdin;
        if (fname) {
          const f = this._file(fname);
          if (!f || !f.node) { out = `cut: ${fname}: Aucun fichier ou dossier de ce type`; err = true; break; }
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
        if (!from) { out = "tr: usage: tr 'a-z' 'A-Z'  (ou tr -d 'x' pour supprimer)"; err = true; break; }
        let src = stdin || "";
        if (del) {
          out = src.split("").filter(c => !from.includes(c)).join("");
        } else {
          const to = expand(sets[1] || "");
          if (!to) { out = "tr: il manque le second ensemble\nExemple : tr 'a-z' 'A-Z'"; err = true; break; }
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
        if (!this._isDir(startAbs)) { out = `tree: ${startArg}: N'est pas un dossier`; err = true; break; }
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
        res.push(`${nd} répertoire${nd>1?"s":""}, ${nf} fichier${nf>1?"s":""}`);
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
        out = new Date().toLocaleString("fr-FR", { weekday:"long", day:"numeric", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit", second:"2-digit" });
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
        out = ` ${new Date().toLocaleTimeString("fr-FR")} up ${mins} min,  1 user,  load average: 0.42, 0.13, 0.07`;
        break;
      }

      case "free": {
        out = [
          "               total       utilisé      libre",
          "Mem:        16384 Mo      4242 Mo    12142 Mo",
          "Swap:        2048 Mo         0 Mo     2048 Mo"
        ].join("\n");
        break;
      }

      case "history": {
        out = this.cmdLog.map((c, i) => `  ${String(i+1).padStart(3)}  ${c}`).join("\n") || "(historique vide)";
        break;
      }

      case "man": {
        const topic = args[0];
        if (!topic) { out = "Quelle page de manuel voulez-vous ?\nUsage : man COMMANDE   (ex: man grep)"; err = true; break; }
        if (typeof GLOSSARY === "undefined") { out = `man: pas de manuel pour ${topic}`; err = true; break; }
        const entry = GLOSSARY.find(g => g.cmd === topic || g.cmd.split(" ")[0] === topic || g.cmd.split(" / ").includes(topic));
        if (!entry) { out = `man: aucune entrée de manuel pour ${topic}\n💡 Consulte l'onglet Glossaire pour la liste complète.`; err = true; break; }
        this.state.man = topic;
        const L = [];
        L.push(`${topic.toUpperCase()}(1)                    Manuel LinuxDojo                    ${topic.toUpperCase()}(1)`);
        L.push("");
        L.push("NOM");
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
          L.push("EXEMPLES");
          entry.examples.forEach(e => L.push(`       $ ${e[0].padEnd(28)} # ${e[1]}`));
        }
        out = L.join("\n");
        break;
      }

      case "whatis": {
        const topic = args[0];
        if (!topic || typeof GLOSSARY === "undefined") { out = `whatis: usage: whatis COMMANDE`; err = true; break; }
        const entry = GLOSSARY.find(g => g.cmd === topic || g.cmd.split(" ")[0] === topic);
        out = entry ? `${topic} (1) — ${entry.desc}` : `${topic} : rien d'approprié.`;
        if (!entry) err = true;
        break;
      }

      case "ping": {
        const host = args.find(a => !a.startsWith("-")) || "localhost";
        this.state.ping = host;
        out = [
          `PING ${host} (127.0.0.1) 56(84) octets de données.`,
          `64 octets de ${host}: icmp_seq=1 ttl=64 temps=0.042 ms`,
          `64 octets de ${host}: icmp_seq=2 ttl=64 temps=0.038 ms`,
          `64 octets de ${host}: icmp_seq=3 ttl=64 temps=0.040 ms`,
          "",
          `--- statistiques ping ${host} ---`,
          "3 paquets transmis, 3 reçus, 0% perte de paquets"
        ].join("\n");
        break;
      }

      case "ssh": {
        const target = args.find(a => !a.startsWith("-"));
        if (!target) { out = "usage: ssh utilisateur@hôte"; err = true; break; }
        const m = target.match(/^([\w.-]+)@([\w.-]+)$/);
        if (!m) { out = `ssh: format invalide, attendu utilisateur@hôte (reçu '${target}')`; err = true; break; }
        const [, sshUser, sshHost] = m;
        this._sshStack.push(this.ps1User);
        this.ps1User = `${sshUser}@${sshHost}`;
        this.state.sshHost = sshHost;
        this.state.sshUser = sshUser;
        out = `Bienvenue sur ${sshHost} !\nDernière connexion : aujourd'hui depuis 10.0.0.1\nConnecté — tape 'exit' pour te déconnecter.`;
        break;
      }

      case "scp": {
        const src = args.find(a => !a.includes("@") && !a.startsWith("-"));
        const dest = args.find(a => a.includes("@"));
        if (!src || !dest) { out = "usage: scp fichier utilisateur@hôte:/chemin"; err = true; break; }
        if (!this._exists(this._resolve(src))) { out = `scp: ${src}: Aucun fichier ou dossier de ce type`; err = true; break; }
        const dm = dest.match(/^([\w.-]+)@([\w.-]+):(.*)$/);
        if (!dm) { out = `scp: destination invalide, attendu utilisateur@hôte:/chemin (reçu '${dest}')`; err = true; break; }
        this.state.scp = { file: src, host: dm[2], path: dm[3] || "~" };
        out = `${src}                                    100%   1KB   1.0MB/s   00:00`;
        break;
      }

      case "netstat":
      case "ss": {
        this.state.netstat = true;
        out = [
          "Proto  Local Address       État        Programme",
          "tcp    0.0.0.0:22          LISTEN      sshd",
          "tcp    0.0.0.0:80          LISTEN      nginx",
          "tcp    127.0.0.1:3306      LISTEN      mysqld",
          "tcp    0.0.0.0:443         LISTEN      nginx",
        ].join("\n");
        break;
      }

      /* ── Easter eggs & culture Linux ─────────────────────── */
      case "cowsay": {
        const msg = (stdin || args.join(" ") || "Meuh ?").trim();
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
        const F = [
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
          "🚂 Tchou tchou ! Tu as encore tapé 'sl' au lieu de 'ls'...",
          "",
          "      ====        ________                ___________",
          "  _D _|  |_______/        \\__I_I_____===__|_________|",
          "   |(_)---  |   H\\________/ |   |        =|___ ___|  ",
          "   /     |  |   H  |  |     |   |         ||_| |_||  ",
          "  |      |  |   H  |__--------------------| [___] |  ",
          "  | ________|___H__/__|_____/[][]~\\_______|       |  ",
          "  |/ |   |-----------I_____I [][] []  D   |=======|__",
          "",
          "(le vrai 'sl' sous Linux affiche une locomotive qui traverse ton terminal)"
        ].join("\n");
        break;
      }

      case "sudo": {
        if (args.join(" ").includes("sandwich")) { out = "D'accord. 🥪"; break; }  // xkcd 149
        out = "user n'apparaît pas dans le fichier sudoers.\nCet incident sera signalé. 👮\n\n(Ici, pas besoin de sudo — tu es déjà maître du dojo.)";
        err = true;
        break;
      }

      case "vim":
      case "vi": {
        out = "Tu es entré dans Vim.\n\n⚠️  Statistiquement, tu vas y rester coincé 2 heures.\nPour sortir : Échap puis :q!  (ici, tape juste :q!)";
        this.state.vim = true;
        break;
      }
      case ":q!":
      case ":wq": {
        out = this.state.vim ? "Ouf. Tu es sorti de Vim. Peu y parviennent du premier coup. 🏆" : "E492: Commande inconnue (tu n'es même pas dans Vim)";
        this.state.vim = false;
        break;
      }
      case "nano": { out = "GNU nano — l'éditeur de ceux qui veulent juste que ça marche. (simulé)\nCtrl+X pour quitter. Ici, rien à éditer."; break; }
      case "emacs": { out = "Emacs : un excellent système d'exploitation.\nIl ne lui manque qu'un bon éditeur de texte. 😈"; break; }

      case "exit":
      case "logout": {
        if (this._sshStack.length) {
          const prevUser = this._sshStack.pop();
          const leftHost = this.state.sshHost;
          this.ps1User = prevUser;
          this.state.sshExit = leftHost;
          out = `Connexion à ${leftHost} fermée.`;
          break;
        }
        out = "On ne quitte pas le dojo aussi facilement. 🥋\n(Ferme l'onglet si tu veux vraiment partir... lâcheur.)";
        break;
      }

      case "clear":
        this.clear();
        return { output: "", error: false };

      case "help":
        out = [
          "═══ COMMANDES DU DOJO ═══",
          "Navigation   : ls [-la], cd, pwd, tree, find",
          "Fichiers     : cat, less, head, tail, touch, mkdir, cp, mv, rm, ln -s, chmod",
          "Texte        : grep [-invc], sort, uniq [-c], wc [-lwc], cut -d -f, tr, sed, awk",
          "Système      : ps aux, kill, whoami, id, df -h, du, free, uptime, uname -a, date",
          "Propriété    : chown user:groupe fichier, chgrp groupe fichier",
          "Environnement: echo $VAR, env, export VAR=x, history, hostname, alias nom='cmd', unalias",
          "Réseau       : curl, ping, ssh utilisateur@hôte, scp fichier user@hôte:/chemin, netstat",
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
          "Astuces : Tab autocomplète (même les chemins) · ↑/↓ historique · man grep pour le manuel",
          "Touche ? (hors saisie) : ouvre l'écran des raccourcis clavier",
          "",
          "🥚 Il paraît que le dojo cache des secrets... (cowsay ? sl ? fortune ? vim ?)"
        ].join("\n");
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
