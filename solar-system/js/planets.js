// ═══════════════════════════════════════════════════════════
//  planets.js  —  Photorealistic procedural planet textures
//  Sun glow: Sprite + AdditiveBlending (no polygon cage)
//  All planets: layered canvas textures, limb-darkening overlay
// ═══════════════════════════════════════════════════════════

class PlanetBuilder {
  constructor(scene) {
    this.scene = scene;
    this.planets = [];
    this.sun = null;
    this.asteroidBelt = null;
  }

  buildAll() {
    this._buildStarfield();
    this._buildSun();
    this._buildAsteroidBelt();
    PLANET_DATA.forEach(d => this._buildPlanet(d));
    return this.planets;
  }

  // ── Starfield ────────────────────────────────────────────
  _buildStarfield() {
    const count = 10000;
    const pos   = new Float32Array(count * 3);
    const col   = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const r     = 1200 + Math.random() * 700;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i*3+2] = r * Math.cos(phi);

      const t = Math.random();
      if (t < 0.04) {
        // Blue-white hot giants
        col[i*3] = 0.70; col[i*3+1] = 0.82; col[i*3+2] = 1.00;
      } else if (t < 0.10) {
        // Orange-red cool giants
        col[i*3] = 1.00; col[i*3+1] = 0.72; col[i*3+2] = 0.40;
      } else if (t < 0.16) {
        // Yellow sun-like
        col[i*3] = 1.00; col[i*3+1] = 0.95; col[i*3+2] = 0.65;
      } else {
        // White majority
        const v = 0.88 + Math.random() * 0.12;
        col[i*3] = v; col[i*3+1] = v; col[i*3+2] = v + Math.random() * 0.04;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
    this.scene.add(new THREE.Points(geo,
      new THREE.PointsMaterial({ size: 0.55, vertexColors: true, sizeAttenuation: true })
    ));
  }

  // ── Sun ──────────────────────────────────────────────────
  _buildSun() {

    // ── Surface texture ──────────────────────────────────
    const W = 512, H = 256;
    const sc = document.createElement('canvas');
    sc.width = W; sc.height = H;
    const ctx = sc.getContext('2d');

    // Base gradient: bright centre → orange edges
    const base = ctx.createRadialGradient(W/2,H/2,0, W/2,H/2, W/2);
    base.addColorStop(0.00, '#fff9c0');
    base.addColorStop(0.25, '#ffe060');
    base.addColorStop(0.55, '#ffa020');
    base.addColorStop(0.80, '#ff6800');
    base.addColorStop(1.00, '#cc3000');
    ctx.fillStyle = base; ctx.fillRect(0,0,W,H);

    // Granulation convection cells (Bénard cells look)
    for (let i = 0; i < 1200; i++) {
      const x = Math.random()*W, y = Math.random()*H;
      const r = 1.5 + Math.random()*5;
      const g = ctx.createRadialGradient(x,y,0, x,y,r);
      const bright = Math.random() > 0.45;
      g.addColorStop(0, bright ? `rgba(255,255,200,0.28)` : `rgba(160,60,0,0.22)`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(x-r,y-r,r*2,r*2);
    }

    // Solar granulation network (darker intergranular lanes)
    ctx.globalAlpha = 0.12;
    for (let i = 0; i < 400; i++) {
      const x = Math.random()*W, y = Math.random()*H;
      const r = 4 + Math.random()*8;
      ctx.strokeStyle = '#993300';
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    // Sunspots (umbra + penumbra)
    const spotCount = 6 + Math.floor(Math.random()*5);
    for (let i = 0; i < spotCount; i++) {
      const x = 30 + Math.random()*(W-60);
      const y = H*0.2 + Math.random()*H*0.6;  // avoid poles
      const r = 5 + Math.random()*14;
      // Penumbra
      const pen = ctx.createRadialGradient(x,y,0, x,y,r*2.2);
      pen.addColorStop(0,   'rgba(80,20,0,0.00)');
      pen.addColorStop(0.45,'rgba(100,35,0,0.60)');
      pen.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = pen;
      ctx.beginPath(); ctx.ellipse(x,y,r*2.2,r*1.5,Math.random()*0.5,0,Math.PI*2); ctx.fill();
      // Umbra
      const umb = ctx.createRadialGradient(x,y,0, x,y,r);
      umb.addColorStop(0,   'rgba(20,5,0,0.95)');
      umb.addColorStop(0.6, 'rgba(50,15,0,0.80)');
      umb.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = umb;
      ctx.beginPath(); ctx.ellipse(x,y,r,r*0.70,Math.random()*0.5,0,Math.PI*2); ctx.fill();
    }

    // Limb darkening: edges significantly darker (solar physics)
    const limb = ctx.createRadialGradient(W/2,H/2, H*0.25, W/2,H/2, H*0.65);
    limb.addColorStop(0, 'rgba(0,0,0,0)');
    limb.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = limb; ctx.fillRect(0,0,W,H);

    this.sun = new THREE.Mesh(
      new THREE.SphereGeometry(5.5, 64, 64),
      new THREE.MeshStandardMaterial({
        map: new THREE.CanvasTexture(sc),
        emissive: new THREE.Color(0xff7700),
        emissiveIntensity: 0.55,
        roughness: 0.85,
      })
    );
    this.sun.userData.isSun = true;
    this.scene.add(this.sun);

    // ── Glow: Sprites with AdditiveBlending → no polygon cage ──
    // Each glow layer is a square canvas with a circular radial gradient
    // AdditiveBlending means black = transparent, colours add to background
    [
      { radius: 18,  r:255, g:180, b:50,  o:0.55 },
      { radius: 28,  r:255, g:130, b:20,  o:0.30 },
      { radius: 44,  r:255, g:90,  b:10,  o:0.14 },
      { radius: 70,  r:200, g:60,  b:5,   o:0.06 },
    ].forEach(({ radius, r, g, b, o }) => {
      const size = 256;
      const gc   = document.createElement('canvas');
      gc.width = size; gc.height = size;
      const gctx = gc.getContext('2d');
      const grad = gctx.createRadialGradient(size/2,size/2,0, size/2,size/2,size/2);
      grad.addColorStop(0.00, `rgba(${r},${g},${b},${o})`);
      grad.addColorStop(0.40, `rgba(${r},${g},${b},${(o*0.5).toFixed(3)})`);
      grad.addColorStop(0.75, `rgba(${r},${g},${b},${(o*0.15).toFixed(3)})`);
      grad.addColorStop(1.00, `rgba(${r},${g},${b},0)`);
      gctx.fillStyle = grad;
      gctx.fillRect(0,0,size,size);

      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(gc),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,   // ← the fix
      }));
      sprite.scale.setScalar(radius * 2);
      this.scene.add(sprite);
    });

