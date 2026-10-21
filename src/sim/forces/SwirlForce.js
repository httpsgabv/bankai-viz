import * as THREE from 'three';

/** Spins petals around an axis through `center`, with a soft inward pull. */
export class SwirlForce {
  strength = 1;
  radius = 2;
  inward = 0.2;
  center = new THREE.Vector3();
  axis = new THREE.Vector3(0, 1, 0);

  constructor({ axis } = {}) {
    if (axis) this.axis.fromArray(axis).normalize();
  }

  accumulate(swarm, i, out) {
    if (this.strength <= 0) return;
    const P = swarm.positions;
    const k = i * 3;
    const { x: ax, y: ay, z: az } = this.axis;

    const dx = P[k] - this.center.x;
    const dy = P[k + 1] - this.center.y;
    const dz = P[k + 2] - this.center.z;
    const along = dx * ax + dy * ay + dz * az;
    const rx = dx - ax * along;
    const ry = dy - ay * along;
    const rz = dz - az * along;
    const r = Math.sqrt(rx * rx + ry * ry + rz * rz) + 1e-4;

    const q = r / this.radius;
    const g = (this.strength / (1 + q * q)) / r;

    out[0] += (ay * rz - az * ry) * g - rx * g * this.inward;
    out[1] += (az * rx - ax * rz) * g - ry * g * this.inward;
    out[2] += (ax * ry - ay * rx) * g - rz * g * this.inward;
  }
}
