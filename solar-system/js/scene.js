// ═══════════════════════════════════════════════════════════
//  scene.js  —  All features  +  Sun info panel & exploration
// ═══════════════════════════════════════════════════════════
(function () {
  'use strict';

  const container = document.getElementById('canvas-container');
  if (!container) return;

  const sunData = window.SUN_DATA || (typeof SUN_DATA !== 'undefined' ? SUN_DATA : null);
  const planetColors = window.PLANET_COLORS || (typeof PLANET_COLORS !== 'undefined' ? PLANET_COLORS : {});

  /* ── Renderer ─────────────────────────────────────────── */
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true });
  } catch (err) {
    container.innerHTML = '<div style="padding:24px;color:#fff;font-family:Inter,system-ui">WebGL is not available in this browser.</div>';
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = false;
  container.appendChild(renderer.domElement);

  /* ── Scene / Camera ───────────────────────────────────── */
  const scene  = new THREE.Scene();
  scene.background = new THREE.Color(0x00000a);
  const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.5, 6000);

  window.__solarState = { scene, camera, renderer, controls: null, moonSystem: null, planets: null, builder: null };

  /* ── Lighting ─────────────────────────────────────────── */
  scene.add(new THREE.AmbientLight(0x111133, 1.0));
  scene.add(new THREE.HemisphereLight(0x0033aa, 0x000011, 0.22));

  /* ── Build planets ────────────────────────────────────── */
  const builder = new PlanetBuilder(scene);
  const planets  = builder.buildAll();

  /* ── Moon system (optional) ───────────────────────────── */
  const moonSystem = (typeof MoonSystem !== 'undefined')
    ? new MoonSystem(scene, planets) : null;

  window.__solarState.moonSystem = moonSystem;
  window.__solarState.controls = null;
  window.__solarState.planets = planets;
  window.__solarState.builder = builder;

  /* ── Controls ─────────────────────────────────────────── */
  const controls = new SolarControls(camera, renderer.domElement);
  controls.spherical = { r: 520, theta: 0, phi: Math.PI / 3.5 };
  controls._update();
  window.__solarState.controls = controls;

  /* ── Habitable zone overlay ─────────────────────────── */
  const habitableZoneMesh = new THREE.Mesh(
    new THREE.RingGeometry(SCALE.Earth * 0.72, SCALE.Earth * 1.12, 64),
    new THREE.MeshBasicMaterial({
      color: 0x47ff8c,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  habitableZoneMesh.rotation.x = Math.PI / 2;
  habitableZoneMesh.position.set(0, 0, 0);

  scene.add(habitableZoneMesh);
  habitableZoneMesh.visible = false;

  let habitableZoneVisible = false;
  function setHabitableZoneVisible(visible) {
    habitableZoneVisible = visible;
    habitableZoneMesh.visible = visible;
    const btn = document.getElementById('habitable-zone-btn');
    if (btn) btn.classList.toggle('active-btn', visible);
  }

  function setOrbitVisibility(visible) {
    orbitLinesVisible = visible;
    builder.orbitLines.forEach(line => line.visible = visible);
    const btn = document.getElementById('orbit-btn');
    if (btn) btn.classList.toggle('active-btn', visible);
  }

  function toggleOrbitVisibility() {
    setOrbitVisibility(!orbitLinesVisible);
  }


  /* ── Audio ────────────────────────────────────────────── */
  const audio = new SpaceAudio();

  /* ══════════════════════════════════════════════════════
     STATE
  ══════════════════════════════════════════════════════ */
  const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0);
  const TODAY_T  = 26.52;               // years since J2000 → today
  let   t_sim    = TODAY_T;
  let   paused   = false;
  const BASE_RATE = 1.0;                // sim-years / real-second at speed 1
  let   speed    = 0.05;
  const clock    = new THREE.Clock();
  let   sunPulse = 0;

  // Focus state — only ONE of these is active at a time
  let focusedPlanet = null;
  let focusedSun    = false;
  let returningHome = false;

  let lastLiveMs        = 0;
  let currentInfoPlanet = null;   // planet whose live Kepler data is displayed
  let currentInfoMoon   = null;   // moon currently shown in the info panel
  let focusedMoon       = null;   // moon being explored in the camera view
  let labelsVisible     = true;
  let orbitLinesVisible = true;

  /* ══════════════════════════════════════════════════════
     LABELS  (Sun + planets)
  ══════════════════════════════════════════════════════ */
  const labelContainer = document.getElementById('labels-container');
  const labelV3        = new THREE.Vector3();

  // Sun label
  const sunLabelEl = document.createElement('div');
  sunLabelEl.className   = 'planet-label';
  sunLabelEl.textContent = 'Sun';
  sunLabelEl.style.color      = 'rgba(255,210,80,0.95)';
  sunLabelEl.style.textShadow = '0 0 12px rgba(255,180,0,0.75)';
  sunLabelEl.style.opacity    = '0';
  labelContainer.appendChild(sunLabelEl);

  // Planet labels
  planets.forEach(p => {
    const div = document.createElement('div');
    div.className   = 'planet-label';
    div.textContent = p.data.name;
    div.style.opacity = '0';
    labelContainer.appendChild(div);
    p.labelEl = div;
  });

  /* ══════════════════════════════════════════════════════
     JUMP BUTTONS  (Sun first, then planets)
  ══════════════════════════════════════════════════════ */
  const jumpContainer = document.getElementById('planet-jump-btns');

  // Sun button spanning full width
  const sunJumpBtn = document.createElement('button');
  sunJumpBtn.className  = 'jump-btn';
  sunJumpBtn.textContent = '0. ☀ Sun';
  sunJumpBtn.style.color = '#ffcc44';
  sunJumpBtn.style.borderColor = 'rgba(255,200,60,0.40)';
  sunJumpBtn.style.gridColumn  = '1 / -1';
  sunJumpBtn.addEventListener('click', focusSun);
  jumpContainer.appendChild(sunJumpBtn);

  planets.forEach((p, i) => {
    const btn = document.createElement('button');
    btn.className   = 'jump-btn';
    btn.textContent = `${i + 1}. ${p.data.name}`;
    btn.style.borderColor = (planetColors[p.data.name] || '#4fa3ff') + '55';
    btn.addEventListener('click', () => focusPlanet(p));
    jumpContainer.appendChild(btn);
  });

  if (moonSystem && moonSystem.moons && moonSystem.moons.length) {
    const moonLabel = document.createElement('div');
    moonLabel.className = 'preset-group-label';
    moonLabel.textContent = 'Jump to moon';
    moonLabel.style.marginTop = '10px';
    moonLabel.style.gridColumn = '1 / -1';
    jumpContainer.appendChild(moonLabel);

    moonSystem.moons.forEach((moon, i) => {
      const btn = document.createElement('button');
      btn.className = 'jump-btn';
      btn.textContent = `${i + 1}. 🌙 ${moon.data.name} (${moon.planet.data.name})`;
      btn.style.borderColor = 'rgba(180,180,220,0.45)';
      btn.addEventListener('click', () => {
        focusMoon(moon);
        showMoonPanel(moon.data, moon.planet.data, moon);
      });
      jumpContainer.appendChild(btn);
    });
  }

  /* ══════════════════════════════════════════════════════
     DATE UTILS
  ══════════════════════════════════════════════════════ */
  function getSimDate() {
    return new Date(J2000_MS + t_sim * 365.25 * 24 * 3600 * 1000);
  }
  function formatDate(d) {
    return d.toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
  }
  function syncDateInput() {
    const input = document.getElementById('date-input');
    if (!input) return;
    const d = getSimDate();
    const pad = n => String(n).padStart(2, '0');
    input.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  function setSimDateFromValue(value) {
    if (!value) return;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return;
    const ms = Date.UTC(
      parsed.getFullYear(),
      parsed.getMonth(),
      parsed.getDate(),
      parsed.getHours(),
      parsed.getMinutes(),
      parsed.getSeconds()
    );
    t_sim = (ms - J2000_MS) / (365.25 * 24 * 3600 * 1000);
    syncDateInput();
  }

  /* ══════════════════════════════════════════════════════
     FOCUS FUNCTIONS
  ══════════════════════════════════════════════════════ */
  function focusPlanet(p) {
    focusedPlanet = p;
    focusedSun    = false;
    focusedMoon   = null;
    returningHome = false;
    controls.spherical.r = Math.max(p.data.radius * 14, 22);
    document.getElementById('tb-follow-name').textContent = p.data.name;
    document.getElementById('tb-follow-chip').classList.remove('hidden');
    showPanel(p.data);
  }

  function focusMoon(moonRef) {
    if (!moonRef) return;
    focusedPlanet = null;
    focusedSun    = false;
    focusedMoon   = moonRef;
    returningHome = false;
    controls.spherical.r = Math.max(moonRef.data.radius * 18, 18);
    document.getElementById('tb-follow-name').textContent = `${moonRef.data.name} • ${moonRef.planet.data.name}`;
    document.getElementById('tb-follow-chip').classList.remove('hidden');
  }

  function focusSun() {
    focusedSun    = true;
    focusedPlanet = null;
    focusedMoon   = null;
    returningHome = false;
    // Zoom to a comfortable view of the Sun (radius 5.5 → r≈30 gives a nice framing)
    controls.spherical.r = 30;
    document.getElementById('tb-follow-name').textContent = '☀ Sun';
    document.getElementById('tb-follow-chip').classList.remove('hidden');
    showSunPanel();
  }

  function unfocus() {
    focusedPlanet = null;
    focusedSun    = false;
    focusedMoon   = null;
    returningHome = true;
    document.getElementById('tb-follow-chip').classList.add('hidden');
  }

  /* ══════════════════════════════════════════════════════
     PANEL HELPERS
  ══════════════════════════════════════════════════════ */
  // Restore live-data row labels and hidden buttons
  function _resetPanel() {
    document.querySelectorAll('.live-lbl')[0].textContent = 'Distance from Sun';
    document.querySelectorAll('.live-lbl')[1].textContent = 'Orbital velocity';
    document.querySelectorAll('.live-lbl')[2].textContent = 'Position in orbit';
    document.getElementById('btn-set-a').style.display   = '';
    document.getElementById('btn-set-b').style.display   = '';
  }

  /* ── Planet panel ───────────────────────────────────── */
  function showPanel(pd) {
    _resetPanel();
    currentInfoPlanet = pd;
    currentInfoMoon = null;
    const col = (planetColors[pd.name] || '#4fa3ff');

    const orb = document.getElementById('panel-orb');
    orb.style.background = col;
    orb.style.boxShadow  = `0 0 24px ${col}88`;

    const nameEl = document.getElementById('panel-name');
    nameEl.textContent  = pd.name;
    nameEl.style.color  = col;
    nameEl.style.textShadow = `0 0 18px ${col}88`;

    const i = pd.info;
    document.getElementById('panel-body').innerHTML = `
      <p><strong style="color:${col}">Type:</strong> ${i.type}</p>
      <p><strong style="color:${col}">Diameter:</strong> ${i.diameter}</p>
      <p><strong style="color:${col}">Day length:</strong> ${i.dayLength}</p>
      <p><strong style="color:${col}">Year length:</strong> ${i.yearLength}</p>
      <p><strong style="color:${col}">Moons:</strong> ${i.moons}</p>
      <p><strong style="color:${col}">Temperature:</strong> ${i.temp}</p>
      <p><strong style="color:${col}">Composition:</strong> ${i.comp}</p>
      <p><strong style="color:${col}">Surface gravity:</strong> ${pd.gravity} m/s²</p>
      <p><strong style="color:${col}">Escape velocity:</strong> ${pd.escapeVel} km/s</p>
      <p><strong style="color:${col}">Eccentricity:</strong> ${pd.e.toFixed(4)}</p>
      <hr/>
      <em>💡 ${i.fact}</em>
    `;

    document.getElementById('btn-follow').textContent = '📍 Follow';
    document.getElementById('btn-follow').onclick = () => {
      const p = planets.find(pl => pl.data === pd);
      if (p) focusPlanet(p);
    };
    document.getElementById('info-panel').classList.remove('hidden');
  }

  /* ── Sun panel ──────────────────────────────────────── */
  function showSunPanel() {
    currentInfoPlanet = null;   // no Kepler live-data for the Sun
    currentInfoMoon = null;

    // Repurpose live-data rows for Sun-specific stats
    document.querySelectorAll('.live-lbl')[0].textContent = 'Surface temp';
    document.querySelectorAll('.live-lbl')[1].textContent = 'Core temp';
    document.querySelectorAll('.live-lbl')[2].textContent = 'Age';
    document.getElementById('live-dist').textContent = sunData?.surfaceTemp || '—';
    document.getElementById('live-vel').textContent  = sunData?.coreTemp || '—';
    document.getElementById('live-ang').textContent  = sunData?.age || '—';

    // Visual: glowing solar orb
    const orb = document.getElementById('panel-orb');
    orb.style.background = 'radial-gradient(circle at 36% 36%, #fffaa0, #ffcc00 45%, #ff8800 78%, #cc4400)';
    orb.style.boxShadow  = '0 0 32px rgba(255,200,50,0.80), 0 0 64px rgba(255,140,0,0.30)';

    const nameEl = document.getElementById('panel-name');
    nameEl.textContent  = '☀ The Sun';
    nameEl.style.color  = '#ffcc44';
    nameEl.style.textShadow = '0 0 22px rgba(255,200,50,0.70)';

    const sd = sunData;
    document.getElementById('panel-body').innerHTML = `
      <p><strong style="color:#ffcc44">Spectral type:</strong> ${sd.spectralType}</p>
      <p><strong style="color:#ffcc44">Diameter:</strong> ${sd.diameter}</p>
      <p><strong style="color:#ffcc44">Mass:</strong> ${sd.mass}</p>
      <p><strong style="color:#ffcc44">Luminosity:</strong> ${sd.luminosity}</p>
      <p><strong style="color:#ffcc44">Composition:</strong> ${sd.composition}</p>
      <p><strong style="color:#ffcc44">Rotation:</strong> ${sd.rotation}</p>
      <p><strong style="color:#ffcc44">Solar cycle:</strong> ${sd.solarCycle}</p>
      <p><strong style="color:#ffcc44">Galactic distance:</strong> ${sd.distanceGalactic}</p>
      <p><strong style="color:#ffcc44">Planets orbiting:</strong> ${sd.planets}</p>
      <hr/>
      <em>💡 ${sd.fact}</em>
    `;

    // Re-label Follow button; Compare has no meaning for the Sun
    document.getElementById('btn-follow').textContent = '☀ Re-centre';
    document.getElementById('btn-follow').onclick     = focusSun;
    document.getElementById('btn-set-a').style.display = 'none';
    document.getElementById('btn-set-b').style.display = 'none';

    document.getElementById('info-panel').classList.remove('hidden');
  }

  /* ── Asteroid belt panel ─────────────────────────────── */
  function showBeltPanel(beltData) {
    currentInfoPlanet = null;
    currentInfoMoon = null;

    document.querySelectorAll('.live-lbl')[0].textContent = 'Distance from Sun';
    document.querySelectorAll('.live-lbl')[1].textContent = 'Average speed';
    document.querySelectorAll('.live-lbl')[2].textContent = 'Composition';
    document.getElementById('live-dist').textContent = beltData.rangeAU;
    document.getElementById('live-vel').textContent  = beltData.speed;
    document.getElementById('live-ang').textContent  = beltData.location;

    const orb = document.getElementById('panel-orb');
    orb.style.background = 'radial-gradient(circle at 40% 40%, #f4f4f4, #9b9b9b 60%, #4f4f4f 100%)';
    orb.style.boxShadow  = '0 0 18px rgba(255,255,255,0.22), 0 0 36px rgba(150,150,150,0.16)';

    const nameEl = document.getElementById('panel-name');
    nameEl.textContent  = beltData.name;
    nameEl.style.color  = '#d4d4d4';
    nameEl.style.textShadow = '0 0 12px rgba(255,255,255,0.14)';

    document.getElementById('panel-body').innerHTML = `
      <p><strong style="color:#d4d4d4">Type:</strong> ${beltData.type}</p>
      <p><strong style="color:#d4d4d4">Diameter:</strong> ${beltData.diameter}</p>
      <p><strong style="color:#d4d4d4">Average distance:</strong> ${beltData.avgDistance}</p>
      <p><strong style="color:#d4d4d4">Fragments:</strong> ${beltData.moons}</p>
      <p><strong style="color:#d4d4d4">Temperature:</strong> ${beltData.temp}</p>
      <p><strong style="color:#d4d4d4">Composition:</strong> ${beltData.comp}</p>
      <p><strong style="color:#d4d4d4">Surface gravity:</strong> ${beltData.gravity}</p>
      <hr/>
      <em>💡 ${beltData.fact}</em>
    `;

    document.getElementById('btn-follow').textContent = '🔭 Focus belt';
    document.getElementById('btn-follow').onclick = () => {
      focusedPlanet = null;
      focusedSun = false;
      focusedMoon = null;
      returningHome = false;
      controls.target.lerp(new THREE.Vector3(0, 0, 0), 1);
      controls.spherical.r = 240;
      controls._update();
    };
    document.getElementById('btn-set-a').style.display = 'none';
    document.getElementById('btn-set-b').style.display = 'none';

    document.getElementById('info-panel').classList.remove('hidden');
  }

  /* ── Moon panel ─────────────────────────────────────── */
  function showMoonPanel(md, pd, moonRef = null) {
    _resetPanel();
    currentInfoPlanet = null;
    currentInfoMoon = moonRef;

    document.querySelectorAll('.live-lbl')[0].textContent = 'Orbital distance';
    document.querySelectorAll('.live-lbl')[1].textContent = 'Orbital speed';
    document.querySelectorAll('.live-lbl')[2].textContent = 'Orbit direction';
    document.getElementById('live-dist').textContent = `${md.realDist_km.toLocaleString()} km`;
    document.getElementById('live-vel').textContent  = `${md.orbSpeed_kms} km/s`;
    document.getElementById('live-ang').textContent  = md.retrograde ? '⟲ Retrograde' : '⟳ Prograde';

    const orb = document.getElementById('panel-orb');
    orb.style.background = '#909088';
    orb.style.boxShadow  = '0 0 16px rgba(200,200,180,0.35)';

    const nameEl = document.getElementById('panel-name');
    nameEl.textContent  = md.name;
    nameEl.style.color  = '#d8d8d0';
    nameEl.style.textShadow = 'none';

    document.getElementById('panel-body').innerHTML = `
      <p><em style="color:var(--dim)">Moon of ${pd.name}</em></p>
      <p><strong>Diameter:</strong> ${md.diameter}</p>
      <p><strong>Orbit period:</strong> ${(md.period * 365.25).toFixed(3)} days</p>
      <p><strong>Discovered:</strong> ${md.discovered}</p>
      ${md.retrograde ? '<p style="color:#e07070"><strong>⚠ Retrograde orbit</strong> — opposite to planet spin</p>' : ''}
      <hr/>
      <em>💡 ${md.info}</em>
    `;

    // Moon navigation button
    document.getElementById('btn-follow').textContent = '🌙 Follow moon';
    document.getElementById('btn-follow').onclick = () => {
      if (moonRef) {
        focusMoon(moonRef);
      } else {
        const parent = planets.find(p => p.data.name === pd.name);
        if (parent) focusPlanet(parent);
      }
    };
    document.getElementById('info-panel').classList.remove('hidden');
  }

  /* ── Panel button bindings ──────────────────────────── */
  document.getElementById('btn-set-a').addEventListener('click', () => {
    if (currentInfoPlanet) { compareA = currentInfoPlanet; renderComparison(); }
  });
  document.getElementById('btn-set-b').addEventListener('click', () => {
    if (currentInfoPlanet) { compareB = currentInfoPlanet; renderComparison(); }
  });
  document.getElementById('close-panel').addEventListener('click', () => {
    document.getElementById('info-panel').classList.add('hidden');
    currentInfoPlanet = null;
    currentInfoMoon = null;
    _resetPanel();
  });

  /* ══════════════════════════════════════════════════════
     LIVE ORBITAL DATA  (planets only)
  ══════════════════════════════════════════════════════ */
  function updateLiveData() {
    const now = performance.now();
    if (now - lastLiveMs < 400 || !currentInfoPlanet) return;
    lastLiveMs = now;
    const d = getLiveOrbitalData(currentInfoPlanet, t_sim);
    document.getElementById('live-dist').textContent =
      `${d.r_AU.toFixed(3)} AU  ·  ${(d.r_km / 1e6).toFixed(2)}M km`;
    document.getElementById('live-vel').textContent  = `${d.v_kms.toFixed(2)} km/s`;
    document.getElementById('live-ang').textContent  = `${d.nu_deg.toFixed(1)}° from perihelion`;
  }

  /* ══════════════════════════════════════════════════════
     COMPARE PANEL
  ══════════════════════════════════════════════════════ */
  let compareA = null, compareB = null;

  function renderComparison() {
    document.getElementById('compare-panel').classList.remove('hidden');
    renderCpSlot('cp-a', compareA);
    renderCpSlot('cp-b', compareB);
  }
  function renderCpSlot(id, pd) {
    const el = document.getElementById(id);
    if (!pd) { el.innerHTML = '<div class="cp-empty">Not set</div>'; return; }
    const col = (planetColors[pd.name] || '#4fa3ff');
    const sz  = Math.max(pd.radius * 7, 14);
    const i   = pd.info;
    el.innerHTML = `
      <div class="cp-name" style="color:${col}">${pd.name}</div>
      <div class="cp-orb" style="width:${sz}px;height:${sz}px;background:${col};
        box-shadow:0 0 14px ${col}66;margin-bottom:10px;border-radius:50%"></div>
      <table class="cp-table">
        <tr><td>Type</td><td>${i.type}</td></tr>
        <tr><td>Diameter</td><td>${i.diameter}</td></tr>
        <tr><td>Moons</td><td>${i.moons}</td></tr>
        <tr><td>Gravity</td><td>${pd.gravity} m/s²</td></tr>
        <tr><td>Avg speed</td><td>${pd.avgSpeed} km/s</td></tr>
        <tr><td>Escape vel</td><td>${pd.escapeVel} km/s</td></tr>
        <tr><td>Eccentricity</td><td>${pd.e.toFixed(4)}</td></tr>
        <tr><td>Year</td><td>${i.yearLength}</td></tr>
        <tr><td>Temp</td><td>${i.temp}</td></tr>
      </table>
    `;
  }
  document.getElementById('close-compare').addEventListener('click', () => {
    document.getElementById('compare-panel').classList.add('hidden');
  });
  document.getElementById('compare-toggle-btn').addEventListener('click', () => {
    document.getElementById('compare-panel').classList.toggle('hidden');
  });

  /* ══════════════════════════════════════════════════════
     TOUR  (Sun is stop 0, then all planets)
  ══════════════════════════════════════════════════════ */
  const TOUR_SEQUENCE = [
    {
      type: 'sun',
      name: 'The Sun',
      fact: 'G2V yellow dwarf star — 4.6 billion years old, holds 99.86% of the Solar System\'s mass.'
    },
    ...planets.map(p => ({
      type:   'planet',
      planet:  p,
      name:    p.data.name,
      fact:    p.data.info.fact
    }))
  ];

  let tourMode    = false;
  let tourIndex   = 0;
  let tourElapsed = 0;
  const TOUR_DUR  = 5.5;

  function startTour() {
    tourMode    = true;
    tourIndex   = 0;
    tourElapsed = 0;
    document.getElementById('tour-toast').classList.remove('hidden');
    document.getElementById('tour-btn').textContent = '⏹ Stop Tour';
    visitTourStop();
  }
  function visitTourStop() {
    const stop = TOUR_SEQUENCE[tourIndex];
    if (stop.type === 'sun') {
      focusSun();
    } else {
      focusPlanet(stop.planet);
    }
    document.getElementById('tt-name').textContent = stop.name;
    const fact = stop.fact;
    document.getElementById('tt-fact').textContent =
      fact.length > 110 ? fact.slice(0, 110) + '…' : fact;
    tourElapsed = 0;
    document.getElementById('tt-bar').style.width = '0%';
  }
  function stopTour() {
    tourMode = false;
    document.getElementById('tour-toast').classList.add('hidden');
    document.getElementById('tour-btn').textContent = '🚀 Auto Tour';
    unfocus();
  }
  document.getElementById('tour-btn').addEventListener('click', () => tourMode ? stopTour() : startTour());
  document.getElementById('tt-stop').addEventListener('click', stopTour);

  /* ══════════════════════════════════════════════════════
     QUIZ
  ══════════════════════════════════════════════════════ */
  let quizQs = [], quizIdx = 0, quizScore = 0, quizAnswered = false;

  function startQuiz() {
    quizQs       = [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 8);
    quizIdx      = 0;
    quizScore    = 0;
    quizAnswered = false;
    document.getElementById('quiz-overlay').classList.remove('hidden');
    document.getElementById('quiz-result').classList.add('hidden');
    renderQuestion();
  }
  function renderQuestion() {
    quizAnswered = false;
    const q   = quizQs[quizIdx];
    const pct = (quizIdx / quizQs.length) * 100;
    document.getElementById('quiz-prog-bar').style.width = pct + '%';
    document.getElementById('quiz-num').textContent = `Question ${quizIdx + 1} of ${quizQs.length}`;
    document.getElementById('quiz-q').textContent   = q.q;
    document.getElementById('quiz-feedback').classList.add('hidden');
    document.getElementById('quiz-next').classList.add('hidden');
    document.getElementById('quiz-result').classList.add('hidden');
    const optsEl = document.getElementById('quiz-opts');
    optsEl.innerHTML = '';
    q.opts.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className   = 'quiz-opt';
      btn.textContent = opt;
      btn.addEventListener('click', () => answerQuiz(idx));
      optsEl.appendChild(btn);
    });
  }
  function answerQuiz(idx) {
    if (quizAnswered) return;
    quizAnswered = true;
    const q = quizQs[quizIdx];
    if (idx === q.ans) quizScore++;
    document.querySelectorAll('.quiz-opt').forEach((b, i) => {
      b.disabled = true;
      if (i === q.ans)              b.classList.add('correct');
      else if (i === idx && idx !== q.ans) b.classList.add('wrong');
    });
    const fb = document.getElementById('quiz-feedback');
    fb.classList.remove('hidden');
    fb.innerHTML = `<b>${idx === q.ans ? '✅ Correct!' : '❌ Incorrect.'}</b> ${q.fact}`;
    document.getElementById('quiz-next').classList.remove('hidden');
  }
  document.getElementById('quiz-next').addEventListener('click', () => {
    quizIdx++;
    quizIdx >= quizQs.length ? showQuizResult() : renderQuestion();
  });
  function showQuizResult() {
    ['quiz-opts','quiz-num','quiz-q'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '';
    });
    document.getElementById('quiz-feedback').classList.add('hidden');
    document.getElementById('quiz-next').classList.add('hidden');
    document.getElementById('quiz-prog-bar').style.width = '100%';
    const pct = Math.round((quizScore / quizQs.length) * 100);
    document.getElementById('result-score').textContent = `${quizScore} / ${quizQs.length}`;
    document.getElementById('result-msg').textContent   =
      pct >= 80 ? '🌟 Stellar! You know your solar system.'
    : pct >= 50 ? '🪐 Solid! Keep exploring the cosmos.'
    :             '☄ Keep studying — space is vast!';
    document.getElementById('quiz-result').classList.remove('hidden');
  }
  document.getElementById('quiz-btn').addEventListener('click', startQuiz);
  document.getElementById('close-quiz').addEventListener('click', () =>
    document.getElementById('quiz-overlay').classList.add('hidden'));
  document.getElementById('quiz-again').addEventListener('click', startQuiz);

  /* ══════════════════════════════════════════════════════
     HUD BINDINGS
  ══════════════════════════════════════════════════════ */
  const speedSlider = document.getElementById('speed-slider');
  const speedValue  = document.getElementById('speed-value');

  function setSpeed(v) {
    speed = parseFloat(v);
    speedSlider.value = speed;
    const yps = speed * BASE_RATE;
    const label =
      yps < 0.001 ? `${(yps * 365.25 * 24).toFixed(1)} hrs/s`
    : yps < 0.1  ? `${(yps * 365.25).toFixed(1)} d/s`
    : yps < 2    ? `${(yps * 12).toFixed(1)} mo/s`
    :              `${yps.toFixed(1)} yr/s`;
    speedValue.textContent = label;
    document.getElementById('tb-speed-val').textContent = label;
  }
  setSpeed(0.05);

  speedSlider.addEventListener('input', () => setSpeed(speedSlider.value));

  document.getElementById('pause-btn').addEventListener('click', function () {
    paused = !paused;
    if (!paused) clock.getDelta();
    this.textContent = paused ? '▶ Resume' : '⏸ Pause';
  });
  document.getElementById('reset-btn').addEventListener('click', () => {
    t_sim = TODAY_T;
    syncDateInput();
  });
  const dateInput = document.getElementById('date-input');
  const setDateBtn = document.getElementById('set-date-btn');
  const nowDateBtn = document.getElementById('now-date-btn');
  if (dateInput) {
    dateInput.addEventListener('change', () => setSimDateFromValue(dateInput.value));
  }
  if (setDateBtn) {
    setDateBtn.addEventListener('click', () => setSimDateFromValue(dateInput?.value));
  }
  if (nowDateBtn) {
    nowDateBtn.addEventListener('click', () => {
      t_sim = TODAY_T;
      syncDateInput();
    });
  }
  syncDateInput();
  const audioBtn = document.getElementById('audio-btn');
  audioBtn.addEventListener('click', () => {
    audio.init();
    audio.toggle();
    audio.setButtonLabel(audioBtn);
  });
  audio.setButtonLabel(audioBtn);
  document.getElementById('overview-btn').addEventListener('click', unfocus);

  document.getElementById('orbit-btn').addEventListener('click', toggleOrbitVisibility);

  document.getElementById('labels-btn').addEventListener('click', function () {
    labelsVisible = !labelsVisible;
    this.classList.toggle('active-btn', labelsVisible);
    if (!labelsVisible) {
      planets.forEach(p => { if (p.labelEl) p.labelEl.style.opacity = '0'; });
      sunLabelEl.style.opacity = '0';
    }
  });

  const habitableZoneBtn = document.getElementById('habitable-zone-btn');
  if (habitableZoneBtn) {
    habitableZoneBtn.addEventListener('click', () => setHabitableZoneVisible(!habitableZoneVisible));
  }

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });

  // Preset speed buttons
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active-preset'));
      btn.classList.add('active-preset');
      setSpeed(parseFloat(btn.dataset.speed));
    });
  });

  /* ══════════════════════════════════════════════════════
     KEYBOARD SHORTCUTS
  ══════════════════════════════════════════════════════ */
  window.addEventListener('keydown', e => {
    if (!document.getElementById('quiz-overlay').classList.contains('hidden')) {
      if (e.key === 'Escape') document.getElementById('quiz-overlay').classList.add('hidden');
      return;
    }
    switch (e.key) {
      case '0':                       focusSun(); break;        // ← Sun
      case '1': case '2': case '3': case '4':
      case '5': case '6': case '7': case '8': {
        const p = planets[parseInt(e.key) - 1];
        if (p) focusPlanet(p);
        break;
      }
      case ' ':
        e.preventDefault();
        document.getElementById('pause-btn').click();
        break;
      case 'Escape':
        unfocus();
        document.getElementById('info-panel').classList.add('hidden');
        _resetPanel();
        break;
      case 't': case 'T': tourMode ? stopTour() : startTour(); break;
      case 'q': case 'Q': startQuiz(); break;
      case 'l': case 'L': document.getElementById('labels-btn').click(); break;
      case 'o': case 'O': toggleOrbitVisibility(); break;
      case 'v': case 'V': unfocus(); break;
      case 'ArrowLeft':
        e.preventDefault();
        controls.rotate(0.06, 0);
        break;
      case 'ArrowRight':
        e.preventDefault();
        controls.rotate(-0.06, 0);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (e.ctrlKey) controls.zoom(-16);
        else if (e.shiftKey) controls.rotate(0, -0.04);
        else controls.pan(0, 12);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (e.ctrlKey) controls.zoom(16);
        else if (e.shiftKey) controls.rotate(0, 0.04);
        else controls.pan(0, -12);
        break;
      case 'c': case 'C':
        document.getElementById('compare-panel').classList.toggle('hidden'); break;
      case '+': case '=': setSpeed(Math.min(30, speed * 1.5)); break;
      case '-':            setSpeed(Math.max(0.0001, speed / 1.5)); break;
    }
  });

  /* ══════════════════════════════════════════════════════
     RAYCASTER  —  Sun · planets · moons
  ══════════════════════════════════════════════════════ */
  const raycaster = new THREE.Raycaster();
  const pointer   = new THREE.Vector2();
  let   mouseDown = null;

  renderer.domElement.addEventListener('mousedown', e => {
    mouseDown = { x: e.clientX, y: e.clientY };
  });

  renderer.domElement.addEventListener('mouseup', e => {
    if (!mouseDown) return;
    const dx = e.clientX - mouseDown.x, dy = e.clientY - mouseDown.y;

    if (Math.sqrt(dx * dx + dy * dy) < 5) {
      pointer.x =  (e.clientX / window.innerWidth)  * 2 - 1;
      pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const meshes = [
        builder.sun,
        builder.asteroidBelt,
        ...planets.map(p => p.mesh),
        ...(moonSystem ? moonSystem.getAllMeshes() : [])
      ];
      const hits = raycaster.intersectObjects(meshes, true);

      if (hits.length) {
        // Walk up to the first tagged ancestor
        let obj = hits[0].object;
        while (obj && !obj.userData.isSun && !obj.userData.moonData && !obj.userData.planetData && !obj.userData.beltData) {
          obj = obj.parent;
        }

        if (!obj) { mouseDown = null; return; }

        if (obj.userData.isSun) {
          focusSun();
        } else if (obj.userData.moonData) {
          showMoonPanel(obj.userData.moonData, obj.userData.planetData, obj.userData.moonRef);
          if (obj.userData.moonRef) focusMoon(obj.userData.moonRef);
        } else if (obj.userData.beltData) {
          showBeltPanel(obj.userData.beltData);
        } else if (obj.userData.planetData) {
          const p = planets.find(pl => pl.data === obj.userData.planetData);
          if (p) focusPlanet(p);
        }
      }
    }
    mouseDown = null;
  });

  /* ══════════════════════════════════════════════════════
     RESIZE
  ══════════════════════════════════════════════════════ */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* ══════════════════════════════════════════════════════
     ANIMATION LOOP
  ══════════════════════════════════════════════════════ */
  function animate() {
    requestAnimationFrame(animate);

    const dt = paused ? 0 : Math.min(clock.getDelta(), 0.05);
    if (!paused) {
      t_sim    += dt * speed * BASE_RATE;
      sunPulse += dt * 0.8;
    } else {
      clock.getDelta();
    }

    // ── Sun self-animation ───────────────────────────────
    if (builder.sun) {
      builder.sun.scale.setScalar(1 + Math.sin(sunPulse) * 0.014);
      if (!paused) builder.sun.rotation.y += dt * 0.035;
    }

    // ── Asteroid belt ───────────────────────────────────
    if (!paused && builder.asteroidBelt) {
      builder.asteroidBelt.rotation.y += dt * 0.0006;
    }

    // ── Planet Kepler positions ─────────────────────────
    planets.forEach(p => {
      p.mesh.position.copy(keplerPosition(p.data, t_sim));
      if (!paused) p.mesh.rotation.y += dt * 0.35;
    });

    // ── Moons ───────────────────────────────────────────
    if (moonSystem) moonSystem.update(t_sim);

    /* ── Camera focus ──────────────────────────────────
       Priority: Sun > planet > returning home
    ─────────────────────────────────────────────────── */
    if (focusedSun) {
      // Lerp target to origin; smoothly zoom in to Sun-viewing distance
      controls.target.lerp(new THREE.Vector3(0, 0, 0), 0.07);
      controls.spherical.r += (30 - controls.spherical.r) * 0.05;
      controls._update();

    } else if (focusedPlanet) {
      controls.target.lerp(focusedPlanet.mesh.position, 0.07);
      controls._update();

    } else if (focusedMoon) {
      const moonPos = new THREE.Vector3();
      focusedMoon.mesh.getWorldPosition(moonPos);
      controls.target.lerp(moonPos, 0.08);
      controls.spherical.r += (Math.max(focusedMoon.data.radius * 18, 18) - controls.spherical.r) * 0.05;
      controls._update();

    } else if (returningHome) {
      // Smoothly zoom back out to the overview distance
      controls.target.lerp(new THREE.Vector3(0, 0, 0), 0.05);
      controls.spherical.r += (520 - controls.spherical.r) * 0.03;
      controls._update();
      if (controls.target.length() < 0.8 && Math.abs(controls.spherical.r - 520) < 4) {
        controls.target.set(0, 0, 0);
        controls.spherical.r = 520;
        controls._update();
        returningHome = false;
      }
    }

    // ── Tour tick ───────────────────────────────────────
    if (tourMode && !paused) {
      tourElapsed += dt;
      document.getElementById('tt-bar').style.width =
        Math.min(tourElapsed / TOUR_DUR * 100, 100) + '%';
      if (tourElapsed >= TOUR_DUR) {
        tourIndex = (tourIndex + 1) % TOUR_SEQUENCE.length;
        visitTourStop();
      }
    }

    // ── Labels ──────────────────────────────────────────
    if (labelsVisible) {
      // Sun label (Sun is at world origin)
      labelV3.set(0, 7.5, 0);
      labelV3.project(camera);
      if (labelV3.z < 1) {
        sunLabelEl.style.left    = ((labelV3.x * 0.5 + 0.5) * window.innerWidth)  + 'px';
        sunLabelEl.style.top     = ((-labelV3.y * 0.5 + 0.5) * window.innerHeight) + 'px';
        sunLabelEl.style.opacity = '1';
      } else {
        sunLabelEl.style.opacity = '0';
      }

      // Planet labels
      planets.forEach(p => {
        if (!p.labelEl) return;
        labelV3.copy(p.mesh.position);
        labelV3.y += p.data.radius + 1.5;
        labelV3.project(camera);
        if (labelV3.z > 1) {
          p.labelEl.style.opacity = '0';
        } else {
          p.labelEl.style.left    = ((labelV3.x * 0.5 + 0.5) * window.innerWidth)  + 'px';
          p.labelEl.style.top     = ((-labelV3.y * 0.5 + 0.5) * window.innerHeight) + 'px';
          p.labelEl.style.opacity = '1';
        }
      });
    }

    // ── Top-bar updates ─────────────────────────────────
    document.getElementById('tb-date').textContent = formatDate(getSimDate());
    updateLiveData();

    renderer.render(scene, camera);
  }

  /* ── Remove loader ──────────────────────────────────── */
  setTimeout(() => {
    const l = document.getElementById('loading');
    l.classList.add('fade-out');
    setTimeout(() => l.remove(), 900);
  }, 1000);

  animate();
})();