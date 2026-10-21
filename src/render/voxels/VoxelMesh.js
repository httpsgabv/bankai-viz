import * as THREE from 'three';

/** Draws a VoxelSculpture as instanced cubes, tinted from ink to crimson by heat. */
export class VoxelMesh {
  #matrix = new THREE.Matrix4();
  #position = new THREE.Vector3();
  #quaternion = new THREE.Quaternion();
  #scale = new THREE.Vector3();
  #axis = new THREE.Vector3();
  #ink = new THREE.Color();
  #hot = new THREE.Color();
  #color = new THREE.Color();

  constructor(sculpture, { ink, hot }) {
    this.sculpture = sculpture;
    this.mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.05 }),
      sculpture.count,
    );
    this.mesh.frustumCulled = false;
    this.setColors({ ink, hot });
    for (let i = 0; i < sculpture.count; i++) this.mesh.setColorAt(i, this.#ink);
  }

  get object() {
    return this.mesh;
  }

  setColors({ ink, hot }) {
    if (ink) this.#ink.set(ink);
    if (hot) this.#hot.set(hot);
  }

  sync() {
    const { sculpture, mesh } = this;
    const { render, axes, angles, sizes, heat } = sculpture;
    for (let i = 0; i < sculpture.count; i++) {
      const k = i * 3;
      this.#position.set(render[k], render[k + 1], render[k + 2]);
      this.#axis.set(axes[k], axes[k + 1], axes[k + 2]);
      this.#quaternion.setFromAxisAngle(this.#axis, angles[i]);
      this.#scale.setScalar(sizes[i]);
      mesh.setMatrixAt(i, this.#matrix.compose(this.#position, this.#quaternion, this.#scale));
      mesh.setColorAt(i, this.#color.copy(this.#ink).lerp(this.#hot, heat[i]));
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
  }
}
