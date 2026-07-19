# Changelog

Toutes les évolutions notables du projet sont documentées ici.
Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [Non publié]

### Ajouté
- **Katas 8-9 & 4 nouveaux défis chrono** — fin du rattrapage de dette entamé
  avec le glossaire Administration. Katas de vitesse : « Incident systemd »
  (status/journalctl/stop/start/restart/enable) et « Administration »
  (useradd/passwd/usermod/groups/su/crontab) — 7 → **9 katas**. Défis chrono :
  diagnostiquer un service en panne (`systemctl status`), consulter ses logs
  (`journalctl -u`), installer une planification (`crontab fichier`) et
  résoudre un nom DNS (`dig`/`nslookup`) — 20 → **24 défis**. Les checks des
  nouveaux défis s'appuient sur l'état interne du terminal (ex. `state.sysStatus`)
  plutôt que sur le texte affiché, pour rester fiables quelle que soit la langue.
  Tous les compteurs affichés (accueil, landing, README) mis à jour en conséquence.
  9 tests dédiés (`tests/challenges.test.js`), 199 au total, zéro régression.
  FR+EN. SW v44 → v45.
- **🏆 Boss Rush** — nouveau mode dans la Salle des Boss : enchaîner les 7 boss
  (Kraken → Spectre → Hydre → Golem → Gardien → Zombie → Sensei) d'affilée, avec
  un pool de **3 cœurs partagé sur tout le parcours** au lieu d'un par combat —
  la moindre erreur répétée peut faire échouer le run entier. Se débloque une
  fois les 7 boss vaincus au moins une fois chacun. Chrono global affiché en
  temps réel pendant le run (badge dans l'arène), meilleur temps persisté
  (localStorage) et affiché dans le panneau dédié à gauche de la Salle des Boss.
  Sortie propre à tout moment : fuir ou choisir un combat normal dans la liste
  interrompt le Rush sans le casser (cœurs remis à 3 pour un combat classique).
  Contenu 100% existant, uniquement un mode d'enchaînement — 10 tests dédiés
  (`tests/boss.test.js`, 190 au total), zéro régression. FR+EN. SW v43 → v44.
- **Rattrapage de dette — glossaire** : 11 commandes utilisées dans des missions
  mais absentes du glossaire/`man`/`whatis` (`systemctl`, `journalctl`, `crontab`,
  `useradd`, `passwd`, `usermod`, `groups`, `su`, `ip`, `dig`, `nslookup`) rejoignent
  une nouvelle catégorie **Administration**, avec syntaxe/options/exemples FR+EN.
- **🚑 Salle d'astreinte** — nouveau mode de jeu à part entière (page dédiée,
  bouton de nav, carte sur l'accueil) : le moteur GÉNÈRE un incident au hasard parmi
  5 familles (service en échec ou conflit de port, script qui a perdu son bit `+x`,
  tâche cron pointant vers le mauvais chemin, compte hors du groupe sudo, fichier qui
  gonfle et sature le disque) et le joueur doit diagnostiquer et réparer SANS leçon ni
  indice — comme une vraie astreinte. Rejouable à l'infini ; score au temps, record et
  série consécutive persistés (localStorage). Repose entièrement sur des mécaniques
  déjà réellement dynamiques (`systemctl`, `crontab`, permissions/`chmod`, `usermod`+
  `sudo`, `du -h` sur le contenu réel des fichiers) : aucun nouveau comportement ajouté
  au terminal lui-même. SW v42 → v43.
- **Éditeur `nano` simulé** 📝 — le jeu ne savait pas éditer un fichier autrement
  qu'avec `echo`/redirection ou `sed`. `nano FICHIER` ouvre (ou crée) un buffer
  numéroté ; édition ligne par ligne avec `:N texte` (remplacer), `:a texte`
  (ajouter), `:i N texte` (insérer avant N), `:d N` (supprimer), `:p` (réafficher) ;
  `^O` enregistre sans quitter, `^X` enregistre et quitte, `:q!` abandonne les
  modifications, `:q` refuse de quitter tant que ce n'est pas enregistré. Tant que
  l'édition est ouverte, toute saisie est une sous-commande nano — prompt dédié
  `[nano fichier]` — comme un vrai éditeur plein écran qui monopolise le terminal.
  Ouverture cohérente avec `cat` : dossier refusé, fichier protégé refusé (même
  message). Débloque la classe de missions « corrige la config », « répare la
  crontab », « commente la ligne fautive ». Ajouté au glossaire/`man`/`whatis`/
  autocomplétion Tab/`help` (FR+EN). 8 tests dédiés (180 au total), zéro régression
  sur les 172 existants. SW v41 → v42.
- **`sudo` simulé** 🔑 — élévation ponctuelle vers root, suite logique directe des
  permissions appliquées + comptes utilisateurs : `sudo COMMANDE` s'exécute avec
  l'identité root (donc tous les droits) si le compte courant est dans le groupe
  `sudo` (le joueur l'est par défaut ; sarah aussi, une fois `usermod -aG sudo sarah`
  du scénario 12 appliqué), sinon refusé avec le vrai message « n'apparaît pas dans
  le fichier sudoers ». Contrairement à `su`, c'est ponctuel : l'identité d'origine
  revient juste après la commande — composé nativement avec les pipes
  (`sudo cat /etc/shadow | wc -l`) et les scripts, comme un vrai sudo. Le easter egg
  `sudo make me a sandwich` (xkcd 149) est préservé. Ajouté au glossaire/`man`/
  `whatis`/autocomplétion Tab/`help` (FR+EN). 6 tests dédiés (172 au total), zéro
  régression sur les 166 existants. SW v40 → v41.
- **Les permissions sont désormais réellement appliquées** 🔒 — jusqu'ici, `chmod` ne
  changeait que l'affichage de `ls -l` ; maintenant le simulateur fait respecter les
  droits : lire le fichier d'un autre utilisateur sans droit de lecture échoue avec
  « Permission non accordée » (cat, less, head/tail, grep, wc, sort, uniq, cut, diff,
  sed, awk, base64, rot13, xxd, bash — les 15 lecteurs sont contrôlés, sans fuite de
  contenu), `./script.sh` exige le bit d'exécution alors que `bash script.sh` n'exige
  que la lecture (fidèle au vrai comportement), et les droits suivent l'identité prise
  avec `su`. `chmod` applique maintenant les vrais modes : numérique (600, 644, 640…)
  et symbolique (`+x`, `u+x`, `go-r`…). La triade effective est owner/others (groupes
  volontairement ignorés — simplification pédagogique). Bonus : `/etc/shadow` existe
  désormais dans le bac à sable et est réellement illisible (root only), exactement
  comme la leçon du scénario 12 l'enseigne. Les missions permissions et le boss
  Gardien des Serrures deviennent crédibles de bout en bout. 8 tests dédiés (166 au
  total), zéro régression. SW v39 → v40.
- **7ᵉ boss — Le Daemon Zombie** 🧟 : un service maudit qui se relève à chaque reboot
  et étrangle le port 80. Le combat exploite le moteur systemd du scénario 11, et sa
  mécanique de résurrection est réelle : chaque phase recharge l'état des services,
  donc apache2 « se relève » vraiment entre les phases. 5 phases — repérer le service
  `failed` (`list-units`), interroger ses logs (`journalctl`), l'abattre (`stop`), le
  ré-abattre ET ranimer nginx avec preuve (`stop && start && status`), puis sceller la
  tombe au boot (`disable apache2 && enable nginx`). HP 120, XP 140, thème vert zombie.
  L'examen du Sensei exige désormais d'avoir vaincu les **6 boss réguliers**, et
  l'objectif « Videur de donjon » passe à 7 boss. Traduction EN complète, compteurs
  « 7 boss » mis à jour partout (les chips statiques de la landing, restées à « 60
  missions / 6 boss » depuis le scénario 11, sont corrigées au passage — l'i18n les
  réécrivait au chargement, le HTML statique était juste en retard). SW v38 → v39.
- **Scénario 14 — « L'intranet a disparu » (diagnostic réseau de bout en bout)** :
  `ip a`/`ip r`, `dig` et `nslookup` (zone DNS simulée) rejoignent le terminal, et `curl`
  apprend les hôtes internes : `intranet.dojo.lan` refuse la connexion sur le port 80
  (« Connection refused ») mais répond sur `:8080` — le service avait déménagé pendant
  la maintenance du week-end. `curl -I` renvoie les seuls en-têtes (200 OK, Server:
  nginx). Le comportement générique de curl est préservé pour les missions existantes
  (non-régression testée). 6 missions (ids 79-84) qui enseignent LA méthode : ip a (moi)
  → ping d'une IP (le réseau, sans dépendre du DNS) → dig (le DNS) → curl (le service,
  et le sens précis de chaque erreur) → tester :8080 → preuve par les en-têtes. Quiz 14,
  objectif « 🌐 Ceinture Diagnostic », badge « 🌐 Limier du réseau », traduction EN
  complète, entrées `help` + autocomplétion. 7 tests unitaires dédiés (158 au total).
  Compteurs : **84 missions / 14 scénarios**. SW v37 → v38.
