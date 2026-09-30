/* ─────────────────────────────────────────
   FUERZA 5/3/1 — tracker
   Datos en PocketBase (colecciones "fuerza_tms" y "fuerza_sesiones").
   Primero muestra la copia local; los cambios sin conexión quedan en cola.
───────────────────────────────────────── */
const PB_URL = "https://remindful-tanned-concierge.ngrok-free.dev";
const COL_TMS = "fuerza_tms";
const COL_SES = "fuerza_sesiones";

const CACHE_KEY = "fuerza-cache";     // { tms, sesiones }
const PENDING_KEY = "fuerza-pending"; // cola de operaciones sin subir
const DRAFT_KEY = "fuerza-draft";     // lo que vas anotando en el gym, por día
const UI_KEY = "fuerza-ui";

let tms = [];
let sesiones = [];
let pending = [];
let drafts = {};
let ui = { view: "train", day: null };
let pb = null;
let online = false;
let flushing = false;

/* ─────────────────────────────────────────
   UTILIDADES
───────────────────────────────────────── */
function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) { return fallback; }
}
function writeJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
}

const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const fmt = n => (n == null || isNaN(n)) ? "—" : String(Math.round(n * 100) / 100).replace(".", ",");
const num = v => { if (v === "" || v == null) return null; const n = Number(String(v).replace(",", ".")); return isNaN(n) ? null : n; };

// ids propios de 15 caracteres: si una subida se repite, PocketBase la rechaza en vez de duplicarla
function newId() {
  const a = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  const r = crypto.getRandomValues(new Uint8Array(15));
  for (const b of r) s += a[b % a.length];
  return s;
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const toPbDate = ymd => `${ymd} 12:00:00.000Z`;          // mediodía UTC: no se corre de día en Chile
const ymdOf = pbDate => String(pbDate || "").slice(0, 10);
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
function prettyDate(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  return `${d} ${MESES[m - 1]}${y !== new Date().getFullYear() ? " " + y : ""}`;
}

function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 2600);
}

/* ─────────────────────────────────────────
   CÁLCULOS 5/3/1
───────────────────────────────────────── */
const e1rm = (peso, reps) => (peso && reps) ? peso * (1 + reps / 30) : null;

function roundLoad(total, lift) {
  if (LIFTS[lift].type === "dumbbell") {
    const perHand = Math.max(GYM.dbStep, Math.round(total / 2 / GYM.dbStep) * GYM.dbStep);
    return perHand * 2;
  }
  return Math.max(GYM.bar, Math.round(total / 2.5) * 2.5);
}

function currentTM(lift) {
  const list = tms.filter(t => t.ejercicio === lift).sort(byDesdeDesc);
  return list.length ? list[0].tm : DEFAULT_TMS[lift];
}
function byDesdeDesc(a, b) {
  return ymdOf(b.desde).localeCompare(ymdOf(a.desde)) || String(b.created || "").localeCompare(String(a.created || ""));
}
function bySesionDesc(a, b) {
  return ymdOf(b.fecha).localeCompare(ymdOf(a.fecha)) || String(b.created || "").localeCompare(String(a.created || ""));
}

function targets(lift, tm, week) {
  const w = WEEKS[week];
  return w.pct.map((p, i) => ({
    peso: roundLoad(tm * p, lift),
    reps: w.reps[i],
    amrap: w.plus && i === 2,
    obj: `${w.reps[i]}${w.plus && i === 2 ? "+" : ""}`,
  }));
}

function plateBreakdown(total) {
  let rest = Math.round(((total - GYM.bar) / 2) * 100) / 100;
  const out = [];
  for (const d of GYM.plates) while (rest >= d - 0.001) { out.push(d); rest = Math.round((rest - d) * 100) / 100; }
  return out;
}

// Qué semana y ciclo toca para un día, según lo último que registraste
function nextFor(day) {
  const last = sesiones.filter(s => s.dia === day).sort(bySesionDesc)[0];
  if (!last) {
    const maxCiclo = sesiones.reduce((m, s) => Math.max(m, s.ciclo || 1), 1);
    return { ciclo: maxCiclo, semana: 1 };
  }
  return last.semana >= 4 ? { ciclo: (last.ciclo || 1) + 1, semana: 1 } : { ciclo: last.ciclo || 1, semana: last.semana + 1 };
}

// El día que sigue al último entrenado
function suggestedDay() {
  const last = [...sesiones].sort(bySesionDesc)[0];
  return last ? (last.dia % 4) + 1 : 1;
}

