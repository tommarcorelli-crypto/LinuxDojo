// sw-register.js
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // La page était-elle déjà pilotée par un SW ? (sinon = toute première visite)
    const hadController = !!navigator.serviceWorker.controller;

    navigator.serviceWorker.register("sw.js")
      .then(reg => {
        // Force une vérif de mise à jour à chaque chargement
        reg.update();
        console.log("[LinuxDojo] Service Worker enregistré");
      })
      .catch(e => console.warn("[LinuxDojo] SW non enregistré :", e));

    // Quand un nouveau SW prend le contrôle → recharge une fois pour servir
    // les fichiers frais (nouveau logo, nouveau code). Pas au 1er passage.
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing || !hadController) return;
      refreshing = true;
      window.location.reload();
    });
  });
}