- **Scénario 13 — « La sauvegarde de 3h du matin » (planification cron)** : `crontab`
  rejoint le terminal simulé (`-l`, `-r` sans confirmation comme le vrai, `-e` qui
  oriente vers le workflow fichier, et `crontab FICHIER` avec **validation réelle champ
  par champ** — `*`, `*/N`, `N`, `N-M`, listes ; une ligne invalide cite son numéro et
  l'installation est refusée en bloc, fidèle au « errors in crontab file, can't
  install »). 6 missions (ids 73-78) : décoder les 5 champs dans `/etc/crontab`,
  composer sa ligne avec `echo` + redirection (les `*` entre guillemets ne sont pas
  globbés — testé), installer, auditer avec `-l`, fréquences `*/5` + ajout `>>` sans
  écraser, et tout déprogrammer avec `-r` (le réflexe `crontab -l > secours.cron` est
  enseigné). Quiz 13, objectif « ⏰ Ceinture Cron », badge « ⏰ Maître du temps »,
  traduction EN complète, entrées `help` + autocomplétion. 7 tests unitaires dédiés
  (151 au total). Compteurs : **78 missions / 13 scénarios**. SW v36 → v37.
- **Scénario 12 — « Une nouvelle recrue » (utilisateurs & groupes)** : `useradd` (avec
  `-m` et mise à jour dynamique de `/etc/passwd`), `passwd`, `usermod` (le piège réel
  est simulé : `-aG` ajoute, `-G` seul **remplace** les groupes), `groups`, `id NOM` et
  `su` rejoignent le terminal. `su` échoue avec « Échec de l'authentification » sur un
  compte sans mot de passe (comme `su root` sur Ubuntu), change le prompt et `whoami`,
  et `exit` restaure l'identité précédente. 6 missions (ids 67-72) : l'onboarding complet
  de Sarah — lire `/etc/passwd`, créer le compte, mot de passe, groupe sudo, vérification
  (`groups`/`id`), test réel en `su`. Quiz 12, objectif « 👥 Ceinture Comptes », badge
  « 👥 Gardien des comptes », traduction EN complète, entrées `help` + autocomplétion.
  8 tests unitaires dédiés (144 au total). Compteurs : **72 missions / 12 scénarios**.
  SW v35 → v36.
