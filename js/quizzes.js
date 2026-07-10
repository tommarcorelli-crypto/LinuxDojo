// quizzes.js — Quiz de fin de chapitre (QCM, 3 questions/chapitre)

const QUIZZES = {
  1: [
    { q: "Quelle commande affiche AUSSI les fichiers cachés ?", options: ["ls", "ls -a", "cat -h", "cd -a"], answer: 1 },
    { q: "Comment savoir dans quel dossier on se trouve ?", options: ["cd", "pwd", "whoami", "ls -l"], answer: 1 },
    { q: "Pour lire un très long fichier page par page ?", options: ["cat", "echo", "less", "touch"], answer: 2 },
  ],
  2: [
    { q: "Quelle commande crée un dossier ?", options: ["touch", "mkdir", "cp", "cd"], answer: 1 },
    { q: "Quelle commande renomme OU déplace un fichier ?", options: ["cp", "mv", "rm", "ln"], answer: 1 },
    { q: "Que fait la redirection « > » ?", options: ["Ajoute à la fin", "Écrase le fichier", "Supprime le fichier", "Liste le dossier"], answer: 1 },
  ],
  3: [
    { q: "Quelle commande compte le nombre de lignes ?", options: ["sort", "wc -l", "ls", "grep -n"], answer: 1 },
    { q: "À quoi sert le pipe « | » ?", options: ["Supprimer un fichier", "Relier la sortie d'une commande à l'entrée d'une autre", "Créer un dossier", "Trier"], answer: 1 },
    { q: "Que fait l'option -i de grep ?", options: ["Inverse le résultat", "Ignore la casse (maj/min)", "Compte les lignes", "Affiche les numéros"], answer: 1 },
  ],
  4: [
    { q: "Comment rendre un script exécutable ?", options: ["chmod +x script.sh", "chmod 644 script.sh", "rm script.sh", "ls -l script.sh"], answer: 0 },
    { q: "Quelle commande liste les processus en cours ?", options: ["ls", "ps aux", "df -h", "grep"], answer: 1 },
    { q: "$HOME, c'est…", options: ["une commande", "un fichier caché", "une variable d'environnement", "un dossier temporaire"], answer: 2 },
  ],
  5: [
    { q: "Comment créer une archive compressée ?", options: ["tar -xzf a.tar.gz", "tar -czf a.tar.gz dossier/", "curl a.tar.gz", "sed a.tar.gz"], answer: 1 },
    { q: "Quelle commande remplace du texte dans un flux ?", options: ["sed", "wc", "cat", "ls"], answer: 0 },
    { q: "Comment extraire la 1ère colonne d'un CSV ?", options: ["grep ',' data.csv", "sort data.csv", "awk -F',' '{print $1}' data.csv", "wc -l data.csv"], answer: 2 },
  ],
  6: [
    { q: "Pour voir les événements les PLUS RÉCENTS d'un log ?", options: ["head auth.log", "tail auth.log", "cat auth.log", "sort auth.log"], answer: 1 },
    { q: "Compter les lignes FAILED d'un fichier ?", options: ["wc FAILED f.log", "grep -c FAILED f.log", "count FAILED f.log", "grep -v FAILED f.log"], answer: 1 },
    { q: "chmod 600 rapport.txt, ça donne quoi ?", options: ["Lisible par tout le monde", "Exécutable par tous", "Lecture/écriture pour le propriétaire seul", "Fichier supprimé"], answer: 2 },
  ],
  7: [
    { q: "Comment définir correctement une variable ?", options: ["x = 5", "x=5", "$x=5", "set x 5"], answer: 1 },
    { q: "Que fait $(ls | wc -l) ?", options: ["Affiche une erreur", "Crée un fichier", "Remplace par le nombre de fichiers", "Rien"], answer: 2 },
    { q: "Une boucle for se ferme par…", options: ["end", "fi", "done", "stop"], answer: 2 },
    { q: "Quelle condition teste si le fichier f existe ?", options: ["[ -d f ]", "[ -f f ]", "[ -x f ]", "[ f exists ]"], answer: 1 },
  ],
  8: [
    { q: "Quelle commande transforme un dossier en dépôt Git ?", options: ["git start", "git init", "git new", "git create"], answer: 1 },
    { q: "Comment mettre TOUS les fichiers en scène avant un commit ?", options: ["git commit .", "git save .", "git add .", "git stage all"], answer: 2 },
    { q: "À quoi sert « -m » dans git commit -m \"...\" ?", options: ["Mode silencieux", "Le message du commit", "Merge automatique", "Nombre de fichiers"], answer: 1 },
    { q: "Quelle commande crée une branche ET bascule dessus en une fois ?", options: ["git branch -b nom", "git switch nom", "git checkout -b nom", "git new nom"], answer: 2 },
  ],
  9: [
    { q: "Quelle commande permet de se connecter à distance à un serveur ?", options: ["remote", "ssh utilisateur@hôte", "connect hôte", "distant hôte"], answer: 1 },
    { q: "Comment revenir sur sa machine locale après une connexion SSH ?", options: ["quit", "back", "exit", "stop"], answer: 2 },
    { q: "Quelle commande envoie un fichier vers un serveur distant ?", options: ["send", "scp fichier user@hôte:/chemin", "push fichier", "upload fichier"], answer: 1 },
    { q: "Que signifie « LISTEN » dans la sortie de netstat ?", options: ["Le service a planté", "Le service attend des connexions sur ce port", "Le port est fermé", "Le service est en pause"], answer: 1 },
  ],
};

