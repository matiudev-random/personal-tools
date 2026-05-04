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
              {
                name: "Hielo en rodilla",
                sets: "2–3 veces/día",
                reps: "15–20 min",
                note: "Especialmente tras caminar mucho",
              },
              {
                name: "Pierna elevada al sentarte",
                sets: "Siempre",
                reps: "—",
                note: "Reduce inflamación pasivamente",
              },
            ],
          },
          {
            name: "Estiramientos suaves",
            exercises: [
              {
                name: "Cuádriceps de pie",
                sets: "3 series",
                reps: "30 seg",
                note: "Sin jalar fuerte",
              },
              {
                name: "Isquiotibiales sentado",
                sets: "3 series",
                reps: "30 seg",
                note: "Espalda recta",
              },
              {
                name: "Pantorrilla contra pared",
                sets: "3 series",
                reps: "30 seg",
                note: "Pie plano, rodilla recta",
              },
            ],
          },
        ],
      },
    ],
    warnings: [
      "❌ Nada de fútbol",
      "❌ Nada de sentadillas ni saltos",
      "❌ Evitar estar de pie estático mucho tiempo",
    ],
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
              {
                name: "Isométrico en pared (wall sit)",
                sets: "5 series",
                reps: "45–60 seg",
                note: "Rodillas ~100–110°. Dolor máx 4/10",
              },
            ],
          },
          {
            name: "🍑 Cadera y Glúteos",
            exercises: [
              {
                name: "Puente de glúteos",
                sets: "3 series",
                reps: "15 rep",
                note: "Eleva caderas",
              },
              {
                name: "Abducción lateral",
                sets: "3 series",
                reps: "15 rep",
                note: "Sube pierna recta",
              },
            ],
          },
          {
            name: "🧱 Core",
            exercises: [
              {
                name: "Plancha frontal",
                sets: "3 series",
                reps: "30 seg",
                note: "Cuerpo recto",
              },
            ],
          },
        ],
      },
    ],
    warnings: [
      "❌ Nada de fútbol",
      "❌ Nada de sentadillas con carga",
      "✅ Caminar normal con moderación",
    ],
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
              {
                name: "Decline squat",
                sets: "3 series",
                reps: "15 rep",
                note: "Baja LENTO 3–4s. Talones elevados",
              },
            ],
          },
          {
            name: "🦵 Pierna completa",
            exercises: [
              {
                name: "Sentadilla peso corporal",
                sets: "3 series",
                reps: "12 rep",
                note: "Controlada",
              },
              {
                name: "Zancada estática",
                sets: "3 series",
                reps: "10 rep",
                note: "Baja lento",
              },
            ],
          },
        ],
      },
    ],
    warnings: [
      "❌ Nada de fútbol",
      "✅ Gym semana 7–8 con poco peso",
      "⚠️ Si duele más al día sig. → reduce carga",
    ],
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
              {
                name: "Decline squat",
                sets: "2 series",
                reps: "12 rep",
                note: "Siempre antes de pierna",
              },
            ],
          },
          {
            name: "🦵 Pierna en gym",
            exercises: [
              {
                name: "Sentadilla con barra",
                sets: "4 series",
                reps: "10–12",
                note: "Peso ligero progresivo",
              },
              {
                name: "Prensa de piernas",
                sets: "3 series",
                reps: "12 rep",
                note: "Rango completo",
              },
            ],
          },
        ],
      },
    ],
    warnings: [
      "❌ Nada de fútbol todavía",
      "❌ Sin saltos ni pliometría",
      "✅ Progresa el peso cada semana",
    ],
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
              {
                name: "Sem 1-2: Footing suave",
                sets: "20 min",
                reps: "Sin sprint",
                note: "Trote ligero",
              },
              {
                name: "Sem 3-4: Cambios ritmo",
                sets: "25 min",
                reps: "—",
                note: "Aceleraciones cortas",
              },
              {
                name: "Sem 7+: Partido",
                sets: "45 min",
                reps: "—",
                note: "No exijas al 100%",
              },
            ],
          },
        ],
      },
    ],
    warnings: [
      "✅ Mantén trabajo de tendón por siempre",
      "⚠️ Si duele → vuelve a Fase 3",
      "✅ Decline squat es prevención",
    ],
  },
];

