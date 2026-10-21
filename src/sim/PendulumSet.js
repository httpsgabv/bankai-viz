import * as THREE from 'three';

const GRAVITY = -9;

/**
 * Weights hanging on strings from fixed anchors (Verlet points with a rope constraint).
 * Used for lanterns that swing when struck.
 */
export class PendulumSet {
  damping = 0.996;

  #step = new THREE.Vector3();

  constructor(anchors, lengths) {
    this.anchors = anchors.map((anchor) => anchor.clone());
    this.lengths = lengths;
    this.positions = this.anchors.map((anchor, i) => anchor.clone().add(new THREE.Vector3(0, -lengths[i], 0)));
    this.previous = this.positions.map((position) => position.clone());
  }

  get count() {
    return this.positions.length;
  }

  /** Adds `velocity` to weight `i` (applied over the next step of length `dt`). */
  push(i, velocity, dt) {
    this.previous[i].addScaledVector(velocity, -dt);
  }

  update(dt) {
    for (let i = 0; i < this.count; i++) {
      const position = this.positions[i];
      const previous = this.previous[i];
      this.#step.subVectors(position, previous).multiplyScalar(this.damping);
      previous.copy(position);
      position.add(this.#step);
      position.y += GRAVITY * dt * dt;

      // Rope: never further from the anchor than the string length.
      this.#step.subVectors(position, this.anchors[i]);
      const distance = this.#step.length();
      if (distance > this.lengths[i]) position.copy(this.anchors[i]).addScaledVector(this.#step, this.lengths[i] / distance);
    }
  }
}
