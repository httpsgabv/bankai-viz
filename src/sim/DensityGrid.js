/**
 * Coarse 3D grid that counts how much "stuff" (e.g. visible gas) sits in each cell.
 * Lets thousands of particles affect hundreds of nodes without pairwise distance checks.
 */
export class DensityGrid {
  constructor({ min, max, cellSize = 1 }) {
    this.min = min;
    this.cellSize = cellSize;
    this.dims = max.map((value, axis) => Math.max(1, Math.ceil((value - min[axis]) / cellSize)));
    this.cells = new Float32Array(this.dims[0] * this.dims[1] * this.dims[2]);
  }

  /** Rebuilds the grid from particle positions weighted by `weights` (e.g. visibility). */
  splat(positions, weights) {
    this.cells.fill(0);
    for (let i = 0; i < weights.length; i++) {
      const w = weights[i];
      if (w <= 0.01) continue;
      const cell = this.#cellIndex(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      if (cell >= 0) this.cells[cell] += w;
    }
  }

  sample(x, y, z) {
    const cell = this.#cellIndex(x, y, z);
    return cell >= 0 ? this.cells[cell] : 0;
  }

  #cellIndex(x, y, z) {
    const [nx, ny, nz] = this.dims;
    const ix = Math.floor((x - this.min[0]) / this.cellSize);
    const iy = Math.floor((y - this.min[1]) / this.cellSize);
    const iz = Math.floor((z - this.min[2]) / this.cellSize);
    if (ix < 0 || iy < 0 || iz < 0 || ix >= nx || iy >= ny || iz >= nz) return -1;
    return (iz * ny + iy) * nx + ix;
  }
}
