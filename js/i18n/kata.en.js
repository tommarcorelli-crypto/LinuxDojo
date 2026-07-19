// i18n/kata.en.js — Traductions anglaises du mode Kata (kata.js).
// Chargé juste après js/kata.js. Indexé par id : { name, desc }.
// Les `cmds` sont les commandes à TAPER (verbatim) : seul le kata Git est
// surchargé pour traduire le message de commit ("premier commit" → "first
// commit"). overlayArray() applique si LANG === "en".

const KATAS_EN = {
  bases:    { name: "The Fundamentals", desc: "The basic moves, repeated a thousand times." },
  pipes:    { name: "Filters & Pipes",  desc: "Connecting commands, the plumber's art." },
  perms:    { name: "Permissions",      desc: "Who's allowed what. rwx." },
  reseau:   { name: "Network",          desc: "Talking to other machines." },
  decode:   { name: "Decoding",         desc: "Cracking encoded secrets." },
  sysadmin: { name: "Sysadmin",         desc: "The administrator's daily grind." },
  git: {
    name: "Git",
    desc: "Version control in your fingers.",
    cmds: ["git init", "git status", "git add .", "git commit -m \"first commit\"", "git log", "git branch feature", "git checkout -b hotfix", "git checkout main"],
  },
  systemd: { name: "Systemd Incident", desc: "Diagnose and restart a service, without flinching." },
  admin:   { name: "Administration",   desc: "Create an account, grant it rights, schedule a task." },
};

if (typeof overlayArray === "function") overlayArray(KATAS, KATAS_EN, ["name", "desc", "cmds"]);
