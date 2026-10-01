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
