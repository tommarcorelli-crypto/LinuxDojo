// i18n.js — Système d'internationalisation de LinuxDojo (FR / EN)
//
// Chargé très tôt (juste après errors.js), avant tous les autres scripts,
// pour que t() / pick() / LANG soient disponibles partout.
//
// Deux mécanismes complémentaires :
//   1. UI (chaînes d'interface) — table clé → traduction, lue par t("clé").
//      Le HTML statique est annoté avec data-i18n / data-i18n-attr /
//      data-i18n-html : applyStaticI18n() parcourt le DOM et remplit les
//      textes au chargement. Le JS qui génère de l'UI appelle t() directement.
//   2. Contenu (missions, glossaire...) — champs { fr, en } lus par pick().
//      pick("chaîne simple") renvoie la chaîne telle quelle : le contenu pas
//      encore traduit continue de s'afficher (fallback FR = dégradation propre).
//
// Changer de langue = setLang() qui persiste puis recharge la page : sur une
// base de code de cette taille, un reload complet re-rend tout proprement dans
// la nouvelle langue, sans plomberie réactive fragile.

const LANGS = ["fr", "en"];
const LANG_KEY = "linuxdojo_lang";

function _detectLang() {
  let saved = null;
  try { saved = localStorage.getItem(LANG_KEY); } catch {}
  if (LANGS.includes(saved)) return saved;
  const nav = (navigator.language || "fr").toLowerCase();
  return nav.startsWith("en") ? "en" : "fr";
}

let LANG = _detectLang();

