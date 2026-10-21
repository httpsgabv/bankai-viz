import * as THREE from 'three';

/** Faceted, slightly translucent glowing ice shared by Hyōrinmaru's crystals and creatures. */
export function createIceMaterial({ color = '#cdeeff', glow = '#2a6f9a', opacity = 0.9 } = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: glow,
    emissiveIntensity: 0.45,
    roughness: 0.12,
    metalness: 0,
    transparent: opacity < 1,
    opacity,
    flatShading: true,
  });
}
