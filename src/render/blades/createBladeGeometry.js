import * as THREE from 'three';

// Cross-section ring: spine (front/back), ridge line (front/back) and cutting edge.
// Each entry: [position between spine and edge, thickness side, edge factor for shading]
const RING = [
  [0, 0.3, 0],
  [0.35, 0.5, 0.35],
  [1, 0, 1],
  [0.35, -0.5, 0.35],
  [0, -0.3, 0],
];

/**
 * Builds a faceted blade from a BladeProfile.
 * Extra attributes: `aHeight` (0 base → 1 tip) drives dissolve, `aEdge` (0 spine → 1 edge) the hamon.
 */
export function createBladeGeometry(profile, segments = 72) {
  const positions = [];
  const heights = [];
  const edges = [];
  const indices = [];
  const ringSize = RING.length;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const { spine, edge, thickness } = profile.sectionAt(t);
    for (const [across, side, edgeFactor] of RING) {
      positions.push(spine + (edge - spine) * across, t * profile.length, side * thickness);
      heights.push(t);
      edges.push(edgeFactor);
    }
  }

  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < ringSize; j++) {
      const a = i * ringSize + j;
      const b = i * ringSize + ((j + 1) % ringSize);
      const c = a + ringSize;
      const d = b + ringSize;
      indices.push(a, c, b, b, c, d);
    }
  }

  const indexed = new THREE.BufferGeometry();
  indexed.setIndex(indices);
  indexed.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  indexed.setAttribute('aHeight', new THREE.Float32BufferAttribute(heights, 1));
  indexed.setAttribute('aEdge', new THREE.Float32BufferAttribute(edges, 1));

  const geometry = indexed.toNonIndexed();
  indexed.dispose();
  geometry.computeVertexNormals();
  return geometry;
}
