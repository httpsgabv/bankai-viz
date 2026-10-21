import { ParticleSwarm } from '../sim/ParticleSwarm.js';
import { PetalMesh } from '../render/petals/PetalMesh.js';

/** Glue between a petal simulation and its instanced rendering. */
export class PetalStorm {
  constructor({ count, atmosphere, forces, floorY = -Infinity }) {
    this.swarm = new ParticleSwarm(count);
    this.swarm.forces = forces;
    this.swarm.floorY = floorY;
    this.mesh = new PetalMesh(this.swarm, atmosphere);
  }

  get object() {
    return this.mesh.object;
  }

  setAppearance(appearance) {
    this.mesh.setAppearance(appearance);
  }

  update(dt, time) {
    this.swarm.update(dt, { dt, time });
    this.mesh.sync(time);
  }

  dispose() {
    this.object.removeFromParent();
    this.object.geometry.dispose();
    this.mesh.material.dispose();
  }
}
