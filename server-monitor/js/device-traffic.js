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
