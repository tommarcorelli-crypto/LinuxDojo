// gameshell.js — Explorer 2.0 : monde étendu, inventaire, carte, PNJ, portes verrouillées

/* ═══════════════════════════════════════════════════════════
   LE MONDE — ~17 zones, objets à collecter, portes verrouillées
   ═══════════════════════════════════════════════════════════ */
const WORLD = {
  "/": {
    name: "🌌 Le Nexus", emoji: "🌌",
    desc: "Le point de départ. Quatre chemins s'ouvrent : la Forêt, le Donjon, l'Océan et la Montagne. Une porte scellée attend au fond...",
    files: {
      "bienvenue.txt": "Bienvenue, Aventurier.\n\nCe monde se parcourt avec de vraies commandes Linux.\n  ls / ls -la  — regarder autour\n  cd <lieu>    — se déplacer\n  cat <fichier>— lire\n  map          — voir la carte\n  inv          — ton inventaire\n  take <objet> — ramasser\n  talk         — parler aux personnages\n\nRécupère les 3 GEMMES pour ouvrir le Coffre Final.",
    },
    dirs: ["foret", "donjon", "ocean", "montagne", "coffre_final"],
    npc: { name: "Le Gardien du Nexus", emoji: "🧙",
      lines: ["Bienvenue. Trois gemmes dorment dans ce monde : la Verte, la Bleue, la Rouge.",
              "Trouve-les toutes et le Coffre Final s'ouvrira à toi.",
              "Certaines portes sont verrouillées — il te faudra les bons objets."] },
  },

  /* ── FORÊT ─────────────────────────────────────────── */
  "/foret": {
    name: "🌲 Forêt des Processus", emoji: "🌲",
    desc: "Une forêt dense où courent les processus. Trois sentiers : la clairière, le marais, la caverne (sombre).",
    files: { "note.txt": "Le marais cache une lampe 🔦. Sans elle, la caverne est trop sombre pour entrer." },
    dirs: ["clairiere", "marais", "caverne"],
    npc: { name: "Le Vieux Sage", emoji: "🧓",
      lines: ["Ah, un voyageur ! La Gemme Verte se cache dans la caverne.",
              "Mais il fait noir là-dedans. Cherche d'abord une lampe dans le marais.",
              "Utilise 'ls -la' partout — les meilleurs trésors sont cachés."] },
  },
  "/foret/clairiere": {
    name: "🌸 La Clairière", emoji: "🌸",
    desc: "Une clairière paisible baignée de lumière. Un vieux coffre repose ici.",
    files: {
      "coffre.txt": "Tu ouvres le coffre... 100 pièces d'or ! (+20 XP)",
      ".herbe_rare": "🌿 Herbe rare trouvée ! Un objet a rejoint ton inventaire.",
    },
    item: { id: "herbe", name: "Herbe rare", emoji: "🌿" },
    secret: true, xp: 30,
  },
  "/foret/marais": {
    name: "🐸 Le Marais", emoji: "🐸",
    desc: "Un marais boueux. Quelque chose brille sous la vase...",
    files: {
      "avertissement.txt": "Ne bois pas l'eau. Cherche l'objet caché avec 'ls -la'.",
      ".lampe": "🔦 Tu récupères une lampe torche ! Elle éclairera les lieux sombres.",
    },
    item: { id: "lampe", name: "Lampe torche", emoji: "🔦" },
    secret: true, xp: 35,
  },
  "/foret/caverne": {
    name: "🕳️ La Caverne Sombre", emoji: "🕳️",
    desc: "Une caverne d'un noir d'encre. Grâce à ta lampe, tu distingues une lueur verte au fond.",
    locked: "lampe", lockedMsg: "🔦 Il fait trop noir. Il te faut une lampe torche (cachée dans le marais).",
    files: {
      "paroi.txt": "Des inscriptions anciennes parlent d'une gemme verte.",
      ".gemme_verte": "💚 LA GEMME VERTE ! Une des trois gemmes légendaires rejoint ton sac.",
    },
    item: { id: "gemme_verte", name: "Gemme Verte", emoji: "💚" },
    secret: true, xp: 60,
  },

  /* ── DONJON ────────────────────────────────────────── */
  "/donjon": {
    name: "🏰 Donjon des Permissions", emoji: "🏰",
    desc: "Un donjon de pierre. Trois salles : la salle gardée, le cachot, la bibliothèque.",
    files: { "regles.txt": "Ici règnent les permissions. rwx = lire/écrire/exécuter. 'ls -l' révèle tout." },
    dirs: ["salle_gardee", "cachot", "bibliotheque"],
  },
  "/donjon/salle_gardee": {
    name: "⚔️ La Salle Gardée", emoji: "⚔️",
    desc: "Une salle protégée. Une clé d'argent pend au mur.",
    files: {
      "gardien.txt": "Prends la clé d'argent, elle ouvre bien des portes.",
      ".cle_argent": "🗝️ Clé d'argent obtenue !",
    },
    item: { id: "cle_argent", name: "Clé d'argent", emoji: "🗝️" },
    secret: true, xp: 40,
  },
  "/donjon/cachot": {
    name: "⛓️ Le Cachot", emoji: "⛓️",
    desc: "Un cachot humide. Un prisonnier fantôme t'observe.",
    files: { "mur.txt": "Des griffures sur le mur : 'La bibliothèque garde le secret des gemmes.'" },
    npc: { name: "Le Prisonnier Fantôme", emoji: "👻",
      lines: ["Libère-moi... enfin, façon de parler, je suis déjà mort.",
              "Écoute : la Gemme Bleue est dans l'épave, au fond de l'Océan.",
              "Mais l'épave est verrouillée. Il te faut un masque de plongée 🤿."] },
  },
  "/donjon/bibliotheque": {
    name: "📚 La Bibliothèque", emoji: "📚",
    desc: "Des milliers de parchemins. Un grimoire ouvert trône au centre.",
    locked: "cle_argent", lockedMsg: "🔒 La porte est verrouillée. Il te faut la clé d'argent (salle gardée).",
    files: {
      "grimoire.txt": "GRIMOIRE DES GEMMES\n===================\n💚 Verte  : caverne de la forêt (lampe requise)\n💙 Bleue  : épave de l'océan (masque requis)\n❤️ Rouge  : sommet de la montagne\n\nRéunis les trois au Coffre Final du Nexus.",
      ".savoir": "📖 Parchemin du Savoir obtenu ! (+30 XP)",
    },
    item: { id: "savoir", name: "Parchemin du Savoir", emoji: "📖" },
    secret: true, xp: 45,
  },

  /* ── OCÉAN ─────────────────────────────────────────── */
  "/ocean": {
    name: "🌊 Océan des Données", emoji: "🌊",
    desc: "Un océan infini de bits. Trois zones : les récifs, l'épave, les abysses.",
    files: { "bouteille.txt": "Message : les récifs cachent un masque de plongée 🤿." },
    dirs: ["recifs", "epave", "abysses"],
  },
  "/ocean/recifs": {
    name: "🪸 Les Récifs", emoji: "🪸",
    desc: "Des coraux multicolores. Un équipement de plongée est coincé entre deux rochers.",
    files: {
      "corail.txt": "Un masque de plongée est là, caché. 'ls -la' pour le voir.",
      ".masque": "🤿 Masque de plongée obtenu ! Tu peux explorer l'épave.",
    },
    item: { id: "masque", name: "Masque de plongée", emoji: "🤿" },
    secret: true, xp: 40,
  },
  "/ocean/epave": {
    name: "🚢 L'Épave", emoji: "🚢",
    desc: "Une épave engloutie. Ton masque te permet de fouiller la cale, où brille un éclat bleu.",
    locked: "masque", lockedMsg: "🤿 Impossible de plonger sans masque (cherche dans les récifs).",
    files: {
      "cale.txt": "Dans un coffre étanche...",
      ".gemme_bleue": "💙 LA GEMME BLEUE ! Deuxième gemme légendaire acquise.",
    },
    item: { id: "gemme_bleue", name: "Gemme Bleue", emoji: "💙" },
    secret: true, xp: 60,
  },
  "/ocean/abysses": {
    name: "🌑 Les Abysses", emoji: "🌑",
    desc: "Les profondeurs obscures. Ta lampe révèle un trident ancien.",
    locked: "lampe", lockedMsg: "🔦 Trop sombre sans lampe.",
    files: {
      "fond.txt": "Le silence total des abysses.",
      ".trident": "🔱 Trident des Abysses obtenu ! (+35 XP)",
    },
    item: { id: "trident", name: "Trident", emoji: "🔱" },
    secret: true, xp: 50,
  },

  /* ── MONTAGNE ──────────────────────────────────────── */
  "/montagne": {
    name: "⛰️ Montagne des Scripts", emoji: "⛰️",
    desc: "Une montagne escarpée. Trois chemins : le sommet, la vallée, la grotte gelée.",
    files: { "panneau.txt": "La Gemme Rouge attend au sommet. Bonne ascension." },
    dirs: ["sommet", "vallee", "grotte"],
  },
  "/montagne/sommet": {
    name: "🏔️ Le Sommet", emoji: "🏔️",
    desc: "Le toit du monde. Un autel de pierre porte une gemme écarlate.",
    files: {
      "autel.txt": "Sur l'autel repose la gemme rouge, chaude au toucher.",
      ".gemme_rouge": "❤️ LA GEMME ROUGE ! La troisième et dernière gemme est à toi.",
    },
    item: { id: "gemme_rouge", name: "Gemme Rouge", emoji: "❤️" },
    secret: true, xp: 60,
  },
  "/montagne/vallee": {
    name: "🌄 La Vallée", emoji: "🌄",
    desc: "Une vallée tranquille. Un ermite médite près d'un feu.",
    files: { "config.ini": "[jeu]\nastuce=Tape 'map' pour voir où tu en es\n" },
    npc: { name: "L'Ermite", emoji: "🧘",
      lines: ["Paix à toi. Tu cherches les gemmes ?",
              "La Rouge est juste au-dessus, au sommet.",
              "Quand tu auras les trois, retourne au Nexus et ouvre le Coffre Final."] },
  },
  "/montagne/grotte": {
    name: "❄️ La Grotte Gelée", emoji: "❄️",
    desc: "Une grotte de glace. Un coffre gelé renferme une potion.",
    locked: "cle_argent", lockedMsg: "🔒 Le cadenas gelé exige la clé d'argent.",
    files: {
      "glace.txt": "Le froid mordant te saisit.",
      ".potion": "🧪 Potion de Givre obtenue ! (+30 XP)",
    },
    item: { id: "potion", name: "Potion de Givre", emoji: "🧪" },
    secret: true, xp: 45,
  },

  /* ── COFFRE FINAL ──────────────────────────────────── */
  "/coffre_final": {
    name: "🏆 Le Coffre Final", emoji: "🏆",
    desc: "Une porte scellée par trois emplacements de gemmes.",
    requiresAll: ["gemme_verte", "gemme_bleue", "gemme_rouge"],
    requiresMsg: "🔒 Le coffre exige les 3 GEMMES (💚 Verte, 💙 Bleue, ❤️ Rouge).",
    files: {
      "victoire.txt": "🎉 FÉLICITATIONS ! 🎉\n\nTu as réuni les trois gemmes et ouvert le Coffre Final.\nTu es désormais un MAÎTRE EXPLORATEUR du Monde Linux.\n\n« Tout est fichier. Tout se navigue. »\n\n(+200 XP)",
    },
    finalWin: true, secret: true, xp: 200,
  },
};

