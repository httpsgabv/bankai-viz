import * as THREE from 'three';
import { FrostGrid } from '../sim/FrostGrid.js';
import vertexShader from '../render/environment/shaders/frost.vert.glsl?raw';
import fragmentShader from '../render/environment/shaders/frost.frag.glsl?raw';

/** Frost painted onto the ground (cracked, sparkling ice) that slowly melts away. */
export class FrostField {
  constructor({ atmosphere, min = [-16, -16], max = [16, 8], floorY = 0, color = '#bfe8ff' }) {
    this.grid = new FrostGrid({ min, max });
    const n = this.grid.resolution;
    this.texture = new THREE.DataTexture(this.grid.bytes, n, n, THREE.RedFormat, THREE.UnsignedByteType);
    this.texture.magFilter = this.texture.minFilter = THREE.LinearFilter;

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        ...atmosphere,
        uFrost: { value: this.texture },
        uIce: { value: new THREE.Color(color) },
        uTime: { value: 0 },
      },
    });

    const width = max[0] - min[0];
    const depth = max[1] - min[1];
    this.object = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), this.material);
    // Rotating +90° about x maps the plane's +y (UV v) onto world +z, matching the grid rows.
    // That leaves the face pointing down, hence DoubleSide.
    this.object.rotation.x = Math.PI / 2;
    this.object.position.set(min[0] + width / 2, floorY + 0.012, min[1] + depth / 2);
  }

  get coverage() {
    return this.grid.coverage;
  }

  setMelt(melt) {
    this.grid.melt = melt;
  }

  setColor(color) {
    this.material.uniforms.uIce.value.set(color);
  }

  deposit(x, z, radius, amount) {
    this.grid.deposit(x, z, radius, amount);
  }

  clear() {
    this.grid.clear();
  }

  update(dt, time) {
    this.grid.update(dt);
    this.texture.needsUpdate = true;
    this.material.uniforms.uTime.value = time;
  }

  dispose() {
    this.object.removeFromParent();
    this.object.geometry.dispose();
    this.material.dispose();
    this.texture.dispose();
  }
}
