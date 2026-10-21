import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);

/**
 * Draws chains between pairs of points as instanced oval links, each turned 90°
 * from the last like a real chain. Spans shorter than one link are hidden.
 */
export class ChainLinks {
  #matrix = new THREE.Matrix4();
  #position = new THREE.Vector3();
  #direction = new THREE.Vector3();
  #quaternion = new THREE.Quaternion();
  #base = new THREE.Quaternion();
  #twist = new THREE.Quaternion();
  #scale = new THREE.Vector3();

  constructor({ maxLinks = 64, linkLength = 0.12, thickness = 0.018, color = '#9aa0a8' } = {}) {
    this.linkLength = linkLength;
    const geometry = new THREE.TorusGeometry(linkLength * 0.32, thickness, 6, 14);
    geometry.scale(1, 1.6, 1);
    const material = new THREE.MeshStandardMaterial({ color, metalness: 0.75, roughness: 0.35 });
    this.mesh = new THREE.InstancedMesh(geometry, material, maxLinks);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
  }

  get object() {
    return this.mesh;
  }

  /** @param spans array of [start, end] Vector3 pairs */
  update(spans, scale = 1) {
    let index = 0;
    const step = this.linkLength * scale * 0.82;
    for (const [start, end] of spans) {
      this.#direction.subVectors(end, start);
      const length = this.#direction.length();
      const links = Math.floor(length / step);
      if (links < 1) continue;
      this.#direction.divideScalar(length);
      this.#base.setFromUnitVectors(UP, this.#direction);
      for (let l = 0; l < links && index < this.mesh.instanceMatrix.count; l++, index++) {
        this.#position.copy(start).addScaledVector(this.#direction, (l + 0.5) * (length / links));
        this.#quaternion.copy(this.#base).multiply(this.#twist.setFromAxisAngle(UP, l % 2 ? Math.PI / 2 : 0));
        this.#scale.setScalar(scale);
        this.mesh.setMatrixAt(index, this.#matrix.compose(this.#position, this.#quaternion, this.#scale));
      }
    }
    this.mesh.count = index;
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
