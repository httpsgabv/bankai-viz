import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);

/**
 * Smoothly turns a weapon to point from its pivot towards the cursor.
 * When the cursor is away (or `engagement` is 0) it settles pointing straight up.
 */
export class AimController {
  direction = UP.clone();
  quaternion = new THREE.Quaternion();
  rate = 6;
  minDistance = 0.8;
  minY = -0.3;

  #desired = new THREE.Vector3();

  /** @param engagement 0 → ignore the cursor, 1 → track it fully */
  update(dt, pivot, target, engagement = 1) {
    this.#desired.subVectors(target, pivot);
    if (this.#desired.length() < this.minDistance) this.#desired.copy(this.direction);
    this.#desired.normalize().lerp(UP, 1 - engagement);
    this.#desired.y = Math.max(this.#desired.y, this.minY);
    this.direction.lerp(this.#desired.normalize(), 1 - Math.exp(-this.rate * dt)).normalize();
    this.quaternion.setFromUnitVectors(UP, this.direction);
    return this;
  }
}
