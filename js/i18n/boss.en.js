// i18n/boss.en.js — Traductions anglaises de la Salle des Boss (boss.js).
// Chargé juste après js/boss.js. Indexé par id de boss :
//   { name, tagline, story, winText, taunts:[...], phases:[{title,desc,hint}] }
// fs/check/timeLimit/envVars restent partagés. Les mots tapés liés au contenu
// des fichiers (ex: peur/courage du Sensei) sont gardés à l'identique.
// overlayBosses() (js/i18n.js) applique si LANG === "en".

const BOSS_FIGHTS_EN = {

  kraken: {
    name: "The Kraken of Logs",
    tagline: "It drowned the server under an ocean of logs.",
    story: "3:47 a.m. The prod server is suffocating: a tentacled monster spews torrents of logs. Every correct command slices off a tentacle.",
    taunts: ["The Kraken splashes you with ink!", "A tentacle whips the screen!", "GLUB. The Kraken laughs underwater."],
    winText: "The Kraken sinks into the abyss of /dev/null. The logs are purified.",
    phases: [
      { title: "Spot the beast", desc: "The Kraken hides in the biggest file. List the files <strong>with their sizes</strong> to spot it.", hint: "ls -l" },
      { title: "Slice the first tentacle", desc: "Extract all the <strong>ERROR</strong> lines from <code>huge.log</code> — those are the monster's tentacles.", hint: "grep ERROR huge.log" },
      { title: "Count the tentacles", desc: "How many tentacles (<strong>ERROR lines</strong>) are left in <code>huge.log</code>? Give the exact count.", hint: "grep -c ERROR huge.log   (or grep ERROR huge.log | wc -l)" },
      { title: "Locate its lair", desc: "The Kraken attacks from an IP. Extract the <strong>3rd column</strong> (the IPs) of <code>access.log</code> (separator: space).", hint: "awk '{print $3}' access.log   (or cut -d' ' -f3 access.log)" },
      { title: "The finishing blow", desc: "The Kraken owns the <strong>nginx</strong> process. Find its PID with <code>ps aux</code>, then <strong>finish it off</strong>.", hint: "ps aux   then   kill <nginx PID>" },
    ],
  },

  spectre: {
    name: "The Invisible Wraith",
    tagline: "It haunts hidden files and forgotten variables.",
    story: "A ghost slipped into the system. No one sees it... except those who know to look at hidden files. Reveal it, name it, exorcise it.",
    taunts: ["The Wraith flies through your screen, screaming!", "Wooooosh. An icy chill runs across the keyboard.", "The Wraith breathes on your history..."],
    winText: "Named and revealed, the Wraith dissolves in one last \"whooosh\". The system is exorcised.",
    phases: [
      { title: "Reveal the invisible", desc: "The Wraith hides in this directory. List <strong>ALL</strong> files, including the invisible ones.", hint: "ls -a   (hidden files start with a dot)" },
      { title: "Read the spectral message", desc: "Read the contents of the hidden file <code>.fantome</code>.", hint: "cat .fantome" },
      { title: "Decrypt its true name", desc: "Its name is encrypted with <strong>ROT13</strong> in <code>.grimoire</code>. Decrypt it to break its power.", hint: "rot13 .grimoire" },
      { title: "The exorcism", desc: "The Wraith took refuge in an <strong>environment variable</strong>: <code>$SPECTRE</code>. Print it to expel it.", hint: "echo $SPECTRE   (or env | grep SPECTRE)" },
    ],
  },

  hydre: {
    name: "The Data Hydra",
    tagline: "Cut off one head, two duplicates grow back.",
    story: "The Hydra corrupted the database: duplicates everywhere, mixed-up columns, data whispered in lowercase. Only a master of sorting can tame it.",
    taunts: ["The Hydra duplicates your data before your eyes!", "Three new heads hiss in unison!", "SSSSSS. The Hydra spits out a corrupted CSV."],
    winText: "Sorted, deduplicated, decapitated. The Hydra is now just a clean, unique list.",
    phases: [
      { title: "Observe the heads", desc: "The registry is huge. Display only the <strong>first 3 lines</strong> of <code>registre.txt</code> to size up the beast.", hint: "head -n 3 registre.txt" },
      { title: "Isolate the venom", desc: "The <code>hydre.csv</code> file lists the heads (name,venom,strength). Extract the <strong>2nd column</strong> (the venom).", hint: "cut -d',' -f2 hydre.csv   (or awk -F',' '{print $2}')" },
      { title: "Cut the duplicates", desc: "Every severed head grew back doubled in <code>clones.txt</code>! Sort then <strong>remove the duplicates</strong> to keep only one of each.", hint: "sort clones.txt | uniq   (or sort -u clones.txt)" },
      { title: "The word of power", desc: "To stun the Hydra, you must SHOUT. Convert the contents of <code>sortilege.txt</code> to <strong>UPPERCASE</strong> (pipe + tr).", hint: "cat sortilege.txt | tr 'a-z' 'A-Z'" },
      { title: "The final antidote", desc: "The antidote is in <code>potions.txt</code>, on the line containing <strong>ANTIDOTE</strong>, after the colon. Chain <code>grep</code> then <code>cut</code> to extract it alone.", hint: "grep ANTIDOTE potions.txt | cut -d':' -f2" },
    ],
  },

  golem: {
    name: "The Binary Golem",
    tagline: "Its heart beats in base64. Its runes speak in hexadecimal.",
    story: "A silicon statue blocks the server room. Four runes lock its heart: decode them all to shut it down.",
    taunts: ["The Golem pounds the floor. 01010111 01101111 01110111.", "A rune lights up and blinds you!", "The Golem recompiles its heart..."],
    winText: "The last rune goes dark. The Golem kneels, then freezes forever. kernel panic — core dumped.",
    phases: [
      { title: "The Base64 rune", desc: "The first rune, <code>rune1.b64</code>, is encoded in <strong>Base64</strong>. Decode it.", hint: "base64 -d rune1.b64" },
      { title: "The Hexadecimal rune", desc: "The second rune, <code>rune2.hex</code>, is engraved in <strong>hexadecimal</strong>. Convert it back to text.", hint: "xxd -r -p rune2.hex" },
      { title: "The Caesar rune", desc: "The third rune, <code>rune3.rot</code>, is encrypted with <strong>ROT13</strong>. Decrypt it.", hint: "rot13 rune3.rot" },
      { title: "The Golem's heart", desc: "Its heart is <strong>doubly encoded</strong>: ROT13 <em>then</em> Base64. Chain <code>base64 -d</code> then <code>rot13</code> in a single pipeline on <code>coeur.enc</code>.", hint: "cat coeur.enc | base64 -d | rot13" },
    ],
  },

  gardien: {
    name: "The Keeper of Locks",
    tagline: "Every door it guards has a lock. Some are broken.",
    story: "A bronze statue watches over the treasure chamber. It only lets through those who know how to read — and fix — permissions.",
    taunts: ["The Keeper tightens a lock behind you!", "CLICK. A door locks behind your back.", "The Keeper creaks: \"Rights aren't given, they're earned.\""],
    winText: "The last lock gives way. The Keeper bows and lets you in: the treasure is yours.",
    phases: [
      { title: "Spot the breach", desc: "One treasure door was left wide open. List the files <strong>with their permissions</strong> to find which one is accessible to everyone.", hint: "ls -l" },
      { title: "Close the breach", desc: "<code>journal.txt</code> is wide open. Restrict it so <strong>only the owner</strong> can read and write (<code>600</code>).", hint: "chmod 600 journal.txt" },
      { title: "Unmask the impostor", desc: "A thief posed as the Keeper. Display the permissions <strong>and owners</strong> to find who owns <code>relique.txt</code>.", hint: "ls -l" },
      { title: "Reclaim the relic", desc: "Return <code>relique.txt</code> to the Keeper: change its owner and group to <strong>gardien</strong>.", hint: "chown gardien:gardien relique.txt" },
      { title: "The final door", desc: "The opening mechanism is in <code>ouvrir.sh</code>, but it's not executable. Make it <strong>executable</strong> to trigger the last lock.", hint: "chmod +x ouvrir.sh" },
    ],
  },

  sensei: {
    name: "SENSEI — Black Belt Exam",
    tagline: "Six trials. Tight timers. No mercy.",
    story: "The Sensei awaits at the top of the dojo. Six lightning trials, drawn from everything you've learned. Pass them and leave with the Black Belt. 🖤",
    taunts: ["The Sensei dodges without even looking at you.", "\"Too slow. Try again.\"", "The Sensei sighs, disappointed."],
    winText: "The Sensei bows. \"You are ready.\" He hands you the LinuxDojo BLACK BELT. 🖤",
    phases: [
      { title: "Trial 1 — The all-seeing eye", desc: "A hidden file containing the seal lurks in this directory. <strong>Reveal it then read it</strong> — fast.", hint: "ls -a   then   cat .sceau" },
      { title: "Trial 2 — Count without error", desc: "How many <strong>FAILED</strong> lines in <code>audit.log</code>? The exact count, nothing else.", hint: "grep -c FAILED audit.log" },
      { title: "Trial 3 — Find the needle", desc: "Somewhere lies a <strong>private key</strong> (a <code>.key</code> file). Locate it with <code>find</code>.", hint: "find . -name '*.key'" },
      { title: "Trial 4 — Column surgery", desc: "Extract the <strong>3rd column</strong> (the codes) of <code>disciples.csv</code>, comma separator.", hint: "awk -F',' '{print $3}' disciples.csv   (or cut -d',' -f3)" },
      { title: "Trial 5 — Rewrite history", desc: "The scroll <code>voie.txt</code> contains a lie: replace <strong>peur</strong> with <strong>courage</strong>, everywhere.", hint: "sed 's/peur/courage/g' voie.txt" },
      { title: "Final trial — The Sensei's secret", desc: "The last secret is <strong>doubly sealed</strong>: ROT13 then Base64. A single pipeline to break it: <code>base64 -d</code> then <code>rot13</code>.", hint: "cat secret.enc | base64 -d | rot13" },
    ],
  },

};

if (typeof overlayBosses === "function") overlayBosses(BOSS_FIGHTS_EN);
