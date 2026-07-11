# 🥋 LinuxDojo

**Apprends Linux en jouant. Pour de vrai.**

PWA 100 % vanilla JS (zéro dépendance, aucun build requis pour jouer ou contribuer) : un terminal Linux simulé, des missions scénarisées, des boss fights et de la vraie pédagogie.

**▶ Jouer : https://tommarcorelli.github.io/LinuxDojo/**

## Les modes

| Mode | Description |
|---|---|
| 📖 **Apprendre** | 10 scénarios réalistes, 60 missions : leçon → exercice → explication. Quiz de fin de chapitre + révision espacée. Du premier `ls` jusqu'à la réponse à incident, l'**automatisation par scripts**, le **versioning avec Git**, l'**administration distante en SSH** et la **conteneurisation avec Docker**. Indices à 3 paliers (nudge gratuit → syntaxe → solution) pour ne jamais rester bloqué. Plus un **Mode Expert** (8 missions sans indices) pour ceux qui ont tout terminé. |
| 🗺 **Explorer** | Monde ouvert navigable en commandes : inventaire, PNJ, portes verrouillées, 3 gemmes à réunir. |
| ⚡ **Défis** | 20 défis chrono avec combo ×5 et record. |
| 🔐 **Infiltration** | 15 niveaux style OverTheWire/Bandit : fouille, filtre, décode (base64, ROT13, hex, double encodage). |
| ⚔️ **Salle des Boss** | 6 combats épiques en phases : le Kraken des Logs, le Spectre Invisible, l'Hydre des Données, le Golem Binaire, le Gardien des Serrures… et l'Examen de la Ceinture Noire. HP, cœurs, chrono. Battre le Sensei débloque un **certificat téléchargeable** (PNG). |
| 🥋 **Kata** | La mémoire musculaire du shell : 7 enchaînements de vraies commandes à taper au chrono. Mesure WPM et précision, garde tes records. |
| 🧪 **Bac à sable** | Terminal libre avec ~50 commandes simulées, système de fichiers explorable. |
| 📖 **Glossaire** | Référence complète des commandes (aussi accessible via `man <cmd>` dans le terminal !). |
| 👤 **Profil** | Rangs, badges, objectifs, heatmap d'activité style GitHub, thèmes déblocables, export/import de sauvegarde. |

## Le terminal simulé

**Filesystem hiérarchique réel** : `cd logs/2024`, `cd ..`, `cd /`, chemins absolus et relatifs, `~`, `mkdir -p`, `mv fichier dossier/`, `cp -r`, `rm -r`, `find` et `tree` récursifs. Dans le bac à sable, tout un petit système est explorable : `cat /etc/passwd`, `tree /var`… et `/root` est verrouillé (évidemment).

**Un vrai mini-shell** : variables (`x=5`, `echo $x`, `"$x"` vs `'$x'`), substitution de commande `$(…)`, boucles `for … in … ; do … done`, conditions `if [ -f x ]; then … else … fi`, `test`/`[ ]`, `while`, `seq`, `$?`, et exécution de scripts avec `bash script.sh` ou `./script.sh`. Multi-ligne géré (le prompt passe à `>` en attendant `done`/`fi`).

Navigation (`ls`, `cd`, `pwd`, `tree`, `find`), fichiers (`cat`, `head`, `tail`, `touch`, `mkdir`, `cp`, `mv`, `rm`, `chmod`, `chown`, `chgrp`), texte (`grep`, `sort`, `uniq`, `wc`, `cut`, `tr`, `sed`, `awk`, `diff`), système (`ps`, `kill`, `df`, `du`, `free`, `uptime`, `uname`, `date`, `history`, `env`, `export`, `alias`, `jobs`, `fg`, `xargs`), décodage (`base64`, `rot13`, `xxd`), versioning (`git init/add/commit/log/branch/checkout/status`), aide (`man`, `whatis`, `help`)…

Pipes `|`, redirections `>` et `>>`, jokers `*.txt` (même en sous-dossier : `ls logs/*.log`), autocomplétion Tab qui suit les chemins, historique ↑/↓, prompt qui affiche le dossier courant, messages d'erreur pédagogiques avec suggestions de typos.

Et quelques easter eggs : `cowsay`, `sl`, `fortune`, `sudo make me a sandwich`, `vim` (bon courage pour en sortir), `rm -rf /`…

## Progression

XP, 8 rangs (Bleu → Légende), 15 badges, 17 objectifs transversaux, défi du jour avec série 🔥, 8 thèmes visuels à débloquer, heatmap d'activité, et le **certificat de Ceinture Noire** à décrocher en battant le Sensei.

## Tech

- Vanilla JS / HTML / CSS — aucun framework, aucun build requis pour développer
- PWA : installable, hors-ligne (service worker)
- Sauvegarde locale (localStorage) + export/import par code
- Effets : Web Audio API, matrix rain, séquence de boot, particules, konami code 🎮
- Build de minification optionnel avant déploiement (`npm run build` → `dist/`,
  ~28 % de poids JS/CSS en moins) — voir [`CONTRIBUTING.md`](CONTRIBUTING.md#build-minification-avant-déploiement)

## Tests

Le simulateur de shell (`js/terminal.js`) a une suite de tests unitaires (Node, zéro dépendance) :

```bash
node tests/terminal.test.js
```

47 tests couvrant navigation/fichiers, pipes & redirections, jokers, variables & substitution
de commande, scripting (`for`/`if`/`bash`), permissions (`chmod`/`chown`/`chgrp`), les utilitaires
(`alias`, `xargs`, `diff`, jobs en arrière-plan), le réseau (`ssh`/`scp`/`netstat`), la simulation
Git, et les cas limites (commande inconnue, fichier absent, `rm -rf /`). Si un test casse après une
modification du terminal, c'est probablement une vraie régression à corriger avant de livrer.

## Structure du projet

```
LinuxDojo/
├── index.html          point d'entrée
├── manifest.json        config PWA
├── sw.js                 service worker (reste à la racine : scope global)
├── LICENSE               MIT
├── CONTRIBUTING.md       comment contribuer (commandes, missions, tests)
├── CODE_OF_CONDUCT.md
├── CHANGELOG.md
├── ROADMAP.md            ligne de route du projet
├── sitemap.xml / robots.txt
├── .github/
│   ├── workflows/tests.yml     CI : lance les tests à chaque push
│   └── ISSUE_TEMPLATE/         templates bug / suggestion
├── css/
│   └── style.css
├── js/
│   ├── terminal.js       le mini-shell simulé (cœur du projet)
│   ├── levels.js         scénarios & missions (9 chapitres)
│   ├── glossary.js       référence des commandes (man)
│   ├── game.js           état global, XP, rangs, badges
│   ├── gameshell.js       orchestration UI
│   ├── bandit.js / boss.js / kata.js / challenges.js / daily.js   modes de jeu
│   ├── certificate.js    génération du certificat PNG
│   ├── objectives.js / profile.js / quizzes.js
│   ├── fx.js             effets visuels/sonores
│   └── sw-register.js    enregistrement + bannière de mise à jour du SW
├── tests/
│   └── terminal.test.js  tests unitaires du parseur (node tests/terminal.test.js)
└── icons/
```

## Contribuer

Voir [`CONTRIBUTING.md`](CONTRIBUTING.md) pour les détails techniques, et [`ROADMAP.md`](ROADMAP.md)
pour la ligne de route et les idées déjà identifiées.
