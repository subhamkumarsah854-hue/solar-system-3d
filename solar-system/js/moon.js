// ═══════════════════════════════════════════════════════════
//  moons.js — Moon systems for all planets
//  Architecture: positionProxy (scene child, follows planet)
//    → pivot (handles orbital inclination + angle)
//      → moonMesh + orbitLine
//  This avoids inheriting the planet's self-rotation.
// ═══════════════════════════════════════════════════════════

const MOON_DATA = {
  Earth: [
    {
      name: 'Luna', period: 0.07481, dist: 4.5, radius: 0.34,
      color: 0xc0c0b8, emissive: 0x0a0a08,
      incl: 0.45, phase: 0, direction: 1,
      realDist_km: 384400, orbSpeed_kms: 1.02,
      diameter: '3,474 km', discovered: 'Prehistoric',
      info: 'Earth\'s only natural satellite. Its gravity drives our tides and stabilises Earth\'s axial tilt at 23.4°.'
    }
  ],

  Mars: [
    {
      name: 'Phobos', period: 0.000873, dist: 2.2, radius: 0.10,
      color: 0x887060, emissive: 0x060402,
      incl: 0.02, phase: 0, direction: 1,
      realDist_km: 9376, orbSpeed_kms: 2.14,
      diameter: '22 km', discovered: '1877 — Asaph Hall',
      info: 'Orbits Mars in just 7.7 hours — faster than Mars rotates. Rises in the west and sets twice a day!'
    },
    {
      name: 'Deimos', period: 0.003455, dist: 3.6, radius: 0.08,
      color: 0x907868, emissive: 0x060402,
      incl: 0.05, phase: 1.8, direction: 1,
      realDist_km: 23463, orbSpeed_kms: 1.35,
      diameter: '12 km', discovered: '1877 — Asaph Hall',
      info: 'One of the smallest and least massive moons in the Solar System. Has very little gravity — a jump could launch you into orbit.'
    }
  ],

  Jupiter: [
    {
      name: 'Io', period: 0.004843, dist: 9.5, radius: 0.24,
      color: 0xe8c840, emissive: 0x180800,
      incl: 0.04, phase: 0, direction: 1,
      realDist_km: 421700, orbSpeed_kms: 17.33,
      diameter: '3,643 km', discovered: '1610 — Galileo',
      volcanic: true,
      info: 'Most volcanically active body in the Solar System — 400+ active volcanoes driven by tidal heating from Jupiter\'s immense gravity.'
    },
    {
      name: 'Europa', period: 0.009722, dist: 13, radius: 0.22,
      color: 0xd0e4f0, emissive: 0x020408,
      incl: 0.08, phase: 1.0, direction: 1,
      realDist_km: 671100, orbSpeed_kms: 13.74,
      diameter: '3,122 km', discovered: '1610 — Galileo',
      icy: true,
      info: 'Covered in a smooth water-ice shell hiding a global ocean with twice Earth\'s liquid water. A prime target in the search for life.'
    },
    {
      name: 'Ganymede', period: 0.01959, dist: 17, radius: 0.30,
      color: 0xa09070, emissive: 0x080604,
      incl: 0.20, phase: 2.1, direction: 1,
      realDist_km: 1070400, orbSpeed_kms: 10.88,
      diameter: '5,268 km', discovered: '1610 — Galileo',
      info: 'Largest moon in the Solar System — bigger than Mercury. The only moon with its own magnetic field and magnetosphere.'
    },
    {
      name: 'Callisto', period: 0.04568, dist: 22, radius: 0.28,
      color: 0x504038, emissive: 0x040302,
      incl: 0.38, phase: 3.3, direction: 1,
      realDist_km: 1882700, orbSpeed_kms: 8.20,
      diameter: '4,821 km', discovered: '1610 — Galileo',
      info: 'Most heavily cratered object in the Solar System. So ancient it records the Solar System\'s early bombardment history.'
    }
  ],

  Saturn: [
    {
      name: 'Mimas', period: 0.002579, dist: 11.5, radius: 0.09,
      color: 0xd0c8c0, emissive: 0x080808,
      incl: 0.03, phase: 0, direction: 1,
      realDist_km: 185539, orbSpeed_kms: 14.28,
      diameter: '396 km', discovered: '1789 — William Herschel',
      info: 'Has a giant impact crater (Herschel) covering 1/3 of its diameter — its resemblance to the Death Star is uncanny.'
    },
    {
      name: 'Enceladus', period: 0.003751, dist: 13.5, radius: 0.12,
      color: 0xf4f4ff, emissive: 0x050508,
      incl: 0.06, phase: 1.0, direction: 1,
      realDist_km: 238041, orbSpeed_kms: 12.64,
      diameter: '504 km', discovered: '1789 — William Herschel',
      icy: true,
      info: 'Shoots water-ice geysers 200 km into space from its south pole. Has a confirmed subsurface liquid ocean. A key target for life.'
    },
    {
      name: 'Tethys', period: 0.005168, dist: 15.5, radius: 0.14,
      color: 0xd0d0c8, emissive: 0x080808,
      incl: 0.17, phase: 2.0, direction: 1,
      realDist_km: 294619, orbSpeed_kms: 11.35,
      diameter: '1,062 km', discovered: '1684 — Cassini',
      info: 'Nearly pure water-ice. Has a giant canyon (Ithaca Chasma) stretching 3/4 of its entire circumference.'
    },
    {
      name: 'Dione', period: 0.007492, dist: 18, radius: 0.16,
      color: 0xc8c0b8, emissive: 0x080806,
      incl: 0.05, phase: 0.5, direction: 1,
      realDist_km: 377396, orbSpeed_kms: 10.02,
      diameter: '1,123 km', discovered: '1684 — Cassini',
      info: 'One of the few moons with a trace oxygen atmosphere. Has bright wispy terrain of exposed ice cliffs.'
    },
    {
      name: 'Rhea', period: 0.012368, dist: 21, radius: 0.18,
      color: 0xc0b8b0, emissive: 0x080806,
      incl: 0.35, phase: 4.0, direction: 1,
      realDist_km: 527068, orbSpeed_kms: 8.48,
      diameter: '1,527 km', discovered: '1672 — Cassini',
      info: 'Saturn\'s second-largest moon. May have its own tenuous ring system — the first moon ever found to have rings.'
    },
    {
      name: 'Titan', period: 0.04364, dist: 27, radius: 0.33,
      color: 0xe09030, emissive: 0x180800,
      incl: 0.55, phase: 1.5, direction: 1,
      realDist_km: 1221870, orbSpeed_kms: 5.57,
      diameter: '5,150 km', discovered: '1655 — Huygens',
      titan: true,
      info: 'Only moon with a thick atmosphere and liquid surface lakes — of methane, not water. NASA\'s Dragonfly drone will land there in 2034.'
    }
  ],

  Uranus: [
    {
      name: 'Miranda', period: 0.003868, dist: 6.5, radius: 0.10,
      color: 0xa0a098, emissive: 0x060606,
      incl: 0.12, phase: 0, direction: 1,
      realDist_km: 129390, orbSpeed_kms: 6.66,
      diameter: '471 km', discovered: '1948 — Kuiper',
      info: 'Has Verona Rupes — the tallest known cliff in the Solar System at ~20 km, 10× higher than Everest.'
    },
    {
      name: 'Ariel', period: 0.006895, dist: 8.5, radius: 0.14,
      color: 0xb0b0a8, emissive: 0x070706,
      incl: 0.26, phase: 1.2, direction: 1,
      realDist_km: 191020, orbSpeed_kms: 5.51,
      diameter: '1,158 km', discovered: '1851 — Lassell',
      info: 'Brightest of Uranus\'s major moons, with a heavily fractured surface suggesting past geological activity.'
    },
    {
      name: 'Umbriel', period: 0.011344, dist: 11, radius: 0.13,
      color: 0x686860, emissive: 0x040404,
      incl: 0.38, phase: 2.5, direction: 1,
      realDist_km: 266300, orbSpeed_kms: 4.67,
      diameter: '1,169 km', discovered: '1851 — Lassell',
      info: 'Darkest of Uranus\'s major moons. Has a mysterious bright ring on its surface whose origin is unknown.'
    },
    {
      name: 'Titania', period: 0.023835, dist: 14, radius: 0.18,
      color: 0xa0a0a0, emissive: 0x060606,
      incl: 0.10, phase: 3.7, direction: 1,
      realDist_km: 435910, orbSpeed_kms: 3.64,
      diameter: '1,578 km', discovered: '1787 — William Herschel',
      info: 'Largest moon of Uranus, with giant rift valleys and ancient cratered terrain across its icy surface.'
    },
    {
      name: 'Oberon', period: 0.036855, dist: 17, radius: 0.17,
      color: 0x888080, emissive: 0x060504,
      incl: 0.62, phase: 0.7, direction: 1,
      realDist_km: 583520, orbSpeed_kms: 3.15,
      diameter: '1,522 km', discovered: '1787 — William Herschel',
      info: 'Outermost major moon of Uranus. Has a 6 km tall mountain on its limb, first spotted by Voyager 2 in 1986.'
    }
  ],

  Neptune: [
    {
      name: 'Proteus', period: 0.003072, dist: 6.5, radius: 0.10,
      color: 0x888070, emissive: 0x060604,
      incl: 0.08, phase: 0, direction: 1,
      realDist_km: 117647, orbSpeed_kms: 7.62,
      diameter: '420 km', discovered: '1989 — Voyager 2',
      info: 'One of the darkest objects in the Solar System, reflecting only 6% of sunlight. Unknown until Voyager 2 flew past.'
    },
    {
      name: 'Triton', period: 0.016088, dist: 10, radius: 0.20,
      color: 0xc8b0b0, emissive: 0x080606,
      incl: 2.37, phase: 1.5, direction: -1,  // RETROGRADE
      realDist_km: 354759, orbSpeed_kms: 4.39,
      diameter: '2,706 km', discovered: '1846 — Lassell',
      retrograde: true,
      info: 'Only large moon with a retrograde orbit — almost certainly a captured Kuiper Belt object. Tidal forces will tear it apart in ~3.6 billion years.'
    },
    {
      name: 'Nereid', period: 0.98578, dist: 18, radius: 0.09,
      color: 0x9898a0, emissive: 0x060606,
      incl: 0.56, phase: 3.0, direction: 1,
      realDist_km: 5513400, orbSpeed_kms: 0.94,
      diameter: '340 km', discovered: '1949 — Kuiper',
      info: 'Has one of the most eccentric orbits of any moon — distance from Neptune ranges from 1.4M to 9.7M km across one orbit.'
    }
  ]
};

