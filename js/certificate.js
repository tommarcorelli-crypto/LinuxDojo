// certificate.js — Certificat de Ceinture Noire : rendu canvas → PNG partageable.
// Débloqué en battant le Sensei (boss final). Dessin 100% vectoriel (aucune
// dépendance à une police emoji) pour un rendu identique partout.

const NAME_KEY = "linuxdojo_name";

function ninjaName() {
  try { return (localStorage.getItem(NAME_KEY) || "").trim() || t("cert.defaultName"); }
  catch { return t("cert.defaultName"); }
}
function hasNinjaName() {
  try { return !!(localStorage.getItem(NAME_KEY) || "").trim(); } catch { return false; }
}
function setNinjaName() {
  const cur = hasNinjaName() ? ninjaName() : "";
  const v = prompt(t("cert.namePrompt"), cur);
  if (v === null) return;
  try { localStorage.setItem(NAME_KEY, v.trim().slice(0, 32)); } catch {}
  if (typeof renderCertificate === "function") renderCertificate();
  if (typeof SFX !== "undefined") SFX.enter();
}

function senseiDefeated() {
  try { return (((JSON.parse(localStorage.getItem("linuxdojo_boss")) || {}).defeated) || []).includes("sensei"); }
  catch { return false; }
}

// ── Ceintures intermédiaires (paliers de rang, avant la Noire) ─────
// 7 paliers, calés sur les seuils de RANKS[0..6] (Bleu → Root) ; la
// Ceinture Noire reste liée à la victoire sur le Sensei (senseiDefeated()),
// pas à un seuil d'XP — c'est un aboutissement, pas juste un palier de plus.
const BELTS = [
  { id: "blanche",  min: 0,    name: { fr: "Ceinture Blanche",  en: "White Belt"  }, color: "#e2e8f0" },
  { id: "jaune",    min: 100,  name: { fr: "Ceinture Jaune",    en: "Yellow Belt" }, color: "#eab308" },
  { id: "orange",   min: 250,  name: { fr: "Ceinture Orange",   en: "Orange Belt" }, color: "#f97316" },
  { id: "verte",    min: 500,  name: { fr: "Ceinture Verte",    en: "Green Belt"  }, color: "#16a34a" },
  { id: "bleue",    min: 800,  name: { fr: "Ceinture Bleue",    en: "Blue Belt"   }, color: "#3b82f6" },
  { id: "violette", min: 1200, name: { fr: "Ceinture Violette", en: "Purple Belt" }, color: "#7c3aed" },
  { id: "marron",   min: 1800, name: { fr: "Ceinture Marron",   en: "Brown Belt"  }, color: "#78350f" },
];
function currentXP() { return (typeof GAME !== "undefined" && GAME.xp) || 0; }
function beltUnlocked(belt) { return currentXP() >= belt.min; }


function _isLightColor(hex) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) > 170;
}

function _roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Sceau : ceinture nouée dans un double anneau doré. `color` paramétrable
// (noir par défaut, pour le certificat historique de Ceinture Noire) — les
// ceintures intermédiaires réutilisent ce même sceau avec leur propre couleur.
function _drawSeal(ctx, cx, cy, r, color) {
  const sash = color || "#111827";
  const light = _isLightColor(sash);
  ctx.save();
  // halo
  const halo = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.5);
  halo.addColorStop(0, "rgba(234,179,8,0.30)");
  halo.addColorStop(1, "rgba(234,179,8,0)");
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(cx, cy, r * 1.5, 0, Math.PI * 2); ctx.fill();
  // anneaux
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#eab308";
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#a78bfa";
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2); ctx.stroke();
  // ceinture (bande + nœud + pans) — contour plus clair si la ceinture est
  // elle-même claire (blanche/jaune), pour rester lisible sur le fond sombre
  ctx.fillStyle = sash;
  ctx.strokeStyle = light ? "#94a3b8" : "#374151";
  ctx.lineWidth = 1.5;
  const bw = r * 1.15, bh = r * 0.32;
  _roundRect(ctx, cx - bw / 2, cy - bh / 2, bw, bh, 4); ctx.fill(); ctx.stroke();
  // nœud
  _roundRect(ctx, cx - r * 0.17, cy - r * 0.24, r * 0.34, r * 0.48, 4);
  ctx.fill(); ctx.stroke();
  // deux pans qui pendent
  ctx.fillStyle = "#0b0f1a";
  _roundRect(ctx, cx - r * 0.15, cy + r * 0.12, r * 0.12, r * 0.5, 3); ctx.fill(); ctx.stroke();
  _roundRect(ctx, cx + r * 0.03, cy + r * 0.12, r * 0.12, r * 0.5, 3); ctx.fill(); ctx.stroke();
  ctx.restore();
}

