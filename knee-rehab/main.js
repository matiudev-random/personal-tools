const currentWeek = getCurrentWeek();
const currentPhaseIndex = getPhaseForWeek(currentWeek);
let activePhaseIndex = currentPhaseIndex;
let expanded = {};

const pad = n => String(n).padStart(2, "0");

/* Estado de cada fase respecto a la semana actual */
const PHASE_STATE = {
  past:     { label: "Completada", color: "green", pulse: false },
  current:  { label: "En curso",   color: "red",   pulse: true  },
  upcoming: { label: "Próxima",    color: "muted", pulse: false },
};
const phaseState = i => i < currentPhaseIndex ? "past" : i === currentPhaseIndex ? "current" : "upcoming";
const statusTag = i => {
  const st = PHASE_STATE[phaseState(i)];
  return `<span class="status ${st.color}"><span class="led${st.pulse ? " pulse" : ""}"></span>${st.label}</span>`;
};

/* Advertencias: "ok: …" / "ojo: …" / "no: …" → LED de color */
const WARN_KIND = { ok: "green", ojo: "amber", no: "red" };
function warningRow(w) {
  const m = w.match(/^(ok|ojo|no):\s*(.*)$/);
  const color = m ? WARN_KIND[m[1]] : "muted";
  return `<div class="warning-item ${color}"><span class="led"></span><span>${m ? m[2] : w}</span></div>`;
}

/* ─── RENDER ─── */
function render() {
  const phase = phases[activePhaseIndex];

  /* Nav */
  document.getElementById("phaseNav").innerHTML = phases
    .map((p, i) => {
      const st = PHASE_STATE[phaseState(i)];
      return `
    <button class="phase-btn ${i === activePhaseIndex ? "active" : ""}" onclick="setPhase(${i})">
      <span class="status ${st.color}"><span class="led${st.pulse ? " pulse" : ""}"></span></span>
      ${p.name}
    </button>`;
    })
    .join("");

  /* Indicador en header */
  document.getElementById("headerPhase").innerHTML =
    `<span class="hp-label">Semana</span><span class="hp-value num">${pad(currentWeek)}</span>`;

  /* Contenido principal */
  let html = `
    <div class="eyebrow red">${pad(activePhaseIndex + 1)} — Semana ${pad(currentWeek)} de recuperación</div>
    <div class="phase-card corner">
      <div class="phase-header">
        <span class="code">F-${pad(phase.id)}</span>
        ${statusTag(activePhaseIndex)}
      </div>
      <h2 class="phase-title">${phase.name} <span class="phase-subtitle">— ${phase.subtitle}</span></h2>
      <p class="phase-desc">${phase.description}</p>
      <div class="phase-foot"><span class="tag">${phase.weeks}</span></div>
    </div>
  `;

  phase.days.forEach((day, di) => {
    html += `<div class="day-label">${day.label}</div>`;
    day.sessions.forEach((session, si) => {
      const key = `${di}-${si}`;
      const isOpen = expanded[key] !== false;
      html += `
        <div class="session-box">
          <button class="session-header" onclick="toggleSession('${key}')">
            <span>${session.name}</span>
            <span class="session-count num">${pad(session.exercises.length)} EJ.</span>
            <span class="session-toggle">${isOpen ? "−" : "+"}</span>
          </button>
          <div class="${isOpen ? "" : "hidden"}">
            ${session.exercises
              .map((ex, ei) => {
                const state = getExerciseState(ex.weekRange);
                const weekTag = state === 'upcoming'
                  ? ` <span class="ex-state-tag">Sem ${ex.weekRange[0]}${ex.weekRange[1] !== null ? '–' + ex.weekRange[1] : '+'}</span>`
                  : '';
                return `
              <div class="exercise-row ex-${state}" style="animation-delay: ${ei * 50}ms">
                <div>
                  <div class="ex-name">${ex.name}${weekTag}</div>
                  <div class="ex-note">${ex.note}</div>
                </div>
                <div class="badge-sets">${ex.sets}</div>
                <div class="badge-reps">${ex.reps}</div>
              </div>`;
              })
              .join("")}
          </div>
        </div>
      `;
    });
  });

  html += `
    <section class="panel">
      <div class="panel-head"><h2>Reglas de esta fase</h2></div>
      ${phase.warnings.map(warningRow).join("")}
    </section>
  `;

  document.getElementById("phaseContent").innerHTML = html;

  /* En móvil la barra de fases se desplaza: deja visible la activa */
  const nav = document.getElementById("phaseNav");
  const act = nav.querySelector(".phase-btn.active");
  if (act) nav.scrollLeft = act.offsetLeft - (nav.clientWidth - act.offsetWidth) / 2;
}

function setPhase(i) {
  activePhaseIndex = i;
  expanded = {};
  render();
}

function toggleSession(key) {
  expanded[key] = expanded[key] === false ? true : false;
  render();
}

/* ─── SECCIONES ESTÁTICAS ─── */
document.getElementById("painRules").innerHTML = ruleOfPain
  .map(
    (r) => `
  <div class="pain-row ${r.color}">
    <span class="pain-level num">${r.level}</span>
    <span class="status"><span class="led"></span>${r.label}</span>
    <span class="pain-action">${r.action}</span>
  </div>
`,
  )
  .join("");


document.getElementById("habits").innerHTML = habitsData
  .map(
    (h, i) => `
  <div class="habit-row">
    <span class="code">${pad(i + 1)}</span>
    <div>
      <div class="habit-title">${h[0]}</div>
      <div class="habit-desc">${h[1]}</div>
    </div>
  </div>
`,
  )
  .join("");

render();
