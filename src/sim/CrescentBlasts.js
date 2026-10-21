import * as THREE from 'three';

/**
 * A small pool of energy crescents flying in straight lines.
 * Each blast: { active, position, direction, age, roll }.
 */
export class CrescentBlasts {
  speed = 14;
  life = 1.2;
  growth = 1.2;

  #next = 0;

  constructor(capacity = 8) {
    this.items = Array.from({ length: capacity }, () => ({
      active: false,
      position: new THREE.Vector3(),
      direction: new THREE.Vector3(),
      age: 0,
      roll: 0,
    }));
  }

  spawn(origin, direction) {
    const blast = this.items[this.#next];
    this.#next = (this.#next + 1) % this.items.length;
    blast.active = true;
    blast.position.copy(origin);
    blast.direction.copy(direction).normalize();
    blast.age = 0;
    blast.roll = (Math.random() - 0.5) * 1.2;
    return blast;
  }

  update(dt) {
    for (const blast of this.items) {
      if (!blast.active) continue;
      blast.age += dt;
      blast.position.addScaledVector(blast.direction, this.speed * dt);
      if (blast.age >= this.life) blast.active = false;
    }
  }

  /** 0 → 1 over the blast's life. */
  progress(blast) {
    return Math.min(1, blast.age / this.life);
  }

  scale(blast, size) {
    return size * (1 + this.progress(blast) * this.growth);
  }

  get anyActive() {
    return this.items.some((blast) => blast.active);
  }
}
