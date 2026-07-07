# 🥋 LinuxDojo

**Apprends Linux en jouant. Pour de vrai.**

PWA 100 % vanilla JS (zéro dépendance, zéro build) : un terminal Linux simulé, des missions scénarisées, des boss fights et de la vraie pédagogie.

**▶ Jouer : https://tommarcorelli.github.io/LinuxDojo/**

## Les modes

| Mode | Description |
|---|---|
| 📖 **Apprendre** | 6 scénarios réalistes, 36 missions : leçon → exercice → explication. Quiz de fin de chapitre + révision espacée. Du premier `ls` jusqu'à la réponse à incident (scénario « Intrusion détectée »). |
| 🗺 **Explorer** | Monde ouvert navigable en commandes : inventaire, PNJ, portes verrouillées, 3 gemmes à réunir. |
| ⚡ **Défis** | 20 défis chrono avec combo ×5 et record. |
| 🔐 **Infiltration** | 15 niveaux style OverTheWire/Bandit : fouille, filtre, décode (base64, ROT13, hex, double encodage). |
| ⚔️ **Salle des Boss** | 5 combats épiques en phases : le Kraken des Logs, le Spectre Invisible, l'Hydre des Données, le Golem Binaire… et l'Examen de la Ceinture Noire. HP, cœurs, chrono. Battre le Sensei débloque un **certificat téléchargeable** (PNG). |
| 🥋 **Kata** | La mémoire musculaire du shell : 6 enchaînements de vraies commandes à taper au chrono. Mesure WPM et précision, garde tes records. |
| 🧪 **Bac à sable** | Terminal libre avec ~50 commandes simulées, système de fichiers explorable. |
| 📖 **Glossaire** | Référence complète des commandes (aussi accessible via `man <cmd>` dans le terminal !). |
| 👤 **Profil** | Rangs, badges, objectifs, heatmap d'activité style GitHub, thèmes déblocables, export/import de sauvegarde. |

## Le terminal simulé

**Filesystem hiérarchique réel** : `cd logs/2024`, `cd ..`, `cd /`, chemins absolus et relatifs, `~`, `mkdir -p`, `mv fichier dossier/`, `cp -r`, `rm -r`, `find` et `tree` récursifs. Dans le bac à sable, tout un petit système est explorable : `cat /etc/passwd`, `tree /var`… et `/root` est verrouillé (évidemment).

Navigation (`ls`, `cd`, `pwd`, `tree`, `find`), fichiers (`cat`, `head`, `tail`, `touch`, `mkdir`, `cp`, `mv`, `rm`, `chmod`), texte (`grep`, `sort`, `uniq`, `wc`, `cut`, `tr`, `sed`, `awk`), système (`ps`, `kill`, `df`, `du`, `free`, `uptime`, `uname`, `date`, `history`, `env`, `export`), décodage (`base64`, `rot13`, `xxd`), aide (`man`, `whatis`, `help`)…

Pipes `|`, redirections `>` et `>>`, jokers `*.txt` (même en sous-dossier : `ls logs/*.log`), autocomplétion Tab qui suit les chemins, historique ↑/↓, prompt qui affiche le dossier courant, messages d'erreur pédagogiques avec suggestions de typos.

Et quelques easter eggs : `cowsay`, `sl`, `fortune`, `sudo make me a sandwich`, `vim` (bon courage pour en sortir), `rm -rf /`…

## Progression

XP, 8 rangs (Bleu → Légende), 13 badges, 16 objectifs transversaux, défi du jour avec série 🔥, 8 thèmes visuels à débloquer, heatmap d'activité, et le **certificat de Ceinture Noire** à décrocher en battant le Sensei.

## Tech

- Vanilla JS / HTML / CSS — aucun framework, aucun build
- PWA : installable, hors-ligne (service worker)
- Sauvegarde locale (localStorage) + export/import par code
- Effets : Web Audio API, matrix rain, séquence de boot, particules, konami code 🎮
