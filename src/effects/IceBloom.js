import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { ParticleSwarm } from '../sim/ParticleSwarm.js';
import { ConstantForce } from '../sim/forces/ConstantForce.js';
import { FlowForce } from '../sim/forces/FlowForce.js';
import { MoteMesh } from '../render/motes/MoteMesh.js';
import { clamp01 } from '../utils/math.js';

const SKY_HEIGHT = 10.5;
const GROW_SECONDS = 0.6;
const LIFE_SECONDS = 14;
const MELT_SECONDS = 1.5;

/** Six tilted crystal petals around a small gem: a flower of ice, base at y = 0. */
function createFlowerGeometry() {
  const parts = [];
  for (let i = 0; i < 6; i++) {
    const petal = new THREE.OctahedronGeometry(1, 0).scale(0.12, 0.03, 0.34).translate(0, 0.05, 0.3);
    petal.rotateX(-0.55).rotateY((i / 6) * Math.PI * 2);
    parts.push(petal);
  }
  parts.push(new THREE.OctahedronGeometry(0.09, 0).translate(0, 0.12, 0));
  return mergeGeometries(parts.map((part) => part.toNonIndexed()));
}

/**
 * "Hyōten Hyakkasō" — snow falls from a hole in the sky; every flake that touches the
 * ground blooms into an ice flower. `onBloom(x, z)` lets the release frost the spot.
 */
export class IceBloom {
  #matrix = new THREE.Matrix4();
  #quaternion = new THREE.Quaternion();
  #scale = new THREE.Vector3();
  #nextFlower = 0;
  #nextFlake = 0;

  constructor({ atmosphere, material, flakes = 900, flowers = 280, floorY = 0, onBloom = () => {} }) {
    this.floorY = floorY;
    this.onBloom = onBloom;
    this.object = new THREE.Group();

    this.swarm = new ParticleSwarm(flakes);
    this.swarm.forces = [new ConstantForce(0, -2.5, 0), Object.assign(new FlowForce(), { strength: 0.8, frequency: 0.3 })];
    this.swarm.drag = 1.2;
    this.swarm.fadeInRate = 6;
    for (let i = 0; i < flakes; i++) this.swarm.pin(i, 0, -100, 0);
    this.heat = new Float32Array(flakes).fill(1);
    this.flakeMesh = new MoteMesh(this.swarm, this.heat, atmosphere);
    this.flakeMesh.setAppearance({ size: 0.09, opacity: 0.95, ink: '#ffffff', hot: '#bfeaff' });

    this.flowers = Array.from({ length: flowers }, () => ({ active: false, position: new THREE.Vector3(), angle: 0, size: 1, age: 0 }));
    this.flowerMesh = new THREE.InstancedMesh(createFlowerGeometry(), material, flowers);
    this.flowerMesh.frustumCulled = false;
    this.object.add(this.flakeMesh.object, this.flowerMesh);
  }

  /** Opens the sky above (center.x, center.z): `count` flakes start falling within `radius`. */
  openSky(center, radius, count) {
    for (let n = 0; n < count; n++) {
      const i = this.#nextFlake;
      this.#nextFlake = (this.#nextFlake + 1) % this.swarm.count;
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * radius;
      const y = SKY_HEIGHT + Math.random() * 3;
      this.swarm.release(i, center.x + Math.cos(angle) * r, y, center.z + Math.sin(angle) * r, 0, -1 - Math.random(), 0);
      this.swarm.visibility[i] = 0;
    }
  }

  update(dt, time, viewportHeight) {
    this.swarm.update(dt, { dt, time });
    const P = this.swarm.positions;
    for (let i = 0; i < this.swarm.count; i++) {
      if (!this.swarm.free[i] || P[i * 3 + 1] > this.floorY + 0.05) continue;
      this.#bloom(P[i * 3], P[i * 3 + 2]);
      this.swarm.pin(i, 0, -100, 0);
    }
    this.flakeMesh.sync(viewportHeight);
    this.#updateFlowers(dt);
  }

  clear() {
    for (let i = 0; i < this.swarm.count; i++) this.swarm.pin(i, 0, -100, 0);
    for (const flower of this.flowers) flower.active = false;
  }

  dispose() {
    this.object.removeFromParent();
    this.flakeMesh.object.geometry.dispose();
    this.flakeMesh.material.dispose();
    this.flowerMesh.geometry.dispose();
  }

  #bloom(x, z) {
    const flower = this.flowers[this.#nextFlower];
    this.#nextFlower = (this.#nextFlower + 1) % this.flowers.length;
    Object.assign(flower, { active: true, angle: Math.random() * Math.PI * 2, size: 0.7 + Math.random() * 0.8, age: 0 });
    flower.position.set(x, this.floorY, z);
    this.onBloom(x, z);
  }

  #updateFlowers(dt) {
    this.flowers.forEach((flower, i) => {
      let grow = 0;
      if (flower.active) {
        flower.age += dt;
        const t = flower.age;
        grow = t < GROW_SECONDS ? 1 - (1 - t / GROW_SECONDS) ** 3 : 1 - clamp01((t - LIFE_SECONDS) / MELT_SECONDS);
        if (t > LIFE_SECONDS + MELT_SECONDS) flower.active = false;
      }
      this.#quaternion.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, flower.angle);
      this.#scale.setScalar(Math.max(0.0001, grow * flower.size));
      this.flowerMesh.setMatrixAt(i, this.#matrix.compose(flower.position, this.#quaternion, this.#scale));
    });
    this.flowerMesh.instanceMatrix.needsUpdate = true;
  }
}