function accPlan(id) {
  for (const d of Object.values(DAYS)) {
    const a = d.accessories.find(x => x.id === id);
    if (a) return a;
  }
  return null;
}
function exName(id) { return LIFTS[id]?.name || accPlan(id)?.name || id; }

// Lo último que hiciste en un accesorio, para precargarlo
function lastAccessory(id) {
  for (const s of [...sesiones].sort(bySesionDesc)) {
    const sets = (s.series || []).filter(x => x.ej === id);
    if (sets.length) return sets;
  }
  return null;
}

/* ─────────────────────────────────────────
   BORRADOR (lo que anotas antes de guardar)
───────────────────────────────────────── */
function freshDraft(day, keepMeta) {
  const plan = DAYS[day];
  const nxt = nextFor(day);
  const d = {
    ciclo: keepMeta?.ciclo ?? nxt.ciclo,
    semana: keepMeta?.semana ?? nxt.semana,
    fecha: keepMeta?.fecha ?? today(),
    notas: keepMeta?.notas ?? "",
    main: [],
    acc: {},
  };
  if (plan.lift) {
    d.tm = currentTM(plan.lift);
    d.main = targets(plan.lift, d.tm, d.semana).map(t => ({ peso: t.peso, reps: t.reps, rpe: t.amrap ? 8 : null }));
  }
  for (const a of plan.accessories) {
    const prev = lastAccessory(a.id);
    d.acc[a.id] = prev
      ? prev.map(p => ({ peso: p.peso, reps: p.reps ?? a.reps }))
      : Array.from({ length: a.sets }, () => ({ peso: a.kg, reps: a.reps }));
  }
  return d;
}

function draftFor(day) {
  if (!drafts[day]) drafts[day] = freshDraft(day);
  return drafts[day];
}
function saveDrafts() { writeJSON(DRAFT_KEY, drafts); }

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

/* ─────────────────────────────────────────
   GUARDAR SESIÓN
───────────────────────────────────────── */
function buildSession(day, d) {
  const plan = DAYS[day];
  const series = [];
  if (plan.lift) {
    const tgt = targets(plan.lift, d.tm, d.semana);
    tgt.forEach((t, i) => {
      const m = d.main[i];
      if (!m || m.reps == null) return;
      const s = { ej: plan.lift, tipo: "principal", peso: m.peso, reps: m.reps, obj: t.obj };
      if (t.amrap) { s.amrap = true; s.rpe = m.rpe; }
      series.push(s);
    });
  }
  for (const a of plan.accessories) {
    for (const s of d.acc[a.id] || []) {
      if (s.reps == null || s.reps === 0) continue;
      const row = { ej: a.id, tipo: "accesorio", peso: s.peso, reps: s.reps };
      if (a.medida) row.medida = a.medida;
      series.push(row);
    }
  }
  return {
    id: newId(),
    fecha: toPbDate(d.fecha || today()),
    dia: day,
    ciclo: d.ciclo,
    semana: d.semana,
    tm: plan.lift ? d.tm : null,
    notas: (d.notas || "").trim(),
    series,
    created: new Date().toISOString(),
  };
}

$("save").addEventListener("click", () => {
  const d = draftFor(ui.day);
  const ses = buildSession(ui.day, d);
  if (!ses.series.length) { toast("Anota al menos una serie antes de guardar"); return; }

  const prs = sessionPRs(ses);
  sesiones.push(ses);
  queue({ op: "create", col: COL_SES, data: stripLocal(ses) });
  delete drafts[ui.day];
  saveDrafts();
  saveCache();

  ui.day = suggestedDay();
  writeJSON(UI_KEY, ui);
  renderAll();
  showSummary(ses, prs);
});

function stripLocal(rec) {
  const { created, updated, collectionId, collectionName, ...rest } = rec;
  return rest;
}

function sessionPRs(ses) {
  const out = [];
  const prev = sesiones;
  for (const s of ses.series.filter(x => x.tipo === "principal" && x.reps)) {
    const older = prev.flatMap(p => (p.series || []).filter(x => x.ej === s.ej && x.reps));
    if (!older.length) continue;
    const bestE = Math.max(...older.map(x => e1rm(x.peso, x.reps)));
    const heavier = older.filter(x => x.peso >= s.peso);
    const bestReps = heavier.length ? Math.max(...heavier.map(x => x.reps)) : 0;
    if (e1rm(s.peso, s.reps) > bestE + 0.01) out.push(`🏆 ${LIFTS[s.ej].short}: nuevo 1RM estimado máximo (${fmt(Math.round(e1rm(s.peso, s.reps) * 2) / 2)} kg)`);
    else if (s.reps > bestReps) out.push(`🏆 ${LIFTS[s.ej].short}: récord de reps con ${fmt(s.peso)} kg (${s.reps})`);
  }
  return [...new Set(out)];
}

