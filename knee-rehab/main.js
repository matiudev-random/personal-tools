const currentWeek = getCurrentWeek();
let activePhaseIndex = getPhaseForWeek(currentWeek);
let expanded = {};

/* ─── RENDER ─── */
function render() {
  const phase = phases[activePhaseIndex];

  /* Nav */
  document.getElementById("phaseNav").innerHTML = phases
    .map(
      (p, i) => `
    <button class="phase-btn ${i === activePhaseIndex ? "active" : ""}"
            onclick="setPhase(${i})"
            style="${
              i === activePhaseIndex
                ? `border-bottom: 2px solid ${p.color}; color: ${p.color};`
                : ""
            }">
      ${p.icon} ${p.name}
    </button>
  `,
    )
    .join("");

  /* Indicador en header */
  document.getElementById("headerPhase").textContent =
    `Sem. ${currentWeek} · ${phase.icon} ${phase.name}`;

  /* Contenido principal */
  let html = `
    <div class="current-week-banner">📍 Semana ${currentWeek} de recuperación</div>
    <div class="phase-card" style="color: ${phase.color};">
      <div class="phase-header">
        <div>
          <span class="phase-title" style="color: ${phase.color}">${phase.name}</span>
          <span class="phase-subtitle">${phase.subtitle}</span>
        </div>
        <span class="week-badge" style="background: ${phase.color}18; color: ${phase.color}; border-color: ${phase.color}44;">
          ${phase.weeks}
        </span>
      </div>
      <p class="phase-desc">${phase.description}</p>
    </div>
  `;

  phase.days.forEach((day, di) => {
    html += `<div class="day-label">📅 ${day.label}</div>`;
    day.sessions.forEach((session, si) => {
      const key = `${di}-${si}`;
      const isOpen = expanded[key] !== false;
      html += `
        <div class="session-box">
          <button class="session-header" onclick="toggleSession('${key}')">
            <span>${session.name}</span>
            <span class="session-toggle">${isOpen ? "−" : "+"}</span>
          </button>
          <div class="${isOpen ? "" : "hidden"}">
            ${session.exercises
              .map((ex, ei) => {
                const state = getExerciseState(ex.weekRange);
                const weekTag = state === 'upcoming'
                  ? ` <span class="ex-state-tag ex-tag-upcoming">Sem ${ex.weekRange[0]}${ex.weekRange[1] !== null ? '–' + ex.weekRange[1] : '+'}</span>`
                  : '';
                return `
              <div class="exercise-row ex-${state}" style="animation-delay: ${ei * 50}ms">
                <div>
                  <div class="ex-name">${ex.name}</div>
                  <div class="ex-note">${ex.note}${weekTag}</div>
                </div>
                <div class="badge-sets" style="color: ${phase.color}">${ex.sets}</div>
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
    <div class="info-block" style="margin-top: 8px; border-left: 2px solid ${phase.color}44">
      <div class="info-title">Reglas de esta fase</div>
      ${phase.warnings.map((w) => `<div class="warning-item">${w}</div>`).join("")}
    </div>
  `;

  document.getElementById("phaseContent").innerHTML = html;
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
  <div class="pain-row">
    <span style="color: ${r.color}; font-weight: bold">${r.level}</span>
    <span style="background: ${r.color}1a; color: ${r.color}; border-radius: 3px; padding: 3px 8px; text-align: center; font-size: 10px; letter-spacing: 1px;">${r.label}</span>
    <span style="color: #aaa; font-size: 12px">${r.action}</span>
  </div>
`,
  )
  .join("");


document.getElementById("habits").innerHTML = habitsData
  .map(
    (h) => `
  <div class="habit-row">
    <span style="font-size: 18px">${h[0]}</span>
    <div>
      <div style="font-size: 12px; color: #e5e0d8; font-family: var(--font-mono); letter-spacing: 1px; text-transform: uppercase;">${h[1]}</div>
      <div style="font-size: 11px; color: #555; font-style: italic; font-family: var(--font-serif); margin-top: 2px">${h[2]}</div>
    </div>
  </div>
`,
  )
  .join("");

render();
