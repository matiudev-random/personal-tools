/* ─────────────────────────────────────────
   ESTADO PÚBLICO — /api/health
───────────────────────────────────────── */
let history = readJSON(HIST_KEY, []);
let current = null;       // { ok, ms, reason, t }
let failStreak = 0;
let alerted = false;
let checking = false;

async function checkHealth() {
  if (checking) return;
  checking = true;
  $("check-now").disabled = true;
  const t0 = performance.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
  let res = { t: Date.now(), ok: false, ms: null, reason: "" };

  try {
    const r = await fetch(`${PB_URL}/api/health`, {
      headers: { "ngrok-skip-browser-warning": "1" },
      cache: "no-store",
      signal: ctrl.signal,
    });
    const ms = Math.round(performance.now() - t0);
    let body = null;
    try { body = await r.json(); } catch (e) {}
    if (r.ok && body && body.code === 200) {
      res = { ...res, ok: true, ms, reason: "PocketBase responde bien" };
    } else if (!body) {
      res.reason = `Respondió algo que no es PocketBase (HTTP ${r.status}). Revisa ngrok.`;
    } else {
      res.reason = `PocketBase respondió con error (HTTP ${r.status})`;
    }
  } catch (e) {
    if (!navigator.onLine) res = { ...res, offline: true, reason: "Este dispositivo está sin internet" };
    else if (e.name === "AbortError") res.reason = `No respondió en ${TIMEOUT / 1000} s`;
    else res.reason = "Sin respuesta: el teléfono, PocketBase o ngrok están apagados";
  } finally {
    clearTimeout(timer);
    checking = false;
    $("check-now").disabled = false;
  }

  // sin internet aquí no dice nada del servidor: no se registra como caída
  if (!res.offline) {
    history.push([res.t, res.ok ? res.ms : null]);
    const cut = Date.now() - KEEP_MS;
    history = history.filter(h => h[0] >= cut);
    writeJSON(HIST_KEY, history);
  }
  current = res;
  handleAlerts(res);
  renderStatus();
}

function lastChange() {
  // desde cuándo está en el estado actual
  if (!history.length) return null;
  const up = history[history.length - 1][1] !== null;
  let since = history[history.length - 1][0];
  for (let i = history.length - 1; i >= 0; i--) {
    if ((history[i][1] !== null) !== up) break;
    since = history[i][0];
  }
  return { up, since, all: since === history[0][0] };
}

function drops() {
  // cuenta caídas: tramos de fallos seguidos (FAILS_TO_ALERT o más)
  let n = 0, streak = 0;
  for (const [, ms] of history) {
    if (ms === null) { streak++; if (streak === FAILS_TO_ALERT) n++; }
    else streak = 0;
  }
  return n;
}

function renderStatus() {
  const hero = $("hero");
  const c = current;
  if (!c) return;
  const state = c.offline ? "offline" : c.ok ? (c.ms > 1500 ? "slow" : "up") : "down";
  hero.dataset.state = state;
  $("hero-state").textContent = { up: "En línea", slow: "En línea, lento", down: "Caído", offline: "Sin conexión" }[state];

  const ch = lastChange();
  let reason = c.reason;
  if (ch && !c.offline) reason += ` · ${ch.up ? "arriba" : "caído"} ${ch.all ? "desde que abriste el monitor" : "desde " + hhmm(ch.since)} (${duration(Date.now() - ch.since)})`;
  $("hero-reason").textContent = reason;
  $("hero-ms").textContent = c.ok ? c.ms : "—";
  $("last-check").textContent = `Revisado ${hhmm(c.t)} · cada ${CHECK_EVERY / 1000} s`;
  document.title = `${state === "down" ? "🔴 Caído" : state === "offline" ? "⚪ Sin conexión" : "🟢 En línea"} — Monitor`;

  // últimas 60 revisiones
  const last = history.slice(-60);
  $("ticks").innerHTML = Array.from({ length: 60 - last.length }, () => `<i class="tick empty"></i>`).join("") +
    last.map(([t, ms]) => `<i class="tick ${ms === null ? "bad" : ms > 1500 ? "slow" : "good"}" title="${hhmm(t)} · ${ms === null ? "sin respuesta" : ms + " ms"}"></i>`).join("");

  // métricas
  if (history.length) {
    const okN = history.filter(h => h[1] !== null).length;
    const pct = okN / history.length * 100;
    $("st-uptime").textContent = `${pct >= 99.95 ? 100 : pct.toFixed(1).replace(".", ",")}%`;
    $("st-uptime-sub").textContent = `últimos ${duration(Date.now() - history[0][0])}`;
    const lat = last.map(h => h[1]).filter(v => v !== null);
    $("st-avg").textContent = lat.length ? `${fmtN(lat.reduce((a, b) => a + b, 0) / lat.length)} ms` : "—";
    $("st-drops").textContent = drops();
  }
  renderLatency();
}

