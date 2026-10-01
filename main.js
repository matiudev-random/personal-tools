/* ─────────────────────────────────────────
   DASHBOARD
   → Para agregar una app, añádela al array TOOLS.
     Si lleva `quick`, también aparece en la barra de acceso rápido.
───────────────────────────────────────── */
const TOOLS = [
  {
    title:  "Rodilla",
    desc:   "Programa de recuperación para tendinopatía rotuliana. 3 meses, casa → gym → fútbol.",
    icon:   "🦵",
    tag:    "Salud",
    href:   "knee-rehab/index.html",
    status: "active",
    quick:  "Rodilla",
  },
  {
    title:  "Ruleta Equipos",
    desc:   "Ruleta para distribuir los equipos de forma equitativa en los partidos.",
    icon:   "⚽",
    tag:    "Deporte",
    href:   "soccer-roulette/index.html",
    status: "active",
    quick:  "Ruleta",
  },
  {
    title:  "Camino a Doomsday",
    desc:   "Orden cronológico de todo el UCM (y sus universos aparte) para llegar a Avengers: Doomsday sin perderte nada.",
    icon:   "🛡️",
    tag:    "Entretenimiento",
    href:   "doomsday-timeline/index.html",
    status: "active",
    quick:  "Doomsday",
  },
  {
    title:  "Fuerza 5/3/1",
    desc:   "Tracker del plan Upper/Lower: pesos del día, reps y RPE, progreso del 1RM y revisión de TMs.",
    icon:   "🏋️",
    tag:    "Deporte",
    href:   "fuerza-531/index.html",
    status: "active",
    quick:  "Fuerza",
  },
  {
    title:  "Monitor",
    desc:   "Estado del servidor casero, accesos fallidos y revisión de seguridad de PocketBase.",
    icon:   "📡",
    tag:    "Servidor",
    href:   "server-monitor/index.html",
    status: "active",
    quick:  "Monitor",
  },
];

const DAYS   = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
const MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, "0");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);


/* ─────────────────────────────────────────
   RELOJ, FECHA Y AÑO
───────────────────────────────────────── */
function updateClock() {
  const now = new Date();
  $("clock").textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  $("dateDisplay").textContent =
    `${DAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
}


/* ─────────────────────────────────────────
   RENDER
───────────────────────────────────────── */
function toolCard(tool, i) {
  const a = document.createElement("a");
  a.className = "tool-card";
  a.href = tool.href;
  a.style.animationDelay = `${i * 80}ms`;
  a.innerHTML = `
    <div class="card-accent"></div>
    <div class="card-status ${tool.status === "wip" ? "wip" : ""}"></div>
    <div class="card-body">
      <div class="card-icon">${esc(tool.icon)}</div>
      <div class="card-title">${esc(tool.title)}</div>
      <p class="card-desc">${esc(tool.desc)}</p>
    </div>
    <div class="card-footer">
      <span class="card-tag">${esc(tool.tag)}</span>
      <span class="card-arrow">→</span>
    </div>
  `;
  return a;
}

function quickButton({ label, icon, href }) {
  const a = document.createElement("a");
  a.className = "quick-btn";
  a.href = href;
  a.innerHTML = `<span class="qb-icon">${esc(icon)}</span>${esc(label)}`;
  return a;
}

function renderTools() {
  $("toolsGrid").append(...TOOLS.map(toolCard));
  $("toolCount").textContent = `${TOOLS.length} app${TOOLS.length !== 1 ? "s" : ""}`;
}

function renderQuickBar() {
  const links = TOOLS
    .filter(t => t.quick)
    .map(t => ({ label: t.quick, icon: t.icon, href: t.href }));
  links.push({ label: "Inicio", icon: "⌂", href: "#" });
  $("quickBar").append(...links.map(quickButton));
}


/* ─────────────────────────────────────────
   INIT
───────────────────────────────────────── */
$("year").textContent = new Date().getFullYear();
updateClock();
setInterval(updateClock, 1000);
renderTools();
renderQuickBar();
