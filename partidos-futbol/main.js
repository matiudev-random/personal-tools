/* ─────────────────────────────────────────
   PARTIDOS DE FÚTBOL
   Lista de jugadores con asistencia, forma de pago y valoración.
   Todo se guarda en localStorage (solo en este dispositivo).
───────────────────────────────────────── */
const STORAGE_KEY = "partidos-futbol:v1";

const POSICIONES = ["ARQ", "DEF", "MED", "DEL"];
const PAGOS = {
  transferencia: { label: "Transferencia", color: "green" },
  efectivo:      { label: "Efectivo",      color: "green" },
  no:            { label: "No pagado",     color: "red"   },
};

/* Jugadores de partida la primera vez que se abre la app */
const DEFAULT_PLAYERS = [
  { name: "Diego", pos: "ARQ", skill: 7 },
  { name: "Lalo", pos: "DEF", skill: 7 },
  { name: "Joako", pos: "DEF", skill: 5 },
  { name: "Omar", pos: "DEF", skill: 7 },
  { name: "Erick", pos: "DEF", skill: 3 },
  { name: "Pancho", pos: "MED", skill: 9 },
  { name: "Goti Goti", pos: "MED", skill: 5 },
  { name: "Dixon", pos: "MED", skill: 8 },
  { name: "Matias", pos: "DEL", skill: 8 },
  { name: "Shagy", pos: "DEL", skill: 7 },
  { name: "Sexpeda", pos: "DEL", skill: 9 },
  { name: "Pato", pos: "DEL", skill: 6 },
];

const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, "0");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const clampSkill = n => Math.min(10, Math.max(1, Math.round(Number(n) || 1)));


/* ─────────────────────────────────────────
   ESTADO + GUARDADO
───────────────────────────────────────── */
let players = [];
let nextId = 1;
let sort = { key: null, dir: 1 };

function newPlayer({ name, pos = "DEL", skill = 5, asiste = false, pago = "no" }) {
  return { id: nextId++, name, pos, skill: clampSkill(skill), asiste, pago };
}

function load() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) {}
  if (saved && Array.isArray(saved.players)) {
    players = saved.players.map(p => ({
      id: p.id,
      name: String(p.name || "Sin nombre"),
      pos: POSICIONES.includes(p.pos) ? p.pos : "DEL",
      skill: clampSkill(p.skill),
      asiste: !!p.asiste,
      pago: PAGOS[p.pago] ? p.pago : "no",
    }));
    nextId = Math.max(0, ...players.map(p => p.id)) + 1;
  } else {
    players = DEFAULT_PLAYERS.map(newPlayer);
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ players }));
  } catch (e) {
    toast("No se pudo guardar en este navegador", true);
  }
}

function update(id, changes) {
  const p = players.find(x => x.id === id);
  if (!p) return;
  Object.assign(p, changes);
  save();
  render();
}


/* ─────────────────────────────────────────
   TABLA
───────────────────────────────────────── */
function sortedPlayers() {
  if (!sort.key) return players;
  const val = {
    name:   p => p.name.toLowerCase(),
    skill:  p => p.skill,
    asiste: p => (p.asiste ? 1 : 0),
    pago:   p => (p.pago === "no" ? 0 : 1),
  }[sort.key];
  return [...players].sort((a, b) => (val(a) > val(b) ? 1 : val(a) < val(b) ? -1 : 0) * sort.dir);
}

function rowHTML(p, i) {
  const pago = PAGOS[p.pago];
  const debe = p.asiste && p.pago === "no";
  return `
    <tr data-id="${p.id}" class="${p.asiste ? "is-in" : "is-out"}${debe ? " debe" : ""}">
      <td class="c-num num" data-label="#">${pad(i + 1)}</td>
      <td class="c-name" data-label="Jugador">${esc(p.name)}</td>
      <td class="c-pos" data-label="Pos.">
        <select class="mini-select" data-field="pos" aria-label="Posición de ${esc(p.name)}">
          ${POSICIONES.map(x => `<option${x === p.pos ? " selected" : ""}>${x}</option>`).join("")}
        </select>
      </td>
      <td class="c-skill" data-label="Valoración">
        <div class="stepper" aria-label="Valoración de ${esc(p.name)}">
          <button type="button" data-step="-1" aria-label="Bajar">−</button>
          <span class="num">${p.skill}</span>
          <button type="button" data-step="1" aria-label="Subir">+</button>
        </div>
      </td>
      <td class="c-asiste" data-label="Asiste">
        <div class="seg" role="group" aria-label="¿${esc(p.name)} asiste?">
          <button type="button" data-asiste="1" aria-pressed="${p.asiste}">Sí</button>
          <button type="button" data-asiste="0" aria-pressed="${!p.asiste}">No</button>
        </div>
      </td>
      <td class="c-pago ${pago.color}" data-label="Pago">
        <span class="led"></span>
        <select class="mini-select" data-field="pago" aria-label="Pago de ${esc(p.name)}">
          ${Object.entries(PAGOS).map(([k, v]) => `<option value="${k}"${k === p.pago ? " selected" : ""}>${v.label}</option>`).join("")}
        </select>
      </td>
      <td class="c-act">
        <button type="button" class="btn btn-danger btn-sm" data-remove aria-label="Quitar a ${esc(p.name)}">✕</button>
      </td>
    </tr>`;
}