// ── Table des chaînes d'interface ───────────────────────────────
// Clés en notation pointée (plates), regroupées par zone. Toute clé
// absente de `en` retombe automatiquement sur `fr` (voir t()).
const UI = {
  fr: {
    // ── Navigation ──
    "nav.hamburger": "Ouvrir le menu de navigation",
    "nav.home": "Accueil",
    "nav.learn": "Apprendre",
    "nav.explore": "Explorer",
    "nav.challenge": "Défis",
    "nav.bandit": "Infiltration",
    "nav.boss": "⚔️ Boss",
    "nav.kata": "🥋 Kata",
    "nav.sandbox": "Bac à sable",
    "nav.glossary": "Glossaire",
    "nav.profile": "Profil",
    "nav.shortcuts": "Raccourcis clavier (?)",
    "nav.shortcutsAria": "Afficher les raccourcis clavier",
    "nav.sound": "Son on/off",
    "nav.soundAria": "Activer ou couper le son",
    "nav.lang": "Changer de langue / Switch language",

    // ── Accueil : bandeau défi du jour ──
    "daily.banner.title": "Défi du jour",
    "daily.banner.sub": "Résous le défi quotidien pour +50 XP bonus",
    "daily.banner.btn": "Relever le défi",

    // ── Accueil : héros ──
    "hero.badge": "Terminal · Linux · Hacking",
    "hero.sub": "Apprends Linux comme un pro.<br>En jouant. Pour de vrai.",
    "hero.start": "▶ Commencer",
    "hero.exploreWorld": "🗺 Explorer le monde",

    // ── Accueil : cartes de modes ──
    "mode.learn.title": "Apprendre",
    "mode.learn.desc": "Leçons + scénarios réels. Tu comprends pourquoi avant de taper.",
    "mode.learn.tag": "10 scénarios · 60 missions",
    "mode.explore.title": "Explorer",
    "mode.explore.desc": "Un monde ouvert : inventaire, PNJ, portes verrouillées. Réunis les 3 gemmes.",
    "mode.explore.tag": "18 zones · Aventure",
    "mode.challenge.title": "Défis",
    "mode.challenge.desc": "Un problème, une commande, un chrono. Enchaîne pour un combo jusqu'à x5.",
    "mode.challenge.tag": "20 défis · Combo & record",
    "mode.bandit.title": "Infiltration",
    "mode.bandit.desc": "Trouve le mot de passe caché. Fouille, filtre, et décode (base64, ROT13, hex).",
    "mode.bandit.tag": "Style Bandit · 15 niveaux",
    "mode.boss.title": "Salle des Boss",
    "mode.boss.desc": "Affronte le Kraken, le Spectre, l'Hydre, le Golem… et le Sensei. HP, cœurs, chrono.",
    "mode.boss.tag": "6 boss · Ceinture Noire",
    "mode.kata.title": "Kata",
    "mode.kata.desc": "La mémoire musculaire du shell : tape des enchaînements de commandes au chrono. WPM & précision.",
    "mode.kata.tag": "7 katas · Vitesse & record",
    "mode.sandbox.title": "Bac à sable",
    "mode.sandbox.desc": "Un terminal libre, sans objectif. Teste toutes les commandes tranquillement.",
    "mode.sandbox.tag": "Libre · Toutes commandes",
    "mode.profile.title": "Profil",
    "mode.profile.desc": "Ta progression, tes 8 rangs, tes badges et tes commandes préférées.",
    "mode.profile.tag": "Rangs · Badges · Stats",

    // ── Accueil : objectifs + stats ──
    "home.objectives": "🎯 Objectifs",
    "home.stat.xp": "XP total",
    "home.stat.done": "Missions",
    "home.stat.lv": "Niveau",
    "home.stat.badges": "Badges",

    // ── Apprendre ──
    "learn.scenarios": "Scénarios",
    "lesson.stepBadge": "📖 Leçon",
    "lesson.label.syntax": "SYNTAXE",
    "lesson.label.options": "OPTIONS",
    "lesson.label.examples": "EXEMPLES",
    "lesson.goExercise": "Je comprends — À moi de jouer →",
    "mission.backLesson": "← Leçon",
    "mission.hint": "💡 Indice <span class=\"cost free\">gratuit</span>",
    "term.placeholder": "tape une commande...",
    "term.cmdAria": "Ligne de commande du terminal",
    "term.runAria": "Exécuter la commande",

    // ── Explorer ──
    "explore.tab.world": "🗺️ Monde",
    "explore.tab.term": "💻 Terminal",
    "explore.location": "🌍 Le Monde",
    "explore.placeholder": "ls, cd, cat, read...",
    "explore.welcome": "🌌 Bienvenue dans le Monde Linux.",
    "explore.commands": "Commandes : ls · ls -la · cd · cat · map · inv · take · use · talk · help",
    "explore.loaded": "(progression chargée — tape 'inv' pour voir ton sac)",
    "explore.empty": "(vide)",
    "explore.cdUnknown": "cd: {t}: Aucun lieu de ce type",
    "explore.catMissing": "{cmd}: manque le nom du fichier",
    "explore.catNotFound": "{cmd}: {f}: Fichier introuvable",
    "explore.findNone": "(aucun résultat)",
    "explore.grepUsage": "grep: usage: grep MOTIF FICHIER",
    "explore.grepNotFound": "grep: {f}: introuvable",
    "explore.grepNoMatch": "(aucune correspondance)",
    "explore.bagEmpty": "🎒 Ton sac est vide.",
    "explore.inventory": "🎒 INVENTAIRE :",
    "explore.canTake": "Ici tu peux ramasser : {emoji} (take {id})",
    "explore.nothingTake": "Rien à ramasser ici.",
    "explore.dontHave": "Tu n'as pas '{id}' dans ton sac.",
    "explore.useItem": "Tu utilises {item}. {effect}",
    "explore.noNpc": "Il n'y a personne à qui parler ici.",
    "explore.npcLine": "   « {line} »",
    "explore.unknownCmd": "{cmd}: commande inconnue. Tape 'help'.",
    "explore.secretFound": "✨ Secret découvert ! +{xp} XP",
    "explore.masterTitle": "MAÎTRE EXPLORATEUR",
    "explore.masterSub": "Tu as réuni les 3 gemmes et vaincu le monde !",
    "explore.alreadyHave": "Tu as déjà {item}.",
    "explore.itemGot": "🎒 Objet obtenu : {item}",
    "explore.gems": "💎 Gemmes réunies : {n}/3",
    "explore.gemsAll": "→ Retourne au Nexus et ouvre le Coffre Final ! (cd / puis cd coffre_final)",
    "explore.mapTitle": "🗺️  CARTE DU MONDE",
    "explore.mapUnknown": "??? (non exploré)",
    "explore.youHere": "  ← tu es ici",
    "explore.goUp": "↑ Remonter (cd ..)",
    "explore.talkTo": "💬 Parler à {name}",
    "explore.help.title": "Commandes de l'explorateur :",
    "explore.help.ls": "  ls / ls -la   — regarder autour (cachés avec -la)",
    "explore.help.cd": "  cd <lieu>     — se déplacer   ·   cd ..  remonter",
    "explore.help.cat": "  cat <fichier> — lire un fichier",
    "explore.help.map": "  map           — carte des lieux visités",
    "explore.help.inv": "  inv           — ton inventaire",
    "explore.help.take": "  take <objet>  — ramasser un objet",
    "explore.help.use": "  use <objet>   — utiliser un objet",
    "explore.help.talk": "  talk          — parler au personnage présent",
    "explore.help.search": "  find / grep   — chercher",
    "explore.fx.lampe": "Une lumière chaude t'entoure.",
    "explore.fx.masque": "Tu respires sous l'eau sans peine.",
    "explore.fx.cle_argent": "Un cliquetis métallique résonne.",
    "explore.fx.herbe": "Un parfum apaisant s'en dégage.",
    "explore.fx.potion": "Une fraîcheur revigorante te parcourt.",
    "explore.fx.trident": "Tu te sens puissant.",
    "explore.fx.savoir": "La connaissance emplit ton esprit.",
    "explore.fx.default": "Rien de spécial ne se produit.",

    // ── Défis ──
    "challenge.expected": "RÉSULTAT ATTENDU",
    "challenge.skip": "Passer →",
    "challenge.placeholder": "tape ta commande...",
    "challenge.header": "⚡ Défi {n}/{total} — {cat}",
    "challenge.num": "Défi {n}",
    "challenge.combo": "🔥 Combo x{n}",
    "challenge.best": "★ Record : {best} pts  ·  Score : {score}",
    "challenge.success": "✅ Réussi ! +{xp} XP",
    "challenge.comboSuffix": "  (combo x{m} !)",
    "challenge.allDone": "🏆 Tous les défis terminés !",
    "challenge.timeout": "⏰ Temps écoulé ! Solution : {sol}",

    // ── Kata ──
    "kata.introTitle": "🥋 Kata — la mémoire musculaire du shell",
    "kata.introText": "Tape chaque commande le plus vite et le plus juste possible. Un kata = 8 commandes. On mesure ta vitesse (WPM) et ta précision. Répète, et tes doigts finiront par connaître le chemin.",
    "kata.record": "★ Record : {score} ({wpm} WPM · {acc}%)",
    "kata.never": "Jamais tenté",
    "kata.quit": "✕ Quitter",
    "kata.playPlaceholder": "tape la commande ci-dessus...",
    "kata.playHint": "Entrée ou frappe complète pour valider · Échap pour quitter",
    "kata.newRecord": "★ NOUVEAU RECORD",
    "kata.accuracy": "Précision",
    "kata.time": "Temps",
    "kata.perfectSuffix": "  ·  sans-faute !",
    "kata.again": "↻ Refaire ce kata",
    "kata.others": "Autres katas",
    "kata.gradePerfect": "PARFAIT 🏆",
    "kata.gradeMaster": "Maître 🥋",
    "kata.gradeBrown": "Ceinture Marron",
    "kata.gradeGreen": "Ceinture Verte",
    "kata.gradeWhite": "Ceinture Blanche",

    // ── Défi du jour (bannière + modale, générés en JS) ──
    "daily.banner.doneSub": "Reviens demain pour un nouveau défi.",
    "daily.banner.doneBtn": "Revoir",
    "daily.banner.todoSub": "Résous le défi du {day} pour +50 XP bonus.",
    "daily.banner.todoBtn": "Relever le défi",
    "daily.streakChip": "🔥 {n} j",
    "daily.streakDate": "  ·  🔥 {n} j",
    "daily.doneToday": "✓ Terminé aujourd'hui",
    "daily.retrain": "Tu peux le refaire pour t'entraîner (sans récompense).",
    "daily.hiddenHintDone": "Astuce cachée : {hint}",
    "daily.hiddenHintTodo": "Astuce cachée : clique 3 fois sur le titre pour voir l'indice",
    "daily.hintReveal": "💡 {hint}",
    "daily.success": "✅ Défi du jour réussi ! +{gain} XP",
    "daily.successStreakBonus": "  (série 🔥{streak} → +{bonus} bonus)",
    "daily.successBonus": " bonus",
    "daily.successBox": "🎉 Bravo ! {streak}Reviens demain pour la continuer.",
    "daily.successBoxStreak": "Série de 🔥{streak} jours ! ",
    "daily.achStreak": "Série de {streak} jours",
    "daily.achTitle": "Défi du jour",
    "daily.alreadyToday": "✅ Correct ! (déjà validé aujourd'hui)",
    "daily.shareTitle": "LinuxDojo — Défi #{n}",
    "daily.shareStreak": "🔥 Série de {streak} jours",
    "daily.shareBtn": "📋 Partager mon résultat",
    "daily.copied": "📋 Résultat copié — colle-le où tu veux !",
    "daily.copyPrompt": "Copie ton résultat :",

    // ── Infiltration ──
    "bandit.usefulCmds": "COMMANDES UTILES",
    "bandit.placeholder": "explore et trouve le mot de passe...",
    "bandit.story": "Tu t'es infiltré dans le serveur d'une organisation obscure. Chaque niveau cache le mot de passe du suivant. Fouille, filtre, décode — et ne laisse aucune trace.",
    "bandit.explore": "Explore le filesystem. Trouve le mot de passe pour passer au niveau suivant.",
    "bandit.level": "Niveau {n}",
    "bandit.found": "Mot de passe trouvé : {pw}\n\n+{xp} XP",

    // ── Boss ──
    "boss.roomTitle": "⚔️ Salle des Boss",
    "boss.roomIntro": "Chaque commande juste inflige des dégâts.<br>Timer écoulé = tu perds un cœur. 3 cœurs, pas un de plus.",
    "boss.nameDefault": "Salle des Boss",
    "boss.flee": "🏃 Fuir",
    "boss.hint": "💡 Indice <span class=\"cost\">−10 XP</span>",
    "boss.placeholder": "frappe avec la bonne commande...",
    "boss.idleName": "Salle des Boss",
    "boss.idleTag": "Choisis ton adversaire. Chaque commande juste inflige des dégâts. Timer écoulé = tu perds un cœur.",
    "boss.idleDesc": "Les boss ne t'attendront pas éternellement...",
    "boss.idleTerm": "⚔️  SALLE DES BOSS — sélectionne un adversaire pour engager le combat.",
    "boss.appears": "⚔️  {name} apparaît !",
    "boss.phaseLabel": "Phase {n}/{total} — {title}",
    "boss.hintBtn": "💡 Indice <span class='cost'>−{cost} XP</span>",
    "boss.phaseStart": "▶ Phase {n}/{total} : {title}",
    "boss.hit": "💥 TOUCHÉ ! {name} perd {dmg} HP !",
    "boss.defeated": "🏆 {name} EST VAINCU !",
    "boss.xpGain": "✨ +{xp} XP",
    "boss.alreadyDone": "(déjà vaincu — pas de récompense, juste la gloire)",
    "boss.chooseOther": "→ Choisis un autre boss dans la liste.",
    "boss.blackbeltWon": "🖤 CEINTURE NOIRE OBTENUE — ton certificat t'attend dans le Profil !",
    "boss.blackbeltToast": "🖤 Certificat de Ceinture Noire débloqué → Profil",
    "boss.timeout": "⏰ Temps écoulé ! {taunt}",
    "boss.heartsLeft": "Il te reste {hearts} — la phase recommence.",
    "boss.ko": "💀 K.O. — {name} t'a terrassé.",
    "boss.koTaunt": "« Reviens quand tu seras plus rapide. »",

    // ── Certificat Ceinture Noire ──
    "cert.defaultName": "Ninja Anonyme",
    "cert.namePrompt": "Ton nom de ninja (il figurera sur le certificat) :",
    "cert.title": "CERTIFICAT DE CEINTURE NOIRE",
    "cert.line1": "La voie du shell reconnaît solennellement",
    "cert.line2": "pour avoir vaincu le SENSEI et prouvé sa maîtrise",
    "cert.line3": "des commandes, des pipes et des permissions Linux.",
    "cert.statRank": "RANG",
    "cert.statXp": "XP TOTAL",
    "cert.statBoss": "BOSS VAINCUS",
    "cert.statMissions": "MISSIONS",
    "cert.issuedOn": "Délivré le",
    "cert.sensei": "Le Sensei",
    "cert.dojoMaster": "Maître du Dojo",
    "cert.footer": "tommarcorelli.github.io/LinuxDojo  ·  « Tout est fichier. »",
    "cert.lockedToast": "🔒 Bats le Sensei (Salle des Boss) pour débloquer ton certificat.",
    "cert.shareText": "🥋 {name} vient de décrocher sa Ceinture Noire sur LinuxDojo !\nRang {rank} {icon} · {xp} XP\nhttps://tommarcorelli.github.io/LinuxDojo/",
    "cert.msgCopied": "📋 Message copié — colle-le où tu veux !",
    "cert.copyMsg": "Copie ton message :",
    "cert.download": "⬇️ Télécharger le certificat (PNG)",
    "cert.share": "📤 Partager",
    "cert.changeName": "✏️ Changer mon nom",
    "cert.setName": "✏️ Définir mon nom",
    "cert.lockTitle": "Certificat de Ceinture Noire",
    "cert.lockSub": "Termine l'examen du Sensei dans la <strong>Salle des Boss</strong> pour le débloquer et le partager.",
    "cert.goBoss": "⚔️ Aller défier le Sensei",

    // ── Page d'atterrissage (landing.html) ──
    "l.nav.source": "Code source ↗",
    "l.nav.play": "▶ Jouer",
    "l.hero.eyebrow": "visiteur@linuxdojo<span class=\"l-eyebrow-caret\">:~$</span> apprendre --gratuit",
    "l.hero.h1": "Apprends Linux.<br>Pour de <span class=\"grad\">vrai</span>.",
    "l.hero.sub": "Pas un PDF, pas une liste de commandes à réciter. Un vrai mini-shell simulé — pipes, variables, scripts — avec 60 missions scénarisées, des combats de boss, et une Ceinture Noire à décrocher.",
    "l.hero.start": "▶ Commencer gratuitement",
    "l.hero.source": "Voir le code source",
    "l.hero.note": "<strong>Aucune inscription. Aucune carte bancaire.</strong> Juste toi et un terminal.",
    "l.hero.termTitle": "visiteur@linuxdojo — bash",
    "l.stats.missions": "<b>60</b> missions",
    "l.stats.boss": "<b>6</b> combats de boss",
    "l.stats.infil": "<b>15</b> niveaux d'infiltration",
    "l.stats.challenges": "<b>20</b> défis chrono",
    "l.stats.katas": "<b>7</b> katas de vitesse",
    "l.stats.noAccount": "<b>0</b> compte requis",
    "l.stats.free": "<b>0 €</b> — gratuit",
    "l.stats.offline": "Fonctionne <b>hors-ligne</b> (PWA)",
    "l.modes.title": "Neuf façons d'apprendre le même shell",
    "l.modes.sub": "Une leçon qui ennuie, tu l'oublies. Un boss qui te met la pression, tu t'en souviens. LinuxDojo enchaîne les formats pour que la commande finisse par rentrer toute seule.",
    "l.mode.learn.t": "Apprendre",
    "l.mode.learn.d": "10 scénarios réalistes, 60 missions : leçon → exercice → explication. Indices à 3 paliers pour ne jamais rester bloqué.",
    "l.mode.learn.tag": "10 scénarios · 60 missions",
    "l.mode.explore.t": "Explorer",
    "l.mode.explore.d": "Un monde ouvert navigable en commandes : inventaire, PNJ, portes verrouillées, 3 gemmes à réunir.",
    "l.mode.explore.tag": "18 zones · Aventure",
    "l.mode.challenge.t": "Défis",
    "l.mode.challenge.d": "Un problème, une commande, un chrono. Enchaîne pour un combo jusqu'à ×5.",
    "l.mode.challenge.tag": "20 défis · Combo & record",
    "l.mode.bandit.t": "Infiltration",
    "l.mode.bandit.d": "Trouve le mot de passe caché. Fouille, filtre, décode (base64, ROT13, hex, double encodage).",
    "l.mode.bandit.tag": "Style Bandit · 15 niveaux",
    "l.mode.boss.t": "Salle des Boss",
    "l.mode.boss.d": "6 combats épiques en plusieurs phases, jusqu'à l'examen du Sensei. Bats-le pour débloquer ton certificat.",
    "l.mode.boss.tag": "6 boss · Ceinture Noire",
    "l.mode.kata.t": "Kata",
    "l.mode.kata.d": "La mémoire musculaire du shell : des enchaînements de vraies commandes à taper au chrono. WPM & précision.",
    "l.mode.kata.tag": "7 katas · Vitesse & record",
    "l.mode.sandbox.t": "Bac à sable",
    "l.mode.sandbox.d": "Terminal libre, sans objectif, avec ~50 commandes simulées et un système de fichiers explorable.",
    "l.mode.sandbox.tag": "Libre · Toutes commandes",
    "l.mode.profile.t": "Profil",
    "l.mode.profile.d": "Rangs, badges, objectifs, heatmap d'activité, thèmes déblocables — et un certificat téléchargeable.",
    "l.mode.profile.tag": "Rangs · Badges · Stats",
    "l.why.title": "Ce qui rend le shell simulé crédible",
    "l.why.sub": "Pas une commande sur cinq qui plante si tu changes l'ordre des arguments. Le moteur du jeu, c'est un vrai petit shell.",
    "l.why.manTitle": "Manuel de l'utilisateur",
    "l.why.name": "linuxdojo — apprendre Linux en jouant, pour de vrai",
    "l.why.synopsis": "Ouvre un navigateur. <code>Aucune inscription requise.</code>",
    "l.why.desc1": "Un vrai mini-shell : <code>pipes</code>, <code>redirections</code>, variables, substitution de commande, boucles <code>for</code>/<code>while</code>, conditions <code>if</code>/<code>test</code>, et exécution de scripts — pas une liste figée à mémoriser.",
    "l.why.desc2": "Chaque mission suit le même rituel : une leçon courte, un exercice dans le terminal, une explication. Trois paliers d'indices existent pour ne jamais rester bloqué longtemps.",
    "l.why.desc3": "Le parcours se termine (ou recommence) dans la Salle des Boss : six combats en plusieurs phases, jusqu'à l'examen du Sensei et la Ceinture Noire.",
    "l.why.desc4": "Installable en PWA, jouable hors-ligne, sauvegarde locale — sans compte, sans serveur, sans pub.",
    "l.why.seealso": "<a href=\"index.html\">Explorer(1)</a>, <a href=\"index.html\">Défis(1)</a>, <a href=\"index.html\">Infiltration(1)</a>, <a href=\"index.html\">Kata(1)</a>, <a href=\"index.html\">Glossaire(1)</a>",
    "l.cta.title": "Le prochain <span class=\"grad\">whoami</span> qui compte, c'est le tien.",
    "l.cta.sub": "Gratuit, open-source, sans compte. Trois minutes suffisent pour taper ta première commande.",
    "l.cta.start": "▶ Commencer gratuitement",
    "l.footer.lic": "LinuxDojo · Sous licence MIT",
    "l.footer.play": "Jouer",
    "l.footer.source": "Code source",
    "l.footer.contribute": "Contribuer",
    "l.footer.roadmap": "Roadmap",
    "l.footer.license": "Licence",
    "l.footer.discord": "Discord",
    "l.cta.discord": "💬 Rejoindre la communauté Discord",
    "boss.retry": "⚔️ Réessayer le combat",
    "boss.hintReveal": "💡 {hint}",
    "boss.lockedTag": "Bats {n} boss pour débloquer l'examen",
    "boss.metaPhases": "⚔️ {n} phases",
    "boss.doneChip": "✓ vaincu",
    "boss.achDefeated": "{name} vaincu !",
    "boss.achAgain": "Encore vaincu. Impitoyable.",

    // ── Profil ──
    "profile.cert": "🖤 Certificat de Ceinture Noire",
    "profile.objectives": "🎯 Objectifs",
    "profile.badges": "🏅 Badges",
    "profile.topCmds": "📊 Tes commandes les plus utilisées",
    "profile.activity": "🗓️ Ton activité",
    "profile.themes": "🎨 Thèmes",
    "profile.options": "⚙️ Options",
    "profile.name": "🥷 Mon nom de ninja",
    "profile.export": "📤 Exporter la sauvegarde",
    "profile.import": "📥 Importer",
    "profile.reset": "↺ Réinitialiser la progression",
    "profile.discord": "💬 Rejoindre le Discord",
    "profile.errLog": "🐛 Journal d'erreurs",
    "profile.errNone": "Aucune erreur détectée 👍",
    "profile.errCopy": "📋 Copier le rapport",
    "profile.errClear": "🗑️ Vider le journal",

    // ── Bac à sable ──
    "sandbox.title": "🧪 Bac à sable",
    "sandbox.intro": "Terminal libre. Aucun objectif — expérimente toutes les commandes. Tape <code style=\"color:var(--orange)\">help</code> pour la liste.",
    "sandbox.reset": "↺ Réinitialiser",
    "sandbox.placeholder": "ls, cat, grep, base64, rot13, sed, awk...",

    // ── Glossaire ──
    "glossary.title": "📖 Glossaire des commandes",
    "glossary.intro": "La référence complète. Clique sur une commande pour voir sa syntaxe, ses options et des exemples.",
    "glossary.search": "🔍 Rechercher une commande (ls, grep, permissions...)",
    "glossary.searchAria": "Rechercher une commande dans le glossaire",
    "glossary.noResult": "Aucune commande trouvée.",

    // ── Modale défi du jour ──
    "daily.reward": "+50 XP bonus",
    "daily.title": "🎯 Défi du jour",
    "daily.placeholder": "tape ta commande...",
    "daily.close": "Fermer",

    // ── Modale succès ──
    "win.title": "Mission accomplie !",
    "win.whyLabel": "POURQUOI ÇA A MARCHÉ",
    "win.next": "Suite →",
    "win.stay": "Rester ici",

    // ── Modale infiltration réussie ──
    "banditWin.title": "Mot de passe trouvé !",
    "banditWin.next": "Niveau suivant →",
    "banditWin.stay": "Rester",

    // ── Modale quiz ──
    "quiz.close": "Fermer",
    "quiz.title": "🎓 Quiz — {chapter}",
    "quiz.progress": "Question {n}/{total}",
    "quiz.perfect": "🏆 Sans faute ! Bonus +25 XP",
    "quiz.good": "👍 Bien joué !",
    "quiz.retry": "📚 Revois le chapitre et retente !",

    // ── Modale raccourcis clavier ──
    "shortcuts.title": "⌨️ Raccourcis clavier",
    "shortcuts.intro": "Valables dans n'importe quel terminal du dojo (Apprendre, Bac à sable, Défis, Infiltration…).",
    "shortcuts.tab": "Autocomplétion — commandes et chemins de fichiers",
    "shortcuts.up": "Commande précédente dans l'historique",
    "shortcuts.down": "Commande suivante dans l'historique",
    "shortcuts.ctrlr": "Recherche inversée dans l'historique (façon bash) — tape pour filtrer, Ctrl+R pour le résultat précédent, Entrée pour lancer, Échap pour annuler. <em>(Apprendre, Bac à sable, Exploration)</em>",
    "shortcuts.enter": "Exécuter la commande",
    "shortcuts.esc": "Fermer la fenêtre ouverte (indice, quiz, victoire…)",
    "shortcuts.help": "Afficher / masquer cet écran",
    "shortcuts.tip": "💡 Tape <code>help</code> dans un terminal pour la liste des commandes, ou <code>man &lt;commande&gt;</code> pour le détail d'une seule.",
    "shortcuts.close": "Fermer",

    // ── Bannières ──
    "update.text": "Une nouvelle version du dojo est prête.",
    "update.reload": "Recharger",
    "update.later": "Plus tard",
    "multitab.text": "Ta progression a changé dans un autre onglet.",
    "multitab.reload": "Recharger",
    "multitab.ignore": "Ignorer",

    // ── Badges (générés en JS) ──
    "badge.unlocked": "Badge débloqué !",
    "badge.unlockedToast": "🏅 Badge débloqué : {label}",
    // ── Objectifs (générés en JS) ──
    "obj.achieved": "Objectif : {title}",
    "obj.toast": "{icon} Objectif accompli : {title} (+{xp} XP)",
    // ── Événements saisonniers ──
    "season.event": "Événement {name}",
    "season.close": "Fermer la bannière",
    "season.secret": "Secret saisonnier débloqué ! +100 XP",

    // ── Rangs (générés en JS) ──
    "rank.new": "Nouveau rang : {name}",
    "rank.reached": "Tu as atteint {xp} XP !",
    "profile.rankSub": "{xp} XP · Niveau {lv}",
    "sound.on": "🔊 Son : ON",
    "sound.off": "🔇 Son : OFF",
  },

  en: {
    // ── Navigation ──
    "nav.hamburger": "Open navigation menu",
    "nav.home": "Home",
    "nav.learn": "Learn",
    "nav.explore": "Explore",
    "nav.challenge": "Challenges",
    "nav.bandit": "Infiltration",
    "nav.boss": "⚔️ Boss",
    "nav.kata": "🥋 Kata",
    "nav.sandbox": "Sandbox",
    "nav.glossary": "Glossary",
    "nav.profile": "Profile",
    "nav.shortcuts": "Keyboard shortcuts (?)",
    "nav.shortcutsAria": "Show keyboard shortcuts",
    "nav.sound": "Sound on/off",
    "nav.soundAria": "Toggle sound",
    "nav.lang": "Changer de langue / Switch language",

    // ── Home: daily banner ──
    "daily.banner.title": "Daily challenge",
    "daily.banner.sub": "Solve the daily challenge for +50 bonus XP",
    "daily.banner.btn": "Take the challenge",

    // ── Home: hero ──
    "hero.badge": "Terminal · Linux · Hacking",
    "hero.sub": "Learn Linux like a pro.<br>By playing. For real.",
    "hero.start": "▶ Start",
    "hero.exploreWorld": "🗺 Explore the world",

    // ── Home: mode cards ──
    "mode.learn.title": "Learn",
    "mode.learn.desc": "Lessons + real scenarios. You understand why before you type.",
    "mode.learn.tag": "10 scenarios · 60 missions",
    "mode.explore.title": "Explore",
    "mode.explore.desc": "An open world: inventory, NPCs, locked doors. Collect the 3 gems.",
    "mode.explore.tag": "18 zones · Adventure",
    "mode.challenge.title": "Challenges",
    "mode.challenge.desc": "One problem, one command, one timer. Chain them for a combo up to x5.",
    "mode.challenge.tag": "20 challenges · Combo & record",
    "mode.bandit.title": "Infiltration",
    "mode.bandit.desc": "Find the hidden password. Search, filter, and decode (base64, ROT13, hex).",
    "mode.bandit.tag": "Bandit-style · 15 levels",
    "mode.boss.title": "Boss Room",
    "mode.boss.desc": "Face the Kraken, the Wraith, the Hydra, the Golem… and the Sensei. HP, hearts, timer.",
    "mode.boss.tag": "6 bosses · Black Belt",
    "mode.kata.title": "Kata",
    "mode.kata.desc": "Shell muscle memory: type command sequences against the clock. WPM & accuracy.",
    "mode.kata.tag": "7 katas · Speed & record",
    "mode.sandbox.title": "Sandbox",
    "mode.sandbox.desc": "A free terminal, no objective. Try every command at your own pace.",
    "mode.sandbox.tag": "Free · All commands",
    "mode.profile.title": "Profile",
    "mode.profile.desc": "Your progress, your 8 ranks, your badges and your favorite commands.",
    "mode.profile.tag": "Ranks · Badges · Stats",

    // ── Home: objectives + stats ──
    "home.objectives": "🎯 Objectives",
    "home.stat.xp": "Total XP",
    "home.stat.done": "Missions",
    "home.stat.lv": "Level",
    "home.stat.badges": "Badges",

    // ── Learn ──
    "learn.scenarios": "Scenarios",
    "lesson.stepBadge": "📖 Lesson",
    "lesson.label.syntax": "SYNTAX",
    "lesson.label.options": "OPTIONS",
    "lesson.label.examples": "EXAMPLES",
    "lesson.goExercise": "Got it — Let me try →",
    "mission.backLesson": "← Lesson",
    "mission.hint": "💡 Hint <span class=\"cost free\">free</span>",
    "term.placeholder": "type a command...",
    "term.cmdAria": "Terminal command line",
    "term.runAria": "Run command",

    // ── Explore ──
    "explore.tab.world": "🗺️ World",
    "explore.tab.term": "💻 Terminal",
    "explore.location": "🌍 The World",
    "explore.placeholder": "ls, cd, cat, read...",
    "explore.welcome": "🌌 Welcome to the Linux World.",
    "explore.commands": "Commands: ls · ls -la · cd · cat · map · inv · take · use · talk · help",
    "explore.loaded": "(progress loaded — type 'inv' to see your bag)",
    "explore.empty": "(empty)",
    "explore.cdUnknown": "cd: {t}: No such place",
    "explore.catMissing": "{cmd}: missing file name",
    "explore.catNotFound": "{cmd}: {f}: File not found",
    "explore.findNone": "(no results)",
    "explore.grepUsage": "grep: usage: grep PATTERN FILE",
    "explore.grepNotFound": "grep: {f}: not found",
    "explore.grepNoMatch": "(no match)",
    "explore.bagEmpty": "🎒 Your bag is empty.",
    "explore.inventory": "🎒 INVENTORY:",
    "explore.canTake": "Here you can pick up: {emoji} (take {id})",
    "explore.nothingTake": "Nothing to pick up here.",
    "explore.dontHave": "You don't have '{id}' in your bag.",
    "explore.useItem": "You use {item}. {effect}",
    "explore.noNpc": "There's no one to talk to here.",
    "explore.npcLine": "   \"{line}\"",
    "explore.unknownCmd": "{cmd}: unknown command. Type 'help'.",
    "explore.secretFound": "✨ Secret discovered! +{xp} XP",
    "explore.masterTitle": "MASTER EXPLORER",
    "explore.masterSub": "You gathered the 3 gems and conquered the world!",
    "explore.alreadyHave": "You already have {item}.",
    "explore.itemGot": "🎒 Item obtained: {item}",
    "explore.gems": "💎 Gems gathered: {n}/3",
    "explore.gemsAll": "→ Return to the Nexus and open the Final Chest! (cd / then cd coffre_final)",
    "explore.mapTitle": "🗺️  WORLD MAP",
    "explore.mapUnknown": "??? (unexplored)",
    "explore.youHere": "  ← you are here",
    "explore.goUp": "↑ Go up (cd ..)",
    "explore.talkTo": "💬 Talk to {name}",
    "explore.help.title": "Explorer commands:",
    "explore.help.ls": "  ls / ls -la   — look around (hidden with -la)",
    "explore.help.cd": "  cd <place>    — move   ·   cd ..  go up",
    "explore.help.cat": "  cat <file>    — read a file",
    "explore.help.map": "  map           — map of visited places",
    "explore.help.inv": "  inv           — your inventory",
    "explore.help.take": "  take <item>   — pick up an item",
    "explore.help.use": "  use <item>    — use an item",
    "explore.help.talk": "  talk          — talk to the character here",
    "explore.help.search": "  find / grep   — search",
    "explore.fx.lampe": "A warm light surrounds you.",
    "explore.fx.masque": "You breathe underwater with ease.",
    "explore.fx.cle_argent": "A metallic clink echoes.",
    "explore.fx.herbe": "A soothing scent wafts from it.",
    "explore.fx.potion": "An invigorating freshness runs through you.",
    "explore.fx.trident": "You feel powerful.",
    "explore.fx.savoir": "Knowledge fills your mind.",
    "explore.fx.default": "Nothing special happens.",

    // ── Challenges ──
    "challenge.expected": "EXPECTED OUTPUT",
    "challenge.skip": "Skip →",
    "challenge.placeholder": "type your command...",
    "challenge.header": "⚡ Challenge {n}/{total} — {cat}",
    "challenge.num": "Challenge {n}",
    "challenge.combo": "🔥 Combo x{n}",
    "challenge.best": "★ Best: {best} pts  ·  Score: {score}",
    "challenge.success": "✅ Success! +{xp} XP",
    "challenge.comboSuffix": "  (combo x{m}!)",
    "challenge.allDone": "🏆 All challenges complete!",
    "challenge.timeout": "⏰ Time's up! Solution: {sol}",

    // ── Kata ──
    "kata.introTitle": "🥋 Kata — shell muscle memory",
    "kata.introText": "Type each command as fast and accurately as possible. One kata = 8 commands. We measure your speed (WPM) and accuracy. Repeat, and your fingers will learn the way.",
    "kata.record": "★ Best: {score} ({wpm} WPM · {acc}%)",
    "kata.never": "Never attempted",
    "kata.quit": "✕ Quit",
    "kata.playPlaceholder": "type the command above...",
    "kata.playHint": "Enter or full typing to validate · Esc to quit",
    "kata.newRecord": "★ NEW RECORD",
    "kata.accuracy": "Accuracy",
    "kata.time": "Time",
    "kata.perfectSuffix": "  ·  flawless!",
    "kata.again": "↻ Redo this kata",
    "kata.others": "Other katas",
    "kata.gradePerfect": "PERFECT 🏆",
    "kata.gradeMaster": "Master 🥋",
    "kata.gradeBrown": "Brown Belt",
    "kata.gradeGreen": "Green Belt",
    "kata.gradeWhite": "White Belt",

    // ── Daily challenge (banner + modal, JS-generated) ──
    "daily.banner.doneSub": "Come back tomorrow for a new challenge.",
    "daily.banner.doneBtn": "Replay",
    "daily.banner.todoSub": "Solve the {day} challenge for +50 bonus XP.",
    "daily.banner.todoBtn": "Take the challenge",
    "daily.streakChip": "🔥 {n} d",
    "daily.streakDate": "  ·  🔥 {n} d",
    "daily.doneToday": "✓ Done today",
    "daily.retrain": "You can replay it to practice (no reward).",
    "daily.hiddenHintDone": "Hidden tip: {hint}",
    "daily.hiddenHintTodo": "Hidden tip: click the title 3 times to reveal the hint",
    "daily.hintReveal": "💡 {hint}",
    "daily.success": "✅ Daily challenge solved! +{gain} XP",
    "daily.successStreakBonus": "  (streak 🔥{streak} → +{bonus} bonus)",
    "daily.successBonus": " bonus",
    "daily.successBox": "🎉 Well done! {streak}Come back tomorrow to keep it going.",
    "daily.successBoxStreak": "🔥{streak}-day streak! ",
    "daily.achStreak": "{streak}-day streak",
    "daily.achTitle": "Daily challenge",
    "daily.alreadyToday": "✅ Correct! (already solved today)",
    "daily.shareTitle": "LinuxDojo — Challenge #{n}",
    "daily.shareStreak": "🔥 {streak}-day streak",
    "daily.shareBtn": "📋 Share my result",
    "daily.copied": "📋 Result copied — paste it anywhere!",
    "daily.copyPrompt": "Copy your result:",

    // ── Infiltration ──
    "bandit.usefulCmds": "USEFUL COMMANDS",
    "bandit.placeholder": "explore and find the password...",
    "bandit.story": "You've infiltrated the server of a shadowy organization. Each level hides the password to the next. Search, filter, decode — and leave no trace.",
    "bandit.explore": "Explore the filesystem. Find the password to move to the next level.",
    "bandit.level": "Level {n}",
    "bandit.found": "Password found: {pw}\n\n+{xp} XP",

    // ── Boss ──
    "boss.roomTitle": "⚔️ Boss Room",
    "boss.roomIntro": "Every correct command deals damage.<br>Timer runs out = you lose a heart. 3 hearts, not one more.",
    "boss.nameDefault": "Boss Room",
    "boss.flee": "🏃 Flee",
    "boss.hint": "💡 Hint <span class=\"cost\">−10 XP</span>",
    "boss.placeholder": "strike with the right command...",
    "boss.idleName": "Boss Room",
    "boss.idleTag": "Choose your opponent. Every correct command deals damage. Timer runs out = you lose a heart.",
    "boss.idleDesc": "The bosses won't wait forever...",
    "boss.idleTerm": "⚔️  BOSS ROOM — select an opponent to start the fight.",
    "boss.appears": "⚔️  {name} appears!",
    "boss.phaseLabel": "Phase {n}/{total} — {title}",
    "boss.hintBtn": "💡 Hint <span class='cost'>−{cost} XP</span>",
    "boss.phaseStart": "▶ Phase {n}/{total}: {title}",
    "boss.hit": "💥 HIT! {name} loses {dmg} HP!",
    "boss.defeated": "🏆 {name} IS DEFEATED!",
    "boss.xpGain": "✨ +{xp} XP",
    "boss.alreadyDone": "(already defeated — no reward, just the glory)",
    "boss.chooseOther": "→ Choose another boss from the list.",
    "boss.blackbeltWon": "🖤 BLACK BELT EARNED — your certificate awaits in your Profile!",
    "boss.blackbeltToast": "🖤 Black Belt Certificate unlocked → Profile",
    "boss.timeout": "⏰ Time's up! {taunt}",
    "boss.heartsLeft": "You have {hearts} left — the phase restarts.",
    "boss.ko": "💀 K.O. — {name} defeated you.",
    "boss.koTaunt": "\"Come back when you're faster.\"",

    // ── Black Belt certificate ──
    "cert.defaultName": "Anonymous Ninja",
    "cert.namePrompt": "Your ninja name (it will appear on the certificate):",
    "cert.title": "BLACK BELT CERTIFICATE",
    "cert.line1": "The way of the shell solemnly recognizes",
    "cert.line2": "for defeating the SENSEI and proving mastery",
    "cert.line3": "of Linux commands, pipes and permissions.",
    "cert.statRank": "RANK",
    "cert.statXp": "TOTAL XP",
    "cert.statBoss": "BOSSES DEFEATED",
    "cert.statMissions": "MISSIONS",
    "cert.issuedOn": "Issued on",
    "cert.sensei": "The Sensei",
    "cert.dojoMaster": "Dojo Master",
    "cert.footer": "tommarcorelli.github.io/LinuxDojo  ·  \"Everything is a file.\"",
    "cert.lockedToast": "🔒 Beat the Sensei (Boss Room) to unlock your certificate.",
    "cert.shareText": "🥋 {name} just earned their Black Belt on LinuxDojo!\nRank {rank} {icon} · {xp} XP\nhttps://tommarcorelli.github.io/LinuxDojo/",
    "cert.msgCopied": "📋 Message copied — paste it anywhere!",
    "cert.copyMsg": "Copy your message:",
    "cert.download": "⬇️ Download the certificate (PNG)",
    "cert.share": "📤 Share",
    "cert.changeName": "✏️ Change my name",
    "cert.setName": "✏️ Set my name",
    "cert.lockTitle": "Black Belt Certificate",
    "cert.lockSub": "Complete the Sensei's exam in the <strong>Boss Room</strong> to unlock and share it.",
    "cert.goBoss": "⚔️ Go challenge the Sensei",

    // ── Landing page (landing.html) ──
    "l.nav.source": "Source code ↗",
    "l.nav.play": "▶ Play",
    "l.hero.eyebrow": "visitor@linuxdojo<span class=\"l-eyebrow-caret\">:~$</span> learn --free",
    "l.hero.h1": "Learn Linux.<br>For <span class=\"grad\">real</span>.",
    "l.hero.sub": "Not a PDF, not a list of commands to recite. A real simulated mini-shell — pipes, variables, scripts — with 60 scripted missions, boss fights, and a Black Belt to earn.",
    "l.hero.start": "▶ Start for free",
    "l.hero.source": "View the source code",
    "l.hero.note": "<strong>No sign-up. No credit card.</strong> Just you and a terminal.",
    "l.hero.termTitle": "visitor@linuxdojo — bash",
    "l.stats.missions": "<b>60</b> missions",
    "l.stats.boss": "<b>6</b> boss fights",
    "l.stats.infil": "<b>15</b> infiltration levels",
    "l.stats.challenges": "<b>20</b> timed challenges",
    "l.stats.katas": "<b>7</b> speed katas",
    "l.stats.noAccount": "<b>0</b> account required",
    "l.stats.free": "<b>$0</b> — free",
    "l.stats.offline": "Works <b>offline</b> (PWA)",
    "l.modes.title": "Nine ways to learn the same shell",
    "l.modes.sub": "A boring lesson, you forget it. A boss that piles on the pressure, you remember it. LinuxDojo chains formats so the command finally sticks on its own.",
    "l.mode.learn.t": "Learn",
    "l.mode.learn.d": "10 realistic scenarios, 60 missions: lesson → exercise → explanation. 3-tier hints so you're never stuck.",
    "l.mode.learn.tag": "10 scenarios · 60 missions",
    "l.mode.explore.t": "Explore",
    "l.mode.explore.d": "An open world navigated by commands: inventory, NPCs, locked doors, 3 gems to collect.",
    "l.mode.explore.tag": "18 zones · Adventure",
    "l.mode.challenge.t": "Challenges",
    "l.mode.challenge.d": "One problem, one command, one timer. Chain them for a combo up to ×5.",
    "l.mode.challenge.tag": "20 challenges · Combo & record",
    "l.mode.bandit.t": "Infiltration",
    "l.mode.bandit.d": "Find the hidden password. Search, filter, decode (base64, ROT13, hex, double encoding).",
    "l.mode.bandit.tag": "Bandit-style · 15 levels",
    "l.mode.boss.t": "Boss Room",
    "l.mode.boss.d": "6 epic multi-phase fights, up to the Sensei's exam. Beat him to unlock your certificate.",
    "l.mode.boss.tag": "6 bosses · Black Belt",
    "l.mode.kata.t": "Kata",
    "l.mode.kata.d": "Shell muscle memory: sequences of real commands to type against the clock. WPM & accuracy.",
    "l.mode.kata.tag": "7 katas · Speed & record",
    "l.mode.sandbox.t": "Sandbox",
    "l.mode.sandbox.d": "A free terminal, no objective, with ~50 simulated commands and an explorable filesystem.",
    "l.mode.sandbox.tag": "Free · All commands",
    "l.mode.profile.t": "Profile",
    "l.mode.profile.d": "Ranks, badges, objectives, activity heatmap, unlockable themes — and a downloadable certificate.",
    "l.mode.profile.tag": "Ranks · Badges · Stats",
    "l.why.title": "What makes the simulated shell believable",
    "l.why.sub": "Not one command in five that breaks if you change the argument order. The game engine is a real little shell.",
    "l.why.manTitle": "User manual",
    "l.why.name": "linuxdojo — learn Linux by playing, for real",
    "l.why.synopsis": "Open a browser. <code>No sign-up required.</code>",
    "l.why.desc1": "A real mini-shell: <code>pipes</code>, <code>redirections</code>, variables, command substitution, <code>for</code>/<code>while</code> loops, <code>if</code>/<code>test</code> conditions, and script execution — not a frozen list to memorize.",
    "l.why.desc2": "Every mission follows the same ritual: a short lesson, an exercise in the terminal, an explanation. Three hint tiers exist so you're never stuck for long.",
    "l.why.desc3": "The journey ends (or restarts) in the Boss Room: six multi-phase fights, up to the Sensei's exam and the Black Belt.",
    "l.why.desc4": "Installable as a PWA, playable offline, local save — no account, no server, no ads.",
    "l.why.seealso": "<a href=\"index.html\">Explore(1)</a>, <a href=\"index.html\">Challenges(1)</a>, <a href=\"index.html\">Infiltration(1)</a>, <a href=\"index.html\">Kata(1)</a>, <a href=\"index.html\">Glossary(1)</a>",
    "l.cta.title": "The next <span class=\"grad\">whoami</span> that matters is yours.",
    "l.cta.sub": "Free, open-source, no account. Three minutes is enough to type your first command.",
    "l.cta.start": "▶ Start for free",
    "l.footer.lic": "LinuxDojo · MIT licensed",
    "l.footer.play": "Play",
    "l.footer.source": "Source code",
    "l.footer.contribute": "Contribute",
    "l.footer.roadmap": "Roadmap",
    "l.footer.license": "License",
    "l.footer.discord": "Discord",
    "l.cta.discord": "💬 Join the Discord community",
    "boss.retry": "⚔️ Retry the fight",
    "boss.hintReveal": "💡 {hint}",
    "boss.lockedTag": "Beat {n} bosses to unlock the exam",
    "boss.metaPhases": "⚔️ {n} phases",
    "boss.doneChip": "✓ defeated",
    "boss.achDefeated": "{name} defeated!",
    "boss.achAgain": "Defeated again. Ruthless.",

    // ── Profile ──
    "profile.cert": "🖤 Black Belt Certificate",
    "profile.objectives": "🎯 Objectives",
    "profile.badges": "🏅 Badges",
    "profile.topCmds": "📊 Your most-used commands",
    "profile.activity": "🗓️ Your activity",
    "profile.themes": "🎨 Themes",
    "profile.options": "⚙️ Options",
    "profile.name": "🥷 My ninja name",
    "profile.export": "📤 Export save",
    "profile.import": "📥 Import",
    "profile.reset": "↺ Reset progress",
    "profile.discord": "💬 Join the Discord",
    "profile.errLog": "🐛 Error log",
    "profile.errNone": "No errors detected 👍",
    "profile.errCopy": "📋 Copy report",
    "profile.errClear": "🗑️ Clear log",

    // ── Sandbox ──
    "sandbox.title": "🧪 Sandbox",
    "sandbox.intro": "Free terminal. No objective — experiment with every command. Type <code style=\"color:var(--orange)\">help</code> for the list.",
    "sandbox.reset": "↺ Reset",
    "sandbox.placeholder": "ls, cat, grep, base64, rot13, sed, awk...",

    // ── Glossary ──
    "glossary.title": "📖 Command glossary",
    "glossary.intro": "The complete reference. Click a command to see its syntax, options and examples.",
    "glossary.search": "🔍 Search a command (ls, grep, permissions...)",
    "glossary.searchAria": "Search a command in the glossary",
    "glossary.noResult": "No command found.",

    // ── Daily challenge modal ──
    "daily.reward": "+50 bonus XP",
    "daily.title": "🎯 Daily challenge",
    "daily.placeholder": "type your command...",
    "daily.close": "Close",

    // ── Win modal ──
    "win.title": "Mission complete!",
    "win.whyLabel": "WHY IT WORKED",
    "win.next": "Next →",
    "win.stay": "Stay here",

    // ── Infiltration win modal ──
    "banditWin.title": "Password found!",
    "banditWin.next": "Next level →",
    "banditWin.stay": "Stay",

    // ── Quiz modal ──
    "quiz.close": "Close",
    "quiz.title": "🎓 Quiz — {chapter}",
    "quiz.progress": "Question {n}/{total}",
    "quiz.perfect": "🏆 Flawless! +25 XP bonus",
    "quiz.good": "👍 Well done!",
    "quiz.retry": "📚 Review the chapter and try again!",

    // ── Keyboard shortcuts modal ──
    "shortcuts.title": "⌨️ Keyboard shortcuts",
    "shortcuts.intro": "Valid in any dojo terminal (Learn, Sandbox, Challenges, Infiltration…).",
    "shortcuts.tab": "Autocomplete — commands and file paths",
    "shortcuts.up": "Previous command in history",
    "shortcuts.down": "Next command in history",
    "shortcuts.ctrlr": "Reverse search in history (bash-style) — type to filter, Ctrl+R for the previous match, Enter to run, Esc to cancel. <em>(Learn, Sandbox, Explore)</em>",
    "shortcuts.enter": "Run the command",
    "shortcuts.esc": "Close the open window (hint, quiz, win…)",
    "shortcuts.help": "Show / hide this screen",
    "shortcuts.tip": "💡 Type <code>help</code> in a terminal for the command list, or <code>man &lt;command&gt;</code> for the details of a single one.",
    "shortcuts.close": "Close",

    // ── Banners ──
    "update.text": "A new version of the dojo is ready.",
    "update.reload": "Reload",
    "update.later": "Later",
    "multitab.text": "Your progress changed in another tab.",
    "multitab.reload": "Reload",
    "multitab.ignore": "Ignore",

    // ── Badges (JS-generated) ──
    "badge.unlocked": "Badge unlocked!",
    "badge.unlockedToast": "🏅 Badge unlocked: {label}",
    // ── Objectives (JS-generated) ──
    "obj.achieved": "Objective: {title}",
    "obj.toast": "{icon} Objective complete: {title} (+{xp} XP)",
    // ── Seasonal events ──
    "season.event": "{name} event",
    "season.close": "Close the banner",
    "season.secret": "Seasonal secret unlocked! +100 XP",

    // ── Ranks (JS-generated) ──
    "rank.new": "New rank: {name}",
    "rank.reached": "You reached {xp} XP!",
    "profile.rankSub": "{xp} XP · Level {lv}",
    "sound.on": "🔊 Sound: ON",
    "sound.off": "🔇 Sound: OFF",
  },
};

