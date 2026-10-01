/* ─────────────────────────────────────────
   GUARDAR SESIÓN
───────────────────────────────────────── */
function buildSession(day, d) {
  const plan = DAYS[day];
  const series = [];
  if (plan.lift) {
    const tgt = targets(plan.lift, d.tm, d.semana);
    tgt.forEach((t, i) => {
      const m = d.main[i];
      if (!m || m.reps == null) return;
      const s = { ej: plan.lift, tipo: "principal", peso: m.peso, reps: m.reps, obj: t.obj };
      if (t.amrap) { s.amrap = true; s.rpe = m.rpe; }
      series.push(s);
    });
  }
  for (const a of plan.accessories) {
    for (const s of d.acc[a.id] || []) {
      if (s.reps == null || s.reps === 0) continue;
      const row = { ej: a.id, tipo: "accesorio", peso: s.peso, reps: s.reps };
      if (a.medida) row.medida = a.medida;
      series.push(row);
    }
  }
  return {
    id: newId(),
    fecha: toPbDate(d.fecha || today()),
    dia: day,
    ciclo: d.ciclo,
    semana: d.semana,
    tm: plan.lift ? d.tm : null,
    notas: (d.notas || "").trim(),
    series,
    created: new Date().toISOString(),
  };
}

$("save").addEventListener("click", () => {
  const d = draftFor(ui.day);
  const ses = buildSession(ui.day, d);
  if (!ses.series.length) { toast("Anota al menos una serie antes de guardar"); return; }

  const prs = sessionPRs(ses);
  sesiones.push(ses);
  queue({ op: "create", col: COL_SES, data: stripLocal(ses) });
  delete drafts[ui.day];
  saveDrafts();
  saveCache();

  ui.day = suggestedDay();
  writeJSON(UI_KEY, ui);
  renderAll();
  showSummary(ses, prs);
});

function stripLocal(rec) {
  const { created, updated, collectionId, collectionName, ...rest } = rec;
  return rest;
}

function sessionPRs(ses) {
  const out = [];
  const prev = sesiones;
  for (const s of ses.series.filter(x => x.tipo === "principal" && x.reps)) {
    const older = prev.flatMap(p => (p.series || []).filter(x => x.ej === s.ej && x.reps));
    if (!older.length) continue;
    const bestE = Math.max(...older.map(x => e1rm(x.peso, x.reps)));
    const heavier = older.filter(x => x.peso >= s.peso);
    const bestReps = heavier.length ? Math.max(...heavier.map(x => x.reps)) : 0;
    if (e1rm(s.peso, s.reps) > bestE + 0.01) out.push(`🏆 ${LIFTS[s.ej].short}: nuevo 1RM estimado máximo (${fmt(Math.round(e1rm(s.peso, s.reps) * 2) / 2)} kg)`);
    else if (s.reps > bestReps) out.push(`🏆 ${LIFTS[s.ej].short}: récord de reps con ${fmt(s.peso)} kg (${s.reps})`);
  }
  return [...new Set(out)];
}

/* Texto para pegarle a Claude */
function summaryText(ses) {
  const plan = DAYS[ses.dia];
  const lines = [`Sesión D${ses.dia} · ${plan.name} · Ciclo ${ses.ciclo} Semana ${ses.semana}${WEEKS[ses.semana]?.deload ? " (deload)" : ""} · ${ymdOf(ses.fecha)}`];
  const groups = {};
  for (const s of ses.series || []) (groups[s.ej] ||= []).push(s);
  for (const [ej, sets] of Object.entries(groups)) {
    if (LIFTS[ej]) {
      const L = LIFTS[ej];
      const parts = sets.map(s => {
        let t = `${fmt(s.peso)}×${s.reps ?? "?"}`;
        if (s.amrap) t += ` (AMRAP${s.obj ? " " + s.obj : ""}${s.rpe ? `, RPE ${fmt(s.rpe)}` : ""})`;
        return t;
      });
      const am = sets.find(s => s.amrap && s.reps);
      const est = am ? ` → 1RM est. ${fmt(Math.round(e1rm(am.peso, am.reps) * 2) / 2)} kg` : "";
      lines.push(`${L.name}${ses.tm ? ` (TM ${fmt(ses.tm)}${L.type === "dumbbell" ? " total" : ""})` : ""}: ${parts.join(", ")}${est}`);
    } else {
      const a = accPlan(ej);
      const unit = a?.unit || "total";
      const med = sets[0].medida === "seg" ? " seg" : "";
      const allSame = sets.every(s => s.peso === sets[0].peso);
      let body;
      if (allSame) {
        const w = sets[0].peso;
        const load = w == null ? "" : unit === "lastre" ? (w ? `+${fmt(w)} kg × ` : "sin lastre · ") : unit === "mano" ? `${fmt(w)} kg/mano × ` : `${fmt(w)} kg × `;
        body = `${load}${sets.map(s => s.reps ?? "?").join(", ")}${med}`;
      } else {
        body = sets.map(s => `${s.peso == null ? "" : fmt(s.peso) + (unit === "mano" ? "/mano" : "") + "×"}${s.reps ?? "?"}`).join(", ") + med;
      }
      lines.push(`${exName(ej)}: ${body}`);
    }
  }
  if (ses.notas) lines.push(`Notas: ${ses.notas}`);
  return lines.join("\n");
}

function showSummary(ses, prs) {
  $("summary-title").textContent = `Sesión D${ses.dia} guardada`;
  $("summary-prs").innerHTML = prs.map(p => `<p class="pr-line">${esc(p)}</p>`).join("");
  $("summary-text").textContent = summaryText(ses);
  $("summary-dialog").showModal();
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); }
  catch (e) {
    const ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (e2) {}
    ta.remove();
  }
  toast("Copiado. Pégalo en tu chat con Claude");
}

$("copy-summary").addEventListener("click", () => copyText($("summary-text").textContent));
$("close-summary").addEventListener("click", () => $("summary-dialog").close());
