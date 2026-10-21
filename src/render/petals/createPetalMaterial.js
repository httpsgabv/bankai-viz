import * as THREE from 'three';
import vertexShader from './shaders/petal.vert.glsl?raw';
import fragmentShader from './shaders/petal.frag.glsl?raw';

export function createPetalMaterial(atmosphere) {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide,
    uniforms: {
      ...atmosphere,
      uTime: { value: 0 },
      uSize: { value: 0.12 },
      uSpin: { value: 1.5 },
      uColorBase: { value: new THREE.Color('#e6799b') },
      uColorTip: { value: new THREE.Color('#fbd0dc') },
    },
  });
}
