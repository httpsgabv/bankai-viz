import * as THREE from 'three';
import vertexShader from './shaders/floor.vert.glsl?raw';
import fragmentShader from './shaders/floor.frag.glsl?raw';

const FLOOR_SHADE = 0.955;

/** An almost invisible ground that melts into the fog, with a soft shadow under the action. */
export class Floor {
  constructor(atmosphere, { y = 0, size = 400 } = {}) {
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        ...atmosphere,
        uTint: { value: new THREE.Color() },
        uShadowColor: { value: new THREE.Color('#d8c1c9') },
        uFocus: { value: new THREE.Vector3() },
        uShadowStrength: { value: 0.35 },
        uShadowRadius: { value: 1.6 },
      },
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), this.material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = y;
    this.setBaseColor(atmosphere.uFogColor.value);
  }

  setBaseColor(color) {
    this.material.uniforms.uTint.value.set(color).multiplyScalar(FLOOR_SHADE);
  }

  setShadowStrength(strength) {
    this.material.uniforms.uShadowStrength.value = strength;
  }

  setFocus(point) {
    this.material.uniforms.uFocus.value.copy(point);
  }
}
