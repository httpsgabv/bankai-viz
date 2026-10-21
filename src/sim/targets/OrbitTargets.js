import { randomUnitVector } from '../../utils/math.js';

/**
 * Gives a share of the petals (`cohesion`) an orbit around a moving center.
 * `gather` (0 → 1) pulls every petal in and tightens the orbits into a dense sphere.
 */
export class OrbitTargets {
  radius = 2.4;
  cohesion = 0.5;
  gather = 0;
  orbitSpeed = 1.2;

  constructor(count, center) {
    this.center = center;
    this.affinity = Float32Array.from({ length: count }, Math.random);
    this.radiusFactor = Float32Array.from({ length: count }, () => 0.3 + 0.7 * Math.cbrt(Math.random()));
    this.speedFactor = Float32Array.from({ length: count }, () => 0.6 + Math.random() * 0.8);
    this.phase = Float32Array.from({ length: count }, () => Math.random() * Math.PI * 2);
    this.basis = new Float32Array(count * 6);
    for (let i = 0; i < count; i++) this.#buildBasis(i);
  }

  target(i, out, context) {
    const weight = this.affinity[i] < this.cohesion ? 1 : this.gather;
    if (weight <= 0) return 0;

    const rf = this.radiusFactor[i];
    const r = this.radius * rf * (1 - 0.62 * this.gather);
    const angle = this.phase[i] + (context.time * this.orbitSpeed * this.speedFactor[i]) / Math.max(0.35, rf);
    const c = Math.cos(angle) * r;
    const s = Math.sin(angle) * r;
    const B = this.basis;
    const k = i * 6;

    out[0] = this.center.x + B[k] * c + B[k + 3] * s;
    out[1] = this.center.y + B[k + 1] * c + B[k + 4] * s;
    out[2] = this.center.z + B[k + 2] * c + B[k + 5] * s;
    return weight;
  }

  /** Two orthonormal vectors spanning a random orbital plane. */
  #buildBasis(i) {
    const n = randomUnitVector(new Float32Array(3));
    const helper = Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    let ax = n[1] * helper[2] - n[2] * helper[1];
    let ay = n[2] * helper[0] - n[0] * helper[2];
    let az = n[0] * helper[1] - n[1] * helper[0];
    const len = Math.hypot(ax, ay, az);
    ax /= len;
    ay /= len;
    az /= len;
    const bx = n[1] * az - n[2] * ay;
    const by = n[2] * ax - n[0] * az;
    const bz = n[0] * ay - n[1] * ax;
    this.basis.set([ax, ay, az, bx, by, bz], i * 6);
  }
}
