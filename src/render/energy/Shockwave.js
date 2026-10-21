import * as THREE from 'three';

/**
 * Expanding rings of force along the ground. `trigger` starts one;
 * `active()` yields the live ones ({ center, radius, maxRadius }) for hit tests.
 */
export class Shockwave {
  #next = 0;

  constructor({ capacity = 4, color = '#ff7a2e', floorY = 0 } = {}) {
    this.object = new THREE.Group();
    const geometry = new THREE.RingGeometry(0.88, 1, 96).rotateX(-Math.PI / 2);
    this.waves = Array.from({ length: capacity }, () => {
      const material = new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.y = floorY + 0.03;
      mesh.visible = false;
      this.object.add(mesh);
      return { mesh, active: false, center: new THREE.Vector3(), radius: 0, maxRadius: 1, age: 0, duration: 1 };
    });
  }

  setColor(color) {
    for (const wave of this.waves) wave.mesh.material.color.set(color);
  }

  trigger(center, maxRadius, duration) {
    const wave = this.waves[this.#next];
    this.#next = (this.#next + 1) % this.waves.length;
    Object.assign(wave, { active: true, radius: 0, maxRadius, age: 0, duration });
    wave.center.set(center.x, 0, center.z);
    return wave;
  }

  *active() {
    for (const wave of this.waves) if (wave.active) yield wave;
  }

  update(dt) {
    for (const wave of this.waves) {
      if (!wave.active) {
        wave.mesh.visible = false;
        continue;
      }
      wave.age += dt;
      const t = Math.min(1, wave.age / wave.duration);
      wave.radius = wave.maxRadius * (1 - (1 - t) ** 3);
      wave.mesh.visible = true;
      wave.mesh.position.x = wave.center.x;
      wave.mesh.position.z = wave.center.z;
      wave.mesh.scale.setScalar(Math.max(0.01, wave.radius));
      wave.mesh.material.opacity = 0.85 * (1 - t);
      if (t >= 1) wave.active = false;
    }
  }
}
