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

- [ ] **Analytics respectueux de la vie privée** (type Plausible/Umami, sans cookies) — pour
      savoir quelles missions bloquent le plus de joueurs, sans tracking intrusif
- [ ] **Partage social des succès** — bouton "partager" sur le certificat et les badges
      (génère une image ou un lien préformaté pour Twitter/LinkedIn)
- [ ] **Serveur Discord / espace communautaire** — pour centraliser feedback, entraide entre
      joueurs, et annonces de nouveaux scénarios
- [ ] **Page d'atterrissage dédiée** — actuellement le jeu = la landing page ; une vraie page
      marketing (screenshots, témoignages) avant le `▶ Commencer` pourrait améliorer la conversion
- [ ] **Page de stats publique agrégée** — ex: "X commandes tapées par la communauté", "Y
      certificats délivrés" ; teasing léger pour donner envie de rejoindre (nécessite un
      minimum de backend/compteur côté serveur, donc dépend des analytics ci-dessus)

---

## 💭 Gros chantiers (structurants, plusieurs sessions de travail)

Ces items changent l'architecture du projet ou demandent une infra nouvelle. À ne lancer
que si vraiment décidé, car ils engagent sur la durée (maintenance double, backend à opérer...).

- **Version anglaise complète** (UI + 60 missions + terminal) — traduire ~17 fichiers JS +
  tout le contenu pédagogique. 3 architectures possibles :
  1. Dossier `/en/` séparé avec copie complète du site (simple, mais double la maintenance
     à chaque futur changement)
  2. Traduire seulement l'UI (menus/boutons), missions restent en français (rapide, mais incomplet)
  3. Vrai système i18n — dictionnaire de traduction centralisé (`fr.js`/`en.js`), sélecteur
     de langue qui bascule tout dynamiquement (le mieux sur le long terme, mais gros refactor
     de 17 fichiers, donc plus risqué)
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

- [ ] *(vide pour l'instant — les idées récentes ont déjà été rangées dans les phases ci-dessus)*

---

## Comment lire ce fichier

- **Phase 1 à 4** : ordre de priorité suggéré, du plus rapide/sûr au plus structurant
- **Gros chantiers** : à traiter à part, pas dans l'enchaînement des phases — ce sont des
  décisions de fond, pas des tâches ponctuelles
- Rien ici n'est gravé dans le marbre : dis-moi ce qui t'intéresse et on ajuste l'ordre
