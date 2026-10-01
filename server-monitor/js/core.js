/* ─────────────────────────────────────────
   MONITOR — servidor casero (Termux + PocketBase + ngrok)
   · Estado público: /api/health cada 30 s, sin login.
   · Panel admin: logs, accesos fallidos, revisión de seguridad,
     colecciones, backups y datos del teléfono (hook opcional).
───────────────────────────────────────── */
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
