import * as THREE from 'three';
import vertexShader from './shaders/crescent.vert.glsl?raw';
import fragmentShader from './shaders/crescent.frag.glsl?raw';

/**
 * A crescent of energy in the local XY plane, convex side facing +y (its direction of travel),
 * horns sweeping back. Radius 1; scale the mesh to resize.
 */
export function createCrescentGeometry({ arc = 2.4, width = 0.32, segments = 48 } = {}) {
  const positions = [];
  const across = [];
  const along = [];
  const indices = [];

  for (let i = 0; i <= segments; i++) {
    const s = i / segments;
    const angle = (s - 0.5) * arc;
    const halfWidth = (width / 2) * Math.sin(Math.PI * s);
    for (const side of [-1, 1]) {
      const radius = 1 + side * halfWidth;
      positions.push(Math.sin(angle) * radius, Math.cos(angle) * radius - 1, 0);
      across.push(side);
      along.push(s);
    }
  }
  for (let i = 0; i < segments; i++) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('aAcross', new THREE.Float32BufferAttribute(across, 1));
  geometry.setAttribute('aAlong', new THREE.Float32BufferAttribute(along, 1));
  return geometry;
}

export function createCrescentMaterial(atmosphere, { color = '#c8102e', core = '#ffd9de' } = {}) {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      ...atmosphere,
      uColor: { value: new THREE.Color(color) },
      uCore: { value: new THREE.Color(core) },
      uOpacity: { value: 1 },
    },
  });
}
