/**
 * Describes a blade's shape along its length (local y from 0 at the base to `length` at the tip).
 * The cutting edge faces +x; `curvature` bows the blade back towards the spine like a katana.
 */
export class BladeProfile {
  constructor({ length = 3.6, width = 0.16, thickness = 0.035, curvature = 0.03, tipStart = 0.9, taper = 0.25 } = {}) {
    Object.assign(this, { length, width, thickness, curvature, tipStart, taper });
  }

  /** Cross-section at t in [0, 1]: x of spine and edge, and the blade thickness. */
  sectionAt(t) {
    const bodyWidth = (u) => this.width * (1 - this.taper * u);
    let spine;
    let edge;
    let thickness;

    if (t <= this.tipStart) {
      const w = bodyWidth(t);
      spine = -w / 2;
      edge = w / 2;
      thickness = this.thickness * (1 - 0.35 * t);
    } else {
      // Kissaki: the edge sweeps up in an arc to meet the spine at the point.
      const s = (t - this.tipStart) / (1 - this.tipStart);
      const w = bodyWidth(this.tipStart);
      const round = Math.sqrt(Math.max(0, 1 - s * s));
      spine = -w / 2 + w * 0.25 * s * s;
      edge = -w / 4 + w * 0.75 * round;
      thickness = this.thickness * (1 - 0.35 * this.tipStart) * round;
    }

    const bend = -this.curvature * this.length * t * t;
    return { spine: spine + bend, edge: edge + bend, thickness };
  }
}
