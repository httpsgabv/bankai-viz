import * as THREE from 'three';
import { PendulumSet } from '../sim/PendulumSet.js';

const CEILING = 11;
const GLOW_DECAY = 1.4;

/** Lantern-plant (hōzuki) shaped paper lantern, unit height, centred on its middle. */
function createLanternGeometry() {
  const profile = [
    [0, -0.55], [0.16, -0.5], [0.34, -0.32], [0.44, -0.08], [0.43, 0.14], [0.33, 0.34], [0.17, 0.48], [0.05, 0.55], [0, 0.56],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const geometry = new THREE.LatheGeometry(profile, 10);
  // Five soft ribs, like the papery husk of the hōzuki fruit.
  const position = geometry.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < position.count; i++) {
    v.fromBufferAttribute(position, i);
    const angle = Math.atan2(v.z, v.x);
    const rib = 1 + 0.08 * Math.cos(angle * 5);
    position.setXYZ(i, v.x * rib, v.y, v.z * rib);
  }
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Glowing hōzuki lanterns hanging on strings from above. Strike one and it swings,
 * spins and flares brighter for a moment.
 */
export class HozukiLanterns {
  hits = 0;

  #step = new THREE.Vector3();

  constructor({ count = 8, min, max, color = '#ff7a2e', size = 0.9 }) {
    this.size = size;
    const anchors = [];
    const lengths = [];
    for (let i = 0; i < count; i++) {
      const x = min[0] + ((i + 0.5) / count) * (max[0] - min[0]) + (Math.random() - 0.5) * 0.8;
      const y = min[1] + Math.random() * (max[1] - min[1]);
      const z = min[2] + Math.random() * (max[2] - min[2]);
      anchors.push(new THREE.Vector3(x, CEILING, z));
      lengths.push(CEILING - y);
    }
    this.sim = new PendulumSet(anchors, lengths);
    this.glow = new Float32Array(count);
    this.spin = new Float32Array(count);
    this.angle = new Float32Array(count);

    this.object = new THREE.Group();
    const geometry = createLanternGeometry();
    const calyxGeometry = new THREE.ConeGeometry(0.12, 0.14, 5);
    const calyxMaterial = new THREE.MeshStandardMaterial({ color: '#4a3a22', roughness: 0.8 });
    this.lanterns = anchors.map(() => {
      const material = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.5,
        roughness: 0.85,
        side: THREE.DoubleSide,
      });
      const lantern = new THREE.Group();
      const body = new THREE.Mesh(geometry, material);
      const calyx = new THREE.Mesh(calyxGeometry, calyxMaterial);
      calyx.position.y = 0.58;
      calyx.rotation.x = Math.PI;
      lantern.add(body, calyx);
      lantern.scale.setScalar(size);
      this.object.add(lantern);
      return { group: lantern, material };
    });

    this.strings = new THREE.LineSegments(
      new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 6), 3)),
      new THREE.LineBasicMaterial({ color: '#8a7d6a', transparent: true, opacity: 0.6 }),
    );
    this.strings.frustumCulled = false;
    this.object.add(this.strings);
  }

  /** Radius used for hit tests. */
  get radius() {
    return this.size * 0.45;
  }

  setColor(color) {
    for (const { material } of this.lanterns) {
      material.color.set(color);
      material.emissive.set(color);
    }
  }

  /** Knocks lantern `i` with `velocity`; it flares and spins. */
  strike(i, velocity, dt) {
    this.sim.push(i, velocity, dt);
    this.glow[i] = 1;
    this.spin[i] += (Math.random() < 0.5 ? -1 : 1) * Math.min(12, velocity.length() * 0.6);
    this.hits += 1;
  }

  update(dt) {
    this.sim.update(dt);
    const strings = this.strings.geometry.attributes.position.array;
    this.lanterns.forEach(({ group, material }, i) => {
      const position = this.sim.positions[i];
      group.position.copy(position);
      // Lean along the string so it hangs naturally while swinging.
      this.#step.subVectors(this.sim.anchors[i], position).normalize();
      group.quaternion.setFromUnitVectors(THREE.Object3D.DEFAULT_UP, this.#step);
      this.angle[i] += this.spin[i] * dt;
      this.spin[i] *= Math.exp(-1.5 * dt);
      group.rotateY(this.angle[i]);

      this.glow[i] = Math.max(0, this.glow[i] - dt * GLOW_DECAY);
      material.emissiveIntensity = 0.45 + this.glow[i] * 2.2;

      strings.set([this.sim.anchors[i].x, this.sim.anchors[i].y, this.sim.anchors[i].z], i * 6);
      strings.set([position.x, position.y + this.size * 0.56, position.z], i * 6 + 3);
    });
    this.strings.geometry.attributes.position.needsUpdate = true;
  }
}
