/* ─────────────────────────────────────────
   CONFIGURACIÓN DE HERRAMIENTAS
   → Añade o edita tus apps aquí
───────────────────────────────────────── */
const TOOLS = [
  {
    title:  "Rodilla",
    desc:   "Programa de recuperación para tendinopatía rotuliana. 3 meses, casa → gym → fútbol.",
    icon:   "🦵",
    tag:    "Salud",
    href:   "knee-rehab/index.html",
    status: "active",
  },

    {
    title:  "Ruleta Equipos",
    desc:   "Ruleta para distribuir los Equipos de forma equitativa en los partidos.",
    icon:   "⚽",
    tag:    "Deporte",
    href:   "soccer-roulette/index.html",
    status: "active",
  },

  {
    title:  "Sincronizar",
    desc:   "Sincroniza eventos de vida diaria y fechas de la universidad entre Notion y Google Calendar.",
    icon:   "⚡",
    tag:    "Productividad",
    href:   "notion-sync/index.html",
    status: "active",
  },

  {
    title:  "Camino a Doomsday",
    desc:   "Orden cronológico de todo el UCM (y sus universos aparte) para llegar a Avengers: Doomsday sin perderte nada.",
    icon:   "🛡️",
    tag:    "Entretenimiento",
    href:   "doomsday-timeline/index.html",
    status: "active",
  },

  // ── AÑADE TUS OTRAS APPS AQUÍ ──────────────────────────────────────────
  // {
  //   title:  "Nombre de la app",
  //   desc:   "Descripción breve de para qué sirve.",
  //   icon:   "🔧",
  //   tag:    "Categoría",
  //   href:   "carpeta/index.html",
  //   status: "active",
  // },
  // ───────────────────────────────────────────────────────────────────────
];

/* Accesos rápidos en la barra inferior */
const QUICK_LINKS = [
  { label: "Rodilla",     icon: "🦵", href: "knee-rehab/index.html" },
  { label: "Ruleta",     icon: "⚽", href: "soccer-roulette/index.html" },
  { label: "Sincronizar", icon: "⚡", href: "notion-sync/index.html" },
  { label: "Doomsday",    icon: "🛡️", href: "doomsday-timeline/index.html" },
  { label: "Inicio",      icon: "⌂",  href: "#" },
];


/* ─────────────────────────────────────────
   RELOJ Y FECHA
───────────────────────────────────────── */
function updateClock() {
  const now    = new Date();
  const h      = String(now.getHours()).padStart(2, "0");
  const m      = String(now.getMinutes()).padStart(2, "0");
  const s      = String(now.getSeconds()).padStart(2, "0");
  const days   = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
  const months = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];

  document.getElementById("clock").textContent = `${h}:${m}:${s}`;
  document.getElementById("dateDisplay").textContent =
    `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

setInterval(updateClock, 1000);
updateClock();

/* Año en el footer */
document.getElementById("year").textContent = new Date().getFullYear();


/* ─────────────────────────────────────────
   RENDER DE TARJETAS
───────────────────────────────────────── */
function renderTools() {
  const grid = document.getElementById("toolsGrid");

  TOOLS.forEach((tool, i) => {
    const a = document.createElement("a");
    a.className  = "tool-card";
    a.href       = tool.href;
    a.style.animationDelay = `${i * 80}ms`;

    // Abre en nueva pestaña si no es ancla
    if (tool.href !== "#") a.target = "_self";

    a.innerHTML = `
      <div class="card-accent"></div>
      <div class="card-status ${tool.status === "wip" ? "wip" : ""}"></div>
      <div class="card-body">
        <div class="card-icon">${tool.icon}</div>
        <div class="card-title">${tool.title}</div>
        <p class="card-desc">${tool.desc}</p>
      </div>
      <div class="card-footer">
        <span class="card-tag">${tool.tag}</span>
        <span class="card-arrow">→</span>
      </div>
    `;

    grid.appendChild(a);
  });

  document.getElementById("toolCount").textContent =
    `${TOOLS.length} app${TOOLS.length !== 1 ? "s" : ""}`;
}


/* ─────────────────────────────────────────
   RENDER QUICK BAR
───────────────────────────────────────── */
function renderQuickBar() {
  const bar = document.getElementById("quickBar");

  QUICK_LINKS.forEach(link => {
    const a = document.createElement("a");
    a.className = "quick-btn";
    a.href      = link.href;
    if (link.href !== "#") a.target = "_self";
    a.innerHTML = `<span class="qb-icon">${link.icon}</span>${link.label}`;
    bar.appendChild(a);
  });
}


/* ─────────────────────────────────────────
   INIT
───────────────────────────────────────── */
renderTools();
renderQuickBar();
