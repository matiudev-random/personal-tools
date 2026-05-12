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

---

## 🛠️ Stack

Todo vanilla: HTML, CSS y JS. Sin dependencias, sin build tools, se abre directo en el navegador. Las fuentes son de Google Fonts (Bebas Neue, Space Mono, DM Serif Display).

---

## ➕ Agregar una herramienta nueva

1. Crear una carpeta nueva con su `index.html`, `main.js` y `styles.css`
2. Registrarla en el array `TOOLS` de `main.js` en la raíz
3. Listo, aparece en el dashboard

```js
{
  title: "Nombre",
  description: "Para qué sirve",
  icon: "🔧",
  tag: "categoría",
  href: "./nombre-carpeta/",
  status: "active"
}
```

---

*Hecho con ❤️ por [matiudev](https://github.com/matiudev)*