- **Scénario 11 — « Le site est tombé » (services & logs systemd)** : `systemctl`
  (status/start/stop/restart/enable/disable/list-units) et `journalctl` (-u, -n) rejoignent
  le terminal simulé, avec un état de services persistant par mission et un **vrai conflit
  à diagnostiquer** — nginx est en `failed` parce qu'apache2, resté actif après une
  maintenance, occupe le port 80 ; tenter `systemctl start nginx` sans arrêter apache2
  échoue réellement avec l'erreur du journal (`Address already in use`). 6 nouvelles
  missions (ids 61-66) déroulant la boucle complète de réponse à incident : status →
  journalctl → stop du squatteur → start → vérification `active (running)` → enable/disable
  pour survivre au reboot. Quiz de chapitre, objectif « 🚨 Ceinture Services », badge
  « 🚨 Pompier de service », traduction EN complète (overlay `levels.en.js` + quiz +
  objectif + badge), entrées `help` et autocomplétion Tab. 8 tests unitaires dédiés
  (136 au total) dont l'isolation de l'état entre missions (`loadFS`) et le conflit de port. Compteurs mis à jour partout : **66 missions / 11 scénarios**
  (landing, index, README, i18n FR+EN). Le déblocage du mode Expert suit automatiquement
  (calculé dynamiquement sur le total). SW v34 → v35.
