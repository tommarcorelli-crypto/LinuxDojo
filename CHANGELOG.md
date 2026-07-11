# Changelog

Toutes les évolutions notables du projet sont documentées ici.
Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [Non publié]

### Ajouté
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
