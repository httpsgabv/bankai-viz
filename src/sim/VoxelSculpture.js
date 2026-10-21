import * as THREE from 'three';
import { VOXEL_FORMS, sampleForm } from './voxelForms.js';
import { easeInOutCubic } from '../utils/math.js';

const HEAT_COOLING = 1.1;
const SPRING = 9;

/**
 * A sculpture of voxels that can be restructured into other forms.
 * - restructure(origin): voxels re-form into the next shape in a wave spreading from `origin`
 * - needle: voxels near the needle are pushed aside and glow
 * - cut: the sculpture is split along a plane and pushed apart (then sewn back)
 * Outputs per-voxel `render` positions, `sizes`, `angles` and `heat` for drawing.
 */
export class VoxelSculpture {
  waveSpeed = 6;
  duration = 1.2;
  arc = 0.6;
  needleRadius = 1.1;
  needlePush = 0.6;
  gap = 1.6;
  cut = 0;

  #time = 0;
  #cutOrigin = new THREE.Vector3();
  #cutNormal = new THREE.Vector3(1, 0, 0);

  constructor(count, { center, radius }) {
    this.count = count;
    this.center = center.clone();
    this.radius = radius;
    this.forms = VOXEL_FORMS.map((form) => {
      const { points, spacing } = sampleForm(form, count);
      for (let k = 0; k < points.length; k += 3) {
        points[k] = center.x + points[k] * radius;
        points[k + 1] = center.y + points[k + 1] * radius;
        points[k + 2] = center.z + points[k + 2] * radius;
      }
      return { name: form.name, points, size: spacing * radius * 0.82 };
    });
    this.formIndex = 0;

    const vec3 = () => new Float32Array(count * 3);
    this.base = vec3();
    this.from = vec3();
    this.to = vec3();
    this.offset = vec3();
    this.render = vec3();
    this.axes = vec3();
    this.startAt = new Float64Array(count).fill(Infinity);
    this.progress = new Float32Array(count).fill(1);
    this.sizeFrom = new Float32Array(count);
    this.sizeTo = new Float32Array(count);
    this.sizes = new Float32Array(count);
    this.angles = new Float32Array(count);
    // A full turn during each flight, so voxels land square on the lattice again.
    this.spin = Float32Array.from({ length: count }, () => (Math.random() < 0.5 ? -1 : 1) * Math.PI * 2);
    this.heat = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const axis = new THREE.Vector3().randomDirection();
      this.axes.set([axis.x, axis.y, axis.z], i * 3);
    }
    this.scatter(14);
    this.#settle();
  }

  get form() {
    return this.forms[this.formIndex];
  }

  get isRestructuring() {
    for (let i = 0; i < this.count; i++) if (this.progress[i] < 1) return true;
    return false;
  }

  /**
   * Instantly flings every voxel out to a random spot about `distance` away
   * (kept behind `maxZ` so none land in the camera's face).
   */
  scatter(distance, maxZ = 4) {
    const direction = new THREE.Vector3();
    for (let i = 0; i < this.count; i++) {
      direction.randomDirection().multiplyScalar(distance * (0.6 + Math.random() * 0.8));
      const z = Math.min(this.center.z + direction.z, maxZ);
      this.base.set([this.center.x + direction.x, Math.max(0.3, this.center.y + direction.y), z], i * 3);
      this.sizes[i] = this.sizeTo[i] = this.form.size;
    }
  }

  /** Re-forms into `formIndex` (default: next form), spreading outwards from `origin`. */
  restructure(origin, formIndex = (this.formIndex + 1) % this.forms.length) {
    this.formIndex = formIndex;
    const target = this.form;
    for (let i = 0; i < this.count; i++) {
      const k = i * 3;
      const dx = this.render[k] - origin.x;
      const dy = this.render[k + 1] - origin.y;
      const dz = this.render[k + 2] - origin.z;
      this.from.set(this.base.subarray(k, k + 3), k);
      this.to.set(target.points.subarray(k, k + 3), k);
      this.sizeFrom[i] = this.sizes[i];
      this.sizeTo[i] = target.size;
      this.startAt[i] = this.#time + Math.sqrt(dx * dx + dy * dy + dz * dz) / this.waveSpeed;
      this.progress[i] = 0;
    }
  }

  /** Sets the cutting plane (through `origin`, facing `normal`). */
  setCutPlane(origin, normal) {
    this.#cutOrigin.copy(origin);
    this.#cutNormal.copy(normal).normalize();
  }

  get cutOrigin() {
    return this.#cutOrigin;
  }

  get cutNormal() {
    return this.#cutNormal;
  }

  /** @param needle world position of the needle, or null when it is away */
  update(dt, needle) {
    this.#time += dt;
    for (let i = 0; i < this.count; i++) {
      this.#advance(i, dt);
      this.#applyNeedle(i, dt, needle);
      this.heat[i] = Math.max(0, this.heat[i] - dt * HEAT_COOLING);
    }
    this.#composeRender();
  }

  #advance(i, dt) {
    if (this.progress[i] >= 1 || this.#time < this.startAt[i]) return;
    const k = i * 3;
    this.progress[i] = Math.min(1, this.progress[i] + dt / this.duration);
    const t = easeInOutCubic(this.progress[i]);

    // Quadratic Bézier with the control point bulging away from the sculpture's centre.
    const fx = this.from[k], fy = this.from[k + 1], fz = this.from[k + 2];
    const tx = this.to[k], ty = this.to[k + 1], tz = this.to[k + 2];
    let mx = (fx + tx) / 2 - this.center.x;
    let my = (fy + ty) / 2 - this.center.y;
    let mz = (fz + tz) / 2 - this.center.z;
    const mLength = Math.sqrt(mx * mx + my * my + mz * mz) || 1;
    const lift = Math.sqrt((tx - fx) ** 2 + (ty - fy) ** 2 + (tz - fz) ** 2) * this.arc;
    mx = (fx + tx) / 2 + (mx / mLength) * lift;
    my = (fy + ty) / 2 + (my / mLength) * lift;
    mz = (fz + tz) / 2 + (mz / mLength) * lift;

    const a = (1 - t) * (1 - t);
    const b = 2 * (1 - t) * t;
    const c = t * t;
    this.base[k] = a * fx + b * mx + c * tx;
    this.base[k + 1] = a * fy + b * my + c * ty;
    this.base[k + 2] = a * fz + b * mz + c * tz;
    this.sizes[i] = this.sizeFrom[i] + (this.sizeTo[i] - this.sizeFrom[i]) * t;
    this.angles[i] = this.spin[i] * t;
    this.heat[i] = Math.max(this.heat[i], Math.sin(Math.PI * this.progress[i]));
  }

  #applyNeedle(i, dt, needle) {
    const k = i * 3;
    let gx = 0;
    let gy = 0;
    let gz = 0;
    if (needle) {
      const dx = this.base[k] - needle.x;
      const dy = this.base[k + 1] - needle.y;
      const dz = this.base[k + 2] - needle.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 1e-4;
      const falloff = 1 - dist / this.needleRadius;
      if (falloff > 0) {
        const push = (falloff * this.needleRadius * this.needlePush) / dist;
        gx = dx * push;
        gy = dy * push;
        gz = dz * push;
        this.heat[i] = Math.max(this.heat[i], falloff);
      }
    }
    const k8 = 1 - Math.exp(-SPRING * dt);
    this.offset[k] += (gx - this.offset[k]) * k8;
    this.offset[k + 1] += (gy - this.offset[k + 1]) * k8;
    this.offset[k + 2] += (gz - this.offset[k + 2]) * k8;
  }

  #composeRender() {
    const n = this.#cutNormal;
    const o = this.#cutOrigin;
    const shift = this.gap * 0.5 * this.cut;
    for (let i = 0; i < this.count; i++) {
      const k = i * 3;
      let x = this.base[k] + this.offset[k];
      let y = this.base[k + 1] + this.offset[k + 1];
      let z = this.base[k + 2] + this.offset[k + 2];
      if (shift > 0) {
        const side = (x - o.x) * n.x + (y - o.y) * n.y + (z - o.z) * n.z >= 0 ? 1 : -1;
        x += n.x * shift * side;
        y += n.y * shift * side;
        z += n.z * shift * side;
      }
      this.render[k] = x;
      this.render[k + 1] = y;
      this.render[k + 2] = z;
    }
  }

  #settle() {
    this.#composeRender();
    for (let i = 0; i < this.count; i++) this.progress[i] = 1;
  }
}