// ── Traduction d'une chaîne d'interface ─────────────────────────
// t("clé") → traduction dans LANG, repli sur FR, puis sur la clé
// elle-même (visible = signale une clé manquante sans planter).
// Interpolation optionnelle : t("rank.new", { name: "Root" }).
function t(key, vars) {
  let s = (UI[LANG] && UI[LANG][key]) ?? UI.fr[key] ?? key;
  if (vars) for (const k in vars) s = s.split("{" + k + "}").join(vars[k]);
  return s;
}

// ── Sélection d'un champ de contenu multilingue ─────────────────
// pick({ fr, en }) → variante de la langue courante (repli FR).
// pick("texte") → renvoie le texte tel quel (contenu non encore
// traduit : dégradation propre, rien à casser).
function pick(v) {
  if (v && typeof v === "object" && !Array.isArray(v) && ("fr" in v || "en" in v)) {
    return v[LANG] ?? v.fr ?? v.en ?? "";
  }
  return v;
}

// Nom de rang traduit (RANKS.name peut être une chaîne ou un { fr, en }).
function rankName(rank) { return rank ? pick(rank.name) : ""; }

// Bilingue inline pour les nombreuses sorties dynamiques du shell simulé
// (terminal.js) : sh("texte FR", "EN text") → la variante de la langue courante.
// Évite d'inventer ~150 clés pour des chaînes uniques et interpolées ; les deux
// langues restent lisibles au point d'appel. Repli FR si l'EN est absent.
function sh(fr, en) { return LANG === "en" ? (en != null ? en : fr) : fr; }

