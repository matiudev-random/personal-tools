/* ─────────────────────────────────────────
   RENDER — PROGRESO
───────────────────────────────────────── */
function liftSeries(lift) {
  const pts = [];
  for (const s of sesiones) {
    const sets = (s.series || []).filter(x => x.ej === lift && x.reps && x.peso);
    if (!sets.length) continue;
    const pick = sets.find(x => x.amrap) || sets.reduce((a, b) => e1rm(b.peso, b.reps) > e1rm(a.peso, a.reps) ? b : a);
    pts.push({ date: ymdOf(s.fecha), v: Math.round(e1rm(pick.peso, pick.reps) * 2) / 2, label: `${fmt(pick.peso)} kg × ${pick.reps}`, created: s.created });
  }
  return pts.sort((a, b) => a.date.localeCompare(b.date) || String(a.created).localeCompare(String(b.created)));
}

function pullupSeries() {
  const pts = [];
  for (const s of sesiones) {
    const sets = (s.series || []).filter(x => x.ej === "dominadas" && x.reps);
    if (!sets.length) continue;
    pts.push({ date: ymdOf(s.fecha), v: sets.reduce((a, b) => a + b.reps, 0), label: sets.map(x => x.reps).join("/") + (sets[0].peso ? ` +${fmt(sets[0].peso)} kg` : ""), created: s.created });
  }
  return pts.sort((a, b) => a.date.localeCompare(b.date) || String(a.created).localeCompare(String(b.created)));
}

const dayNum = ymd => Date.UTC(...ymd.split("-").map((n, i) => i === 1 ? n - 1 : Number(n))) / 86400000;

function chartSVG(pts, color, unit, kind) {
  const W = 340, H = 150, P = { l: 34, r: 12, t: 12, b: 22 };
  const xs = pts.map(p => dayNum(p.date));
  let x0 = Math.min(...xs), x1 = Math.max(...xs);
  if (x1 - x0 < 7) { x0 -= 3; x1 += 3; }
  const vs = pts.map(p => p.v);
  let y0 = Math.min(...vs), y1 = Math.max(...vs);
  const pad = Math.max(2, (y1 - y0) * 0.15);
  y0 = kind === "bar" ? 0 : Math.floor((y0 - pad) / 5) * 5;
  y1 = Math.ceil((y1 + pad) / 5) * 5;
  const IN = 14; // aire entre el eje y la primera/última marca
  const X = x => P.l + IN + (x - x0) / (x1 - x0) * (W - P.l - P.r - 2 * IN);
  const Y = v => P.t + (1 - (v - y0) / (y1 - y0)) * (H - P.t - P.b);
  const step = [1, 2, 5, 10, 20, 25, 50].find(st => (y1 - y0) / st <= 4) || 100;
  y0 = Math.floor(y0 / step) * step; y1 = Math.ceil(y1 / step) * step;
  const ticks = [];
  for (let v = y0; v <= y1 + 0.001; v += step) ticks.push(v);
  const grid = ticks.map(v => `<line x1="${P.l}" x2="${W - P.r}" y1="${Y(v)}" y2="${Y(v)}" class="grid"/><text x="${P.l - 6}" y="${Y(v) + 3}" class="axis" text-anchor="end">${v}</text>`).join("");
  const first = pts[0].date, last = pts[pts.length - 1].date;
  const xl = `<text x="${X(dayNum(first))}" y="${H - 5}" class="axis" text-anchor="start">${prettyDate(first)}</text>` +
    (first !== last ? `<text x="${X(dayNum(last))}" y="${H - 5}" class="axis" text-anchor="end">${prettyDate(last)}</text>` : "");
  let marks;
  if (kind === "bar") {
    const bw = Math.max(6, Math.min(16, (W - P.l - P.r) / pts.length - 4));
    marks = pts.map(p => {
      const x = X(dayNum(p.date)) - bw / 2, y = Y(p.v), h = Y(0) - y;
      return `<path d="M${x},${Y(0)} V${y + 4} a4,4 0 0 1 4,-4 h${bw - 8} a4,4 0 0 1 4,4 V${Y(0)} Z" fill="${color}"/>`;
    }).join("");
  } else {
    const d = pts.map((p, i) => `${i ? "L" : "M"}${X(dayNum(p.date)).toFixed(1)},${Y(p.v).toFixed(1)}`).join(" ");
    marks = `<path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>` +
      pts.map(p => `<circle cx="${X(dayNum(p.date))}" cy="${Y(p.v)}" r="4" fill="${color}" stroke="var(--bg-card)" stroke-width="2"/>`).join("");
  }
  const hits = pts.map((p, i) => `<circle class="hit" data-i="${i}" cx="${X(dayNum(p.date))}" cy="${Y(p.v)}" r="14" fill="transparent"/>`).join("");
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución">${grid}${xl}${marks}<line class="xhair" y1="${P.t}" y2="${H - P.b}" x1="0" x2="0" style="display:none"/>${hits}</svg>`;
}

