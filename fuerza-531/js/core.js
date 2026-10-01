/* ─────────────────────────────────────────
   FUERZA 5/3/1 — tracker
   Datos en PocketBase (colecciones "fuerza_tms" y "fuerza_sesiones").
   Primero muestra la copia local; los cambios sin conexión quedan en cola.
───────────────────────────────────────── */
const COL_TMS = "fuerza_tms";
const COL_SES = "fuerza_sesiones";

const CACHE_KEY = "fuerza-cache";     // { tms, sesiones }
const PENDING_KEY = "fuerza-pending"; // cola de operaciones sin subir
const DRAFT_KEY = "fuerza-draft";     // lo que vas anotando en el gym, por día
const UI_KEY = "fuerza-ui";

let tms = [];
let sesiones = [];
let pending = [];
let drafts = {};
let ui = { view: "train", day: null };
let pb = null;
let online = false;
let flushing = false;

/* ─────────────────────────────────────────
   UTILIDADES
───────────────────────────────────────── */
function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) { return fallback; }
}
function writeJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
}

const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const fmt = n => (n == null || isNaN(n)) ? "—" : String(Math.round(n * 100) / 100).replace(".", ",");
const num = v => { if (v === "" || v == null) return null; const n = Number(String(v).replace(",", ".")); return isNaN(n) ? null : n; };

// ids propios de 15 caracteres: si una subida se repite, PocketBase la rechaza en vez de duplicarla
function newId() {
  const a = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  const r = crypto.getRandomValues(new Uint8Array(15));
  for (const b of r) s += a[b % a.length];
  return s;
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const toPbDate = ymd => `${ymd} 12:00:00.000Z`;          // mediodía UTC: no se corre de día en Chile
const ymdOf = pbDate => String(pbDate || "").slice(0, 10);
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
function prettyDate(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  return `${d} ${MESES[m - 1]}${y !== new Date().getFullYear() ? " " + y : ""}`;
}

function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 2600);
}
