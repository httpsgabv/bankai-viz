import * as THREE from 'three';
import { clamp01 } from '../../utils/math.js';

const FADE_SECONDS = 1.8;

/**
 * Crimson cross-stitches sewn across a cut: each stitch is an X spanning the gap, so the
 * thread visibly pulls the two halves together as the gap closes.
 */
export class StitchSeam {
  #age = Infinity;
  #matrix = new THREE.Matrix4();
  #a = new THREE.Vector3();
  #b = new THREE.Vector3();
  #mid = new THREE.Vector3();
  #direction = new THREE.Vector3();
  #quaternion = new THREE.Quaternion();
  #scale = new THREE.Vector3();
  #depth = new THREE.Vector3();

  constructor({ stitches = 14, color = '#c8102e' } = {}) {
    this.stitches = stitches;
    this.material = new THREE.MeshStandardMaterial({ color, roughness: 0.5, transparent: true });
    this.mesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 6), this.material, stitches * 2);
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
  }

  get object() {
    return this.mesh;
  }

  setColor(color) {
    this.material.color.set(color);
  }

  /** Starts showing stitches; they fade a while after the seam has closed. */
  sew() {
    this.#age = 0;
  }

  /**
   * @param origin  a point on the cutting plane
   * @param normal  the cutting plane normal (the halves separate along it)
   * @param halfGap current distance from the plane to each half
   * @param centerY height the seam is centred on
   * @param height  seam height
   * @param camera  used to keep stitches on the visible face
   */
  update(dt, { origin, normal, halfGap, centerY, height, camera, closed }) {
    if (closed) this.#age += dt;
    const fade = 1 - clamp01((this.#age - 0.4) / FADE_SECONDS);
    this.mesh.visible = fade > 0;
    if (!this.mesh.visible) return;
    this.material.opacity = fade;

    this.#depth.subVectors(camera.position, origin).normalize().multiplyScalar(0.6);
    const span = halfGap + 0.12;
    for (let s = 0; s < this.stitches; s++) {
      const y = centerY + (s / (this.stitches - 1) - 0.5) * height;
      const step = height / this.stitches / 2;
      for (let leg = 0; leg < 2; leg++) {
        const flip = leg ? 1 : -1;
        this.#a.copy(origin).addScaledVector(normal, -span).add(this.#depth);
        this.#b.copy(origin).addScaledVector(normal, span).add(this.#depth);
        this.#a.y = y - step * flip;
        this.#b.y = y + step * flip;
        this.#place(s * 2 + leg);
      }
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  #place(index) {
    this.#direction.subVectors(this.#b, this.#a);
    const length = this.#direction.length();
    this.#mid.addVectors(this.#a, this.#b).multiplyScalar(0.5);
    this.#quaternion.setFromUnitVectors(THREE.Object3D.DEFAULT_UP, this.#direction.normalize());
    this.#scale.set(1, length, 1);
    this.mesh.setMatrixAt(index, this.#matrix.compose(this.#mid, this.#quaternion, this.#scale));
  }
}
