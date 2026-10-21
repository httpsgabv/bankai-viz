import * as THREE from 'three';
import { DebrisField } from './DebrisField.js';
import { createCrystalGeometry } from '../render/geometry/createCrystalGeometry.js';
import { clamp01, easeOutCubic } from '../utils/math.js';

const RISE_SECONDS = 0.45;
const CLOSE_SECONDS = 0.55;
const LEAN = 0.34;
const SHARDS_PER_PILLAR = 10;

/**
 * "Sennen Hyōrō" — a ring of huge ice pillars bursts up around a point and leans in
 * to close like a prison. `shatter` breaks every pillar into falling shards.
 */
export class IcePrison {
  radius = 2.6;
  height = 4.5;

  #state = 'idle';
  #age = 0;
  #center = new THREE.Vector3();
  #matrix = new THREE.Matrix4();
  #quaternion = new THREE.Quaternion();
  #scale = new THREE.Vector3();
  #position = new THREE.Vector3();
  #axis = new THREE.Vector3();
  #velocity = new THREE.Vector3();

  constructor({ material, pillars = 10, floorY = 0 }) {
    this.count = pillars;
    this.floorY = floorY;
    this.object = new THREE.Group();
    this.mesh = new THREE.InstancedMesh(createCrystalGeometry(), material, pillars);
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
    this.debris = new DebrisField({
      capacity: pillars * SHARDS_PER_PILLAR * 2,
      geometry: new THREE.OctahedronGeometry(0.5, 0).scale(0.6, 1.4, 0.6),
      material,
      floorY,
      life: 2.6,
    });
    this.object.add(this.mesh, this.debris.object);
  }

  get isRaised() {
    return this.#state !== 'idle';
  }

  get center() {
    return this.#center;
  }

  raise(center) {
    this.#center.set(center.x, this.floorY, center.z);
    this.#state = 'rising';
    this.#age = 0;
    this.mesh.visible = true;
  }

  shatter() {
    if (!this.isRaised) return;
    for (let i = 0; i < this.count; i++) {
      this.mesh.getMatrixAt(i, this.#matrix);
      for (let s = 0; s < SHARDS_PER_PILLAR; s++) {
        this.#position.set(0, s / SHARDS_PER_PILLAR, 0).applyMatrix4(this.#matrix);
        this.#velocity.subVectors(this.#position, this.#center).setY(0).normalize().multiplyScalar(2 + Math.random() * 4);
        this.#velocity.y = 1 + Math.random() * 4;
        this.debris.spawn(this.#position, this.#velocity, 0.3 + Math.random() * 0.4);
      }
    }
    this.#state = 'idle';
    this.mesh.visible = false;
  }

  update(dt) {
    this.debris.update(dt);
    if (!this.isRaised) return;
    this.#age += dt;
    const rise = easeOutCubic(clamp01(this.#age / RISE_SECONDS));
    const close = easeOutCubic(clamp01((this.#age - RISE_SECONDS) / CLOSE_SECONDS));

    for (let i = 0; i < this.count; i++) {
      const angle = (i / this.count) * Math.PI * 2;
      this.#position.set(this.#center.x + Math.cos(angle) * this.radius, this.floorY, this.#center.z + Math.sin(angle) * this.radius);
      // Lean towards the centre: rotate around the horizontal axis tangent to the ring.
      this.#axis.set(-Math.sin(angle), 0, Math.cos(angle));
      this.#quaternion.setFromAxisAngle(this.#axis, LEAN * close);
      const thickness = 5 + (i % 3);
      this.#scale.set(thickness, this.height * Math.max(0.001, rise) * (0.85 + (i % 2) * 0.25), thickness);
      this.mesh.setMatrixAt(i, this.#matrix.compose(this.#position, this.#quaternion, this.#scale));
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
