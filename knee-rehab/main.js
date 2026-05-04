const phases = [
  {
    id: 1,
    name: "FASE 1",
    subtitle: "Calmar la irritación",
    weeks: "Sem. 1–2",
    color: "#ef4444",
    icon: "🧊",
    description:
      "Sin ejercicio de carga. Objetivo: bajar la inflamación por los 3 partidos seguidos.",
    days: [
      {
        label: "Todos los días",
        sessions: [
          {
            name: "Protocolo diario",
            exercises: [
              { name: "Hielo en rodilla",           sets: "2–3×/día", reps: "15–20 min", note: "Especialmente tras caminar mucho" },
              { name: "Pierna elevada al sentarte",  sets: "Siempre",  reps: "—",        note: "Reduce inflamación pasivamente" },
            ],
          },
          {
            name: "Estiramientos suaves",
            exercises: [
              { name: "Cuádriceps de pie",           sets: "3 series", reps: "30 seg", note: "Sin jalar fuerte" },
              { name: "Isquiotibiales sentado",      sets: "3 series", reps: "30 seg", note: "Espalda recta" },
              { name: "Pantorrilla contra pared",    sets: "3 series", reps: "30 seg", note: "Pie plano, rodilla recta" },
            ],
          },
        ],
      },
    ],
    warnings: ["❌ Nada de fútbol", "❌ Nada de sentadillas ni saltos", "❌ Evitar estar de pie estático mucho tiempo"],
  },
  {
    id: 2,
    name: "FASE 2",
    subtitle: "Carga isométrica",
    weeks: "Sem. 2–4",
    color: "#f97316",
    icon: "💪",
    description:
      "El tendón empieza a trabajar. Isométricos para aliviar dolor y estimular el tendón.",
    days: [
      {
        label: "Una vez al día",
        sessions: [
          {
            name: "🎯 Tendón — PRIORIDAD",
            exercises: [
              { name: "Isométrico en pared (wall sit)", sets: "5 series", reps: "45–60 seg", note: "Rodillas ~100–110°. Dolor máx 4/10" },
            ],
          },
          {
            name: "🍑 Cadera y Glúteos",
            exercises: [
              { name: "Puente de glúteos",   sets: "3 series", reps: "15 rep", note: "Eleva caderas" },
              { name: "Abducción lateral",   sets: "3 series", reps: "15 rep", note: "Sube pierna recta" },
            ],
          },
          {
            name: "🧱 Core",
            exercises: [
              { name: "Plancha frontal", sets: "3 series", reps: "30 seg", note: "Cuerpo recto" },
            ],
          },
        ],
      },
    ],
    warnings: ["❌ Nada de fútbol", "❌ Nada de sentadillas con carga", "✅ Caminar normal con moderación"],
  },
  {
    id: 3,
    name: "FASE 3",
    subtitle: "Carga isotónica",
    weeks: "Sem. 4–8",
    color: "#eab308",
    icon: "⚡",
    description:
      "Rehabilitación real. El decline squat es el ejercicio estrella. Cada 2 días, no diario.",
    days: [
      {
        label: "Cada 2 días (L/M/V)",
        sessions: [
          {
            name: "🎯 Tendón — PRIORIDAD",
            exercises: [
              { name: "Decline squat", sets: "3 series", reps: "15 rep", note: "Baja LENTO 3–4s. Talones elevados" },
            ],
          },
          {
            name: "🦵 Pierna completa",
            exercises: [
              { name: "Sentadilla peso corporal", sets: "3 series", reps: "12 rep", note: "Controlada" },
              { name: "Zancada estática",         sets: "3 series", reps: "10 rep", note: "Baja lento" },
            ],
          },
        ],
      },
    ],
    warnings: ["❌ Nada de fútbol", "✅ Gym semana 7–8 con poco peso", "⚠️ Si duele más al día sig. → reduce carga"],
  },
  {
    id: 4,
    name: "FASE 4",
    subtitle: "Vuelta al gym",
    weeks: "Mes 2",
    color: "#22c55e",
    icon: "🏋️",
    description: "Cargas progresivas en gym cuando toleras bien la fase 3.",
    days: [
      {
        label: "3–4 días a la semana",
        sessions: [
          {
            name: "🎯 Tendón (Calentamiento)",
            exercises: [
              { name: "Decline squat", sets: "2 series", reps: "12 rep", note: "Siempre antes de pierna" },
            ],
          },
          {
            name: "🦵 Pierna en gym",
            exercises: [
              { name: "Sentadilla con barra", sets: "4 series", reps: "10–12", note: "Peso ligero progresivo" },
              { name: "Prensa de piernas",    sets: "3 series", reps: "12 rep", note: "Rango completo" },
            ],
          },
        ],
      },
    ],
    warnings: ["❌ Nada de fútbol todavía", "❌ Sin saltos ni pliometría", "✅ Progresa el peso cada semana"],
  },
  {
    id: 5,
    name: "FASE 5",
    subtitle: "Vuelta al fútbol",
    weeks: "Mes 3+",
    color: "#3b82f6",
    icon: "⚽",
    description: "Retorno gradual tras superar pruebas de fuerza sin dolor.",
    days: [
      {
        label: "Progresión gradual",
        sessions: [
          {
            name: "📈 Progresión",
            exercises: [
              { name: "Sem 1-2: Footing suave",    sets: "20 min", reps: "Sin sprint",         note: "Trote ligero" },
              { name: "Sem 3-4: Cambios ritmo",     sets: "25 min", reps: "—",                  note: "Aceleraciones cortas" },
              { name: "Sem 7+: Partido",            sets: "45 min", reps: "—",                  note: "No exijas al 100%" },
            ],
          },
        ],
      },
    ],
    warnings: ["✅ Mantén trabajo de tendón por siempre", "⚠️ Si duele → vuelve a Fase 3", "✅ Decline squat es prevención"],
  },
];