/* Texto para pegarle a Claude */
function summaryText(ses) {
  const plan = DAYS[ses.dia];
  const lines = [`Sesión D${ses.dia} · ${plan.name} · Ciclo ${ses.ciclo} Semana ${ses.semana}${WEEKS[ses.semana]?.deload ? " (deload)" : ""} · ${ymdOf(ses.fecha)}`];
  const groups = {};
  for (const s of ses.series || []) (groups[s.ej] ||= []).push(s);
  for (const [ej, sets] of Object.entries(groups)) {
    if (LIFTS[ej]) {
      const L = LIFTS[ej];
      const parts = sets.map(s => {
        let t = `${fmt(s.peso)}×${s.reps ?? "?"}`;
        if (s.amrap) t += ` (AMRAP${s.obj ? " " + s.obj : ""}${s.rpe ? `, RPE ${fmt(s.rpe)}` : ""})`;
        return t;
      });
      const am = sets.find(s => s.amrap && s.reps);
      const est = am ? ` → 1RM est. ${fmt(Math.round(e1rm(am.peso, am.reps) * 2) / 2)} kg` : "";
      lines.push(`${L.name}${ses.tm ? ` (TM ${fmt(ses.tm)}${L.type === "dumbbell" ? " total" : ""})` : ""}: ${parts.join(", ")}${est}`);
    } else {
      const a = accPlan(ej);
      const unit = a?.unit || "total";
      const med = sets[0].medida === "seg" ? " seg" : "";
      const allSame = sets.every(s => s.peso === sets[0].peso);
      let body;
      if (allSame) {
        const w = sets[0].peso;
        const load = w == null ? "" : unit === "lastre" ? (w ? `+${fmt(w)} kg × ` : "sin lastre · ") : unit === "mano" ? `${fmt(w)} kg/mano × ` : `${fmt(w)} kg × `;
        body = `${load}${sets.map(s => s.reps ?? "?").join(", ")}${med}`;
      } else {
        body = sets.map(s => `${s.peso == null ? "" : fmt(s.peso) + (unit === "mano" ? "/mano" : "") + "×"}${s.reps ?? "?"}`).join(", ") + med;
      }
      lines.push(`${exName(ej)}: ${body}`);
    }
  }
  if (ses.notas) lines.push(`Notas: ${ses.notas}`);
  return lines.join("\n");
}

function showSummary(ses, prs) {
  $("summary-title").textContent = `Sesión D${ses.dia} guardada`;
  $("summary-prs").innerHTML = prs.map(p => `<p class="pr-line">${esc(p)}</p>`).join("");
  $("summary-text").textContent = summaryText(ses);
  $("summary-dialog").showModal();
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); }
  catch (e) {
    const ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (e2) {}
    ta.remove();
  }
  toast("Copiado. Pégalo en tu chat con Claude");
}

$("copy-summary").addEventListener("click", () => copyText($("summary-text").textContent));
$("close-summary").addEventListener("click", () => $("summary-dialog").close());

/* ─────────────────────────────────────────
   RENDER — PROGRESO
───────────────────────────────────────── */
function liftSeries(lift) {
  const pts = [];
  for (const s of sesiones) {
    const sets = (s.series || []).filter(x => x.ej === lift && x.reps && x.peso);
    if (!sets.length) continue;
    const pick = sets.find(x => x.amrap) || sets.reduce((a, b) => e1rm(b.peso, b.reps) > e1rm(a.peso, a.reps) ? b : a);
    pts.push({ date: ymdOf(s.fecha), v: Math.round(e1rm(pick.peso, pick.reps) * 2) / 2, label: `${fmt(pick.peso)} kg × ${pick.reps}`, created: s.created });
  }
  return pts.sort((a, b) => a.date.localeCompare(b.date) || String(a.created).localeCompare(String(b.created)));
}

function pullupSeries() {
  const pts = [];
  for (const s of sesiones) {
    const sets = (s.series || []).filter(x => x.ej === "dominadas" && x.reps);
    if (!sets.length) continue;
    pts.push({ date: ymdOf(s.fecha), v: sets.reduce((a, b) => a + b.reps, 0), label: sets.map(x => x.reps).join("/") + (sets[0].peso ? ` +${fmt(sets[0].peso)} kg` : ""), created: s.created });
  }
  return pts.sort((a, b) => a.date.localeCompare(b.date) || String(a.created).localeCompare(String(b.created)));
}

