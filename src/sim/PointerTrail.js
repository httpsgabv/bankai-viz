/** Ring buffer of recent pointer positions, sampled at a fixed rate. Index 0 = newest. */
export class PointerTrail {
  #buffer;
  #head = 0;
  #filled = false;
  #accumulator = 0;
  #interval;

  constructor(capacity = 256, sampleRate = 60) {
    this.capacity = capacity;
    this.#buffer = new Float32Array(capacity * 3);
    this.#interval = 1 / sampleRate;
  }

  update(dt, point) {
    if (!this.#filled) {
      for (let i = 0; i < this.capacity; i++) this.#write(i, point);
      this.#filled = true;
    }
    this.#accumulator += dt;
    while (this.#accumulator >= this.#interval) {
      this.#accumulator -= this.#interval;
      this.#head = (this.#head + 1) % this.capacity;
      this.#write(this.#head, point);
    }
  }

  /** Samples the trail at `u` in [0, 1] across the newest `length` samples. */
  sample(u, length, out) {
    const span = Math.max(1, Math.min(length, this.capacity) - 1);
    const f = u * span;
    const i0 = Math.floor(f);
    const t = f - i0;
    const a = ((this.#head - i0) % this.capacity + this.capacity) % this.capacity;
    const b = (a - 1 + this.capacity) % this.capacity;
    const B = this.#buffer;
    out[0] = B[a * 3] + (B[b * 3] - B[a * 3]) * t;
    out[1] = B[a * 3 + 1] + (B[b * 3 + 1] - B[a * 3 + 1]) * t;
    out[2] = B[a * 3 + 2] + (B[b * 3 + 2] - B[a * 3 + 2]) * t;
    return out;
  }

  #write(index, point) {
    this.#buffer[index * 3] = point.x;
    this.#buffer[index * 3 + 1] = point.y;
    this.#buffer[index * 3 + 2] = point.z;
  }
}
