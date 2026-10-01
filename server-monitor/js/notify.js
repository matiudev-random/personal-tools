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
