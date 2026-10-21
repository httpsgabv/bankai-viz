/**
 * Plays a list of timed steps one after another.
 * Each step: { name, duration, enter?(), update?(progress, dt), exit?() }
 */
export class Sequence {
  #steps;
  #index = -1;
  #elapsed = 0;

  constructor(steps) {
    this.#steps = steps;
  }

  get current() {
    return this.#steps[this.#index]?.name ?? null;
  }

  get done() {
    return this.#index >= this.#steps.length;
  }

  start() {
    this.#index = 0;
    this.#elapsed = 0;
    this.#steps[0]?.enter?.();
    return this;
  }

  update(dt) {
    while (!this.done && this.#index >= 0) {
      const step = this.#steps[this.#index];
      this.#elapsed += dt;
      const progress = step.duration > 0 ? Math.min(1, this.#elapsed / step.duration) : 1;
      step.update?.(progress, dt);
      if (progress < 1) return;
      dt = this.#elapsed - step.duration;
      this.#advance();
    }
  }

  /** Jumps straight to the end state, running every remaining step to completion. */
  finish() {
    if (this.#index < 0) this.start();
    while (!this.done) {
      this.#steps[this.#index].update?.(1, 0);
      this.#advance();
    }
    return this;
  }

  #advance() {
    this.#steps[this.#index].exit?.();
    this.#index += 1;
    this.#elapsed = 0;
    this.#steps[this.#index]?.enter?.();
  }
}