function chartCard(title, pts, color, unit, kind, sub) {
  if (!pts.length) return `<div class="card chart-card"><h3>${esc(title)}</h3><p class="empty">Todavía sin registros.</p></div>`;
  const last = pts[pts.length - 1].v, first = pts[0].v;
  const diff = last - first;
  const best = Math.max(...pts.map(p => p.v));
  return `<div class="card chart-card" data-pts='${esc(JSON.stringify(pts))}' data-unit="${esc(unit)}">
    <div class="chart-head">
      <div><h3>${esc(title)}</h3><p class="chart-sub">${esc(sub)}</p></div>
      <div class="hero"><b>${fmt(last)}</b><span>${esc(unit)}</span>
        ${pts.length > 1 ? `<em class="${diff >= 0 ? "up" : "down"}">${diff >= 0 ? "▲" : "▼"} ${fmt(Math.abs(diff))}</em>` : ""}
      </div>
    </div>
    <div class="chart-wrap">${chartSVG(pts, color, unit, kind)}<div class="tip" hidden></div></div>
    <p class="chart-foot">Mejor: ${fmt(best)} ${esc(unit)} · ${pts.length} ${pts.length !== 1 ? "sesiones" : "sesión"}</p>
  </div>`;
}

function renderProgress() {
  $("charts").innerHTML =
    Object.entries(LIFTS).map(([id, L]) => chartCard(L.short, liftSeries(id), L.color, "kg", "line", "1RM estimado por sesión")).join("") +
    chartCard("Dominadas", pullupSeries(), "#43A066", "reps", "bar", "Reps totales por sesión");
  renderHistory();
}

$("charts").addEventListener("pointermove", onChartPointer);
$("charts").addEventListener("pointerdown", onChartPointer);
$("charts").addEventListener("pointerleave", e => {
  $("charts").querySelectorAll(".tip").forEach(t => t.hidden = true);
  $("charts").querySelectorAll(".xhair").forEach(l => l.style.display = "none");
}, true);

function onChartPointer(e) {
  const card = e.target.closest(".chart-card[data-pts]");
  if (!card) return;
  const svg = card.querySelector("svg");
  const pts = JSON.parse(card.dataset.pts);
  const rect = svg.getBoundingClientRect();
  const sx = (e.clientX - rect.left) / rect.width * 340;
  const hits = [...svg.querySelectorAll(".hit")];
  let best = null, bd = Infinity;
  hits.forEach(h => { const d = Math.abs(Number(h.getAttribute("cx")) - sx); if (d < bd) { bd = d; best = h; } });
  if (!best) return;
  const p = pts[Number(best.dataset.i)];
  const cx = Number(best.getAttribute("cx")), cy = Number(best.getAttribute("cy"));
  $("charts").querySelectorAll(".xhair").forEach(l => l.style.display = "none");
  $("charts").querySelectorAll(".tip").forEach(t => t.hidden = true);
  const xh = svg.querySelector(".xhair");
  xh.setAttribute("x1", cx); xh.setAttribute("x2", cx); xh.style.display = "";
  const tip = card.querySelector(".tip");
  tip.innerHTML = `<b>${fmt(p.v)} ${esc(card.dataset.unit)}</b><span>${prettyDate(p.date)} · ${esc(p.label)}</span>`;
  tip.hidden = false;
  const left = cx / 340 * rect.width;
  tip.style.left = `${Math.min(Math.max(left, 60), rect.width - 60)}px`;
  tip.style.top = `${cy / 150 * rect.height - 8}px`;
}

function renderHistory() {
  const list = [...sesiones].sort(bySesionDesc);
  if (!list.length) { $("history").innerHTML = `<p class="empty">Aún no guardas sesiones.</p>`; return; }
  $("history").innerHTML = list.map(s => {
    const main = (s.series || []).find(x => x.amrap && x.reps);
    const isPending = pending.some(p => p.op === "create" && p.data.id === s.id);
    return `<details class="card hist" style="--accent:${DAYS[s.dia].color}">
      <summary>
        <span class="hist-day">D${s.dia}</span>
        <span class="hist-main">${prettyDate(ymdOf(s.fecha))} · ${esc(DAYS[s.dia].name)}<small>Ciclo ${s.ciclo} · S${s.semana}${main ? ` · ${fmt(main.peso)}×${main.reps}` : ""}${isPending ? " · sin subir" : ""}</small></span>
      </summary>
      <pre>${esc(summaryText(s))}</pre>
      <div class="hist-actions">
        <button class="mini-btn" data-copy="${esc(s.id)}">Copiar para Claude</button>
        <button class="mini-btn danger" data-del="${esc(s.id)}">Borrar</button>
      </div>
    </details>`;
  }).join("");
}

$("history").addEventListener("click", e => {
  const c = e.target.closest("[data-copy]");
  if (c) { const s = sesiones.find(x => x.id === c.dataset.copy); if (s) copyText(summaryText(s)); return; }
  const d = e.target.closest("[data-del]");
  if (d) {
    const s = sesiones.find(x => x.id === d.dataset.del);
    if (!s || !confirm(`¿Borrar la sesión D${s.dia} del ${prettyDate(ymdOf(s.fecha))}?`)) return;
    sesiones = sesiones.filter(x => x.id !== s.id);
    const idx = pending.findIndex(p => p.op === "create" && p.data.id === s.id);
    if (idx >= 0) { pending.splice(idx, 1); writeJSON(PENDING_KEY, pending); }
    else queue({ op: "delete", col: COL_SES, id: s.id });
    saveCache(); renderAll();
    toast("Sesión borrada");
  }
});