/* ═══════════════════════════════════════════════════════════
   CLASSE GameShell
   ═══════════════════════════════════════════════════════════ */
class GameShell {
  constructor(termEl, inputEl, runBtn, worldPanel, locationName, locationDesc, visualEl, exitsEl) {
    this.termEl = termEl; this.inputEl = inputEl; this.runBtn = runBtn;
    this.locationName = locationName; this.locationDesc = locationDesc;
    this.visualEl = visualEl; this.exitsEl = exitsEl;

    this.cwd = "/";
    this.history = []; this.histIdx = -1;

    // Sauvegarde par mode
    this.SAVE = "linuxdojo_explore";
    const saved = this._load();
    this.foundSecrets = new Set(saved.foundSecrets || []);
    this.inventory    = new Set(saved.inventory || []);
    this.visited      = new Set(saved.visited || ["/"]);
    this.wonFinal     = saved.wonFinal || false;

    this._bindEvents();
  }

  _load() {
    try { return JSON.parse(localStorage.getItem(this.SAVE)) || {}; } catch { return {}; }
  }
  _save() {
    try {
      localStorage.setItem(this.SAVE, JSON.stringify({
        foundSecrets: [...this.foundSecrets],
        inventory:    [...this.inventory],
        visited:      [...this.visited],
        wonFinal:     this.wonFinal,
      }));
    } catch {}
  }

