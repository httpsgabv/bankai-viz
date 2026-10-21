import * as THREE from 'three';

const WING_SHARDS = 9;
const TAIL_SHARDS = 8;
const PETALS_PER_FLOWER = 4;
// Three ice flowers in an arc above the wings, where they stay visible.
const FLOWERS = [
  [-1.9, 4.1, -0.6],
  [0, 4.7, -0.6],
  [1.9, 4.1, -0.6],
];
const Z_AXIS = new THREE.Vector3(0, 0, 1);
const Y_AXIS = new THREE.Vector3(0, 1, 0);

/** A long crystal shard lying along +x from its base at the origin. */
function createShardGeometry() {
  return new THREE.OctahedronGeometry(1, 0).scale(0.5, 0.11, 0.05).translate(0.5, 0, 0);
}

/**
 * Daiguren Hyōrinmaru's form: great crystal wings and a tail of ice around a glowing core,
 * with three ice flowers floating behind. Each flower has four petals; `dropPetal` sheds
 * one, counting down the bankai's time.
 */
export class DaigurenWings {
  #matrix = new THREE.Matrix4();
  #quaternion = new THREE.Quaternion();
  #turn = new THREE.Quaternion();
  #position = new THREE.Vector3();
  #scale = new THREE.Vector3();
  #direction = new THREE.Vector3();

  constructor({ material }) {
    this.material = material;
    this.object = new THREE.Group();
    this.unfold = 1;

    this.core = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0).scale(0.8, 1.3, 0.8), material);
    this.shards = new THREE.InstancedMesh(createShardGeometry(), material, WING_SHARDS * 2 + TAIL_SHARDS);
    this.petals = new THREE.InstancedMesh(new THREE.OctahedronGeometry(1, 0).scale(0.16, 0.42, 0.05).translate(0, 0.42, 0), material, FLOWERS.length * PETALS_PER_FLOWER);
    for (const mesh of [this.shards, this.petals]) mesh.frustumCulled = false;
    const gems = FLOWERS.map(([x, y, z]) => {
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), material);
      gem.position.set(x, y, z);
      return gem;
    });
    this.object.add(this.core, this.shards, this.petals, ...gems);

    this.petalAlive = new Array(FLOWERS.length * PETALS_PER_FLOWER).fill(true);
  }

  get totalPetals() {
    return this.petalAlive.length;
  }

  get petalsLeft() {
    return this.petalAlive.filter(Boolean).length;
  }

  restorePetals() {
    this.petalAlive.fill(true);
  }

  /** Sheds the next petal; returns its world position (or null if none are left). */
  dropPetal(out) {
    const index = this.petalAlive.lastIndexOf(true);
    if (index < 0) return null;
    this.petalAlive[index] = false;
    this.petals.getMatrixAt(index, this.#matrix);
    return out.setFromMatrixPosition(this.#matrix).applyMatrix4(this.object.matrixWorld);
  }

  /** Calls back with world positions spread along every wing and tail shard (for shattering). */
  forEachShard(callback) {
    for (let i = 0; i < this.shards.count; i++) {
      this.shards.getMatrixAt(i, this.#matrix);
      for (const along of [0.2, 0.5, 0.85]) {
        callback(this.#position.set(along, 0, 0).applyMatrix4(this.#matrix).applyMatrix4(this.object.matrixWorld));
      }
    }
  }

  /** @param flap 0 → resting, 1 → beating hard */
  update(time, flap) {
    const beat = Math.sin(time * (2.2 + flap * 3)) * (0.12 + flap * 0.35);
    let index = 0;
    for (const side of [-1, 1]) {
      for (let s = 0; s < WING_SHARDS; s++) {
        const u = s / (WING_SHARDS - 1);
        const spread = (75 - u * 115) * (Math.PI / 180) * this.unfold;
        const length = (3.8 - u * 2.1) * (0.3 + 0.7 * this.unfold);
        this.#quaternion.setFromAxisAngle(Z_AXIS, spread);
        this.#turn.setFromAxisAngle(Y_AXIS, beat * (1 - u * 0.4));
        this.#quaternion.premultiply(this.#turn);
        if (side < 0) this.#quaternion.premultiply(this.#turn.setFromAxisAngle(Y_AXIS, Math.PI));
        this.#position.set(side * 0.35, 0.35, 0);
        this.#scale.set(length, 1 + (1 - u) * 0.8, 1);
        this.shards.setMatrixAt(index++, this.#matrix.compose(this.#position, this.#quaternion, this.#scale));
      }
    }
    for (let t = 0; t < TAIL_SHARDS; t++) {
      const sway = Math.sin(time * 1.6 - t * 0.6) * 0.25;
      this.#position.set(Math.sin(time * 1.6 - t * 0.6) * 0.2 * t * 0.3, -0.6 - t * 0.55, -t * 0.12);
      this.#quaternion.setFromAxisAngle(Z_AXIS, -Math.PI / 2 + sway);
      this.#scale.set(0.9 - t * 0.07, 1.6 - t * 0.12, 1);
      this.shards.setMatrixAt(index++, this.#matrix.compose(this.#position, this.#quaternion, this.#scale));
    }
    this.shards.instanceMatrix.needsUpdate = true;
    this.#placePetals(time);
    this.core.rotation.y = time * 0.6;
  }

  #placePetals(time) {
    FLOWERS.forEach(([x, y, z], f) => {
      for (let p = 0; p < PETALS_PER_FLOWER; p++) {
        const index = f * PETALS_PER_FLOWER + p;
        const angle = (p / PETALS_PER_FLOWER) * Math.PI * 2 + Math.PI / 4 + time * 0.3;
        this.#quaternion.setFromAxisAngle(Z_AXIS, angle);
        this.#position.set(x, y, z);
        this.#scale.setScalar(this.petalAlive[index] ? this.unfold : 0.0001);
        this.petals.setMatrixAt(index, this.#matrix.compose(this.#position, this.#quaternion, this.#scale));
      }
    });
    this.petals.instanceMatrix.needsUpdate = true;
  }
}