// ── Overlays de contenu EN (Phase B) ────────────────────────────
// Le contenu (missions, glossaire...) reste défini en français dans ses
// fichiers d'origine. Les traductions anglaises vivent dans des fichiers
// séparés `js/i18n/*.en.js`, chargés juste APRÈS le fichier source FR, qui
// fournissent les textes par identifiant et appellent le helper de fusion
// ci-dessous. La fusion n'a lieu que si LANG === "en" : en français, rien
// n'est chargé ni modifié. Les fichiers FR restent donc la source de vérité
// et l'anglais est purement additif (aucun risque pour l'existant).
function _ov(target, key, val) { if (val != null && target != null) target[key] = val; }

// Applique un overlay EN sur CHAPTERS (levels.js). `byId` est indexé par id
// de chapitre : { [chapId]: { title, scenario, missions: { [missId]: {...} } } }.
// Chaque mission peut redéfinir name/desc/hint/explanation et, dans lesson,
// title/intro/syntax/tip ainsi que les tableaux options (desc par index) et
// examples (comment par index) — le reste (cmd, flag, xp, fs, check) est
// inchangé, car indépendant de la langue.
function overlayLevels(byId) {
  if (LANG !== "en" || typeof CHAPTERS === "undefined") return;
  for (const ch of CHAPTERS) {
    const co = byId[ch.id];
    if (!co) continue;
    _ov(ch, "title", co.title);
    _ov(ch, "scenario", co.scenario);
    if (!co.missions) continue;
    for (const m of ch.missions) {
      const mo = co.missions[m.id];
      if (!mo) continue;
      _ov(m, "name", mo.name);
      _ov(m, "desc", mo.desc);
      _ov(m, "hint", mo.hint);
      _ov(m, "explanation", mo.explanation);
      if (mo.lesson && m.lesson) {
        const L = m.lesson, lo = mo.lesson;
        _ov(L, "title", lo.title);
        _ov(L, "intro", lo.intro);
        _ov(L, "syntax", lo.syntax);
        _ov(L, "tip", lo.tip);
        if (lo.options && L.options) lo.options.forEach((d, i) => { if (d != null && L.options[i]) L.options[i].desc = d; });
        if (lo.examples && L.examples) lo.examples.forEach((c, i) => { if (c != null && L.examples[i]) L.examples[i].comment = c; });
      }
    }
  }
}

