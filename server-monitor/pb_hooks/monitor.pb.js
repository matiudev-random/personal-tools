/// <reference path="../pb_data/types.d.ts" />

/*
  Hook para el panel MONITOR (tarjeta "Teléfono").
  Copia este archivo a la carpeta pb_hooks (al lado de pb_data) y reinicia PocketBase.
  GET /api/monitor/device  → batería, temperatura, RAM, espacio libre, uptime y carga.
  Solo para superusuarios.
*/
routerAdd("GET", "/api/monitor/device", (e) => {
  // Los handlers de PocketBase no ven variables de fuera: todo va aquí dentro.
  const run = (...args) => {
    try { return toString($os.cmd(...args).output()).trim(); } catch (_) { return ""; }
  };
  const read = (path) => {
    try { return toString($os.readFile(path)); } catch (_) { return ""; }
  };

  const out = {};

  // Batería (necesita la app Termux:API y `pkg install termux-api`).
  // El timeout evita que la petición se quede colgada si la app no responde.
  const bat = run("timeout", "6", "termux-battery-status");
  if (bat) {
    try {
      const b = JSON.parse(bat);
      if (b.percentage != null) {
        out.battery = {
          percent: b.percentage,
          status: b.status || "",
          plugged: b.plugged || "",
          temp: b.temperature != null ? b.temperature : null,
          health: b.health || "",
        };
      }
    } catch (_) {}
  }

  // Tiempo encendido
  const up = parseFloat(read("/proc/uptime").split(" ")[0]);
  if (!isNaN(up)) out.uptimeSec = Math.round(up);

  // RAM
  const mem = read("/proc/meminfo");
  const kb = (key) => {
    const m = mem.match(new RegExp("^" + key + ":\\s+(\\d+)", "m"));
    return m ? parseInt(m[1], 10) : null;
  };
  const total = kb("MemTotal"), avail = kb("MemAvailable");
  if (total && avail != null) {
    out.memTotalMB = Math.round(total / 1024);
    out.memAvailMB = Math.round(avail / 1024);
  }

  // Disco (la partición donde vive pb_data)
  const df = run("df", "-k", $app.dataDir());
  const lines = df.split("\n").filter((l) => l.trim());
  if (lines.length >= 2) {
    const cols = lines[lines.length - 1].trim().split(/\s+/);
    const t = parseInt(cols[1], 10), a = parseInt(cols[3], 10);
    if (t > 0 && !isNaN(a)) {
      out.diskTotalMB = Math.round(t / 1024);
      out.diskFreeMB = Math.round(a / 1024);
    }
  }

  // Carga de CPU (algunos Android no dejan leerla; entonces no se muestra)
  const load = read("/proc/loadavg").trim().split(/\s+/).slice(0, 3).map(Number);
  if (load.length === 3 && load.every((n) => !isNaN(n))) out.load = load;

  return e.json(200, out);
}, $apis.requireSuperuserAuth());
