/**
 * Gives swarm particles a birth and death: dead particles wait in a pool, `rate` of them
 * are emitted per second via the `emit(index, out)` callback, and each fades in and out
 * over its life. Also exposes normalised ages (0 → 1) for shaders.
 *
 * emit(i, out) must fill out.position[3] and out.velocity[3].
 */
export class ParticleLifecycle {
  rate = 0;
  emit = null;
  lifeMin = 2;
  lifeMax = 4;

  #accumulator = 0;
  #cursor = 0;
  #spawn = { position: new Float32Array(3), velocity: new Float32Array(3) };

  constructor(swarm) {
    this.swarm = swarm;
    swarm.fadeInRate = 0;
    this.age = new Float32Array(swarm.count);
    this.life = new Float32Array(swarm.count);
    this.ages = new Float32Array(swarm.count);
    this.alive = 0;
    for (let i = 0; i < swarm.count; i++) this.#kill(i);
  }

  update(dt) {
    this.#accumulator += this.rate * dt;
    const toEmit = Math.floor(this.#accumulator);
    this.#accumulator -= toEmit;
    this.burst(toEmit);

    const { swarm } = this;
    let alive = 0;
    for (let i = 0; i < swarm.count; i++) {
      if (!swarm.free[i]) continue;
      this.age[i] += dt;
      const t = this.age[i] / this.life[i];
      if (t >= 1) {
        this.#kill(i);
        continue;
      }
      alive++;
      this.ages[i] = t;
      swarm.visibility[i] = Math.min(1, t / 0.12) * Math.min(1, (1 - t) / 0.45);
    }
    this.alive = alive;
  }

  /** Emits up to `count` particles right now. */
  burst(count) {
    if (!this.emit || count <= 0) return;
    const { swarm } = this;
    const out = this.#spawn;
    for (let scanned = 0; count > 0 && scanned < swarm.count; scanned++) {
      const i = this.#cursor;
      this.#cursor = (this.#cursor + 1) % swarm.count;
      if (swarm.free[i]) continue;
      this.emit(i, out);
      const [x, y, z] = out.position;
      const [vx, vy, vz] = out.velocity;
      swarm.release(i, x, y, z, vx, vy, vz);
      swarm.visibility[i] = 0;
      this.age[i] = 0;
      this.ages[i] = 0;
      this.life[i] = this.lifeMin + Math.random() * (this.lifeMax - this.lifeMin);
      count--;
    }
  }

  killAll() {
    for (let i = 0; i < this.swarm.count; i++) this.#kill(i);
  }

  #kill(i) {
    this.swarm.pin(i, 0, -1000, 0);
    this.ages[i] = 0;
  }
}
