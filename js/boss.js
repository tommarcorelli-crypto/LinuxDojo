// boss.js — Salle des Boss : combats épiques en plusieurs phases
// Chaque commande correcte inflige des dégâts. Timer écoulé = tu perds un cœur.

const BOSS_FIGHTS = [

  /* ═══ BOSS 1 — LE KRAKEN DES LOGS ═══════════════════════════ */
  {
    id: "kraken",
    name: "Le Kraken des Logs",
    emoji: "🐙",
    color: "#3b82f6",
    tagline: "Il a noyé le serveur sous un océan de logs.",
    story: "3h47 du matin. Le serveur de prod suffoque : un monstre tentaculaire génère des torrents de logs. Chaque commande juste tranche un tentacule.",
    hp: 100,
    xp: 100,
    taunts: ["Le Kraken t'éclabousse d'encre !", "Un tentacule fouette l'écran !", "GLOUB. Le Kraken rit sous l'eau."],
    winText: "Le Kraken sombre dans les abysses du /dev/null. Les logs sont purifiés.",
    phases: [
      {
        title: "Repérer la bête",
        desc: "Le Kraken se cache dans le plus gros fichier. Affiche les fichiers <strong>avec leurs tailles</strong> pour le repérer.",
        hint: "ls -l",
        timeLimit: 60,
        fs: {
          "huge.log":  { type:"file", content:"INFO tout va bien\nERROR tentacule détecté\nINFO ras\nERROR encre partout\nINFO calme\nERROR vague géante\nINFO ok\nERROR bateau renversé\nERROR sonar brouillé\nERROR abysses instables\nINFO fin" },
          "tiny.txt":  { type:"file", content:"rien ici" },
          "note.md":   { type:"file", content:"le monstre laisse des traces..." },
        },
        check: (out) => /-rw.*huge\.log/.test(out),
      },
      {
        title: "Trancher le premier tentacule",
        desc: "Extrais toutes les lignes <strong>ERROR</strong> de <code>huge.log</code> — ce sont les tentacules du monstre.",
        hint: "grep ERROR huge.log",
        timeLimit: 60,
        fs: {
          "huge.log":  { type:"file", content:"INFO tout va bien\nERROR tentacule détecté\nINFO ras\nERROR encre partout\nINFO calme\nERROR vague géante\nINFO ok\nERROR bateau renversé\nERROR sonar brouillé\nERROR abysses instables\nINFO fin" },
        },
        check: (out) => /tentacule/.test(out) && /encre/.test(out) && !/tout va bien/.test(out),
      },
      {
        title: "Compter les tentacules",
        desc: "Combien de tentacules (<strong>lignes ERROR</strong>) reste-t-il dans <code>huge.log</code> ? Donne le compte exact.",
        hint: "grep -c ERROR huge.log   (ou grep ERROR huge.log | wc -l)",
        timeLimit: 75,
        fs: {
          "huge.log":  { type:"file", content:"INFO tout va bien\nERROR tentacule détecté\nINFO ras\nERROR encre partout\nINFO calme\nERROR vague géante\nINFO ok\nERROR bateau renversé\nERROR sonar brouillé\nERROR abysses instables\nINFO fin" },
        },
        check: (out) => /\b6\b/.test(out),
      },
      {
        title: "Localiser son antre",
        desc: "Le Kraken attaque depuis une IP. Extrais la <strong>3e colonne</strong> (les IP) de <code>access.log</code> (séparateur : espace).",
        hint: "awk '{print $3}' access.log   (ou cut -d' ' -f3 access.log)",
        timeLimit: 90,
        fs: {
          "access.log": { type:"file", content:"2026-07-07 03:47:01 66.6.66.6\n2026-07-07 03:47:02 66.6.66.6\n2026-07-07 03:47:03 10.0.0.42" },
        },
        check: (out) => /66\.6\.66\.6/.test(out) && !/03:47/.test(out),
      },
      {
        title: "Le coup de grâce",
        desc: "Le Kraken possède le processus <strong>nginx</strong>. Trouve son PID avec <code>ps aux</code>, puis <strong>achève-le</strong>.",
        hint: "ps aux   puis   kill <PID de nginx>",
        timeLimit: 90,
        fs: {},
        check: (out, s) => s.kill === "1234",
      },
    ],
  },

  /* ═══ BOSS 2 — LE SPECTRE INVISIBLE ═════════════════════════ */
  {
    id: "spectre",
    name: "Le Spectre Invisible",
    emoji: "👻",
    color: "#a78bfa",
    tagline: "Il hante les fichiers cachés et les variables oubliées.",
    story: "Un fantôme s'est glissé dans le système. Personne ne le voit... sauf ceux qui savent regarder les fichiers cachés. Révèle-le, nomme-le, exorcise-le.",
    hp: 80,
    xp: 100,
    taunts: ["Le Spectre traverse ton écran en hurlant !", "Wooooosh. Un frisson glacé parcourt le clavier.", "Le Spectre souffle sur ton historique..."],
    winText: "Nommé et révélé, le Spectre se dissout dans un dernier « whooosh ». Le système est exorcisé.",
    phases: [
      {
        title: "Révéler l'invisible",
        desc: "Le Spectre se cache dans ce dossier. Liste <strong>TOUS</strong> les fichiers, y compris les invisibles.",
        hint: "ls -a   (les fichiers cachés commencent par un point)",
        timeLimit: 45,
        fs: {
          "chambre.txt":  { type:"file", content:"Il fait froid ici..." },
          ".fantome":     { type:"file", content:"Tu m'as trouvé. Mais connais-tu mon vrai nom ?\nIl est chiffré dans .grimoire" },
          ".grimoire":    { type:"file", content:"Zbegvzre" },
        },
        check: (out) => /\.fantome/.test(out),
      },
      {
        title: "Lire le message spectral",
        desc: "Lis le contenu du fichier caché <code>.fantome</code>.",
        hint: "cat .fantome",
        timeLimit: 45,
        fs: {
          "chambre.txt":  { type:"file", content:"Il fait froid ici..." },
          ".fantome":     { type:"file", content:"Tu m'as trouvé. Mais connais-tu mon vrai nom ?\nIl est chiffré dans .grimoire" },
          ".grimoire":    { type:"file", content:"Zbegvzre" },
        },
        check: (out) => /vrai nom/.test(out),
      },
      {
        title: "Déchiffrer son vrai nom",
        desc: "Son nom est chiffré en <strong>ROT13</strong> dans <code>.grimoire</code>. Déchiffre-le pour briser son pouvoir.",
        hint: "rot13 .grimoire",
        timeLimit: 60,
        fs: {
          ".grimoire":    { type:"file", content:"Zbegvzre" },
        },
        check: (out) => /mortimer/.test(out),
      },
      {
        title: "L'exorcisme",
        desc: "Le Spectre s'est réfugié dans une <strong>variable d'environnement</strong> : <code>$SPECTRE</code>. Affiche-la pour l'expulser.",
        hint: "echo $SPECTRE   (ou env | grep SPECTRE)",
        timeLimit: 60,
        fs: {},
        envVars: { "SPECTRE": "mortimer_expulse_du_systeme" },
        check: (out) => /mortimer_expulse_du_systeme/.test(out),
      },
    ],
  },

  /* ═══ BOSS 3 — L'HYDRE DES DONNÉES ══════════════════════════ */
  {
    id: "hydre",
    name: "L'Hydre des Données",
    emoji: "🐉",
    color: "#10b981",
    tagline: "Coupe une tête, deux doublons repoussent.",
    story: "L'Hydre a corrompu la base : doublons partout, colonnes mélangées, données chuchotées en minuscules. Seul un maître du tri peut la dompter.",
    hp: 120,
    xp: 120,
    taunts: ["L'Hydre duplique tes données sous tes yeux !", "Trois nouvelles têtes sifflent en chœur !", "SSSSSS. L'Hydre crache un CSV corrompu."],
    winText: "Triée, dédupliquée, décapitée. L'Hydre n'est plus qu'une liste propre et unique.",
    phases: [
      {
        title: "Observer les têtes",
        desc: "Le registre est immense. Affiche seulement les <strong>3 premières lignes</strong> de <code>registre.txt</code> pour évaluer la bête.",
        hint: "head -n 3 registre.txt",
        timeLimit: 60,
        fs: {
          "registre.txt": { type:"file", content:"tete-alpha\ntete-beta\ntete-gamma\ntete-delta\ntete-epsilon\ntete-zeta\ntete-eta\ntete-theta" },
        },
        check: (out) => /tete-alpha/.test(out) && /tete-gamma/.test(out) && !/tete-delta/.test(out),
      },
      {
        title: "Isoler le venin",
        desc: "Le fichier <code>hydre.csv</code> liste les têtes (nom,venin,force). Extrais la <strong>2e colonne</strong> (le venin).",
        hint: "cut -d',' -f2 hydre.csv   (ou awk -F',' '{print $2}')",
        timeLimit: 75,
        fs: {
          "hydre.csv": { type:"file", content:"nom,venin,force\nalpha,acide,50\nbeta,poison,30\ngamma,lave,80" },
        },
        check: (out) => /acide/.test(out) && /poison/.test(out) && !/alpha/.test(out) && !/50/.test(out),
      },
      {
        title: "Couper les doublons",
        desc: "Chaque tête coupée a repoussé en double dans <code>clones.txt</code> ! Trie puis <strong>supprime les doublons</strong> pour n'en garder qu'une de chaque.",
        hint: "sort clones.txt | uniq   (ou sort -u clones.txt)",
        timeLimit: 75,
        fs: {
          "clones.txt": { type:"file", content:"gorgone\nvipere\ngorgone\nbasilic\nvipere\ngorgone\nbasilic" },
        },
        check: (out) => {
          const l = out.split("\n").filter(Boolean);
          return l.length === 3 && /basilic/.test(out) && /gorgone/.test(out) && /vipere/.test(out);
        },
      },
      {
        title: "Le mot de pouvoir",
        desc: "Pour étourdir l'Hydre, il faut CRIER. Convertis le contenu de <code>sortilege.txt</code> en <strong>MAJUSCULES</strong> (pipe + tr).",
        hint: "cat sortilege.txt | tr 'a-z' 'A-Z'",
        timeLimit: 75,
        fs: {
          "sortilege.txt": { type:"file", content:"dracarys" },
        },
        check: (out, s, rawOut) => /DRACARYS/.test(rawOut || ""),
      },
      {
        title: "L'antidote final",
        desc: "L'antidote est dans <code>potions.txt</code>, sur la ligne contenant <strong>ANTIDOTE</strong>, après les deux-points. Enchaîne <code>grep</code> puis <code>cut</code> pour l'extraire seul.",
        hint: "grep ANTIDOTE potions.txt | cut -d':' -f2",
        timeLimit: 90,
        fs: {
          "potions.txt": { type:"file", content:"POISON:nevergonna\nLARME:giveyouup\nANTIDOTE:hydrae_mortem_777\nVENIN:letyoudown" },
        },
        check: (out) => /hydrae_mortem_777/.test(out) && !/antidote:/.test(out),
      },
    ],
  },

  /* ═══ BOSS 4 — LE GOLEM BINAIRE ═════════════════════════════ */
  {
    id: "golem",
    name: "Le Golem Binaire",
    emoji: "🗿",
    color: "#f97316",
    tagline: "Son cœur bat en base64. Ses runes parlent en hexadécimal.",
    story: "Une statue de silicium bloque la salle des serveurs. Quatre runes verrouillent son cœur : décode-les toutes pour l'éteindre.",
    hp: 100,
    xp: 120,
    taunts: ["Le Golem écrase le sol. 01010111 01101111 01110111.", "Une rune s'illumine et t'aveugle !", "Le Golem recompile son cœur..."],
    winText: "La dernière rune s'éteint. Le Golem s'agenouille, puis se fige à jamais. kernel panic — core dumped.",
    phases: [
      {
        title: "La rune Base64",
        desc: "La première rune, <code>rune1.b64</code>, est encodée en <strong>Base64</strong>. Décode-la.",
        hint: "base64 -d rune1.b64",
        timeLimit: 60,
        fs: {
          "rune1.b64": { type:"file", content:"ZmVyIGZvcmdlIGZldQ==" },
          "indice.txt": { type:"file", content:"Base64 : l'armure des données. base64 -d pour la percer." },
        },
        check: (out) => /fer forge feu/.test(out),
      },
      {
        title: "La rune Hexadécimale",
        desc: "La deuxième rune, <code>rune2.hex</code>, est gravée en <strong>hexadécimal</strong>. Reconvertis-la en texte.",
        hint: "xxd -r -p rune2.hex",
        timeLimit: 75,
        fs: {
          "rune2.hex": { type:"file", content:"726f6368652065742073696c696365" },
        },
        check: (out) => /roche et silice/.test(out),
      },
      {
        title: "La rune César",
        desc: "La troisième rune, <code>rune3.rot</code>, est chiffrée en <strong>ROT13</strong>. Déchiffre-la.",
        hint: "rot13 rune3.rot",
        timeLimit: 60,
        fs: {
          "rune3.rot": { type:"file", content:"netvyr rg sbhqer" },
        },
        check: (out) => /argile et foudre/.test(out),
      },
      {
        title: "Le cœur du Golem",
        desc: "Son cœur est <strong>doublement encodé</strong> : ROT13 <em>puis</em> Base64. Enchaîne <code>base64 -d</code> puis <code>rot13</code> en un seul pipeline sur <code>coeur.enc</code>.",
        hint: "cat coeur.enc | base64 -d | rot13",
        timeLimit: 120,
        fs: {
          "coeur.enc": { type:"file", content:"YWJsbmggcXIgZnZ5dnB2aHogcmdydmFn" },
          "schema.txt": { type:"file", content:"coeur.enc = base64(rot13(message))\nDonc pour inverser : base64 -d PUIS rot13." },
        },
        check: (out) => /noyau de silicium/.test(out),
      },
    ],
  },

  /* ═══ BOSS 5 — LE GARDIEN DES SERRURES ══════════════════════ */
  {
    id: "gardien",
    name: "Le Gardien des Serrures",
    emoji: "🔐",
    color: "#eab308",
    tagline: "Chaque porte qu'il garde a une serrure. Certaines sont cassées.",
    story: "Une statue de bronze veille sur la chambre du trésor. Elle ne laisse passer que ceux qui savent lire — et corriger — les permissions.",
    hp: 110,
    xp: 130,
    taunts: ["Le Gardien resserre une serrure derrière toi !", "CLIC. Une porte se verrouille dans ton dos.", "Le Gardien grince : « Les droits ne se donnent pas, ils se méritent. »"],
    winText: "La dernière serrure cède. Le Gardien s'incline et te laisse entrer : le trésor est à toi.",
    phases: [
      {
        title: "Repérer la brèche",
        desc: "Une porte du trésor a été laissée grande ouverte. Liste les fichiers <strong>avec leurs permissions</strong> pour trouver lequel est accessible à tous.",
        hint: "ls -l",
        timeLimit: 60,
        fs: {
          "tresor.key": { type:"file", perms:"-rw-------", content:"or et gemmes" },
          "journal.txt": { type:"file", perms:"-rwxrwxrwx", content:"Le Gardien note tout ici..." },
          "sceau.txt": { type:"file", perms:"-rw-r--r--", content:"sceau du gardien" },
        },
        check: (out) => /rwxrwxrwx/.test(out) && /journal\.txt/.test(out),
      },
      {
        title: "Refermer la brèche",
        desc: "<code>journal.txt</code> est ouvert à tous les vents. Restreins-le pour que <strong>seul le propriétaire</strong> puisse lire et écrire (<code>600</code>).",
        hint: "chmod 600 journal.txt",
        timeLimit: 75,
        fs: {
          "journal.txt": { type:"file", perms:"-rwxrwxrwx", content:"Le Gardien note tout ici..." },
        },
        check: (out, s) => s.chmod === "journal.txt",
      },
      {
        title: "Démasquer l'imposteur",
        desc: "Un voleur s'est fait passer pour le Gardien. Affiche les permissions <strong>et propriétaires</strong> pour trouver qui possède <code>relique.txt</code>.",
        hint: "ls -l",
        timeLimit: 75,
        fs: {
          "relique.txt": { type:"file", perms:"-rw-r--r--", owner:"voleur", group:"voleur", content:"une relique volée" },
          "sceau.txt":   { type:"file", perms:"-rw-r--r--", owner:"gardien", group:"gardien", content:"sceau du gardien" },
        },
        check: (out) => /voleur/.test(out) && /relique\.txt/.test(out),
      },
      {
        title: "Reprendre la relique",
        desc: "Rends <code>relique.txt</code> au Gardien : change son propriétaire et son groupe pour <strong>gardien</strong>.",
        hint: "chown gardien:gardien relique.txt",
        timeLimit: 75,
        fs: {
          "relique.txt": { type:"file", perms:"-rw-r--r--", owner:"voleur", group:"voleur", content:"une relique volée" },
        },
        check: (out, s) => s.chown === "relique.txt",
      },
      {
        title: "La porte finale",
        desc: "Le mécanisme d'ouverture est dans <code>ouvrir.sh</code>, mais il n'est pas exécutable. Rends-le <strong>exécutable</strong> pour actionner la dernière serrure.",
        hint: "chmod +x ouvrir.sh",
        timeLimit: 90,
        fs: {
          "ouvrir.sh": { type:"file", perms:"-rw-r--r--", content:"#!/bin/bash\necho 'Porte ouverte'" },
        },
        check: (out, s) => s.chmod === "ouvrir.sh",
      },
    ],
  },

  /* ═══ BOSS FINAL — L'EXAMEN DE LA CEINTURE NOIRE ════════════ */
  {
    id: "sensei",
    name: "SENSEI — Examen Ceinture Noire",
    emoji: "🥷",
    color: "#ef4444",
    tagline: "Six épreuves. Timers serrés. Aucune pitié.",
    story: "Le Sensei t'attend au sommet du dojo. Six épreuves éclair, tirées de tout ce que tu as appris. Réussis-les et repars avec la Ceinture Noire. 🖤",
    hp: 150,
    xp: 300,
    requires: 5,   // nombre de boss à vaincre pour débloquer
    taunts: ["Le Sensei esquive sans même te regarder.", "« Trop lent. Recommence. »", "Le Sensei soupire, déçu."],
    winText: "Le Sensei s'incline. « Tu es prêt. » Il te tend la CEINTURE NOIRE du LinuxDojo. 🖤",
    phases: [
      {
        title: "Épreuve 1 — L'œil qui voit tout",
        desc: "Dans ce dossier se cache un fichier invisible contenant le sceau. <strong>Révèle-le puis lis-le</strong> — vite.",
        hint: "ls -a   puis   cat .sceau",
        timeLimit: 45,
        fs: {
          "leurre.txt": { type:"file", content:"rien" },
          ".sceau":     { type:"file", content:"SCEAU-DU-DRAGON-9000" },
        },
        check: (out) => /sceau-du-dragon-9000/.test(out),
      },
      {
        title: "Épreuve 2 — Compter sans erreur",
        desc: "Combien de lignes <strong>FAILED</strong> dans <code>audit.log</code> ? Le compte exact, rien d'autre.",
        hint: "grep -c FAILED audit.log",
        timeLimit: 45,
        fs: {
          "audit.log": { type:"file", content:"OK login\nFAILED ssh root\nOK backup\nFAILED sudo intrus\nFAILED port scan\nOK update\nFAILED brute force\nOK logout" },
        },
        check: (out) => /\b4\b/.test(out),
      },
      {
        title: "Épreuve 3 — Trouver l'aiguille",
        desc: "Quelque part traîne une <strong>clé privée</strong> (fichier <code>.key</code>). Localise-la avec <code>find</code>.",
        hint: "find . -name '*.key'",
        timeLimit: 45,
        fs: {
          "app.js":        { type:"file", content:"" },
          "notes.txt":     { type:"file", content:"" },
          "id_dragon.key": { type:"file", content:"PRIVÉE" },
          "readme.md":     { type:"file", content:"" },
        },
        check: (out) => /id_dragon\.key/.test(out),
      },
      {
        title: "Épreuve 4 — Chirurgie de colonnes",
        desc: "Extrais la <strong>3e colonne</strong> (les codes) de <code>disciples.csv</code>, séparateur virgule.",
        hint: "awk -F',' '{print $3}' disciples.csv   (ou cut -d',' -f3)",
        timeLimit: 60,
        fs: {
          "disciples.csv": { type:"file", content:"nom,rang,code\nkenji,dan1,K4TA\nyuki,dan2,SH1N\nakira,dan3,R0NIN" },
        },
        check: (out) => /k4ta/.test(out) && /r0nin/.test(out) && !/kenji/.test(out),
      },
      {
        title: "Épreuve 5 — Réécrire l'histoire",
        desc: "Le parchemin <code>voie.txt</code> contient un mensonge : remplace <strong>peur</strong> par <strong>courage</strong>, partout.",
        hint: "sed 's/peur/courage/g' voie.txt",
        timeLimit: 60,
        fs: {
          "voie.txt": { type:"file", content:"La voie du shell est peur.\nCelui qui doute a peur.\nLa peur mène au rm -rf." },
        },
        check: (out) => /courage/.test(out) && !/peur/.test(out),
      },
      {
        title: "Épreuve finale — Le secret du Sensei",
        desc: "Le dernier secret est <strong>doublement scellé</strong> : ROT13 puis Base64. Un seul pipeline pour le briser : <code>base64 -d</code> puis <code>rot13</code>.",
        hint: "cat secret.enc | base64 -d | rot13",
        timeLimit: 90,
        fs: {
          "secret.enc": { type:"file", content:"cHJ2YWdoZXIgYWJ2ZXI=" },
        },
        check: (out) => /ceinture noire/.test(out),
      },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════
   CLASSE BossMode
   ═══════════════════════════════════════════════════════════ */
class BossMode {
  constructor(opts) {
    this.listEl    = opts.listEl;       // liste des boss (gauche)
    this.arenaEl   = opts.arenaEl;      // conteneur arène (droite)
    this.avatarEl  = opts.avatarEl;
    this.nameEl    = opts.nameEl;
    this.tagEl     = opts.tagEl;
    this.hpFill    = opts.hpFill;
    this.hpText    = opts.hpText;
    this.heartsEl  = opts.heartsEl;
    this.phaseEl   = opts.phaseEl;
    this.descEl    = opts.descEl;
    this.timerFill = opts.timerFill;
    this.timerLbl  = opts.timerLbl;
    this.hintBtn   = opts.hintBtn;
    this.hintText  = opts.hintText;
    this.termEl    = opts.termEl;
    this.inputEl   = opts.inputEl;
    this.runBtn    = opts.runBtn;
    this.fleeBtn   = opts.fleeBtn;

    this.SAVE      = "linuxdojo_boss";
    const saved    = this._load();
    this.defeated  = new Set(saved.defeated || []);

    this.boss      = null;    // boss en cours
    this.phaseIdx  = 0;
    this.hp        = 0;
    this.hearts    = 3;
    this.timer     = null;
    this.timeLeft  = 0;
    this.hintUsed  = false;
    this.over      = false;

    this.term = new Terminal(this.termEl);
    this.term.ps1User = "ronin@arene";
    this._bindEvents();
  }

  _load() { try { return JSON.parse(localStorage.getItem(this.SAVE)) || {}; } catch { return {}; } }
  _save() { try { localStorage.setItem(this.SAVE, JSON.stringify({ defeated: [...this.defeated] })); } catch {} }

  defeatedCount() { return this.defeated.size; }

  init() {
    this.renderList();
    this._showIdle();
  }

  _bindEvents() {
    this.runBtn.addEventListener("click", () => this._run());
    this.inputEl.addEventListener("keydown", e => {
      if (e.key === "Enter") this._run();
      else if (e.key === "Tab") { e.preventDefault(); this.term.autocomplete(this.inputEl); }
    });
    this.hintBtn.addEventListener("click", () => this._showHint());
    if (this.fleeBtn) this.fleeBtn.addEventListener("click", () => this._flee());
  }

  renderList() {
    this.listEl.innerHTML = "";
    BOSS_FIGHTS.forEach(b => {
      const locked = b.requires && this.defeatedCount() < b.requires;
      const done   = this.defeated.has(b.id);
      const card = document.createElement("div");
      card.className = "boss-card" + (done ? " done" : "") + (locked ? " locked" : "") + (this.boss && this.boss.id === b.id ? " active" : "");
      card.innerHTML = `
        <div class="boss-card-emoji" style="text-shadow:0 0 18px ${b.color}">${locked ? "🔒" : b.emoji}</div>
        <div class="boss-card-info">
          <div class="boss-card-name">${b.name}</div>
          <div class="boss-card-tag">${locked ? t("boss.lockedTag", { n: b.requires }) : b.tagline}</div>
          <div class="boss-card-meta">
            <span>💥 ${b.hp} HP</span><span>${t("boss.metaPhases", { n: b.phases.length })}</span><span>✨ ${b.xp} XP</span>
            ${done ? '<span class="boss-done-chip">' + t("boss.doneChip") + '</span>' : ""}
          </div>
        </div>`;
      if (!locked) card.addEventListener("click", () => this.startFight(b.id));
      this.listEl.appendChild(card);
    });
  }

  _showIdle() {
    this.arenaEl.classList.add("boss-idle");
    this.avatarEl.textContent = "⚔️";
    this.avatarEl.style.filter = "none";
    this.nameEl.textContent = t("boss.idleName");
    this.nameEl.style.color = "";
    this.tagEl.textContent = t("boss.idleTag");
    this.hpFill.style.width = "0%";
    this.hpText.textContent = "";
    this.heartsEl.textContent = "";
    this.phaseEl.textContent = "";
    this.descEl.innerHTML = t("boss.idleDesc");
    this.timerFill.style.width = "0%";
    this.timerLbl.textContent = "";
    this.hintText.style.display = "none";
    this.hintBtn.style.display = "none";
    this.term.clear();
    this.term.printInfo(t("boss.idleTerm"));
  }

  startFight(id) {
    const b = BOSS_FIGHTS.find(x => x.id === id);
    if (!b) return;
    if (this.timer) clearInterval(this.timer);
    this.boss = b;
    this.phaseIdx = 0;
    this.hp = b.hp;
    this.hearts = 3;
    this.over = false;
    this.arenaEl.classList.remove("boss-idle");

    this.avatarEl.textContent = b.emoji;
    this.avatarEl.style.filter = "none";
    this.nameEl.textContent = b.name;
    this.nameEl.style.color = b.color;
    this.tagEl.textContent = b.story;

    this.term.clear();
    this.term.printInfo(t("boss.appears", { name: b.name.toUpperCase() }));
    this.term.printWarn(b.tagline);
    this.term.printOut("");
    if (typeof SFX !== "undefined") SFX.glitch();
    if (typeof glitchElement === "function") glitchElement(this.avatarEl, 700);

    this.renderList();
    this._loadPhase(0);
  }

  _loadPhase(idx) {
    const b = this.boss;
    const ph = b.phases[idx];
    if (!ph) return;
    this.phaseIdx = idx;
    this.hintUsed = false;

    this.term.loadFS(ph.fs || {});
    if (ph.envVars) this.term._envVars = { ...ph.envVars };

    this.phaseEl.textContent = t("boss.phaseLabel", { n: idx + 1, total: b.phases.length, title: ph.title });
    this.descEl.innerHTML = ph.desc;
    this.hintBtn.style.display = "";
    this.hintBtn.innerHTML = t("boss.hintBtn", { cost: b.id === "sensei" ? 25 : 10 });
    this.hintText.style.display = "none";
    this.hintText.textContent = "";

    this._updateHP();
    this._updateHearts();
    this.term.printSep();
    this.term.printInfo(t("boss.phaseStart", { n: idx + 1, total: b.phases.length, title: ph.title }));
    this.term.printOut("");
    this._startTimer(ph.timeLimit || 60);
    this.inputEl.focus();
  }

  _run() {
    if (!this.boss || this.over) return;
    const raw = this.inputEl.value.trim();
    if (!raw) return;
    this.inputEl.value = "";
    if (typeof bumpStat === "function") bumpStat(raw.split(/\s+/)[0]);

    const result = this.term.run(raw);
    const out = (result.output || "");
    const ph = this.boss.phases[this.phaseIdx];

    let ok = false;
    try { ok = ph.check(out.toLowerCase(), this.term.state, out); } catch(e) {}
    if (ok) this._phaseCleared();
  }

  _phaseCleared() {
    clearInterval(this.timer);
    const b = this.boss;
    const dmg = Math.ceil(b.hp / b.phases.length);
    this.hp = Math.max(0, this.hp - dmg);

    // Impact visuel
    this._updateHP();
    this._damageNumber(dmg);
    this.arenaEl.classList.add("boss-shake");
    setTimeout(() => this.arenaEl.classList.remove("boss-shake"), 500);
    if (typeof SFX !== "undefined") SFX.success();
    if (typeof burstParticles === "function") {
      const r = this.avatarEl.getBoundingClientRect();
      burstParticles(r.left + r.width/2, r.top + r.height/2);
    }
    this.term.printOk(t("boss.hit", { name: b.name, dmg: dmg }));

    if (this.phaseIdx < b.phases.length - 1) {
      setTimeout(() => this._loadPhase(this.phaseIdx + 1), 1000);
    } else {
      this._victory();
    }
  }

  _victory() {
    const b = this.boss;
    this.over = true;
    this.hp = 0;
    this._updateHP();
    this.timerFill.style.width = "0%";
    this.timerLbl.textContent = "";

    const first = !this.defeated.has(b.id);
    this.defeated.add(b.id);
    this._save();

    this.avatarEl.style.filter = "grayscale(1) brightness(0.5)";
    if (typeof glitchElement === "function") glitchElement(this.avatarEl, 1200);
    if (typeof SFX !== "undefined") SFX.levelup();

    this.term.printSep();
    this.term.printOk(t("boss.defeated", { name: b.name.toUpperCase() }));
    this.term.printOut(b.winText);
    if (first) {
      this.term.printOk(t("boss.xpGain", { xp: b.xp }));
      if (typeof addXP === "function") addXP(b.xp);
    } else {
      this.term.printInfo(t("boss.alreadyDone"));
    }
    this.term.printOut("");
    this.term.printInfo(t("boss.chooseOther"));

    if (typeof showAchievement === "function") {
      showAchievement(b.emoji, t("boss.achDefeated", { name: b.name }), first ? "+" + b.xp + " XP" : t("boss.achAgain"));
    }
    // Ceinture Noire : le Sensei délivre le certificat
    if (b.id === "sensei") {
      this.term.printOut("");
      this.term.printOk(t("boss.blackbeltWon"));
      setTimeout(() => {
        if (typeof showToast === "function") showToast(t("boss.blackbeltToast"));
        if (typeof renderCertificate === "function") renderCertificate();
      }, 1400);
    }
    if (typeof burstParticles === "function") {
      burstParticles(window.innerWidth/2, window.innerHeight/2);
      setTimeout(() => burstParticles(window.innerWidth/3, window.innerHeight/3), 250);
      setTimeout(() => burstParticles(window.innerWidth*2/3, window.innerHeight/3), 500);
    }
    if (typeof checkBadges === "function") checkBadges();
    if (typeof objectivesTick === "function") objectivesTick();
    this.renderList();
  }

  _loseHeart() {
    const b = this.boss;
    this.hearts--;
    this._updateHearts();

    // Attaque du boss : flash rouge + shake
    document.body.classList.add("boss-hit");
    setTimeout(() => document.body.classList.remove("boss-hit"), 600);
    this.arenaEl.classList.add("boss-shake");
    setTimeout(() => this.arenaEl.classList.remove("boss-shake"), 500);
    if (typeof SFX !== "undefined") SFX.error();

    const taunt = b.taunts[Math.floor(Math.random() * b.taunts.length)];
    this.term.printErr(t("boss.timeout", { taunt: taunt }));

    if (this.hearts <= 0) {
      this._defeat();
    } else {
      this.term.printWarn(t("boss.heartsLeft", { hearts: "❤️".repeat(this.hearts) }));
      const ph = b.phases[this.phaseIdx];
      this.term.loadFS(ph.fs || {});
      if (ph.envVars) this.term._envVars = { ...ph.envVars };
      this._startTimer(ph.timeLimit || 60);
    }
  }

  _defeat() {
    const b = this.boss;
    this.over = true;
    clearInterval(this.timer);
    this.timerFill.style.width = "0%";

    this.term.printSep();
    this.term.printErr(t("boss.ko", { name: b.name }));
    this.term.printOut(t("boss.koTaunt"));
    this.term.printOut("");

    const retry = document.createElement("button");
    retry.className = "btn-primary";
    retry.textContent = t("boss.retry");
    retry.style.margin = "8px 0";
    retry.addEventListener("click", () => this.startFight(b.id));
    this.termEl.appendChild(retry);
    this.termEl.scrollTop = this.termEl.scrollHeight;

    if (typeof SFX !== "undefined") SFX.glitch();
  }

  _flee() {
    if (this.timer) clearInterval(this.timer);
    this.boss = null;
    this.over = false;
    this._showIdle();
    this.renderList();
  }

  _showHint() {
    if (!this.boss || this.over) return;
    const ph = this.boss.phases[this.phaseIdx];
    this.hintText.style.display = "inline";
    this.hintText.textContent = t("boss.hintReveal", { hint: ph.hint });
    if (!this.hintUsed) {
      this.hintUsed = true;
      const cost = this.boss.id === "sensei" ? 25 : 10;
      if (typeof GAME !== "undefined") { GAME.xp = Math.max(0, GAME.xp - cost); if (typeof persist === "function") persist(); if (typeof updateXPBar === "function") updateXPBar(); }
    }
  }

  _damageNumber(dmg) {
    const r = this.avatarEl.getBoundingClientRect();
    const d = document.createElement("div");
    d.className = "boss-dmg-float";
    d.textContent = "−" + dmg;
    d.style.left = (r.left + r.width/2) + "px";
    d.style.top = (r.top) + "px";
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 1200);
  }

  _updateHP() {
    const b = this.boss;
    const pct = b ? (this.hp / b.hp) * 100 : 0;
    this.hpFill.style.width = pct + "%";
    this.hpText.textContent = b ? this.hp + " / " + b.hp + " HP" : "";
  }

  _updateHearts() {
    this.heartsEl.textContent = "❤️".repeat(this.hearts) + "🖤".repeat(3 - this.hearts);
  }

  _startTimer(seconds) {
    clearInterval(this.timer);
    this.timeLeft = seconds;
    this._updateTimer(seconds);
    this.timer = setInterval(() => {
      this.timeLeft--;
      this._updateTimer(seconds);
      if (this.timeLeft <= 0) {
        clearInterval(this.timer);
        this._loseHeart();
      }
    }, 1000);
  }

  _updateTimer(total) {
    const pct = Math.max(0, (this.timeLeft / total) * 100);
    this.timerFill.style.width = pct + "%";
    this.timerFill.style.background = pct > 50 ? "var(--grad-main)" : pct > 25 ? "var(--orange)" : "var(--red)";
    this.timerLbl.textContent = this.timeLeft + "s";
  }
}

// Export pour test node
if (typeof module !== "undefined") module.exports = { BOSS_FIGHTS };
