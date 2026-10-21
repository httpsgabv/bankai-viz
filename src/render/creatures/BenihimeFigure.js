import * as THREE from 'three';
import { damp, easeOutCubic } from '../../utils/math.js';

const RISE_SECONDS = 3;

/**
 * An abstract silhouette of Kannonbiraki Benihime Aratame: a towering lady in a dark
 * bell-shaped gown with a crimson sash, long sleeves and a camellia in her hair.
 * Meant to loom in the fog behind the action.
 */
export class BenihimeFigure {
  #rise = 0;
  #opacity = 1;

  constructor({ crimson = '#c8102e' } = {}) {
    this.object = new THREE.Group();
    this.materials = {
      gown: new THREE.MeshStandardMaterial({ color: '#211b1d', roughness: 0.8 }),
      skin: new THREE.MeshStandardMaterial({ color: '#efe3d8', roughness: 0.6 }),
      hair: new THREE.MeshStandardMaterial({ color: '#141012', roughness: 0.7 }),
      crimson: new THREE.MeshStandardMaterial({ color: crimson, roughness: 0.5 }),
      gold: new THREE.MeshStandardMaterial({ color: '#d6b25e', metalness: 0.4, roughness: 0.4 }),
    };
    this.body = new THREE.Group();
    this.body.add(...this.#createGown(), ...this.#createHead());
    this.object.add(this.body);
    for (const material of Object.values(this.materials)) material.transparent = true;
  }

  setColor(color) {
    this.materials.crimson.color.set(color);
  }

  setOpacity(opacity) {
    this.#opacity = opacity;
  }

  /** Restart the rise from beneath the ground. */
  rise() {
    this.#rise = 0;
  }

  update(dt, time) {
    this.#rise = Math.min(1, this.#rise + dt / RISE_SECONDS);
    this.body.position.y = -12 * (1 - easeOutCubic(this.#rise));
    this.body.rotation.y = Math.sin(time * 0.25) * 0.08;
    this.body.rotation.z = Math.sin(time * 0.31) * 0.015;
    for (const material of Object.values(this.materials)) {
      material.opacity = damp(material.opacity, this.#opacity, 3, dt);
    }
    this.object.visible = this.#opacity > 0.01 || this.materials.gown.opacity > 0.01;
  }

  #createGown() {
    const profile = [
      [0, 0], [2.7, 0], [2.45, 1.4], [1.75, 3.4], [1.1, 5.2], [0.8, 6.6], [0.95, 7.5], [0.55, 8.2], [0.18, 8.4],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    const gown = new THREE.Mesh(new THREE.LatheGeometry(profile, 48), this.materials.gown);

    const sash = new THREE.Mesh(new THREE.TorusGeometry(0.98, 0.2, 12, 48), this.materials.crimson);
    sash.rotation.x = Math.PI / 2;
    sash.position.y = 5.7;

    const bow = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 14), this.materials.crimson);
    bow.scale.set(1.5, 0.7, 0.5);
    bow.position.set(0, 5.7, -1.05);

    const sleeves = [-1, 1].map((side) => {
      const sleeve = new THREE.Mesh(new THREE.ConeGeometry(0.75, 3.6, 24, 1, true), this.materials.gown);
      sleeve.position.set(side * 1.25, 6.2, 0.15);
      sleeve.rotation.z = side * 0.32;
      return sleeve;
    });
    return [gown, sash, bow, ...sleeves];
  }

  #createHead() {
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.6, 16), this.materials.skin);
    neck.position.y = 8.6;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.72, 32, 24), this.materials.skin);
    head.scale.set(0.92, 1.05, 0.95);
    head.position.y = 9.45;

    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.78, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.6), this.materials.hair);
    hair.position.set(0, 9.55, -0.08);
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 16), this.materials.hair);
    bun.position.set(0, 10.3, -0.35);

    // Camellia kanzashi on the side of the head.
    const flower = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), this.materials.crimson);
      petal.scale.set(1, 0.6, 0.35);
      petal.position.set(Math.cos(angle) * 0.2, Math.sin(angle) * 0.2, 0);
      petal.rotation.z = angle;
      flower.add(petal);
    }
    flower.add(new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), this.materials.gold));
    flower.position.set(0.62, 9.95, 0.3);
    flower.rotation.y = 0.9;

    return [neck, head, hair, bun, flower];
  }
}
