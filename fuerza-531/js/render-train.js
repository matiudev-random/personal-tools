/* ─────────────────────────────────────────
   RENDER — ENTRENAR
───────────────────────────────────────── */
function renderDayTabs() {
  const sug = suggestedDay();
  $("day-tabs").innerHTML = [1, 2, 3, 4].map(d => `
    <button class="day-tab${d === ui.day ? " active" : ""}" data-day="${d}" style="--day:${DAYS[d].color}">
      <span class="tnum">D${d}</span>
      <span class="tlabel">${esc(DAYS[d].name)}</span>
      ${d === sug ? '<span class="today-dot" title="Te toca hoy"></span>' : ""}
    </button>`).join("");
}

function renderMeta() {
  const d = draftFor(ui.day);
  const nxt = nextFor(ui.day);
  $("session-meta").innerHTML = `
    <div class="week-row">
      ${[1, 2, 3, 4].map(w => `<button class="week-chip${w === d.semana ? " active" : ""}" data-week="${w}">
        S${w}<small>${WEEKS[w].deload ? "deload" : WEEKS[w].label}</small></button>`).join("")}
    </div>
    <div class="meta-row">
      <span class="cycle">Ciclo ${d.ciclo}${d.semana === nxt.semana && d.ciclo === nxt.ciclo ? " · te toca esta" : ""}</span>
      <label class="date-field">Fecha <input type="date" id="fecha" value="${esc(d.fecha)}" max="${today()}"></label>
    </div>`;
  $("notas").value = d.notas || "";
}

function stepper(path, value, min = 0, medida = "reps") {
  return `<div class="stepper" data-path="${path}">
    <button type="button" class="step" data-delta="-1" aria-label="Menos">−</button>
    <input type="number" inputmode="numeric" min="${min}" class="step-val" data-path="${path}" value="${value ?? ""}" aria-label="${medida}">
    <button type="button" class="step" data-delta="1" aria-label="Más">+</button>
  </div>`;
}

function platesHTML(total) {
  if (!total || total < GYM.bar) return "";
  const plates = plateBreakdown(total);
  if (!plates.length) return `<div class="plates"><span class="plates-cap">Barra sola</span></div>`;
  return `<div class="plates" aria-label="Discos por lado: ${plates.join(", ")}">
    <span class="barend"></span>${plates.map(p => `<span class="plate p${String(p).replace(".", "_")}"></span>`).join("")}
    <span class="plates-cap">${plates.map(fmt).join(" + ")} por lado</span></div>`;
}