const dayNum = ymd => Date.UTC(...ymd.split("-").map((n, i) => i === 1 ? n - 1 : Number(n))) / 86400000;

function chartSVG(pts, color, unit, kind) {
  const W = 340, H = 150, P = { l: 34, r: 12, t: 12, b: 22 };
  const xs = pts.map(p => dayNum(p.date));
  let x0 = Math.min(...xs), x1 = Math.max(...xs);
  if (x1 - x0 < 7) { x0 -= 3; x1 += 3; }
  const vs = pts.map(p => p.v);
  let y0 = Math.min(...vs), y1 = Math.max(...vs);
  const pad = Math.max(2, (y1 - y0) * 0.15);
  y0 = kind === "bar" ? 0 : Math.floor((y0 - pad) / 5) * 5;
  y1 = Math.ceil((y1 + pad) / 5) * 5;
  const IN = 14; // aire entre el eje y la primera/última marca
  const X = x => P.l + IN + (x - x0) / (x1 - x0) * (W - P.l - P.r - 2 * IN);
  const Y = v => P.t + (1 - (v - y0) / (y1 - y0)) * (H - P.t - P.b);
  const step = [1, 2, 5, 10, 20, 25, 50].find(st => (y1 - y0) / st <= 4) || 100;
  y0 = Math.floor(y0 / step) * step; y1 = Math.ceil(y1 / step) * step;
  const ticks = [];
  for (let v = y0; v <= y1 + 0.001; v += step) ticks.push(v);
  const grid = ticks.map(v => `<line x1="${P.l}" x2="${W - P.r}" y1="${Y(v)}" y2="${Y(v)}" class="grid"/><text x="${P.l - 6}" y="${Y(v) + 3}" class="axis" text-anchor="end">${v}</text>`).join("");
  const first = pts[0].date, last = pts[pts.length - 1].date;
  const xl = `<text x="${X(dayNum(first))}" y="${H - 5}" class="axis" text-anchor="start">${prettyDate(first)}</text>` +
    (first !== last ? `<text x="${X(dayNum(last))}" y="${H - 5}" class="axis" text-anchor="end">${prettyDate(last)}</text>` : "");
  let marks;
  if (kind === "bar") {
    const bw = Math.max(6, Math.min(16, (W - P.l - P.r) / pts.length - 4));
    marks = pts.map(p => {
      const x = X(dayNum(p.date)) - bw / 2, y = Y(p.v), h = Y(0) - y;
      return `<path d="M${x},${Y(0)} V${y + 4} a4,4 0 0 1 4,-4 h${bw - 8} a4,4 0 0 1 4,4 V${Y(0)} Z" fill="${color}"/>`;
    }).join("");
  } else {
    const d = pts.map((p, i) => `${i ? "L" : "M"}${X(dayNum(p.date)).toFixed(1)},${Y(p.v).toFixed(1)}`).join(" ");
    marks = `<path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>` +
      pts.map(p => `<circle cx="${X(dayNum(p.date))}" cy="${Y(p.v)}" r="4" fill="${color}" stroke="var(--bg-card)" stroke-width="2"/>`).join("");
  }
  const hits = pts.map((p, i) => `<circle class="hit" data-i="${i}" cx="${X(dayNum(p.date))}" cy="${Y(p.v)}" r="14" fill="transparent"/>`).join("");
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución">${grid}${xl}${marks}<line class="xhair" y1="${P.t}" y2="${H - P.b}" x1="0" x2="0" style="display:none"/>${hits}</svg>`;
}

function chartCard(title, pts, color, unit, kind, sub) {
  if (!pts.length) return `<div class="card chart-card"><h3>${esc(title)}</h3><p class="empty">Todavía sin registros.</p></div>`;
  const last = pts[pts.length - 1].v, first = pts[0].v;
  const diff = last - first;
  const best = Math.max(...pts.map(p => p.v));
  return `<div class="card chart-card" data-pts='${esc(JSON.stringify(pts))}' data-unit="${esc(unit)}">
    <div class="chart-head">
      <div><h3>${esc(title)}</h3><p class="chart-sub">${esc(sub)}</p></div>
      <div class="hero"><b>${fmt(last)}</b><span>${esc(unit)}</span>
        ${pts.length > 1 ? `<em class="${diff >= 0 ? "up" : "down"}">${diff >= 0 ? "▲" : "▼"} ${fmt(Math.abs(diff))}</em>` : ""}
      </div>
    </div>
    <div class="chart-wrap">${chartSVG(pts, color, unit, kind)}<div class="tip" hidden></div></div>
    <p class="chart-foot">Mejor: ${fmt(best)} ${esc(unit)} · ${pts.length} ${pts.length !== 1 ? "sesiones" : "sesión"}</p>
  </div>`;
}

