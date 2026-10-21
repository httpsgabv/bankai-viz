import * as THREE from 'three';

/**
 * Follow-the-leader chain for snake-like bodies: the head moves freely and every
 * segment is dragged behind the previous one at a fixed spacing.
 */
export class SegmentChain {
  sag = 1.5;
  minY = -Infinity;

  #delta = new THREE.Vector3();

  constructor(count, spacing, start = new THREE.Vector3()) {
    this.spacing = spacing;
    this.points = Array.from({ length: count }, (_, i) => start.clone().add(new THREE.Vector3(0, -i * spacing, 0)));
  }

  get head() {
    return this.points[0];
  }

  /** Direction a segment faces (towards the segment ahead of it). */
  tangentAt(i, out) {
    const ahead = this.points[Math.max(0, i - 1)];
    const behind = this.points[Math.min(this.points.length - 1, i === 0 ? 1 : i)];
    out.subVectors(ahead, behind);
    if (out.lengthSq() < 1e-8) out.set(0, 0, 1);
    return out.normalize();
  }

  update(dt) {
    const { points, spacing } = this;
    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      point.y -= this.sag * dt;
      this.#delta.subVectors(point, points[i - 1]);
      const length = this.#delta.length() || 1e-6;
      point.copy(points[i - 1]).addScaledVector(this.#delta, spacing / length);
      if (point.y < this.minY) point.y = this.minY;
    }
  }
}