- **Analytics GoatCounter activée** — `GC_CODE = "marcorelli"` renseigné (dashboard :
  https://marcorelli.goatcounter.com), et évènements personnalisés câblés :
  `mission-ok-{id}` à chaque mission réussie, `mission-hint1/2/3-{id}` à chaque palier
  d'indice consommé (signal principal pour repérer les missions qui bloquent),
  `boss-ok-{id}`, `daily-ok` et `certificat-telecharge`. Appels gardés par
  `typeof trackEvent === "function"` (no-op dans les harnais de test et si l'analytics
  est inactive) ; les garde-fous existants (DNT/GPC, localhost) s'appliquent. SW v33 → v34.
- **Serveur Discord communautaire** — invitation permanente (https://discord.gg/42NN5ZtzKp)
  intégrée sur la landing page (bouton ghost dans le CTA final + lien footer), dans la page
  Profil du jeu (bouton dans les Options) et dans le README. Textes bilingues via les clés
  `l.cta.discord` / `l.footer.discord` / `profile.discord`. SW v32 → v33.
- Internationalisation FR / EN — **Phase D (finitions) : la page d'atterrissage + les meta**.
  `landing.html` (page marketing autonome) devient bilingue en réutilisant le même moteur
  `js/i18n.js` : tout le contenu est annoté `data-i18n` / `data-i18n-html`, un sélecteur 🇫🇷/🇬🇧
  est injecté dans la barre de nav de la landing (`.l-nav-right`), et le mini-terminal animé du
  hero (`js/landing.js`) devient bilingue (séquence FR/EN selon `LANG`, et rendu de l'état final
  traduit si `prefers-reduced-motion`). Meta Open Graph : `og:locale:alternate en_US` déclaré sur
  `index.html` et `landing.html` (locale primaire FR conservée pour les crawlers). `<html lang>`
  déjà dynamique. Le test de couverture des clés `data-i18n*` couvre désormais **les deux pages**
  (`tests/i18n.test.js`). **L'internationalisation FR↔EN est 100 % terminée** — application,
  contenu, shell simulé et page marketing. 128 tests. SW v30 → v31. Vérifié en Chrome headless
  (hero, cartes de modes, section man, footer, sélecteur, `<html lang>` — FR et EN, sans erreur).
- Internationalisation FR / EN — **Phases C & fin : tous les modes de jeu + le shell simulé**.
  Traduits via overlays `js/i18n/*.en.js` (fusionnés au boot seulement si EN) : défis
  (`challenges`), infiltration (`bandit`), mode Expert, objectifs, événements saisonniers, kata,
  défi du jour, Salle des Boss (6 boss × phases), badges (`game.js`) et le monde Explorer
  (`gameshell`, 18 zones). Le **certificat** de Ceinture Noire est routé par `t()`. Le shell
  simulé **`terminal.js`** (~150 messages : erreurs, usage, aide, sorties git/docker, pages
  `man`, easter eggs cowsay/fortune/sl, boot) est traduit via un helper inline `sh("fr","en")`
  (plus lisible que des clés pour des chaînes uniques et interpolées). Seuls **2 `check()` de
  mission** dépendaient d'une sortie générée par le terminal (git status « working tree clean »,
  docker logs « started ») → rendus **bilingues** (`/propre|clean/`, `/d.marr.|started/`) sans
  changer la validation FR. Le contenu des fichiers simulés (`fs` des missions, SYSTEM_FS) reste
  en français, comme une donnée que le joueur lit. Helpers i18n ajoutés :
  `overlayArray`/`overlayIndexed`/`overlayBosses`/`overlayWorld`/`glossCat`/`rankName`/`sh`/
  `dateLocale`. Correctifs induits : `getRank().name` (devenu `{fr,en}`) routé par `rankName()`
  dans certificat/profil ; case `cd` de l'Explorer renommé pour ne plus masquer `t()` ; stubs
  `t`/`rankName`/`pick` (game.test) et `sh`/`LANG`/`dateLocale` (terminal.test) dans les harnais.
  **Le jeu entier bascule désormais FR↔EN**, UI et contenu. 127 tests. SW bumpé jusqu'à v30.
  Vérifié en Chrome headless dans les deux langues (interface, missions, boss, glossaire,
  certificat, badges, Explorer, sorties du terminal, checks couplés).
- Internationalisation FR / EN — **Phase 1 (coquille d'interface)** : nouveau module
  `js/i18n.js` chargé très tôt (après `errors.js`). Détection de langue
  (`localStorage` puis `navigator.language`), `t("clé")` avec repli FR puis sur la clé
  et interpolation `{var}`, `pick({fr,en})` pour le contenu (repli FR = dégradation
  propre), sélecteur 🇫🇷/🇬🇧 injecté dans la barre de navigation, `<html lang>` mis à
  jour dynamiquement. Le HTML statique est annoté avec `data-i18n` / `data-i18n-html` /
  `data-i18n-attr` (aucune réécriture de structure, juste des attributs) et traduit au
  chargement par `applyStaticI18n()`. Toute l'interface bascule FR↔EN — navigation,
  accueil (héros, cartes de modes, objectifs, stats), panneaux Apprendre/Explorer/Défis/
  Infiltration/Boss/Bac à sable/Glossaire/Profil, modales (succès, quiz, défi du jour,
  raccourcis), bannières (mise à jour, multi-onglets) et noms de rangs (`RANKS` passés en
  `{fr,en}` + helper `rankName()`). Le choix de langue est mémorisé (reload complet).
  10 tests dédiés (`tests/i18n.test.js`) : `t()`/`pick()`/`rankName()`, **parité stricte
  des clés fr↔en** et **couverture** (toute clé `data-i18n*` d'`index.html` existe dans
  la table). Vérifié en rendu navigateur réel (Chrome headless) dans les deux langues
- Internationalisation FR / EN — **Phase B (contenu des scénarios)** : les **10 scénarios /
  60 missions** de `js/levels.js` sont traduits en anglais dans un fichier d'overlay séparé
  `js/i18n/levels.en.js` (chargé juste après `levels.js`). Chaque mission redéfinit
  `name` / `desc` / `hint` / `explanation` et, dans `lesson`, `title` / `intro` / `syntax` /
  `tip` + les tableaux `options` / `examples` (par index) ; `cmd`, `xp`, `fs`, `check` et les
  `flag`/`cmd` restent partagés (indépendants de la langue). Le helper `overlayLevels()`
  (`js/i18n.js`) fusionne l'overlay sur `CHAPTERS` **uniquement si la langue est l'anglais** :
  en français, `levels.js` reste la source de vérité intacte et l'anglais est purement additif.
  Les noms de fichiers, chemins, hôtes et valeurs (`config.json`, `prod.monserveur.com`,
  `webserver01`, `initial commit`…) sont volontairement gardés à l'identique pour ne pas casser
  la validation des missions. 8 tests dédiés (`tests/levels-i18n.test.js`) : overlay appliqué en
  EN / inactif en FR, **complétude** (chaque chapitre+mission a sa traduction), pas d'overlay
  orphelin, longueurs `options`/`examples` cohérentes, et **littéraux `<code>` avec `.`/`/`
  identiques en EN**. Vérifié en navigateur réel (titre de chapitre + leçon rendus en anglais)
- Internationalisation FR / EN — **Phase B (suite) : quiz de fin de chapitre + glossaire** :
  les **quiz** (`js/quizzes.js`, ~34 questions/options) sont traduits via overlay
  `js/i18n/quizzes.en.js` (helper `overlayQuizzes()`, l'indice de bonne réponse `answer`
  reste partagé), et les libellés de la modale (progression, résultat) passent par `t()`.
  Le **glossaire** (`js/glossary.js`, **62 commandes**) est traduit via
  `js/i18n/glossary.en.js` (helper `overlayGlossary()` : `desc`, `syntax`, et le libellé de
  chaque option/exemple) ; les **catégories restent des clés FR pour le filtrage** et seul
  leur libellé affiché est traduit par `glossCat()` (aucun risque pour le filtre). 8 tests
  supplémentaires (`tests/levels-i18n.test.js`, 16 au total). Vérifié en navigateur réel
  (chip `Search`/clé `Recherche`, descriptions de commandes rendues en anglais).
  SW v20 → v23 (précache de `levels.en.js`, `quizzes.en.js`, `glossary.en.js`)
- Page d'atterrissage marketing dédiée (`landing.html`, `css/landing.css`, `js/landing.js`) :
  hero avec mockup de terminal animé, chiffres réels du contenu, grille des modes de jeu,
  section « pourquoi » façon page de manuel (`man linuxdojo`). Séparée de `index.html`
  (qui reste l'entrée du jeu), pensée pour les liens externes
- Partage social des succès : bouton « Partager » sur le certificat de Ceinture Noire
  (`js/certificate.js`, image PNG jointe via `navigator.share()` quand disponible, sinon
  texte + lien dans le presse-papier) et bouton « Partager mes badges » dans le Profil
  (`js/profile.js`, résumé texte des badges débloqués)
- Script de build optionnel (`npm run build`, `scripts/build.js`) : minifie `js/*.js`
  (terser) et `css/style.css` (clean-css) dans un dossier `dist/` prêt à déployer, sans
  changer les chemins ni les noms de fichiers. ~28 % de poids en moins (535 Ko → 385 Ko).
  Aucun impact sur le développement courant (toujours sans build), voir `CONTRIBUTING.md`
- Suivi d'erreurs auto-hébergé (`js/errors.js`, chargé en premier) : capture
  `window.onerror`/`unhandledrejection`, journal `localStorage` dédupliqué (ring buffer
  20 entrées), nouvelle section « Journal d'erreurs » dans le Profil avec bouton copier/
  vider. 12 tests dédiés (`tests/errors.test.js`)
- Détection de sauvegarde concurrente entre onglets : si un autre onglet modifie la
  progression (`localStorage`), une bannière prévient et propose de recharger, pour
  éviter d'écraser par erreur le progrès le plus récent (`js/game.js`, event `storage`)
- Versioning des sauvegardes (`SAVE_VERSION`, `MIGRATIONS`, `migrateSave()` dans
  `game.js`) : les sauvegardes `localStorage` sont désormais migrées automatiquement
  vers la structure courante au chargement, y compris les très anciennes sauvegardes
  sans champ `version`. Prépare le terrain pour les futures évolutions du format de
  sauvegarde sans casser la progression des joueurs existants. 6 tests dédiés
- Suite de tests unitaires pour la progression (`tests/game.test.js`, désormais 27 tests,
  zéro dépendance) : sauvegarde/chargement (round-trip, JSON corrompu, migration
  d'anciennes sauvegardes, versioning), déblocage de badges, gain et persistance d'XP,
  détection multi-onglets. Branchée à la CI GitHub Actions aux côtés des tests du parseur
- Recherche arrière dans l'historique (`Ctrl+R`, façon bash) sur les terminaux Apprendre,
  Bac à sable et Exploration : tape pour filtrer l'historique, `Ctrl+R` pour remonter au
  résultat précédent, `Entrée` pour lancer la commande trouvée, `Échap` pour annuler
- Événements saisonniers : thème visuel + effet (flocons de neige / brume spectrale)
  appliqués automatiquement selon la date (Halloween du 24/10 au 02/11, Noël du 15/12 au
  02/01), avec bannière d'annonce dismissible sur l'accueil. Une commande cachée par
  événement (jamais révélée dans l'aide) débloque un badge exclusif + 100 XP, ré-obtenable
  chaque année (`js/seasonal.js`)
- Mini-scénario Docker (Scénario 10, 6 missions) : `docker build`, `docker images`,
  `docker run -d --name`, `docker ps`, `docker logs`, `docker stop`. Quiz de fin de chapitre
  et objectif « Ceinture Docker » associés. Nouveau badge « 🐳 Capitaine de conteneurs »
- Mode Expert : 8 missions avancées sans leçon ni indices (débloquées après les missions
  de base), combinant plusieurs commandes en pipe. Nouveau badge « 🎓 Maître d'armes »
- Défi du jour partageable façon Wordle : une fois le défi résolu, un bouton « Partager »
  copie dans le presse-papier une grille 🟥/🟩 (nombre de tentatives), le numéro de défi
  du jour, la série 🔥 et l'XP gagné
- Nouveau boss : **Le Gardien des Serrures**

### Modifié
- Réorganisation du dossier : `style.css` → `css/`, tous les `.js` → `js/`
  (racine gardée pour `index.html`, `manifest.json`, `sw.js` — contrainte du scope
  du service worker)
- Compteur d'accueil mis à jour : 8 scénarios · 48 missions (au lieu de 7 · 42)
- Certificat de fin de jeu : le total de missions affiché est maintenant calculé
  dynamiquement au lieu d'un nombre figé obsolète (`/ 36`)

### Corrigé
- Précache du service worker : `js/expert.js` et `js/seasonal.js` manquaient de la liste
  `ASSETS` depuis leur ajout (mode Expert et thèmes saisonniers cassés hors-ligne)
- Compatibilité Safari : préfixe `-webkit-backdrop-filter` ajouté aux 33 usages de
  `backdrop-filter` (effet verre dépoli invisible sans ça sur Safari < 18) ; toutes les
  écritures `localStorage` non protégées (`bandit.js`, `boss.js`, `challenges.js`,
  `daily.js`, `game.js`, `gameshell.js`, `kata.js`) enveloppées de `try/catch` (Safari peut
  lever une exception sur l'écriture en navigation privée stricte ou stockage bloqué)
- Icônes `maskable` du manifest : `icon-512.png` était réutilisée telle quelle sans zone
  de sécurité (contenu touchant les 4 bords), ce qui aurait rogné le logo sur les launchers
  Android appliquant un masque. Nouvelles icônes dédiées `icon-192-maskable.png` /
  `icon-512-maskable.png` (fond plein, logo à 66% du canvas). Cache-busting `v8` → `v9`,
  Service Worker `v14` → `v17`
- L'enchaînement `cmd1 && cmd2` était purement décoratif : taper le hint exact d'une mission
  (ex. `git init && git add . && git commit -m "..."`) n'exécutait que la première commande.
  9 hints des scénarios Git et Réseau étaient concernés. Implémenté un vrai enchaînement avec
  court-circuit sur échec, comme un shell réel. 3 tests de régression ajoutés.
- `sort` ne détectait pas les flags combinés en un seul token (`-rn`, `-nr`) — seul `sort -r`
  ou `sort -n` séparément fonctionnait. Corrigé pour matcher le comportement déjà présent sur
  `grep`/`ls`. 2 tests de régression ajoutés.
- Boss **Le Gardien des Serrures** (🔐) — 5 phases sur le thème des permissions
  (`ls -l`, `chmod`, `chown`), inséré avant le Sensei. Le Sensei exige désormais 5 boss
  vaincus (au lieu de 4). Tous les compteurs "5 boss" du site (README, page d'accueil,
  certificat, objectifs, profil) mis à jour en conséquence
- 7ᵉ kata : **Git** (`init`, `status`, `add`, `commit`, `log`, `branch`, `checkout`) —
  aligné sur les commandes du scénario 8
- 6 badges secrets, cachés (`???`) tant qu'ils ne sont pas débloqués : `cowsay`, `sl`,
  `fortune`, survivre à `vim`, Konami code, terminer une mission en moins de 10s
- Overlay raccourcis clavier : touche `?` (ou bouton ⌨️ dans la nav) pour afficher une
  modale récapitulant Tab, ↑/↓, Entrée, Échap ; désactivé automatiquement si le focus est
  dans un champ de saisie pour ne pas interférer avec la frappe
- Scénario 9 — Réseau & SSH : 6 missions (`ssh`, `scp`, `netstat`), quiz de fin de chapitre,
  badge et objectif dédiés. Commandes `ssh`/`scp`/`netstat`/`ss` ajoutées au terminal, `exit`
  gère maintenant une vraie déconnexion SSH (prompt restauré) en plus de son easter egg existant
- Scénario 8 — Git : 6 missions (`init`, `add`, `commit`, `log`, `branch`, `checkout`),
  quiz de fin de chapitre, badge et objectif dédiés
- Commandes shell : `chown`, `chgrp`, `alias`/`unalias`, `xargs`, `diff`, jobs en
  arrière-plan (`cmd &`, `jobs`, `fg`)
- Mode indices progressifs (3 paliers : conseil gratuit → syntaxe −3 XP → solution −5 XP)
  remplaçant l'ancien indice binaire à −5 XP fixe
- Bannière de mise à jour du service worker : l'utilisateur choisit quand recharger,
  au lieu d'un rechargement silencieux qui pouvait interrompre une saisie en cours
- Meta tags Open Graph / Twitter Card pour un aperçu correct au partage de lien
- Accessibilité : `aria-label` sur les champs de saisie et boutons icône-seule,
  `aria-live` sur les zones de sortie terminal, `role="dialog"` + `aria-modal` +
  `aria-labelledby` sur les 4 modales
- Suite de tests unitaires du parseur (`tests/terminal.test.js`, 47 tests, zéro
  dépendance) + workflow CI GitHub Actions
- `LICENSE` (MIT), `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, templates d'issues GitHub
- `ROADMAP.md` — ligne de route du projet
- Suppression d'un fichier `nojekyll` dupliqué (sans le point, doublon du `.nojekyll`
  correct)
- Le service worker rechargeait la page sans prévenir dès qu'une mise à jour était
  prête ; il attend maintenant une confirmation explicite

## [Antérieur]

État du projet avant le début de ce changelog : 7 scénarios, 42 missions, terminal
simulé avec ~55 commandes, modes Explorer/Défis/Infiltration/Boss/Kata/Bac à sable,
PWA installable hors-ligne, système de progression (XP, rangs, badges, thèmes).
