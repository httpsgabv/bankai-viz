import * as THREE from 'three';
import { createPetalGeometry } from './createPetalGeometry.js';
import { createPetalMaterial } from './createPetalMaterial.js';

/**
 * Draws every petal of a swarm in a single instanced draw call.
 * Instance buffers point straight at the swarm's typed arrays, so syncing is just a re-upload.
 */
export class PetalMesh {
  constructor(swarm, atmosphere) {
    const petal = createPetalGeometry();
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.index = petal.index;
    for (const name of ['position', 'normal', 'aTip']) geometry.setAttribute(name, petal.getAttribute(name));

    this.offsets = new THREE.InstancedBufferAttribute(swarm.positions, 3).setUsage(THREE.DynamicDrawUsage);
    this.visibility = new THREE.InstancedBufferAttribute(swarm.visibility, 1).setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('iOffset', this.offsets);
    geometry.setAttribute('iVisibility', this.visibility);
    geometry.setAttribute('iSeed', new THREE.InstancedBufferAttribute(swarm.seeds, 1));
    geometry.instanceCount = swarm.count;

    this.material = createPetalMaterial(atmosphere);
    this.object = new THREE.Mesh(geometry, this.material);
    this.object.frustumCulled = false;
  }

  setAppearance({ size, spin, colorBase, colorTip }) {
    const u = this.material.uniforms;
    if (size !== undefined) u.uSize.value = size;
    if (spin !== undefined) u.uSpin.value = spin;
    if (colorBase !== undefined) u.uColorBase.value.set(colorBase);
    if (colorTip !== undefined) u.uColorTip.value.set(colorTip);
  }

  sync(time) {
    this.material.uniforms.uTime.value = time;
    this.offsets.needsUpdate = true;
    this.visibility.needsUpdate = true;
  }
}
