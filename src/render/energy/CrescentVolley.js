import * as THREE from 'three';
import { createCrescentGeometry, createCrescentMaterial } from './CrescentMesh.js';

/** Draws a CrescentBlasts pool: one mesh per slot, turned so each arc faces the camera. */
export class CrescentVolley {
  #x = new THREE.Vector3();
  #z = new THREE.Vector3();
  #toCamera = new THREE.Vector3();
  #basis = new THREE.Matrix4();
  #roll = new THREE.Quaternion();

  constructor(blasts, atmosphere, colors) {
    this.blasts = blasts;
    this.object = new THREE.Group();
    const geometry = createCrescentGeometry();
    this.meshes = blasts.items.map(() => {
      const mesh = new THREE.Mesh(geometry, createCrescentMaterial(atmosphere, colors));
      mesh.visible = false;
      mesh.frustumCulled = false;
      this.object.add(mesh);
      return mesh;
    });
  }

  setColor(color) {
    for (const mesh of this.meshes) mesh.material.uniforms.uColor.value.set(color);
  }

  sync(camera, size) {
    this.blasts.items.forEach((blast, i) => {
      const mesh = this.meshes[i];
      mesh.visible = blast.active;
      if (!blast.active) return;

      // y = travel direction, z = towards the camera (so the arc reads as a crescent).
      const y = blast.direction;
      this.#toCamera.subVectors(camera.position, blast.position).normalize();
      this.#z.copy(this.#toCamera).addScaledVector(y, -this.#toCamera.dot(y));
      if (this.#z.lengthSq() < 1e-6) this.#z.set(0, 0, 1);
      this.#z.normalize();
      this.#x.crossVectors(y, this.#z);
      this.#basis.makeBasis(this.#x, y, this.#z);
      mesh.quaternion.setFromRotationMatrix(this.#basis).multiply(this.#roll.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, blast.roll));

      mesh.position.copy(blast.position);
      mesh.scale.setScalar(this.blasts.scale(blast, size));
      const progress = this.blasts.progress(blast);
      mesh.material.uniforms.uOpacity.value = Math.min(1, progress * 12) * (1 - Math.max(0, (progress - 0.55) / 0.45));
    });
  }
}