const Quiz = {
  chapterId: null,
  idx: 0,
  score: 0,
  locked: false,

  open(chapterId) {
    if (!QUIZZES[chapterId]) return;
    this.chapterId = chapterId;
    this.idx = 0;
    this.score = 0;
    this.locked = false;
    document.getElementById("quiz-result").style.display = "none";
    document.getElementById("quiz-options").style.display = "";
    document.getElementById("modal-quiz").classList.add("open");
    this._render();
  },

  _render() {
    const qs = QUIZZES[this.chapterId];
    const q = qs[this.idx];
    document.getElementById("quiz-chapter").textContent = "🎓 Quiz — " + (CHAPTERS.find(c => c.id === this.chapterId)?.title || "");
    document.getElementById("quiz-progress").textContent = "Question " + (this.idx + 1) + "/" + qs.length;
    document.getElementById("quiz-question").textContent = q.q;
    const opt = document.getElementById("quiz-options");
    opt.innerHTML = "";
    this.locked = false;
    q.options.forEach((o, i) => {
      const b = document.createElement("button");
      b.className = "quiz-opt";
      b.textContent = o;
      b.addEventListener("click", () => this._answer(i, b));
      opt.appendChild(b);
    });
  },

  _answer(i, btn) {
    if (this.locked) return;
    this.locked = true;
    const q = QUIZZES[this.chapterId][this.idx];
    const buttons = [...document.querySelectorAll("#quiz-options .quiz-opt")];
    buttons.forEach((b, j) => {
      if (j === q.answer) b.classList.add("correct");
      else if (j === i) b.classList.add("wrong");
      b.style.pointerEvents = "none";
    });
    if (i === q.answer) { this.score++; if (typeof SFX !== "undefined") SFX.success(); }
    else if (typeof SFX !== "undefined") SFX.error();

    setTimeout(() => {
      this.idx++;
      if (this.idx < QUIZZES[this.chapterId].length) this._render();
      else this._finish();
    }, 900);
  },

  _finish() {
    const qs = QUIZZES[this.chapterId];
    const perfect = this.score === qs.length;
    const gain = this.score * 15 + (perfect ? 25 : 0);
    document.getElementById("quiz-options").style.display = "none";
    const res = document.getElementById("quiz-result");
    res.style.display = "block";
    res.innerHTML =
      `<div class="quiz-score">${this.score}/${qs.length}</div>
       <p>${perfect ? "🏆 Sans faute ! Bonus +25 XP" : (this.score >= 2 ? "👍 Bien joué !" : "📚 Revois le chapitre et retente !")}</p>
       <p class="quiz-gain">+${gain} XP</p>`;

    // Récompense + marquage (une seule fois, ou si meilleur score)
    const first = !GAME.quizzes.has(this.chapterId);
    if (first) {
      GAME.quizzes.add(this.chapterId);
      if (typeof persist === "function") persist();
    }
    if (gain > 0 && typeof addXP === "function") addXP(gain);
    if (perfect && typeof burstParticles === "function") burstParticles(window.innerWidth/2, window.innerHeight/2);
    if (typeof renderSidebar === "function") renderSidebar();
  },
};

function openQuiz(chapterId) { Quiz.open(chapterId); }
