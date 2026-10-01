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
