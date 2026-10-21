import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);

/**
 * Steers a creature's head towards a target with a speed limit and smoothed velocity,
 * adding a side-to-side slither perpendicular to its travel. Works with SegmentChain heads.
 */
export class SlitherSteering {
  velocity = new THREE.Vector3();
  /** Amplitude of the side-to-side wave. */
  slither = 0.6;
  /** How quickly velocity follows the desired direction (1/s). */
  response = 3;
  /** Slither frequency (rad/s). */
  frequency = 3.2;

  #desired = new THREE.Vector3();
  #side = new THREE.Vector3();

  /** Moves `head` (a Vector3) one step towards `target`. */
  steer(dt, time, head, target, maxSpeed) {
    this.#desired.subVectors(target, head).multiplyScalar(2);
    if (this.#desired.length() > maxSpeed) this.#desired.setLength(maxSpeed);
    this.velocity.lerp(this.#desired, 1 - Math.exp(-this.response * dt));

    this.#side.crossVectors(this.velocity, UP);
    if (this.#side.lengthSq() > 1e-6) this.#side.normalize();
    const wave = Math.cos(time * this.frequency) * this.slither * Math.min(1, this.velocity.length() / 3);
    head.addScaledVector(this.velocity, dt).addScaledVector(this.#side, wave * dt * 3);
  }

  reset() {
    this.velocity.set(0, 0, 0);
  }
}