/* Gráfico de latencia (últimas 120 revisiones) */
function renderLatency() {
  const pts = history.slice(-120);
  const box = $("lat-chart");
  const vals = pts.map(p => p[1]).filter(v => v !== null);
  if (pts.length < 2 || !vals.length) {
    box.innerHTML = `<p class="empty">Juntando datos… el gráfico aparece tras un par de revisiones.</p>`;
    $("lat-meta").textContent = "";
    return;
  }
  const W = 340, H = 120, P = { l: 34, r: 8, t: 10, b: 18 };
  const t0 = pts[0][0], t1 = pts[pts.length - 1][0];
  const maxV = Math.max(...vals);
  const step = [50, 100, 200, 250, 500, 1000, 2000, 5000].find(s => maxV / s <= 4) || 10000;
  const yMax = Math.max(step, Math.ceil(maxV / step) * step);
  const X = t => P.l + (t - t0) / Math.max(1, t1 - t0) * (W - P.l - P.r);
  const Y = v => P.t + (1 - v / yMax) * (H - P.t - P.b);

  let grid = "";
  for (let v = 0; v <= yMax; v += step) grid += `<line class="grid" x1="${P.l}" x2="${W - P.r}" y1="${Y(v)}" y2="${Y(v)}"/><text class="axis" x="${P.l - 6}" y="${Y(v) + 3}" text-anchor="end">${v}</text>`;

  // la línea se corta donde no hubo respuesta
  let d = "", pen = false;
  for (const [t, ms] of pts) {
    if (ms === null) { pen = false; continue; }
    d += `${pen ? "L" : "M"}${X(t).toFixed(1)},${Y(ms).toFixed(1)} `;
    pen = true;
  }
  const fails = pts.filter(p => p[1] === null).map(p => `<line class="fail" x1="${X(p[0])}" x2="${X(p[0])}" y1="${P.t}" y2="${H - P.b}"/>`).join("");
  box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Latencia de las últimas revisiones">
    ${grid}${fails}
    <path d="${d}" fill="none" stroke="var(--lat)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    <text class="axis" x="${P.l}" y="${H - 4}">${hhmm(t0)}</text>
    <text class="axis" x="${W - P.r}" y="${H - 4}" text-anchor="end">${hhmm(t1)}</text>
    <line class="xhair" x1="0" x2="0" y1="${P.t}" y2="${H - P.b}" style="display:none"/>
    <circle class="xdot" r="4" style="display:none"/>
  </svg><div class="tip" hidden></div>`;
  box._pts = pts; box._X = X; box._Y = Y; box._W = W; box._H = H;
  $("lat-meta").textContent = `${pts.length} revisiones · franjas rojas = sin respuesta`;
}

function onLatPointer(e) {
  const box = $("lat-chart");
  const svg = box.querySelector("svg");
  if (!svg || !box._pts) return;
  const rect = svg.getBoundingClientRect();
  const sx = (e.clientX - rect.left) / rect.width * box._W;
  let best = null, bd = Infinity;
  for (const p of box._pts) { const d = Math.abs(box._X(p[0]) - sx); if (d < bd) { bd = d; best = p; } }
  if (!best) return;
  const x = box._X(best[0]);
  const xh = svg.querySelector(".xhair"), dot = svg.querySelector(".xdot"), tip = box.querySelector(".tip");
  xh.setAttribute("x1", x); xh.setAttribute("x2", x); xh.style.display = "";
  if (best[1] !== null) { dot.setAttribute("cx", x); dot.setAttribute("cy", box._Y(best[1])); dot.style.display = ""; }
  else dot.style.display = "none";
  tip.innerHTML = `<b>${best[1] === null ? "Sin respuesta" : best[1] + " ms"}</b><span>${hhmm(best[0])}</span>`;
  tip.hidden = false;
  tip.style.left = `${Math.min(Math.max(x / box._W * rect.width, 50), rect.width - 50)}px`;
}
$("lat-chart").addEventListener("pointermove", onLatPointer);
$("lat-chart").addEventListener("pointerdown", onLatPointer);
$("lat-chart").addEventListener("pointerleave", () => {
  const box = $("lat-chart");
  box.querySelector(".tip")?.setAttribute("hidden", "");
  box.querySelectorAll(".xhair, .xdot").forEach(el => el.style.display = "none");
});

$("check-now").addEventListener("click", checkHealth);
