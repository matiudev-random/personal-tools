/* Colecciones y backups */
async function loadData() {
  let cols, backups;
  try {
    [cols, backups] = await Promise.all([
      pb.collections.getFullList({ batch: 200 }),
      pb.backups.getFullList().catch(() => []),
    ]);
  } catch (err) {
    if (err.status === 401 || err.status === 403) throw err;
    cardError("data-card", "Datos", err); return;
  }
  const own = cols.filter(c => !c.system).sort((a, b) => a.name.localeCompare(b.name));
  const counts = await Promise.all(own.map(c =>
    pb.collection(c.name).getList(1, 1, { fields: "id" }).then(r => r.totalItems).catch(() => null)));
  const maxN = Math.max(1, ...counts.filter(n => n != null));
  const bkSize = backups.reduce((a, b) => a + (b.size || 0), 0);

  $("data-card").innerHTML = `<div class="card-head"><h3>Datos</h3><span class="card-meta">${own.length} colecciones</span></div>
    <ul class="cols">${own.map((c, i) => `<li>
      <span class="col-name">${esc(c.name)}${c.type === "auth" ? ' <em>auth</em>' : ""}</span>
      <span class="col-bar"><span style="width:${counts[i] != null ? Math.max(1.5, counts[i] / maxN * 100) : 0}%"></span></span>
      <span class="col-n">${counts[i] == null ? "—" : fmtN(counts[i])}</span>
    </li>`).join("")}</ul>
    <p class="row-sub">Backups guardados: <b>${backups.length}</b>${backups.length ? ` · ${(bkSize / 1048576).toFixed(1).replace(".", ",")} MB` : ""}</p>`;
}
