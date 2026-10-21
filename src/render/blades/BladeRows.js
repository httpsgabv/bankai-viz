import * as THREE from 'three';
import { createBladeGeometry } from './createBladeGeometry.js';
import { createBladeMaterial } from './createBladeMaterial.js';
import { easeOutCubic } from '../../utils/math.js';

/**
 * Two rows of giant blades lining a corridor that runs away from the camera.
 * Each blade can rise out of the ground (`rise`) and dissolve into petals (`dissolve`).
 */
export class BladeRows {
  #matrix = new THREE.Matrix4();

  constructor({ profile, perRow, atmosphere, rowOffset = 3.8, spacing = 3.4, start = 4 }) {
    this.profile = profile;
    this.count = perRow * 2;

    const geometry = createBladeGeometry(profile, 48);
    this.dissolveAttribute = new THREE.InstancedBufferAttribute(new Float32Array(this.count), 1);
    this.dissolveAttribute.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('iDissolve', this.dissolveAttribute);

    this.mesh = new THREE.InstancedMesh(geometry, createBladeMaterial(atmosphere), this.count);
    this.mesh.frustumCulled = false;

    this.dissolve = this.dissolveAttribute.array;
    this.rise = new Float32Array(this.count);
    this.layout = this.#createLayout(perRow, rowOffset, spacing, start);
    this.finalMatrices = this.layout.map((blade) => this.#compose(blade, 0, new THREE.Matrix4()));
    this.update();
  }

  /** Normalised 0 (nearest) → 1 (farthest), used to stagger animations. */
  delay(index) {
    return this.layout[index].delay;
  }

  update() {
    let anyVisible = false;
    for (let i = 0; i < this.count; i++) {
      const sink = (this.profile.length * this.layout[i].scale + 0.4) * (1 - easeOutCubic(this.rise[i]));
      this.mesh.setMatrixAt(i, this.#compose(this.layout[i], sink, this.#matrix));
      if (this.rise[i] > 0 && this.dissolve[i] < 1) anyVisible = true;
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    this.dissolveAttribute.needsUpdate = true;
    this.mesh.visible = anyVisible;
  }

  #createLayout(perRow, rowOffset, spacing, start) {
    const layout = [];
    for (const side of [-1, 1]) {
      for (let i = 0; i < perRow; i++) {
        layout.push({
          position: new THREE.Vector3(
            side * (rowOffset + Math.random() * 0.5 + i * 0.05),
            0,
            start - i * spacing + (Math.random() - 0.5) * 0.8,
          ),
          rotation: new THREE.Euler(
            (Math.random() - 0.5) * 0.06,
            side * (Math.PI / 2) + (Math.random() - 0.5) * 0.35,
            -side * Math.random() * 0.06,
            'YXZ',
          ),
          scale: 0.85 + Math.random() * 0.35,
          delay: perRow > 1 ? i / (perRow - 1) : 0,
        });
      }
    }
    return layout;
  }

  #compose({ position, rotation, scale }, sink, target) {
    const quaternion = new THREE.Quaternion().setFromEuler(rotation);
    const offset = position.clone();
    offset.y -= sink;
    return target.compose(offset, quaternion, new THREE.Vector3(scale, scale, scale));
  }
}
