import * as THREE from 'three';
import { damp } from '../utils/math.js';

/** Eases the camera between presets and adds a subtle pointer parallax. */
export class CameraRig {
  parallax = 0.6;

  #position = new THREE.Vector3(0, 3, 13);
  #target = new THREE.Vector3(0, 3, 0);
  #goalPosition = this.#position.clone();
  #goalTarget = this.#target.clone();
  #offset = new THREE.Vector2();

  constructor(camera) {
    this.camera = camera;
  }

  setPreset({ position, target }, immediate = false) {
    this.#goalPosition.fromArray(position);
    this.#goalTarget.fromArray(target);
    if (immediate) {
      this.#position.copy(this.#goalPosition);
      this.#target.copy(this.#goalTarget);
    }
  }

  update(dt, pointerNdc) {
    const k = 1 - Math.exp(-2.2 * dt);
    this.#position.lerp(this.#goalPosition, k);
    this.#target.lerp(this.#goalTarget, k);

    this.#offset.x = damp(this.#offset.x, pointerNdc.x * this.parallax, 3, dt);
    this.#offset.y = damp(this.#offset.y, pointerNdc.y * this.parallax * 0.5, 3, dt);

    this.camera.position.copy(this.#position);
    this.camera.position.x += this.#offset.x;
    this.camera.position.y += this.#offset.y;
    this.camera.lookAt(this.#target);
    this.camera.updateMatrixWorld();
  }
}