function renderProgress() {
  $("charts").innerHTML =
    Object.entries(LIFTS).map(([id, L]) => chartCard(L.short, liftSeries(id), L.color, "kg", "line", "1RM estimado por sesión")).join("") +
    chartCard("Dominadas", pullupSeries(), "#43A066", "reps", "bar", "Reps totales por sesión");
  renderHistory();
}

$("charts").addEventListener("pointermove", onChartPointer);
$("charts").addEventListener("pointerdown", onChartPointer);
$("charts").addEventListener("pointerleave", e => {
  $("charts").querySelectorAll(".tip").forEach(t => t.hidden = true);
  $("charts").querySelectorAll(".xhair").forEach(l => l.style.display = "none");
}, true);

function onChartPointer(e) {
  const card = e.target.closest(".chart-card[data-pts]");
  if (!card) return;
  const svg = card.querySelector("svg");
  const pts = JSON.parse(card.dataset.pts);
  const rect = svg.getBoundingClientRect();
  const sx = (e.clientX - rect.left) / rect.width * 340;
  const hits = [...svg.querySelectorAll(".hit")];
  let best = null, bd = Infinity;
  hits.forEach(h => { const d = Math.abs(Number(h.getAttribute("cx")) - sx); if (d < bd) { bd = d; best = h; } });
  if (!best) return;
  const p = pts[Number(best.dataset.i)];
  const cx = Number(best.getAttribute("cx")), cy = Number(best.getAttribute("cy"));
  $("charts").querySelectorAll(".xhair").forEach(l => l.style.display = "none");
  $("charts").querySelectorAll(".tip").forEach(t => t.hidden = true);
  const xh = svg.querySelector(".xhair");
  xh.setAttribute("x1", cx); xh.setAttribute("x2", cx); xh.style.display = "";
  const tip = card.querySelector(".tip");
  tip.innerHTML = `<b>${fmt(p.v)} ${esc(card.dataset.unit)}</b><span>${prettyDate(p.date)} · ${esc(p.label)}</span>`;
  tip.hidden = false;
  const left = cx / 340 * rect.width;
  tip.style.left = `${Math.min(Math.max(left, 60), rect.width - 60)}px`;
  tip.style.top = `${cy / 150 * rect.height - 8}px`;
}

function renderHistory() {
  const list = [...sesiones].sort(bySesionDesc);
  if (!list.length) { $("history").innerHTML = `<p class="empty">Aún no guardas sesiones.</p>`; return; }
  $("history").innerHTML = list.map(s => {
    const main = (s.series || []).find(x => x.amrap && x.reps);
    const isPending = pending.some(p => p.op === "create" && p.data.id === s.id);
    return `<details class="card hist" style="--accent:${DAYS[s.dia].color}">
      <summary>
        <span class="hist-day">D${s.dia}</span>
        <span class="hist-main">${prettyDate(ymdOf(s.fecha))} · ${esc(DAYS[s.dia].name)}<small>Ciclo ${s.ciclo} · S${s.semana}${main ? ` · ${fmt(main.peso)}×${main.reps}` : ""}${isPending ? " · sin subir" : ""}</small></span>
      </summary>
      <pre>${esc(summaryText(s))}</pre>
      <div class="hist-actions">
        <button class="mini-btn" data-copy="${esc(s.id)}">Copiar para Claude</button>
        <button class="mini-btn danger" data-del="${esc(s.id)}">Borrar</button>
      </div>
    </details>`;
  }).join("");
}

$("history").addEventListener("click", e => {
  const c = e.target.closest("[data-copy]");
  if (c) { const s = sesiones.find(x => x.id === c.dataset.copy); if (s) copyText(summaryText(s)); return; }
  const d = e.target.closest("[data-del]");
  if (d) {
    const s = sesiones.find(x => x.id === d.dataset.del);
    if (!s || !confirm(`¿Borrar la sesión D${s.dia} del ${prettyDate(ymdOf(s.fecha))}?`)) return;
    sesiones = sesiones.filter(x => x.id !== s.id);
    const idx = pending.findIndex(p => p.op === "create" && p.data.id === s.id);
    if (idx >= 0) { pending.splice(idx, 1); writeJSON(PENDING_KEY, pending); }
    else queue({ op: "delete", col: COL_SES, id: s.id });
    saveCache(); renderAll();
    toast("Sesión borrada");
  }
});

/* ─────────────────────────────────────────
   RENDER — TMs y revisión de ciclo
───────────────────────────────────────── */
const LIFT_DAY = { banca: 1, sentadilla: 2, militar: 3 };

