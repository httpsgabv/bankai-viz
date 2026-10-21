import * as THREE from 'three';

/**
 * A crescent blade in the XY plane with its convex cutting edge facing +x,
 * extruded along z and centred on its inner (concave) side. Unit-ish size: outer radius 1.35.
 */
export function createCrescentBladeGeometry({ depth = 0.1, bevel = 0.04 } = {}) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, 1.35, -1.15, 1.15, false);
  shape.absarc(-0.55, 0, 1.05, 1.0, -1.0, true);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 2,
    curveSegments: 36,
  });
  geometry.translate(-0.55, 0, -depth / 2);
  return geometry;
}
