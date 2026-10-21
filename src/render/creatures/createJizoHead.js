import * as THREE from 'three';

const SKIN = new THREE.MeshStandardMaterial({ color: '#efe1d4', roughness: 0.55, metalness: 0 });
const DARK = new THREE.MeshStandardMaterial({ color: '#24152b', roughness: 0.6 });
const GOLD = new THREE.MeshStandardMaterial({
  color: '#d9a93e',
  metalness: 0.55,
  roughness: 0.3,
  emissive: '#3a2608',
});

/**
 * The serene baby face of Jizō with a spiked golden halo behind it.
 * Unit-sized (head radius 1), facing +z. `mouth` marks where poison comes out.
 */
export function createJizoHead({ haloSpikes = 14 } = {}) {
  const group = new THREE.Group();

  const skull = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), SKIN.clone());
  skull.scale.set(1, 1.04, 0.94);

  // Closed, crescent eyes and a small mouth.
  const eyeGeometry = new THREE.SphereGeometry(1, 16, 10);
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(eyeGeometry, DARK.clone());
    eye.scale.set(0.2, 0.045, 0.08);
    eye.position.set(side * 0.34, 0.14, 0.87);
    eye.rotation.z = side * -0.18;
    group.add(eye);
  }
  const mouthShape = new THREE.Mesh(eyeGeometry, DARK.clone());
  mouthShape.scale.set(0.11, 0.07, 0.06);
  mouthShape.position.set(0, -0.36, 0.88);

  const halo = new THREE.Group();
  const ringMaterial = GOLD.clone();
  halo.add(new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.06, 12, 96), ringMaterial));
  const spikeGeometry = new THREE.ConeGeometry(0.06, 0.32, 8);
  for (let i = 0; i < haloSpikes; i++) {
    const angle = (i / haloSpikes) * Math.PI * 2;
    const spike = new THREE.Mesh(spikeGeometry, ringMaterial);
    spike.position.set(Math.cos(angle) * 1.66, Math.sin(angle) * 1.66, 0);
    spike.rotation.z = angle - Math.PI / 2;
    halo.add(spike);
  }
  halo.position.z = -0.4;

  const mouth = new THREE.Object3D();
  mouth.position.set(0, -0.36, 1.0);

  group.add(skull, mouthShape, halo, mouth);
  return { group, halo, mouth };
}
