// glossary.js — Référence complète des commandes Linux (man simplifié)

const GLOSSARY = [
  // ── Navigation ──
  { cmd:"ls", cat:"Navigation", desc:"Liste les fichiers et dossiers.",
    syntax:"ls [options] [chemin]",
    options:[["-l","format long : permissions, taille, date"],["-a","affiche les fichiers cachés"],["-h","tailles lisibles (Ko, Mo, Go)"],["-t","trie par date de modification"]],
    examples:[["ls","liste simple"],["ls -la","détaillé + cachés"],["ls -lh /var","tailles lisibles d'un dossier"]] },
  { cmd:"cd", cat:"Navigation", desc:"Change de répertoire.",
    syntax:"cd [chemin]",
    options:[["cd ..","dossier parent"],["cd ~","dossier personnel"],["cd -","dossier précédent"],["cd /","racine du système"]],
    examples:[["cd logs","entrer dans logs/"],["cd ..","remonter"],["cd /etc","chemin absolu"]] },
  { cmd:"pwd", cat:"Navigation", desc:"Affiche le chemin du répertoire courant.",
    syntax:"pwd", options:[], examples:[["pwd","→ /home/user"]] },

  // ── Fichiers ──
  { cmd:"cat", cat:"Fichiers", desc:"Affiche le contenu d'un fichier.",
    syntax:"cat [fichier]",
    options:[["-n","numérote les lignes"]],
    examples:[["cat readme.txt","lire un fichier"],["cat a.txt b.txt","concaténer deux fichiers"]] },
  { cmd:"less", cat:"Fichiers", desc:"Lit un long fichier page par page.",
    syntax:"less [fichier]",
    options:[["Espace","page suivante"],["b","page précédente"],["/motif","rechercher"],["q","quitter"]],
    examples:[["less access.log","parcourir un gros log"]] },
  { cmd:"head", cat:"Fichiers", desc:"Affiche les premières lignes d'un fichier.",
    syntax:"head [-n N] fichier",
    options:[["-n 5","les 5 premières lignes"],["(défaut)","10 lignes"]],
    examples:[["head -n 3 log.txt","3 premières lignes"],["head -1 f.csv","l'en-tête d'un CSV"]] },
  { cmd:"tail", cat:"Fichiers", desc:"Affiche les dernières lignes (la fin des logs !).",
    syntax:"tail [-n N] fichier",
    options:[["-n 5","les 5 dernières lignes"],["-f","suit le fichier en direct (logs live)"]],
    examples:[["tail -n 20 app.log","les 20 dernières lignes"],["tail -f app.log","surveiller en temps réel"]] },
  { cmd:"tree", cat:"Fichiers", desc:"Affiche l'arborescence des dossiers en arbre.",
    syntax:"tree [chemin]",
    options:[["-L 2","limite la profondeur à 2 niveaux"],["-a","inclut les fichiers cachés"]],
    examples:[["tree","arbre du dossier courant"]] },
  { cmd:"touch", cat:"Fichiers", desc:"Crée un fichier vide (ou met à jour sa date).",
    syntax:"touch [fichier]", options:[],
    examples:[["touch notes.txt","créer un fichier vide"],["touch a b c","créer 3 fichiers"]] },
  { cmd:"mkdir", cat:"Fichiers", desc:"Crée un dossier.",
    syntax:"mkdir [options] nom",
    options:[["-p","crée les dossiers parents manquants"]],
    examples:[["mkdir projets","créer un dossier"],["mkdir -p a/b/c","créer une arborescence"]] },
  { cmd:"cp", cat:"Fichiers", desc:"Copie un fichier ou dossier.",
    syntax:"cp [options] source destination",
    options:[["-r","copie récursive (dossiers)"],["-i","confirme avant d'écraser"]],
    examples:[["cp a.txt b.txt","copier un fichier"],["cp -r dir/ copie/","copier un dossier"]] },
  { cmd:"mv", cat:"Fichiers", desc:"Déplace OU renomme un fichier.",
    syntax:"mv source destination", options:[],
    examples:[["mv old.txt new.txt","renommer"],["mv f.txt /tmp/","déplacer"]] },
  { cmd:"rm", cat:"Fichiers", desc:"Supprime définitivement (pas de corbeille !).",
    syntax:"rm [options] fichier",
    options:[["-r","supprime un dossier et son contenu"],["-i","confirme chaque suppression"],["-f","force sans confirmation"]],
    examples:[["rm temp.log","supprimer un fichier"],["rm -r dir/","supprimer un dossier"]] },

  // ── Recherche ──
  { cmd:"grep", cat:"Recherche", desc:"Cherche un motif dans un fichier.",
    syntax:"grep [options] motif fichier",
    options:[["-i","ignore la casse"],["-n","numéros de ligne"],["-r","récursif"],["-v","inverse (lignes SANS le motif)"],["-c","compte les correspondances"]],
    examples:[["grep ERROR app.log","trouver les erreurs"],["grep -i warn *.log","insensible à la casse"]] },
  { cmd:"find", cat:"Recherche", desc:"Trouve des fichiers selon des critères.",
    syntax:"find [chemin] [critères]",
    options:[["-name '*.txt'","par nom/extension"],["-type f / d","fichiers / dossiers"],["-mtime -7","modifiés < 7 jours"],["-size +1M","plus de 1 Mo"]],
    examples:[["find . -name '*.log'","tous les .log"],["find /home -type d","tous les dossiers"]] },
  { cmd:"wc", cat:"Recherche", desc:"Compte lignes, mots ou caractères.",
    syntax:"wc [options] [fichier]",
    options:[["-l","lignes"],["-w","mots"],["-c","caractères"]],
    examples:[["wc -l data.txt","nombre de lignes"],["grep X f | wc -l","compter des correspondances"]] },
  { cmd:"sort", cat:"Recherche", desc:"Trie les lignes.",
    syntax:"sort [options] [fichier]",
    options:[["-r","ordre inverse"],["-n","tri numérique"],["-u","supprime les doublons"]],
    examples:[["sort noms.txt","tri alphabétique"],["sort -n nombres.txt","tri numérique"]] },
  { cmd:"| (pipe)", cat:"Recherche", desc:"Relie la sortie d'une commande à l'entrée d'une autre.",
    syntax:"commande1 | commande2",
    options:[],
    examples:[["ls | grep .txt","lister puis filtrer"],["cat log | grep ERR | wc -l","filtrer puis compter"]] },
  { cmd:"diff", cat:"Recherche", desc:"Compare deux fichiers ligne par ligne et affiche leurs différences.",
    syntax:"diff fichier1 fichier2",
    options:[["<","ligne présente seulement dans fichier1"],[">","ligne présente seulement dans fichier2"],["3c3","la ligne 3 a changé"]],
    examples:[["diff old.conf new.conf","voir ce qui a changé"],["diff a.txt b.txt","aucune sortie = fichiers identiques"]] },
  { cmd:"xargs", cat:"Recherche", desc:"Transforme une entrée standard en arguments pour une autre commande.",
    syntax:"cmd1 | xargs [-n N] cmd2",
    options:[["-n 1","applique cmd2 une fois par élément"],["(défaut)","passe tous les éléments d'un coup"]],
    examples:[["find . -name '*.log' | xargs rm","supprimer tous les logs trouvés"],["echo a b c | xargs -n1 echo","une ligne par mot"]] },
  { cmd:"uniq", cat:"Recherche", desc:"Supprime les lignes dupliquées ADJACENTES (trie d'abord !).",
    syntax:"sort fichier | uniq [options]",
    options:[["-c","compte les occurrences de chaque ligne"],["-d","affiche seulement les doublons"]],
    examples:[["sort f.txt | uniq","liste sans doublons"],["sort f.txt | uniq -c","avec compteur"]] },

  // ── Permissions & Système ──
  { cmd:"chmod", cat:"Permissions & Système", desc:"Modifie les permissions d'un fichier.",
    syntax:"chmod [droits] fichier",
    options:[["+x","ajoute l'exécution"],["755","rwxr-xr-x (scripts)"],["644","rw-r--r-- (fichiers)"],["600","rw------- (secrets)"]],
    examples:[["chmod +x script.sh","rendre exécutable"],["chmod 600 clef.key","privé au propriétaire"]] },
  { cmd:"chown", cat:"Permissions & Système", desc:"Change le propriétaire (et le groupe) d'un fichier.",
    syntax:"chown utilisateur[:groupe] fichier",
    options:[["chown sensei fichier","change juste le propriétaire"],["chown sensei:dojo fichier","change propriétaire ET groupe"]],
    examples:[["chown sensei secret.key","donner le fichier à sensei"],["chown root:root config.sh","propriété système classique"]] },
  { cmd:"chgrp", cat:"Permissions & Système", desc:"Change le groupe propriétaire d'un fichier.",
    syntax:"chgrp groupe fichier", options:[],
    examples:[["chgrp dojo notes.txt","fichier appartient désormais au groupe dojo"]] },
  { cmd:"jobs / fg", cat:"Permissions & Système", desc:"Gère les tâches lancées en arrière-plan.",
    syntax:"commande &   ·   jobs   ·   fg [%N]",
    options:[["cmd &","lance cmd en arrière-plan, rend la main tout de suite"],["jobs","liste les tâches en cours"],["fg","ramène la dernière tâche au premier plan"],["fg %2","ramène le job numéro 2"]],
    examples:[["long_script.sh &","lancer en tâche de fond"],["jobs","voir ce qui tourne"],["fg","reprendre la main dessus"]] },
  { cmd:"ps", cat:"Permissions & Système", desc:"Liste les processus en cours.",
    syntax:"ps aux",
    options:[["a","tous les utilisateurs"],["u","format lisible"],["x","processus sans terminal"]],
    examples:[["ps aux","tous les processus"],["ps aux | grep nginx","chercher un processus"]] },
  { cmd:"kill", cat:"Permissions & Système", desc:"Arrête un processus par son PID.",
    syntax:"kill [signal] PID",
    options:[["kill PID","arrêt propre (SIGTERM)"],["kill -9 PID","arrêt forcé (SIGKILL)"]],
    examples:[["kill 1234","arrêter le processus 1234"]] },
  { cmd:"whoami / id", cat:"Permissions & Système", desc:"Affiche ton identité sur le système.",
    syntax:"whoami   ·   id",
    options:[["whoami","nom d'utilisateur"],["id","UID, GID, groupes"]],
    examples:[["whoami","→ user"],["id","→ uid=1000(user)..."]] },
  { cmd:"df", cat:"Permissions & Système", desc:"Affiche l'espace disque disponible.",
    syntax:"df -h",
    options:[["-h","tailles lisibles (Go, Mo)"]],
    examples:[["df -h","espace par partition"]] },
  { cmd:"echo $VAR", cat:"Permissions & Système", desc:"Affiche une variable d'environnement.",
    syntax:"echo $VARIABLE",
    options:[["$HOME","dossier personnel"],["$PATH","chemins des programmes"],["$USER","nom d'utilisateur"]],
    examples:[["echo $HOME","→ /home/user"],["env","toutes les variables"]] },
  { cmd:"env / export", cat:"Permissions & Système", desc:"Liste ou définit les variables d'environnement.",
    syntax:"env   ·   export NOM=valeur",
    options:[["env","liste toutes les variables"],["env | grep X","chercher une variable"],["export DEBUG=1","définir une variable"]],
    examples:[["env | grep PATH","voir le PATH"],["export EDITOR=vim","définir son éditeur"]] },
  { cmd:"du / free / uptime", cat:"Permissions & Système", desc:"Santé du système : disque, mémoire, temps de fonctionnement.",
    syntax:"du -h   ·   free -h   ·   uptime",
    options:[["du -h","taille des fichiers/dossiers"],["free -h","mémoire RAM utilisée/libre"],["uptime","depuis quand la machine tourne"]],
    examples:[["du -h","tailles lisibles"],["free -h","état de la RAM"]] },
  { cmd:"uname / hostname / date", cat:"Permissions & Système", desc:"Identité de la machine : système, nom, date.",
    syntax:"uname -a   ·   hostname   ·   date",
    options:[["uname -a","noyau + architecture"],["hostname","nom de la machine"],["date","date et heure"]],
    examples:[["uname -a","tout savoir sur le noyau"]] },
  { cmd:"history", cat:"Permissions & Système", desc:"Affiche l'historique des commandes tapées.",
    syntax:"history",
    options:[["!42","ré-exécute la commande n°42"],["Ctrl+R","recherche interactive dans l'historique"]],
    examples:[["history","tout l'historique"],["history | grep ssh","retrouver une commande"]] },
  { cmd:"man / whatis", cat:"Aide", desc:"LE réflexe : le manuel intégré de chaque commande.",
    syntax:"man commande   ·   whatis commande",
    options:[["man grep","manuel complet de grep"],["whatis ls","description en une ligne"],["q","quitter le manuel"]],
    examples:[["man tar","ne plus jamais oublier -czf"],["whatis awk","c'est quoi awk déjà ?"]] },

  // ── Réseau & Archives ──
  { cmd:"tar", cat:"Réseau & Archives", desc:"Crée/extrait des archives compressées.",
    syntax:"tar [options] archive.tar.gz [fichiers]",
    options:[["-c","créer"],["-x","extraire"],["-z","compresser (gzip)"],["-f","nom du fichier"]],
    examples:[["tar -czf a.tar.gz dir/","créer une archive"],["tar -xzf a.tar.gz","extraire"]] },
  { cmd:"curl", cat:"Réseau & Archives", desc:"Fait des requêtes HTTP en ligne de commande.",
    syntax:"curl [options] URL",
    options:[["-I","headers seulement"],["-o fichier","sauvegarder"],["-X POST","méthode POST"]],
    examples:[["curl https://site.com","requête GET"],["curl -I https://site.com","vérifier le statut"]] },
  { cmd:"ssh", cat:"Réseau & Archives", desc:"Se connecte à distance à une autre machine.",
    syntax:"ssh utilisateur@hôte",
    options:[["exit","se déconnecter et revenir en local"]],
    examples:[["ssh admin@webserver01","se connecter au serveur"],["exit","revenir sur sa machine"]] },
  { cmd:"scp", cat:"Réseau & Archives", desc:"Copie un fichier vers (ou depuis) une machine distante via SSH.",
    syntax:"scp fichier utilisateur@hôte:/chemin",
    options:[], examples:[["scp app.py admin@webserver01:/var/www","envoyer un fichier sur le serveur"]] },
  { cmd:"netstat / ss", cat:"Réseau & Archives", desc:"Liste les connexions et ports réseau en écoute.",
    syntax:"netstat   ·   ss",
    options:[["LISTEN","le service attend des connexions sur ce port"]],
    examples:[["netstat","voir quels services tournent sur la machine"]] },
  { cmd:"ln", cat:"Réseau & Archives", desc:"Crée un lien (raccourci) symbolique.",
    syntax:"ln -s cible nom_du_lien",
    options:[["-s","lien symbolique (soft)"],["-f","remplace un lien existant"]],
    examples:[["ln -s /app/v2 current","current → v2"]] },

  // ── Texte & Décodage ──
  { cmd:"echo", cat:"Texte & Décodage", desc:"Affiche du texte ; avec > écrit dans un fichier.",
    syntax:'echo "texte" [> fichier]',
    options:[[">","redirige (écrase le fichier)"],[">>","ajoute à la fin"]],
    examples:[['echo "hi" > f.txt',"créer/écraser"],['echo "x" >> f.txt',"ajouter"]] },
  { cmd:"sed", cat:"Texte & Décodage", desc:"Remplace du texte dans un flux.",
    syntax:"sed 's/ancien/nouveau/g' fichier",
    options:[["s/x/y/","1ère occurrence par ligne"],["s/x/y/g","toutes les occurrences"],["-i","modifie le fichier"]],
    examples:[["sed 's/dev/prod/g' cfg","remplacer partout"]] },
  { cmd:"awk", cat:"Texte & Décodage", desc:"Traite un texte colonne par colonne.",
    syntax:"awk -F',' '{print $1}' fichier",
    options:[["$1, $2","numéro de colonne"],["-F','","séparateur (ici virgule)"],["NR","numéro de ligne"]],
    examples:[["awk '{print $1}' f","1ère colonne"],["awk -F',' '{print $2}' d.csv","2e colonne CSV"]] },
  { cmd:"cut", cat:"Texte & Décodage", desc:"Découpe chaque ligne pour extraire des colonnes.",
    syntax:"cut -d'sép' -fN fichier",
    options:[["-d','","séparateur (ici la virgule)"],["-f1","1ère colonne"],["-f1,3","colonnes 1 et 3"]],
    examples:[["cut -d',' -f2 users.csv","2e colonne d'un CSV"],["cut -d':' -f1 /etc/passwd","les logins du système"]] },
  { cmd:"tr", cat:"Texte & Décodage", desc:"Remplace ou supprime des caractères dans un flux.",
    syntax:"commande | tr 'set1' 'set2'",
    options:[["'a-z' 'A-Z'","minuscules → MAJUSCULES"],["-d 'x'","supprime tous les x"]],
    examples:[["cat f | tr 'a-z' 'A-Z'","tout en majuscules"],["echo o-la | tr -d '-'","supprime les tirets"]] },
  { cmd:"base64", cat:"Texte & Décodage", desc:"Encode / décode en Base64.",
    syntax:"base64 [-d] [fichier]",
    options:[["-d","décoder"],["(sans -d)","encoder"]],
    examples:[["base64 -d s.b64","décoder un fichier"],['echo "hi" | base64',"encoder"]] },
  { cmd:"rot13", cat:"Texte & Décodage", desc:"Chiffre/déchiffre en ROT13 (décalage de 13 lettres).",
    syntax:"rot13 [fichier]",
    options:[["(involutif)","rot13 deux fois = texte d'origine"]],
    examples:[["rot13 cipher.txt","déchiffrer"],["cat f | rot13","via un pipe"]] },
  { cmd:"xxd", cat:"Texte & Décodage", desc:"Convertit texte ↔ hexadécimal.",
    syntax:"xxd -r -p [fichier]",
    options:[["-p","texte → hex compact"],["-r -p","hex → texte"]],
    examples:[["xxd -r -p hex.txt","hex → texte"],["echo hi | xxd -p","texte → hex"]] },

  // ── Scripting ──
  { cmd:"variables", cat:"Scripting", desc:"Mémorise une valeur pour la réutiliser.",
    syntax:"nom=valeur      puis      $nom",
    options:[["x=5","affecte (aucun espace autour du =)"],["$x","lit la valeur"],['"$x"','lu dans les doubles quotes'],["'$x'","littéral dans les simples quotes"]],
    examples:[["serveur=web-01","mémoriser"],["echo $serveur","→ web-01"]] },
  { cmd:"$( )", cat:"Scripting", desc:"Substitution : remplace par la sortie d'une commande.",
    syntax:"variable=$(commande)   ·   \"... $(commande) ...\"",
    options:[["$(ls)","liste des fichiers"],["$(cat f)","contenu de f"],["$(ls *.log | wc -l)","un pipeline entier"]],
    examples:[["n=$(ls | wc -l)","compter dans une variable"],['echo "le $(date)"',"injecter la date"]] },
  { cmd:"for", cat:"Scripting", desc:"Boucle : répète un bloc pour chaque élément.",
    syntax:"for VAR in liste; do  …  ; done",
    options:[["for f in *.txt","boucle sur les .txt"],["do … done","le corps répété"],["$f","l'élément courant"]],
    examples:[["for f in *.log; do wc -l $f; done","compter chaque log"],["for i in 1 2 3; do echo $i; done","1 2 3"]] },
  { cmd:"if", cat:"Scripting", desc:"Condition : n'exécute un bloc que si c'est vrai.",
    syntax:"if [ condition ]; then … else … ; fi",
    options:[["[ -f f ]","le fichier existe"],["[ -d d ]","le dossier existe"],["[ $a = $b ]","égalité (texte)"],["[ $n -gt 3 ]","n > 3 (-lt -eq -ge…)"]],
    examples:[["if [ -f cfg ]; then echo ok; fi","teste un fichier"],["if [ $x -gt 10 ]; then echo grand; fi",""]] },
  { cmd:"test / [ ]", cat:"Scripting", desc:"Évalue une condition (vrai/faux) pour if et while.",
    syntax:"[ expression ]   (espaces obligatoires)",
    options:[["-f / -d / -e","fichier / dossier / existe"],["-z / -n","chaîne vide / non vide"],["-eq -ne -lt -gt","comparaisons numériques"],["= / !=","comparaisons de texte"]],
    examples:[["[ -f app.js ]","app.js existe ?"],["[ 5 -gt 3 ]","vrai"]] },
  { cmd:"alias", cat:"Scripting", desc:"Crée un raccourci pour une commande (ou une combinaison d'options).",
    syntax:"alias nom='commande'   ·   unalias nom",
    options:[["alias","liste tous les alias définis"],["unalias nom","supprime un alias"]],
    examples:[["alias ll='ls -la'","puis tape juste 'll'"],["alias gs='git status'","raccourci pratique"]] },
  { cmd:"bash", cat:"Scripting", desc:"Exécute un script .sh (suite de commandes dans un fichier).",
    syntax:"bash script.sh    ou    ./script.sh",
    options:[["bash s.sh","exécute avec bash"],["./s.sh","exécute si +x (chmod)"],["cat s.sh","à lire AVANT de lancer !"]],
    examples:[["cat deploy.sh","lire le script"],["bash deploy.sh","l'exécuter"]] },

  // ── Git ──
  { cmd:"git init", cat:"Git", desc:"Transforme le dossier courant en dépôt Git (crée .git/).",
    syntax:"git init", options:[],
    examples:[["git init","à faire une seule fois, au début du projet"]] },
  { cmd:"git status", cat:"Git", desc:"Affiche l'état du dépôt : fichiers en scène, non suivis, branche active.",
    syntax:"git status", options:[],
    examples:[["git status","à taper à tout moment, sans risque"]] },
  { cmd:"git add", cat:"Git", desc:"Met des fichiers « en scène » (staging), prêts pour le prochain commit.",
    syntax:"git add fichier    ·    git add .",
    options:[["git add f","un seul fichier"],["git add .","tous les fichiers du dossier"]],
    examples:[["git add app.py","préparer un fichier"],["git add .","tout préparer d'un coup"]] },
  { cmd:"git commit", cat:"Git", desc:"Enregistre un instantané permanent des fichiers en scène.",
    syntax:'git commit -m "message"',
    options:[["-m \"...\"","message obligatoire décrivant le changement"]],
    examples:[['git commit -m "fix bug login"',"valider avec un message clair"]] },
  { cmd:"git log", cat:"Git", desc:"Affiche l'historique des commits (hash, auteur, message).",
    syntax:"git log", options:[],
    examples:[["git log","du commit le plus récent au plus ancien"]] },
  { cmd:"git branch / checkout", cat:"Git", desc:"Liste, crée ou change de branche de travail.",
    syntax:"git branch [nom]    ·    git checkout [-b] nom",
    options:[["git branch","liste les branches (* = active)"],["git branch nom","crée SANS y basculer"],["git checkout nom","bascule sur une branche existante"],["git checkout -b nom","crée ET bascule en une commande"]],
    examples:[["git checkout -b feature-x","nouvelle branche de travail"],["git branch","voir où on en est"]] },
];

