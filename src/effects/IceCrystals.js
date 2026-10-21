import * as THREE from 'three';
import { createCrystalGeometry } from '../render/geometry/createCrystalGeometry.js';
import { clamp01 } from '../utils/math.js';

const GROW_SECONDS = 0.35;
const LIFE_SECONDS = 7;
const MELT_SECONDS = 1.2;
const UP = new THREE.Vector3(0, 1, 0);

/** easeOutBack: overshoots a little, like ice snapping into place. */
const snap = (t) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2;

/** Clusters of ice crystals that burst out of the ground, linger, then melt back down. */
export class IceCrystals {
  #matrix = new THREE.Matrix4();
  #scale = new THREE.Vector3();
  #next = 0;

  constructor({ material, maxClusters = 10, perCluster = 11 }) {
    this.perCluster = perCluster;
    this.crystals = Array.from({ length: maxClusters * perCluster }, () => ({
      active: false,
      position: new THREE.Vector3(),
      quaternion: new THREE.Quaternion(),
      height: 1,
      thickness: 1,
      delay: 0,
      age: 0,
    }));
    this.mesh = new THREE.InstancedMesh(createCrystalGeometry(), material, this.crystals.length);
    this.mesh.frustumCulled = false;
  }

  get object() {
    return this.mesh;
  }

  /** Erupts a cluster at `point` (on the ground), splaying outwards. */
  spawn(point, scale = 1) {
    const tilt = new THREE.Vector3();
    for (let i = 0; i < this.perCluster; i++) {
      const crystal = this.crystals[this.#next];
      this.#next = (this.#next + 1) % this.crystals.length;
      const azimuth = Math.random() * Math.PI * 2;
      const lean = i === 0 ? 0.05 : 0.25 + Math.random() * 0.75;
      tilt.set(Math.sin(lean) * Math.cos(azimuth), Math.cos(lean), Math.sin(lean) * Math.sin(azimuth));
      crystal.quaternion.setFromUnitVectors(UP, tilt);
      crystal.position.set(point.x + Math.cos(azimuth) * 0.2 * scale, point.y, point.z + Math.sin(azimuth) * 0.2 * scale);
      crystal.height = scale * (i === 0 ? 2.6 : 0.8 + Math.random() * 1.6);
      crystal.thickness = scale * (0.7 + Math.random() * 0.8);
      crystal.delay = i * 0.02;
      crystal.age = 0;
      crystal.active = true;
    }
  }

  update(dt) {
    this.crystals.forEach((crystal, i) => {
      let grow = 0;
      if (crystal.active) {
        crystal.age += dt;
        const t = crystal.age - crystal.delay;
        grow = t < GROW_SECONDS ? snap(clamp01(t / GROW_SECONDS)) : 1 - clamp01((t - LIFE_SECONDS) / MELT_SECONDS);
        if (t > LIFE_SECONDS + MELT_SECONDS) crystal.active = false;
      }
      grow = Math.max(0.0001, grow);
      this.#scale.set(crystal.thickness * grow, crystal.height * grow, crystal.thickness * grow);
      this.mesh.setMatrixAt(i, this.#matrix.compose(crystal.position, crystal.quaternion, this.#scale));
    });
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  clear() {
    for (const crystal of this.crystals) crystal.active = false;
  }
}
