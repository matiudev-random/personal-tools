/* ─────────────────────────────────────────
   ARRANQUE
───────────────────────────────────────── */
(function init() {
  $("server-url").textContent = PB_URL.replace(/^https?:\/\//, "");
  renderNotify();
  if (history.length) {
    current = { t: history[history.length - 1][0], ok: history[history.length - 1][1] !== null, ms: history[history.length - 1][1], reason: "Último dato guardado" };
    renderStatus();
  }
  checkHealth();
  setInterval(checkHealth, CHECK_EVERY);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) checkHealth(); });
  window.addEventListener("online", checkHealth);

  if (typeof PocketBase === "undefined") {
    $("login-card").innerHTML = `<p class="row-sub">No cargó la librería de PocketBase, así que el panel de administración no está disponible.</p>`;
    return;
  }
  pb = makeClient();
  showAdmin(pb.authStore.isValid);
})();
