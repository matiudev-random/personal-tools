# 🧰 Personal Tools

> Colección de mini webs para cosas del día a día. Sin frameworks, sin complicaciones — HTML, CSS y JS puro.

---

## 📖 Descripción

Una colección de herramientas que fui armando para resolver problemas concretos del día a día. Cada una vive en su propia carpeta y se abre directo en el navegador, sin build tools ni dependencias. Si agrego algo nuevo, lo registro en el dashboard y aparece solo.

---

## ✨ Herramientas

### 🏠 Dashboard
La página de inicio. Muestra todas las herramientas disponibles en formato de tarjetas, con un reloj en vivo y accesos rápidos en la barra inferior.

### ⚽ Ruleta de Fútbol (`/soccer-roulette`)
Para cuando hay que armar equipos y nadie se pone de acuerdo. Cargás los jugadores con su posición y nivel de habilidad, girás la ruleta y el algoritmo los divide en dos equipos lo más balanceados posible. La ruleta es con Canvas y queda bastante bien visualmente.

### 🦵 Rehabilitación de Rodilla (`/knee-rehab`)
Hecha cuando tuve tendinopatía rotuliana para no perderme entre tantos ejercicios y fases. Son 5 fases progresivas (desde reposo hasta volver a jugar al fútbol), con los ejercicios de cada sesión, series/reps y algunas notas. Incluye la "regla del dolor" para saber cuándo parar.

### 🛡️ Camino a Doomsday (`/doomsday-timeline`)
Orden cronológico interno de todo el UCM (pelis, series y especiales, más los universos aparte de Fox/Sony y las animaciones) para llegar a *Avengers: Doomsday* sin perderte nada. Tiene checklist con avance guardado en el navegador, filtros por prioridad (esencial / recomendado / opcional) y una cuenta regresiva en vivo al estreno.


### 🏋️ Fuerza 5/3/1 (`/fuerza-531`)
Tracker de mi plan Upper/Lower a 4 días con 5/3/1. Muestra los pesos del día (con calentamiento y discos por lado para la barra de 10 kg), y ahí mismo anoto reps, peso real y RPE de la serie AMRAP, más los accesorios. Calcula el 1RM estimado, avisa de récords, grafica el progreso y al cerrar cada ciclo sugiere si subir, mantener o bajar el TM. Cada sesión genera un resumen para pegárselo a Claude, que hace de coach. Datos en PocketBase (`fuerza_tms` y `fuerza_sesiones`, esquema en `fuerza-531/pb_schema.json`); funciona sin conexión y sube lo pendiente después.
---

## 🗂️ Estructura

```
personal-tools/
├── index.html          # Dashboard principal
├── main.js             # Registro de herramientas
├── styles.css          # Estilos del dashboard
├── shared.css          # Variables, reset y texturas globales
├── _template/          # Punto de partida para nuevas apps
│   ├── index.html
│   └── styles.css
├── soccer-roulette/
├── knee-rehab/
├── doomsday-timeline/
└── fuerza-531/          ← + plan.js (ejercicios) y pb_schema.json
```

### `shared.css`

Todas las apps comparten un mismo archivo base con las variables de diseño (colores, fuentes), el reset CSS y las texturas de fondo (grilla y ruido). Cada app solo define sus estilos propios en su `styles.css`.

---

## 🛠️ Stack

Todo vanilla: HTML, CSS y JS. Sin dependencias, sin build tools, se abre directo en el navegador. Las fuentes son de Google Fonts (Bebas Neue, Space Mono, DM Serif Display).

---

## ➕ Agregar una herramienta nueva

1. **Copiar la carpeta `_template/`** y renombrarla
2. **Editar el `index.html`** — cambiar título, categoría y descripción en el header
3. **Escribir los estilos** en `styles.css` (variables y fondo ya vienen de `shared.css`)
4. **Crear `main.js`** con la lógica de la app
5. **Registrarla** en el array `TOOLS` del `main.js` raíz

```js
{
  title:  "Nombre",
  desc:   "Para qué sirve",
  icon:   "🔧",
  tag:    "Categoría",
  href:   "nombre-carpeta/index.html",
  status: "active"
}
```

---

*Hecho con ❤️ por [matiudev](https://github.com/matiudev)*
