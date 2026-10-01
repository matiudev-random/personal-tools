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
