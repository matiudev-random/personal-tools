/* ─────────────────────────────────────────
   POCKETBASE Y SINCRONIZACIÓN
───────────────────────────────────────── */
function saveCache() { writeJSON(CACHE_KEY, { tms, sesiones }); }

function queue(op) {
  pending.push(op);
  writeJSON(PENDING_KEY, pending);
  flush();
}

function connect(url) {
  pb = new PocketBase(url);
  pb.autoCancellation(false);
  // ngrok muestra una página de aviso en vez de la respuesta si no va este header
  pb.beforeSend = (u, options) => {
    options.headers = Object.assign({}, options.headers, { "ngrok-skip-browser-warning": "1" });
    return { url: u, options };
  };
}

function normSes(r) { return { ...r, dia: Number(r.dia), ciclo: Number(r.ciclo) || 1, semana: Number(r.semana) || 1, series: Array.isArray(r.series) ? r.series : [] }; }

async function fetchRemote() {
  const [t, s] = await Promise.all([
    pb.collection(COL_TMS).getFullList({ sort: "-desde" }),
    pb.collection(COL_SES).getFullList({ sort: "-fecha" }),
  ]);
  tms = t;
  sesiones = s.map(normSes);
  // lo que todavía no se subió manda sobre lo que dice el servidor
  for (const p of pending) {
    if (p.op === "create") {
      const list = p.col === COL_TMS ? tms : sesiones;
      if (!list.some(x => x.id === p.data.id)) list.push(p.col === COL_SES ? normSes(p.data) : p.data);
    }
    if (p.op === "delete") sesiones = sesiones.filter(x => x.id !== p.id);
  }
}

async function flush() {
  if (flushing || !online || !pb?.authStore.isValid || !pending.length) { updateStatus(); return; }
  flushing = true;
  updateStatus();
  try {
    while (pending.length) {
      const p = pending[0];
      try {
        if (p.op === "create") await pb.collection(p.col).create(p.data);
        if (p.op === "delete") await pb.collection(p.col).delete(p.id);
      } catch (e) {
        const dup = e.status === 400 && e.response?.data?.id;  // ya estaba subido
        const gone = e.status === 404 && p.op === "delete";
        if (!dup && !gone) throw e;
      }
      pending.shift();
      writeJSON(PENDING_KEY, pending);
    }
  } catch (e) {
    if (e.status === 401 || e.status === 403) updateStatus("Sin permiso para guardar: revisa las reglas de las colecciones");
    else if (e.status === 404) updateStatus("Faltan las colecciones fuerza_tms / fuerza_sesiones en PocketBase");
    else if (e.status === 400) updateStatus("PocketBase rechazó un registro: revisa los campos de la colección");
    else { online = false; updateStatus(); }
    return;
  } finally {
    flushing = false;
  }
  updateStatus();
  if (ui.view !== "train") renderAll(); // quita las etiquetas "sin subir"
}

async function sync() {
  if (!pb) return;
  if (!pb.authStore.isValid) { online = true; updateStatus(); return; }
  try {
    await pb.collection("users").authRefresh().catch(e => { if (e.status === 401) pb.authStore.clear(); });
    if (!pb.authStore.isValid) { updateStatus(); return; }
    await fetchRemote();
    online = true;
  } catch (e) {
    online = false;
    updateStatus(e.status === 404 ? "Faltan las colecciones fuerza_tms / fuerza_sesiones en PocketBase" : undefined);
    return;
  }
  saveCache();
  // sin TMs guardados todavía: sube los del plan
  if (!tms.length) {
    for (const [lift, v] of Object.entries(DEFAULT_TMS)) {
      const rec = { id: newId(), ejercicio: lift, tm: v, desde: toPbDate(today()), nota: "TM inicial del plan", created: new Date().toISOString() };
      tms.push(rec);
      pending.push({ op: "create", col: COL_TMS, data: stripLocal(rec) });
    }
    writeJSON(PENDING_KEY, pending);
  }
  dropUntouchedDrafts();
  renderAll();
  await flush();
}

// un borrador que no tocaste se regenera con los datos nuevos (TM, semana que toca, últimos accesorios)
function dropUntouchedDrafts() {
  for (const k of Object.keys(drafts)) if (!drafts[k].touched) delete drafts[k];
  saveDrafts();
}

function updateStatus(msg) {
  const logged = pb && pb.authStore.isValid;
  $("login-form").hidden = !!logged;
  $("login-user").hidden = !logged;
  if (logged) $("login-user").querySelector("span").textContent = pb.authStore.record?.email || "";
  const n = pending.length;
  let text, state;
  if (msg) { text = msg; state = "warn"; }
  else if (!online) { text = n ? `Sin conexión · ${n} cambio${n !== 1 ? "s" : ""} en espera` : "Sin conexión · usando la copia del teléfono"; state = "off"; }
  else if (!logged) { text = n ? `Inicia sesión para subir ${n} cambio${n !== 1 ? "s" : ""}` : "Inicia sesión para guardar en tu servidor"; state = "warn"; }
  else if (n) { text = `Subiendo ${n} cambio${n !== 1 ? "s" : ""}…`; state = "busy"; }
  else { text = "Sincronizado"; state = "ok"; }
  $("status").textContent = text;
  const dot = $("status-dot");
  dot.dataset.state = state;
  dot.title = text;
}

$("status-dot").addEventListener("click", () => { ui.view = "tms"; writeJSON(UI_KEY, ui); renderAll(); });

$("login-form").addEventListener("submit", async e => {
  e.preventDefault();
  const f = new FormData(e.target);
  updateStatus("Conectando…");
  try {
    await pb.collection("users").authWithPassword(f.get("email"), f.get("password"));
    e.target.reset();
  } catch (err) {
    updateStatus(err.status === 400 ? "Correo o contraseña incorrectos" : "No se pudo conectar al servidor");
    return;
  }
  sync();
});

$("logout").addEventListener("click", () => { pb.authStore.clear(); updateStatus(); });

document.addEventListener("visibilitychange", () => { if (!document.hidden) sync(); });
window.addEventListener("online", sync);