window.MOON_DATA = MOON_DATA;

// ── MoonSystem ──────────────────────────────────────────────
class MoonSystem {
  constructor(scene, planets) {
    this.scene   = scene;
    this.planets = planets;
    this.moons   = [];
    this._build();
  }

  _build() {
    this.planets.forEach(p => {
      const moonList = MOON_DATA[p.data.name];
      if (!moonList) return;
      moonList.forEach(md => this._buildMoon(p, md));
    });
  }

  _buildMoon(planet, md) {
    // positionProxy: scene child that follows planet (inherits no rotation)
    const proxy = new THREE.Object3D();
    this.scene.add(proxy);

    // pivot: handles orbital inclination + angle
    const pivot = new THREE.Object3D();
    pivot.rotation.x = md.incl;
    proxy.add(pivot);

    // ── Moon mesh ───────────────────────────────────────
    const geo = new THREE.SphereGeometry(md.radius, 16, 16);
    const mat = this._makeMat(md);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.x = md.dist;
    mesh.userData = { moonData: md, planetData: planet.data, moonRef: { mesh, data: md, planet } };
    mesh.castShadow = true;
    pivot.add(mesh);

    // Special visual extras
    this._addExtras(mesh, md);

    // ── Orbit ring ──────────────────────────────────────
    const orbitPts = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      orbitPts.push(md.dist * Math.cos(a), 0, md.dist * Math.sin(a));
    }
    const orbitGeo = new THREE.BufferGeometry();
    orbitGeo.setAttribute('position', new THREE.Float32BufferAttribute(orbitPts, 3));
    pivot.add(new THREE.LineLoop(orbitGeo,
      new THREE.LineBasicMaterial({
        color: 0x6f8fb8,
        transparent: true,
        opacity: 0.85,
        linewidth: 1.4
      })
    ));