const ruleOfPain = [
  { level: "0–3/10",  color: "#22c55e", label: "Verde",  action: "Entrena normal"     },
  { level: "4/10",    color: "#eab308", label: "Límite", action: "No aumentes carga"  },
  { level: "5+/10",   color: "#ef4444", label: "Rojo",   action: "Para. Descansa"     },
  { level: "Día Sig.", color: "#7c3aed", label: "Clave",  action: "Baja volumen"       },
];

let activePhaseIndex = 0;
let expanded = {};

/* ─── RENDER ─── */
function render() {
  const phase = phases[activePhaseIndex];

  /* Nav */
  document.getElementById("phaseNav").innerHTML = phases.map((p, i) => `
    <button class="phase-btn ${i === activePhaseIndex ? "active" : ""}"
            onclick="setPhase(${i})"
            style="${i === activePhaseIndex
              ? `border-bottom: 2px solid ${p.color}; color: ${p.color};`
              : ""}">
      ${p.icon} ${p.name}
    </button>
  `).join("");

  /* Indicador en header */
  document.getElementById("headerPhase").textContent =
    `${phase.icon} ${phase.name} · ${phase.weeks}`;

  /* Contenido principal */
  let html = `
    <div class="phase-card" style="color: ${phase.color};">
      <div class="phase-header">
        <div>
          <span class="phase-title" style="color: ${phase.color}">${phase.name}</span>
          <span class="phase-subtitle">${phase.subtitle}</span>
        </div>
        <span class="week-badge" style="background: ${phase.color}18; color: ${phase.color}; border-color: ${phase.color}44;">
          ${phase.weeks}
        </span>
      </div>
      <p class="phase-desc">${phase.description}</p>
    </div>
  `;

  phase.days.forEach((day, di) => {
    html += `<div class="day-label">📅 ${day.label}</div>`;
    day.sessions.forEach((session, si) => {
      const key = `${di}-${si}`;
      const isOpen = expanded[key] !== false;
      html += `
        <div class="session-box">
          <button class="session-header" onclick="toggleSession('${key}')">
            <span>${session.name}</span>
            <span class="session-toggle">${isOpen ? "−" : "+"}</span>
          </button>
          <div class="${isOpen ? "" : "hidden"}">
            ${session.exercises.map((ex, ei) => `
              <div class="exercise-row" style="animation-delay: ${ei * 50}ms">
                <div>
                  <div class="ex-name">${ex.name}</div>
                  <div class="ex-note">${ex.note}</div>
                </div>
                <div class="badge-sets" style="color: ${phase.color}">${ex.sets}</div>
                <div class="badge-reps">${ex.reps}</div>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    });
  });

  html += `
    <div class="info-block" style="margin-top: 8px; border-left: 2px solid ${phase.color}44">
      <div class="info-title">Reglas de esta fase</div>
      ${phase.warnings.map(w => `<div class="warning-item">${w}</div>`).join("")}
    </div>
  `;

  document.getElementById("phaseContent").innerHTML = html;
}

function setPhase(i) {
  activePhaseIndex = i;
  expanded = {};
  render();
}

function toggleSession(key) {
  expanded[key] = expanded[key] === false ? true : false;
  render();
}

/* ─── SECCIONES ESTÁTICAS ─── */
document.getElementById("painRules").innerHTML = ruleOfPain.map(r => `
  <div class="pain-row">
    <span style="color: ${r.color}; font-weight: bold">${r.level}</span>
    <span style="background: ${r.color}1a; color: ${r.color}; border-radius: 3px; padding: 3px 8px; text-align: center; font-size: 10px; letter-spacing: 1px;">${r.label}</span>
    <span style="color: #aaa; font-size: 12px">${r.action}</span>
  </div>
`).join("");

const habitsData = [
  ["💧", "Hidratación",  "Los tendones necesitan agua"],
  ["🥩", "Proteína",     "Necesaria para reparar colágeno"],
  ["😴", "Dormir",       "El tendón se repara de noche"],
  ["🧊", "Hielo",        "Post-actividad si hay molestia"],
];

document.getElementById("habits").innerHTML = habitsData.map(h => `
  <div class="habit-row">
    <span style="font-size: 18px">${h[0]}</span>
    <div>
      <div style="font-size: 12px; color: #e5e0d8; font-family: var(--font-mono); letter-spacing: 1px; text-transform: uppercase;">${h[1]}</div>
      <div style="font-size: 11px; color: #555; font-style: italic; font-family: var(--font-serif); margin-top: 2px">${h[2]}</div>
    </div>
  </div>
`).join("");

render();