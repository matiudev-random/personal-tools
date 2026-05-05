const DEFAULT_PLAYERS = [
  { name: "Diego", pos: "ARQ", skill: 7, selected: true },
  { name: "Lalo", pos: "DEF", skill: 7, selected: true },
  { name: "Joako", pos: "DEF", skill: 5, selected: true },
  { name: "Omar", pos: "DEF", skill: 7, selected: true },
  { name: "Erick", pos: "DEF", skill: 3, selected: true },
  { name: "Pancho", pos: "MED", skill: 9, selected: true },
  { name: "Goti Goti", pos: "MED", skill: 5, selected: true },
  { name: "Dixon", pos: "MED", skill: 8, selected: true },
  { name: "Matias", pos: "DEL", skill: 8, selected: true },
  { name: "Shagy", pos: "DEL", skill: 7, selected: true },
  { name: "Alejandro", pos: "DEL", skill: 9, selected: true },
  { name: "Sexpeda", pos: "DEL", skill: 9, selected: true },
  { name: "Pato", pos: "DEL", skill: 6, selected: true },
];

let players = DEFAULT_PLAYERS.map((p, i) => ({ ...p, id: i }));
let nextId = players.length;
let spinning = false;
let animFrame = null;
let currentAngle = 0;

function switchTab(t) {
  document.getElementById("tab-list").style.display =
    t === "list" ? "block" : "none";
  document.getElementById("tab-add").style.display =
    t === "add" ? "block" : "none";
  document.querySelectorAll(".mode-tab").forEach((el, i) => {
    el.classList.toggle(
      "active",
      (i === 0 && t === "list") || (i === 1 && t === "add"),
    );
  });
}

function renderPlayers() {
  const ul = document.getElementById("player-list");
  const sel = players.filter((p) => p.selected).length;
  ul.innerHTML = "";
  players.forEach((p) => {
    const li = document.createElement("li");
    li.className = "player-item" + (p.selected ? " selected" : "");
    li.innerHTML = `<div class="player-check"><span class="check-icon">✓</span></div>
      <span class="player-name">${p.name}</span>
      <span class="player-pos">${p.pos}</span>
      <span class="player-skill">${p.skill}</span>
      <button class="btn btn-danger btn-sm" style="padding:4px 8px;font-size:9px;margin-left:4px" onclick="removePlayer(${p.id},event)">✕</button>`;
    li.onclick = (e) => {
      if (e.target.tagName === "BUTTON") return;
      p.selected = !p.selected;
      renderPlayers();
      updateRoulette();
    };
    ul.appendChild(li);
  });
  document.getElementById("sel-count").textContent = sel;
  document.getElementById("counter-badge").textContent =
    `${sel} / ${players.length}`;
  document.getElementById("selected-count-label").textContent = sel;
}

function removePlayer(id, e) {
  e.stopPropagation();
  players = players.filter((p) => p.id !== id);
  renderPlayers();
  updateRoulette();
}

function toggleAll() {
  const allSel = players.every((p) => p.selected);
  players.forEach((p) => (p.selected = !allSel));
  renderPlayers();
  updateRoulette();
}

function addPlayer() {
  const name = document.getElementById("new-name").value.trim();
  if (!name) return;
  const pos = document.getElementById("new-pos").value;
  const skill = parseInt(document.getElementById("new-skill").value);
  players.push({ name, pos, skill, selected: true, id: nextId++ });
  document.getElementById("new-name").value = "";
  renderPlayers();
  updateRoulette();
  switchTab("list");
}

const canvas = document.getElementById("roulette");
const ctx = canvas.getContext("2d");
const W = 320,
  H = 320,
  CX = W / 2,
  CY = H / 2,
  R = 145;

