/**
 * Generic CPU particle simulation stored in flat typed arrays (shared directly with the GPU buffers).
 * Particles are either pinned (hidden, sitting on an anchor) or free (driven by forces).
 * Forces implement `accumulate(swarm, index, outForce, context)`.
 */
export class ParticleSwarm {
  forces = [];
  drag = 1;
  maxSpeed = 20;
  floorY = -Infinity;
  fadeInRate = 5;

  #force = new Float32Array(3);

  constructor(count) {
    this.count = count;
    this.positions = new Float32Array(count * 3);
    this.velocities = new Float32Array(count * 3);
    this.visibility = new Float32Array(count);
    this.free = new Uint8Array(count);
    this.seeds = Float32Array.from({ length: count }, Math.random);
  }

  pin(i, x, y, z) {
    const k = i * 3;
    this.free[i] = 0;
    this.visibility[i] = 0;
    this.positions.set([x, y, z], k);
    this.velocities.fill(0, k, k + 3);
  }

  release(i, x, y, z, vx, vy, vz) {
    const k = i * 3;
    this.free[i] = 1;
    this.positions.set([x, y, z], k);
    this.velocities.set([vx, vy, vz], k);
  }

  /**
   * Pushes free particles near `center` with a linear falloff: away from the point,
   * or along `direction` (plus a little outward spread) when one is given.
   */
  impulse(center, strength, radius, direction = null) {
    const P = this.positions;
    const V = this.velocities;
    for (let i = 0; i < this.count; i++) {
      if (!this.free[i]) continue;
      const k = i * 3;
      const dx = P[k] - center.x;
      const dy = P[k + 1] - center.y;
      const dz = P[k + 2] - center.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 1e-4;
      const falloff = 1 - dist / radius;
      if (falloff <= 0) continue;
      const amount = strength * falloff * (0.6 + this.seeds[i] * 0.8);
      const outward = direction ? 0.25 : 1;
      const push = (amount * outward) / dist;
      V[k] += dx * push;
      V[k + 1] += dy * push;
      V[k + 2] += dz * push;
      if (direction) {
        V[k] += direction.x * amount;
        V[k + 1] += direction.y * amount;
        V[k + 2] += direction.z * amount;
      }
    }
  }

  update(dt, context) {
    const P = this.positions;
    const V = this.velocities;
    const f = this.#force;
    const drag = Math.exp(-this.drag * dt);
    const maxSpeedSq = this.maxSpeed * this.maxSpeed;

    for (let i = 0; i < this.count; i++) {
      if (!this.free[i]) continue;
      const k = i * 3;

      f[0] = f[1] = f[2] = 0;
      for (const force of this.forces) force.accumulate(this, i, f, context);

      let vx = (V[k] + f[0] * dt) * drag;
      let vy = (V[k + 1] + f[1] * dt) * drag;
      let vz = (V[k + 2] + f[2] * dt) * drag;

      const speedSq = vx * vx + vy * vy + vz * vz;
      if (speedSq > maxSpeedSq) {
        const scale = this.maxSpeed / Math.sqrt(speedSq);
        vx *= scale;
        vy *= scale;
        vz *= scale;
      }

      P[k] += vx * dt;
      P[k + 1] += vy * dt;
      P[k + 2] += vz * dt;

      if (P[k + 1] < this.floorY) {
        P[k + 1] = this.floorY;
        if (vy < 0) vy *= -0.3;
      }

      V[k] = vx;
      V[k + 1] = vy;
      V[k + 2] = vz;

      if (this.visibility[i] < 1) this.visibility[i] = Math.min(1, this.visibility[i] + dt * this.fadeInRate);
    }
  }
}
