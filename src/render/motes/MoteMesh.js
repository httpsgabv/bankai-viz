import * as THREE from 'three';
import vertexShader from './shaders/mote.vert.glsl?raw';
import fragmentShader from './shaders/mote.frag.glsl?raw';
import { premultipliedGlow } from '../shared/blending.js';

/** Ink-like dots that blush to a hot colour where `heat` is high; scaled by the swarm's visibility. */
export class MoteMesh {
  constructor(swarm, heat, atmosphere) {
    const geometry = new THREE.BufferGeometry();
    this.positions = new THREE.BufferAttribute(swarm.positions, 3).setUsage(THREE.DynamicDrawUsage);
    this.heat = new THREE.BufferAttribute(heat, 1).setUsage(THREE.DynamicDrawUsage);
    this.visibility = new THREE.BufferAttribute(swarm.visibility, 1).setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('position', this.positions);
    geometry.setAttribute('aHeat', this.heat);
    geometry.setAttribute('aVisibility', this.visibility);
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(swarm.seeds, 1));

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      ...premultipliedGlow,
      uniforms: {
        ...atmosphere,
        uSize: { value: 0.08 },
        uViewportHeight: { value: 1 },
        uInk: { value: new THREE.Color('#2b2624') },
        uHot: { value: new THREE.Color('#c8102e') },
        uOpacity: { value: 0.55 },
      },
    });
    this.object = new THREE.Points(geometry, this.material);
    this.object.frustumCulled = false;
  }

  setAppearance({ size, opacity, ink, hot }) {
    const u = this.material.uniforms;
    if (size !== undefined) u.uSize.value = size;
    if (opacity !== undefined) u.uOpacity.value = opacity;
    if (ink !== undefined) u.uInk.value.set(ink);
    if (hot !== undefined) u.uHot.value.set(hot);
  }

  sync(viewportHeight) {
    this.material.uniforms.uViewportHeight.value = viewportHeight;
    this.positions.needsUpdate = true;
    this.heat.needsUpdate = true;
    this.visibility.needsUpdate = true;
  }
}