// Applique un overlay EN sur QUIZZES (quizzes.js). `byId` est indexé par id
// de chapitre, chaque valeur étant un tableau parallèle de { q, options }.
// La bonne réponse (answer) ne change pas : c'est un indice, indépendant de
// la langue. On fusionne question et libellés d'options par index.
function overlayQuizzes(byId) {
  if (LANG !== "en" || typeof QUIZZES === "undefined") return;
  for (const chId in byId) {
    const src = QUIZZES[chId], ov = byId[chId];
    if (!src || !ov) continue;
    ov.forEach((o, i) => {
      if (!o || !src[i]) return;
      _ov(src[i], "q", o.q);
      if (o.options && src[i].options) o.options.forEach((opt, j) => { if (opt != null && src[i].options[j] != null) src[i].options[j] = opt; });
    });
  }
}

// Applique un overlay EN sur GLOSSARY (glossary.js). `byCmd` est indexé par
// nom de commande, chaque valeur : { desc, syntax, options:[...], examples:[...] }
// où options/examples sont des tableaux du 2e élément de chaque paire
// [flag, desc] / [cmd, desc] (le 1er élément — flag ou commande — est neutre).
// IMPORTANT : on NE traduit PAS `cat`, qui reste la clé de filtrage FR ; seul
// son LIBELLÉ affiché est traduit à part par glossCat() (voir ci-dessous).
function overlayGlossary(byCmd) {
  if (LANG !== "en" || typeof GLOSSARY === "undefined") return;
  for (const entry of GLOSSARY) {
    const ov = byCmd[entry.cmd];
    if (!ov) continue;
    _ov(entry, "desc", ov.desc);
    _ov(entry, "syntax", ov.syntax);
    if (ov.options && entry.options) ov.options.forEach((d, i) => { if (d != null && entry.options[i]) entry.options[i][1] = d; });
    if (ov.examples && entry.examples) ov.examples.forEach((d, i) => { if (d != null && entry.examples[i]) entry.examples[i][1] = d; });
  }
}

