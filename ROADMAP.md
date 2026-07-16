# 🗺️ Roadmap — LinuxDojo

Ligne de route complète du projet : ce qui est fait, ce qui reste à faire, et les gros
chantiers structurants. Le but de ce fichier est de ne plus avoir à redemander — tout ce
qui a été identifié comme piste d'amélioration y est consigné.

> 💡 Pour proposer une nouvelle idée : ajoute-la dans la section qui correspond le mieux,
> avec une checkbox `- [ ]`. Coche-la (`- [x]`) et déplace-la dans "Déjà fait" une fois livrée.

---

## ✅ Déjà fait

- Commandes manquantes : `chown`, `chgrp`, `alias`, `xargs`, `diff`, jobs en arrière-plan (`&`/`jobs`/`fg`)
- Scénario 8 — Git : `init`, `add`, `commit`, `log`, `branch`, `checkout`, `status` (6 missions)
- Bannière de mise à jour du service worker (au lieu d'un rechargement silencieux)
- Meta tags Open Graph / Twitter Card (aperçu correct au partage de lien)
- Mode indices progressifs (3 paliers : gratuit → −3 XP → −5 XP)
- Accessibilité ARIA du terminal (labels, live regions, dialogs)
- Réorganisation du dossier (`css/`, `js/`, `tests/`)
- Suite de tests unitaires du parseur (40 tests, zéro dépendance) + CI GitHub Actions
- **Événements saisonniers** — thème visuel + effet (neige/brume) appliqués automatiquement
  selon la date (Halloween 24/10→02/11, Noël 15/12→02/01), bannière dismissible sur
  l'accueil, et une commande cachée par événement (jamais révélée) débloquant un badge
  exclusif + 100 XP, ré-obtenable chaque année (`js/seasonal.js`)
- **Recherche arrière dans l'historique** (`Ctrl+R` façon bash) — classe réutilisable
  `ReverseSearch` (`js/fx.js`) câblée sur les 3 terminaux qui ont un historique de commandes
  (Apprendre, Bac à sable, Exploration) : tape pour filtrer, `Ctrl+R` pour le résultat
  précédent, `Entrée` pour lancer, `Échap` pour annuler — état affiché dans le placeholder
  du champ, sans nouvel élément DOM
- **Permissions réellement appliquées** (2026-07-17) — le moteur fait respecter les
  permissions : triade effective calculée par `_permTriad()` (owner si propriétaire ou
  root, sinon others — groupes volontairement ignorés), lecture contrôlée au niveau de
  `_file()` (flag `denied`) et vérifiée par les 15 commandes lectrices (cat, less/more,
  head/tail, grep, wc, sort, uniq, cut, diff, sed, awk, base64, rot13, xxd, bash) avec
  message « Permission non accordée 🔒 » + indice ; `./script.sh` exige le bit x (mais
  `bash script.sh` non, comme en vrai) ; `chmod` réécrit pour appliquer les vrais modes
  (numérique 0-7 par triade, symbolique [ugoa]±rwx) ; les droits suivent l'identité
  changée par `su`. Bonus : `/etc/shadow` ajouté au bac à sable, réellement illisible
  (root only) — cohérent avec la leçon du scénario 12. Audit de compat : les fichiers
  restrictifs existants n'ont pas d'owner (donc appartiennent au joueur, lisibles), les
  scripts `./` du contenu ont tous le bit x. 8 tests dédiés (166 au total), zéro
  régression sur les 158 existants
- **7ᵉ boss — Le Daemon Zombie** 🧟 (2026-07-16) — thème systemd, exploite le moteur du
  scénario 11 : un service maudit qui « se relève à chaque reboot » (mécaniquement vrai :
  chaque phase recharge le FS donc réinitialise les services — apache2 revient squatter
  le port 80 entre les phases, c'est le gameplay). 5 phases : list-units (repérer le
  failed) → journalctl (la cause) → stop apache2 → il se relève ! (stop + start nginx +
  status running) → sceller la tombe (disable apache2 + enable nginx). HP 120, XP 140.
  Le Sensei exige désormais **6 boss** vaincus (au lieu de 5) ; l'objectif « Videur de
  donjon » passe à 7. Overlay EN complet, compteurs « 7 boss / 7 combats » partout
  (landing FR+EN + chips statiques 60→84 corrigées au passage, index, README, i18n)
- **Scénario 14 — L'intranet a disparu (diagnostic réseau)** (2026-07-16) — `ip a`/`ip r`,
  `dig`, `nslookup` (zone DNS simulée partagée `_dnsZone()`) et `curl` enrichi (parse
  hôte:port, `-I` pour les en-têtes, hôtes internes simulés : intranet.dojo.lan refuse
  le port 80 et répond sur :8080 — le service avait « déménagé » pendant une maintenance ;
  le comportement générique historique de curl est préservé, testé contre le check de la
  mission 28). 6 missions (79-84) : l'échelle de diagnostic complète — ip a (moi) →
  ping IP (réseau, sans DNS exprès) → dig (DNS) → curl (Connection refused = service) →
  curl :8080 (trouvé) → curl -I (preuve 200 OK). Quiz 14, objectif « 🌐 Ceinture
  Diagnostic », badge « 🌐 Limier du réseau », overlay EN, 7 tests (158 au total).
  Compteurs : 84 missions / 14 scénarios partout
- **Scénario 13 — La sauvegarde de 3h du matin (cron)** (2026-07-16) — `crontab`
  simulé (`-l`, `-r`, `-e` renvoie vers l'installation par fichier, `crontab FICHIER`
  avec validation champ par champ : `*`, `*/N`, `N`, `N-M`, listes — un champ invalide
  cite son numéro de ligne et rien n'est installé, comme le vrai). 6 missions (73-78) :
  décoder les 5 champs (/etc/crontab), écrire la ligne (echo + `>` sans globber les `*`
  entre guillemets), installer, auditer (`-l`), fréquences `*/5` + ajout `>>`, tout
  supprimer (`-r`, avec le réflexe `-l > secours.cron` en leçon). Quiz 13, objectif
  « ⏰ Ceinture Cron », badge « ⏰ Maître du temps », overlay EN, 7 tests (151 au total).
  Compteurs : 78 missions / 13 scénarios partout
- **Scénario 12 — Une nouvelle recrue (utilisateurs & groupes)** (2026-07-16) —
  `useradd` (-m, /etc/passwd mis à jour dynamiquement), `passwd`, `usermod` (-aG ajoute,
  -G seul REMPLACE — le piège réel est simulé fidèlement), `groups`, `id NOM`, `su`
  (échec d'authentification sur compte sans mot de passe, prompt + whoami changent,
  `exit` restaure) dans le terminal. 6 missions (67-72) : onboarding complet de « Sarah »
  (lire /etc/passwd → useradd -m → passwd → usermod -aG sudo → groups → su + whoami).
  Quiz 12, objectif « 👥 Ceinture Comptes », badge « 👥 Gardien des comptes », overlay EN
  complet, 8 tests (144 au total). Compteurs : 72 missions / 12 scénarios partout
- **Scénario 11 — Le site est tombé (services & logs)** (2026-07-16) — `systemctl`
  (status/start/stop/restart/enable/disable/list-units) et `journalctl` (-u, -n) simulés
  dans le terminal, avec un vrai conflit à diagnostiquer : nginx en `failed` parce
  qu'apache2 squatte le port 80 (démarrer nginx sans arrêter apache2 échoue vraiment).
  6 missions (61-66, ids libres : Expert = 9001+) suivant la boucle réponse à incident
  (status → journalctl → stop → start → vérif → enable/disable), quiz 11, objectif
  « 🚨 Ceinture Services », badge « 🚨 Pompier de service », overlay EN complet, 8 tests
  unitaires dédiés (dont l'isolation loadFS et le conflit de port). Compteurs mis à jour
  partout : 66 missions / 11 scénarios (landing, index, README, i18n FR+EN)

---

## 🔜 Phase 1 — Fondations (rapide, faible risque)

Petites choses avec un bon rapport effort/valeur, à faire en premier.

- [x] **`LICENSE`** — MIT
- [x] **`CONTRIBUTING.md` + templates d'issues GitHub**
- [x] **`CHANGELOG.md`**
- [x] **`CODE_OF_CONDUCT.md`**
- [x] **`sitemap.xml` + `robots.txt`**
- [x] **Audit contraste couleurs (WCAG AA)** — `--text-dim` échouait (~2.5x sur fond, il en
      faut 4.5x pour du texte normal) sur les 4 thèmes qui redéfinissent le fond ; corrigé
      (`#475569` → `#828b99`, 4.6x minimum garanti sur tous les thèmes)
- [x] **Mode daltonien** — les erreurs shell (`.t-err`) ne reposaient que sur la couleur
      rouge, sans autre indice ; ajout d'un marqueur `✗`/`⚠` (CSS `::before`, zéro risque
      pour les tests). Les messages de succès avaient déjà des emoji, rien à faire dessus.
- [x] **Favicon multi-tailles + `theme-color`** — déjà en place (audit confirmé, aucun
      changement nécessaire)
- [x] **Focus trap clavier dans les modales** — implémenté de façon générique (un seul
      `MutationObserver` dans `game.js`, s'applique automatiquement aux 4 modales sans
      toucher leur code d'ouverture respectif) : Tab reste piégé dans la modale ouverte,
      Echap la ferme, le focus revient à l'élément d'origine à la fermeture

## 📚 Phase 2 — Contenu

- [x] **Scénario réseau/SSH** — `ssh`, `scp`, `netstat`, 6 missions (Scénario 9), avec 7 tests
      unitaires dédiés
- [x] **Mode "Expert"** — 8 missions plus difficiles, sans leçon ni indices, débloquées une
      fois les 60 missions de base terminées. Chaque mission combine plusieurs commandes en
      pipe (`grep -v`, `sort | uniq -c | sort -rn`, `find | xargs`, `sed ... >`, `cut | sort -u`,
      etc.) — le joueur doit assembler la solution seul. Badge dédié « 🎓 Maître d'armes ».
      Bonus : a révélé et corrigé un bug pré-existant dans `sort` (flags combinés `-rn` non
      détectés), couvert par 2 nouveaux tests de régression.
- [x] **Défi du jour partageable** (façon Wordle : grille de résultat copiable) — un bouton
      « Partager » apparaît une fois le défi réussi (ou en le rouvrant le même jour) : copie
      dans le presse-papier un texte façon Wordle (numéro de défi croissant, grille 🟥/🟩 selon
      le nombre de tentatives, série 🔥 si ≥2 jours, XP gagné, lien du site). Rétrocompatible
      avec les sauvegardes existantes (pas de bouton si l'ancien format ne contient pas les
      nouvelles données).
- [x] **Plus de boss fights** — 6ᵉ combat ajouté : **Le Gardien des Serrures** (🔐, 5 phases,
      thème permissions `ls -l` / `chmod` / `chown`, inédit dans la Salle des Boss). Sensei
      exige désormais d'avoir vaincu les 5 boss réguliers (au lieu de 4)
- [x] **Kata Git** — 7ᵉ kata ajouté (`git init/status/add/commit/log/branch/checkout`),
      pour muscler les réflexes sur le scénario 8 (Git) comme les autres chapitres
- [x] **Badges/succès secrets** — 6 badges cachés (icône `???` tant qu'ils ne sont pas
      débloqués) : taper `cowsay`, `sl`, `fortune`, survivre à `vim` (`:q!`/`:wq`), trouver
      le Konami code, ou finir une mission en moins de 10 secondes. Système générique
      (`markSecret()` + `STATS.cmd`) réutilisable pour de futurs secrets
- [x] **Mini-scénario Docker** — 6 nouvelles missions (Scénario 10), après Git : `docker build`,
      `docker images`, `docker run -d --name`, `docker ps`, `docker logs`, `docker stop`,
      simulés dans l'esprit "simulateur" du jeu (pas de vrai Docker). Quiz de fin de chapitre
      et objectif « Ceinture Docker » ajoutés en cohérence avec les autres scénarios.
      Bonus : a révélé et corrigé un bug significatif du moteur — `&&` était purement
      décoratif dans les hints (9 hints existants des scénarios Git/Réseau ne fonctionnaient
      pas si on les tapait tel quel). Implémenté un vrai enchaînement `&&` avec court-circuit
      sur échec, comme un vrai shell. 3 tests de régression ajoutés.
- [x] **Overlay "raccourcis clavier"** (touche `?`) — modale listant Tab, ↑/↓, Entrée, Échap,
      accessible via un bouton dans la nav ou la touche `?` (désactivée si le focus est dans
      un champ de saisie, pour ne pas gêner la frappe) ; réutilise le focus trap générique
      existant, aucune modification du système de modales nécessaire


## 🔧 Phase 3 — Technique / fiabilité

- [x] **Étendre les tests** au-delà du parseur : XP, badges, sauvegarde/chargement (`game.js`)
      — `tests/game.test.js` (17 tests, zéro dépendance, exécution du script dans un
      contexte `vm` avec un DOM stub minimal), branché à la CI GitHub Actions à côté de
      `terminal.test.js`. Couvre : forme de `defaultSave()`, round-trip `persist()`/`loadSave()`,
      repli sur sauvegarde par défaut si JSON corrompu, migration d'une ancienne sauvegarde
      sans `reviewCounts`/`objectives`/`secrets`, déblocage de badges (mission, chapitre,
      paliers XP, secrets), non-duplication des badges, cumul et persistance de l'XP
- [x] **Vérifier la migration de sauvegarde** — si la structure de `GAME` change un jour
      (ex: nouveau champ), les anciennes sauvegardes `localStorage` doivent rester
      compatibles. Pas de système de versioning vérifié dessus pour l'instant.
      → Ajout d'un champ `version` + `SAVE_VERSION`/`MIGRATIONS` dans `game.js` :
      chaque sauvegarde est ramenée à la version courante à la volée dans `loadSave()`
      (une sauvegarde sans champ `version` est traitée comme la version 0). Les anciens
      correctifs ad hoc (ajout de `reviewCounts`/`objectives`/`secrets`) sont devenus la
      migration v0→v1. Une sauvegarde plus récente que le code actuel n'est jamais
      rabaissée (cas d'un vieux client rouvrant une sauvegarde faite par une version
      plus neuve). 6 nouveaux tests dans `tests/game.test.js`.
- [x] **Gestion des sauvegardes multi-onglets** — si le joueur a le jeu ouvert dans 2 onglets,
      la dernière sauvegarde écrase l'autre silencieusement ; pas de détection de conflit
      actuellement (piste : `storage` event pour détecter un changement externe)
      → Écoute de l'event `storage` sur `SAVE_KEY` (`js/game.js`) : dès qu'un autre onglet
      modifie la sauvegarde, une bannière (même style que celle de mise à jour du service
      worker) invite à recharger avant de continuer à jouer ici. Pas de fusion automatique
      des deux progressions (trop risqué), juste une alerte claire. 5 tests dédiés.
- [x] **Audit Lighthouse PWA complet** (icônes maskable, `theme-color`, performance) — pour
      le score d'installabilité
      → Le seul vrai problème trouvé : `icon-512.png` était réutilisée telle quelle en
      `purpose: maskable`, mais son contenu touchait les 4 bords à 0px de marge (bbox opaque
      = image entière). En mode maskable, l'OS applique un masque (cercle, squircle...) sur
      l'icône : sans zone de sécurité, le logo aurait été rogné sur les launchers Android qui
      masquent l'icône. Créé `icon-192-maskable.png` et `icon-512-maskable.png` dédiées : fond
      plein `#080810` (pas de transparence, requis par la spec maskable) + logo réduit à 66%
      du canvas (marge ~17% de chaque côté, confortablement dans le cercle de sécurité de 80%).
      Les icônes `any` (`icon-192.png`/`icon-512.png`, transparentes) restent inchangées.
      Manifest/`index.html`/`sw.js` mis à jour (cache-busting `v8` → `v9`, SW `v14` → `v15`).
      Le reste de l'audit était déjà conforme : `theme-color` présent et cohérent avec le
      manifest, viewport correct, HTTPS (GitHub Pages), service worker enregistré avec fallback
      offline, `start_url`/`scope`/`display: standalone` déjà bien configurés.
- [x] **Test de compatibilité navigateurs** — vérifié seulement sur Chromium jusqu'ici ;
      à tester sur Firefox et Safari (notamment le service worker et les animations CSS)
      → Pas d'accès à des navigateurs réels dans cet environnement, donc audit statique
      du code à la place. Deux vrais problèmes trouvés et corrigés :
      1. `backdrop-filter` (glassmorphism, 33 occurrences dans `css/style.css`) n'avait pas
         son équivalent préfixé `-webkit-backdrop-filter`, requis par Safari < 18 (le
         support non préfixé n'est arrivé qu'en 2024) — tout l'effet verre dépoli aurait
         été invisible sur Safari/iOS un peu ancien. Préfixe ajouté partout.
      2. Écritures `localStorage.setItem`/`removeItem` non protégées par `try/catch` dans
         `bandit.js`, `boss.js`, `challenges.js`, `daily.js`, `game.js` (x3), `gameshell.js`,
         `kata.js` — Safari peut lever une exception synchrone sur l'écriture (navigation
         privée stricte, cookies/stockage bloqués par réglages, quota dépassé), ce qui
         aurait cassé silencieusement la sauvegarde XP/badges/meilleurs scores en pleine
         partie. Toutes les écritures sont maintenant protégées (les lectures l'étaient
         déjà). `persist()` (sauvegarde principale) logue un avertissement en console si
         l'écriture échoue, pour rester diagnosticable.
      Vérifié sans problème : pas de `:has()`/`@container`/autres CSS trop récentes, `gap`
      en flexbox (support large depuis 2021), unités `dvh` toujours accompagnées d'un
      fallback `vh`, pas de `requestIdleCallback` (absent de Safari) ni d'autre API JS
      récente non universellement supportée. `navigator.clipboard` a déjà un repli
      (`prompt()`) si l'API est absente.
- [x] **Suivi d'erreurs** (type Sentry, ou une solution auto-hébergée légère) — pour être
      notifié si une erreur JS survient chez un vrai joueur, plutôt que de ne jamais le savoir
      → Pas de backend pour ce projet (PWA statique GitHub Pages), donc pas de vrai Sentry :
      solution 100% auto-hébergée et cohérente avec l'esprit "zéro compte" du jeu. Nouveau
      module `js/errors.js`, chargé en tout premier (avant tous les autres scripts) pour
      capturer les erreurs même pendant l'initialisation des autres fichiers :
      - Écoute `window.onerror` et `unhandledrejection`, journalise dans `localStorage`
        (`linuxdojo_errors`), ring buffer de 20 entrées distinctes max
      - Déduplication : la même erreur répétée en moins de 5s incrémente un compteur au lieu
        de spammer le journal (utile pour les erreurs qui boucleraient, ex: dans un
        `setInterval`)
      - Nouvelle section « 🐛 Journal d'erreurs » dans la page Profil (`js/profile.js`) :
        statut (nombre d'erreurs distinctes/occurrences), bouton « Copier le rapport »
        (presse-papier + repli `prompt()`, même mécanique que l'export de sauvegarde) pour
        transmettre le rapport en cas de bug, et bouton « Vider le journal »
      - 12 tests dédiés (`tests/errors.test.js`), branchés à la CI GitHub Actions
      - Bonus : en touchant la liste de précache du service worker, découvert que
        `js/expert.js` et `js/seasonal.js` en étaient absents depuis leur ajout (Phase 1/2)
        — corrigé au passage (mode Expert et thèmes saisonniers étaient cassés hors-ligne)
- [x] **Compression/minification** — même sans build, un script simple de minification avant
      déploiement réduirait le poids total (actuellement chargé tel quel, ~200 Ko de JS)
      → `npm run build` (`scripts/build.js`, terser + clean-css en devDependency) génère un
      dossier `dist/` : copie déployable du site avec chaque fichier `js/*.js` et
      `css/style.css` minifié sous le même nom/chemin — donc `index.html` et `sw.js` sont
      copiés tels quels, sans aucune réécriture de référence. Résultat mesuré : 535 Ko → 385 Ko
      (~28 % de gain, tous fichiers confondus, jusqu'à −55 % sur certains fichiers). `dist/`
      n'est jamais commité (ajouté au `.gitignore`, comme `node_modules/`). Aucun changement
      pour le développement courant : on continue d'éditer/tester les sources non minifiées
      directement, le build ne sert qu'avant un déploiement. Documenté dans `CONTRIBUTING.md`
      et `README.md`.

## 📈 Phase 4 — Croissance / communauté

- [x] **Analytics respectueux de la vie privée** (type Plausible/Umami, sans cookies) — pour
      savoir quelles missions bloquent le plus de joueurs, sans tracking intrusif
      → Choix de **GoatCounter** : sans cookie, sans donnée perso, open-source, hébergé (rien
      à opérer côté serveur), cohérent avec l'esprit « zéro compte » du jeu. Nouveau module
      `js/analytics.js`, chargé en dernier et en asynchrone (n'impacte ni l'affichage ni le
      hors-ligne). Garde-fous : **respecte Do Not Track / Global Privacy Control**, ne compte
      pas en local (localhost / `file:`), et surtout **`config-gated`** — tant que la constante
      `GC_CODE` est vide, le module ne charge rien et ne track rien (no-op total). Expose
      `window.trackEvent(nom)` pour les évènements personnalisés à venir (mission échouée,
      certificat obtenu…), déjà sûr à appeler partout (no-op si l'analytics est inactive).
      **ACTIVÉ le 2026-07-16** : compte créé, `GC_CODE = "marcorelli"` → dashboard sur
      https://marcorelli.goatcounter.com. Évènements par mission câblés dans la foulée :
      `mission-ok-{id}` (réussite), `mission-hint1/2/3-{id}` (paliers d'indices — le vrai
      signal « cette mission bloque »), `boss-ok-{id}`, `daily-ok`, `certificat-telecharge`.
      Tous les appels sont gardés par `typeof trackEvent === "function"` (harnais de test
      vm sans analytics.js) et restent no-op si DNT/GPC est actif ou hors production.
- [x] **Partage social des succès** — bouton "partager" sur le certificat et les badges
      (génère une image ou un lien préformaté pour Twitter/LinkedIn)
      → **Certificat** (`js/certificate.js`) : bouton « 📤 Partager » à côté du téléchargement.
      Utilise `navigator.share()` avec le PNG du certificat en pièce jointe quand le
      navigateur le permet (`canShare({files})`, mobile surtout), avec repli automatique
      sur texte + lien copiés dans le presse-papier (`prompt()` en dernier recours) —
      même mécanique que l'export de sauvegarde. **Badges** (`js/profile.js`) : bouton
      « 📋 Partager mes badges » sous la grille, génère un résumé texte (icônes des
      badges débloqués, badges secrets comptés à part sans être nommés, rang, XP, lien)
      copié ou partagé via la même logique. `AbortError` (fenêtre de partage fermée par
      le joueur) traité comme un non-évènement, pas une erreur.
- [x] **Serveur Discord / espace communautaire** — pour centraliser feedback, entraide entre
      joueurs, et annonces de nouveaux scénarios
      → Serveur créé, invitation permanente : https://discord.gg/42NN5ZtzKp. Lien intégré
      partout où ça compte : landing page (bouton dans le CTA final + footer), page Profil
      du jeu (bouton dans les Options), README (en-tête + section Contribuer)
- [x] **Page d'atterrissage dédiée** — actuellement le jeu = la landing page ; une vraie page
      marketing (screenshots, témoignages) avant le `▶ Commencer` pourrait améliorer la conversion
      → `landing.html` + `css/landing.css` (autonome, ne charge pas le CSS complet du jeu pour
      rester légère) : hero avec mockup de terminal animé (boot séquence tapée en JS,
      `js/landing.js`, dégradation propre sans JS et avec `prefers-reduced-motion`), bandeau de
      chiffres réels du contenu (missions, boss, niveaux — pas de faux compteur de joueurs, le
      projet n'a pas d'analytics pour l'instant), grille des 8 modes de jeu, section « pourquoi »
      mise en forme comme une vraie page de manuel (`man linuxdojo`). Pas de témoignages
      inventés : sans vrais retours de joueurs à citer, en fabriquer aurait été trompeur —
      remplacés par du contenu factuel (stats + description). `index.html` reste l'entrée
      principale du jeu (aucun changement d'URL racine, de service worker ou de manifest) ;
      `landing.html` est un point d'entrée additionnel pensé pour les liens externes (bio
      réseaux sociaux, Product Hunt...). Ajouté au sitemap, documenté dans le README.
- [ ] **Page de stats publique agrégée** — ex: "X commandes tapées par la communauté", "Y
      certificats délivrés" ; teasing léger pour donner envie de rejoindre (nécessite un
      minimum de backend/compteur côté serveur, donc dépend des analytics ci-dessus)

---

## 💭 Gros chantiers (structurants, plusieurs sessions de travail)

Ces items changent l'architecture du projet ou demandent une infra nouvelle. À ne lancer
que si vraiment décidé, car ils engagent sur la durée (maintenance double, backend à opérer...).

- **Version anglaise complète** (UI + 60 missions + terminal) — **EN COURS**. Architecture
  retenue : vrai système i18n (option 3), module central `js/i18n.js` (dictionnaire `UI` +
  `t()` pour l'interface, `pick({fr,en})` pour le contenu), sélecteur de langue qui bascule
  tout dynamiquement (reload). Repli FR systématique → on peut traduire progressivement sans
  jamais casser l'affichage. Découpage :
  - [x] **Phase A — Coquille d'interface** : `i18n.js`, sélecteur 🇫🇷/🇬🇧, annotation
    `data-i18n*` de tout `index.html`, rangs (`RANKS` en `{fr,en}`), labels JS de `game.js`.
    Toute l'UI bascule FR↔EN. 10 tests (`tests/i18n.test.js`, parité + couverture des clés).
  - [x] **Phase B — Contenu pédagogique** : les 10 scénarios / 60 missions (`levels.js`), les
    quiz de fin de chapitre (`quizzes.js`) et le glossaire de 62 commandes (`glossary.js`) sont
    traduits via overlays EN par id (`js/i18n/levels.en.js`, `quizzes.en.js`, `glossary.en.js`)
    fusionnés au boot (`overlayLevels`/`overlayQuizzes`/`overlayGlossary`) — fichiers FR intacts,
    EN additif. Littéraux (fichiers/chemins/hôtes/valeurs) gardés à l'identique pour ne pas casser
    les checks ; catégories du glossaire = clés FR (filtrage) + libellé traduit par `glossCat()`.
    16 tests (`tests/levels-i18n.test.js`).
  - [x] **Phase C — Modes annexes** : `challenges`, `bandit`, `expert`, `objectives`, `seasonal`,
    `kata`, `daily`, `boss`, `certificate`, badges (`game.js`), `gameshell` (Explorer) via overlays
    `js/i18n/*.en.js` ; **`terminal.js`** (le shell simulé, ~150 sorties) via un helper inline
    `sh("fr","en")`. Seuls 2 checks de mission dépendaient d'une sortie du terminal (git status,
    docker logs) → rendus bilingues (`/propre|clean/`, `/d.marr.|started/`). Tout le jeu est
    désormais bilingue FR↔EN. Nouveaux helpers : `overlayBosses`/`overlayWorld`/`overlayArray`/
    `overlayIndexed`/`sh`/`dateLocale`. Tests : 127 (dont `levels-i18n.test.js` = 27).
  - [x] **Phase D — Finitions** : `landing.html` (page marketing) bilingue via le même moteur
    `i18n.js` (annotée `data-i18n`, sélecteur 🇫🇷/🇬🇧 dans `.l-nav-right`, terminal animé du hero
    bilingue dans `landing.js`), `og:locale:alternate en_US` déclaré (index + landing), `<html lang>`
    dynamique. Test de couverture des clés étendu à `landing.html`. **i18n FR↔EN 100 % terminé.**
  Anciennes pistes écartées : dossier `/en/` dupliqué (double la maintenance), UI-seule
  (incomplet).
- **Compte utilisateur + sync cross-device** — actuellement tout est en `localStorage`, donc
  la progression est piégée sur un seul navigateur/appareil. Nécessite un vrai backend
  (auth + base de données), gros chantier d'infra.
- **Éditeur de missions communautaire** — permettre à la communauté de créer et partager ses
  propres scénarios/missions. Nécessite un format de mission exportable/importable, un
  back-office de modération, et probablement un backend.
- **App mobile native** (via Capacitor/Cordova) pour publication sur App Store / Play Store —
  le projet est déjà une PWA, donc c'est un wrapper plutôt qu'une réécriture, mais il faut
  gérer les spécificités stores (icônes, permissions, review Apple/Google).
- **Mode difficulté adaptative** — ajuster la difficulté des missions selon les erreurs du
  joueur (ex: proposer plus d'exercices sur `grep` si le joueur galère dessus), nécessite de
  repenser le système de progression linéaire actuel.
- **Vrai terminal Linux dans un conteneur** (sandbox isolée côté serveur/WASM) — pour les
  joueurs avancés qui veulent aller au-delà du simulateur et toucher un vrai shell. Change
  complètement la nature du projet (nécessite isolation/sécurité sérieuse), à ne considérer
  que si la demande existe vraiment.
- **Mode marque blanche / self-hosting pour écoles et formations** — permettre à une école ou
  un formateur de déployer sa propre instance avec son branding, ses scénarios additionnels,
  et un suivi de progression de sa classe. Débouché commercial potentiel, mais nécessite de
  découpler le contenu du code (config externalisée) et un vrai système de comptes.

---

## 📥 Idées en vrac (non triées)

Section de capture rapide — une idée qui arrive en cours de discussion atterrit ici en
premier, avant d'être rangée dans la bonne phase au prochain passage sur ce fichier.

*(2e fournée consignée le 2026-07-17 — idées débloquées par le nouveau socle moteur :
services systemd, utilisateurs/su, cron, réseau simulé et permissions réellement
appliquées. Classées par potentiel perçu.)*

**⭐ Les grosses idées (fort potentiel) :**
- [ ] **🚑 Salle d'astreinte — incidents aléatoires générés** : un mode où le moteur
      GÉNÈRE un incident au hasard (service tombé, port squatté, permission cassée,
      cron saboteuse, DNS menteur, disque « plein »…) et le joueur doit diagnostiquer
      SANS leçon ni indication, comme une vraie astreinte. Rejouable à l'infini, score
      au temps. C'est LA killer feature que le socle actuel rend possible : tous les
      ingrédients (services, cron, users, réseau, permissions) existent déjà — il ne
      manque que le générateur et l'habillage. Candidat n°1 de la prochaine session.
- [ ] **sudo simulé** — suite logique directe des permissions appliquées + utilisateurs :
      `sudo cat /etc/shadow` fonctionnerait si l'utilisateur est dans le groupe sudo
      (et sarah fraîchement ajoutée aussi !), refusé sinon avec le vrai message.
      Donnerait un SENS mécanique au groupe sudo du scénario 12, et permettrait des
      missions « élévation de privilèges » légitimes (et un pont vers rootQuest).
- [ ] **Éditeur nano simulé** — aujourd'hui le jeu ne sait PAS éditer un fichier (tout
      passe par echo/sed). Un mini-nano (ouvrir, modifier des lignes, Ctrl+O/Ctrl+X)
      débloquerait toute une classe de missions impossibles actuellement : « corrige
      la config nginx », « répare la crontab », « commente la ligne fautive ». Gros
      débloqueur pédagogique, effort moyen (un mode plein écran dans le terminal).
- [ ] **Scénarios communautaires en JSON (sans backend)** — version légère de
      l'« éditeur de missions » des gros chantiers : un format JSON documenté +
      import/export par fichier ou par URL (gist). Les profs/créateurs partagent leurs
      scénarios sur le Discord, zéro serveur à opérer. Marchepied idéal avant le vrai
      éditeur communautaire.

**Cohérence du contenu (dette à rattraper suite aux scénarios 11-14) :**
- [ ] **Glossaire : catégorie « Administration »** — les ~12 nouvelles commandes
      (systemctl, journalctl, crontab, useradd, passwd, usermod, groups, su, ip, dig,
      nslookup, curl -I) ne sont PAS dans le glossaire (62 commandes) ni dans `man`.
      À combler pour que la référence reste complète.
- [ ] **Katas 8-9** — mémoire musculaire des scénarios récents : un kata « incident
      systemd » (status/journalctl/stop/start/enable) et un kata « admin users/cron ».
- [ ] **Nouveaux défis chrono** exploitant systemctl/journalctl/crontab/dig (les 20
      défis actuels s'arrêtent aux commandes classiques).

**Rejouabilité / motivation :**
- [ ] **Ceintures intermédiaires téléchargeables** — pas que la Noire : ceinture
      jaune/orange/verte/marron aux paliers de progression, en PNG partageable comme
      le certificat. Chaque palier devient un petit événement à poster (viralité douce,
      le moteur canvas du certificat est réutilisable tel quel).
- [ ] **Boss Rush** — enchaîner les 7 boss d'affilée sans perdre ses cœurs, chrono
      global, record local. Contenu 100 % existant, juste un mode d'enchaînement.
- [ ] **Mode Histoire** — une trame narrative continue reliant les 14 scénarios (tu es
      le nouvel admin de la boîte, chaque scénario = une semaine de plus, avec des
      personnages récurrents — Sarah du scénario 12 revient, le ticket #4213…).
      Réécriture légère des intros de scénarios, gros gain d'immersion.

**Profondeur du moteur :**
- [ ] **SSH multi-machines** — mini-réseau de 2-3 machines ayant chacune son FS, ses
      services et ses utilisateurs ; `ssh` saute réellement de l'une à l'autre
      (FS échangé, prompt/hostname changent, `exit` revient, `scp` copie vraiment
      entre machines). Transformerait le scénario 9 et ouvrirait des niveaux
      d'infiltration « pivoting ». Chantier moteur du calibre des permissions.

**Nouveaux modes / contenu des modes :**
- [ ] **Mode Examen blanc** — 20 questions/missions tirées au hasard dans tout le programme,
      chrono global, note finale, re-passable à volonté. Pensé pour réviser avant un partiel ;
      très cohérent avec la cible étudiante (BTS SIO/SISR).
- [ ] **Onboarding « 2 minutes »** — mini-tutoriel guidé pour le visiteur qui n'a jamais
      touché un terminal (arrivée depuis la landing). À prioriser si les analytics montrent
      de l'abandon sur la mission 1.
- [ ] **Niveaux d'infiltration 16-20** exploitant les nouvelles commandes (cron caché,
      utilisateur suspect, service backdoor…)
- [ ] **Badges secrets supplémentaires** (le système `markSecret()` est générique et prêt)

---

## Comment lire ce fichier

- **Phase 1 à 4** : ordre de priorité suggéré, du plus rapide/sûr au plus structurant
- **Gros chantiers** : à traiter à part, pas dans l'enchaînement des phases — ce sont des
  décisions de fond, pas des tâches ponctuelles
- Rien ici n'est gravé dans le marbre : dis-moi ce qui t'intéresse et on ajuste l'ordre