function renderMain(d) {
  const plan = DAYS[ui.day];
  if (!plan.lift) return "";
  const lift = plan.lift;
  const L = LIFTS[lift];
  const tgt = targets(lift, d.tm, d.semana);
  const warm = WARMUP.map(w => {
    if (!w.pct) return [L.type === "barbell" ? `Barra sola (${GYM.bar} kg)` : "Mancuernas livianas", w.reps];
    const kg = roundLoad(d.tm * w.pct, lift);
    return [L.type === "barbell" ? `${fmt(kg)} kg` : `${fmt(kg / 2)} kg/mano`, w.reps];
  });

  const rows = tgt.map((t, i) => {
    const m = d.main[i] || {};
    const est = t.amrap ? e1rm(m.peso, m.reps) : null;
    const perHand = L.type === "dumbbell" ? `<span class="per-hand">${fmt((m.peso || 0) / 2)} kg/mano</span>` : "";
    return `<div class="set-row${t.amrap ? " amrap" : ""}">
      <div class="set-head">
        <span class="set-lbl">Serie ${i + 1}${t.amrap ? ' <b class="amrap-tag">AMRAP</b>' : ""}</span>
        <span class="set-target">${fmt(t.peso)} kg × ${t.obj}</span>
      </div>
      <div class="set-inputs">
        <label class="kg-field"><input type="number" inputmode="decimal" step="${L.type === "dumbbell" ? 5 : 2.5}" data-path="main.${i}.peso" value="${m.peso ?? ""}"><span>kg${L.type === "dumbbell" ? " total" : ""}</span></label>
        ${stepper(`main.${i}.reps`, m.reps)}
      </div>
      ${perHand}
      ${L.type === "barbell" ? `<div class="plates-slot">${platesHTML(m.peso)}</div>` : ""}
      ${t.amrap ? `<div class="amrap-extra">
        <label class="rpe-field">RPE
          <select data-path="main.${i}.rpe">
            ${[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map(v => `<option value="${v}"${Number(m.rpe) === v ? " selected" : ""}>${fmt(v)}</option>`).join("")}
          </select>
        </label>
        <span class="e1rm" data-e1rm>${est ? `1RM est. <b>${fmt(Math.round(est * 2) / 2)} kg</b>` : ""}</span>
        <span class="pr-flag" data-pr>${prBadge(lift, m.peso, m.reps)}</span>
      </div>` : ""}
    </div>`;
  }).join("");

  return `<div class="card lift-card" style="--accent:${plan.color}">
    <div class="lift-top">
      <div>
        <p class="lift-name">${esc(L.name)}</p>
        <p class="lift-tm">TM <b>${fmt(d.tm)} kg</b>${L.type === "dumbbell" ? " total" : ""} · ${WEEKS[d.semana].deload ? "semana de descarga" : `semana ${d.semana} (${WEEKS[d.semana].label})`}</p>
      </div>
    </div>
    <details class="warmup">
      <summary>Calentamiento</summary>
      <table>${warm.map((w, i) => `<tr><td class="mono">${i + 1}</td><td>${esc(w[0])}</td><td class="mono">× ${esc(w[1])}</td></tr>`).join("")}</table>
    </details>
    ${rows}
    ${WEEKS[d.semana].deload ? '<p class="note">Descarga: técnica impecable, sin buscar RPE alto.</p>' : ""}
  </div>`;
}

function renderAccessories(d) {
  const plan = DAYS[ui.day];
  return `<div class="card">
    <h3>Accesorios</h3>
    ${plan.accessories.map(a => {
      const sets = d.acc[a.id] || [];
      const medida = a.medida || "reps";
      return `<div class="acc">
        <div class="acc-head">
          <p class="acc-name">${esc(a.name)}</p>
          <p class="acc-meta">${a.sets} × ${esc(a.target)}</p>
        </div>
        <p class="acc-note">${esc(a.note)}</p>
        <div class="acc-sets">
          ${sets.map((s, i) => `<div class="acc-set">
            <span class="set-num">S${i + 1}</span>
            <label class="kg-field small"><input type="number" inputmode="decimal" step="0.5" data-path="acc.${a.id}.${i}.peso" value="${s.peso ?? ""}" placeholder="—"><span>${UNIT_LABEL[a.unit]}</span></label>
            ${stepper(`acc.${a.id}.${i}.reps`, s.reps, 0, medida)}
            <span class="medida">${medida}</span>
          </div>`).join("")}
        </div>
        <div class="acc-actions">
          <button type="button" class="mini-btn" data-addset="${a.id}">+ serie</button>
          ${sets.length ? `<button type="button" class="mini-btn" data-delset="${a.id}">− serie</button>` : ""}
        </div>
      </div>`;
    }).join("")}
  </div>`;
}

function renderTrain() {
  renderDayTabs();
  renderMeta();
  const d = draftFor(ui.day);
  $("train-content").innerHTML = renderMain(d) + renderAccessories(d);
  document.documentElement.style.setProperty("--accent", DAYS[ui.day].color);
  $("save-hint").textContent = online ? "" : "Sin conexión: se guarda en el teléfono y se sube después.";
}

/* Récords de la serie AMRAP */
function prBadge(lift, peso, reps) {
  if (!peso || !reps) return "";
  const prev = sesiones.flatMap(s => (s.series || []).filter(x => x.ej === lift && x.reps));
  if (!prev.length) return "";
  const bestE = Math.max(...prev.map(x => e1rm(x.peso, x.reps)));
  const sameOrMore = prev.filter(x => x.peso >= peso);
  const bestReps = sameOrMore.length ? Math.max(...sameOrMore.map(x => x.reps)) : 0;
  if (e1rm(peso, reps) > bestE + 0.01) return "🏆 Nuevo 1RM estimado máximo";
  if (reps > bestReps) return `🏆 Récord de reps con ${fmt(peso)} kg`;
  return "";
}