function _drawCorner(ctx, x, y, dx, dy) {
  ctx.strokeStyle = "#eab308";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + dy * 34); ctx.lineTo(x, y); ctx.lineTo(x + dx * 34, y);
  ctx.stroke();
  ctx.fillStyle = "#a78bfa";
  ctx.beginPath();
  ctx.moveTo(x + dx * 10, y + dy * 10);
  ctx.lineTo(x + dx * 20, y + dy * 10);
  ctx.lineTo(x + dx * 10, y + dy * 20);
  ctx.closePath(); ctx.fill();
}

// Dessine le certificat dans un canvas (retourne le canvas)
function buildCertificateCanvas(scale) {
  scale = scale || 2;
  const W = 1200, H = 850;
  const canvas = document.createElement("canvas");
  canvas.width = W * scale; canvas.height = H * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  // Fond
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0b0b16"); bg.addColorStop(0.5, "#140a24"); bg.addColorStop(1, "#0d0d1a");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // Lueur centrale
  const glow = ctx.createRadialGradient(W / 2, 300, 60, W / 2, 300, 620);
  glow.addColorStop(0, "rgba(124,58,237,0.20)");
  glow.addColorStop(1, "rgba(124,58,237,0)");
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

  // Bordures
  ctx.strokeStyle = "#eab308"; ctx.lineWidth = 5;
  _roundRect(ctx, 28, 28, W - 56, H - 56, 18); ctx.stroke();
  ctx.strokeStyle = "rgba(167,139,250,0.7)"; ctx.lineWidth = 2;
  _roundRect(ctx, 42, 42, W - 84, H - 84, 12); ctx.stroke();
  _drawCorner(ctx, 60, 60, 1, 1);
  _drawCorner(ctx, W - 60, 60, -1, 1);
  _drawCorner(ctx, 60, H - 60, 1, -1);
  _drawCorner(ctx, W - 60, H - 60, -1, -1);

  ctx.textAlign = "center";

  // En-tête
  ctx.fillStyle = "#a78bfa";
  ctx.font = "700 22px 'JetBrains Mono', monospace";
  ctx.fillText("$_  L I N U X D O J O", W / 2, 96);

  // Sceau
  _drawSeal(ctx, W / 2, 210, 74);

  // Titre
  const tg = ctx.createLinearGradient(W / 2 - 300, 0, W / 2 + 300, 0);
  tg.addColorStop(0, "#f9a8d4"); tg.addColorStop(0.5, "#c4b5fd"); tg.addColorStop(1, "#67e8f9");
  ctx.fillStyle = tg;
  ctx.font = "800 52px 'Inter', system-ui, sans-serif";
  ctx.fillText(t("cert.title"), W / 2, 372);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "400 18px 'Inter', sans-serif";
  ctx.fillText(t("cert.line1"), W / 2, 410);

  // Nom
  ctx.fillStyle = "#fde68a";
  ctx.font = "700 46px 'Inter', sans-serif";
  ctx.fillText(ninjaName(), W / 2, 470);
  // trait sous le nom
  const nameW = Math.min(560, Math.max(240, ctx.measureText(ninjaName()).width + 80));
  ctx.strokeStyle = "rgba(234,179,8,0.6)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(W / 2 - nameW / 2, 486); ctx.lineTo(W / 2 + nameW / 2, 486); ctx.stroke();

  ctx.fillStyle = "#cbd5e1";
  ctx.font = "400 18px 'Inter', sans-serif";
  ctx.fillText(t("cert.line2"), W / 2, 524);
  ctx.fillText(t("cert.line3"), W / 2, 550);

  // Stats
  const rank = (typeof getRank === "function") ? getRank((typeof GAME !== "undefined" ? GAME.xp : 0)) : { name: "Root", icon: "" };
  const xp   = (typeof GAME !== "undefined") ? GAME.xp : 0;
  const boss = (typeof bossKills === "function") ? bossKills() : 6;
  const miss = (typeof GAME !== "undefined" && GAME.completed) ? GAME.completed.size : 0;
  const missTotal = (typeof ALL_MISSIONS !== "undefined") ? ALL_MISSIONS.length : 36;
  const stats = [
    [t("cert.statRank"), rankName(rank)],
    [t("cert.statXp"), String(xp)],
    [t("cert.statBoss"), boss + " / 6"],
    [t("cert.statMissions"), miss + " / " + missTotal],
  ];
  const colW = 250, startX = W / 2 - (colW * stats.length) / 2 + colW / 2;
  stats.forEach((s, i) => {
    const x = startX + i * colW;
    ctx.fillStyle = "#64748b";
    ctx.font = "600 13px 'JetBrains Mono', monospace";
    ctx.fillText(s[0], x, 618);
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "700 24px 'Inter', sans-serif";
    ctx.fillText(s[1], x, 648);
  });

  // Séparateur
  ctx.strokeStyle = "rgba(255,255,255,0.10)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(160, 694); ctx.lineTo(W - 160, 694); ctx.stroke();

  // Date + signature
  const date = new Date().toLocaleDateString(dateLocale(), { day: "numeric", month: "long", year: "numeric" });
  ctx.textAlign = "left";
  ctx.fillStyle = "#94a3b8"; ctx.font = "400 15px 'Inter', sans-serif";
  ctx.fillText(t("cert.issuedOn"), 180, 736);
  ctx.fillStyle = "#e2e8f0"; ctx.font = "600 17px 'Inter', sans-serif";
  ctx.fillText(date, 180, 760);

  ctx.textAlign = "right";
  ctx.fillStyle = "#c4b5fd"; ctx.font = "italic 700 26px 'Inter', sans-serif";
  ctx.fillText(t("cert.sensei"), W - 180, 748);
  ctx.strokeStyle = "rgba(196,181,253,0.5)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(W - 320, 762); ctx.lineTo(W - 180, 762); ctx.stroke();
  ctx.fillStyle = "#64748b"; ctx.font = "400 12px 'JetBrains Mono', monospace";
  ctx.fillText(t("cert.dojoMaster"), W - 180, 780);

  // Footer
  ctx.textAlign = "center";
  ctx.fillStyle = "#475569"; ctx.font = "400 13px 'JetBrains Mono', monospace";
  ctx.fillText(t("cert.footer"), W / 2, H - 46);

  return canvas;
}