function renderTable() {
  const list = sortedPlayers();
  $("players-body").innerHTML = list.length
    ? list.map(rowHTML).join("")
    : `<tr class="empty-row"><td colspan="7">Sin jugadores. Agrega el primero abajo.</td></tr>`;

  document.querySelectorAll(".sort").forEach(b => {
    const on = b.dataset.sort === sort.key;
    b.classList.toggle("active", on);
    b.querySelector("span").textContent = on ? (sort.dir === 1 ? "▲" : "▼") : "↕";
  });
}

function renderKpis() {
  const asisten = players.filter(p => p.asiste);
  const transf  = asisten.filter(p => p.pago === "transferencia").length;
  const efect   = asisten.filter(p => p.pago === "efectivo").length;
  const deben   = asisten.length - transf - efect;

  $("k-asisten").textContent = pad(asisten.length);
  $("k-asisten-sub").textContent = `de ${pad(players.length)} jugadores`;
  $("k-pagados").textContent = pad(transf + efect);
  $("k-pagados-sub").textContent = `${transf} transf. · ${efect} efectivo`;
  $("k-deben").textContent = pad(deben);
  $("k-deben").classList.toggle("red", deben > 0);
  $("selected-count-label").textContent = asisten.length;
}

function render() {
  renderTable();
  renderKpis();
  if (!spinning) drawRoulette(currentAngle);
}


/* ─────────────────────────────────────────
   EVENTOS DE LA TABLA
───────────────────────────────────────── */
$("players-body").addEventListener("click", e => {
  const tr = e.target.closest("tr[data-id]");
  if (!tr) return;
  const id = Number(tr.dataset.id);
  const p = players.find(x => x.id === id);
  const btn = e.target.closest("button");
  if (!btn || !p) return;

  if (btn.dataset.step) {
    update(id, { skill: clampSkill(p.skill + Number(btn.dataset.step)) });
  } else if (btn.dataset.asiste) {
    update(id, { asiste: btn.dataset.asiste === "1" });
  } else if (btn.hasAttribute("data-remove")) {
    if (!confirm(`¿Quitar a ${p.name} de la lista? Se pierde su valoración.`)) return;
    players = players.filter(x => x.id !== id);
    save();
    render();
  }
});

$("players-body").addEventListener("change", e => {
  const sel = e.target.closest("select[data-field]");
  const tr = e.target.closest("tr[data-id]");
  if (sel && tr) update(Number(tr.dataset.id), { [sel.dataset.field]: sel.value });
});

document.querySelectorAll(".sort").forEach(b => b.addEventListener("click", () => {
  const key = b.dataset.sort;
  if (sort.key !== key) sort = { key, dir: 1 };
  else if (sort.dir === 1) sort.dir = -1;
  else sort = { key: null, dir: 1 };   // tercer clic: orden original
  renderTable();
}));

$("new-skill").addEventListener("input", e => { $("skill-display").textContent = e.target.value; });

$("add-form").addEventListener("submit", e => {
  e.preventDefault();
  const name = $("new-name").value.trim();
  if (!name) return;
  if (players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
    toast(`${name} ya está en la lista`, true);
    return;
  }
  players.push(newPlayer({ name, pos: $("new-pos").value, skill: $("new-skill").value }));
  $("new-name").value = "";
  save();
  render();
  toast(`${name} agregado`);
});

/* Nuevo partido: limpia asistencia y pagos, mantiene jugadores y valoración */
$("btn-nuevo").addEventListener("click", () => {
  if (!confirm("¿Empezar un partido nuevo? Se borran asistencias y pagos; los jugadores y su valoración se mantienen.")) return;
  players.forEach(p => { p.asiste = false; p.pago = "no"; });
  save();
  resetSorteo();
  render();
  toast("Partido nuevo listo");
});


/* ─────────────────────────────────────────
   RULETA
───────────────────────────────────────── */
const canvas = $("roulette");
const ctx = canvas.getContext("2d");
const W = 320, H = 320, CX = W / 2, CY = H / 2, R = 145;
let spinning = false;
let currentAngle = 0;

const confirmed = () => players.filter(p => p.asiste);

