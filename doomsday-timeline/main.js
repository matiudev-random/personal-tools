/* ─────────────────────────────────────────
   DATA — orden cronológico interno del UCM
───────────────────────────────────────── */
const DATA = [
{tag:"Bloque 1",name:"El pasado remoto",note:"Todo lo ambientado antes de que existieran los Vengadores.",items:[
{id:"f6b",t:"Eyes of Wakanda",u:"1260 a.C. al siglo XX",r:"2025",k:"Serie animada · 4 ep.",p:"opcional",n:"Los Perros de Guerra wakandianos a través de la historia"},
{id:"f1e",t:"Capitán América: El primer vengador",u:"1943-1945",r:"2011",k:"Película",p:"esencial",n:"Steve Rogers y el Teseracto; Steve vuelve en Doomsday"},
{id:"f3i",t:"Capitana Marvel",u:"1995",r:"2019",k:"Película",p:"recomendado",n:"El pasado de Nick Fury y el primer contacto cósmico"}]},
{tag:"Bloque 2",name:"Nace la era de los héroes",note:"De la cueva de Tony Stark a la batalla de Nueva York.",items:[
{id:"f1a",t:"Iron Man",u:"2010",r:"2008",k:"Película",p:"recomendado",n:"El arco que RDJ cierra y ahora invierte como Doctor Doom"},
{id:"f1c",t:"Iron Man 2",u:"2011",r:"2010",k:"Película",p:"opcional",n:"Presenta a Viuda Negra y a Rhodey con armadura"},
{id:"f1b",t:"El increíble Hulk",u:"2011",r:"2008",k:"Película",p:"opcional",n:"La más aislada; su villano reaparece en Brave New World"},
{id:"f1d",t:"Thor",u:"2011",r:"2011",k:"Película",p:"recomendado",n:"Thor y Loki, dos piezas grandes del final"},
{id:"f1f",t:"Los Vengadores",u:"2012",r:"2012",k:"Película",p:"esencial",n:"El equipo se forma; el molde de todo lo que viene"}]},
{tag:"Bloque 3",name:"El universo se ensancha",note:"Cae S.H.I.E.L.D., llega lo cósmico y aparece el Reino Cuántico.",items:[
{id:"f2a",t:"Iron Man 3",u:"Navidad de 2012",r:"2013",k:"Película",p:"opcional",n:"Aquí sale Trevor Slattery, que reaparece en Wonder Man"},
{id:"f2b",t:"Thor: El mundo oscuro",u:"2013",r:"2013",k:"Película",p:"opcional",n:"La más prescindible de toda la saga"},
{id:"f2c",t:"Capitán América: El Soldado de Invierno",u:"2014",r:"2014",k:"Película",p:"recomendado",n:"Bucky, Sam Wilson y el derrumbe de S.H.I.E.L.D."},
{id:"f2d",t:"Guardianes de la Galaxia",u:"2014",r:"2014",k:"Película",p:"recomendado",n:"Se abre el frente cósmico"},
{id:"f3c",t:"Guardianes de la Galaxia Vol. 2",u:"2014",r:"2017",k:"Película",p:"opcional",n:"Ocurre pocos meses después de la primera"},
{id:"f2e",t:"Vengadores: La era de Ultron",u:"2015",r:"2015",k:"Película",p:"recomendado",n:"Nacen Visión y la Bruja Escarlata"},
{id:"f2f",t:"Ant-Man",u:"2015",r:"2015",k:"Película",p:"recomendado",n:"El Reino Cuántico entra al tablero"}]},
{tag:"Bloque 4",name:"La ruptura y Thanos",note:"El equipo se parte en dos y llega el chasquido.",items:[
{id:"f3a",t:"Capitán América: Civil War",u:"2016",r:"2016",k:"Película",p:"esencial",n:"Rompe a los Vengadores; debutan Black Panther y Spider-Man"},
{id:"f4d",t:"Black Widow",u:"2016",r:"2021",k:"Película",p:"recomendado",n:"Ocurre justo después de Civil War; presenta a Yelena"},
{id:"f3f",t:"Black Panther",u:"2016",r:"2018",k:"Película",p:"recomendado",n:"Una semana después de Civil War; Wakanda pelea en Doomsday"},
{id:"f3d",t:"Spider-Man: Homecoming",u:"2016",r:"2017",k:"Película",p:"recomendado",n:"Peter Parker en su vida cotidiana tras Civil War"},
{id:"f3b",t:"Doctor Strange",u:"2016-2017",r:"2016",k:"Película",p:"esencial",n:"Magia, dimensiones y las primeras reglas del multiverso"},
{id:"f3e",t:"Thor: Ragnarok",u:"2017",r:"2017",k:"Película",p:"recomendado",n:"Reinventa a Thor y destruye Asgard"},
{id:"f3h",t:"Ant-Man y la Avispa",u:"2018",r:"2018",k:"Película",p:"opcional",n:"Su escena final ocurre durante el chasquido"},
{id:"f3g",t:"Vengadores: Infinity War",u:"2018",r:"2018",k:"Película",p:"esencial",n:"Innegociable"},
{id:"f3j",t:"Vengadores: Endgame",u:"2018 y salto a 2023",r:"2019",k:"Película",p:"esencial",n:"El listón que Doomsday quiere igualar"}]},
{tag:"Bloque 5",name:"Después del Blip",note:"Aquí Marvel dejó de fechar las cosas con precisión. Este tramo va ordenado por lógica narrativa, no por calendario oficial.",items:[
{id:"f4c",t:"Loki · Temporada 1",u:"fuera del tiempo",r:"2021",k:"Serie · 6 ep.",p:"esencial",n:"Arranca durante Endgame; la AVT y la ramificación del multiverso"},
{id:"f4a",t:"WandaVision",u:"3 semanas tras Endgame",r:"2021",k:"Serie · 9 ep.",p:"esencial",n:"Wanda se convierte en la Bruja Escarlata"},
{id:"f4b",t:"Falcon y el Soldado de Invierno",u:"6 meses tras Endgame",r:"2021",k:"Serie · 6 ep.",p:"esencial",n:"Sam hereda el escudo; aparece John Walker"},
{id:"f4f",t:"Shang-Chi y la leyenda de los Diez Anillos",u:"post-Blip",r:"2021",k:"Película",p:"recomendado",n:"Los Diez Anillos siguen siendo un hilo suelto"},
{id:"f4g",t:"Eternals",u:"post-Blip",r:"2021",k:"Película",p:"opcional",n:"Bastante al margen del resto"},
{id:"f3k",t:"Spider-Man: Lejos de casa",u:"8 meses tras Endgame",r:"2019",k:"Película",p:"recomendado",n:"Mysterio revela la identidad de Peter"},
{id:"f4i",t:"Spider-Man: No Way Home",u:"justo después",r:"2021",k:"Película",p:"esencial",n:"El hechizo que rompe las realidades y borra a Peter del mundo"},
{id:"f4h",t:"Hawkeye",u:"Navidad siguiente",r:"2021",k:"Serie · 6 ep.",p:"recomendado",n:"Kate Bishop, Yelena y el regreso de Kingpin"},
{id:"f4j",t:"Moon Knight",u:"sin fecha clara",r:"2022",k:"Serie · 6 ep.",p:"opcional",n:"Autoconclusiva por ahora"},
{id:"f4k",t:"Doctor Strange en el multiverso de la locura",u:"tras No Way Home",r:"2022",k:"Película",p:"esencial",n:"Incursiones, variantes y la primera visita a otra Tierra"},
{id:"f4l",t:"Ms. Marvel",u:"tras No Way Home",r:"2022",k:"Serie · 6 ep.",p:"recomendado",n:"Kamala Khan y el primer guiño mutante del UCM"},
{id:"f4m",t:"Thor: Love and Thunder",u:"tras Endgame",r:"2022",k:"Película",p:"opcional",n:"Poco impacto en la trama mayor"},
{id:"f4n",t:"She-Hulk: Abogada Hulka",u:"sin fecha clara",r:"2022",k:"Serie · 9 ep.",p:"opcional",n:"Trae de vuelta a Abominación y a Daredevil"},
{id:"f4o",t:"Werewolf by Night",u:"sin fecha clara",r:"2022",k:"Especial · 1 h",p:"opcional",n:"Terror gótico en blanco y negro"},
{id:"f4p",t:"Black Panther: Wakanda Forever",u:"tras Ms. Marvel",r:"2022",k:"Película",p:"esencial",n:"Shuri, Namor y los wakandianos que van a Doomsday"},
{id:"f4q",t:"Especial de Navidad de los Guardianes",u:"Navidad siguiente",r:"2022",k:"Especial · 45 min",p:"opcional",n:"Puro cariño, cero trama"},
{id:"f5g",t:"Echo",u:"5 meses tras Hawkeye",r:"2024",k:"Serie · 5 ep.",p:"opcional",n:"Spin-off callejero; deja a Fisk listo para Born Again"},
{id:"f5p",t:"Ironheart",u:"tras Wakanda Forever",r:"2025",k:"Serie · 6 ep.",p:"recomendado",n:"Riri Williams cruza tecnología y magia"},
{id:"f5m",t:"Daredevil: Born Again · T1",u:"tras Echo",r:"2025",k:"Serie · 9 ep.",p:"recomendado",n:"Fisk llega a alcalde y declara la ley marcial"}]},
{tag:"Bloque 6",name:"El tablero antes de Doom",note:"El presente del UCM. Doomsday arranca catorce meses después de Thunderbolts*.",items:[
{id:"f5a",t:"Ant-Man y la Avispa: Quantumania",u:"post-Blip",r:"2023",k:"Película",p:"recomendado",n:"El Reino Cuántico y el villano que Marvel acabó reemplazando"},
{id:"f5c",t:"Guardianes de la Galaxia Vol. 3",u:"post-Blip",r:"2023",k:"Película",p:"opcional",n:"Cierre emotivo del grupo"},
{id:"f5d",t:"Invasión secreta",u:"post-Blip",r:"2023",k:"Serie · 6 ep.",p:"recomendado",n:"Cambia la situación de Rhodey y del gobierno"},
{id:"f5e",t:"Loki · Temporada 2",u:"fuera del tiempo",r:"2023",k:"Serie · 6 ep.",p:"esencial",n:"Loki termina sosteniendo el multiverso entero"},
{id:"f5f",t:"The Marvels",u:"tras Invasión secreta",r:"2023",k:"Película",p:"recomendado",n:"La escena poscréditos abre la puerta a los mutantes"},
{id:"f5k",t:"Agatha All Along",u:"3 años tras WandaVision",r:"2024",k:"Serie · 9 ep.",p:"recomendado",n:"Billy Maximoff; enlaza directo con VisionQuest"},
{id:"f5j",t:"Deadpool y Lobezno",u:"tras Loki T2",r:"2024",k:"Película",p:"esencial",n:"Ancla el multiverso de Fox al UCM"},
{id:"f5n",t:"Capitán América: Brave New World",u:"tras Wakanda Forever",r:"2025",k:"Película",p:"esencial",n:"Sam ya como Capitán América y el nuevo mapa político"},
{id:"f5o",t:"Thunderbolts*",u:"tras Brave New World",r:"2025",k:"Película",p:"esencial",n:"El punto de partida directo de Doomsday"},
{id:"f6e",t:"Daredevil: Born Again · T2",u:"tras Thunderbolts*",r:"2026",k:"Serie · 9 ep.",p:"recomendado",n:"Matt y Jessica Jones contra el Fisk alcalde"},
{id:"f6f",t:"The Punisher: One Last Kill",u:"tras Born Again T2",r:"2026",k:"Especial · 1 h",p:"recomendado",n:"Puente hacia el Frank Castle de Brand New Day"},
{id:"f6d",t:"Wonder Man",u:"sin fecha clara",r:"2026",k:"Serie · 8 ep.",p:"recomendado",n:"Simon Williams y el Hollywood del UCM"},
{id:"f6h",t:"Spider-Man: Brand New Day",u:"4 años tras No Way Home",r:"2026",k:"Película",p:"esencial",n:"Lo último estrenado y la antesala inmediata"}]},
{tag:"Aparte",name:"Los otros universos",aside:true,note:"No caben en la línea temporal principal porque ocurren en realidades distintas. Dos de ellas chocan con la Tierra-616 justo en Doomsday, así que la película no se entiende sin ellas.",items:[
{id:"f6a",t:"Los 4 Fantásticos: Primeros pasos",u:"Tierra-828, años 60 retrofuturistas",r:"2025",k:"Película",p:"esencial",n:"Uno de los tres universos que convergen en Doomsday"},
{id:"f5i",t:"X-Men '97 · Temporada 1",u:"universo mutante propio",r:"2024",k:"Serie animada · 10 ep.",p:"recomendado",n:"Los X-Men que aparecen en Doomsday vienen de aquí"},
{id:"f6g",t:"X-Men '97 · Temporada 2",u:"universo mutante propio",r:"2026",k:"Serie animada · 9 ep.",p:"recomendado",n:"Apocalipsis y el origen de En Sabah Nur"},
{id:"f4e",t:"¿Qué pasaría si...? · T1",u:"realidades alternas",r:"2021",k:"Serie animada · 9 ep.",p:"opcional",n:"Antología del Vigilante"},
{id:"f5b",t:"¿Qué pasaría si...? · T2",u:"realidades alternas",r:"2023",k:"Serie animada · 9 ep.",p:"opcional",n:"Más universos sueltos"},
{id:"f5h",t:"¿Qué pasaría si...? · T3",u:"realidades alternas",r:"2024",k:"Serie animada · 8 ep.",p:"opcional",n:"Temporada final"},
{id:"f6c",t:"Marvel Zombies",u:"realidad alterna",r:"2025",k:"Serie animada · 4 ep.",p:"opcional",n:"Muy gore, totalmente aparte"},
{id:"f5l",t:"Tu amistoso vecino Spider-Man · T1",u:"universo propio",r:"2025",k:"Serie animada · 10 ep.",p:"opcional",n:"Otro origen de Peter Parker, muy disfrutable"}]},
{tag:"Aparte",name:"La era Fox y Sony",aside:true,note:"Fuera del UCM, pero es el material que No Way Home y Deadpool y Lobezno reciclan. Lo ideal es verlas antes de esas dos.",items:[
{id:"sy1",t:"Spider-Man",u:"trilogía de Sam Raimi",r:"2002",k:"Película",p:"recomendado",n:"El Duende Verde vuelve en No Way Home"},
{id:"sy2",t:"Spider-Man 2",u:"trilogía de Sam Raimi",r:"2004",k:"Película",p:"recomendado",n:"Doctor Octopus vuelve en No Way Home"},
{id:"sy3",t:"Spider-Man 3",u:"trilogía de Sam Raimi",r:"2007",k:"Película",p:"opcional",n:"Solo por Sandman"},
{id:"sy4",t:"The Amazing Spider-Man",u:"saga de Marc Webb",r:"2012",k:"Película",p:"recomendado",n:"El Peter de Andrew Garfield y el Lagarto"},
{id:"sy5",t:"The Amazing Spider-Man 2: El poder de Electro",u:"saga de Marc Webb",r:"2014",k:"Película",p:"recomendado",n:"Gwen Stacy y Electro; su peso emocional se cobra en No Way Home"},
{id:"fx1",t:"X-Men",u:"saga Fox",r:"2000",k:"Película",p:"recomendado",n:"El origen de todo el cine mutante"},
{id:"fx2",t:"X2: X-Men unidos",u:"saga Fox",r:"2003",k:"Película",p:"recomendado",n:"La mejor de la trilogía original"},
{id:"fx3",t:"X-Men: La decisión final",u:"saga Fox",r:"2006",k:"Película",p:"opcional",n:"Floja, pero cierra la trilogía"},
{id:"fx4",t:"X-Men Orígenes: Lobezno",u:"saga Fox",r:"2009",k:"Película",p:"opcional",n:"Su Deadpool es el chiste recurrente de la saga"},
{id:"fx5",t:"X-Men: Primera generación",u:"saga Fox · años 60",r:"2011",k:"Película",p:"recomendado",n:"Reinicia la saga con Xavier y Magneto jóvenes"},
{id:"fx6",t:"Lobezno inmortal",u:"saga Fox",r:"2013",k:"Película",p:"opcional",n:"Logan en Japón"},
{id:"fx7",t:"X-Men: Días del futuro pasado",u:"saga Fox",r:"2014",k:"Película",p:"recomendado",n:"Viajes en el tiempo; la más multiversal de Fox"},
{id:"fx8",t:"Deadpool",u:"saga Fox",r:"2016",k:"Película",p:"recomendado",n:"Imprescindible antes de Deadpool y Lobezno"},
{id:"fx9",t:"X-Men: Apocalipsis",u:"saga Fox",r:"2016",k:"Película",p:"opcional",n:"Presenta a Apocalipsis en imagen real"},
{id:"fxa",t:"Logan",u:"saga Fox · futuro",r:"2017",k:"Película",p:"recomendado",n:"El adiós de Hugh Jackman que Deadpool y Lobezno respeta"},
{id:"fxb",t:"Deadpool 2",u:"saga Fox",r:"2018",k:"Película",p:"recomendado",n:"Cable, Domino y el reloj temporal"},
{id:"fxc",t:"X-Men: Fénix Oscura",u:"saga Fox",r:"2019",k:"Película",p:"opcional",n:"El final flojo de la era Fox"},
{id:"fxd",t:"Los 4 Fantásticos (Fox)",u:"saga Fox",r:"2005",k:"Película",p:"opcional",n:"Pura curiosidad histórica"},
{id:"fxe",t:"Los 4 Fantásticos y Silver Surfer",u:"saga Fox",r:"2007",k:"Película",p:"opcional",n:"Pura curiosidad histórica"},
{id:"fxf",t:"Cuatro Fantásticos (Fox)",u:"saga Fox",r:"2015",k:"Película",p:"opcional",n:"Salvo que quieras sufrir, sáltatela"}]},
{tag:"Falta",name:"Aún no se estrena",note:"Los dos últimos títulos antes de Doomsday.",items:[
{id:"pxa",t:"VisionQuest",u:"",r:"14 oct 2026",k:"Serie",p:"pendiente",n:"Cierra la trilogía de WandaVision y Agatha All Along"},
{id:"pxb",t:"Tu amistoso vecino Spider-Man · T2",u:"",r:"otoño 2026",k:"Serie animada",p:"pendiente",n:"Debutan Venom y Gwen Stacy"}]}
];