// Lee las series AMRAP hechas con el TM actual y aplica la regla de tu coach.
// Compara contra el 1RM que implicaba lo pedido, así sirve aunque hayas usado otro peso.
function cycleReview(lift) {
  const day = LIFT_DAY[lift];
  const own = sesiones.filter(s => s.dia === day);
  if (!own.length) return null;
  const tm = currentTM(lift);
  const ciclo = Math.max(...own.map(s => s.ciclo || 1));
  const rows = own.filter(s => s.ciclo === ciclo && s.semana <= 3 && Number(s.tm) === tm)
    .sort((a, b) => a.semana - b.semana || ymdOf(a.fecha).localeCompare(ymdOf(b.fecha)))
    .map(s => {
      const am = (s.series || []).find(x => x.ej === lift && x.amrap && x.reps);
      if (!am) return null;
      const w = WEEKS[s.semana];
      const target = roundLoad(tm * w.pct[2], lift);
      const obj = w.reps[2];
      return { semana: s.semana, peso: am.peso, reps: am.reps, rpe: am.rpe, target, obj,
               est: e1rm(am.peso, am.reps), need: e1rm(target, obj), good: e1rm(target, obj + 2) };
    }).filter(Boolean);
  if (!rows.length) return { ciclo, rows, verdict: null };

  const L = LIFTS[lift];
  const bestE = Math.max(...rows.map(r => r.est));
  let verdict, suggest, why;
  if (rows.some(r => r.est < r.need - 0.01)) {
    verdict = "bajar";
    suggest = Math.floor(bestE * 0.9 / 2.5) * 2.5;
    if (suggest >= tm) suggest = tm - L.inc;
    why = "Quedaste bajo lo pedido en alguna AMRAP: reset al ~90% de tu mejor 1RM estimado.";
  } else if (rows.every(r => r.est >= r.good - 0.01 || (r.rpe && r.rpe <= 8))) {
    verdict = "subir";
    suggest = tm + L.inc;
    why = `Te sobraron reps en las AMRAP: sube ${fmt(L.inc)} kg.`;
  } else {
    verdict = "mantener";
    suggest = tm;
    why = "Cumpliste justo y con esfuerzo alto: repite el TM antes de subir.";
  }
  const complete = rows.some(r => r.semana === 3);
  return { ciclo, rows, verdict, suggest, why, complete };
}

function renderTMs() {
  $("tm-cards").innerHTML = Object.entries(LIFTS).map(([id, L]) => {
    const tm = currentTM(id);
    const hist = tms.filter(t => t.ejercicio === id).sort(byDesdeDesc);
    const rev = cycleReview(id);
    let review = "";
    if (rev && rev.rows.length) {
      review = `<div class="review">
        <p class="review-title">Ciclo ${rev.ciclo} ${rev.complete ? "· listo para revisar" : "· en curso"}</p>
        <table>${rev.rows.map(r => `<tr><td>S${r.semana}</td><td class="mono">${fmt(r.peso)} × ${r.reps}</td><td class="mono dim">pedía ${fmt(r.target)}×${r.obj}+</td><td class="mono dim">${r.rpe ? "RPE " + fmt(r.rpe) : ""}</td></tr>`).join("")}</table>
        <p class="verdict v-${rev.verdict}"><b>${rev.verdict === "subir" ? "▲ Subir" : rev.verdict === "bajar" ? "▼ Bajar" : "■ Mantener"}</b> ${esc(rev.why)}</p>
        ${rev.suggest === tm ? "" : rev.complete
          ? `<button class="ghost-btn" data-apply="${id}" data-tm="${rev.suggest}">Aplicar TM ${fmt(rev.suggest)} kg</button>`
          : `<p class="hint left">Vas bien encaminado a ${fmt(rev.suggest)} kg. Podrás aplicarlo al terminar la S3.</p>`}
      </div>`;
    }
    return `<div class="card tm-card" style="--accent:${L.color}">
      <div class="tm-top">
        <div><p class="lift-name">${esc(L.short)}</p><p class="lift-tm">${hist.length ? `desde ${prettyDate(ymdOf(hist[0].desde))}` : "valor inicial del plan"}</p></div>
        <div class="tm-big"><b>${fmt(tm)}</b><span>kg${L.type === "dumbbell" ? " total" : ""}</span></div>
      </div>
      ${review}
      <form class="tm-form" data-lift="${id}">
        <input type="number" inputmode="decimal" step="2.5" name="tm" placeholder="Nuevo TM" required>
        <button class="ghost-btn" type="submit">Guardar TM</button>
      </form>
      ${hist.length > 1 ? `<details class="tm-hist"><summary>Historial de TMs</summary>${hist.map(t => `<p class="mono">${prettyDate(ymdOf(t.desde))} · ${fmt(t.tm)} kg${t.nota ? ` <span class="dim">· ${esc(t.nota)}</span>` : ""}</p>`).join("")}</details>` : ""}
    </div>`;
  }).join("") + `<p class="hint">La sugerencia sigue las reglas de tu coach. Si dudas, pega el resumen en el chat antes de aplicarla.</p>`;

  $("import-box").innerHTML = sesiones.length ? "" : `<div class="card">
    <h3>Historial previo</h3>
    <p class="acc-note">Carga las ${HISTORIAL_PREVIO.length} sesiones que reportaste en el chat (D1, D2 y D3 del primer ciclo). Las fechas son aproximadas.</p>
    <button class="ghost-btn" id="import-hist">Importar historial</button>
  </div>`;
}

