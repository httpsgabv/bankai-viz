import { ParticleSwarm } from '../sim/ParticleSwarm.js';
import { MoteMesh } from '../render/motes/MoteMesh.js';

/**
 * A volume of drifting ink motes that can be shoved and "heated" (stained) by attacks.
 * Heat cools back down over time.
 */
export class MoteField {
  cooling = 0.7;

  constructor({ count, min, max, atmosphere, forces }) {
    this.swarm = new ParticleSwarm(count);
    this.swarm.forces = forces;
    this.swarm.fadeInRate = 0;
    this.heat = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const p = min.map((low, axis) => low + Math.random() * (max[axis] - low));
      this.swarm.release(i, p[0], p[1], p[2], 0, 0, 0);
      this.swarm.visibility[i] = 1;
    }
    this.mesh = new MoteMesh(this.swarm, this.heat, atmosphere);
  }

  get object() {
    return this.mesh.object;
  }

  setAppearance(appearance) {
    this.mesh.setAppearance(appearance);
  }

  /**
   * Pushes and heats motes within `radius` of `center`: outwards, plus along `direction` if given.
   */
  disturb(center, radius, strength, direction = null) {
    const P = this.swarm.positions;
    const V = this.swarm.velocities;
    for (let i = 0; i < this.swarm.count; i++) {
      const k = i * 3;
      const dx = P[k] - center.x;
      const dy = P[k + 1] - center.y;
      const dz = P[k + 2] - center.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 1e-4;
      const falloff = 1 - dist / radius;
      if (falloff <= 0) continue;
      const push = (strength * falloff) / dist;
      V[k] += dx * push;
      V[k + 1] += dy * push;
      V[k + 2] += dz * push;
      if (direction) {
        V[k] += direction.x * strength * falloff;
        V[k + 1] += direction.y * strength * falloff;
        V[k + 2] += direction.z * strength * falloff;
      }
      this.heat[i] = Math.max(this.heat[i], Math.min(1, falloff * 2));
    }
  }

  update(dt, time, viewportHeight) {
    this.swarm.update(dt, { dt, time });
    const cool = dt * this.cooling;
    for (let i = 0; i < this.heat.length; i++) if (this.heat[i] > 0) this.heat[i] = Math.max(0, this.heat[i] - cool);
    this.mesh.sync(viewportHeight);
  }

  dispose() {
    this.object.removeFromParent();
    this.object.geometry.dispose();
    this.mesh.material.dispose();
  }
}