  init() {
    this._clearTerm();
    this._print("🌌 Bienvenue dans le Monde Linux.", "t-story");
    this._print("", "t-out");
    this._print("Commandes : ls · ls -la · cd · cat · map · inv · take · use · talk · help", "t-info");
    if (this.inventory.size > 0) this._print("(progression chargée — tape 'inv' pour voir ton sac)", "t-out");
    this._updateWorld(true);
  }

  _bindEvents() {
    this.runBtn.addEventListener("click", () => this._run());
    this._rsearch = (typeof ReverseSearch !== "undefined") ? new ReverseSearch(this.inputEl, () => this.history) : null;
    this.inputEl.addEventListener("keydown", e => {
      const rs = this._rsearch && this._rsearch.handleKey(e);
      if (rs === "run") { this._run(); return; }
      if (rs) return;
      if (e.key === "Enter") this._run();
      else if (e.key === "Tab") { e.preventDefault(); this._autocomplete(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); if (this.histIdx < this.history.length-1) { this.histIdx++; this.inputEl.value = this.history[this.histIdx]||""; } }
      else if (e.key === "ArrowDown") { e.preventDefault(); if (this.histIdx > 0) { this.histIdx--; this.inputEl.value = this.history[this.histIdx]||""; } else { this.histIdx=-1; this.inputEl.value=""; } }
    });
  }