const STORAGE_KEY = "doomsday-timeline-progress";
const list = document.getElementById("list");
const statusEl = document.getElementById("status");
let done = new Set();
let filter = "todo";

/* ─────────────────────────────────────────
   RENDER DE BLOQUES
───────────────────────────────────────── */
DATA.forEach((block, i) => {
  const sec = document.createElement("section");
  sec.className = "plate" + (block.aside ? " aside" : "");
  sec.dataset.block = i;
  sec.innerHTML = `<span class="rv"></span><span class="rv2"></span>
  <div class="plate-head"><span class="plate-num">${block.tag}</span><h2 class="plate-name">${block.name}</h2><span class="plate-tally" data-tally="${i}"></span></div>
  ${block.note ? `<p class="plate-note">${block.note}</p>` : ""}
  <ul>${block.items.map(it => `<li class="row" data-id="${it.id}"><input type="checkbox" id="${it.id}" aria-label="${it.t}"><label class="info" for="${it.id}"><span class="title">${it.t}</span><span class="metaline">${it.u ? `<em>${it.u}</em> · ` : ""}${it.k} · estreno ${it.r} — ${it.n}</span></label><span class="tag t-${it.p}">${it.p}</span></li>`).join("")}</ul>`;
  list.appendChild(sec);
});

