const START_DATE = new Date('2026-06-15');

function getCurrentWeek() {
  const diffMs = Date.now() - START_DATE.getTime();
  return Math.max(1, Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1);
}

function getPhaseForWeek(week) {
  if (week <= 1) return 0;
  if (week <= 3) return 1;
  if (week <= 7) return 2;
  if (week <= 12) return 3;
  return 4;
}

function getExerciseState(weekRange) {
  if (!weekRange) return 'active';
  const w = getCurrentWeek();
  if (w < weekRange[0]) return 'upcoming';
  if (weekRange[1] !== null && w > weekRange[1]) return 'past';
  return 'active';
}

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
                sets: "2–3×/día",
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
      "El tendón empieza a trabajar. Isométricos para aliviar dolor y estimular el tendón. Progresión gradual semana a semana.",
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
                weekRange: [2, 3],
              },
              {
                name: "Isométrico en extensión",
                sets: "3 series",
                reps: "30 seg",
                note: "Pierna casi recta, aprieta cuádriceps. Ángulo distinto al wall sit",
                weekRange: [2, 3],
              },
              {
                name: "Bajada lenta en escalón",
                sets: "3 series",
                reps: "10 rep",
                note: "Baja en 3–4 seg. Puente hacia Fase 3. Dolor máx 4/10",
                weekRange: [3, 4],
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
      "⚠️ Avanza al siguiente ejercicio solo si el anterior no genera dolor al día siguiente",
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
      "Rehabilitación real. La sentadilla en declive es el ejercicio estrella. Cada 2 días, no diario.",
    days: [
      {
        label: "Cada 2 días (L/M/V)",
        sessions: [
          {
            name: "🔥 Calentamiento de tendón",
            exercises: [
              {
                name: "Isométrico en pared (wall sit)",
                sets: "2 series",
                reps: "60 seg",
                note: "Antes de todo. Despierta el tendón. Dolor máx 3/10",
              },
            ],
          },
          {
            name: "🎯 Tendón — PRIORIDAD",
            exercises: [
              {
                name: "Sentadilla en declive",
                sets: "3 series",
                reps: "15 rep",
                note: "Baja LENTO 3–4s. Talones elevados. Solo peso corporal",
                weekRange: [4, 5],
              },
              {
                name: "Sentadilla en declive con mochila",
                sets: "3 series",
                reps: "15 rep",
                note: "Añade 5–10 kg progresivo",
                weekRange: [6, 7],
              },
              {
                name: "Sentadilla en declive con más carga",
                sets: "4 series",
                reps: "15 rep",
                note: "Aumenta peso si sem 6–7 sin dolor al día siguiente",
                weekRange: [7, 8],
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
                note: "Controlada, sin apuro",
              },
              {
                name: "Zancada estática",
                sets: "3 series",
                reps: "10 rep",
                note: "Pierna afectada adelante. Baja lento 3 seg",
              },
            ],
          },
        ],
      },
    ],
    warnings: [
      "❌ Nada de fútbol",
      "✅ Gym semana 7–8 con poco peso",
      "⚠️ Si duele más al día siguiente → reduce carga",
      "⚠️ Avanza de semana solo si el dolor al día siguiente es menor a 3/10",
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
            name: "🔥 Calentamiento de tendón",
            exercises: [
              {
                name: "Isométrico en pared (wall sit)",
                sets: "2 series",
                reps: "60 seg",
                note: "Siempre primero. Despierta el tendón antes de cargar",
              },
              {
                name: "Sentadilla en declive",
                sets: "2 series",
                reps: "12 rep",
                note: "Baja lento 3–4s. Antes de cualquier ejercicio de pierna",
              },
            ],
          },
          {
            name: "🦵 Pierna en gym",
            exercises: [
              {
                name: "Sentadilla con barra",
                sets: "4 series",
                reps: "10–12 rep",
                note: "Semana 1–2: barra sola. Sube peso solo si cero dolor al día siguiente",
              },
              {
                name: "Prensa de piernas",
                sets: "3 series",
                reps: "12 rep",
                note: "Rango completo. Buena alternativa si la sentadilla molesta",
              },
              {
                name: "Curl de isquiotibiales",
                sets: "3 series",
                reps: "12 rep",
                note: "Equilibra la carga entre cuádriceps e isquios",
              },
            ],
          },
        ],
      },
    ],
    warnings: [
      "❌ Nada de fútbol todavía",
      "❌ Sin saltos ni pliometría",
      "✅ Progresa el peso cada semana si no hay dolor",
      "⚠️ Si duele al día siguiente → mantén el mismo peso una semana más",
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
            name: "🔥 Mantenimiento de tendón",
            exercises: [
              {
                name: "Sentadilla en declive",
                sets: "3 series",
                reps: "15 rep",
                note: "2 veces por semana para siempre. Es prevención, no solo rehab",
              },
            ],
          },
          {
            name: "📈 Progresión de vuelta al campo",
            exercises: [
              {
                name: "Trote suave",
                sets: "20 min",
                reps: "Sin sprint",
                note: "Ritmo cómodo. Para si duele más de 3/10",
                weekRange: [13, 14],
              },
              {
                name: "Cambios de ritmo",
                sets: "25 min",
                reps: "—",
                note: "Aceleraciones cortas. Sin frenadas bruscas",
                weekRange: [15, 16],
              },
              {
                name: "Pases y técnica",
                sets: "30 min",
                reps: "—",
                note: "Sin contacto ni disparo fuerte todavía",
                weekRange: [17, 18],
              },
              {
                name: "Partido controlado",
                sets: "45 min",
                reps: "—",
                note: "No al 100%. Avisa al entrenador de tu situación",
                weekRange: [19, null],
              },
            ],
          },
        ],
      },
    ],
    warnings: [
      "✅ Mantén sentadilla en declive 2x semana para siempre",
      "⚠️ Si duele durante o después → vuelve a Fase 3",
      "❌ Sin disparos fuertes hasta semana 5+",
      "✅ El tendón ya rehabilitado es más fuerte que antes si lo mantienes",
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

const habitsData = [
  ["💧", "Hidratación", "Los tendones necesitan agua"],
  ["🥩", "Proteína", "Necesaria para reparar colágeno"],
  ["😴", "Dormir", "El tendón se repara de noche"],
  ["🧊", "Hielo", "Post-actividad si hay molestia"],
];
