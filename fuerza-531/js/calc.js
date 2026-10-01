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
