/* ─────────────────────────────────────────
   RENDER — TMs y revisión de ciclo
───────────────────────────────────────── */
const LIFT_DAY = { banca: 1, sentadilla: 2, militar: 3 };

// Lee las series AMRAP hechas con el TM actual y aplica la regla de tu coach.
// Compara contra el 1RM que implicaba lo pedido, así sirve aunque hayas usado otro peso.
function cycleReview(lift) {
  const day = LIFT_DAY[lift];
  const own = sesiones.filter(s => s.dia === day);
  if (!own.length) return null;
  const tm = currentTM(lift);
  const ciclo = Math.max(...own.map(s => s.ciclo || 1));
  const rows = own.filter(s => s.ciclo === ciclo && s.semana <= 3 && Number(s.tm) === tm)
    .sort((a, b) => a.semana - b.semana || ymdOf(a.fecha).localeCompare(ymdOf(b.fecha)))
    .map(s => {
      const am = (s.series || []).find(x => x.ej === lift && x.amrap && x.reps);
      if (!am) return null;
      const w = WEEKS[s.semana];
      const target = roundLoad(tm * w.pct[2], lift);
      const obj = w.reps[2];
      return { semana: s.semana, peso: am.peso, reps: am.reps, rpe: am.rpe, target, obj,
               est: e1rm(am.peso, am.reps), need: e1rm(target, obj), good: e1rm(target, obj + 2) };
    }).filter(Boolean);
  if (!rows.length) return { ciclo, rows, verdict: null };

  const L = LIFTS[lift];
  const bestE = Math.max(...rows.map(r => r.est));
  let verdict, suggest, why;
  if (rows.some(r => r.est < r.need - 0.01)) {
    verdict = "bajar";
    suggest = Math.floor(bestE * 0.9 / 2.5) * 2.5;
    if (suggest >= tm) suggest = tm - L.inc;
    why = "Quedaste bajo lo pedido en alguna AMRAP: reset al ~90% de tu mejor 1RM estimado.";
  } else if (rows.every(r => r.est >= r.good - 0.01 || (r.rpe && r.rpe <= 8))) {
    verdict = "subir";
    suggest = tm + L.inc;
    why = `Te sobraron reps en las AMRAP: sube ${fmt(L.inc)} kg.`;
  } else {
    verdict = "mantener";
    suggest = tm;
    why = "Cumpliste justo y con esfuerzo alto: repite el TM antes de subir.";
  }
  const complete = rows.some(r => r.semana === 3);
  return { ciclo, rows, verdict, suggest, why, complete };
}

