import * as THREE from 'three';

/** Gently pushes petals that leave a sphere back towards it. */
export class BoundsForce {
  strength = 1;
  radius = 15;
  center = new THREE.Vector3();

  accumulate(swarm, i, out) {
    if (this.strength <= 0) return;
    const P = swarm.positions;
    const k = i * 3;
    const dx = P[k] - this.center.x;
    const dy = P[k + 1] - this.center.y;
    const dz = P[k + 2] - this.center.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 1e-4;
    const excess = dist - this.radius;
    if (excess <= 0) return;
    const g = (this.strength * excess) / dist;
    out[0] -= dx * g;
    out[1] -= dy * g;
    out[2] -= dz * g;
  }
}
