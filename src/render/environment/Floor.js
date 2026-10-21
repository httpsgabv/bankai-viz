import * as THREE from 'three';
import vertexShader from './shaders/floor.vert.glsl?raw';
import fragmentShader from './shaders/floor.frag.glsl?raw';

/** How far the floor is nudged away from the ambient colour so a horizon stays visible. */
const FLOOR_CONTRAST = 0.045;
const BLACK = new THREE.Color('#000000');
const WHITE = new THREE.Color('#ffffff');

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

  /** Slightly darker than a light ambient, slightly lighter than a dark one. */
  setBaseColor(color) {
    const tint = this.material.uniforms.uTint.value.set(color);
    const luminance = 0.2126 * tint.r + 0.7152 * tint.g + 0.0722 * tint.b;
    // Nudge in sRGB so the step looks the same on light and dark ambients.
    tint.convertLinearToSRGB().lerp(luminance > 0.2 ? BLACK : WHITE, FLOOR_CONTRAST).convertSRGBToLinear();
  }

  setShadowColor(color) {
    this.material.uniforms.uShadowColor.value.set(color);
  }

  setShadowStrength(strength) {
    this.material.uniforms.uShadowStrength.value = strength;
  }

  setFocus(point) {
    this.material.uniforms.uFocus.value.copy(point);
  }
}
