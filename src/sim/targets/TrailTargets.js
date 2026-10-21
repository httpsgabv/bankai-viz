import { randomUnitVector } from '../../utils/math.js';

/**
 * Spreads petals along the pointer's recent path so they flow like a ribbon:
 * petals near the head hug the cursor, petals at the tail fan out wider.
 */
export class TrailTargets {
  length = 70;
  spread = 0.5;
  swirlSpeed = 1.2;

  constructor(trail, count) {
    this.trail = trail;
    this.u = Float32Array.from({ length: count }, () => Math.random() ** 1.3);
    this.phase = Float32Array.from({ length: count }, () => Math.random() * Math.PI * 2);
    this.offsets = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) randomUnitVector(this.offsets, i * 3);
  }

  target(i, out, context) {
    const u = this.u[i];
    this.trail.sample(u, this.length, out);

    const radius = this.spread * (0.2 + u * 1.4);
    const angle = this.phase[i] + context.time * this.swirlSpeed * (0.5 + u);
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const k = i * 3;
    const ox = this.offsets[k];
    const oy = this.offsets[k + 1];
    const oz = this.offsets[k + 2];

    out[0] += (ox * c - oz * s) * radius;
    out[1] += oy * radius;
    out[2] += (ox * s + oz * c) * radius;
    return 1;
  }
}