// Dessine une ceinture intermédiaire dans un canvas (aperçu réutilisant le
// même style que le certificat de Ceinture Noire, en plus compact).
function buildBeltCanvas(belt, scale) {
  scale = scale || 2;
  const W = 900, H = 640;
  const canvas = document.createElement("canvas");
  canvas.width = W * scale; canvas.height = H * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0b0b16"); bg.addColorStop(0.5, "#140a24"); bg.addColorStop(1, "#0d0d1a");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W / 2, 220, 40, W / 2, 220, 460);
  glow.addColorStop(0, `${belt.color}33`); glow.addColorStop(1, `${belt.color}00`);
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = belt.color; ctx.lineWidth = 5;
  _roundRect(ctx, 24, 24, W - 48, H - 48, 16); ctx.stroke();
  ctx.strokeStyle = "rgba(167,139,250,0.7)"; ctx.lineWidth = 2;
  _roundRect(ctx, 36, 36, W - 72, H - 72, 10); ctx.stroke();
  _drawCorner(ctx, 52, 52, 1, 1);
  _drawCorner(ctx, W - 52, 52, -1, 1);
  _drawCorner(ctx, 52, H - 52, 1, -1);
  _drawCorner(ctx, W - 52, H - 52, -1, -1);

  ctx.textAlign = "center";
  ctx.fillStyle = "#a78bfa";
  ctx.font = "700 18px 'JetBrains Mono', monospace";
  ctx.fillText("$_  L I N U X D O J O", W / 2, 78);

  _drawSeal(ctx, W / 2, 172, 58, belt.color);

  ctx.fillStyle = belt.color;
  ctx.font = "800 40px 'Inter', system-ui, sans-serif";
  ctx.fillText(pick(belt.name), W / 2, 290);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "400 16px 'Inter', sans-serif";
  ctx.fillText(t("cert.line1"), W / 2, 322);

  ctx.fillStyle = "#fde68a";
  ctx.font = "700 36px 'Inter', sans-serif";
  ctx.fillText(ninjaName(), W / 2, 376);
  const nameW = Math.min(440, Math.max(180, ctx.measureText(ninjaName()).width + 60));
  ctx.strokeStyle = "rgba(234,179,8,0.6)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(W / 2 - nameW / 2, 390); ctx.lineTo(W / 2 + nameW / 2, 390); ctx.stroke();

  const rank = (typeof getRank === "function") ? getRank(currentXP()) : { name: "", icon: "" };
  const date = new Date().toLocaleDateString(dateLocale(), { day: "numeric", month: "long", year: "numeric" });
  const stats = [
    [t("cert.statRank"), rankName(rank)],
    [t("cert.statXp"), String(currentXP())],
    [t("belt.statDate"), date],
  ];
  const colW = 220, startX = W / 2 - (colW * stats.length) / 2 + colW / 2;
  stats.forEach((s, i) => {
    const x = startX + i * colW;
    ctx.fillStyle = "#64748b";
    ctx.font = "600 12px 'JetBrains Mono', monospace";
    ctx.fillText(s[0], x, 466);
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "700 20px 'Inter', sans-serif";
    ctx.fillText(s[1], x, 494);
  });

  ctx.strokeStyle = "rgba(255,255,255,0.10)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(120, 528); ctx.lineTo(W - 120, 528); ctx.stroke();

  ctx.fillStyle = "#475569"; ctx.font = "400 12px 'JetBrains Mono', monospace";
  ctx.fillText(t("cert.footer"), W / 2, H - 34);

  return canvas;
}

