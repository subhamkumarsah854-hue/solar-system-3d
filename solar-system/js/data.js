// ═══════════════════════════════════════════════════════════
//  data.js — Orbital elements, planet data, quiz questions
// ═══════════════════════════════════════════════════════════


// ── Sun Data ──────────────────────────────────────────────
const SUN_DATA = {
  spectralType:    'G2V Yellow Dwarf Star',
  diameter:        '1,392,700 km  (109× Earth)',
  mass:            '1.989 × 10³⁰ kg  (333,000× Earth)',
  surfaceTemp:     '5,500°C',
  coreTemp:        '15,000,000°C',
  luminosity:      '3.828 × 10²⁶ Watts',
  composition:     'Hydrogen 71%, Helium 27%, Oxygen 0.97%',
  rotation:        '25 days (equator)  ·  35 days (poles)',
  age:             '4.603 billion years',
  solarCycle:      '~11 years (sunspot cycle)',
  distanceGalactic:'26,000 light-years from Galactic core',
  planets:         8,
  fact: 'The Sun holds 99.86 % of all Solar System mass. In ~5 billion years it will exhaust its hydrogen, expand into a red giant that engulfs Mercury and Venus, then collapse into a white dwarf the size of Earth.'
};

window.SUN_DATA = SUN_DATA;

// Custom display distances (not real AU scale — inner planets boosted for visibility)
const SCALE = {
  Mercury:22, Venus:34, Earth:46, Mars:60,
  Jupiter:100, Saturn:140, Uranus:175, Neptune:205
};

const PLANET_DATA = [
  {
    name:'Mercury', emoji:'🪨',
    radius:0.55,
    a:SCALE.Mercury, a_AU:0.387, e:0.2056, i:7.005,
    Omega:48.331, omega:29.124, M0:174.796, T:0.2408,
    color:0x9c9c9c, emissive:0x1a1a1a, colorHex:'#9c9c9c',
    gravity:3.70, avgSpeed:47.87, escapeVel:4.25,
    info:{
      type:'Terrestrial', diameter:'4,879 km',
      dayLength:'1,408 hrs', yearLength:'88 Earth days',
      moons:0, temp:'−180°C to 430°C',
      comp:'Iron core (85% of radius), silicate mantle',
      fact:'Most eccentric inner planet — its distance from the Sun varies by 46–70 million km per orbit.'
    }
  },
  {
    name:'Venus', emoji:'🌕',
    radius:1.3,
    a:SCALE.Venus, a_AU:0.723, e:0.0067, i:3.395,
    Omega:76.680, omega:54.884, M0:50.416, T:0.6152,
    color:0xe8c87a, emissive:0x3a2800, colorHex:'#e8c87a',
    gravity:8.87, avgSpeed:35.02, escapeVel:10.36,
    info:{
      type:'Terrestrial', diameter:'12,104 km',
      dayLength:'5,832 hrs', yearLength:'225 Earth days',
      moons:0, temp:'462°C (avg)',
      comp:'CO₂ atmosphere (96%), sulfuric acid clouds',
      fact:'A day on Venus (243 days) is longer than its year (225 days) — and it spins backwards.'
    }
  },
  {
    name:'Earth', emoji:'🌍',
    radius:1.4,
    a:SCALE.Earth, a_AU:1.000, e:0.0167, i:0.000,
    Omega:-11.261, omega:114.208, M0:357.517, T:1.0000,
    color:0x2e86ab, emissive:0x001122, colorHex:'#2e86ab',
    gravity:9.81, avgSpeed:29.78, escapeVel:11.19,
    hasAtmosphere:true,
    info:{
      type:'Terrestrial', diameter:'12,742 km',
      dayLength:'24 hrs', yearLength:'365.25 days',
      moons:1, temp:'15°C (avg)',
      comp:'Nitrogen (78%), Oxygen (21%), iron core',
      fact:'Perihelion occurs in early January — proving distance from the Sun does not cause seasons.'
    }
  },
  {
    name:'Mars', emoji:'🔴',
    radius:0.85,
    a:SCALE.Mars, a_AU:1.524, e:0.0934, i:1.850,
    Omega:49.558, omega:286.502, M0:19.373, T:1.8808,
    color:0xc1440e, emissive:0x2a0800, colorHex:'#c1440e',
    gravity:3.72, avgSpeed:24.07, escapeVel:5.03,
    info:{
      type:'Terrestrial', diameter:'6,779 km',
      dayLength:'24.6 hrs', yearLength:'687 Earth days',
      moons:2, temp:'−60°C (avg)',
      comp:'CO₂ atmosphere (95%), iron oxide surface',
      fact:'Mars eccentricity (0.093) means Martian seasons vary wildly in length. Northern summer lasts 194 days, southern only 142.'
    }
  },
  {
    name:'Jupiter', emoji:'🟠',
    radius:4.5,
    a:SCALE.Jupiter, a_AU:5.203, e:0.0489, i:1.303,
    Omega:100.464, omega:273.867, M0:20.020, T:11.862,
    color:0xc88b3a, emissive:0x1a0800, colorHex:'#c88b3a',
    gravity:24.79, avgSpeed:13.07, escapeVel:59.5,
    stripes:true,
    info:{
      type:'Gas Giant', diameter:'139,820 km',
      dayLength:'10 hrs', yearLength:'11.86 Earth years',
      moons:95, temp:'−110°C (cloud top)',
      comp:'Hydrogen (89%), Helium (10%), methane traces',
      fact:'Jupiter\'s Great Red Spot is an anticyclonic storm larger than Earth, raging for over 350 years.'
    }
  },
  {
    name:'Saturn', emoji:'🪐',
    radius:3.8,
    a:SCALE.Saturn, a_AU:9.537, e:0.0565, i:2.485,
    Omega:113.665, omega:339.392, M0:317.020, T:29.457,
    color:0xe4d191, emissive:0x1a1400, colorHex:'#e4d191',
    gravity:10.44, avgSpeed:9.69, escapeVel:35.5,
    hasRings:true,
    info:{
      type:'Gas Giant', diameter:'116,460 km',
      dayLength:'10.7 hrs', yearLength:'29.45 Earth years',
      moons:146, temp:'−140°C (cloud top)',
      comp:'Hydrogen (96%), Helium (3%), ring system of ice & rock',
      fact:'Saturn\'s rings are only ~20 m thick on average but span 282,000 km — thinner than a sheet of paper proportionally.'
    }
  },
  {
    name:'Uranus', emoji:'🔵',
    radius:2.5,
    a:SCALE.Uranus, a_AU:19.191, e:0.0463, i:0.773,
    Omega:74.006, omega:96.998, M0:142.238, T:84.011,
    color:0x7de8e8, emissive:0x001a1a, colorHex:'#7de8e8',
    gravity:8.69, avgSpeed:6.81, escapeVel:21.3,
    info:{
      type:'Ice Giant', diameter:'50,724 km',
      dayLength:'17.2 hrs', yearLength:'84 Earth years',
      moons:27, temp:'−195°C (avg)',
      comp:'Water, methane, ammonia ices; hydrogen-helium envelope',
      fact:'Uranus rotates on its side at 97.77° — almost certainly from an ancient collision with an Earth-sized object.'
    }
  },
  {
    name:'Neptune', emoji:'🔵',
    radius:2.4,
    a:SCALE.Neptune, a_AU:30.069, e:0.0100, i:1.770,
    Omega:131.784, omega:276.340, M0:256.228, T:164.796,
    color:0x3f54ba, emissive:0x000520, colorHex:'#3f54ba',
    gravity:11.15, avgSpeed:5.43, escapeVel:23.5,
    info:{
      type:'Ice Giant', diameter:'49,244 km',
      dayLength:'16.1 hrs', yearLength:'164.8 Earth years',
      moons:16, temp:'−200°C (avg)',
      comp:'Water, ammonia, methane ices; supersonic wind bands',
      fact:'Neptune was predicted mathematically before being observed — a triumph of Newtonian physics. Winds reach 2,100 km/h.'
    }
  }
];

