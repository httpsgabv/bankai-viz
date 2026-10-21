/**
 * How frozen each patch of ground is (0 → 1), on a grid over the floor (x, z).
 * Stored as bytes so it can be uploaded straight into a texture.
 */
export class FrostGrid {
  melt = 0.03;

  constructor({ min, max, resolution = 128 }) {
    this.min = min;
    this.max = max;
    this.resolution = resolution;
    this.values = new Float32Array(resolution * resolution);
    this.bytes = new Uint8Array(resolution * resolution);
  }

  /** Average frost over the whole field, 0 → 1. */
  get coverage() {
    let sum = 0;
    for (let i = 0; i < this.values.length; i++) sum += this.values[i];
    return sum / this.values.length;
  }

  /** Adds frost in a soft disc around (x, z). */
  deposit(x, z, radius, amount) {
    const { resolution: n, min, max } = this;
    const cellX = (max[0] - min[0]) / n;
    const cellZ = (max[1] - min[1]) / n;
    const cx = (x - min[0]) / cellX;
    const cz = (z - min[1]) / cellZ;
    const rx = radius / cellX;
    const rz = radius / cellZ;
    for (let j = Math.max(0, Math.floor(cz - rz)); j <= Math.min(n - 1, Math.ceil(cz + rz)); j++) {
      for (let i = Math.max(0, Math.floor(cx - rx)); i <= Math.min(n - 1, Math.ceil(cx + rx)); i++) {
        const d = ((i - cx) / rx) ** 2 + ((j - cz) / rz) ** 2;
        if (d >= 1) continue;
        const k = j * n + i;
        this.values[k] = Math.min(1, this.values[k] + amount * (1 - d));
      }
    }
  }

  clear() {
    this.values.fill(0);
  }

  update(dt) {
    const melt = this.melt * dt;
    for (let k = 0; k < this.values.length; k++) {
      const v = Math.max(0, this.values[k] - melt);
      this.values[k] = v;
      this.bytes[k] = v * 255;
    }
  }
}
