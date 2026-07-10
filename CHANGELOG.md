# Changelog

Toutes les évolutions notables du projet sont documentées ici.
Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [Non publié]

### Ajouté
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

### Modifié
- Réorganisation du dossier : `style.css` → `css/`, tous les `.js` → `js/`
  (racine gardée pour `index.html`, `manifest.json`, `sw.js` — contrainte du scope
  du service worker)
- Compteur d'accueil mis à jour : 8 scénarios · 48 missions (au lieu de 7 · 42)
- Certificat de fin de jeu : le total de missions affiché est maintenant calculé
  dynamiquement au lieu d'un nombre figé obsolète (`/ 36`)

### Corrigé
- Suppression d'un fichier `nojekyll` dupliqué (sans le point, doublon du `.nojekyll`
  correct)
- Le service worker rechargeait la page sans prévenir dès qu'une mise à jour était
  prête ; il attend maintenant une confirmation explicite

## [Antérieur]

État du projet avant le début de ce changelog : 7 scénarios, 42 missions, terminal
simulé avec ~55 commandes, modes Explorer/Défis/Infiltration/Boss/Kata/Bac à sable,
PWA installable hors-ligne, système de progression (XP, rangs, badges, thèmes).
