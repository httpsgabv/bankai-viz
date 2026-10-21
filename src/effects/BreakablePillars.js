import * as THREE from 'three';
import { DebrisField } from './DebrisField.js';
import { clamp01, easeOutCubic } from '../utils/math.js';

const FRAGMENTS_PER_PILLAR = 16;
const REBUILD_AFTER = 5;
const RISE_SECONDS = 1.2;

/**
 * Stone pillars standing on the ground. `shatter` turns one into tumbling rubble that
 * bounces and fades; a while later the pillar rises back out of the ground.
 */
export class BreakablePillars {
  broken = 0;

  #outward = new THREE.Vector3();
  #position = new THREE.Vector3();
  #velocity = new THREE.Vector3();

  constructor({ count = 9, min, max, floorY = 0, color = '#6d6f76' }) {
    this.floorY = floorY;
    this.object = new THREE.Group();
    this.material = new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: true });
    this.pillars = Array.from({ length: count }, (_, i) => this.#createPillar(i, count, min, max));

    this.rubble = new DebrisField({
      capacity: count * FRAGMENTS_PER_PILLAR,
      geometry: new THREE.DodecahedronGeometry(0.5, 0),
      material: this.material,
      floorY,
    });
    this.object.add(this.rubble.object);
  }

  *standing() {
    for (const pillar of this.pillars) if (pillar.state === 'standing') yield pillar;
  }

  setColor(color) {
    this.material.color.set(color);
  }

  /** Is world point `p` inside pillar's volume (with some extra reach)? */
  contains(pillar, p, reach = 0) {
    const dx = p.x - pillar.position.x;
    const dz = p.z - pillar.position.z;
    const r = pillar.radius + reach;
    return dx * dx + dz * dz <= r * r && p.y >= this.floorY - reach && p.y <= this.floorY + pillar.height + reach;
  }

  /** Breaks a pillar into rubble, flung outwards and along `direction` × `strength`. */
  shatter(pillar, direction, strength) {
    if (pillar.state !== 'standing') return;
    pillar.state = 'broken';
    pillar.age = 0;
    pillar.mesh.visible = false;
    this.broken += 1;

    for (let i = 0; i < FRAGMENTS_PER_PILLAR; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * pillar.radius;
      this.#position.set(
        pillar.position.x + Math.cos(angle) * radius,
        this.floorY + Math.random() * pillar.height,
        pillar.position.z + Math.sin(angle) * radius,
      );
      this.#outward.set(Math.cos(angle), 0, Math.sin(angle));
      this.#velocity
        .copy(this.#outward)
        .multiplyScalar(1.5 + Math.random() * 3)
        .addScaledVector(direction, strength * (0.5 + Math.random()));
      this.#velocity.y += 2 + Math.random() * 5;
      this.rubble.spawn(this.#position, this.#velocity, pillar.radius * (0.45 + Math.random() * 0.6));
    }
  }

  update(dt) {
    for (const pillar of this.pillars) this.#updatePillar(pillar, dt);
    this.rubble.update(dt);
  }

  #createPillar(index, count, min, max) {
    const radius = 0.38 + Math.random() * 0.32;
    const height = 2 + Math.random() * 2.8;
    const geometry = new THREE.CylinderGeometry(radius * 0.92, radius * 1.08, height, 7);
    geometry.translate(0, height / 2, 0);
    const mesh = new THREE.Mesh(geometry, this.material);
    // Spread evenly along x with jitter, random depth.
    const x = min[0] + ((index + 0.5) / count) * (max[0] - min[0]) + (Math.random() - 0.5) * 0.8;
    const z = min[1] + Math.random() * (max[1] - min[1]);
    const position = new THREE.Vector3(x, this.floorY, z);
    mesh.position.copy(position);
    mesh.rotation.y = Math.random() * Math.PI;
    this.object.add(mesh);
    return { mesh, position, radius, height, state: 'standing', age: 0 };
  }

  #updatePillar(pillar, dt) {
    pillar.age += dt;
    if (pillar.state === 'broken' && pillar.age >= REBUILD_AFTER) {
      pillar.state = 'rising';
      pillar.age = 0;
      pillar.mesh.visible = true;
    }
    if (pillar.state === 'rising') {
      const t = clamp01(pillar.age / RISE_SECONDS);
      pillar.mesh.scale.set(1, Math.max(0.001, easeOutCubic(t)), 1);
      if (t >= 1) pillar.state = 'standing';
    }
  }
}
