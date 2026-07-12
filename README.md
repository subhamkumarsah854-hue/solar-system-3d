# 🌌 Interactive 3D Solar System

A physics-accurate, interactive solar system simulation built from scratch
using Three.js, real Kepler orbital mechanics, and procedural planet textures.

🔗 **Live Demo:**  https://subhamkumarsah854-hue.github.io/solar-system-3d/solar-system/

---

## ✨ Features

- **Kepler orbital mechanics** — real eccentricity, inclination, and period
  for all 8 planets using Newton-Raphson equation solving
- **Procedural planet textures** — every planet surface generated with
  layered canvas rendering (no external images)
- **21 named moons** — Galilean moons, Titan, Triton and more, all
  with real orbital data and tidally-locked rotation
- **Habitable zone visualisation** — conservative and optimistic boundaries
  with gradient rendering based on solar luminosity
- **Solar System quiz** — 10 physics-based questions with fact reveals
- **Auto tour mode** — camera automatically visits Sun + all 8 planets
- **Real simulation date** — Kepler equations run from today's date forward
- **Live orbital data** — distance in AU/km and orbital velocity (km/s)
  computed via the vis-viva equation every frame
- **Sun info panel** — surface/core temperature, composition, luminosity
- **Full camera controls** — mouse orbit, scroll zoom, arrow key flight,
  focus any planet/moon/Sun with keyboard shortcuts 1–8, 0

---

## 🛠 Tech Stack

| Technology | Usage |
|---|---|
| Three.js (r128) | 3D WebGL rendering |
| JavaScript (ES6) | Scene logic, Kepler solver, UI |
| HTML5 Canvas API | Procedural planet + sun textures |
| Web Audio API | Layered ambient space soundtrack |
| CSS3 | HUD, panels, animations |
| GLSL concepts | Atmospheric glow via material layering |

---

## 🔭 Physics Implementation

- **Kepler's 1st Law** — elliptical orbits with Sun at one focus
- **Kepler's 2nd Law** — Newton-Raphson solver gives correct
  faster/slower speed at perihelion/aphelion automatically
- **Kepler's 3rd Law** — real orbital periods (Mercury 88 days →
  Neptune 165 years) from NASA JPL J2000 elements
- **Vis-viva equation** — live velocity computed as v = √(GM(2/r − 1/a))

---

## 🎮 Controls

| Key | Action |
|---|---|
| `1` – `8` | Focus planet |
| `0` | Focus Sun |
| `Space` | Pause / Resume |
| `Esc` | Return to overview |
| `T` | Auto tour |
| `Q` | Quiz mode |
| `L` | Toggle labels |
| Arrow keys | Free fly camera |

---

## 📁 Project Structure
solar-system/
├── index.html          # Entry point + UI panels
├── style.css           # HUD, panels, quiz, comparison
├── css/
│   ├── animations.css  # Panel transitions
│   └── responsive.css  # Mobile layout
└── js/
├── data.js         # Orbital elements + quiz questions
├── planets.js      # Procedural textures + scene build
├── moons.js        # 21 moon systems
├── controls.js     # Orbit camera
├── audio.js        # Web Audio space soundtrack
└── scene.js        # Main loop + all UI features
---

## 👤 Author

**Subham Kumar Sah**
BSc Physics — Lovely Professional University
[LinkedIn](https://www.linkedin.com/in/subham-kumar-sah-158071379/) 

*Built as part of a self-directed data analytics and physics portfolio.*