// Per-planet accent colours for UI
const PLANET_COLORS = {
  Mercury:'#b0b0b0', Venus:'#e8c87a', Earth:'#4fa3ff',
  Mars:'#e05030', Jupiter:'#c88b3a', Saturn:'#e4d191',
  Uranus:'#7de8e8', Neptune:'#5570e0'
};

window.PLANET_COLORS = PLANET_COLORS;

// ── Kepler solver ──────────────────────────────────────────
function solveKepler(M_rad, e, iter=12){
  let E=M_rad;
  for(let i=0;i<iter;i++) E=E-(E-e*Math.sin(E)-M_rad)/(1-e*Math.cos(E));
  return E;
}

function keplerPosition(planet, t_years){
  const D=Math.PI/180;
  const n=(2*Math.PI)/planet.T;
  const M=((planet.M0*D+n*t_years)%(2*Math.PI)+2*Math.PI)%(2*Math.PI);
  const E=solveKepler(M,planet.e);
  const nu=2*Math.atan2(Math.sqrt(1+planet.e)*Math.sin(E/2),Math.sqrt(1-planet.e)*Math.cos(E/2));
  const r=planet.a*(1-planet.e*Math.cos(E));
  const xOrb=r*Math.cos(nu), yOrb=r*Math.sin(nu);
  const cosO=Math.cos(planet.Omega*D),sinO=Math.sin(planet.Omega*D);
  const cosi=Math.cos(planet.i*D),sini=Math.sin(planet.i*D);
  const cosw=Math.cos(planet.omega*D),sinw=Math.sin(planet.omega*D);
  const x=(cosO*cosw-sinO*sinw*cosi)*xOrb+(-cosO*sinw-sinO*cosw*cosi)*yOrb;
  const y=(sinO*cosw+cosO*sinw*cosi)*xOrb+(-sinO*sinw+cosO*cosw*cosi)*yOrb;
  const z=(sinw*sini)*xOrb+(cosw*sini)*yOrb;
  return new THREE.Vector3(x,z,-y);
}

