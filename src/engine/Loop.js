const MAX_DELTA = 1 / 20;

/** requestAnimationFrame loop with a clamped delta so tab switches don't explode the simulation. */
export class Loop {
  #callback;
  #frame = 0;
  #last = 0;
  #time = 0;

  constructor(callback) {
    this.#callback = callback;
  }

  start() {
    this.#last = performance.now();
    const tick = (now) => {
      const dt = Math.min((now - this.#last) / 1000, MAX_DELTA);
      this.#last = now;
      this.#time += dt;
      this.#callback(dt, this.#time);
      this.#frame = requestAnimationFrame(tick);
    };
    this.#frame = requestAnimationFrame(tick);
  }

  stop() {
    cancelAnimationFrame(this.#frame);
  }
}
