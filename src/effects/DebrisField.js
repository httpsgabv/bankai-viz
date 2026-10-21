import * as THREE from 'three';
import { clamp01 } from '../utils/math.js';

/**
 * A pool of tumbling fragments (rubble, ice shards, ...) drawn as one instanced mesh.
 * Fragments fall, bounce on the floor, spin down and shrink away at the end of their life.
 */
export class DebrisField {
  #next = 0;
  #matrix = new THREE.Matrix4();
  #quaternion = new THREE.Quaternion();
  #scale = new THREE.Vector3();

  constructor({ capacity, geometry, material, floorY = 0, life = 3.4, gravity = 14 }) {
    Object.assign(this, { floorY, life, gravity });
    this.fragments = Array.from({ length: capacity }, () => ({
      active: false,
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      axis: new THREE.Vector3(),
      angle: 0,
      spin: 0,
      size: 0,
      age: 0,
    }));
    this.mesh = new THREE.InstancedMesh(geometry, material, capacity);
    this.mesh.frustumCulled = false;
  }

  get object() {
    return this.mesh;
  }

  /** Launches one fragment (reusing the oldest slot when the pool is full). */
  spawn(position, velocity, size) {
    const fragment = this.fragments[this.#next];
    this.#next = (this.#next + 1) % this.fragments.length;
    fragment.position.copy(position);
    fragment.velocity.copy(velocity);
    fragment.axis.randomDirection();
    fragment.angle = 0;
    fragment.spin = (Math.random() - 0.5) * 12;
    fragment.size = size;
    fragment.age = 0;
    fragment.active = true;
  }

  update(dt) {
    this.fragments.forEach((fragment, i) => this.#updateFragment(fragment, i, dt));
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  #updateFragment(fragment, index, dt) {
    if (!fragment.active) {
      this.#scale.setScalar(0);
      this.mesh.setMatrixAt(index, this.#matrix.compose(fragment.position, this.#quaternion.identity(), this.#scale));
      return;
    }
    fragment.age += dt;
    fragment.velocity.y -= this.gravity * dt;
    fragment.position.addScaledVector(fragment.velocity, dt);
    const ground = this.floorY + fragment.size * 0.4;
    if (fragment.position.y < ground) {
      fragment.position.y = ground;
      fragment.velocity.y *= -0.3;
      fragment.velocity.x *= 0.7;
      fragment.velocity.z *= 0.7;
      fragment.spin *= 0.7;
    }
    fragment.angle += fragment.spin * dt;
    const fade = 1 - clamp01((fragment.age - (this.life - 0.6)) / 0.6);
    if (fragment.age >= this.life) fragment.active = false;
    this.#quaternion.setFromAxisAngle(fragment.axis, fragment.angle);
    this.#scale.setScalar(fragment.size * fade);
    this.mesh.setMatrixAt(index, this.#matrix.compose(fragment.position, this.#quaternion, this.#scale));
  }
}
