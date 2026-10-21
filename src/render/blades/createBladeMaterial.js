import * as THREE from 'three';
import vertexShader from './shaders/blade.vert.glsl?raw';
import fragmentShader from './shaders/blade.frag.glsl?raw';

/** Stylised steel with a hamon line and a tip-first petal dissolve. Works for Mesh and InstancedMesh. */
export function createBladeMaterial(atmosphere, { steel = '#d9dce3', shadow = '#7d828d', glow = '#f39ab5' } = {}) {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide,
    uniforms: {
      ...atmosphere,
      uDissolve: { value: 0 },
      uSteel: { value: new THREE.Color(steel) },
      uSteelShadow: { value: new THREE.Color(shadow) },
      uGlow: { value: new THREE.Color(glow) },
    },
  });
}
