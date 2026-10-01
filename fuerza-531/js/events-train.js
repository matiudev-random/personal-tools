/* ─────────────────────────────────────────
   EVENTOS — ENTRENAR
───────────────────────────────────────── */
function setPath(path, value) {
  const d = draftFor(ui.day);
  const parts = path.split(".");
  let obj = d;
  for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
  obj[parts[parts.length - 1]] = value;
  d.touched = true;
  saveDrafts();
}

function refreshAmrapInfo() {
  const plan = DAYS[ui.day];
  if (!plan.lift) return;
  const d = draftFor(ui.day);
  const tgt = targets(plan.lift, d.tm, d.semana);
  const i = tgt.findIndex(t => t.amrap);
  if (i < 0) return;
  const m = d.main[i];
  const est = e1rm(m.peso, m.reps);
  const row = $("train-content").querySelectorAll(".set-row")[i];
  row.querySelector("[data-e1rm]").innerHTML = est ? `1RM est. <b>${fmt(Math.round(est * 2) / 2)} kg</b>` : "";
  row.querySelector("[data-pr]").textContent = prBadge(plan.lift, m.peso, m.reps);
}

$("train-content").addEventListener("input", e => {
  const path = e.target.dataset.path;
  if (!path) return;
  const val = e.target.tagName === "SELECT" ? Number(e.target.value) : num(e.target.value);
  setPath(path, val);
  if (path.startsWith("main.")) {
    refreshAmrapInfo();
    if (path.endsWith(".peso")) {
      const row = e.target.closest(".set-row");
      const L = LIFTS[DAYS[ui.day].lift];
      if (L.type === "barbell") {
        row.querySelector(".plates-slot").innerHTML = platesHTML(val);
      } else {
        const ph = row.querySelector(".per-hand");
        if (ph) ph.textContent = `${fmt((val || 0) / 2)} kg/mano`;
      }
    }
  }
});

$("train-content").addEventListener("click", e => {
  const step = e.target.closest(".step");
  if (step) {
    const input = step.parentElement.querySelector(".step-val");
    const v = Math.max(0, (num(input.value) || 0) + Number(step.dataset.delta));
    input.value = v;
    setPath(input.dataset.path, v);
    if (input.dataset.path.startsWith("main.")) refreshAmrapInfo();
    return;
  }
  const add = e.target.closest("[data-addset]");
  if (add) {
    const d = draftFor(ui.day);
    const list = d.acc[add.dataset.addset];
    const lastSet = list[list.length - 1] || { peso: accPlan(add.dataset.addset).kg, reps: accPlan(add.dataset.addset).reps };
    list.push({ ...lastSet });
    draftFor(ui.day).touched = true;
    saveDrafts(); renderTrain();
    return;
  }
  const del = e.target.closest("[data-delset]");
  if (del) {
    draftFor(ui.day).acc[del.dataset.delset].pop();
    draftFor(ui.day).touched = true;
    saveDrafts(); renderTrain();
  }
});

$("day-tabs").addEventListener("click", e => {
  const tab = e.target.closest(".day-tab");
  if (!tab) return;
  ui.day = Number(tab.dataset.day);
  writeJSON(UI_KEY, ui);
  renderTrain();
});

$("session-meta").addEventListener("click", e => {
  const chip = e.target.closest(".week-chip");
  if (!chip) return;
  const d = draftFor(ui.day);
  const semana = Number(chip.dataset.week);
  if (semana === d.semana) return;
  // cambiar de semana recalcula los pesos de la principal; los accesorios se mantienen
  const acc = d.acc;
  drafts[ui.day] = freshDraft(ui.day, { ciclo: d.ciclo, semana, fecha: d.fecha, notas: d.notas });
  drafts[ui.day].acc = acc;
  drafts[ui.day].touched = true;
  saveDrafts(); renderTrain();
});

$("session-meta").addEventListener("change", e => {
  if (e.target.id === "fecha") { const d = draftFor(ui.day); d.fecha = e.target.value || today(); d.touched = true; saveDrafts(); }
});

$("notas").addEventListener("input", e => { const d = draftFor(ui.day); d.notas = e.target.value; d.touched = true; saveDrafts(); });
