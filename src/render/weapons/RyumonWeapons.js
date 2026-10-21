import * as THREE from 'three';
import { BladeProfile } from '../blades/BladeProfile.js';
import { createBladeGeometry } from '../blades/createBladeGeometry.js';
import { createBladeMaterial } from '../blades/createBladeMaterial.js';
import { ChainLinks } from './ChainLinks.js';
import { createCrestMaterial } from './createCrestMaterial.js';

const HUB_RADIUS = 0.85;
const HANDLE_START = 1.7;
const GUANDAO = new BladeProfile({ length: 2.4, width: 0.75, thickness: 0.09, curvature: 0.12, tipStart: 0.72, taper: 0.1 });
const SPEARHEAD = new BladeProfile({ length: 2.0, width: 0.55, thickness: 0.08, curvature: 0, tipStart: 0.5, taper: 0 });
const HIT_POINTS_PER_ARM = 4;

/** Crescent axe head in the XY plane, convex cutting edge facing +x. */
function createAxeGeometry() {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, 1.35, -1.15, 1.15, false);
  shape.absarc(-0.55, 0, 1.05, 1.0, -1.0, true);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2, curveSegments: 36 });
  geometry.translate(-0.55, 0, -0.05);
  return geometry;
}

/**
 * Ryūmon Hōzukimaru: a giant crescent axe, a great curved blade and a broad spearhead,
 * chained to a central dragon crest. The three arms sit on a wheel that the release spins.
 * Arm local +x points outwards from the hub.
 */
export class RyumonWeapons {
  #point = new THREE.Vector3();
  #spokes = [];

  constructor({ atmosphere, reach = 4.2, crestColor = '#e0302a' }) {
    this.reach = reach;
    this.object = new THREE.Group();
    this.wheel = new THREE.Group();
    this.object.add(this.wheel);

    const steel = createBladeMaterial(atmosphere, { steel: '#d4d7de', shadow: '#5b606b', glow: crestColor });
    const lacquer = new THREE.MeshStandardMaterial({ color: '#5a1a14', roughness: 0.4 });
    const gold = new THREE.MeshStandardMaterial({ color: '#d6aa55', metalness: 0.55, roughness: 0.3 });
    const axeSteel = new THREE.MeshStandardMaterial({ color: '#c3c7cf', metalness: 0.35, roughness: 0.3 });

    const heads = [
      new THREE.Mesh(createAxeGeometry(), axeSteel),
      this.#bladeHead(GUANDAO, steel),
      this.#bladeHead(SPEARHEAD, steel),
    ];
    this.arms = heads.map((head, i) => this.#createArm(head, i, lacquer, gold));

    // Hub: dark backing disc, gold rim and the dragon crest facing the viewer.
    this.crestMaterial = createCrestMaterial(atmosphere, { red: crestColor });
    const crest = new THREE.Mesh(new THREE.CircleGeometry(HUB_RADIUS, 64), this.crestMaterial);
    crest.position.z = 0.08;
    const backing = new THREE.Mesh(new THREE.CylinderGeometry(HUB_RADIUS, HUB_RADIUS, 0.14, 48).rotateX(Math.PI / 2), lacquer);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(HUB_RADIUS, 0.05, 10, 64), gold);
    this.object.add(backing, crest, rim);

    this.chains = new ChainLinks({ maxLinks: 30, linkLength: 0.22, thickness: 0.035 });
    this.object.add(this.chains.object);
    this.#spokes = this.arms.map(() => [new THREE.Vector3(), new THREE.Vector3()]);
  }

  set charge(value) {
    this.crestMaterial.uniforms.uCharge.value = value;
  }

  setCrestColor(color) {
    this.crestMaterial.uniforms.uRed.value.set(color);
  }

  /** Spins the wheel and refreshes chains. Call after positioning `object`. */
  update(time, spinAngle) {
    this.wheel.rotation.z = spinAngle;
    this.crestMaterial.uniforms.uTime.value = time;
    this.object.updateMatrixWorld(true);
    // Chains live inside `object`, so their endpoints are expressed in its local space.
    this.arms.forEach((arm, i) => {
      this.object.worldToLocal(arm.localToWorld(this.#spokes[i][0].set(HUB_RADIUS * 0.9, 0, 0)));
      this.object.worldToLocal(arm.localToWorld(this.#spokes[i][1].set(HANDLE_START, 0, 0)));
    });
    this.chains.update(this.#spokes);
  }

  /** World positions along each weapon head, for hit tests. Calls back (point, armIndex). */
  forEachHitPoint(callback) {
    this.arms.forEach((arm, i) => {
      for (let k = 0; k < HIT_POINTS_PER_ARM; k++) {
        const along = this.reach + (k / (HIT_POINTS_PER_ARM - 1)) * 1.9;
        callback(arm.localToWorld(this.#point.set(along, 0, 0)), i);
      }
    });
  }

  #bladeHead(profile, material) {
    const head = new THREE.Mesh(createBladeGeometry(profile, 40), material);
    head.rotation.z = -Math.PI / 2; // blade length (+y) → radial (+x)
    return head;
  }

  #createArm(head, index, lacquer, gold) {
    const arm = new THREE.Group();
    arm.rotation.z = (index / 3) * Math.PI * 2;

    const handleLength = this.reach - HANDLE_START;
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, handleLength, 14).rotateZ(Math.PI / 2), lacquer);
    handle.position.x = HANDLE_START + handleLength / 2;
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.18, 14).rotateZ(Math.PI / 2), gold);
    collar.position.x = this.reach;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.035, 8, 20).rotateY(Math.PI / 2), gold);
    ring.position.x = HANDLE_START;

    head.position.x = this.reach;
    arm.add(handle, collar, ring, head);
    this.wheel.add(arm);
    return arm;
  }
}