const ruleOfPain = [
  {
    level: "0–3/10",
    color: "#22c55e",
    label: "Verde",
    action: "Entrena normal",
  },
  {
    level: "4/10",
    color: "#eab308",
    label: "Límite",
    action: "No aumentes carga",
  },
  { level: "5+/10", color: "#ef4444", label: "Rojo", action: "Para. Descansa" },
  {
    level: "Día Sig.",
    color: "#7c3aed",
    label: "Clave",
    action: "Baja volumen",
  },
];

let activePhaseIndex = 0;
let expanded = {};

function render() {
  // Render Nav
  const nav = document.getElementById("phaseNav");
  nav.innerHTML = phases
    .map(
      (p, i) => `
                <button class="phase-btn ${i === activePhaseIndex ? "active" : ""}" 
                        onclick="setPhase(${i})" 
                        style="${i === activePhaseIndex ? "background:" + p.color : ""}">
                    ${p.icon} ${p.name}
                </button>
            `,
    )
    .join("");

  // Render Content
  const phase = phases[activePhaseIndex];
  const content = document.getElementById("phaseContent");

  let html = `
                <div class="phase-card" style="border-left: 4px solid ${phase.color}; border-color: ${phase.color}44">
                    <div class="phase-header">
                        <div>
                            <span class="phase-title" style="color: ${phase.color}">${phase.name}</span>
                            <span class="phase-subtitle">${phase.subtitle}</span>
                        </div>
                        <span class="week-badge" style="background: ${phase.color}22; color: ${phase.color}">${phase.weeks}</span>
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
                                ${session.name} <span>${isOpen ? "−" : "+"}</span>
                            </button>
                            <div class="${isOpen ? "" : "hidden"}">
                                ${session.exercises
                                  .map(
                                    (ex) => `
                                    <div class="exercise-row">
                                        <div>
                                            <div class="ex-name">${ex.name}</div>
                                            <div class="ex-note">${ex.note}</div>
                                        </div>
                                        <div class="badge-sets" style="color: ${phase.color}">${ex.sets}</div>
                                        <div class="badge-reps">${ex.reps}</div>
                                    </div>
                                `,
                                  )
                                  .join("")}
                            </div>
                        </div>
                    `;
    });
  });

  html += `
                <div class="info-block" style="margin-top: 4px">
                    <div class="info-title">Reglas de esta fase</div>
                    ${phase.warnings.map((w) => `<div style="font-size: 13px; color: #bbb; margin-bottom: 5px">${w}</div>`).join("")}
                </div>
            `;

  content.innerHTML = html;
}

function setPhase(i) {
  activePhaseIndex = i;
  expanded = {}; // Reset toggles when switching phase
  render();
}

function toggleSession(key) {
  expanded[key] = expanded[key] === false ? true : false;
  render();
}

// Static sections
document.getElementById("painRules").innerHTML = ruleOfPain
  .map(
    (r) => `
            <div class="pain-row">
                <span style="color: ${r.color}; font-weight: bold">${r.level}</span>
                <span style="background: ${r.color}22; color: ${r.color}; border-radius: 4px; padding: 2px 6px; text-align: center; font-size: 11px">${r.label}</span>
                <span style="color: #aaa">${r.action}</span>
            </div>
        `,
  )
  .join("");

const habitsData = [
  ["💧", "Hidratación", "Los tendones necesitan agua"],
  ["🥩", "Proteína", "Necesaria para reparar colágeno"],
  ["😴", "Dormir", "El tendón se repara de noche"],
  ["🧊", "Hielo", "Post-actividad si hay molestia"],
];

document.getElementById("habits").innerHTML = habitsData
  .map(
    (h) => `
            <div class="habit-row">
                <span>${h[0]}</span>
                <div>
                    <div style="font-size: 13px; color: #e5e0d8; font-weight: bold">${h[1]}</div>
                    <div style="font-size: 12px; color: #666; font-style: italic">${h[2]}</div>
                </div>
            </div>
        `,
  )
  .join("");

render();
