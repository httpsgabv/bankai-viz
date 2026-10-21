import * as THREE from 'three';

/** Habaki, tsuba and tsuka for a katana whose blade starts at y = 0 and points up. */
export function createHilt(profile, { gripLength = 0.95 } = {}) {
  const group = new THREE.Group();
  const width = profile.width;

  const gold = new THREE.MeshStandardMaterial({ color: '#c8a46a', metalness: 0.6, roughness: 0.35 });
  const iron = new THREE.MeshStandardMaterial({ color: '#3b3a40', metalness: 0.4, roughness: 0.45 });
  const wrap = new THREE.MeshStandardMaterial({ color: '#2a2930', metalness: 0.05, roughness: 0.85 });

  const habaki = new THREE.Mesh(new THREE.BoxGeometry(width * 1.12, 0.14, profile.thickness * 2.6), gold);
  habaki.position.y = 0.05;

  const tsuba = new THREE.Mesh(new THREE.CylinderGeometry(width * 1.55, width * 1.55, 0.05, 48), iron);
  tsuba.scale.z = 0.8;
  tsuba.position.y = -0.045;

  const tsuka = new THREE.Mesh(new THREE.CylinderGeometry(width * 0.42, width * 0.46, gripLength, 24), wrap);
  tsuka.scale.x = 1.3;
  tsuka.position.y = -0.07 - gripLength / 2;

  const kashira = new THREE.Mesh(new THREE.CylinderGeometry(width * 0.44, width * 0.4, 0.06, 24), gold);
  kashira.scale.x = 1.3;
  kashira.position.y = -0.07 - gripLength - 0.03;

  group.add(habaki, tsuba, tsuka, kashira);
  return group;
}
