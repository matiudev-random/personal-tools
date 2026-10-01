/* ─────────────────────────────────────────
   CONFIG — los datos viven en PocketBase
   (colecciones "marvel_bloques" y "marvel_titulos"; el avance es marvel_titulos.vista)
───────────────────────────────────────── */
const CACHE_KEY = "doomsday-cache";          // última lista + avance descargados
const PENDING_KEY = "doomsday-pending";      // cambios aún sin subir {codigo: bool}
const OLD_KEY = "doomsday-timeline-progress"; // avance de la versión solo-localStorage

const list = document.getElementById("list");
const statusEl = document.getElementById("status");
const syncForm = document.getElementById("sync-form");
const syncUser = document.getElementById("sync-user");

let DATA = [];
let done = new Set();
let recordIds = {};
let pending = {};
let filter = "todo";
let pb = null;
let online = false;
let flushing = false;
let loadFailed = false;

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function writeJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
}

const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/* ─────────────────────────────────────────
   RENDER DE BLOQUES
───────────────────────────────────────── */
function render() {
  if (!DATA.length) {
    list.innerHTML = `<p class="empty">${loadFailed ? "No se pudo cargar la lista. Revisa que PocketBase y ngrok estén corriendo en el teléfono." : "Cargando lista…"}</p>`;
    document.getElementById("total").textContent = 0;
    return;
  }
  list.innerHTML = DATA.map((block, i) => `<section class="plate${block.aside ? " aside" : ""}" data-block="${i}"><span class="rv"></span><span class="rv2"></span>
  <div class="plate-head"><span class="plate-num">${esc(block.tag)}</span><h2 class="plate-name">${esc(block.name)}</h2><span class="plate-tally" data-tally="${i}"></span></div>
  ${block.note ? `<p class="plate-note">${esc(block.note)}</p>` : ""}
  <ul>${block.items.map(it => `<li class="row" data-id="${esc(it.id)}"><input type="checkbox" id="${esc(it.id)}" aria-label="${esc(it.t)}"><label class="info" for="${esc(it.id)}"><span class="title">${esc(it.t)}</span><span class="metaline">${it.u ? `<em>${esc(it.u)}</em> · ` : ""}${esc(it.k)} · estreno ${esc(it.r)} — ${esc(it.n)}</span></label><span class="tag t-${esc(it.p)}">${esc(it.p)}</span></li>`).join("")}</ul></section>`).join("");
  document.getElementById("total").textContent = countable();
}

const allItems = () => DATA.flatMap(b => b.items);
const countable = () => allItems().filter(i => i.p !== "pendiente").length;

/* ─────────────────────────────────────────
   PINTADO DE ESTADO / FILTROS
───────────────────────────────────────── */
function paint() {
  let seen = 0;
  DATA.forEach((block, i) => {
    let c = 0;
    block.items.forEach(it => {
      const row = list.querySelector(`[data-id="${it.id}"]`);
      const box = row.querySelector("input");
      const on = done.has(it.id);
      box.checked = on;
      row.classList.toggle("done", on);
      if (on) { c++; if (it.p !== "pendiente") seen++; }
      let show = true;
      if (filter === "esencial") show = it.p === "esencial";
      else if (filter === "core") show = it.p === "esencial" || it.p === "recomendado";
      else if (filter === "pendiente") show = !on;
      row.classList.toggle("hidden", !show);
    });
    list.querySelector(`[data-tally="${i}"]`).textContent = `${c} / ${block.items.length}`;
    const anyVisible = block.items.some(it => !list.querySelector(`[data-id="${it.id}"]`).classList.contains("hidden"));
    list.querySelector(`[data-block="${i}"]`).style.display = anyVisible ? "" : "none";
  });
  const total = countable();
  document.getElementById("seen").textContent = seen;
  document.getElementById("fill").style.width = (total ? seen / total * 100 : 0) + "%";
}

function updateStatus(msg) {
  const n = Object.keys(pending).length;
  const logged = pb && pb.authStore.isValid;
  syncForm.hidden = !!logged;
  syncUser.hidden = !logged;
  if (logged) syncUser.querySelector("span").textContent = pb.authStore.record?.email || "";
  if (msg) statusEl.textContent = msg;
  else if (!pb) statusEl.textContent = "Sin servidor configurado";
  else if (!online) statusEl.textContent = n ? `Sin conexión · ${n} cambios en espera` : "Sin conexión · copia local";
  else if (!logged) statusEl.textContent = n ? `Inicia sesión para subir ${n} cambios` : "Inicia sesión para guardar";
  else statusEl.textContent = n ? `Subiendo ${n} cambios…` : "Sincronizado";
}

/* ─────────────────────────────────────────
   POCKETBASE
───────────────────────────────────────── */
function connect(url) {
  pb = new PocketBase(url);
  pb.autoCancellation(false);
  // ngrok muestra una página de aviso en vez de la respuesta si no va este header
  pb.beforeSend = (u, options) => {
    options.headers = Object.assign({}, options.headers, { "ngrok-skip-browser-warning": "1" });
    return { url: u, options };
  };
}

