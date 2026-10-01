/* ─────────────────────────────────────────
   MONITOR — servidor casero (Termux + PocketBase + ngrok)
   · Estado público: /api/health cada 30 s, sin login.
   · Panel admin: logs, accesos fallidos, revisión de seguridad,
     colecciones, backups y datos del teléfono (hook opcional).
───────────────────────────────────────── */
const PB_URL = "https://remindful-tanned-concierge.ngrok-free.dev";
const CHECK_EVERY = 30 * 1000;        // cada cuánto revisar
const TIMEOUT = 8000;                 // sin respuesta en 8 s = caído
const FAILS_TO_ALERT = 2;             // fallos seguidos antes de avisar (evita falsas alarmas)
const ADMIN_EVERY = 60 * 1000;        // refresco del panel admin

const HIST_KEY = "monitor-history";   // [[timestamp, ms | null], ...]
const NOTIFY_KEY = "monitor-notify";
const AUTH_KEY = "monitor-superuser"; // en sessionStorage: se borra al cerrar la pestaña
const KEEP_MS = 7 * 24 * 3600 * 1000; // guarda 7 días de revisiones

/* ─────────────────────────────────────────
   UTILIDADES
───────────────────────────────────────── */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const nf = new Intl.NumberFormat("es-CL");
const fmtN = n => nf.format(Math.round(n));

function readJSON(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
  catch (e) { return fallback; }
}
function writeJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
}

function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 2600);
}

