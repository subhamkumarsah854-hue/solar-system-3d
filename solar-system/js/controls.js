// ── SolarControls — orbit camera with dynamic target support ──
class SolarControls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.dom = domElement;
    this.spherical = { r: 520, theta: 0, phi: Math.PI / 3.5 };
    this.target = new THREE.Vector3(0, 0, 0); // ← dynamic orbit centre
    this.enabled = true;
    this._dragging = false;
    this._prev = { x: 0, y: 0 };
    this._pinchDist = null;
    this._tmpVec = new THREE.Vector3();
    this._tmpRight = new THREE.Vector3();
    this._bind();
    this._update();
  }

  rotate(deltaTheta, deltaPhi = 0) {
    if (!this.enabled) return;
    this.spherical.theta += deltaTheta;
    this.spherical.phi = Math.max(0.05, Math.min(Math.PI - 0.05, this.spherical.phi + deltaPhi));
    this._update();
  }

  zoom(delta) {
    if (!this.enabled) return;
    this._zoom(delta);
  }

  pan(x, z) {
    if (!this.enabled) return;
    this.camera.getWorldDirection(this._tmpVec);
    this._tmpVec.y = 0;
    this._tmpVec.normalize();
    this._tmpRight.crossVectors(this._tmpVec, this.camera.up).normalize();
    this.target.addScaledVector(this._tmpRight, x);
    this.target.addScaledVector(this._tmpVec, z);
    this._update();
  }

  _bind() {
    this.dom.addEventListener('mousedown',  e => {
      if (!this.enabled) return;
      this._dragging = true;
      this._prev = { x: e.clientX, y: e.clientY };
    });
    this.dom.addEventListener('mousemove',  e => this._onMove(e.clientX, e.clientY));
    this.dom.addEventListener('mouseup',    () => { this._dragging = false; });
    this.dom.addEventListener('mouseleave', () => { this._dragging = false; });
    this.dom.addEventListener('wheel',      e => {
      if (!this.enabled) return;
      this._zoom(e.deltaY * 0.12);
      e.preventDefault();
    }, { passive: false });
    this.dom.addEventListener('touchstart', e => {
      if (e.touches.length === 1) {
        this._dragging = true;
        this._prev = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      if (e.touches.length === 2) this._pinchDist = this._dist(e.touches);
    });
    this.dom.addEventListener('touchmove', e => {
      if (e.touches.length === 1) this._onMove(e.touches[0].clientX, e.touches[0].clientY);
      if (e.touches.length === 2) {
        const d = this._dist(e.touches);
        if (this._pinchDist) this._zoom((this._pinchDist - d) * 0.5);
        this._pinchDist = d;
      }
      e.preventDefault();
    }, { passive: false });
    this.dom.addEventListener('touchend', () => { this._dragging = false; this._pinchDist = null; });
  }

  _dist(t) {
    const dx = t[0].clientX - t[1].clientX, dy = t[0].clientY - t[1].clientY;
    return Math.sqrt(dx*dx + dy*dy);
  }

  _onMove(x, y) {
    if (!this._dragging || !this.enabled) return;
    const dx = x - this._prev.x, dy = y - this._prev.y;
    this.spherical.theta -= dx * 0.005;
    this.spherical.phi = Math.max(0.05, Math.min(Math.PI - 0.05, this.spherical.phi + dy * 0.005));
    this._prev = { x, y };
    this._update();
  }

  _zoom(delta) {
    this.spherical.r = Math.max(8, Math.min(800, this.spherical.r + delta));
    this._update();
  }

  _update() {
    const { r, theta, phi } = this.spherical;
    this.camera.position.set(
      this.target.x + r * Math.sin(phi) * Math.cos(theta),
      this.target.y + r * Math.cos(phi),
      this.target.z + r * Math.sin(phi) * Math.sin(theta)
    );
    this.camera.lookAt(this.target);
  }
}