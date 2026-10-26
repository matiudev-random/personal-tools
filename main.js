/* ─────────────────────────────────────────
   DASHBOARD
   → Para agregar una app, añádela al array TOOLS.
     Si lleva `quick`, también aparece en la barra de acceso rápido.
     `icon` es una clave de ICONS (íconos SVG de trazo).
───────────────────────────────────────── */
const TOOLS = [
  {
    title:  "Rodilla",
    desc:   "Programa de recuperación para tendinopatía rotuliana. 3 meses, casa → gym → fútbol.",
    icon:   "activity",
    tag:    "Salud",
    href:   "knee-rehab/index.html",
    status: "active",
    quick:  "Rodilla",
  },
  {
    title:  "Partidos de Fútbol",
    desc:   "Lista de jugadores con asistencia y forma de pago; arma equipos parejos según la valoración.",
    icon:   "shuffle",
    tag:    "Deporte",
    href:   "partidos-futbol/index.html",
    status: "active",
    quick:  "Partidos",
  },
  {
    title:  "Camino a Doomsday",
    desc:   "Orden cronológico de todo el UCM (y sus universos aparte) para llegar a Avengers: Doomsday sin perderte nada.",
    icon:   "shield",
    tag:    "Entretenimiento",
    href:   "doomsday-timeline/index.html",
    status: "active",
    quick:  "Doomsday",
  },
  {
    title:  "Monitor",
    desc:   "Estado del servidor casero, accesos fallidos y revisión de seguridad de PocketBase.",
    icon:   "server",
    tag:    "Servidor",
    href:   "server-monitor/index.html",
    status: "active",
    quick:  "Monitor",
  },
];

/* Íconos SVG de trazo (estilo Lucide), 24×24 */
const ICONS = {
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  shuffle:  '<path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/>',
  shield:   '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  server:   '<rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><path d="M6 6h.01"/><path d="M6 18h.01"/>',
  home:     '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
  arrow:    '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  tool:     '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
};

const STATUS = {
  active: { label: "Operativo",  color: "green", pulse: false },
  wip:    { label: "En gestión", color: "amber", pulse: true  },
};

const DAYS   = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
const MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, "0");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.tool}</svg>`;


/* ─────────────────────────────────────────
   RELOJ, FECHA Y AÑO
───────────────────────────────────────── */
function updateClock() {
  const now = new Date();
  $("clock").textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  $("dateDisplay").textContent =
    `${DAYS[now.getDay()]} ${pad(now.getDate())} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
}

/* Semana ISO del año */
function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}


/* ─────────────────────────────────────────
   RENDER
───────────────────────────────────────── */
function toolCard(tool, i) {
  const st = STATUS[tool.status] || STATUS.active;
  const a = document.createElement("a");
  a.className = "tool-card";
  a.href = tool.href;
  a.style.animationDelay = `${i * 60}ms`;
  a.innerHTML = `
    <div class="card-head">
      <span class="code">T-${pad(i + 1)}</span>
      <span class="status ${st.color}"><span class="led${st.pulse ? " pulse" : ""}"></span>${st.label}</span>
    </div>
    <div class="card-body">
      <div class="card-icon">${icon(tool.icon)}</div>
      <h3 class="card-title">${esc(tool.title)}</h3>
      <p class="card-desc">${esc(tool.desc)}</p>
    </div>
    <div class="card-footer">
      <span class="tag">${esc(tool.tag)}</span>
      <span class="card-open">Abrir ${icon("arrow")}</span>
    </div>
  `;
  return a;
}

function quickButton({ label, icon: name, href }, i) {
  const a = document.createElement("a");
  a.className = "quick-btn";
  a.href = href;
  a.innerHTML = `${icon(name)}${esc(label)}<span class="qb-key">${pad(i + 1)}</span>`;
  return a;
}

function renderTools() {
  $("toolsGrid").append(...TOOLS.map(toolCard));
  $("toolCount").textContent = `${pad(TOOLS.length)} APP${TOOLS.length !== 1 ? "S" : ""}`;
}

function renderStats() {
  $("statActive").textContent = pad(TOOLS.filter(t => t.status === "active").length);
  $("statTags").textContent   = pad(new Set(TOOLS.map(t => t.tag)).size);
  $("statWeek").textContent   = pad(isoWeek(new Date()));
}

function renderQuickBar() {
  const links = TOOLS
    .filter(t => t.quick)
    .map(t => ({ label: t.quick, icon: t.icon, href: t.href }));
  links.push({ label: "Inicio", icon: "home", href: "#" });
  $("quickBar").append(...links.map(quickButton));
}


/* ─────────────────────────────────────────
   INIT
───────────────────────────────────────── */
$("year").textContent = new Date().getFullYear();
updateClock();
setInterval(updateClock, 1000);
renderTools();
renderStats();
renderQuickBar();
