import { ParticleSwarm } from '../sim/ParticleSwarm.js';
import { ParticleLifecycle } from '../sim/ParticleLifecycle.js';
import { DensityGrid } from '../sim/DensityGrid.js';
import { GasMesh } from '../render/gas/GasMesh.js';

/**
 * Emitted, short-lived poison gas. Besides drawing itself it keeps a density grid
 * so other systems can ask "how much poison is here?" via `exposure(x, y, z)`.
 */
export class PoisonCloud {
  constructor({ count, atmosphere, forces, floorY = -Infinity, grid }) {
    this.swarm = new ParticleSwarm(count);
    this.swarm.forces = forces;
    this.swarm.floorY = floorY;
    this.lifecycle = new ParticleLifecycle(this.swarm);
    this.mesh = new GasMesh(this.swarm, this.lifecycle, atmosphere);
    this.grid = new DensityGrid(grid);
    this.exposure = (x, y, z) => this.grid.sample(x, y, z);
  }

  get object() {
    return this.mesh.object;
  }

  setAppearance(appearance) {
    this.mesh.setAppearance(appearance);
  }

  update(dt, time, viewportHeight) {
    this.swarm.update(dt, { dt, time });
    this.lifecycle.update(dt);
    this.grid.splat(this.swarm.positions, this.swarm.visibility);
    this.mesh.sync(viewportHeight);
  }

  dispose() {
    this.object.removeFromParent();
    this.object.geometry.dispose();
    this.mesh.material.dispose();
  }
}