function duration(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h${m % 60 ? ` ${m % 60} min` : ""}`;
  const d = Math.floor(h / 24);
  return `${d} d${h % 24 ? ` ${h % 24} h` : ""}`;
}
const ago = t => `hace ${duration(Date.now() - t)}`;
const hhmm = t => new Date(t).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const dayTime = t => new Date(t).toLocaleString("es-CL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const pbDate = d => d.toISOString().replace("T", " ");       // formato de fecha de los filtros de PocketBase
const fromPb = s => new Date(String(s).replace(" ", "T"));

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

/* ─────────────────────────────────────────
   AVISOS
───────────────────────────────────────── */
let notifyOn = readJSON(NOTIFY_KEY, false) && "Notification" in window && Notification.permission === "granted";

function renderNotify() {
  $("notify").setAttribute("aria-checked", String(notifyOn));
  if (!("Notification" in window)) {
    $("notify").disabled = true;
    $("notify-sub").textContent = "Este navegador no soporta notificaciones.";
  } else if (Notification.permission === "denied") {
    $("notify-sub").textContent = "Bloqueaste las notificaciones para este sitio. Actívalas en los ajustes del navegador.";
  }
}

$("notify").addEventListener("click", async () => {
  if (!("Notification" in window)) return;
  if (notifyOn) { notifyOn = false; writeJSON(NOTIFY_KEY, false); renderNotify(); return; }
  const perm = await Notification.requestPermission();
  notifyOn = perm === "granted";
  writeJSON(NOTIFY_KEY, notifyOn);
  renderNotify();
  toast(notifyOn ? "Te aviso si el servidor se cae" : "Sin permiso para notificar");
});

function notify(title, body) {
  if (!notifyOn) return;
  try { new Notification(title, { body, tag: "monitor-server" }); } catch (e) {}
}

function handleAlerts(res) {
  if (res.offline) return;
  if (res.ok) {
    if (alerted) notify("🟢 Servidor de vuelta", `Volvió a responder (${res.ms} ms).`);
    failStreak = 0; alerted = false;
    return;
  }
  failStreak++;
  if (failStreak === FAILS_TO_ALERT && !alerted) {
    alerted = true;
    notify("🔴 Servidor caído", res.reason);
  }
}

/* ─────────────────────────────────────────
   PANEL ADMIN — superuser
   La sesión vive en sessionStorage (no queda guardada al cerrar la pestaña)
   y en una llave propia, para no pisar el login de Doomsday o Fuerza.
───────────────────────────────────────── */
let pb = null;
let adminTimer = null;

function makeClient() {
  const probe = new PocketBase(PB_URL);
  const Base = Object.getPrototypeOf(probe.authStore.constructor); // BaseAuthStore
  class SessionStore extends Base {
    constructor() {
      super();
      try {
        const raw = sessionStorage.getItem(AUTH_KEY);
        if (raw) { const d = JSON.parse(raw); super.save(d.token, d.record); }
      } catch (e) {}
    }
    save(token, record) {
      super.save(token, record);
      try { sessionStorage.setItem(AUTH_KEY, JSON.stringify({ token, record })); } catch (e) {}
    }
    clear() {
      super.clear();
      try { sessionStorage.removeItem(AUTH_KEY); } catch (e) {}
    }
  }
  const client = new PocketBase(PB_URL, new SessionStore());
  client.autoCancellation(false);
  client.beforeSend = (u, options) => {
    options.headers = Object.assign({}, options.headers, { "ngrok-skip-browser-warning": "1" });
    return { url: u, options };
  };
  return client;
}

function showAdmin(on) {
  $("login-card").hidden = on;
  $("admin").hidden = !on;
  clearInterval(adminTimer);
  if (on) {
    $("admin-user").textContent = pb.authStore.record?.email || "superuser";
    refreshAdmin();
    adminTimer = setInterval(() => { if (!document.hidden) refreshAdmin(); }, ADMIN_EVERY);
  }
}

$("login-form").addEventListener("submit", async e => {
  e.preventDefault();
  const f = new FormData(e.target);
  $("login-msg").textContent = "Entrando…";
  try {
    await pb.collection("_superusers").authWithPassword(f.get("email"), f.get("password"));
    e.target.reset();
    $("login-msg").textContent = "";
    showAdmin(true);
  } catch (err) {
    $("login-msg").textContent =
      err.status === 400 ? "Correo o contraseña incorrectos (o la cuenta no es superuser)" :
      err.status === 429 ? "Demasiados intentos. Espera un poco." :
      "No se pudo conectar al servidor";
  }
});

$("logout").addEventListener("click", () => { pb.authStore.clear(); showAdmin(false); });
$("admin-refresh").addEventListener("click", () => refreshAdmin(true));

async function refreshAdmin(manual) {
  if (!pb.authStore.isValid) { showAdmin(false); return; }
  $("admin-refresh").disabled = true;
  const results = await Promise.allSettled([
    loadDevice(), loadTraffic(), loadFails(), loadSecurity(), loadData(),
  ]);
  $("admin-refresh").disabled = false;
  const authErr = results.find(r => r.status === "rejected" && (r.reason?.status === 401 || r.reason?.status === 403));
  if (authErr) { pb.authStore.clear(); showAdmin(false); toast("La sesión expiró, vuelve a entrar"); return; }
  if (manual) toast("Panel actualizado");
}

function cardError(id, title, err) {
  $(id).innerHTML = `<div class="card-head"><h3>${esc(title)}</h3></div>
    <p class="empty">${err?.status === 0 || !err?.status ? "No se pudo cargar: el servidor no responde." : `No se pudo cargar (HTTP ${esc(err.status)}).`}</p>`;
}

/* Teléfono (necesita el hook pb_hooks/monitor.pb.js) */
async function loadDevice() {
  const title = "Teléfono";
  let d;
  try { d = await pb.send("/api/monitor/device", { method: "GET" }); }
  catch (err) {
    if (err.status === 404) {
      $("device-card").innerHTML = `<div class="card-head"><h3>${title}</h3><span class="pill neutral">sin hook</span></div>
        <p class="row-sub">Para ver batería, temperatura, RAM y espacio libre, copia <code>monitor.pb.js</code> en la carpeta <code>pb_hooks</code> (al lado de <code>pb_data</code>) y reinicia PocketBase. Para la batería, instala también la app <b>Termux:API</b> y ejecuta <code>pkg install termux-api</code>.</p>`;
      return;
    }
    if (err.status === 401 || err.status === 403) throw err;
    cardError("device-card", title, err); return;
  }
  const items = [];
  if (d.battery) {
    const b = d.battery;
    const charging = /CHARGING|FULL/i.test(b.status || "") || (b.plugged && b.plugged !== "UNPLUGGED");
    const lvl = b.percent < 20 && !charging ? "bad" : b.percent < 40 && !charging ? "warn" : "good";
    items.push(metric("Batería", `${b.percent}%`, charging ? "cargando" : "sin cargar", lvl, b.percent));
    if (b.temp != null) items.push(metric("Temperatura", `${Number(b.temp).toFixed(1).replace(".", ",")} °C`, b.temp >= 45 ? "muy alta" : b.temp >= 40 ? "alta" : "normal", b.temp >= 45 ? "bad" : b.temp >= 40 ? "warn" : "good"));
  }
  if (d.uptimeSec != null) items.push(metric("Encendido", duration(d.uptimeSec * 1000), "desde el último reinicio"));
  if (d.memTotalMB) {
    const used = 1 - d.memAvailMB / d.memTotalMB;
    items.push(metric("RAM libre", `${fmtN(d.memAvailMB)} MB`, `de ${fmtN(d.memTotalMB)} MB`, used > .92 ? "warn" : "good", (1 - used) * 100));
  }
  if (d.diskTotalMB) {
    const free = d.diskFreeMB / d.diskTotalMB;
    items.push(metric("Espacio libre", d.diskFreeMB >= 1024 ? `${(d.diskFreeMB / 1024).toFixed(1).replace(".", ",")} GB` : `${fmtN(d.diskFreeMB)} MB`, `${Math.round(free * 100)}% del total`, free < .05 ? "bad" : free < .12 ? "warn" : "good", free * 100));
  }
  if (d.load) items.push(metric("Carga CPU", d.load[0].toFixed(2).replace(".", ","), "promedio 1 min"));
  const noBat = !d.battery ? `<p class="hint">Sin datos de batería: instala la app Termux:API y <code>pkg install termux-api</code>.</p>` : "";
  $("device-card").innerHTML = `<div class="card-head"><h3>${title}</h3><span class="card-meta">${hhmm(Date.now())}</span></div>
    <div class="metrics">${items.join("")}</div>${noBat}`;
}

function metric(label, value, sub, level, bar) {
  return `<div class="metric ${level || ""}">
    <span class="m-lbl">${esc(label)}</span>
    <b>${esc(value)}</b>
    <small>${level && level !== "good" ? `<i class="dot ${level}"></i>` : ""}${esc(sub)}</small>
    ${bar != null ? `<span class="m-bar"><span style="width:${Math.max(2, Math.min(100, bar))}%"></span></span>` : ""}
  </div>`;
}

/* Tráfico de las últimas 24 h (sin contar el propio monitor ni tus acciones de superuser) */
const REAL_TRAFFIC = `data.auth != '_superusers' && data.url != '/api/health'`;

async function loadTraffic() {
  const since = new Date(Date.now() - 24 * 3600 * 1000);
  const base = `created >= '${pbDate(since)}' && ${REAL_TRAFFIC}`;
  let all, errs;
  try {
    [all, errs] = await Promise.all([
      pb.logs.getStats({ filter: base }),
      pb.logs.getStats({ filter: `${base} && data.status >= 400` }),
    ]);
  } catch (err) {
    if (err.status === 401 || err.status === 403) throw err;
    cardError("traffic-card", "Tráfico 24 h", err); return;
  }
  // 24 franjas de una hora
  const hourStart = new Date(); hourStart.setMinutes(0, 0, 0);
  const slots = Array.from({ length: 24 }, (_, i) => ({ t: hourStart.getTime() - (23 - i) * 3600 * 1000, total: 0, err: 0 }));
  const put = (list, key) => list.forEach(s => {
    const t = fromPb(s.date).getTime();
    const slot = slots.find(x => x.t === t);
    if (slot) slot[key] += s.total;
  });
  put(all, "total"); put(errs, "err");
  const total = slots.reduce((a, s) => a + s.total, 0);
  const errTotal = slots.reduce((a, s) => a + s.err, 0);
  const peak = slots.reduce((a, s) => s.total > a.total ? s : a, slots[0]);

  $("traffic-card").innerHTML = `<div class="card-head"><h3>Tráfico 24 h</h3><span class="card-meta">solo de tus apps y visitas</span></div>
    <div class="kpis">
      <div><b>${fmtN(total)}</b><span>peticiones</span></div>
      <div><b class="${errTotal ? "t-warn" : ""}">${fmtN(errTotal)}</b><span>con error</span></div>
      <div><b>${total ? hhmm(peak.t) : "—"}</b><span>hora pico</span></div>
    </div>
    <div class="legend"><span><i class="sw ok"></i>Correctas</span><span><i class="sw err"></i>Con error (4xx/5xx)</span></div>
    <div class="chart bars" id="traffic-chart">${trafficSVG(slots)}<div class="tip" hidden></div></div>`;
  const box = $("traffic-chart");
  box._slots = slots;
  box.addEventListener("pointermove", onBarPointer);
  box.addEventListener("pointerdown", onBarPointer);
  box.addEventListener("pointerleave", () => { box.querySelector(".tip").hidden = true; box.querySelectorAll(".hl").forEach(r => r.classList.remove("on")); });
}

function trafficSVG(slots) {
  const W = 340, H = 130, P = { l: 30, r: 4, t: 8, b: 18 };
  const maxV = Math.max(1, ...slots.map(s => s.total));
  const step = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000].find(s => maxV / s <= 4) || 10000;
  const yMax = Math.ceil(maxV / step) * step;
  const Y = v => P.t + (1 - v / yMax) * (H - P.t - P.b);
  const slotW = (W - P.l - P.r) / slots.length;
  const bw = Math.max(4, slotW - 3);
  let grid = "";
  for (let v = 0; v <= yMax; v += step) grid += `<line class="grid" x1="${P.l}" x2="${W - P.r}" y1="${Y(v)}" y2="${Y(v)}"/><text class="axis" x="${P.l - 5}" y="${Y(v) + 3}" text-anchor="end">${v}</text>`;
  const r = Math.min(3, bw / 2);
  const bars = slots.map((s, i) => {
    const x = P.l + i * slotW + (slotW - bw) / 2;
    const ok = s.total - s.err;
    let out = `<rect class="hl" x="${P.l + i * slotW}" y="${P.t}" width="${slotW}" height="${H - P.t - P.b}"/>`;
    // errores abajo, correctas arriba, 2 px de separación
    if (s.err) out += `<rect x="${x}" y="${Y(s.err)}" width="${bw}" height="${Y(0) - Y(s.err)}" fill="var(--bad)" rx="${ok ? 0 : r}"/>`;
    if (ok) {
      const yTop = Y(s.total), yBot = s.err ? Y(s.err) - 2 : Y(0);
      if (yBot - yTop > 0) out += `<path d="M${x},${yBot} V${yTop + r} a${r},${r} 0 0 1 ${r},${-r} h${bw - 2 * r} a${r},${r} 0 0 1 ${r},${r} V${yBot} Z" fill="var(--req)"/>`;
    }
    return out;
  }).join("");
  const lbl = i => `<text class="axis" x="${P.l + i * slotW + slotW / 2}" y="${H - 4}" text-anchor="middle">${hhmm(slots[i].t)}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Peticiones por hora">${grid}${bars}${lbl(0)}${lbl(12)}${lbl(23)}</svg>`;
}