const allItems = DATA.flatMap(b => b.items);
const countable = allItems.filter(i => i.p !== "pendiente").length;
document.getElementById("total").textContent = countable;

/* ─────────────────────────────────────────
   PINTADO DE ESTADO / FILTROS
───────────────────────────────────────── */
function paint() {
  let seen = 0;
  DATA.forEach((block, i) => {
    let c = 0;
    block.items.forEach(it => {
      const row = list.querySelector(`[data-id="${it.id}"]`);
      const box = row.querySelector("input");
      const on = done.has(it.id);
      box.checked = on;
      row.classList.toggle("done", on);
      if (on) { c++; if (it.p !== "pendiente") seen++; }
      let show = true;
      if (filter === "esencial") show = it.p === "esencial";
      else if (filter === "core") show = it.p === "esencial" || it.p === "recomendado";
      else if (filter === "pendiente") show = !on;
      row.classList.toggle("hidden", !show);
    });
    list.querySelector(`[data-tally="${i}"]`).textContent = `${c} / ${block.items.length}`;
    const anyVisible = block.items.some(it => !list.querySelector(`[data-id="${it.id}"]`).classList.contains("hidden"));
    list.querySelector(`[data-block="${i}"]`).style.display = anyVisible ? "" : "none";
  });
  document.getElementById("seen").textContent = seen;
  document.getElementById("fill").style.width = (seen / countable * 100) + "%";
}