function setTM(lift, value, nota) {
  const rec = { id: newId(), ejercicio: lift, tm: value, desde: toPbDate(today()), nota: nota || "", created: new Date().toISOString() };
  tms.push(rec);
  queue({ op: "create", col: COL_TMS, data: stripLocal(rec) });
  // los borradores de ese ejercicio pasan a usar el TM nuevo (se conservan accesorios y notas)
  for (const k of Object.keys(drafts)) {
    const d = drafts[k];
    if (DAYS[k].lift !== lift) continue;
    const acc = d.acc;
    drafts[k] = freshDraft(Number(k), { ciclo: d.ciclo, semana: d.semana, fecha: d.fecha, notas: d.notas });
    drafts[k].acc = acc;
    drafts[k].touched = d.touched;
  }
  saveDrafts(); saveCache(); renderAll();
  toast(`TM de ${LIFTS[lift].short}: ${fmt(value)} kg`);
}

$("tm-cards").addEventListener("submit", e => {
  e.preventDefault();
  const f = e.target.closest(".tm-form");
  const v = num(new FormData(f).get("tm"));
  if (!v || v <= 0) return;
  setTM(f.dataset.lift, v, "manual");
});

$("tm-cards").addEventListener("click", e => {
  const b = e.target.closest("[data-apply]");
  if (!b) return;
  const rev = cycleReview(b.dataset.apply);
  setTM(b.dataset.apply, Number(b.dataset.tm), `revisión ciclo ${rev?.ciclo ?? ""}: ${rev?.verdict ?? ""}`.trim());
});

$("import-box").addEventListener("click", e => {
  if (e.target.id !== "import-hist") return;
  HISTORIAL_PREVIO.forEach((h, i) => {
    const rec = { ...h, id: newId(), fecha: toPbDate(h.fecha), created: new Date(Date.now() + i).toISOString() };
    sesiones.push(rec);
    queue({ op: "create", col: COL_SES, data: stripLocal(rec) });
  });
  drafts = {}; saveDrafts();
  ui.day = suggestedDay();
  saveCache(); renderAll();
  toast("Historial importado");
});

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

/* ─────────────────────────────────────────
   POCKETBASE Y SINCRONIZACIÓN
───────────────────────────────────────── */
function saveCache() { writeJSON(CACHE_KEY, { tms, sesiones }); }

function queue(op) {
  pending.push(op);
  writeJSON(PENDING_KEY, pending);
  flush();
}

function connect(url) {
  pb = new PocketBase(url);
  pb.autoCancellation(false);
  // ngrok muestra una página de aviso en vez de la respuesta si no va este header
  pb.beforeSend = (u, options) => {
    options.headers = Object.assign({}, options.headers, { "ngrok-skip-browser-warning": "1" });
    return { url: u, options };
  };
}

function normSes(r) { return { ...r, dia: Number(r.dia), ciclo: Number(r.ciclo) || 1, semana: Number(r.semana) || 1, series: Array.isArray(r.series) ? r.series : [] }; }

async function fetchRemote() {
  const [t, s] = await Promise.all([
    pb.collection(COL_TMS).getFullList({ sort: "-desde" }),
    pb.collection(COL_SES).getFullList({ sort: "-fecha" }),
  ]);
  tms = t;
  sesiones = s.map(normSes);
  // lo que todavía no se subió manda sobre lo que dice el servidor
  for (const p of pending) {
    if (p.op === "create") {
      const list = p.col === COL_TMS ? tms : sesiones;
      if (!list.some(x => x.id === p.data.id)) list.push(p.col === COL_SES ? normSes(p.data) : p.data);
    }
    if (p.op === "delete") sesiones = sesiones.filter(x => x.id !== p.id);
  }
}