function drawRoulette(angle) {
  ctx.clearRect(0, 0, W, H);
  const sel = confirmed();
  if (sel.length === 0) {
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.fillStyle = "#e3dbcd";
    ctx.fill();
    ctx.fillStyle = "#706a5f";
    ctx.font = "600 15px 'Barlow Condensed', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("NADIE CONFIRMADO", CX, CY + 5);
    return;
  }
  const slice = (Math.PI * 2) / sel.length;
  // Grafito / rojo señal / grafito claro, alternando
  const colors = ["#16181b", "#d11a2a", "#2b2f34", "#a3101d"];
  sel.forEach((p, i) => {
    const a = angle + i * slice;
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.arc(CX, CY, R, a, a + slice);
    ctx.closePath();
    ctx.fillStyle = colors[(sel.length % colors.length === 1 && i === sel.length - 1) ? 2 : i % colors.length];
    ctx.fill();
    ctx.strokeStyle = "#fbf9f5";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate(a + slice / 2);
    ctx.textAlign = "right";
    const fs = sel.length > 12 ? 9 : sel.length > 8 ? 10 : 12;
    ctx.font = `700 ${fs + 3}px 'Barlow Condensed', sans-serif`;
    ctx.fillStyle = "#fbf9f5";
    const maxLen = sel.length > 10 ? 8 : 12;
    const nm = p.name.length > maxLen ? p.name.substring(0, maxLen - 1) + "…" : p.name;
    ctx.fillText(nm.toUpperCase(), R - 10, 5);
    ctx.restore();
  });
  ctx.beginPath();
  ctx.arc(CX, CY, 24, 0, Math.PI * 2);
  ctx.fillStyle = "#fbf9f5";
  ctx.fill();
  ctx.strokeStyle = "#16181b";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "#16181b";
  ctx.font = "800 15px 'Barlow Condensed', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("GO", CX, CY + 5);
}

/* Reparte equilibrando cantidad y valoración.
   Arqueros primero (uno por equipo si hay dos), luego de mayor a menor
   valoración; los empates se desordenan para que cada sorteo varíe. */
function balancedSplit(sel) {
  const order = [...sel]
    .map(p => ({ p, r: Math.random() }))
    .sort((a, b) =>
      (b.p.pos === "ARQ") - (a.p.pos === "ARQ") ||
      b.p.skill - a.p.skill ||
      a.r - b.r)
    .map(x => x.p);
  const tA = [], tB = [];
  let sA = 0, sB = 0;
  for (const p of order) {
    const toA = tA.length !== tB.length ? tA.length < tB.length : sA <= sB;
    if (toA) { tA.push(p); sA += p.skill; } else { tB.push(p); sB += p.skill; }
  }
  return Math.random() < 0.5 ? [tA, tB] : [tB, tA];
}

function startSorteo() {
  if (spinning) return;
  const sel = confirmed();
  if (sel.length < 2) {
    toast("Necesitas al menos 2 confirmados", true);
    return;
  }
  $("teams-output").hidden = true;
  spinning = true;
  $("btn-sortear").disabled = true;
  const state = $("spin-state");
  state.classList.add("active");
  $("spin-msg").textContent = "Sorteando jugadores…";
  const totalRot = Math.PI * 2 * 6 + Math.random() * Math.PI * 2;
  const duration = 3200;
  const start = performance.now();
  const startAngle = currentAngle;
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  function frame(now) {
    const t = Math.min((now - start) / duration, 1);
    currentAngle = startAngle + totalRot * easeOut(t);
    drawRoulette(currentAngle);
    if (t < 1) return requestAnimationFrame(frame);
    spinning = false;
    $("btn-sortear").disabled = false;
    showTeams(sel);
    $("spin-msg").textContent = "¡Equipos listos!";
    setTimeout(() => state.classList.remove("active"), 1500);
  }
  requestAnimationFrame(frame);
}

function teamRows(team) {
  return team.map(p => `<div class="team-player">
      <span class="team-player-name">${esc(p.name)}</span>
      <span class="team-player-pos">${p.pos}</span>
      <span class="team-player-skill">${p.skill}</span>
    </div>`).join("");
}

function showTeams(sel) {
  const [tA, tB] = balancedSplit(sel);
  const avg = t => (t.reduce((s, p) => s + p.skill, 0) / t.length).toFixed(1);
  $("avg-a").textContent = `${tA.length} jug · Prom ${avg(tA)}`;
  $("avg-b").textContent = `${tB.length} jug · Prom ${avg(tB)}`;
  $("team-a-players").innerHTML = teamRows(tA);
  $("team-b-players").innerHTML = teamRows(tB);
  $("teams-output").hidden = false;
  $("teams-output").scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetSorteo() {
  $("teams-output").hidden = true;
  $("spin-state").classList.remove("active");
  currentAngle = 0;
  drawRoulette(0);
}

$("btn-sortear").addEventListener("click", startSorteo);
$("btn-reset").addEventListener("click", resetSorteo);


/* ─────────────────────────────────────────
   TOAST
───────────────────────────────────────── */
function toast(msg, isError = false) {
  const t = $("toast");
  t.textContent = msg;
  t.style.borderLeftColor = isError ? "var(--red)" : "";
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 2200);
}


/* ─────────────────────────────────────────
   INIT
───────────────────────────────────────── */
load();
save();
render();
// Redibuja cuando cargue la fuente condensada del canvas
document.fonts?.ready.then(() => drawRoulette(currentAngle));
