import * as THREE from 'three';
import { createBladeGeometry } from './createBladeGeometry.js';
import { createBladeMaterial } from './createBladeMaterial.js';
import { createHilt } from './createHilt.js';

/** A single sword: dissolvable blade plus hilt. */
export class Katana {
  /** @param glow colour of the edge where the blade is dissolving */
  constructor({ profile, atmosphere, glow }) {
    this.group = new THREE.Group();
    this.material = createBladeMaterial(atmosphere, glow ? { glow } : {});
    this.blade = new THREE.Mesh(createBladeGeometry(profile), this.material);
    this.hilt = createHilt(profile);
    this.group.add(this.blade, this.hilt);
  }

  set dissolve(value) {
    this.material.uniforms.uDissolve.value = value;
  }

  get bladeMatrix() {
    this.blade.updateWorldMatrix(true, false);
    return this.blade.matrixWorld;
  }
}
