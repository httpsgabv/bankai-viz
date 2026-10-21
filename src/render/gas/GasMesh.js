import * as THREE from 'three';
import vertexShader from './shaders/gas.vert.glsl?raw';
import fragmentShader from './shaders/gas.frag.glsl?raw';
import { premultipliedGlow } from '../shared/blending.js';

/** Soft, swelling gas puffs drawn as point sprites straight from the swarm buffers. */
export class GasMesh {
  constructor(swarm, lifecycle, atmosphere) {
    const geometry = new THREE.BufferGeometry();
    this.positions = new THREE.BufferAttribute(swarm.positions, 3).setUsage(THREE.DynamicDrawUsage);
    this.visibility = new THREE.BufferAttribute(swarm.visibility, 1).setUsage(THREE.DynamicDrawUsage);
    this.ages = new THREE.BufferAttribute(lifecycle.ages, 1).setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('position', this.positions);
    geometry.setAttribute('aVisibility', this.visibility);
    geometry.setAttribute('aAge', this.ages);
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(swarm.seeds, 1));

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      ...premultipliedGlow,
      uniforms: {
        ...atmosphere,
        uSize: { value: 0.6 },
        uViewportHeight: { value: 1 },
        uColorCore: { value: new THREE.Color('#c6ff4d') },
        uColorEdge: { value: new THREE.Color('#8a2be2') },
        uHue: { value: 0 },
        uOpacity: { value: 0.5 },
        uGlow: { value: 0.8 },
      },
    });

    this.object = new THREE.Points(geometry, this.material);
    this.object.frustumCulled = false;
  }

  setAppearance({ size, opacity, glow, colorCore, colorEdge, hue }) {
    const u = this.material.uniforms;
    if (size !== undefined) u.uSize.value = size;
    if (opacity !== undefined) u.uOpacity.value = opacity;
    if (glow !== undefined) u.uGlow.value = glow;
    if (colorCore !== undefined) u.uColorCore.value.set(colorCore);
    if (colorEdge !== undefined) u.uColorEdge.value.set(colorEdge);
    if (hue !== undefined) u.uHue.value = hue;
  }

  sync(viewportHeight) {
    this.material.uniforms.uViewportHeight.value = viewportHeight;
    this.positions.needsUpdate = true;
    this.visibility.needsUpdate = true;
    this.ages.needsUpdate = true;
  }
}