// Libellé traduit d'une catégorie de glossaire. La catégorie reste stockée en
// français partout (clé de filtrage) ; seul l'affichage passe par ici.
const GLOSS_CATS_EN = {
  "Tout": "All",
  "Navigation": "Navigation",
  "Fichiers": "Files",
  "Recherche": "Search",
  "Permissions & Système": "Permissions & System",
  "Réseau & Archives": "Network & Archives",
  "Texte & Décodage": "Text & Decoding",
  "Scripting": "Scripting",
  "Git": "Git",
  "Aide": "Help",
};
function glossCat(c) { return LANG === "en" ? (GLOSS_CATS_EN[c] || c) : c; }

// Overlay générique pour les modes annexes : un tableau d'objets identifiés
// par `id`, dont on remplace certains champs texte plats. `byId` = { [id]:
// { champ: "traduction", ... } }. `fields` = liste des champs à traduire.
// Ne touche à rien en français ; les champs absents de l'overlay sont laissés.
function overlayArray(arr, byId, fields) {
  if (LANG !== "en" || !Array.isArray(arr)) return;
  for (const item of arr) {
    const ov = byId[item.id];
    if (!ov) continue;
    for (const f of fields) _ov(item, f, ov[f]);
  }
}

// Variante par INDEX pour les tableaux sans `id` (ex: DAILY_POOL, dont l'entrée
// du jour est choisie par position). `ovArr` est un tableau parallèle : ovArr[i]
// fournit les champs traduits de arr[i].
function overlayIndexed(arr, ovArr, fields) {
  if (LANG !== "en" || !Array.isArray(arr) || !Array.isArray(ovArr)) return;
  arr.forEach((item, i) => {
    const ov = ovArr[i];
    if (!ov) return;
    for (const f of fields) _ov(item, f, ov[f]);
  });
}

