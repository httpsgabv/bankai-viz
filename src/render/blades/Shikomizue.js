import * as THREE from 'three';
import { BladeProfile } from './BladeProfile.js';
import { createBladeGeometry } from './createBladeGeometry.js';
import { createBladeMaterial } from './createBladeMaterial.js';

const PROFILE = new BladeProfile({ length: 3.2, width: 0.15, thickness: 0.04, curvature: 0.012, tipStart: 0.88, taper: 0.1 });
const HILT_BEND = 0.32;

/**
 * Benihime: Urahara's cane sword. A straight blade, a hilt bent at an angle like a
 * walking stick, and a crimson tassel that sways from the pommel.
 * Pivot sits at the guard, blade points +y.
 */
export class Shikomizue {
  constructor({ atmosphere, crimson = '#c8102e' }) {
    this.group = new THREE.Group();
    this.material = createBladeMaterial(atmosphere, { steel: '#e4e6ea', shadow: '#6f7480', glow: crimson });

    const blade = new THREE.Mesh(createBladeGeometry(PROFILE), this.material);
    blade.position.y = 0.04;
    this.tip = new THREE.Object3D();
    this.tip.position.set(PROFILE.sectionAt(1).spine, PROFILE.length, 0);
    blade.add(this.tip);

    this.group.add(blade, this.#createHilt(crimson));
  }

  get length() {
    return PROFILE.length;
  }

  /** 1 = blade hidden, 0 = fully formed (forms base → tip with a glowing edge). */
  set dissolve(value) {
    this.material.uniforms.uDissolve.value = value;
  }

  tipPosition(out) {
    return this.tip.getWorldPosition(out);
  }

  /** Lets the tassel hang and swing a little. */
  update(time) {
    this.tassel.rotation.z = -HILT_BEND + Math.sin(time * 1.7) * 0.18;
    this.tassel.rotation.x = Math.sin(time * 1.1 + 1) * 0.12;
  }

  #createHilt(crimson) {
    const wood = new THREE.MeshStandardMaterial({ color: '#2b211d', roughness: 0.7 });
    const brass = new THREE.MeshStandardMaterial({ color: '#b08a4a', metalness: 0.5, roughness: 0.35 });
    const cord = new THREE.MeshStandardMaterial({ color: crimson, roughness: 0.6 });

    const hilt = new THREE.Group();
    hilt.rotation.z = HILT_BEND;

    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 20), brass);
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.95, 20), wood);
    grip.position.y = -0.52;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), brass);
    cap.position.y = -1.0;

    // Tassel: a short cord with a flared crimson tuft, hung from the pommel.
    this.tassel = new THREE.Group();
    this.tassel.position.y = -1.04;
    const string = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.35, 6), cord);
    string.position.y = -0.17;
    const knot = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), cord);
    knot.position.y = -0.36;
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.32, 14, 1, true), cord);
    tuft.position.y = -0.55;
    this.tassel.add(string, knot, tuft);

    hilt.add(collar, grip, cap, this.tassel);
    return hilt;
  }
}
