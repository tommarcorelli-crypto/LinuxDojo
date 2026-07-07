// certificate.js — Certificat de Ceinture Noire : rendu canvas → PNG partageable.
// Débloqué en battant le Sensei (boss final). Dessin 100% vectoriel (aucune
// dépendance à une police emoji) pour un rendu identique partout.

const NAME_KEY = "linuxdojo_name";

function ninjaName() {
  try { return (localStorage.getItem(NAME_KEY) || "").trim() || "Ninja Anonyme"; }
  catch { return "Ninja Anonyme"; }
}
function hasNinjaName() {
  try { return !!(localStorage.getItem(NAME_KEY) || "").trim(); } catch { return false; }
}
function setNinjaName() {
  const cur = hasNinjaName() ? ninjaName() : "";
  const v = prompt("Ton nom de ninja (il figurera sur le certificat) :", cur);
  if (v === null) return;
  try { localStorage.setItem(NAME_KEY, v.trim().slice(0, 32)); } catch {}
  if (typeof renderCertificate === "function") renderCertificate();
  if (typeof SFX !== "undefined") SFX.enter();
}

function senseiDefeated() {
  try { return (((JSON.parse(localStorage.getItem("linuxdojo_boss")) || {}).defeated) || []).includes("sensei"); }
  catch { return false; }
}

// ── Dessin ────────────────────────────────────────────────────────
function _roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Sceau : ceinture noire nouée dans un double anneau doré
function _drawSeal(ctx, cx, cy, r) {
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
  // ceinture noire (bande + nœud + pans)
  ctx.fillStyle = "#111827";
  ctx.strokeStyle = "#374151";
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
  ctx.fillText("CERTIFICAT DE CEINTURE NOIRE", W / 2, 372);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "400 18px 'Inter', sans-serif";
  ctx.fillText("La voie du shell reconnaît solennellement", W / 2, 410);

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
  ctx.fillText("pour avoir vaincu le SENSEI et prouvé sa maîtrise", W / 2, 524);
  ctx.fillText("des commandes, des pipes et des permissions Linux.", W / 2, 550);

  // Stats
  const rank = (typeof getRank === "function") ? getRank((typeof GAME !== "undefined" ? GAME.xp : 0)) : { name: "Root", icon: "" };
  const xp   = (typeof GAME !== "undefined") ? GAME.xp : 0;
  const boss = (typeof bossKills === "function") ? bossKills() : 5;
  const miss = (typeof GAME !== "undefined" && GAME.completed) ? GAME.completed.size : 0;
  const stats = [
    ["RANG", rank.name],
    ["XP TOTAL", String(xp)],
    ["BOSS VAINCUS", boss + " / 5"],
    ["MISSIONS", miss + " / 36"],
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
  const date = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  ctx.textAlign = "left";
  ctx.fillStyle = "#94a3b8"; ctx.font = "400 15px 'Inter', sans-serif";
  ctx.fillText("Délivré le", 180, 736);
  ctx.fillStyle = "#e2e8f0"; ctx.font = "600 17px 'Inter', sans-serif";
  ctx.fillText(date, 180, 760);

  ctx.textAlign = "right";
  ctx.fillStyle = "#c4b5fd"; ctx.font = "italic 700 26px 'Inter', sans-serif";
  ctx.fillText("Le Sensei", W - 180, 748);
  ctx.strokeStyle = "rgba(196,181,253,0.5)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(W - 320, 762); ctx.lineTo(W - 180, 762); ctx.stroke();
  ctx.fillStyle = "#64748b"; ctx.font = "400 12px 'JetBrains Mono', monospace";
  ctx.fillText("Maître du Dojo", W - 180, 780);

  // Footer
  ctx.textAlign = "center";
  ctx.fillStyle = "#475569"; ctx.font = "400 13px 'JetBrains Mono', monospace";
  ctx.fillText("tommarcorelli.github.io/LinuxDojo  ·  « Tout est fichier. »", W / 2, H - 46);

  return canvas;
}

function downloadCertificate() {
  if (!senseiDefeated()) {
    if (typeof showToast === "function") showToast("🔒 Bats le Sensei (Salle des Boss) pour débloquer ton certificat.");
    return;
  }
  if (!hasNinjaName()) { setNinjaName(); if (!hasNinjaName()) return; }
  const canvas = buildCertificateCanvas(2);
  const link = document.createElement("a");
  link.download = "linuxdojo-ceinture-noire-" + ninjaName().replace(/[^a-z0-9]+/gi, "-").toLowerCase() + ".png";
  link.href = canvas.toDataURL("image/png");
  link.click();
  if (typeof SFX !== "undefined") SFX.levelup();
  if (typeof burstParticles === "function") burstParticles(window.innerWidth / 2, window.innerHeight / 2);
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
        '<button class="btn-primary" id="cert-download">⬇️ Télécharger le certificat (PNG)</button>' +
        '<button class="btn-ghost" id="cert-name">✏️ ' + (hasNinjaName() ? "Changer mon nom" : "Définir mon nom") + '</button>' +
      '</div>';
  } else {
    overlay.innerHTML =
      '<div class="cert-lock">🔒</div>' +
      '<div class="cert-lock-title">Certificat de Ceinture Noire</div>' +
      '<div class="cert-lock-sub">Termine l\'examen du Sensei dans la <strong>Salle des Boss</strong> pour le débloquer et le partager.</div>' +
      '<button class="btn-ghost" id="cert-goboss">⚔️ Aller défier le Sensei</button>';
  }
  card.appendChild(overlay);
  host.appendChild(card);

  const dl = document.getElementById("cert-download");
  if (dl) dl.addEventListener("click", downloadCertificate);
  const nm = document.getElementById("cert-name");
  if (nm) nm.addEventListener("click", setNinjaName);
  const gb = document.getElementById("cert-goboss");
  if (gb) gb.addEventListener("click", () => { if (typeof showPage === "function") showPage("boss"); });
}

if (typeof module !== "undefined") module.exports = { ninjaName, senseiDefeated };