async function flush() {
  if (flushing || !online || !pb?.authStore.isValid || !pending.length) { updateStatus(); return; }
  flushing = true;
  updateStatus();
  try {
    while (pending.length) {
      const p = pending[0];
      try {
        if (p.op === "create") await pb.collection(p.col).create(p.data);
        if (p.op === "delete") await pb.collection(p.col).delete(p.id);
      } catch (e) {
        const dup = e.status === 400 && e.response?.data?.id;  // ya estaba subido
        const gone = e.status === 404 && p.op === "delete";
        if (!dup && !gone) throw e;
      }
      pending.shift();
      writeJSON(PENDING_KEY, pending);
    }
  } catch (e) {
    if (e.status === 401 || e.status === 403) updateStatus("Sin permiso para guardar: revisa las reglas de las colecciones");
    else if (e.status === 404) updateStatus("Faltan las colecciones fuerza_tms / fuerza_sesiones en PocketBase");
    else if (e.status === 400) updateStatus("PocketBase rechazó un registro: revisa los campos de la colección");
    else { online = false; updateStatus(); }
    return;
  } finally {
    flushing = false;
  }
  updateStatus();
  if (ui.view !== "train") renderAll(); // quita las etiquetas "sin subir"
}

async function sync() {
  if (!pb) return;
  if (!pb.authStore.isValid) { online = true; updateStatus(); return; }
  try {
    await pb.collection("users").authRefresh().catch(e => { if (e.status === 401) pb.authStore.clear(); });
    if (!pb.authStore.isValid) { updateStatus(); return; }
    await fetchRemote();
    online = true;
  } catch (e) {
    online = false;
    updateStatus(e.status === 404 ? "Faltan las colecciones fuerza_tms / fuerza_sesiones en PocketBase" : undefined);
    return;
  }
  saveCache();
  // sin TMs guardados todavía: sube los del plan
  if (!tms.length) {
    for (const [lift, v] of Object.entries(DEFAULT_TMS)) {
      const rec = { id: newId(), ejercicio: lift, tm: v, desde: toPbDate(today()), nota: "TM inicial del plan", created: new Date().toISOString() };
      tms.push(rec);
      pending.push({ op: "create", col: COL_TMS, data: stripLocal(rec) });
    }
    writeJSON(PENDING_KEY, pending);
  }
  dropUntouchedDrafts();
  renderAll();
  await flush();
}

// un borrador que no tocaste se regenera con los datos nuevos (TM, semana que toca, últimos accesorios)
function dropUntouchedDrafts() {
  for (const k of Object.keys(drafts)) if (!drafts[k].touched) delete drafts[k];
  saveDrafts();
}

function updateStatus(msg) {
  const logged = pb && pb.authStore.isValid;
  $("login-form").hidden = !!logged;
  $("login-user").hidden = !logged;
  if (logged) $("login-user").querySelector("span").textContent = pb.authStore.record?.email || "";
  const n = pending.length;
  let text, state;
  if (msg) { text = msg; state = "warn"; }
  else if (!online) { text = n ? `Sin conexión · ${n} cambio${n !== 1 ? "s" : ""} en espera` : "Sin conexión · usando la copia del teléfono"; state = "off"; }
  else if (!logged) { text = n ? `Inicia sesión para subir ${n} cambio${n !== 1 ? "s" : ""}` : "Inicia sesión para guardar en tu servidor"; state = "warn"; }
  else if (n) { text = `Subiendo ${n} cambio${n !== 1 ? "s" : ""}…`; state = "busy"; }
  else { text = "Sincronizado"; state = "ok"; }
  $("status").textContent = text;
  const dot = $("status-dot");
  dot.dataset.state = state;
  dot.title = text;
}

$("status-dot").addEventListener("click", () => { ui.view = "tms"; writeJSON(UI_KEY, ui); renderAll(); });

$("login-form").addEventListener("submit", async e => {
  e.preventDefault();
  const f = new FormData(e.target);
  updateStatus("Conectando…");
  try {
    await pb.collection("users").authWithPassword(f.get("email"), f.get("password"));
    e.target.reset();
  } catch (err) {
    updateStatus(err.status === 400 ? "Correo o contraseña incorrectos" : "No se pudo conectar al servidor");
    return;
  }
  sync();
});

$("logout").addEventListener("click", () => { pb.authStore.clear(); updateStatus(); });

document.addEventListener("visibilitychange", () => { if (!document.hidden) sync(); });
window.addEventListener("online", sync);

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
