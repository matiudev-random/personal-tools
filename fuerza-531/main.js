/* ─────────────────────────────────────────
   ARRANQUE — primero la copia local, luego el servidor
───────────────────────────────────────── */
(function init() {
  const cache = readJSON(CACHE_KEY, null);
  if (cache) { tms = cache.tms || []; sesiones = (cache.sesiones || []).map(normSes); }
  pending = readJSON(PENDING_KEY, []);
  drafts = readJSON(DRAFT_KEY, {});
  ui = Object.assign(ui, readJSON(UI_KEY, {}));
  if (!ui.day) ui.day = suggestedDay();
  renderAll();
  if (typeof PocketBase === "undefined") { updateStatus("No cargó la librería de PocketBase"); return; }
  connect(PB_URL);
  online = navigator.onLine;
  updateStatus();
  sync();
})();
