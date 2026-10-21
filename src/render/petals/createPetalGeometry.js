import * as THREE from 'three';

/**
 * A small cupped sakura petal: narrow at the base, rounded top with the characteristic notch.
 * Built as a grid so it can bend smoothly. `aTip` runs 0 (base) → 1 (tip) for shading.
 */
export function createPetalGeometry({ segmentsU = 5, segmentsV = 6, notch = 0.14, cup = 0.18, curl = 0.12 } = {}) {
  const positions = [];
  const tips = [];
  const indices = [];

  for (let iu = 0; iu <= segmentsU; iu++) {
    const u = iu / segmentsU;
    for (let iv = 0; iv <= segmentsV; iv++) {
      const v = (iv / segmentsV) * 2 - 1;
      const top = Math.sqrt(1 - 0.55 * v * v) - notch * Math.exp(-((v / 0.3) ** 2));
      const y = u * top;
      const halfWidth = 0.4 * Math.pow(Math.max(y, 1e-4), 0.6);
      const x = v * halfWidth;
      const z = cup * v * v * (0.3 + y) + curl * y * y;
      positions.push(x, y - 0.45, z);
      tips.push(y);
    }
  }

  const row = segmentsV + 1;
  for (let iu = 0; iu < segmentsU; iu++) {
    for (let iv = 0; iv < segmentsV; iv++) {
      const a = iu * row + iv;
      const b = a + 1;
      const c = a + row;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('aTip', new THREE.Float32BufferAttribute(tips, 1));
  geometry.computeVertexNormals();
  return geometry;
}
