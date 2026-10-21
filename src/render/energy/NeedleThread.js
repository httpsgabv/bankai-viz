import * as THREE from 'three';

const SAMPLES = 48;

/**
 * Benihime's sewing needle at the cursor, trailing a crimson thread through the
 * pointer's recent path. The thread is a camera-facing ribbon so it stays visible.
 */
export class NeedleThread {
  #sample = new Float32Array(3);
  #points = Array.from({ length: SAMPLES }, () => new THREE.Vector3());
  #tangent = new THREE.Vector3();
  #toCamera = new THREE.Vector3();
  #side = new THREE.Vector3();

  constructor({ color = '#c8102e', width = 0.035 } = {}) {
    this.width = width;
    this.object = new THREE.Group();

    const needleMaterial = new THREE.MeshStandardMaterial({ color: '#d8dade', metalness: 0.8, roughness: 0.25 });
    this.needle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.028, 0.9, 10), needleMaterial);
    const eye = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.01, 6, 16), needleMaterial);
    eye.position.y = 0.47;
    this.needle.add(eye);

    const geometry = new THREE.BufferGeometry();
    this.positions = new THREE.BufferAttribute(new Float32Array(SAMPLES * 2 * 3), 3).setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('position', this.positions);
    const indices = [];
    for (let i = 0; i < SAMPLES - 1; i++) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    geometry.setIndex(indices);
    this.threadMaterial = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true });
    this.thread = new THREE.Mesh(geometry, this.threadMaterial);
    this.thread.frustumCulled = false;

    this.object.add(this.needle, this.thread);
  }

  setColor(color) {
    this.threadMaterial.color.set(color);
  }

  /** @param visibility 0 → hidden, 1 → fully shown */
  update(trail, camera, visibility) {
    this.object.visible = visibility > 0.02;
    this.threadMaterial.opacity = visibility;
    if (!this.object.visible) return;

    for (let i = 0; i < SAMPLES; i++) {
      trail.sample(i / (SAMPLES - 1), SAMPLES, this.#sample);
      this.#points[i].fromArray(this.#sample);
    }

    // Needle points along the direction of travel, eye trailing.
    this.#tangent.subVectors(this.#points[0], this.#points[4]);
    if (this.#tangent.lengthSq() < 1e-6) this.#tangent.set(0.3, 1, 0);
    this.needle.position.copy(this.#points[0]);
    this.needle.quaternion.setFromUnitVectors(THREE.Object3D.DEFAULT_UP, this.#tangent.normalize().negate());

    const array = this.positions.array;
    for (let i = 0; i < SAMPLES; i++) {
      const point = this.#points[i];
      const next = this.#points[Math.min(SAMPLES - 1, i + 1)];
      const prev = this.#points[Math.max(0, i - 1)];
      this.#tangent.subVectors(prev, next);
      this.#toCamera.subVectors(camera.position, point);
      this.#side.crossVectors(this.#tangent, this.#toCamera);
      if (this.#side.lengthSq() < 1e-8) this.#side.set(1, 0, 0);
      this.#side.normalize().multiplyScalar(this.width * (1 - (i / SAMPLES) * 0.6));
      array.set([point.x + this.#side.x, point.y + this.#side.y, point.z + this.#side.z], i * 6);
      array.set([point.x - this.#side.x, point.y - this.#side.y, point.z - this.#side.z], i * 6 + 3);
    }
    this.positions.needsUpdate = true;
  }
}