function buildOrbitPoints(planet,steps=512){
  const pts=[];
  for(let i=0;i<=steps;i++) pts.push(keplerPosition(planet,(i/steps)*planet.T));
  return pts;
}

// ── Live orbital data (real physics) ─────────────────────
function getLiveOrbitalData(planet, t_years){
  const D=Math.PI/180;
  const n=(2*Math.PI)/planet.T;
  const M=((planet.M0*D+n*t_years)%(2*Math.PI)+2*Math.PI)%(2*Math.PI);
  const E=solveKepler(M,planet.e);
  const r_AU=planet.a_AU*(1-planet.e*Math.cos(E));
  // Vis-viva: v = sqrt(GM*(2/r - 1/a))
  const GM=1.32712440018e20, AU_m=1.495978707e11;
  const v_ms=Math.sqrt(GM*(2/(r_AU*AU_m)-1/(planet.a_AU*AU_m)));
  const nu_rad=2*Math.atan2(Math.sqrt(1+planet.e)*Math.sin(E/2),Math.sqrt(1-planet.e)*Math.cos(E/2));
  const nu_deg=((nu_rad*180/Math.PI)%360+360)%360;
  return { r_AU, r_km:r_AU*149597870.7, v_kms:v_ms/1000, nu_deg };
}

// ── Quiz questions ─────────────────────────────────────────
const QUIZ_QUESTIONS = [
  {
    q:'Which planet has the most confirmed moons?',
    opts:['Jupiter (95)','Saturn (146)','Uranus (27)','Neptune (16)'],
    ans:1,
    fact:'Saturn leads with 146 confirmed moons — edging out Jupiter\'s 95 after a 2023 discovery sweep.'
  },
  {
    q:'Which planet rotates on its side (axial tilt ~98°)?',
    opts:['Neptune','Venus','Uranus','Jupiter'],
    ans:2,
    fact:'Uranus has a 97.77° axial tilt — almost certainly from a massive collision billions of years ago.'
  },
  {
    q:'Which planet is hottest despite not being closest to the Sun?',
    opts:['Mercury','Mars','Venus','Earth'],
    ans:2,
    fact:'Venus reaches 462°C due to a runaway greenhouse effect, far hotter than Mercury\'s 430°C peak.'
  },
  {
    q:'What is the Great Red Spot on Jupiter?',
    opts:['A volcano','An ocean','A storm','A crater'],
    ans:2,
    fact:'The Great Red Spot is an anticyclonic storm larger than Earth that has raged for over 350 years.'
  },
  {
    q:'Which planet has the most eccentric orbit among the 8 planets?',
    opts:['Mars','Neptune','Earth','Mercury'],
    ans:3,
    fact:'Mercury\'s eccentricity of 0.206 is the highest — its distance from the Sun varies by 24 million km per orbit.'
  },
  {
    q:'Kepler\'s 2nd Law states that a planet sweeps equal _____ in equal times.',
    opts:['Distances','Angles','Areas','Velocities'],
    ans:2,
    fact:'Equal areas — planets move faster near perihelion and slower at aphelion, but sweep equal areas in equal time.'
  },
  {
    q:'Which planet has the fastest average orbital speed?',
    opts:['Earth (29.8 km/s)','Venus (35 km/s)','Mercury (47.9 km/s)','Mars (24 km/s)'],
    ans:2,
    fact:'Mercury orbits at ~47.9 km/s — closest to the Sun means maximum gravitational pull and highest speed.'
  },
  {
    q:'Saturn\'s rings are primarily made of?',
    opts:['Rock and dust','Ice and rock','Gas and plasma','Metallic hydrogen'],
    ans:1,
    fact:'Saturn\'s rings are 90–95% water ice, ranging from tiny grains to chunks several meters wide.'
  },
  {
    q:'Which planet was predicted mathematically before it was first observed?',
    opts:['Uranus','Neptune','Saturn','Pluto'],
    ans:1,
    fact:'Neptune\'s position was calculated by Le Verrier & Adams from perturbations in Uranus\'s orbit — then confirmed in 1846.'
  },
  {
    q:'According to Kepler\'s 3rd Law, if a planet is farther from the Sun, its orbital period is…',
    opts:['Shorter','The same','Longer','Unpredictable'],
    ans:2,
    fact:'T² ∝ a³ — doubling the orbital radius increases the period by 2^(3/2) ≈ 2.83×. Neptune takes 165 years vs Earth\'s 1.'
  }
];