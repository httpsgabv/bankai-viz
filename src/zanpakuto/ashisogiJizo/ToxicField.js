import { PoisonCloud } from '../../effects/PoisonCloud.js';
import { NeuralWeb } from '../../effects/NeuralWeb.js';
import { NERVES } from './palette.js';

/**
 * Ashisogi Jizō's ability in one place: poison gas plus the nerve web it paralyses.
 * The releases decide where the gas comes from and how it moves.
 */
export class ToxicField {
  constructor({ atmosphere, gasCount, nodeCount, forces, floorY, nerveBounds, gridBounds }) {
    this.cloud = new PoisonCloud({ count: gasCount, atmosphere, forces, floorY, grid: gridBounds });
    this.web = new NeuralWeb({ count: nodeCount, ...nerveBounds, atmosphere, colors: NERVES });
  }

  get objects() {
    return [this.web.object, this.cloud.object];
  }

  get lifecycle() {
    return this.cloud.lifecycle;
  }

  get status() {
    return `Nerves paralysed · ${Math.round(this.web.paralysis * 100)}%`;
  }

  /** Applies the shared "Gas look", "Nerves" and lifetime params. */
  applyParams(p) {
    this.cloud.setAppearance({ size: p.gasSize, opacity: p.opacity, glow: p.glow, colorCore: p.colorCore, colorEdge: p.colorEdge });
    this.web.configure({ potency: p.potency, recovery: p.recovery, pulseSpeed: p.pulseSpeed, opacity: p.webOpacity });
    this.lifecycle.lifeMin = p.lifetime * 0.7;
    this.lifecycle.lifeMax = p.lifetime * 1.2;
  }

  setHue(hue) {
    this.cloud.setAppearance({ hue });
  }

  update(dt, time, viewportHeight) {
    this.cloud.update(dt, time, viewportHeight);
    this.web.update(dt, this.cloud.exposure, viewportHeight);
  }

  /** Clears the gas and lets every nerve recover instantly. */
  purge() {
    this.lifecycle.killAll();
    this.web.network.heal();
  }

  dispose() {
    this.cloud.dispose();
    this.web.dispose();
  }
}
