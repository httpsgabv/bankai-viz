/**
 * Steers each petal towards a target supplied by a target provider (arrival behaviour).
 * Providers implement `target(index, out, context) -> weight` (weight <= 0 means "no target").
 */
export class SeekForce {
  targets = null;
  strength = 1;
  maxSpeed = 10;
  slowRadius = 1;

  #target = new Float32Array(3);

  accumulate(swarm, i, out, context) {
    if (!this.targets || this.strength <= 0) return;
    const t = this.#target;
    const weight = this.targets.target(i, t, context);
    if (weight <= 0) return;

    const P = swarm.positions;
    const V = swarm.velocities;
    const k = i * 3;
    const dx = t[0] - P[k];
    const dy = t[1] - P[k + 1];
    const dz = t[2] - P[k + 2];
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 1e-6;
    const speed = this.maxSpeed * Math.min(1, dist / this.slowRadius);
    const s = speed / dist;
    const g = this.strength * weight;

    out[0] += (dx * s - V[k]) * g;
    out[1] += (dy * s - V[k + 1]) * g;
    out[2] += (dz * s - V[k + 2]) * g;
  }
}