function _beltFilename(belt) {
  return "linuxdojo-" + belt.id + "-" + ninjaName().replace(/[^a-z0-9]+/gi, "-").toLowerCase() + ".png";
}

function downloadBelt(id) {
  const belt = BELTS.find(b => b.id === id);
  if (!belt || !beltUnlocked(belt)) return;
  if (!hasNinjaName()) { setNinjaName(); if (!hasNinjaName()) return; }
  const canvas = buildBeltCanvas(belt, 2);
  const link = document.createElement("a");
  link.download = _beltFilename(belt);
  link.href = canvas.toDataURL("image/png");
  link.click();
  if (typeof trackEvent === "function") trackEvent("belt-telecharge-" + belt.id);
  if (typeof SFX !== "undefined") SFX.levelup();
}

async function shareBelt(id) {
  const belt = BELTS.find(b => b.id === id);
  if (!belt || !beltUnlocked(belt)) return;
  if (!hasNinjaName()) { setNinjaName(); if (!hasNinjaName()) return; }
  const text = t("belt.shareText", { name: ninjaName(), belt: pick(belt.name) });

  const fallback = () => {
    const done = () => { if (typeof showToast === "function") showToast(t("cert.msgCopied")); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => prompt(t("cert.copyMsg"), text));
    } else {
      prompt(t("cert.copyMsg"), text);
    }
  };
  if (navigator.share) {
    try {
      if (navigator.canShare && typeof File !== "undefined") {
        const canvas = buildBeltCanvas(belt, 2);
        const blob = await new Promise(res => canvas.toBlob(res, "image/png"));
        if (blob) {
          const file = new File([blob], _beltFilename(belt), { type: "image/png" });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], text, title: "LinuxDojo — " + pick(belt.name) });
            return;
          }
        }
      }
      await navigator.share({ text, title: "LinuxDojo — " + pick(belt.name) });
      return;
    } catch (e) {
      if (e && e.name === "AbortError") return;
      fallback();
      return;
    }
  }
  fallback();
}

// ── Rendu de la grille des ceintures (page Profil) ──────────────────
function renderBelts() {
  const host = document.getElementById("pf-belts");
  if (!host) return;
  host.innerHTML = "";
  BELTS.forEach(belt => {
    const unlocked = beltUnlocked(belt);
    const card = document.createElement("div");
    card.className = "belt-card" + (unlocked ? " unlocked" : " locked");
    card.style.setProperty("--belt-color", belt.color);

    const preview = buildBeltCanvas(belt, 0.6);
    preview.className = "belt-preview";
    card.appendChild(preview);

    const overlay = document.createElement("div");
    overlay.className = "belt-overlay";
    if (unlocked) {
      overlay.innerHTML =
        '<button class="btn-ghost belt-dl">' + t("cert.download") + '</button>' +
        '<button class="btn-ghost belt-sh">' + t("cert.share") + '</button>';
    } else {
      overlay.innerHTML =
        '<div class="belt-lock">🔒</div>' +
        '<div class="belt-lock-sub">' + t("belt.lockedAt", { xp: belt.min }) + '</div>';
    }
    card.appendChild(overlay);
    host.appendChild(card);

    const dl = card.querySelector(".belt-dl");
    if (dl) dl.addEventListener("click", () => downloadBelt(belt.id));
    const sh = card.querySelector(".belt-sh");
    if (sh) sh.addEventListener("click", () => shareBelt(belt.id));
  });
}

