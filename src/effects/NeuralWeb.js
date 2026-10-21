import { NeuralNetwork } from '../sim/NeuralNetwork.js';
import { NeuralWebMesh } from '../render/neural/NeuralWebMesh.js';

/** A nerve web that poison can paralyse: simulation + rendering. */
export class NeuralWeb {
  constructor({ count, min, max, atmosphere, colors }) {
    this.network = new NeuralNetwork({ count, min, max, pulses: Math.round(count * 0.8) });
    this.mesh = new NeuralWebMesh(this.network, atmosphere, colors);
  }

  get object() {
    return this.mesh.object;
  }

  /** Share of the web currently paralysed, 0 → 1. */
  get paralysis() {
    return this.network.paralysedShare;
  }

  configure({ potency, recovery, pulseSpeed, opacity }) {
    Object.assign(this.network, { potency, recovery, pulseSpeed });
    this.mesh.setOpacity(opacity);
  }

  update(dt, exposure, viewportHeight) {
    this.network.update(dt, exposure);
    this.mesh.sync(viewportHeight);
  }

  dispose() {
    this.object.removeFromParent();
    this.mesh.dispose();
  }
}