function drawRoulette(angle) {
  ctx.clearRect(0, 0, W, H);
  const sel = players.filter((p) => p.selected);
  if (sel.length === 0) {
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.fillStyle = "#181818";
    ctx.fill();
    ctx.strokeStyle = "#272727";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#444";
    ctx.font = "13px Space Mono";
    ctx.textAlign = "center";
    ctx.fillText("Sin jugadores", CX, CY);
    return;
  }
  const slice = (Math.PI * 2) / sel.length;
  const colors = [
    "#ff6a00",
    "#c45200",
    "#ff8c3a",
    "#e05500",
    "#ff7a1a",
    "#b84d00",
    "#ff9955",
    "#d46000",
  ];
  sel.forEach((p, i) => {
    const a = angle + i * slice;
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.arc(CX, CY, R, a, a + slice);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    ctx.strokeStyle = "#0a0a0a";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate(a + slice / 2);
    ctx.textAlign = "right";
    const fs = sel.length > 12 ? 9 : sel.length > 8 ? 10 : 12;
    ctx.font = `700 ${fs}px Space Mono`;
    ctx.fillStyle = "#0a0a0a";
    const maxLen = sel.length > 10 ? 8 : 12;
    const nm =
      p.name.length > maxLen ? p.name.substring(0, maxLen - 1) + "…" : p.name;
    ctx.fillText(nm, R - 8, 4);
    ctx.restore();
  });
  ctx.beginPath();
  ctx.arc(CX, CY, 24, 0, Math.PI * 2);
  ctx.fillStyle = "#111";
  ctx.fill();
  ctx.strokeStyle = "#272727";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#f0ebe0";
  ctx.font = "bold 11px Space Mono";
  ctx.textAlign = "center";
  ctx.fillText("GO", CX, CY + 4);
}

function updateRoulette() {
  drawRoulette(currentAngle);
}

function balancedSplit(sel) {
  const sorted = [...sel].sort((a,b) => b.skill - a.skill);
  const tA = [], tB = [];
  let sA = 0, sB = 0;
  for (const p of sorted) {
    if (sA <= sB) { tA.push(p); sA += p.skill; }
    else          { tB.push(p); sB += p.skill; }
  }
  return [tA, tB];
}


function startSorteo() {
  if (spinning) return;
  const sel = players.filter((p) => p.selected);
  if (sel.length < 2) {
    alert("Selecciona al menos 2 jugadores.");
    return;
  }
  document.getElementById("teams-output").style.display = "none";
  spinning = true;
  document.getElementById("btn-sortear").disabled = true;
  const state = document.getElementById("spin-state");
  state.classList.add("active");
  document.getElementById("spin-msg").textContent = "Sorteando jugadores...";
  const totalRot = Math.PI * 2 * 6 + Math.random() * Math.PI * 2;
  const duration = 3200;
  const start = performance.now();
  const startAngle = currentAngle;
  function easeOut(t) {
    return 1 - Math.pow(1 - t, 3);
  }
  function frame(now) {
    const t = Math.min((now - start) / duration, 1);
    const ease = easeOut(t);
    currentAngle = startAngle + totalRot * ease;
    drawRoulette(currentAngle);
    if (t < 1) {
      animFrame = requestAnimationFrame(frame);
    } else {
      spinning = false;
      document.getElementById("btn-sortear").disabled = false;
      showTeams(sel);
      document.getElementById("spin-msg").textContent = "¡Equipos listos!";
      setTimeout(() => state.classList.remove("active"), 1500);
    }
  }
  animFrame = requestAnimationFrame(frame);
}

function showTeams(sel) {
  const [tA, tB] = balancedSplit(sel);
  const avgA = (tA.reduce((s, p) => s + p.skill, 0) / tA.length).toFixed(1);
  const avgB = (tB.reduce((s, p) => s + p.skill, 0) / tB.length).toFixed(1);
  document.getElementById("avg-a").textContent = "Prom " + avgA;
  document.getElementById("avg-b").textContent = "Prom " + avgB;
  const ra = document.getElementById("team-a-players");
  const rb = document.getElementById("team-b-players");
  ra.innerHTML = "";
  rb.innerHTML = "";
  tA.forEach((p) => {
    ra.innerHTML += `<div class="team-player"><span class="team-player-name">${p.name}</span><span style="font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#444;margin-right:6px">${p.pos}</span><span class="team-player-skill">${p.skill}</span></div>`;
  });
  tB.forEach((p) => {
    rb.innerHTML += `<div class="team-player"><span class="team-player-name">${p.name}</span><span style="font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#444;margin-right:6px">${p.pos}</span><span class="team-player-skill">${p.skill}</span></div>`;
  });
  document.getElementById("teams-output").style.display = "block";
  document
    .getElementById("teams-output")
    .scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetSorteo() {
  document.getElementById("teams-output").style.display = "none";
  document.getElementById("spin-state").classList.remove("active");
  currentAngle = 0;
  drawRoulette(0);
}

renderPlayers();
drawRoulette(0);
