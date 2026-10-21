import * as THREE from 'three';
import { BladeProfile } from '../blades/BladeProfile.js';
import { createBladeGeometry } from '../blades/createBladeGeometry.js';
import { createBladeMaterial } from '../blades/createBladeMaterial.js';
import { ChainLinks } from './ChainLinks.js';

const UP = new THREE.Vector3(0, 1, 0);
const DOWN = new THREE.Vector3(0, -1, 0);
const SPEARHEAD = new BladeProfile({ length: 0.95, width: 0.17, thickness: 0.05, curvature: 0, tipStart: 0.5, taper: 0 });

/**
 * Draws a SectionStaff: lacquered wooden sections with metal ferrules, a leaf-shaped
 * spearhead with Hōzukimaru's red tuft beneath it, and chains between split sections.
 */
export class SectionStaffMesh {
  #direction = new THREE.Vector3();
  #hang = new THREE.Vector3();
  #tuftSwing = DOWN.clone();

  constructor(staff, { atmosphere, tuftColor = '#d1342b' } = {}) {
    this.staff = staff;
    this.object = new THREE.Group();

    const wood = new THREE.MeshStandardMaterial({ color: '#6e3f24', roughness: 0.45, metalness: 0.05 });
    const metal = new THREE.MeshStandardMaterial({ color: '#c9a45c', metalness: 0.6, roughness: 0.3 });
    const shaftGeometry = new THREE.CylinderGeometry(0.055, 0.055, 1, 14);
    const ferruleGeometry = new THREE.CylinderGeometry(0.068, 0.068, 0.09, 14);

    this.shafts = staff.sections.map(() => new THREE.Mesh(shaftGeometry, wood));
    this.ferrules = staff.points.map(() => new THREE.Mesh(ferruleGeometry, metal));

    this.spearhead = new THREE.Mesh(createBladeGeometry(SPEARHEAD, 32), createBladeMaterial(atmosphere, { glow: tuftColor }));
    this.tuftMaterial = new THREE.MeshStandardMaterial({ color: tuftColor, roughness: 0.9 });
    this.tuft = new THREE.Group();
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), this.tuftMaterial);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.42, 16, 1, true), this.tuftMaterial);
    tail.position.y = -0.24;
    tail.rotation.x = Math.PI;
    this.tuft.add(puff, tail);

    this.chains = new ChainLinks({ maxLinks: 40 });
    this.object.add(...this.shafts, ...this.ferrules, this.spearhead, this.tuft, this.chains.object);
  }

  setTuftColor(color) {
    this.tuftMaterial.color.set(color);
    this.spearhead.material.uniforms.uGlow.value.set(color);
  }

  update(dt) {
    const { staff } = this;
    staff.sections.forEach(([start, end], i) => this.#placeBetween(this.shafts[i], start, end));
    staff.points.forEach((point, i) => {
      const section = staff.sections[Math.floor(i / 2)];
      this.#direction.subVectors(section[1], section[0]).normalize();
      this.ferrules[i].position.copy(point);
      this.ferrules[i].quaternion.setFromUnitVectors(UP, this.#direction);
    });

    // Spearhead continues the head section; the tuft hangs just below it and lags behind.
    const [headStart, headEnd] = staff.sections[2];
    this.#direction.subVectors(headEnd, headStart).normalize();
    this.spearhead.position.copy(headEnd);
    this.spearhead.quaternion.setFromUnitVectors(UP, this.#direction);
    this.tuft.position.copy(headEnd);
    this.#hang.copy(this.#direction).multiplyScalar(-0.5).add(DOWN).normalize();
    this.#tuftSwing.lerp(this.#hang, 1 - Math.exp(-6 * dt)).normalize();
    this.tuft.quaternion.setFromUnitVectors(DOWN, this.#tuftSwing);

    const p = staff.points;
    this.chains.update(staff.split ? [[p[1], p[2]], [p[3], p[4]]] : []);
  }

  #placeBetween(mesh, start, end) {
    this.#direction.subVectors(end, start);
    const length = this.#direction.length();
    mesh.visible = length > 0.01;
    mesh.position.addVectors(start, end).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(UP, this.#direction.divideScalar(length || 1));
    mesh.scale.set(1, length, 1);
  }
}
