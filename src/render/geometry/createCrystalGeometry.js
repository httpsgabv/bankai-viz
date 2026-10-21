import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** A hexagonal ice crystal with a pointed tip; base at y = 0, height 1. */
export function createCrystalGeometry() {
  const prism = new THREE.CylinderGeometry(0.16, 0.18, 0.75, 6).translate(0, 0.375, 0);
  const tip = new THREE.ConeGeometry(0.16, 0.25, 6).translate(0, 0.875, 0);
  return mergeGeometries([prism.toNonIndexed(), tip.toNonIndexed()]);
}