function renderTMs() {
  $("tm-cards").innerHTML = Object.entries(LIFTS).map(([id, L]) => {
    const tm = currentTM(id);
    const hist = tms.filter(t => t.ejercicio === id).sort(byDesdeDesc);
    const rev = cycleReview(id);
    let review = "";
    if (rev && rev.rows.length) {
      review = `<div class="review">
        <p class="review-title">Ciclo ${rev.ciclo} ${rev.complete ? "· listo para revisar" : "· en curso"}</p>
        <table>${rev.rows.map(r => `<tr><td>S${r.semana}</td><td class="mono">${fmt(r.peso)} × ${r.reps}</td><td class="mono dim">pedía ${fmt(r.target)}×${r.obj}+</td><td class="mono dim">${r.rpe ? "RPE " + fmt(r.rpe) : ""}</td></tr>`).join("")}</table>
        <p class="verdict v-${rev.verdict}"><b>${rev.verdict === "subir" ? "▲ Subir" : rev.verdict === "bajar" ? "▼ Bajar" : "■ Mantener"}</b> ${esc(rev.why)}</p>
        ${rev.suggest === tm ? "" : rev.complete
          ? `<button class="ghost-btn" data-apply="${id}" data-tm="${rev.suggest}">Aplicar TM ${fmt(rev.suggest)} kg</button>`
          : `<p class="hint left">Vas bien encaminado a ${fmt(rev.suggest)} kg. Podrás aplicarlo al terminar la S3.</p>`}
      </div>`;
    }
    return `<div class="card tm-card" style="--accent:${L.color}">
      <div class="tm-top">
        <div><p class="lift-name">${esc(L.short)}</p><p class="lift-tm">${hist.length ? `desde ${prettyDate(ymdOf(hist[0].desde))}` : "valor inicial del plan"}</p></div>
        <div class="tm-big"><b>${fmt(tm)}</b><span>kg${L.type === "dumbbell" ? " total" : ""}</span></div>
      </div>
      ${review}
      <form class="tm-form" data-lift="${id}">
        <input type="number" inputmode="decimal" step="2.5" name="tm" placeholder="Nuevo TM" required>
        <button class="ghost-btn" type="submit">Guardar TM</button>
      </form>
      ${hist.length > 1 ? `<details class="tm-hist"><summary>Historial de TMs</summary>${hist.map(t => `<p class="mono">${prettyDate(ymdOf(t.desde))} · ${fmt(t.tm)} kg${t.nota ? ` <span class="dim">· ${esc(t.nota)}</span>` : ""}</p>`).join("")}</details>` : ""}
    </div>`;
  }).join("") + `<p class="hint">La sugerencia sigue las reglas de tu coach. Si dudas, pega el resumen en el chat antes de aplicarla.</p>`;

  $("import-box").innerHTML = sesiones.length ? "" : `<div class="card">
    <h3>Historial previo</h3>
    <p class="acc-note">Carga las ${HISTORIAL_PREVIO.length} sesiones que reportaste en el chat (D1, D2 y D3 del primer ciclo). Las fechas son aproximadas.</p>
    <button class="ghost-btn" id="import-hist">Importar historial</button>
  </div>`;
}

function setTM(lift, value, nota) {
  const rec = { id: newId(), ejercicio: lift, tm: value, desde: toPbDate(today()), nota: nota || "", created: new Date().toISOString() };
  tms.push(rec);
  queue({ op: "create", col: COL_TMS, data: stripLocal(rec) });
  // los borradores de ese ejercicio pasan a usar el TM nuevo (se conservan accesorios y notas)
  for (const k of Object.keys(drafts)) {
    const d = drafts[k];
    if (DAYS[k].lift !== lift) continue;
    const acc = d.acc;
    drafts[k] = freshDraft(Number(k), { ciclo: d.ciclo, semana: d.semana, fecha: d.fecha, notas: d.notas });
    drafts[k].acc = acc;
    drafts[k].touched = d.touched;
  }
  saveDrafts(); saveCache(); renderAll();
  toast(`TM de ${LIFTS[lift].short}: ${fmt(value)} kg`);
}

$("tm-cards").addEventListener("submit", e => {
  e.preventDefault();
  const f = e.target.closest(".tm-form");
  const v = num(new FormData(f).get("tm"));
  if (!v || v <= 0) return;
  setTM(f.dataset.lift, v, "manual");
});

$("tm-cards").addEventListener("click", e => {
  const b = e.target.closest("[data-apply]");
  if (!b) return;
  const rev = cycleReview(b.dataset.apply);
  setTM(b.dataset.apply, Number(b.dataset.tm), `revisión ciclo ${rev?.ciclo ?? ""}: ${rev?.verdict ?? ""}`.trim());
});

$("import-box").addEventListener("click", e => {
  if (e.target.id !== "import-hist") return;
  HISTORIAL_PREVIO.forEach((h, i) => {
    const rec = { ...h, id: newId(), fecha: toPbDate(h.fecha), created: new Date(Date.now() + i).toISOString() };
    sesiones.push(rec);
    queue({ op: "create", col: COL_SES, data: stripLocal(rec) });
  });
  drafts = {}; saveDrafts();
  ui.day = suggestedDay();
  saveCache(); renderAll();
  toast("Historial importado");
});
