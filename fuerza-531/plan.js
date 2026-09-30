/* ─────────────────────────────────────────
   PLAN — Upper/Lower 4 días con 5/3/1
   Edita aquí ejercicios, accesorios o reglas.
   Los TMs y las sesiones viven en PocketBase.
───────────────────────────────────────── */

// Tu gym
const GYM = {
  bar: 10,                                   // barra olímpica de 10 kg
  plates: [25, 20, 15, 10, 5, 2.5, 1.25],    // discos disponibles (por lado)
  dbStep: 2.5,                               // mancuernas de 2,5 en 2,5
};

// Levantamientos principales (llevan TM)
const LIFTS = {
  banca:      { name: "Press Banca",                short: "Banca",      type: "barbell",  inc: 2.5, color: "#E0503F" },
  sentadilla: { name: "Sentadilla",                 short: "Sentadilla", type: "barbell",  inc: 5,   color: "#4A8FD0" },
  militar:    { name: "Press Militar (mancuernas)", short: "Militar",    type: "dumbbell", inc: 2.5, color: "#C99A22" },
};

// TMs de partida (se usan solo si todavía no hay ninguno guardado)
const DEFAULT_TMS = { banca: 90, sentadilla: 80, militar: 55 };

// Semanas del ciclo 5/3/1 (porcentajes del TM y reps objetivo)
const WEEKS = {
  1: { pct: [0.65, 0.75, 0.85], reps: [5, 5, 5], plus: true,  label: "5/5/5+" },
  2: { pct: [0.70, 0.80, 0.90], reps: [3, 3, 3], plus: true,  label: "3/3/3+" },
  3: { pct: [0.75, 0.85, 0.95], reps: [5, 3, 1], plus: true,  label: "5/3/1+" },
  4: { pct: [0.40, 0.50, 0.60], reps: [5, 5, 5], plus: false, label: "Deload", deload: true },
};

// Calentamiento específico (% del TM)
const WARMUP = [
  { pct: 0,    reps: "8-10" },   // barra sola / mancuernas livianas
  { pct: 0.40, reps: "5" },
  { pct: 0.60, reps: "3" },
  { pct: 0.75, reps: "1-2" },
];

/*
  Accesorios por día
  unit:  "lastre"   → kg extra sobre el peso corporal (0 = sin peso)
         "total"    → kg totales
         "mano"     → kg por mancuerna
  medida: "reps" (por defecto) o "seg"
*/
const DAYS = {
  1: {
    name: "Upper pesado", color: "#C8342A", lift: "banca",
    accessories: [
      { id: "dominadas", name: "Dominadas agarre prono", sets: 5, target: "2-3+", unit: "lastre", kg: 0, reps: 3,
        note: "Prioridad. 2-3 es el piso, no el techo. Descanso 2 min." },
      { id: "fondos", name: "Fondos en paralelas", sets: 3, target: "8-10", unit: "lastre", kg: 25, reps: 8,
        note: "Ajusta el lastre a RPE 7-8. Descanso 90 seg." },
    ],
  },
  2: {
    name: "Lower pesado", color: "#2F72AD", lift: "sentadilla",
    accessories: [
      { id: "zancadas", name: "Zancadas con mancuernas", sets: 3, target: "10 por pierna", unit: "total", kg: 25, reps: 10,
        note: "RPE 7. Sube 2-2,5 kg por mano tras 2 sesiones fáciles. Descanso 90 seg." },
      { id: "hip-thrust", name: "Hip Thrust", sets: 4, target: "8-10", unit: "total", kg: 20, reps: 8,
        note: "RPE 7-8, glúteo y cadena posterior. Descanso 2 min." },
    ],
  },
  3: {
    name: "Upper liviano", color: "#D6A92C", lift: "militar",
    accessories: [
      { id: "remo-t", name: "Remo en T", sets: 4, target: "8", unit: "total", kg: 40, reps: 8,
        note: "RPE 7-8. Descanso 2 min." },
      { id: "laterales", name: "Elevaciones laterales", sets: 3, target: "12", unit: "mano", kg: 10, reps: 12,
        note: "Superserie con curl. ~8-10 kg para llegar al rango." },
      { id: "curl", name: "Curl bíceps", sets: 3, target: "10", unit: "mano", kg: 15, reps: 10,
        note: "Superserie con laterales. Descanso 60 seg al final de ambos." },
    ],
  },
  4: {
    name: "Lower liviano", color: "#3F8F5C", lift: null,
    accessories: [
      { id: "prensa", name: "Prensa", sets: 4, target: "8", unit: "total", kg: null, reps: 8,
        note: "RPE 7, calibra el peso en la primera serie. Descanso 2 min." },
      { id: "rdl", name: "RDL rumano liviano", sets: 3, target: "10", unit: "total", kg: null, reps: 10,
        note: "RPE 6-7. Técnica y zona lumbar controlada. Descanso 90 seg." },
      { id: "dead-hang", name: "Dead hang", sets: 3, target: "20-30 seg", unit: "lastre", kg: 0, reps: 25, medida: "seg",
        note: "Peso corporal. Descanso 60 seg." },
    ],
  },
};