// Locale de formatage des dates selon la langue courante (toLocaleDateString).
function dateLocale() { return LANG === "en" ? "en-US" : "fr-FR"; }

// Applique un overlay EN sur WORLD (gameshell.js / mode Explorer). `byPath`
// indexé par chemin de zone : { name, desc, lockedMsg, requiresMsg,
// files:{ nomFichier: contenu }, npc:{ name, lines:[...] }, item:{ name } }.
// Les CLÉS de fichiers, les `dirs`, item.id et emoji restent inchangés (le
// joueur les tape / ils sont neutres). overlayWorld agit si LANG === "en".
function overlayWorld(byPath) {
  if (LANG !== "en" || typeof WORLD === "undefined") return;
  for (const path in byPath) {
    const z = WORLD[path], ov = byPath[path];
    if (!z || !ov) continue;
    for (const f of ["name", "desc", "lockedMsg", "requiresMsg"]) _ov(z, f, ov[f]);
    if (ov.files && z.files) for (const fn in ov.files) { if (z.files[fn] != null) z.files[fn] = ov.files[fn]; }
    if (ov.npc && z.npc) {
      _ov(z.npc, "name", ov.npc.name);
      if (Array.isArray(ov.npc.lines) && Array.isArray(z.npc.lines)) {
        ov.npc.lines.forEach((ln, i) => { if (ln != null && z.npc.lines[i] != null) z.npc.lines[i] = ln; });
      }
    }
    if (ov.item && z.item) _ov(z.item, "name", ov.item.name);
  }
}