    this.moons.push({ proxy, pivot, mesh, data: md, planet });
  }

  _makeMat(md) {
    if (md.volcanic) {
      // Io: volcanic canvas texture
      const canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 128;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#e8c840';
      ctx.fillRect(0, 0, 256, 128);
      // Volcanic spots
      const spots = [
        [40,40,'#c84000',14],[80,70,'#ff6000',8],[130,35,'#a02800',18],
        [170,80,'#ff8000',10],[220,50,'#c03000',12],[60,95,'#e06000',7],
        [200,100,'#ff4400',9],[100,100,'#882000',16],[150,60,'#ffaa00',6],
      ];
      spots.forEach(([x,y,c,r]) => {
        const g = ctx.createRadialGradient(x,y,0,x,y,r);
        g.addColorStop(0, c); g.addColorStop(0.5, c+'aa'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
      });
      return new THREE.MeshStandardMaterial({
        map: new THREE.CanvasTexture(canvas),
        emissive: 0x180400, emissiveIntensity: 0.25, roughness: 0.9
      });
    }

    if (md.icy) {
      // Europa / Enceladus: icy white with crack lines
      const canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 128;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = md.name === 'Enceladus' ? '#f8f8ff' : '#d4e4f0';
      ctx.fillRect(0, 0, 256, 128);
      if (md.name === 'Europa') {
        // Crack network
        ctx.strokeStyle = '#8899bb'; ctx.lineWidth = 1;
        for (let i = 0; i < 20; i++) {
          ctx.beginPath();
          const x = Math.random()*256, y = Math.random()*128;
          ctx.moveTo(x, y);
          ctx.bezierCurveTo(
            x+Math.random()*60-30, y+Math.random()*40-20,
            x+Math.random()*60-30, y+Math.random()*40-20,
            x+Math.random()*80-40, y+Math.random()*60-30
          );
          ctx.stroke();
        }
      }
      return new THREE.MeshStandardMaterial({
        map: new THREE.CanvasTexture(canvas),
        roughness: 0.2, metalness: 0.1
      });
    }

    if (md.titan) {
      // Titan: thick orange haze
      const canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 128;
      const ctx = canvas.getContext('2d');
      const g = ctx.createLinearGradient(0,0,0,128);
      g.addColorStop(0,'#e89030'); g.addColorStop(0.5,'#d07820'); g.addColorStop(1,'#b86010');
      ctx.fillStyle = g; ctx.fillRect(0,0,256,128);
      // Haze bands
      for (let i = 0; i < 8; i++) {
        const y = Math.random()*128;
        ctx.fillStyle = `rgba(220,140,40,0.25)`;
        ctx.fillRect(0, y, 256, 8+Math.random()*12);
      }
      return new THREE.MeshStandardMaterial({
        map: new THREE.CanvasTexture(canvas),
        emissive: 0x180800, emissiveIntensity: 0.15, roughness: 0.95
      });
    }

    if (md.name === 'Luna') {
      // Luna: grey with maria
      const canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 128;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#c0c0b8'; ctx.fillRect(0,0,256,128);
      // Mare (dark patches)
      const maria = [[80,50,30],[140,40,22],[190,70,26],[60,80,18],[160,90,20]];
      maria.forEach(([x,y,r]) => {
        const g = ctx.createRadialGradient(x,y,0,x,y,r);
        g.addColorStop(0,'rgba(80,80,76,0.7)'); g.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
      });
      // Craters
      for (let i=0;i<20;i++){
        const x=Math.random()*256,y=Math.random()*128,r=2+Math.random()*8;
        ctx.strokeStyle=`rgba(80,80,76,${0.3+Math.random()*0.3})`; ctx.lineWidth=1;
        ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.stroke();
      }
      return new THREE.MeshStandardMaterial({
        map: new THREE.CanvasTexture(canvas),
        emissive: 0x060606, emissiveIntensity: 0.04, roughness: 0.95
      });
    }

    // Default: procedural grey with craters
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    // Base tone from moon color
    const r = (md.color >> 16) & 0xff;
    const g_ = (md.color >> 8) & 0xff;
    const b = md.color & 0xff;
    ctx.fillStyle = `rgb(${r},${g_},${b})`; ctx.fillRect(0,0,128,64);
    // Subtle craters
    for (let i=0;i<12;i++){
      const x=Math.random()*128,y=Math.random()*64,cr=2+Math.random()*6;
      ctx.strokeStyle=`rgba(${Math.max(0,r-40)},${Math.max(0,g_-40)},${Math.max(0,b-40)},0.5)`;
      ctx.lineWidth=0.8; ctx.beginPath(); ctx.arc(x,y,cr,0,Math.PI*2); ctx.stroke();
    }
    return new THREE.MeshStandardMaterial({
      map: new THREE.CanvasTexture(canvas),
      emissive: md.emissive, emissiveIntensity: 0.05, roughness: 0.92
    });
  }

  _addExtras(mesh, md) {
    // Titan atmosphere haze
    if (md.titan) {
      mesh.add(new THREE.Mesh(
        new THREE.SphereGeometry(md.radius * 1.20, 20, 20),
        new THREE.MeshBasicMaterial({
          color: 0xe09030, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.BackSide
        })
      ));
    }
    // Enceladus extra shimmer
    if (md.name === 'Enceladus') {
      mesh.add(new THREE.Mesh(
        new THREE.SphereGeometry(md.radius * 1.08, 16, 16),
        new THREE.MeshBasicMaterial({
          color: 0xeeeeff, transparent: true, opacity: 0.10, depthWrite: false, side: THREE.BackSide
        })
      ));
    }
  }

  // Call every frame
  update(t_sim) {
    this.moons.forEach(m => {
      // Follow planet position (no rotation inherited)
      m.proxy.position.copy(m.planet.mesh.position);
      // Orbital angle (retrograde = direction -1)
      const dir   = m.data.direction || 1;
      const angle = (t_sim / m.data.period) * Math.PI * 2 * dir + m.data.phase;
      m.pivot.rotation.y = angle;
      // Slow tidal-lock self-rotation (same rate as orbit = tidally locked)
      m.mesh.rotation.y = -angle * dir; // face planet
    });
  }

  getAllMeshes() {
    return this.moons.map(m => m.mesh);
  }
}