const UNIT_LABEL = { lastre: "lastre", total: "kg", mano: "kg/mano" };

/*
  Historial previo (lo que reportaste en el chat de entrenamiento).
  Las FECHAS SON APROXIMADAS: en el chat no quedaron registradas.
  reps: null = no quedó anotado.
*/
const HISTORIAL_PREVIO = [
  { fecha: "2026-08-24", dia: 1, ciclo: 1, semana: 1, tm: 90,
    notas: "Importado del chat · fecha aproximada · peso elegido por ti, sobre la progresión calculada",
    series: [
      { ej: "banca", tipo: "principal", peso: 90, reps: 5, obj: "5" },
      { ej: "banca", tipo: "principal", peso: 90, reps: 5, obj: "5" },
      { ej: "banca", tipo: "principal", peso: 90, reps: 4, obj: "5+", amrap: true, rpe: 10 },
      ...[2, 4, 4, 4, 2].map(r => ({ ej: "dominadas", tipo: "accesorio", peso: 0, reps: r })),
    ] },
  { fecha: "2026-08-25", dia: 2, ciclo: 1, semana: 1, tm: 72.5,
    notas: "Importado del chat · fecha aproximada",
    series: [
      { ej: "sentadilla", tipo: "principal", peso: 50, reps: null, obj: "5" },
      { ej: "sentadilla", tipo: "principal", peso: 55, reps: null, obj: "5" },
      { ej: "sentadilla", tipo: "principal", peso: 60, reps: 8, obj: "5+", amrap: true, rpe: 8 },
    ] },
  { fecha: "2026-08-27", dia: 3, ciclo: 1, semana: 1, tm: 55,
    notas: "Importado del chat · fecha aproximada · test de fuerza para fijar el TM",
    series: [
      { ej: "militar", tipo: "principal", peso: 45, reps: 5, obj: "5" },
      { ej: "militar", tipo: "principal", peso: 45, reps: 5, obj: "5" },
      { ej: "militar", tipo: "principal", peso: 45, reps: 10, obj: "5+", amrap: true, rpe: 9.5 },
      ...[7, 8, 5, 6].map(r => ({ ej: "remo-t", tipo: "accesorio", peso: 40, reps: r })),
      ...[7, 7, 5].map(r => ({ ej: "laterales", tipo: "accesorio", peso: 15, reps: r })),
      ...[8, 5].map(r => ({ ej: "curl", tipo: "accesorio", peso: 20, reps: r })),
    ] },
  { fecha: "2026-08-31", dia: 1, ciclo: 1, semana: 1, tm: 90,
    notas: "Importado del chat · fecha aproximada · repetición con TM ya confirmado",
    series: [
      { ej: "banca", tipo: "principal", peso: 90, reps: 4, obj: "5" },
      { ej: "banca", tipo: "principal", peso: 90, reps: 5, obj: "5" },
      { ej: "banca", tipo: "principal", peso: 90, reps: 5, obj: "5+", amrap: true, rpe: 9.5 },
      ...[4, 4, 4, 3, 2].map(r => ({ ej: "dominadas", tipo: "accesorio", peso: 0, reps: r })),
      ...[8, 8, 8].map(r => ({ ej: "fondos", tipo: "accesorio", peso: 25, reps: r })),
    ] },
  { fecha: "2026-09-01", dia: 2, ciclo: 1, semana: 2, tm: 72.5,
    notas: "Importado del chat · fecha aproximada · con esto el TM subió a 80 kg",
    series: [
      { ej: "sentadilla", tipo: "principal", peso: 55, reps: null, obj: "3" },
      { ej: "sentadilla", tipo: "principal", peso: 60, reps: null, obj: "3" },
      { ej: "sentadilla", tipo: "principal", peso: 65, reps: 9, obj: "3+", amrap: true, rpe: 8 },
      ...[8, 8].map(r => ({ ej: "hip-thrust", tipo: "accesorio", peso: 20, reps: r })),
      ...[10, 10, 10].map(r => ({ ej: "zancadas", tipo: "accesorio", peso: 25, reps: r })),
    ] },
];