const GLOSSARY_CATS = ["Tout","Navigation","Fichiers","Recherche","Permissions & Système","Réseau & Archives","Texte & Décodage","Scripting","Git","Aide"];

let glossaryFilter = "Tout";
let glossarySearch = "";

function renderGlossary() {
  const list = document.getElementById("glossary-list");
  if (!list) return;
  const q = glossarySearch.trim().toLowerCase();
  const items = GLOSSARY.filter(g => {
    const catOk = glossaryFilter === "Tout" || g.cat === glossaryFilter;
    const searchOk = !q || g.cmd.toLowerCase().includes(q) || g.desc.toLowerCase().includes(q)
      || g.options.some(o => (o[0]+o[1]).toLowerCase().includes(q));
    return catOk && searchOk;
  });
  if (!items.length) { list.innerHTML = '<p style="color:var(--text-dim);padding:20px">Aucune commande trouvée.</p>'; return; }
  list.innerHTML = items.map(g => `
    <div class="gloss-card" data-cmd="${g.cmd}">
      <div class="gloss-card-head">
        <span class="gloss-cmd">${g.cmd}</span>
        <span class="gloss-desc">${g.desc}</span>
        <span class="gloss-cat">${g.cat}</span>
        <span class="gloss-chevron">▾</span>
      </div>
      <div class="gloss-body">
        <div class="gloss-syntax">${g.syntax.replace(/</g,"&lt;")}</div>
        ${g.options.length ? '<div class="gloss-sub">OPTIONS</div>' + g.options.map(o => `<div class="gloss-opt"><span>${o[0]}</span><em>${o[1]}</em></div>`).join("") : ""}
        <div class="gloss-sub">EXEMPLES</div>
        ${g.examples.map(e => `<div class="gloss-ex"><code>$ ${e[0].replace(/</g,"&lt;")}</code><span># ${e[1]}</span></div>`).join("")}
      </div>
    </div>`).join("");
  // Expansion au clic
  list.querySelectorAll(".gloss-card-head").forEach(h => {
    h.addEventListener("click", () => h.parentElement.classList.toggle("open"));
  });
}

function renderGlossaryCats() {
  const el = document.getElementById("glossary-cats");
  if (!el) return;
  el.innerHTML = GLOSSARY_CATS.map(c =>
    `<button class="gloss-chip${c===glossaryFilter?" active":""}" data-cat="${c}">${c}</button>`).join("");
  el.querySelectorAll(".gloss-chip").forEach(b =>
    b.addEventListener("click", () => { glossaryFilter = b.dataset.cat; renderGlossaryCats(); renderGlossary(); }));
}

let glossaryInit = false;
function initGlossary() {
  if (glossaryInit) return;
  glossaryInit = true;
  renderGlossaryCats();
  renderGlossary();
  const search = document.getElementById("glossary-search");
  if (search) search.addEventListener("input", e => { glossarySearch = e.target.value; renderGlossary(); });
}
