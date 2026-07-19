// js/landing.js — Landing page uniquement.
// Le terminal de la hero contient déjà son état final dans le HTML (voir
// landing.html) : si ce script ne se charge pas, ou si l'utilisateur préfère
// moins d'animations, rien ne change et le contenu reste lisible tel quel.
// Ici, on efface puis on retape la même séquence, une seule fois, en
// construisant le texte déjà tapé ligne par ligne (pas de manipulation de
// nœuds DOM en continu, pour rester simple et robuste).

(() => {
  const y = document.getElementById("l-year");
  if (y) y.textContent = new Date().getFullYear();
})();

(() => {
  const el = document.getElementById("hero-term");
  if (!el) return;

  // Bilingue : `LANG` est défini par js/i18n.js, chargé avant ce script.
  const isEN = (typeof LANG !== "undefined" && LANG === "en");
  const PROMPT = isEN ? "visitor@linuxdojo:~$ " : "visiteur@linuxdojo:~$ ";
  const SEQUENCE = isEN ? [
    { cmd: "whoami", out: "visitor" },
    { cmd: "cat programme.txt", out: "84 missions · 7 boss fights · 15 infiltration levels\n20 timed challenges · 1 Black Belt certificate" },
    { cmd: "./linuxdojo --start", out: 'Loading the dojo... <span class="dim">[██████████] 100%</span>\nReady. Click ▶ Start to enter.' },
  ] : [
    { cmd: "whoami", out: "visiteur" },
    { cmd: "cat programme.txt", out: "84 missions · 7 combats de boss · 15 niveaux d'infiltration\n24 défis chrono · 1 certificat de Ceinture Noire" },
    { cmd: "./linuxdojo --demarrer", out: 'Chargement du dojo... <span class="dim">[██████████] 100%</span>\nPrêt. Clique sur ▶ Commencer pour entrer.' },
  ];

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const promptSpan = cmd => '<span class="p">' + PROMPT + '</span>' + cmd;

  // État final "tout tapé" — rendu tel quel si l'utilisateur préfère moins
  // d'animations (garantit un hero traduit sans dépendre de l'animation).
  const finalHTML = () => {
    let done = "";
    for (const step of SEQUENCE) done += promptSpan(step.cmd) + "\n" + '<span class="out">' + step.out + "</span>\n\n";
    return done + promptSpan("") + '<span class="l-term-cursor"></span>';
  };

  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.innerHTML = finalHTML();
    return;
  }

  async function run() {
    let done = "";
    el.innerHTML = "";
    for (const step of SEQUENCE) {
      let shown = "";
      for (const ch of step.cmd) {
        shown += ch;
        el.innerHTML = done + promptSpan(shown) + '<span class="l-term-cursor"></span>';
        await sleep(24 + Math.random() * 30);
      }
      await sleep(200);
      done += promptSpan(shown) + "\n" + '<span class="out">' + step.out + "</span>\n\n";
      el.innerHTML = done;
      await sleep(280);
    }
    el.innerHTML = done + promptSpan("") + '<span class="l-term-cursor"></span>';
  }

  run();
})();