async function fetchRemote() {
  const [bloques, titulos] = await Promise.all([
    pb.collection("marvel_bloques").getFullList({ sort: "orden" }),
    pb.collection("marvel_titulos").getFullList({ sort: "orden" }),
  ]);
  recordIds = {};
  done = new Set();
  DATA = bloques.map(b => ({
    tag: b.tag, name: b.nombre, note: b.nota, aside: b.aparte,
    items: titulos.filter(t => t.bloque === b.id).map(t => {
      recordIds[t.codigo] = t.id;
      if (t.vista) done.add(t.codigo);
      return { id: t.codigo, t: t.titulo, u: t.ubicacion, r: t.estreno, k: t.tipo, p: t.prioridad, n: t.nota };
    }),
  }));
  // lo que todavía no se subió manda sobre lo que dice el servidor
  for (const [codigo, on] of Object.entries(pending)) on ? done.add(codigo) : done.delete(codigo);
}

async function flush() {
  if (flushing || !online || !pb.authStore.isValid) return;
  flushing = true;
  try {
    for (const [codigo, on] of Object.entries(pending)) {
      if (!recordIds[codigo]) { delete pending[codigo]; continue; } // título que ya no existe
      await pb.collection("marvel_titulos").update(recordIds[codigo], { vista: on });
      if (pending[codigo] === on) delete pending[codigo]; // pudo cambiar mientras se subía
      writeJSON(PENDING_KEY, pending);
    }
  } catch (e) {
    if (e.status === 401 || e.status === 403) updateStatus("Sin permiso para guardar — revisa la updateRule");
    else if (e.status === 404) updateStatus("No se encontró la colección o el título en PocketBase");
    else { online = false; updateStatus(); }
    return;
  } finally {
    flushing = false;
  }
  if (Object.keys(pending).length) return flush();
  updateStatus();
}

async function sync() {
  if (!pb) { updateStatus(); return; }
  try {
    if (pb.authStore.isValid) await pb.collection("users").authRefresh().catch(e => { if (e.status === 401) pb.authStore.clear(); });
    await fetchRemote();
    online = true;
  } catch (e) {
    online = false;
    loadFailed = true;
    if (!DATA.length) render();
    updateStatus();
    return;
  }
  writeJSON(CACHE_KEY, { data: DATA, done: [...done] });
  render(); paint(); updateStatus();
  await flush();
}

/* ─────────────────────────────────────────
   EVENTOS
───────────────────────────────────────── */
function setDone(codigo, on) {
  on ? done.add(codigo) : done.delete(codigo);
  pending[codigo] = on;
}

function commit() {
  writeJSON(PENDING_KEY, pending);
  writeJSON(CACHE_KEY, { data: DATA, done: [...done] });
  paint(); updateStatus();
  if (pb) flush();
}

list.addEventListener("change", e => {
  if (e.target.type !== "checkbox") return;
  setDone(e.target.id, e.target.checked);
  commit();
});

document.querySelectorAll(".chip").forEach(btn => {
  btn.addEventListener("click", () => {
    filter = btn.dataset.filter;
    document.querySelectorAll(".chip").forEach(b => b.setAttribute("aria-pressed", String(b === btn)));
    paint();
  });
});

document.getElementById("reset").addEventListener("click", () => {
  [...done].forEach(codigo => setDone(codigo, false));
  commit();
});

syncForm.addEventListener("submit", async e => {
  e.preventDefault();
  const f = new FormData(syncForm);
  updateStatus("Conectando…");
  try {
    await pb.collection("users").authWithPassword(f.get("email"), f.get("password"));
    syncForm.reset();
  } catch (err) {
    updateStatus(err.status === 400 ? "Correo o contraseña incorrectos" : "No se pudo conectar al servidor");
    return;
  }
  sync();
});

document.getElementById("logout").addEventListener("click", () => {
  pb.authStore.clear();
  updateStatus();
});

// al volver a la pestaña trae lo que marcaste en otro dispositivo
document.addEventListener("visibilitychange", () => { if (!document.hidden) sync(); });
window.addEventListener("online", sync);

/* ─────────────────────────────────────────
   CUENTA REGRESIVA
───────────────────────────────────────── */
function tick() {
  const diff = new Date("2026-12-18T00:00:00") - new Date();
  if (diff <= 0) {
    document.getElementById("cd").innerHTML = '<div class="cd-num">Ya está en cines</div>';
    return;
  }
  document.getElementById("cd-d").textContent = Math.floor(diff / 86400000);
  document.getElementById("cd-h").textContent = String(Math.floor(diff % 86400000 / 3600000)).padStart(2, "0");
  document.getElementById("cd-m").textContent = String(Math.floor(diff % 3600000 / 60000)).padStart(2, "0");
}
tick();
setInterval(tick, 30000);

/* ─────────────────────────────────────────
   ARRANQUE — primero la copia local, luego el servidor
───────────────────────────────────────── */
pending = readJSON(PENDING_KEY, {});
readJSON(OLD_KEY, []).forEach(codigo => { pending[codigo] = true; });
try { localStorage.removeItem(OLD_KEY); } catch (e) {}
writeJSON(PENDING_KEY, pending);

const cache = readJSON(CACHE_KEY, null);
if (cache) {
  DATA = cache.data;
  done = new Set(cache.done);
  for (const [codigo, on] of Object.entries(pending)) on ? done.add(codigo) : done.delete(codigo);
}
render();
if (DATA.length) paint();

connect(PB_URL);
updateStatus();
sync();