  _run() {
    const raw = this.inputEl.value.trim();
    if (!raw) return;
    this.history.unshift(raw); this.histIdx = -1; this.inputEl.value = "";
    this._printPrompt(raw);
    this._exec(raw);
  }

  _exec(raw) {
    const parts = raw.split(/\s+/);
    const cmd = parts[0], args = parts.slice(1);
    const loc = WORLD[this.cwd];
    if (typeof bumpStat === "function") bumpStat(cmd);

    switch (cmd) {
      case "ls": {
        const a = args.some(x => x.includes("a"));
        const l = args.some(x => x.includes("l"));
        let items = [...(loc.dirs||[]).map(d => d+"/"), ...Object.keys(loc.files||{})];
        if (!a) items = items.filter(f => !f.startsWith("."));
        if (!items.length) { this._print("(vide)", "t-out"); break; }
        if (l) items.forEach(it => {
          const dir = it.endsWith("/"), hid = it.startsWith(".");
          this._print(`${dir?"drwxr-xr-x":(hid?"-rw-------":"-rw-r--r--")}  user user  ${dir?"4096":"  42"}  ${it}`, "t-out");
        });
        else this._print(items.join("   "), "t-out");
        break;
      }
      case "cd": {
        const t = args[0];
        if (!t || t === "~") { this.cwd = "/"; this._updateWorld(); break; }
        if (t === "..") {
          const p = this.cwd.split("/").filter(Boolean); p.pop();
          this.cwd = "/" + p.join("/"); if (this.cwd === "/") {} 
          this._updateWorld(); break;
        }
        const np = this.cwd === "/" ? "/"+t : this.cwd+"/"+t;
        const target = WORLD[np];
        if (!target && !(loc.dirs||[]).includes(t)) { this._print(`cd: ${t}: Aucun lieu de ce type`, "t-err"); break; }
        if (target && target.locked && !this.inventory.has(target.locked)) { this._print(target.lockedMsg, "t-warn"); break; }
        if (target && target.requiresAll && !target.requiresAll.every(i => this.inventory.has(i))) { this._print(target.requiresMsg, "t-warn"); break; }
        this.cwd = np; this._updateWorld();
        break;
      }
      case "cat": case "less": {
        const f = args[0];
        if (!f) { this._print(`${cmd}: manque le nom du fichier`, "t-err"); break; }
        const c = loc.files && loc.files[f];
        if (c === undefined) { this._print(`${cmd}: ${f}: Fichier introuvable`, "t-err"); break; }
        c.split("\n").forEach(l => this._print(l, "t-out"));
        if (f.startsWith(".")) this._grantFromZone(loc);
        break;
      }
      case "pwd": this._print(this.cwd, "t-out"); break;
      case "find": {
        const ni = args.indexOf("-name");
        const pat = ni >= 0 ? (args[ni+1]||"").replace(/[*'"]/g,"") : "";
        const res = [];
        const walk = (path) => {
          const n = WORLD[path]; if (!n) return;
          Object.keys(n.files||{}).forEach(f => { if (!pat || f.endsWith(pat)) res.push(path+"/"+f); });
          (n.dirs||[]).forEach(d => walk(path === "/" ? "/"+d : path+"/"+d));
        };
        walk(this.cwd);
        this._print(res.length ? res.join("\n") : "(aucun résultat)", "t-out");
        break;
      }
      case "grep": {
        const nf = args.filter(x => !x.startsWith("-"));
        const pat = nf[0], f = nf[1];
        if (!pat || !f) { this._print("grep: usage: grep MOTIF FICHIER", "t-err"); break; }
        const c = loc.files && loc.files[f];
        if (c === undefined) { this._print(`grep: ${f}: introuvable`, "t-err"); break; }
        const ls = c.split("\n").filter(l => l.toLowerCase().includes(pat.toLowerCase()));
        this._print(ls.length ? ls.join("\n") : "(aucune correspondance)", "t-out");
        break;
      }
      case "inv": case "inventory": {
        if (!this.inventory.size) { this._print("🎒 Ton sac est vide.", "t-out"); break; }
        this._print("🎒 INVENTAIRE :", "t-info");
        this.inventory.forEach(id => {
          const it = this._itemById(id);
          this._print("   " + (it ? it.emoji + " " + it.name : id), "t-out");
        });
        break;
      }
      case "take": {
        const id = args[0];
        if (loc.item && (loc.item.id === id || id === loc.item.name?.toLowerCase())) { this._grantItem(loc.item); }
        else if (loc.item) { this._print(`Ici tu peux ramasser : ${loc.item.emoji} (take ${loc.item.id})`, "t-warn"); }
        else this._print("Rien à ramasser ici.", "t-out");
        break;
      }
      case "use": {
        const id = args[0];
        if (!this.inventory.has(id)) { this._print(`Tu n'as pas '${id}' dans ton sac.`, "t-warn"); break; }
        const it = this._itemById(id);
        this._print(`Tu utilises ${it?it.emoji+" "+it.name:id}. ${this._useEffect(id)}`, "t-ok");
        break;
      }
      case "map": this._printMap(); break;
      case "talk": {
        if (!loc.npc) { this._print("Il n'y a personne à qui parler ici.", "t-out"); break; }
        this._print("💬 " + loc.npc.emoji + " " + loc.npc.name + " :", "t-story");
        loc.npc.lines.forEach(l => this._print("   « " + l + " »", "t-out"));
        break;
      }
      case "clear": this._clearTerm(); break;
      case "help":
        [ "Commandes de l'explorateur :",
          "  ls / ls -la   — regarder autour (cachés avec -la)",
          "  cd <lieu>     — se déplacer   ·   cd ..  remonter",
          "  cat <fichier> — lire un fichier",
          "  map           — carte des lieux visités",
          "  inv           — ton inventaire",
          "  take <objet>  — ramasser un objet",
          "  use <objet>   — utiliser un objet",
          "  talk          — parler au personnage présent",
          "  find / grep   — chercher",
        ].forEach(l => this._print(l, l.startsWith("  ")?"t-out":"t-info"));
        break;
      default:
        this._print(`${cmd}: commande inconnue. Tape 'help'.`, "t-err");
    }
  }

  _grantFromZone(loc) {
    // Objet
    if (loc.item && !this.inventory.has(loc.item.id)) this._grantItem(loc.item);
    // XP de secret
    if (loc.secret && !this.foundSecrets.has(this.cwd)) {
      this.foundSecrets.add(this.cwd);
      if (typeof addXP === "function") addXP(loc.xp || 0);
      this._save();
      setTimeout(() => {
        this._print("", "t-out");
        this._print("✨ Secret découvert ! +" + (loc.xp||0) + " XP", "t-ok");
        if (typeof burstParticles === "function") burstParticles(window.innerWidth*0.7, window.innerHeight*0.5);
      }, 250);
    }
    // Victoire finale
    if (loc.finalWin && !this.wonFinal) {
      this.wonFinal = true; this._save();
      setTimeout(() => {
        if (typeof showAchievement === "function") showAchievement("🏆", "MAÎTRE EXPLORATEUR", "Tu as réuni les 3 gemmes et vaincu le monde !");
        if (typeof SFX !== "undefined") SFX.levelup();
        if (typeof burstParticles === "function") { burstParticles(window.innerWidth/2, window.innerHeight/2); setTimeout(()=>burstParticles(window.innerWidth/3, window.innerHeight/2),200); setTimeout(()=>burstParticles(window.innerWidth*2/3, window.innerHeight/2),400); }
      }, 300);
    }
  }

  _grantItem(item) {
    if (this.inventory.has(item.id)) { this._print(`Tu as déjà ${item.emoji} ${item.name}.`, "t-out"); return; }
    this.inventory.add(item.id); this._save();
    setTimeout(() => {
      this._print("", "t-out");
      this._print(`🎒 Objet obtenu : ${item.emoji} ${item.name}`, "t-ok");
      if (typeof SFX !== "undefined") SFX.badge();
      // Gemmes = spécial
      if (item.id.startsWith("gemme")) {
        const gems = ["gemme_verte","gemme_bleue","gemme_rouge"].filter(g => this.inventory.has(g)).length;
        this._print(`💎 Gemmes réunies : ${gems}/3`, "t-info");
        if (gems === 3) this._print("→ Retourne au Nexus et ouvre le Coffre Final ! (cd / puis cd coffre_final)", "t-warn");
      }
    }, 250);
  }

  _itemById(id) {
    for (const path in WORLD) if (WORLD[path].item && WORLD[path].item.id === id) return WORLD[path].item;
    return null;
  }

  _useEffect(id) {
    const fx = {
      lampe: "Une lumière chaude t'entoure.",
      masque: "Tu respires sous l'eau sans peine.",
      cle_argent: "Un cliquetis métallique résonne.",
      herbe: "Un parfum apaisant s'en dégage.",
      potion: "Une fraîcheur revigorante te parcourt.",
      trident: "Tu te sens puissant.",
      savoir: "La connaissance emplit ton esprit.",
    };
    return fx[id] || "Rien de spécial ne se produit.";
  }

  _updateWorld(silent) {
    const loc = WORLD[this.cwd]; if (!loc) return;
    this.visited.add(this.cwd); this._save();
    this.locationName.textContent = loc.name;
    this.locationDesc.textContent = loc.desc;
    this.visualEl.innerHTML = `<span style="position:relative;z-index:1;font-size:64px">${loc.emoji}</span>`;

    // Sorties (boutons)
    this.exitsEl.innerHTML = "";
    if (this.cwd !== "/") {
      const b = document.createElement("button"); b.className = "exit-btn"; b.textContent = "↑ Remonter (cd ..)";
      b.onclick = () => { this.inputEl.value = "cd .."; this._run(); this._switchToTerminalMobile(); };
      this.exitsEl.appendChild(b);
    }
    (loc.dirs||[]).forEach(d => {
      const np = this.cwd === "/" ? "/"+d : this.cwd+"/"+d;
      const target = WORLD[np];
      const isLocked = target && ((target.locked && !this.inventory.has(target.locked)) || (target.requiresAll && !target.requiresAll.every(i=>this.inventory.has(i))));
      const b = document.createElement("button"); b.className = "exit-btn";
      b.textContent = (isLocked?"🔒 ":"→ ") + d + "/";
      if (isLocked) b.style.opacity = "0.55";
      b.onclick = () => { this.inputEl.value = "cd " + d; this._run(); this._switchToTerminalMobile(); };
      this.exitsEl.appendChild(b);
    });
    // PNJ / objet visibles
    if (loc.npc) { const b=document.createElement("button"); b.className="exit-btn"; b.textContent="💬 Parler à "+loc.npc.name; b.onclick=()=>{this.inputEl.value="talk";this._run();this._switchToTerminalMobile();}; this.exitsEl.appendChild(b); }

    if (!silent) { this._print("", "t-out"); this._print("📍 " + loc.name, "t-story"); this._print(loc.desc, "t-out"); }
  }

  _printMap() {
    this._print("🗺️  CARTE DU MONDE", "t-info");
    const order = ["/","/foret","/foret/clairiere","/foret/marais","/foret/caverne",
      "/donjon","/donjon/salle_gardee","/donjon/cachot","/donjon/bibliotheque",
      "/ocean","/ocean/recifs","/ocean/epave","/ocean/abysses",
      "/montagne","/montagne/sommet","/montagne/vallee","/montagne/grotte","/coffre_final"];
    order.forEach(p => {
      const n = WORLD[p]; if (!n) return;
      const depth = p === "/" ? 0 : p.split("/").length - 1;
      const indent = "  ".repeat(depth);
      const seen = this.visited.has(p);
      const here = p === this.cwd;
      const mark = here ? "📍" : (seen ? n.emoji : "❓");
      const label = seen ? n.name : "??? (non exploré)";
      this._print(`${indent}${mark} ${label}${here?"  ← tu es ici":""}`, seen ? "t-out" : "t-sep");
    });
  }

  _autocomplete() {
    const val = this.inputEl.value, parts = val.trimStart().split(" "), last = parts[parts.length-1];
    const cmds = ["ls","cd","cat","less","pwd","find","grep","clear","help","inv","inventory","take","use","map","talk"];
    if (parts.length === 1) {
      const m = cmds.filter(c => c.startsWith(last));
      if (m.length === 1) this.inputEl.value = m[0] + " ";
      else if (m.length > 1) { this._print(""); this._print(m.join("  "), "t-info"); }
      return;
    }
    const loc = WORLD[this.cwd];
    const files = [...Object.keys(loc.files||{}), ...(loc.dirs||[]).map(d=>d+"/")];
    const m2 = files.filter(f => f.startsWith(last));
    if (m2.length === 1) { parts[parts.length-1] = m2[0]; this.inputEl.value = parts.join(" "); }
    else if (m2.length > 1) { this._print(""); this._print(m2.join("  "), "t-info"); }
  }

  _clearTerm() { this.termEl.innerHTML = ""; }
  _switchToTerminalMobile() {
    if (window.innerWidth > 768) return;
    const layout = document.getElementById("explore-layout");
    const tabs = document.querySelectorAll(".explore-mtab");
    if (!layout || !tabs.length) return;
    tabs.forEach(b => b.classList.toggle("active", b.dataset.tab === "term"));
    layout.classList.remove("mtab-world", "mtab-term");
    layout.classList.add("mtab-term");
  }
  _printPrompt(cmd) {
    const d = document.createElement("div");
    d.className = "t-line t-prompt-line";
    d.innerHTML = `<span class="t-ps1">explorer@monde:${this.cwd}$</span><span class="t-cmd"> ${cmd.replace(/</g,"&lt;")}</span>`;
    this.termEl.appendChild(d); this.termEl.scrollTop = this.termEl.scrollHeight;
  }
  _print(text, cls) {
    const d = document.createElement("div"); d.className = "t-line " + (cls||"t-out"); d.textContent = text;
    this.termEl.appendChild(d); this.termEl.scrollTop = this.termEl.scrollHeight;
  }
}

// Export pour test node
if (typeof module !== "undefined") module.exports = { WORLD };

/* ── Onglets mobiles Explorer (Monde / Terminal) ─────────────
   Sur desktop les deux panneaux sont côte à côte (voir CSS).
   Sur mobile (<768px) un seul est visible à la fois. ── */
document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".explore-mtab");
  const layout = document.getElementById("explore-layout");
  if (!tabs.length || !layout) return;
  tabs.forEach(btn => btn.addEventListener("click", () => {
    tabs.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    layout.classList.remove("mtab-world", "mtab-term");
    layout.classList.add("mtab-" + btn.dataset.tab);
  }));
});