function downloadCertificate() {
  if (!senseiDefeated()) {
    if (typeof showToast === "function") showToast(t("cert.lockedToast"));
    return;
  }
  if (!hasNinjaName()) { setNinjaName(); if (!hasNinjaName()) return; }
  const canvas = buildCertificateCanvas(2);
  const link = document.createElement("a");
  link.download = "linuxdojo-ceinture-noire-" + ninjaName().replace(/[^a-z0-9]+/gi, "-").toLowerCase() + ".png";
  link.href = canvas.toDataURL("image/png");
  link.click();
  if (typeof trackEvent === "function") trackEvent("certificat-telecharge");
  if (typeof SFX !== "undefined") SFX.levelup();
  if (typeof burstParticles === "function") burstParticles(window.innerWidth / 2, window.innerHeight / 2);
}

function _certificateShareText() {
  const rank = (typeof getRank === "function") ? getRank(GAME.xp) : { name: "Root", icon: "" };
  return t("cert.shareText", { name: ninjaName(), rank: rankName(rank), icon: rank.icon, xp: GAME.xp });
}

async function shareCertificate() {
  if (!senseiDefeated()) return;
  if (!hasNinjaName()) { setNinjaName(); if (!hasNinjaName()) return; }
  const text = _certificateShareText();

  const fallback = () => {
    const done = () => { if (typeof showToast === "function") showToast(t("cert.msgCopied")); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => prompt(t("cert.copyMsg"), text));
    } else {
      prompt(t("cert.copyMsg"), text);
    }
  };

  if (navigator.share) {
    try {
      // On tente d'abord le partage avec l'image du certificat en pièce jointe
      // (rendu bien plus engageant sur Twitter/LinkedIn qu'un simple lien texte).
      if (navigator.canShare && typeof File !== "undefined") {
        const canvas = buildCertificateCanvas(2);
        const blob = await new Promise(res => canvas.toBlob(res, "image/png"));
        if (blob) {
          const file = new File([blob], "linuxdojo-ceinture-noire.png", { type: "image/png" });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], text, title: "LinuxDojo — Ceinture Noire" });
            return;
          }
        }
      }
      await navigator.share({ text, title: "LinuxDojo — Ceinture Noire" });
      return;
    } catch (e) {
      if (e && e.name === "AbortError") return; // fenêtre de partage fermée par l'utilisateur, rien à faire
      fallback();
      return;
    }
  }
  fallback();
}

// ── Rendu de la section profil ────────────────────────────────────
function renderCertificate() {
  const host = document.getElementById("pf-cert");
  if (!host) return;
  const unlocked = senseiDefeated();

  host.innerHTML = "";
  const card = document.createElement("div");
  card.className = "cert-card" + (unlocked ? " unlocked" : " locked");

  // Aperçu visuel (canvas réduit)
  const preview = buildCertificateCanvas(1);
  preview.className = "cert-preview";
  card.appendChild(preview);

  const overlay = document.createElement("div");
  overlay.className = "cert-overlay";
  if (unlocked) {
    overlay.innerHTML =
      '<div class="cert-actions">' +
        '<button class="btn-primary" id="cert-download">' + t("cert.download") + '</button>' +
        '<button class="btn-ghost" id="cert-share">' + t("cert.share") + '</button>' +
        '<button class="btn-ghost" id="cert-name">' + (hasNinjaName() ? t("cert.changeName") : t("cert.setName")) + '</button>' +
      '</div>';
  } else {
    overlay.innerHTML =
      '<div class="cert-lock">🔒</div>' +
      '<div class="cert-lock-title">' + t("cert.lockTitle") + '</div>' +
      '<div class="cert-lock-sub">' + t("cert.lockSub") + '</div>' +
      '<button class="btn-ghost" id="cert-goboss">' + t("cert.goBoss") + '</button>';
  }
  card.appendChild(overlay);
  host.appendChild(card);

  const dl = document.getElementById("cert-download");
  if (dl) dl.addEventListener("click", downloadCertificate);
  const sh = document.getElementById("cert-share");
  if (sh) sh.addEventListener("click", shareCertificate);
  const nm = document.getElementById("cert-name");
  if (nm) nm.addEventListener("click", setNinjaName);
  const gb = document.getElementById("cert-goboss");
  if (gb) gb.addEventListener("click", () => { if (typeof showPage === "function") showPage("boss"); });
}

if (typeof module !== "undefined") module.exports = { ninjaName, senseiDefeated };
