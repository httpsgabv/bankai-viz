import * as THREE from 'three';

/** Applies the same force to every particle (buoyancy, gravity, wind). */
export class ConstantForce {
  force = new THREE.Vector3();

  constructor(x = 0, y = 0, z = 0) {
    this.force.set(x, y, z);
  }

  accumulate(_swarm, _i, out) {
    out[0] += this.force.x;
    out[1] += this.force.y;
    out[2] += this.force.z;
  }
}
