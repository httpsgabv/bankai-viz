import { MoteField } from './MoteField.js';

/**
 * Gently falling snow: a MoteField whose flakes wrap back to the top of the volume
 * when they reach the ground. "Heat" makes flakes glow (e.g. near the ice dragon).
 */
export class Snowfall extends MoteField {
  constructor(options) {
    super(options);
    this.min = options.min;
    this.max = options.max;
    this.floorY = options.floorY ?? 0;
  }

  update(dt, time, viewportHeight) {
    super.update(dt, time, viewportHeight);
    const P = this.swarm.positions;
    const V = this.swarm.velocities;
    const [minX, , minZ] = this.min;
    const [maxX, maxY, maxZ] = this.max;
    for (let i = 0; i < this.swarm.count; i++) {
      const k = i * 3;
      if (P[k + 1] > this.floorY + 0.05) continue;
      P[k] = minX + Math.random() * (maxX - minX);
      P[k + 1] = maxY;
      P[k + 2] = minZ + Math.random() * (maxZ - minZ);
      V[k] = V[k + 1] = V[k + 2] = 0;
      this.heat[i] = 0;
    }
  }
}