    // ── Point light from Sun ──────────────────────────────
    const sunLight = new THREE.PointLight(0xfff4e0, 3.5, 2500);
    this.scene.add(sunLight);
  }

  // ── Planet textures ─────────────────────────────────────
  _makeTexture(name) {
    // Canvas sizes: Earth/Jupiter 1024×512, others 512×256
    const large = name === 'Earth' || name === 'Jupiter';
    const W = large ? 1024 : 512;
    const H = W / 2;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');

    switch (name) {

      /* ── Mercury ─────────────────────────────────────── */
      case 'Mercury': {
        // Base: dark grey highland + lighter lowland
        const base = ctx.createLinearGradient(0,0,0,H);
        base.addColorStop(0,   '#7a7368');
        base.addColorStop(0.5, '#8a8278');
        base.addColorStop(1,   '#706860');
        ctx.fillStyle = base; ctx.fillRect(0,0,W,H);

        // Caloris Basin (large ancient impact basin)
        const cb = ctx.createRadialGradient(W*0.28,H*0.48,0, W*0.28,H*0.48,W*0.16);
        cb.addColorStop(0,   'rgba(190,182,168,0.75)');
        cb.addColorStop(0.4, 'rgba(165,155,140,0.50)');
        cb.addColorStop(0.8, 'rgba(130,120,108,0.30)');
        cb.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.fillStyle = cb; ctx.fillRect(0,0,W,H);

        // Random craters (rays + rims + floors)
        for (let i = 0; i < 80; i++) {
          const x  = Math.random()*W, y  = Math.random()*H;
          const r  = 2 + Math.random()*22;
          const dark = 0.35 + Math.random()*0.35;

          // Ejecta rays (brightest)
          if (r > 10 && Math.random() > 0.5) {
            const rays = 4 + Math.floor(Math.random()*6);
            for (let k = 0; k < rays; k++) {
              const a   = (k/rays)*Math.PI*2 + Math.random()*0.4;
              const len = r * (2.5 + Math.random()*3);
              ctx.strokeStyle = `rgba(200,190,176,${0.15+Math.random()*0.15})`;
              ctx.lineWidth   = 0.8 + Math.random()*1.5;
              ctx.beginPath();
              ctx.moveTo(x + Math.cos(a)*r, y + Math.sin(a)*r);
              ctx.lineTo(x + Math.cos(a)*len, y + Math.sin(a)*len);
              ctx.stroke();
            }
          }
          // Rim (bright)
          ctx.strokeStyle = `rgba(195,185,170,${dark})`;
          ctx.lineWidth   = 0.8 + r*0.08;
          ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.stroke();
          // Floor (darker)
          const floor = ctx.createRadialGradient(x,y,0, x,y,r*0.85);
          floor.addColorStop(0,   `rgba(55,48,42,${dark*0.8})`);
          floor.addColorStop(0.5, `rgba(70,62,55,${dark*0.5})`);
          floor.addColorStop(1,   'rgba(0,0,0,0)');
          ctx.fillStyle = floor;
          ctx.beginPath(); ctx.arc(x,y,r*0.85,0,Math.PI*2); ctx.fill();
        }

        // Surface variation (scarps / ridges)
        for (let i = 0; i < 12; i++) {
          const x1=Math.random()*W, y1=Math.random()*H;
          const x2=x1+(Math.random()-0.5)*W*0.2, y2=y1+(Math.random()-0.5)*H*0.2;
          ctx.strokeStyle = `rgba(160,150,135,0.25)`;
          ctx.lineWidth   = 1 + Math.random()*1.5;
          ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
        }
        break;
      }

      /* ── Venus ──────────────────────────────────────── */
      case 'Venus': {
        // Base: thick sulphuric cloud deck, pale creamy-yellow
        const base = ctx.createLinearGradient(0,0,0,H);
        base.addColorStop(0,   '#f2e8c0');
        base.addColorStop(0.25,'#eedda0');
        base.addColorStop(0.50,'#f5e8b0');
        base.addColorStop(0.75,'#e8d898');
        base.addColorStop(1,   '#f0e0a8');
        ctx.fillStyle = base; ctx.fillRect(0,0,W,H);

        // Slow retrograde cloud bands
        const bandColors = [
          'rgba(220,195,120,0.30)','rgba(180,155,80,0.25)',
          'rgba(240,215,140,0.22)','rgba(195,168,95,0.28)',
          'rgba(215,185,105,0.20)','rgba(170,145,70,0.22)',
        ];
        for (let i = 0; i < 30; i++) {
          const y   = Math.random()*H;
          const ht  = 10 + Math.random()*50;
          const col = bandColors[i % bandColors.length];
          const bg  = ctx.createLinearGradient(0,y,0,y+ht);
          bg.addColorStop(0,'rgba(0,0,0,0)');
          bg.addColorStop(0.5,col);
          bg.addColorStop(1,'rgba(0,0,0,0)');
          ctx.fillStyle = bg;
          ctx.beginPath(); ctx.moveTo(0,y);
          for (let x=0;x<=W;x+=20)
            ctx.lineTo(x, y + Math.sin(x*0.018+i*0.7)*14 + Math.sin(x*0.007+i)*8);
          ctx.lineTo(W,y+ht); ctx.lineTo(0,y+ht); ctx.closePath(); ctx.fill();
        }

        // Polar collar (darker)
        ['top','bot'].forEach(pos => {
          const cg = ctx.createLinearGradient(0, pos==='top'?0:H-50, 0, pos==='top'?50:H);
          cg.addColorStop(0,'rgba(160,130,60,0.45)');
          cg.addColorStop(1,'rgba(0,0,0,0)');
          ctx.fillStyle = cg; ctx.fillRect(0,pos==='top'?0:H-50,W,50);
        });
        break;
      }

      /* ── Earth ──────────────────────────────────────── */
      case 'Earth': {
        // Deep ocean base
        ctx.fillStyle = '#0a3d6b'; ctx.fillRect(0,0,W,H);

        // Ocean depth variation
        for (let i = 0; i < 25; i++) {
          const x=Math.random()*W, y=Math.random()*H, r=60+Math.random()*130;
          const og = ctx.createRadialGradient(x,y,0,x,y,r);
          og.addColorStop(0,'rgba(8,52,96,0.5)'); og.addColorStop(1,'rgba(0,0,0,0)');
          ctx.fillStyle=og; ctx.fillRect(x-r,y-r,r*2,r*2);
        }

        // Shallow ocean / shelf (lighter blue-green)
        ctx.fillStyle='rgba(14,90,110,0.35)';
        [[170,120,80,50],[580,150,90,45],[750,180,60,38]].forEach(([x,y,rx,ry])=>{
          ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2); ctx.fill();
        });

        // ── Land masses ──────────────────────────────────
        // Americas
        ctx.fillStyle='#2d6e1e';
        ctx.beginPath();
        ctx.moveTo(175,60); ctx.bezierCurveTo(190,45,220,50,225,70);
        ctx.bezierCurveTo(235,95,230,120,218,140); ctx.bezierCurveTo(225,155,220,175,210,190);
        ctx.bezierCurveTo(200,215,190,235,178,250); ctx.bezierCurveTo(165,265,150,268,142,255);
        ctx.bezierCurveTo(128,240,125,215,130,195); ctx.bezierCurveTo(120,178,115,160,122,140);
        ctx.bezierCurveTo(130,120,140,105,145,88);  ctx.bezierCurveTo(152,68,162,58,175,60);
        ctx.fill();
        // South America
        ctx.fillStyle='#348022';
        ctx.beginPath();
        ctx.moveTo(195,265); ctx.bezierCurveTo(210,262,222,270,224,285);
        ctx.bezierCurveTo(228,310,220,335,210,355); ctx.bezierCurveTo(200,375,188,388,175,385);
        ctx.bezierCurveTo(160,380,150,362,148,340); ctx.bezierCurveTo(145,315,150,290,162,274);
        ctx.bezierCurveTo(172,262,185,264,195,265);
        ctx.fill();
        // Greenland
        ctx.fillStyle='#c8dfc8';
        ctx.beginPath();
        ctx.moveTo(215,30); ctx.bezierCurveTo(235,22,258,25,262,38);
        ctx.bezierCurveTo(268,52,255,68,240,72);   ctx.bezierCurveTo(222,75,208,62,208,48);
        ctx.bezierCurveTo(206,40,210,34,215,30);
        ctx.fill();

        // Europe + Africa
        ctx.fillStyle='#2f7020';
        ctx.beginPath();
        ctx.moveTo(460,65); ctx.bezierCurveTo(478,58,500,62,508,78);
        ctx.bezierCurveTo(515,92,510,110,502,122);ctx.bezierCurveTo(510,130,515,148,508,162);
        ctx.bezierCurveTo(500,178,485,185,472,180);ctx.bezierCurveTo(458,175,450,160,452,145);
        ctx.bezierCurveTo(445,132,440,115,445,100);ctx.bezierCurveTo(448,82,452,68,460,65);
        ctx.fill();
        // Africa
        ctx.fillStyle='#3a8228';
        ctx.beginPath();
        ctx.moveTo(468,188); ctx.bezierCurveTo(492,182,515,188,524,205);
        ctx.bezierCurveTo(532,225,530,252,522,275);ctx.bezierCurveTo(514,298,505,320,495,340);
        ctx.bezierCurveTo(484,360,470,370,455,362);ctx.bezierCurveTo(440,352,432,330,434,305);
        ctx.bezierCurveTo(432,280,438,255,445,232);ctx.bezierCurveTo(452,208,458,192,468,188);
        ctx.fill();
        // Sahara hint (sandy overlay)
        ctx.fillStyle='rgba(200,175,100,0.25)';
        ctx.beginPath(); ctx.ellipse(482,215,38,22,0.3,0,Math.PI*2); ctx.fill();

        // Asia
        ctx.fillStyle='#2e6e1a';
        ctx.beginPath();
        ctx.moveTo(560,60); ctx.bezierCurveTo(590,50,640,55,680,65);
        ctx.bezierCurveTo(720,75,750,88,760,105);  ctx.bezierCurveTo(768,122,762,142,748,155);
        ctx.bezierCurveTo(730,168,708,175,685,172); ctx.bezierCurveTo(660,168,638,178,620,188);
        ctx.bezierCurveTo(600,198,582,192,568,180); ctx.bezierCurveTo(550,165,540,145,542,125);
        ctx.bezierCurveTo(544,105,550,78,560,60);
        ctx.fill();
        // India peninsula
        ctx.fillStyle='#357a20';
        ctx.beginPath();
        ctx.moveTo(618,185); ctx.bezierCurveTo(632,180,648,185,652,200);
        ctx.bezierCurveTo(656,218,648,238,638,250);ctx.bezierCurveTo(628,262,616,262,608,250);
        ctx.bezierCurveTo(598,238,598,215,606,200);ctx.bezierCurveTo(610,190,614,186,618,185);
        ctx.fill();
        // Southeast Asia / Indonesia
        ctx.fillStyle='#2e7018';
        [[742,195,30,14],[782,200,22,10],[818,198,28,11],[850,202,20,10]].forEach(([x,y,rx,ry])=>{
          ctx.beginPath(); ctx.ellipse(x,y,rx,ry,Math.random()*0.6,0,Math.PI*2); ctx.fill();
        });
        // Japan
        [[892,108,8,20],[900,132,6,16]].forEach(([x,y,rx,ry])=>{
          ctx.beginPath(); ctx.ellipse(x,y,rx,ry,-0.4,0,Math.PI*2); ctx.fill();
        });
        // Australia
        ctx.fillStyle='#4a8028';
        ctx.beginPath();
        ctx.moveTo(740,268); ctx.bezierCurveTo(768,260,808,265,828,280);
        ctx.bezierCurveTo(848,295,852,320,842,340);ctx.bezierCurveTo(830,360,808,370,785,365);
        ctx.bezierCurveTo(758,360,738,342,732,320);ctx.bezierCurveTo(726,298,728,274,740,268);
        ctx.fill();
        // Australian interior (outback)
        ctx.fillStyle='rgba(180,140,70,0.22)';
        ctx.beginPath(); ctx.ellipse(782,318,38,30,0,0,Math.PI*2); ctx.fill();

        // Mountain ranges (slightly lighter)
        ctx.fillStyle='rgba(120,155,80,0.30)';
        [[H/2,100,50,12,0.4],[H/2,480,65,15,0.2],[H/2,612,40,12,0.3]].forEach(([y,x,rx,ry,r])=>{
          ctx.beginPath(); ctx.ellipse(x,y,rx,ry,r,0,Math.PI*2); ctx.fill();
        });

        // ── Clouds ───────────────────────────────────────
        // Swirling cloud systems (weather fronts)
        const cloudSystems = [
          {x:150,y:80,  rx:100,ry:28,angle:-0.3,o:0.68},
          {x:360,y:55,  rx:80, ry:22,angle:0.2, o:0.55},
          {x:550,y:40,  rx:110,ry:20,angle:-0.15,o:0.60},
          {x:720,y:60,  rx:90, ry:25,angle:0.25, o:0.62},
          {x:880,y:75,  rx:95, ry:28,angle:-0.2, o:0.55},
          {x:200,y:155, rx:120,ry:30,angle:0.3,  o:0.50},
          {x:430,y:170, rx:85, ry:24,angle:-0.25,o:0.58},
          {x:680,y:160, rx:100,ry:26,angle:0.18, o:0.52},
          {x:900,y:155, rx:88, ry:22,angle:-0.3, o:0.55},
          {x:100,y:240, rx:95, ry:28,angle:0.15, o:0.48},
          {x:320,y:255, rx:110,ry:30,angle:-0.2, o:0.52},
          {x:560,y:245, rx:90, ry:25,angle:0.22, o:0.50},
          {x:790,y:250, rx:100,ry:28,angle:-0.18,o:0.48},
          {x:150,y:330, rx:85, ry:22,angle:0.25, o:0.55},
          {x:400,y:345, rx:100,ry:26,angle:-0.28,o:0.52},
          {x:640,y:338, rx:88, ry:24,angle:0.20, o:0.50},
          {x:860,y:332, rx:95, ry:26,angle:-0.22,o:0.53},
        ];
        cloudSystems.forEach(({x,y,rx,ry,angle,o}) => {
          // Multi-puff cloud mass
          for (let k=0;k<3;k++) {
            const ox=(k-1)*rx*0.35, oy=(k-1)*ry*0.25;
            const cg=ctx.createRadialGradient(x+ox,y+oy,0, x+ox,y+oy,rx*0.7);
            cg.addColorStop(0,  `rgba(255,255,255,${o})`);
            cg.addColorStop(0.5,`rgba(255,255,255,${o*0.55})`);
            cg.addColorStop(1,  'rgba(255,255,255,0)');
            ctx.fillStyle=cg;
            ctx.beginPath();
            ctx.ellipse(x+ox,y+oy,rx*(0.6+k*0.15),ry*(0.6+k*0.1),angle,0,Math.PI*2);
            ctx.fill();
          }
        });

        // Polar ice caps
        const arctic = ctx.createLinearGradient(0,0,0,68);
        arctic.addColorStop(0,'rgba(232,240,255,1.0)');
        arctic.addColorStop(0.7,'rgba(220,232,255,0.80)');
        arctic.addColorStop(1,'rgba(255,255,255,0)');
        ctx.fillStyle=arctic; ctx.fillRect(0,0,W,68);

        const antarctic = ctx.createLinearGradient(0,H-60,0,H);
        antarctic.addColorStop(0,'rgba(255,255,255,0)');
        antarctic.addColorStop(0.4,'rgba(225,235,255,0.85)');
        antarctic.addColorStop(1,'rgba(238,245,255,1.0)');
        ctx.fillStyle=antarctic; ctx.fillRect(0,H-60,W,60);
        break;
      }

      /* ── Mars ───────────────────────────────────────── */
      case 'Mars': {
        // Base: oxidised iron dust (rust red)
        const base = ctx.createLinearGradient(0,0,0,H);
        base.addColorStop(0,   '#c24010');
        base.addColorStop(0.3, '#d04c18');
        base.addColorStop(0.6, '#b83808');
        base.addColorStop(1,   '#c03e10');
        ctx.fillStyle = base; ctx.fillRect(0,0,W,H);

        // Terrain colour variation
        for (let i = 0; i < 120; i++) {
          const x=Math.random()*W, y=Math.random()*H, r=10+Math.random()*60;
          const mg=ctx.createRadialGradient(x,y,0,x,y,r);
          const dark = Math.random() > 0.5;
          mg.addColorStop(0, dark?`rgba(100,30,5,0.35)`:`rgba(200,110,50,0.30)`);
          mg.addColorStop(1,'rgba(0,0,0,0)');
          ctx.fillStyle=mg; ctx.fillRect(x-r,y-r,r*2,r*2);
        }

        // Tharsis volcanic plateau (large lighter region, upper left)
        const tharsis=ctx.createRadialGradient(W*0.2,H*0.38,0,W*0.2,H*0.38,W*0.22);
        tharsis.addColorStop(0,  'rgba(210,130,70,0.50)');
        tharsis.addColorStop(0.5,'rgba(190,100,45,0.30)');
        tharsis.addColorStop(1,  'rgba(0,0,0,0)');
        ctx.fillStyle=tharsis; ctx.fillRect(0,0,W*0.5,H);

        // Olympus Mons (shield volcano — circular lighter mound)
        const om=ctx.createRadialGradient(W*0.15,H*0.35,0,W*0.15,H*0.35,W*0.09);
        om.addColorStop(0,  'rgba(220,145,80,0.70)');
        om.addColorStop(0.35,'rgba(200,120,55,0.50)');
        om.addColorStop(0.7, 'rgba(175,90,35,0.25)');
        om.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.fillStyle=om; ctx.fillRect(0,0,W*0.32,H);

        // Valles Marineris (enormous canyon system — dark scar)
        ctx.save();
        ctx.translate(W*0.52, H*0.52);
        for (let s=0; s<3; s++) {
          ctx.strokeStyle=`rgba(65,18,3,${0.55-s*0.12})`;
          ctx.lineWidth = 6 - s*1.5;
          ctx.beginPath();
          ctx.moveTo(-W*0.25, s*2);
          ctx.bezierCurveTo(-W*0.1,H*0.02+s*2, W*0.05,-H*0.02+s*2, W*0.22, s*3);
          ctx.stroke();
        }
        ctx.restore();

        // Hellas Basin (large impact basin — southern hemisphere, darker)
        const hellas=ctx.createRadialGradient(W*0.78,H*0.72,0,W*0.78,H*0.72,W*0.10);
        hellas.addColorStop(0,  'rgba(150,60,15,0.55)');
        hellas.addColorStop(0.5,'rgba(120,45,10,0.35)');
        hellas.addColorStop(1,  'rgba(0,0,0,0)');
        ctx.fillStyle=hellas; ctx.fillRect(W*0.62,H*0.55,W*0.28,H*0.45);

        // Impact craters
        for (let i=0;i<35;i++){
          const x=Math.random()*W, y=H*0.08+Math.random()*(H*0.84), r=3+Math.random()*16;
          ctx.strokeStyle=`rgba(160,70,25,${0.3+Math.random()*0.3})`; ctx.lineWidth=1;
          ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.stroke();
          const cg=ctx.createRadialGradient(x,y,0,x,y,r*0.75);
          cg.addColorStop(0,`rgba(80,22,5,0.45)`); cg.addColorStop(1,'rgba(0,0,0,0)');
          ctx.fillStyle=cg; ctx.beginPath(); ctx.arc(x,y,r*0.75,0,Math.PI*2); ctx.fill();
        }

        // Polar ice caps (CO₂ + water ice — white with pink tinge)
        const pn=ctx.createLinearGradient(0,0,0,55);
        pn.addColorStop(0,'rgba(248,238,230,1.0)');
        pn.addColorStop(0.6,'rgba(240,225,210,0.80)');
        pn.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=pn; ctx.fillRect(0,0,W,55);

        const ps=ctx.createLinearGradient(0,H-48,0,H);
        ps.addColorStop(0,'rgba(0,0,0,0)');
        ps.addColorStop(0.5,'rgba(240,228,215,0.82)');
        ps.addColorStop(1,'rgba(248,238,230,1.0)');
        ctx.fillStyle=ps; ctx.fillRect(0,H-48,W,48);

        // Dust storm hints (semi-transparent orange wisps)
        for (let i=0;i<8;i++){
          const x=Math.random()*W, y=H*0.2+Math.random()*H*0.6;
          const dg=ctx.createRadialGradient(x,y,0,x,y,40+Math.random()*60);
          dg.addColorStop(0,`rgba(210,130,50,0.12)`); dg.addColorStop(1,'rgba(0,0,0,0)');
          ctx.fillStyle=dg; ctx.fillRect(x-80,y-60,160,120);
        }
        break;
      }

      /* ── Jupiter ────────────────────────────────────── */
      case 'Jupiter': {
        // Authentic band palette (from Cassini imagery)
        const bands = [
          { y:0.000, c:'#c8a878' },  // N polar hood
          { y:0.048, c:'#e0c090' },  // N Temperate zone
          { y:0.095, c:'#a06828' },  // N Temperate belt
          { y:0.148, c:'#d8b878' },  // N Tropical zone
          { y:0.205, c:'#885020' },  // N Equatorial belt
          { y:0.262, c:'#e8d098' },  // N Equatorial zone
          { y:0.310, c:'#d8b870' },  // Equatorial belt
          { y:0.370, c:'#f0dca8' },  // Equatorial zone (brightest)
          { y:0.420, c:'#c09050' },  // S Equatorial belt
          { y:0.478, c:'#e0c890' },  // S Tropical zone
          { y:0.530, c:'#986030' },  // S Temperate belt
          { y:0.582, c:'#d4b070' },  // S Temperate zone
          { y:0.638, c:'#906030' },  // S S Temperate belt
          { y:0.695, c:'#c8a868' },  // S S Temperate zone
          { y:0.750, c:'#885030' },  // S polar belt
          { y:0.812, c:'#b89868' },  // S polar zone
          { y:0.875, c:'#907060' },  // S polar hood
          { y:1.000, c:'#a08068' },  // pole
        ];
        for (let i = 0; i < bands.length - 1; i++) {
          const y0 = bands[i].y * H, y1 = bands[i+1].y * H;
          const g = ctx.createLinearGradient(0, y0, 0, y1);
          g.addColorStop(0, bands[i].c);
          g.addColorStop(1, bands[i+1].c);
          ctx.fillStyle = g; ctx.fillRect(0, y0, W, y1 - y0 + 1);
        }

        // Band turbulence — wavy edges at belt/zone boundaries
        bands.slice(1,-1).forEach((b,i) => {
          const y = b.y * H;
          ctx.strokeStyle = `rgba(90,48,12,0.18)`;
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(0, y);
          for (let x=0; x<=W; x+=12)
            ctx.lineTo(x, y + Math.sin(x*0.022+i*1.7)*7 + Math.sin(x*0.008+i*0.9)*4);
          ctx.stroke();
        });

        // Festoon details at equator (dark blue-grey ovals)
        for (let i=0;i<8;i++){
          const x=i*(W/8)+W/16, y=H*0.36+Math.random()*H*0.06;
          const fg=ctx.createRadialGradient(x,y,0,x,y,22);
          fg.addColorStop(0,'rgba(80,55,30,0.42)'); fg.addColorStop(1,'rgba(0,0,0,0)');
          ctx.fillStyle=fg; ctx.beginPath(); ctx.ellipse(x,y,22,11,0,0,Math.PI*2); ctx.fill();
        }

        // White oval storms (S Temperate zone)
        for (let i=0;i<5;i++){
          const x=80+i*(W/5)+Math.random()*50, y=H*0.54+Math.random()*H*0.04;
          const wg=ctx.createRadialGradient(x,y,0,x,y,16);
          wg.addColorStop(0,'rgba(240,228,198,0.85)'); wg.addColorStop(0.6,'rgba(220,205,170,0.55)'); wg.addColorStop(1,'rgba(0,0,0,0)');
          ctx.fillStyle=wg; ctx.beginPath(); ctx.ellipse(x,y,18,10,-0.1,0,Math.PI*2); ctx.fill();
        }

        // Great Red Spot — iconic anticyclone
        const gx = W*0.30, gy = H*0.572;
        // Outer halo
        const grh=ctx.createRadialGradient(gx,gy,0,gx,gy,W*0.07);
        grh.addColorStop(0,'rgba(150,48,22,0)');
        grh.addColorStop(0.6,'rgba(140,45,20,0.35)');
        grh.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=grh; ctx.beginPath(); ctx.ellipse(gx,gy,W*0.072,H*0.052,-0.12,0,Math.PI*2); ctx.fill();
        // Main oval
        const grs=ctx.createRadialGradient(gx,gy,0,gx,gy,W*0.055);
        grs.addColorStop(0,  'rgba(195,68,28,0.95)');
        grs.addColorStop(0.3,'rgba(178,58,22,0.88)');
        grs.addColorStop(0.65,'rgba(155,48,18,0.70)');
        grs.addColorStop(1,  'rgba(120,38,14,0)');
        ctx.fillStyle=grs; ctx.beginPath(); ctx.ellipse(gx,gy,W*0.055,H*0.040,-0.12,0,Math.PI*2); ctx.fill();
        // Inner bright core
        const grc=ctx.createRadialGradient(gx-W*0.01,gy-H*0.008,0,gx,gy,W*0.028);
        grc.addColorStop(0,'rgba(225,130,80,0.60)');
        grc.addColorStop(0.5,'rgba(200,90,45,0.35)');
        grc.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=grc; ctx.beginPath(); ctx.ellipse(gx-W*0.01,gy-H*0.008,W*0.025,H*0.018,-0.12,0,Math.PI*2); ctx.fill();
        // Swirl rings
        ctx.strokeStyle='rgba(170,55,20,0.35)'; ctx.lineWidth=1.5;
        [0.85,0.65,0.45].forEach(scale=>{
          ctx.beginPath(); ctx.ellipse(gx,gy,W*0.055*scale,H*0.040*scale,-0.12,0,Math.PI*2); ctx.stroke();
        });
        break;
      }

      /* ── Saturn ─────────────────────────────────────── */
      case 'Saturn': {
        // Warm pale gold base
        const base=ctx.createLinearGradient(0,0,0,H);
        base.addColorStop(0,  '#d8c888');
        base.addColorStop(0.18,'#eedea0');
        base.addColorStop(0.35,'#f5e8a8');
        base.addColorStop(0.50,'#ede090');
        base.addColorStop(0.65,'#e8d898');
        base.addColorStop(0.82,'#d8c880');
        base.addColorStop(1,   '#c8b870');
        ctx.fillStyle=base; ctx.fillRect(0,0,W,H);

        // Subtle latitudinal bands
        const satBands=[
          {y:0.05,c:'rgba(180,150,75,0.22)'},
          {y:0.15,c:'rgba(210,185,115,0.18)'},
          {y:0.25,c:'rgba(165,138,65,0.20)'},
          {y:0.38,c:'rgba(195,168,95,0.16)'},
          {y:0.50,c:'rgba(175,148,70,0.20)'},
          {y:0.62,c:'rgba(200,172,98,0.17)'},
          {y:0.74,c:'rgba(168,142,68,0.19)'},
          {y:0.87,c:'rgba(185,158,80,0.18)'},
        ];
        satBands.forEach(({y,c})=>{
          const ht=H*0.06;
          const bg=ctx.createLinearGradient(0,y*H,0,(y+0.05)*H);
          bg.addColorStop(0,'rgba(0,0,0,0)'); bg.addColorStop(0.5,c); bg.addColorStop(1,'rgba(0,0,0,0)');
          ctx.fillStyle=bg; ctx.fillRect(0,y*H,W,ht);
        });

        // North polar hexagon (subtle)
        ctx.save();
        ctx.translate(W/2, H*0.09);
        ctx.scale(1, 0.38);
        ctx.strokeStyle='rgba(155,125,55,0.42)'; ctx.lineWidth=2.5;
        ctx.beginPath();
        for(let k=0;k<7;k++){
          const a=k*Math.PI/3-Math.PI/6;
          k===0?ctx.moveTo(Math.cos(a)*W*0.16,Math.sin(a)*W*0.16)
              :ctx.lineTo(Math.cos(a)*W*0.16,Math.sin(a)*W*0.16);
        }
        ctx.closePath(); ctx.stroke();
        ctx.restore();

        // Polar darkening
        const pn=ctx.createLinearGradient(0,0,0,H*0.18);
        pn.addColorStop(0,'rgba(120,95,40,0.45)'); pn.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=pn; ctx.fillRect(0,0,W,H*0.18);
        const ps=ctx.createLinearGradient(0,H*0.82,0,H);
        ps.addColorStop(0,'rgba(0,0,0,0)'); ps.addColorStop(1,'rgba(110,88,36,0.42)');
        ctx.fillStyle=ps; ctx.fillRect(0,H*0.82,W,H*0.18);
        break;
      }

      /* ── Uranus ─────────────────────────────────────── */
      case 'Uranus': {
        // Pale cyan — nearly featureless (accurate!)
        const base=ctx.createLinearGradient(0,0,0,H);
        base.addColorStop(0,   '#88dde8');
        base.addColorStop(0.25,'#78d4e0');
        base.addColorStop(0.50,'#70ccd8');
        base.addColorStop(0.75,'#78d4e0');
        base.addColorStop(1,   '#88dde8');
        ctx.fillStyle=base; ctx.fillRect(0,0,W,H);

        // Very faint bands (Uranus is almost completely smooth)
        for(let i=0;i<5;i++){
          const y=H*(0.15+i*0.16), ht=H*0.06;
          const bg=ctx.createLinearGradient(0,y,0,y+ht);
          bg.addColorStop(0,'rgba(0,0,0,0)');
          bg.addColorStop(0.5,`rgba(${i%2?80:50},${i%2?210:185},${i%2?200:210},0.07)`);
          bg.addColorStop(1,'rgba(0,0,0,0)');
          ctx.fillStyle=bg; ctx.fillRect(0,y,W,ht);
        }

        // Polar brightening (methane haze scatters more at poles)
        ['top','bot'].forEach((pos,idx)=>{
          const pg=ctx.createLinearGradient(0,idx===0?0:H*0.85,0,idx===0?H*0.18:H);
          pg.addColorStop(0,idx===0?'rgba(140,220,235,0.45)':'rgba(0,0,0,0)');
          pg.addColorStop(1,idx===0?'rgba(0,0,0,0)':'rgba(140,220,235,0.42)');
          ctx.fillStyle=pg; ctx.fillRect(0,idx===0?0:H*0.85,W,H*0.18);
        });

        // Limb darkening (edges darker — subtle)
        const ld=ctx.createLinearGradient(0,0,W,0);
        ld.addColorStop(0,'rgba(0,50,70,0.25)'); ld.addColorStop(0.15,'rgba(0,0,0,0)');
        ld.addColorStop(0.85,'rgba(0,0,0,0)'); ld.addColorStop(1,'rgba(0,50,70,0.25)');
        ctx.fillStyle=ld; ctx.fillRect(0,0,W,H);
        break;
      }

      /* ── Neptune ────────────────────────────────────── */
      case 'Neptune': {
        // Deep cobalt-to-indigo blue
        const base=ctx.createLinearGradient(0,0,0,H);
        base.addColorStop(0,   '#1020b8');
        base.addColorStop(0.25,'#0c18b0');
        base.addColorStop(0.50,'#0810a8');
        base.addColorStop(0.75,'#0c18b0');
        base.addColorStop(1,   '#1020b8');
        ctx.fillStyle=base; ctx.fillRect(0,0,W,H);

        // Dark equatorial belt
        const deq=ctx.createLinearGradient(0,H*0.38,0,H*0.62);
        deq.addColorStop(0,'rgba(0,0,0,0)');
        deq.addColorStop(0.5,'rgba(5,8,80,0.38)');
        deq.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=deq; ctx.fillRect(0,H*0.38,W,H*0.24);

        // Great Dark Spot (large anticyclone)
        const gx=W*0.62, gy=H*0.42;
        const gds=ctx.createRadialGradient(gx,gy,0,gx,gy,W*0.10);
        gds.addColorStop(0,  'rgba(4,6,55,0.88)');
        gds.addColorStop(0.4,'rgba(5,8,65,0.65)');
        gds.addColorStop(0.75,'rgba(8,12,80,0.35)');
        gds.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.fillStyle=gds; ctx.beginPath(); ctx.ellipse(gx,gy,W*0.10,H*0.060,-0.18,0,Math.PI*2); ctx.fill();
        // Scooter (small bright companion cloud)
        const sc=ctx.createRadialGradient(gx+W*0.07,gy+H*0.02,0,gx+W*0.07,gy,W*0.025);
        sc.addColorStop(0,'rgba(160,180,255,0.65)'); sc.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=sc; ctx.beginPath(); ctx.ellipse(gx+W*0.07,gy+H*0.02,W*0.025,H*0.015,0.2,0,Math.PI*2); ctx.fill();

        // Methane ice cloud streaks (fast-moving, bright white)
        const streaks=[
          {x:W*0.08,y:H*0.28,len:W*0.18,ry:H*0.018,a:0.05},
          {x:W*0.30,y:H*0.32,len:W*0.22,ry:H*0.014,a:-0.04},
          {x:W*0.62,y:H*0.22,len:W*0.16,ry:H*0.016,a:0.06},
          {x:W*0.80,y:H*0.35,len:W*0.14,ry:H*0.012,a:-0.03},
          {x:W*0.12,y:H*0.58,len:W*0.20,ry:H*0.015,a:0.04},
          {x:W*0.44,y:H*0.62,len:W*0.18,ry:H*0.013,a:-0.05},
          {x:W*0.72,y:H*0.55,len:W*0.16,ry:H*0.016,a:0.03},
          {x:W*0.22,y:H*0.72,len:W*0.15,ry:H*0.012,a:-0.04},
          {x:W*0.55,y:H*0.78,len:W*0.20,ry:H*0.014,a:0.05},
          {x:W*0.85,y:H*0.68,len:W*0.12,ry:H*0.011,a:-0.03},
        ];
        streaks.forEach(({x,y,len,ry,a})=>{
          const sg=ctx.createLinearGradient(x,y,x+len,y);
          sg.addColorStop(0,'rgba(200,215,255,0)');
          sg.addColorStop(0.25,`rgba(210,225,255,${0.30+Math.random()*0.25})`);
          sg.addColorStop(0.75,`rgba(205,220,255,${0.25+Math.random()*0.20})`);
          sg.addColorStop(1,'rgba(200,215,255,0)');
          ctx.fillStyle=sg;
          ctx.beginPath(); ctx.ellipse(x+len/2,y,len/2,ry,a,0,Math.PI*2); ctx.fill();
        });

        // Polar brightening (blue-white)
        ['top','bot'].forEach((_,idx)=>{
          const pg=ctx.createLinearGradient(0,idx===0?0:H*0.86,0,idx===0?H*0.16:H);
          pg.addColorStop(0,idx===0?'rgba(60,80,200,0.45)':'rgba(0,0,0,0)');
          pg.addColorStop(1,idx===0?'rgba(0,0,0,0)':'rgba(55,75,195,0.42)');
          ctx.fillStyle=pg; ctx.fillRect(0,idx===0?0:H*0.86,W,H*0.16);
        });
        break;
      }

      default:
        return null;
    }

    return new THREE.CanvasTexture(c);
  }

  // ── Build planet mesh ────────────────────────────────────
  _buildPlanet(data) {
    const geo = new THREE.SphereGeometry(data.radius, 56, 56);
    const tex = this._makeTexture(data.name);

    const mat = new THREE.MeshStandardMaterial({
      map:              tex || null,
      color:            tex ? 0xffffff : data.color,
      emissive:         data.emissive,
      emissiveIntensity: 0.04,
      roughness:        0.88,
      metalness:        0.02,
    });

    const mesh = new THREE.Mesh(geo, mat);

    // Axial tilt
    const tilts = {
      Mercury:0.034, Venus:177.4, Earth:23.44, Mars:25.19,
      Jupiter:3.13,  Saturn:26.73, Uranus:97.77, Neptune:28.32
    };
    mesh.rotation.z = THREE.MathUtils.degToRad(tilts[data.name] || 0);
    mesh.castShadow    = true;
    mesh.receiveShadow = true;
    mesh.userData      = { planetData: data };

    // ── Atmosphere glow ──────────────────────────────────
    const atm = {
      Earth:   { c:0x4a90d9, o:0.15, s:1.055 },
      Venus:   { c:0xffe898, o:0.20, s:1.045 },
      Mars:    { c:0xd05030, o:0.08, s:1.032 },
      Jupiter: { c:0xd4a060, o:0.06, s:1.020 },
      Saturn:  { c:0xe8d080, o:0.06, s:1.020 },
      Uranus:  { c:0x70d8e0, o:0.11, s:1.045 },
      Neptune: { c:0x2040c0, o:0.13, s:1.045 },
    }[data.name];

    if (atm) {
      // Inner glow
      mesh.add(new THREE.Mesh(
        new THREE.SphereGeometry(data.radius * atm.s, 36, 36),
        new THREE.MeshBasicMaterial({
          color: atm.c, transparent: true, opacity: atm.o,
          depthWrite: false, side: THREE.BackSide
        })
      ));
      // Outer haze (fainter)
      mesh.add(new THREE.Mesh(
        new THREE.SphereGeometry(data.radius * (atm.s + 0.05), 24, 24),
        new THREE.MeshBasicMaterial({
          color: atm.c, transparent: true, opacity: atm.o * 0.35,
          depthWrite: false, side: THREE.BackSide
        })
      ));
    }

    // ── Saturn rings ─────────────────────────────────────
    if (data.hasRings) {
      const ringDefs = [
        { inner:1.22, outer:1.50, rgb:[200,180,118], o:0.68 }, // C ring
        { inner:1.52, outer:1.62, rgb:[140,118,78],  o:0.14 }, // Cassini Division
        { inner:1.64, outer:2.02, rgb:[232,212,148], o:0.92 }, // B ring (brightest)
        { inner:2.04, outer:2.28, rgb:[215,195,130], o:0.65 }, // A ring inner
        { inner:2.28, outer:2.46, rgb:[195,178,118], o:0.50 }, // A ring outer (Encke gap subtle)
      ];
      ringDefs.forEach(rd => {
        const rGeo  = new THREE.RingGeometry(data.radius*rd.inner, data.radius*rd.outer, 180, 4);
        const posA  = rGeo.attributes.position;
        const uvA   = rGeo.attributes.uv;
        const v3    = new THREE.Vector3();
        const inner = data.radius * rd.inner;
        const outer = data.radius * rd.outer;
        for (let i = 0; i < posA.count; i++) {
          v3.fromBufferAttribute(posA, i);
          uvA.setXY(i, (v3.length() - inner) / (outer - inner), 1);
        }
        const rc   = document.createElement('canvas');
        rc.width   = 256; rc.height = 1;
        const rctx = rc.getContext('2d');
        const [r,g,b] = rd.rgb;
        const isCassini = rd.o < 0.20;
        const grd  = rctx.createLinearGradient(0,0,256,0);
        if (isCassini) {
          grd.addColorStop(0,  `rgba(${r},${g},${b},0.08)`);
          grd.addColorStop(0.5,`rgba(${r},${g},${b},0.04)`);
          grd.addColorStop(1,  `rgba(${r},${g},${b},0.08)`);
        } else {
          grd.addColorStop(0,   `rgba(${r},${g},${b},0)`);
          grd.addColorStop(0.05,`rgba(${r},${g},${b},${(rd.o*0.5).toFixed(2)})`);
          grd.addColorStop(0.25,`rgba(${r},${g},${b},${rd.o.toFixed(2)})`);
          grd.addColorStop(0.75,`rgba(${r},${g},${b},${(rd.o*0.90).toFixed(2)})`);
          grd.addColorStop(0.95,`rgba(${r},${g},${b},${(rd.o*0.45).toFixed(2)})`);
          grd.addColorStop(1,   `rgba(${r},${g},${b},0)`);
        }
        rctx.fillStyle = grd; rctx.fillRect(0,0,256,1);
        mesh.add(new THREE.Mesh(rGeo, new THREE.MeshBasicMaterial({
          map: new THREE.CanvasTexture(rc),
          side: THREE.DoubleSide, transparent: true, depthWrite: false, opacity: 1.0
        })));
      });
      // Fix ring rotation after adding all bands
      mesh.children.filter(c => c.geometry && c.geometry.type === 'RingGeometry')
        .forEach(ring => { ring.rotation.x = Math.PI / 2; });
    }

    // ── Elliptical orbit line ────────────────────────────
    const orbitPts = buildOrbitPoints(data, 512);
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPts);
    const orbitLine = new THREE.LineLoop(orbitGeo,
      new THREE.LineBasicMaterial({ color: 0x5599ee, transparent: true, opacity: 0.55 })
    );
    this.scene.add(orbitLine);
    this.scene.add(mesh);
    this.planets.push({ mesh, data, orbitLine });
  }

  // ── Asteroid belt ────────────────────────────────────────
  _buildAsteroidBelt() {
    const marsAU = 1.524, jupAU = 5.203;
    const marsD  = SCALE.Mars, jupD = SCALE.Jupiter;
    const toD    = au => marsD + ((au - marsAU) / (jupAU - marsAU)) * (jupD - marsD);

    const count = 2000;
    const pos   = new Float32Array(count * 3);
    const col   = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r     = toD(2.2 + Math.random() * 1.0);
      const y     = (Math.random() - 0.5) * r * 0.065;
      pos[i*3]   = r * Math.cos(angle);
      pos[i*3+1] = y;
      pos[i*3+2] = r * Math.sin(angle);
      const g = 0.38 + Math.random() * 0.28;
      col[i*3] = g+0.07; col[i*3+1] = g+0.02; col[i*3+2] = g-0.04;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
    this.asteroidBelt = new THREE.Points(geo,
      new THREE.PointsMaterial({ size: 0.20, vertexColors: true, sizeAttenuation: true })
    );
    this.scene.add(this.asteroidBelt);
  }
}