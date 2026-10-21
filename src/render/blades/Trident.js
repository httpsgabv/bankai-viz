import * as THREE from 'three';
import { BladeProfile } from './BladeProfile.js';
import { createBladeGeometry } from './createBladeGeometry.js';
import { createBladeMaterial } from './createBladeMaterial.js';
import { createJizoHead } from '../creatures/createJizoHead.js';

const CENTER = new BladeProfile({ length: 2.3, width: 0.2, thickness: 0.045, curvature: 0, tipStart: 0.8, taper: 0.3 });
const PRONG = new BladeProfile({ length: 1.25, width: 0.13, thickness: 0.035, curvature: 0.12, tipStart: 0.75, taper: 0.2 });
const OPEN_ANGLE = 0.55;

/**
 * Ashisogi Jizō's shikai: a golden trident whose side prongs curve inwards,
 * with Jizō's haloed baby face as the guard. Pivot (origin) sits at the guard,
 * blades point +y. `openness` folds the prongs (0) or spreads them (1).
 */
export class Trident {
  constructor({ atmosphere }) {
    this.group = new THREE.Group();
    this.material = createBladeMaterial(atmosphere, { steel: '#efd48c', shadow: '#6e5221', glow: '#b46cff' });
    this.tips = [];
    this.prongs = [];

    const center = new THREE.Mesh(createBladeGeometry(CENTER), this.material);
    center.position.y = 0.18;
    this.#addTip(center, CENTER);
    this.group.add(center);

    const prongGeometry = createBladeGeometry(PRONG, 48);
    for (const side of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.26, 0.12, 0);
      pivot.userData.side = side;
      const prong = new THREE.Mesh(prongGeometry, this.material);
      if (side < 0) prong.rotation.y = Math.PI; // mirror so both curve inwards
      pivot.add(prong);
      this.#addTip(prong, PRONG);
      this.prongs.push(pivot);
      this.group.add(pivot);
    }

    this.group.add(...this.#createFittings());
    this.openness = 1;
  }

  /** Total reach from the pivot to the central tip. */
  get reach() {
    return CENTER.length + 0.18;
  }

  set openness(value) {
    for (const pivot of this.prongs) {
      pivot.rotation.z = -pivot.userData.side * OPEN_ANGLE * value;
      pivot.scale.setScalar(0.25 + 0.75 * value);
    }
  }

  /** Writes the world position of each blade tip into `out` (array of Vector3). */
  tipPositions(out) {
    this.tips.forEach((tip, i) => tip.getWorldPosition(out[i]));
    return out;
  }

  #addTip(mesh, profile) {
    const tip = new THREE.Object3D();
    tip.position.set(profile.sectionAt(1).spine, profile.length, 0);
    mesh.add(tip);
    this.tips.push(tip);
  }

  #createFittings() {
    const gold = new THREE.MeshStandardMaterial({ color: '#d9a93e', metalness: 0.55, roughness: 0.3, emissive: '#2a1c06' });
    const wrap = new THREE.MeshStandardMaterial({ color: '#3a2448', roughness: 0.8 });

    const crossbar = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.1, 0.09), gold);
    crossbar.position.y = 0.12;

    const { group: face } = createJizoHead({ haloSpikes: 10 });
    face.scale.setScalar(0.2);
    face.position.set(0, -0.14, 0.02);

    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.075, 1.15, 20), wrap);
    grip.position.y = -0.4 - 0.575;

    const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), gold);
    pommel.position.y = -0.4 - 1.17;

    return [crossbar, face, grip, pommel];
  }
}
