// i18n/challenges.en.js — Traductions anglaises des défis de challenges.js.
// Chargé juste après js/challenges.js. Indexé par id : { category, desc }.
// Le check() teste la sortie du terminal (restée FR) → non impacté.
// overlayArray() (js/i18n.js) applique l'overlay si LANG === "en".

const CHALLENGES_EN = {
  1:  { category: "Navigation",    desc: "Display the contents of the current directory." },
  2:  { category: "Navigation",    desc: "Display the absolute path of the current directory." },
  3:  { category: "Files",         desc: "Display the contents of the <strong>message.txt</strong> file." },
  4:  { category: "Hidden files",  desc: "List <strong>all</strong> files, including hidden ones." },
  5:  { category: "Grep",          desc: "Find the lines containing <strong>ERROR</strong> in <strong>app.log</strong>." },
  6:  { category: "Creation",      desc: "Create a directory named <strong>archive</strong>." },
  7:  { category: "Grep",          desc: "Search for <strong>linux</strong> in <strong>notes.txt</strong> ignoring case." },
  8:  { category: "Pipes",         desc: "List the files and filter only the <strong>.log</strong> ones with a pipe." },
  9:  { category: "Counting",      desc: "Count the number of lines in <strong>data.txt</strong>." },
  10: { category: "Search",        desc: "Find all the <strong>.sh</strong> files in the current directory." },
  11: { category: "Advanced pipes", desc: "Count how many lines contain <strong>ERROR</strong> in <strong>app.log</strong>." },
  12: { category: "Sorting",       desc: "Sort the <strong>noms.txt</strong> file alphabetically." },
  13: { category: "Replacement",   desc: "Replace <strong>dev</strong> with <strong>prod</strong> in <strong>config.txt</strong>." },
  14: { category: "Permissions",   desc: "Display the detailed permissions of all files." },
  15: { category: "Extraction",    desc: "Display only the first column of <strong>data.csv</strong> (comma separator)." },
  16: { category: "Head",          desc: "Display only the <strong>first 3 lines</strong> of <strong>journal.txt</strong>." },
  17: { category: "Tail",          desc: "Display only the <strong>last 2 lines</strong> of <strong>journal.txt</strong> (the most recent)." },
  18: { category: "Cut",           desc: "Extract the <strong>2nd column</strong> (the emails) of <strong>contacts.txt</strong>. Separator: semicolon." },
  19: { category: "Uniq",          desc: "The <strong>visiteurs.txt</strong> file is full of duplicates. Display the list <strong>sorted without duplicates</strong>." },
  20: { category: "RTFM",          desc: "A true ninja reads the docs: display the <strong>manual page</strong> of the <strong>grep</strong> command." },
  21: { category: "Services",      desc: "The <strong>nginx</strong> service is down. Check its exact status before acting." },
  22: { category: "Logs",          desc: "Check the <strong>nginx</strong> service logs to understand why it crashed." },
  23: { category: "Scheduling",    desc: "Install the task schedule defined in <strong>taches.cron</strong>." },
  24: { category: "Network",       desc: "Resolve the IP address associated with <strong>intranet.dojo.lan</strong>." },
};

if (typeof overlayArray === "function") overlayArray(CHALLENGES, CHALLENGES_EN, ["category", "desc"]);