/* ─────────────────────────────────────────
   PERSISTENCIA (localStorage)
───────────────────────────────────────── */
function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...done]));
    statusEl.textContent = "Guardado";
  } catch (e) {
    statusEl.textContent = "No se pudo guardar";
  }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) done = new Set(JSON.parse(raw));
    statusEl.textContent = done.size ? "Avance recuperado" : "Empezando de cero";
  } catch (e) {
    statusEl.textContent = "Empezando de cero";
  }
  paint();
}

list.addEventListener("change", e => {
  if (e.target.type !== "checkbox") return;
  e.target.checked ? done.add(e.target.id) : done.delete(e.target.id);
  paint(); save();
});

document.querySelectorAll(".chip").forEach(btn => {
  btn.addEventListener("click", () => {
    filter = btn.dataset.filter;
    document.querySelectorAll(".chip").forEach(b => b.setAttribute("aria-pressed", String(b === btn)));
    paint();
  });
});

document.getElementById("reset").addEventListener("click", () => {
  done.clear(); paint(); save();
  statusEl.textContent = "Avance borrado";
});

/* ─────────────────────────────────────────
   CUENTA REGRESIVA
───────────────────────────────────────── */
function tick() {
  const diff = new Date("2026-12-18T00:00:00") - new Date();
  if (diff <= 0) {
    document.getElementById("cd").innerHTML = '<div class="cd-num">Ya está en cines</div>';
    return;
  }
  document.getElementById("cd-d").textContent = Math.floor(diff / 86400000);
  document.getElementById("cd-h").textContent = String(Math.floor(diff % 86400000 / 3600000)).padStart(2, "0");
  document.getElementById("cd-m").textContent = String(Math.floor(diff % 3600000 / 60000)).padStart(2, "0");
}
tick();
setInterval(tick, 30000);

load();