// Applique un overlay EN sur BOSS_FIGHTS (boss.js). `byId` indexé par id de
// boss : { name, tagline, story, winText, taunts:[...], phases:[{title,desc,hint}] }.
// Les phases sont fusionnées par index (title/desc/hint). fs/check/timeLimit
// restent partagés. overlayBosses n'agit que si LANG === "en".
function overlayBosses(byId) {
  if (LANG !== "en" || typeof BOSS_FIGHTS === "undefined") return;
  for (const b of BOSS_FIGHTS) {
    const ov = byId[b.id];
    if (!ov) continue;
    for (const f of ["name", "tagline", "story", "winText"]) _ov(b, f, ov[f]);
    if (Array.isArray(ov.taunts) && Array.isArray(b.taunts)) {
      ov.taunts.forEach((tt, i) => { if (tt != null && b.taunts[i] != null) b.taunts[i] = tt; });
    }
    if (Array.isArray(ov.phases) && Array.isArray(b.phases)) {
      ov.phases.forEach((po, i) => {
        const ph = b.phases[i];
        if (!po || !ph) return;
        for (const f of ["title", "desc", "hint"]) _ov(ph, f, po[f]);
      });
    }
  }
}

// ── Changement de langue ────────────────────────────────────────
function setLang(l) {
  if (!LANGS.includes(l) || l === LANG) return;
  try { localStorage.setItem(LANG_KEY, l); } catch {}
  location.reload();
}

// ── Application des traductions au HTML statique ────────────────
// data-i18n="clé"          → textContent = t(clé)
// data-i18n-html="clé"     → innerHTML   = t(clé)   (pour <br>, <code>…)
// data-i18n-attr="a:cle;b:cle2" → attribut a = t(cle), b = t(cle2)
function applyStaticI18n(root) {
  root = root || document;
  root.querySelectorAll("[data-i18n]").forEach(el => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  root.querySelectorAll("[data-i18n-html]").forEach(el => {
    el.innerHTML = t(el.getAttribute("data-i18n-html"));
  });
  root.querySelectorAll("[data-i18n-attr]").forEach(el => {
    el.getAttribute("data-i18n-attr").split(";").forEach(pair => {
      const [attr, key] = pair.split(":");
      if (attr && key) el.setAttribute(attr.trim(), t(key.trim()));
    });
  });
}

// ── Sélecteur de langue dans la barre de navigation ─────────────
function injectLangToggle() {
  // Barre de nav de l'app (index) ou de la page d'atterrissage (landing).
  const host = document.querySelector(".nav-right") || document.querySelector(".l-nav-right");
  if (!host || document.getElementById("lang-toggle")) return;
  const btn = document.createElement("button");
  btn.id = "lang-toggle";
  btn.type = "button";
  btn.title = t("nav.lang");
  btn.setAttribute("aria-label", t("nav.lang"));
  // Texte plutôt qu'un emoji drapeau : Windows ne rend pas 🇫🇷/🇬🇧 (lettres
  // minuscules quasi invisibles). Le style vient du CSS (#lang-toggle) de
  // chaque page (style.css / landing.css).
  btn.textContent = LANG === "fr" ? "FR" : "EN";
  btn.addEventListener("click", () => setLang(LANG === "fr" ? "en" : "fr"));
  // Placé avant le bouton son (index) pour rester groupé avec les réglages ;
  // sinon (landing) simplement en tête de la barre.
  const sound = document.getElementById("sound-toggle");
  if (sound) host.insertBefore(btn, sound);
  else host.insertBefore(btn, host.firstChild);
}

function initI18n() {
  document.documentElement.lang = LANG;
  applyStaticI18n(document);
  injectLangToggle();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initI18n);
} else {
  initI18n();
}
