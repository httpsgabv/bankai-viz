import * as THREE from 'three';
import { Emitter } from '../utils/Emitter.js';
import { clamp, damp } from '../utils/math.js';

const DEPTH_RANGE = [-6, 8];

/**
 * Tracks the mouse / touch and projects it into the 3D scene onto a plane that faces
 * the camera and passes through a focus point. Scrolling pushes that plane nearer/farther.
 * Emits 'down' and 'up' for presses that start on the canvas.
 */
export class Pointer extends Emitter {
  ndc = new THREE.Vector2();
  world = new THREE.Vector3();
  isDown = false;
  /** Whether the mouse is currently over the page. */
  isInside = false;
  /** Smoothed 0 (away) → 1 (on the page), so behaviours can blend instead of snapping. */
  presence = 0;
  depth = 0;
  /** World-space shift of the target plane caused by scrolling (view direction × depth). */
  depthOffset = new THREE.Vector3();

  #depthGoal = 0;
  #focus = new THREE.Vector3();
  #raycaster = new THREE.Raycaster();
  #plane = new THREE.Plane();
  #direction = new THREE.Vector3();
  #planePoint = new THREE.Vector3();
  #hit = new THREE.Vector3();

  constructor(canvas) {
    super();
    this.canvas = canvas;
    this.#listen();
  }

  setFocus(point) {
    this.#focus.fromArray(point);
  }

  update(camera, dt) {
    this.depth = damp(this.depth, this.#depthGoal, 6, dt);
    this.presence = damp(this.presence, this.isInside ? 1 : 0, 3, dt);

    camera.getWorldDirection(this.#direction);
    this.depthOffset.copy(this.#direction).multiplyScalar(this.depth);
    this.#planePoint.copy(this.#focus).add(this.depthOffset);
    this.#plane.setFromNormalAndCoplanarPoint(this.#direction, this.#planePoint);

    this.#raycaster.setFromCamera(this.ndc, camera);
    if (this.#raycaster.ray.intersectPlane(this.#plane, this.#hit)) this.world.copy(this.#hit);
  }

  #listen() {
    window.addEventListener('pointermove', (event) => {
      this.isInside = true;
      this.#move(event);
    });
    document.documentElement.addEventListener('pointerleave', () => (this.isInside = false));
    document.documentElement.addEventListener('pointerenter', () => (this.isInside = true));
    window.addEventListener('blur', () => (this.isInside = false));

    this.canvas.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      this.#move(event);
      this.isDown = true;
      this.emit('down');
    });

    const release = (event) => {
      // A lifted finger is "gone" from a touch screen.
      if (event.pointerType === 'touch') this.isInside = false;
      if (!this.isDown) return;
      this.isDown = false;
      this.emit('up');
    };
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);

    this.canvas.addEventListener(
      'wheel',
      (event) => {
        this.#depthGoal = clamp(this.#depthGoal + event.deltaY * 0.008, ...DEPTH_RANGE);
      },
      { passive: true },
    );
  }

  #move(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.ndc.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
  }
}
