import * as THREE from 'three';
import { damp } from '../utils/math.js';

/** Eases the camera between presets, adds a subtle pointer parallax and impact shake. */
export class CameraRig {
  parallax = 0.6;

  #position = new THREE.Vector3(0, 3, 13);
  #target = new THREE.Vector3(0, 3, 0);
  #goalPosition = this.#position.clone();
  #goalTarget = this.#target.clone();
  #offset = new THREE.Vector2();
  #shake = 0;
  #shakeOffset = new THREE.Vector3();

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

  /** Adds a burst of camera shake (roughly world units of jitter, decays quickly). */
  shake(amount) {
    this.#shake = Math.min(1.5, this.#shake + amount);
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

    this.#shake = damp(this.#shake, 0, 5, dt);
    this.#shakeOffset.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(this.#shake);
    this.camera.position.add(this.#shakeOffset);
    this.camera.lookAt(this.#target);
    this.camera.updateMatrixWorld();
  }
}
