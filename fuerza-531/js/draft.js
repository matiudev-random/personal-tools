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
