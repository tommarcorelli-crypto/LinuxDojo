#!/usr/bin/env node
// scripts/build.js
//
// Génère un dossier dist/ prêt à déployer : copie fidèle du site avec les
// fichiers JS et CSS minifiés (même noms, mêmes chemins relatifs — donc
// index.html et sw.js n'ont besoin d'aucune modification, ils sont copiés
// tels quels).
//
// Ce script n'introduit PAS d'étape de build obligatoire pour le développement
// courant : on continue d'éditer et de tester js/*.css et css/style.css
// directement, et d'ouvrir index.html tel quel en local. Le build ne sert
// qu'à produire une version plus légère avant un déploiement.
//
// Usage : npm run build
//   → génère ./dist (supprimé et recréé à chaque exécution)

const fs = require("fs");
const path = require("path");
const { minify: minifyJs } = require("terser");
const CleanCSS = require("clean-css");

const ROOT = path.join(__dirname, "..");
const DIST = path.join(ROOT, "dist");

// Fichiers/dossiers copiés tels quels (pas de transformation nécessaire :
// mêmes noms de fichiers JS/CSS partout, donc aucune référence à réécrire).
const STATIC_COPY = [
  "index.html",
  "sw.js",
  "manifest.json",
  "robots.txt",
  "sitemap.xml",
  ".nojekyll",
  "icons",
];

function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} o`;
  return `${(bytes / 1024).toFixed(1)} Ko`;
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

async function minifyJsFile(srcPath, destPath) {
  const code = fs.readFileSync(srcPath, "utf8");
  const result = await minifyJs(code, {
    compress: true,
    mangle: true,
    format: { comments: false },
  });
  if (result.error) throw result.error;
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, result.code, "utf8");
  return { before: Buffer.byteLength(code), after: Buffer.byteLength(result.code) };
}

function minifyCssFile(srcPath, destPath) {
  const code = fs.readFileSync(srcPath, "utf8");
  const output = new CleanCSS({ level: 2 }).minify(code);
  if (output.errors.length) throw new Error(output.errors.join("\n"));
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, output.styles, "utf8");
  return { before: Buffer.byteLength(code), after: Buffer.byteLength(output.styles) };
}

async function main() {
  // Repart d'un dist/ propre à chaque build.
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  let totalBefore = 0;
  let totalAfter = 0;
  const rows = [];

  // --- JS ---
  const jsDir = path.join(ROOT, "js");
  const jsFiles = fs.readdirSync(jsDir).filter((f) => f.endsWith(".js"));
  for (const file of jsFiles) {
    const { before, after } = await minifyJsFile(
      path.join(jsDir, file),
      path.join(DIST, "js", file)
    );
    totalBefore += before;
    totalAfter += after;
    rows.push([`js/${file}`, before, after]);
  }

  // --- CSS ---
  const cssPath = path.join(ROOT, "css", "style.css");
  const { before: cssBefore, after: cssAfter } = minifyCssFile(
    cssPath,
    path.join(DIST, "css", "style.css")
  );
  totalBefore += cssBefore;
  totalAfter += cssAfter;
  rows.push(["css/style.css", cssBefore, cssAfter]);

  // --- Fichiers statiques (copiés tels quels) ---
  for (const name of STATIC_COPY) {
    const src = path.join(ROOT, name);
    if (fs.existsSync(src)) copyRecursive(src, path.join(DIST, name));
  }

  // --- Rapport ---
  const nameWidth = Math.max(...rows.map((r) => r[0].length));
  console.log("Fichier".padEnd(nameWidth), "  Avant".padStart(10), "  Après".padStart(10), "  Gain");
  for (const [name, before, after] of rows) {
    const gain = before > 0 ? Math.round((1 - after / before) * 100) : 0;
    console.log(
      name.padEnd(nameWidth),
      fmtSize(before).padStart(10),
      fmtSize(after).padStart(10),
      `  -${gain}%`
    );
  }
  const totalGain = totalBefore > 0 ? Math.round((1 - totalAfter / totalBefore) * 100) : 0;
  console.log("-".repeat(nameWidth + 34));
  console.log(
    "TOTAL".padEnd(nameWidth),
    fmtSize(totalBefore).padStart(10),
    fmtSize(totalAfter).padStart(10),
    `  -${totalGain}%`
  );
  console.log(`\n✅ Build généré dans ${path.relative(ROOT, DIST)}/ — prêt à déployer.`);
}

main().catch((err) => {
  console.error("❌ Échec du build :", err);
  process.exit(1);
});
