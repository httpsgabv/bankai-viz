import * as THREE from 'three';
import { createBladeGeometry } from './createBladeGeometry.js';
import { createBladeMaterial } from './createBladeMaterial.js';
import { createHilt } from './createHilt.js';

/** A single sword: dissolvable blade plus hilt. */
export class Katana {
  constructor({ profile, atmosphere }) {
    this.group = new THREE.Group();
    this.material = createBladeMaterial(atmosphere);
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
