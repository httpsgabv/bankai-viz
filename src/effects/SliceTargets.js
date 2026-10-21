import * as THREE from 'three';
import { clamp01, easeOutCubic } from '../utils/math.js';

const SLICE_SECONDS = 1.4;
const RESPAWN_SECONDS = 2.6;
const GROW_SECONDS = 0.7;
const DAMAGE_DECAY = 0.4;

/**
 * Pale blocks floating in the air. Feed them damage (e.g. from fast-moving ash) and once
 * a block's damage passes 1 it is sliced in half: the halves drift apart, tumble and fade,
 * then a fresh block grows back in its place.
 */
export class SliceTargets {
  sliced = 0;

  #axis = new THREE.Vector3();

  constructor({ count = 7, min, max, color = '#ddd5c8' }) {
    this.object = new THREE.Group();
    this.targets = Array.from({ length: count }, () => this.#createTarget(min, max, color));
  }

  /** World-space centre and radius of every block that can currently be hit. */
  *hittable() {
    for (const target of this.targets) {
      if (target.state === 'whole') yield target;
    }
  }

  damage(target, amount) {
    target.damage += amount;
    if (target.damage >= 1) this.#slice(target);
  }

  setColor(color) {
    for (const target of this.targets) target.material.color.set(color);
  }

  update(dt, time) {
    for (const target of this.targets) {
      target.age += dt;
      target.damage = Math.max(0, target.damage - DAMAGE_DECAY * dt);
      if (target.state === 'whole') this.#float(target, time);
      else if (target.state === 'sliced') this.#fall(target, dt);
      else this.#grow(target, time);
    }
  }

  #createTarget(min, max, color) {
    const size = 0.5 + Math.random() * 0.35;
    const material = new THREE.MeshStandardMaterial({ color, roughness: 0.75, transparent: true });
    const group = new THREE.Group();
    const whole = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), material);
    const halves = [-1, 1].map((side) => {
      const half = new THREE.Mesh(new THREE.BoxGeometry(size / 2, size, size), material);
      half.position.x = (side * size) / 4;
      half.visible = false;
      half.userData = { side, spin: new THREE.Vector3().randomDirection(), velocity: new THREE.Vector3() };
      group.add(half);
      return half;
    });
    group.add(whole);
    this.object.add(group);

    const home = new THREE.Vector3(...min.map((low, axis) => low + Math.random() * (max[axis] - low)));
    const target = { group, whole, halves, material, size, home, center: home.clone(), radius: size * 0.85, phase: Math.random() * 10, damage: 0, age: 0, state: 'whole' };
    this.#reset(target);
    return target;
  }

  #reset(target) {
    target.group.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    target.group.scale.setScalar(1);
    target.whole.visible = true;
    target.halves.forEach((half) => {
      half.visible = false;
      half.position.set((half.userData.side * target.size) / 4, 0, 0);
      half.rotation.set(0, 0, 0);
    });
    target.material.opacity = 1;
    target.damage = 0;
  }

  #float(target, time) {
    const t = time * 0.6 + target.phase;
    target.center.copy(target.home).add(this.#axis.set(Math.sin(t) * 0.25, Math.sin(t * 1.3) * 0.35, Math.cos(t * 0.8) * 0.2));
    target.group.position.copy(target.center);
  }

  #slice(target) {
    target.state = 'sliced';
    target.age = 0;
    target.whole.visible = false;
    this.sliced += 1;
    for (const half of target.halves) {
      half.visible = true;
      // Halves part along the cut, plus a random kick and a little drop.
      half.userData.velocity.set(half.userData.side * (1.2 + Math.random()), -0.4 - Math.random() * 0.6, (Math.random() - 0.5) * 0.8);
    }
  }

  #fall(target, dt) {
    const t = clamp01(target.age / SLICE_SECONDS);
    for (const half of target.halves) {
      half.position.addScaledVector(half.userData.velocity, dt);
      half.userData.velocity.y -= 2.2 * dt;
      half.rotateOnAxis(half.userData.spin, dt * 1.6);
    }
    target.material.opacity = 1 - t;
    if (target.age >= RESPAWN_SECONDS) {
      this.#reset(target);
      target.state = 'growing';
      target.age = 0;
    }
  }

  #grow(target, time) {
    const t = clamp01(target.age / GROW_SECONDS);
    target.group.scale.setScalar(Math.max(0.001, easeOutCubic(t)));
    this.#float(target, time);
    if (t >= 1) target.state = 'whole';
  }
}