function onBarPointer(e) {
  const box = e.currentTarget;
  const svg = box.querySelector("svg");
  const rect = svg.getBoundingClientRect();
  const sx = (e.clientX - rect.left) / rect.width * 340;
  const slotW = (340 - 34) / 24;
  const i = Math.max(0, Math.min(23, Math.floor((sx - 30) / slotW)));
  const s = box._slots[i];
  box.querySelectorAll(".hl").forEach((r, j) => r.classList.toggle("on", j === i));
  const tip = box.querySelector(".tip");
  tip.innerHTML = `<b>${hhmm(s.t)}–${hhmm(s.t + 3600000)}</b><span>${fmtN(s.total)} peticiones · ${fmtN(s.err)} con error</span>`;
  tip.hidden = false;
  tip.style.left = `${Math.min(Math.max((30 + (i + .5) * slotW) / 340 * rect.width, 80), rect.width - 80)}px`;
}

/* Intentos de inicio de sesión fallidos (7 días) */
async function loadFails() {
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  let list;
  try {
    list = await pb.logs.getList(1, 100, {
      filter: `created >= '${pbDate(since)}' && data.url ~ 'auth-with-' && data.status >= 400`,
      sort: "-created",
    });
  } catch (err) {
    if (err.status === 401 || err.status === 403) throw err;
    cardError("fails-card", "Accesos fallidos", err); return;
  }
  const items = list.items;
  const admin = items.filter(i => String(i.data?.url).includes("/_superusers/")).length;
  const day = items.filter(i => fromPb(i.created) >= Date.now() - 24 * 3600 * 1000).length;
  const byIP = {};
  items.forEach(i => { const ip = i.data?.userIP || i.data?.remoteIP || "?"; byIP[ip] = (byIP[ip] || 0) + 1; });
  const topIPs = Object.entries(byIP).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const level = admin ? "bad" : list.totalItems > 20 ? "warn" : list.totalItems ? "neutral" : "good";

  const rows = items.slice(0, 8).map(i => {
    const d = i.data || {};
    const col = (String(d.url).match(/collections\/([^/]+)\//) || [])[1] || "?";
    const isAdmin = col === "_superusers";
    return `<li class="${isAdmin ? "admin" : ""}">
      <span class="f-when">${esc(dayTime(fromPb(i.created)))}</span>
      <span class="f-main"><b>${isAdmin ? "Panel admin" : esc(col)}</b> · ${esc(d.userIP || d.remoteIP || "IP ?")}${d.status === 429 ? " · bloqueado por límite" : ""}</span>
      <span class="f-ua">${esc(shortUA(d.userAgent))}</span>
    </li>`;
  }).join("");

  $("fails-card").innerHTML = `<div class="card-head"><h3>Accesos fallidos · 7 días</h3>
      <span class="pill ${level}">${list.totalItems ? fmtN(list.totalItems) : "ninguno"}</span></div>
    ${list.totalItems ? `
      <div class="kpis">
        <div><b>${fmtN(day)}</b><span>últimas 24 h</span></div>
        <div><b class="${admin ? "t-bad" : ""}">${fmtN(admin)}</b><span>al panel admin</span></div>
        <div><b>${Object.keys(byIP).length}</b><span>IPs distintas</span></div>
      </div>
      ${admin ? `<p class="alert bad">Hubo intentos de entrar a tu cuenta de superuser. Si no fuiste tú, cambia la contraseña y activa MFA.</p>` : ""}
      <p class="row-sub">IPs con más intentos: ${topIPs.map(([ip, n]) => `<code>${esc(ip)}</code> ×${n}`).join(", ")}</p>
      <ul class="fails">${rows}</ul>` :
      `<p class="row-sub">Nadie ha fallado un inicio de sesión en los últimos 7 días.</p>`}`;
}

function shortUA(ua) {
  ua = String(ua || "");
  if (!ua) return "sin user-agent";
  const os = /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "";
  const br = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "";
  if (br || os) return [br, os].filter(Boolean).join(" · ");
  return ua.length > 48 ? ua.slice(0, 48) + "…" : ua; // scripts, curl, bots
}

/* Revisión de seguridad */
async function loadSecurity() {
  let settings, cols, health, backups, superusers;
  try {
    [settings, cols, health, backups] = await Promise.all([
      pb.settings.getAll(),
      pb.collections.getFullList({ batch: 200 }),
      pb.health.check(),
      pb.backups.getFullList().catch(() => []),
    ]);
    superusers = cols.find(c => c.name === "_superusers");
  } catch (err) {
    if (err.status === 401 || err.status === 403) throw err;
    cardError("security-card", "Seguridad", err); return;
  }
  const checks = [];

  // 1. Reglas públicas ("" = cualquiera, null = solo superuser)
  const RULES = { listRule: "listar", viewRule: "ver", createRule: "crear", updateRule: "editar", deleteRule: "borrar" };
  const openWrite = [], openRead = [], openSignup = [];
  for (const c of cols.filter(c => !c.system)) {
    // registro abierto en una colección auth: es un caso aparte (ver abajo)
    if (c.type === "auth" && c.createRule === "") openSignup.push(c.name);
    const w = ["createRule", "updateRule", "deleteRule"].filter(r => c[r] === "" && !(c.type === "auth" && r === "createRule"));
    const r = ["listRule", "viewRule"].filter(r => c[r] === "");
    if (w.length) openWrite.push(`${c.name} (${w.map(x => RULES[x]).join(", ")})`);
    if (r.length) openRead.push(`${c.name} (${r.map(x => RULES[x]).join(", ")})`);
  }
  if (openWrite.length) checks.push({ lvl: "bad", t: "Colecciones que cualquiera puede modificar", d: `Sin login se puede escribir en: ${openWrite.join("; ")}. Cambia esas reglas a <code>@request.auth.id != ""</code>.` });
  if (openRead.length) checks.push({ lvl: "warn", t: "Colecciones que cualquiera puede leer", d: `Públicas para leer: ${openRead.join("; ")}. Si no es a propósito, exige login.` });
  if (openSignup.length) checks.push({ lvl: "bad", t: "Cualquiera puede crearse una cuenta", d: `El registro está abierto en ${openSignup.map(n => `<code>${esc(n)}</code>`).join(", ")}. Como tus colecciones solo piden "estar logueado", alguien que se registre puede leer y modificar tus datos. Si eres el único usuario, pon la regla <b>Create</b> de esa colección en blanco con el candado (solo admin).` });
  if (!openWrite.length && !openRead.length) checks.push({ lvl: "good", t: "Reglas de acceso", d: "Ninguna colección es pública: todas piden login o son solo de admin." });

  // 2. Límite de peticiones (frena fuerza bruta en los logins)
  checks.push(settings.rateLimits?.enabled
    ? { lvl: "good", t: "Límite de peticiones activado", d: "Frena los ataques de fuerza bruta contra los inicios de sesión." }
    : { lvl: "bad", t: "Límite de peticiones desactivado", d: "Cualquiera puede probar contraseñas sin freno. Actívalo en Settings → Application → Rate limiting." });

  // 3. IP real detrás de ngrok
  const proxyHeader = health?.data?.possibleProxyHeader;
  const trusted = settings.trustedProxy?.headers || [];
  if (proxyHeader && !trusted.length) checks.push({ lvl: "warn", t: "Los logs no ven la IP real", d: `Todo llega desde ngrok, así que los logs y el límite de peticiones ven la misma IP para todos. En Settings → Application → User IP proxy headers agrega <code>${esc(proxyHeader)}</code>.` });
  else if (trusted.length) checks.push({ lvl: "good", t: "IP real de las visitas", d: `Se lee desde <code>${esc(trusted.join(", "))}</code>.` });

  // 4. MFA para el panel admin
  checks.push(superusers?.mfa?.enabled
    ? { lvl: "good", t: "MFA para superusers", d: "Entrar al panel pide un segundo factor." }
    : { lvl: "warn", t: "Sin MFA en el panel admin", d: "Solo la contraseña protege tu servidor. Actívalo en la colección _superusers → Options → MFA (necesita OTP por correo, así que primero configura SMTP)." });

  // 5. Restringir el panel admin por IP
  if ((settings.superuserIPs || []).length) checks.push({ lvl: "good", t: "Panel admin restringido por IP", d: `Solo desde: ${esc(settings.superuserIPs.join(", "))}.` });

  // 6. Backups
  const lastBk = backups.length ? backups.map(b => fromPb(b.modified)).sort((a, b) => b - a)[0] : null;
  const bkAge = lastBk ? Date.now() - lastBk : Infinity;
  if (!settings.backups?.cron) checks.push({ lvl: lastBk && bkAge < 7 * 864e5 ? "warn" : "bad", t: "Sin backups automáticos", d: `${lastBk ? `Último backup manual ${ago(lastBk)}.` : "No hay ningún backup."} Si el teléfono se pierde o se daña, pierdes todo. Programa uno en Settings → Backups (por ejemplo <code>0 4 * * *</code>, todos los días a las 4).` });
  else checks.push({ lvl: bkAge < 3 * 864e5 ? "good" : "warn", t: "Backups automáticos", d: `Programados (<code>${esc(settings.backups.cron)}</code>, guarda ${esc(settings.backups.cronMaxKeep)}). ${lastBk ? `Último ${ago(lastBk)}.` : "Todavía no se genera ninguno."}${settings.backups.s3?.enabled ? " Se suben a S3." : " Quedan en el mismo teléfono: copia alguno fuera de vez en cuando."}` });

  // 7. Registro de IPs
  if (settings.logs && !settings.logs.logIP) checks.push({ lvl: "warn", t: "Los logs no guardan IPs", d: "Sin IPs no puedes saber quién intentó entrar. Actívalo en Settings → Logs." });
  if (settings.logs?.maxDays === 0) checks.push({ lvl: "warn", t: "Logs desactivados", d: "Con 0 días de retención no queda registro de nada." });

  const order = { bad: 0, warn: 1, good: 2 };
  checks.sort((a, b) => order[a.lvl] - order[b.lvl]);
  const nBad = checks.filter(c => c.lvl === "bad").length, nWarn = checks.filter(c => c.lvl === "warn").length;
  const score = nBad ? ["bad", `${nBad} crítico${nBad > 1 ? "s" : ""}`] : nWarn ? ["warn", `${nWarn} por mejorar`] : ["good", "todo bien"];
  const ICON = { good: "✓", warn: "!", bad: "✕" };

  $("security-card").innerHTML = `<div class="card-head"><h3>Revisión de seguridad</h3><span class="pill ${score[0]}">${score[1]}</span></div>
    <ul class="checks">${checks.map(c => `<li class="${c.lvl}">
      <span class="c-icon" aria-label="${{ good: "Bien", warn: "Aviso", bad: "Crítico" }[c.lvl]}">${ICON[c.lvl]}</span>
      <div><p class="c-title">${esc(c.t)}</p><p class="c-desc">${c.d}</p></div>
    </li>`).join("")}</ul>`;
}

/* Colecciones y backups */
async function loadData() {
  let cols, backups;
  try {
    [cols, backups] = await Promise.all([
      pb.collections.getFullList({ batch: 200 }),
      pb.backups.getFullList().catch(() => []),
    ]);
  } catch (err) {
    if (err.status === 401 || err.status === 403) throw err;
    cardError("data-card", "Datos", err); return;
  }
  const own = cols.filter(c => !c.system).sort((a, b) => a.name.localeCompare(b.name));
  const counts = await Promise.all(own.map(c =>
    pb.collection(c.name).getList(1, 1, { fields: "id" }).then(r => r.totalItems).catch(() => null)));
  const maxN = Math.max(1, ...counts.filter(n => n != null));
  const bkSize = backups.reduce((a, b) => a + (b.size || 0), 0);

  $("data-card").innerHTML = `<div class="card-head"><h3>Datos</h3><span class="card-meta">${own.length} colecciones</span></div>
    <ul class="cols">${own.map((c, i) => `<li>
      <span class="col-name">${esc(c.name)}${c.type === "auth" ? ' <em>auth</em>' : ""}</span>
      <span class="col-bar"><span style="width:${counts[i] != null ? Math.max(1.5, counts[i] / maxN * 100) : 0}%"></span></span>
      <span class="col-n">${counts[i] == null ? "—" : fmtN(counts[i])}</span>
    </li>`).join("")}</ul>
    <p class="row-sub">Backups guardados: <b>${backups.length}</b>${backups.length ? ` · ${(bkSize / 1048576).toFixed(1).replace(".", ",")} MB` : ""}</p>`;
}

/* ─────────────────────────────────────────
   ARRANQUE
───────────────────────────────────────── */
(function init() {
  $("server-url").textContent = PB_URL.replace(/^https?:\/\//, "");
  renderNotify();
  if (history.length) {
    current = { t: history[history.length - 1][0], ok: history[history.length - 1][1] !== null, ms: history[history.length - 1][1], reason: "Último dato guardado" };
    renderStatus();
  }
  checkHealth();
  setInterval(checkHealth, CHECK_EVERY);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) checkHealth(); });
  window.addEventListener("online", checkHealth);

  if (typeof PocketBase === "undefined") {
    $("login-card").innerHTML = `<p class="row-sub">No cargó la librería de PocketBase, así que el panel de administración no está disponible.</p>`;
    return;
  }
  pb = makeClient();
  showAdmin(pb.authStore.isValid);
})();
