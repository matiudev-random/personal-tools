/* ─────────────────────────────────────────
   VISTAS
───────────────────────────────────────── */
function renderAll() {
  document.querySelectorAll(".view-btn").forEach(b => b.setAttribute("aria-selected", String(b.dataset.view === ui.view)));
  document.querySelectorAll(".view").forEach(v => v.hidden = v.id !== `view-${ui.view}`);
  if (ui.view === "train") renderTrain();
  if (ui.view === "progress") renderProgress();
  if (ui.view === "tms") renderTMs();
  updateStatus();
}

document.querySelectorAll(".view-btn").forEach(b => b.addEventListener("click", () => {
  ui.view = b.dataset.view;
  writeJSON(UI_KEY, ui);
  renderAll();
  window.scrollTo(0, 0);
}));
