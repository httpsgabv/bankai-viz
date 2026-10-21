/**
 * Binds petals to points on blades. As a blade dissolves (0 → 1, tip first) petals are
 * released from their anchor; as it reforms (1 → 0) they are pinned back and hidden.
 */
export class DissolveEmitter {
  constructor(swarm, { anchors, thresholds, bladeIndex }) {
    this.swarm = swarm;
    this.anchors = anchors;
    this.thresholds = thresholds;
    this.bladeIndex = bladeIndex;
    for (let i = 0; i < swarm.count; i++) this.#pin(i);
  }

  /** @param dissolve per-blade dissolve amount in [0, 1] */
  sync(dissolve, ejectSpeed = 1) {
    const { swarm, thresholds, bladeIndex, anchors: A } = this;
    for (let i = 0; i < swarm.count; i++) {
      const released = dissolve[bladeIndex[i]] >= thresholds[i];
      if (released && !swarm.free[i]) {
        const k = i * 3;
        swarm.release(
          i,
          A[k],
          A[k + 1],
          A[k + 2],
          (Math.random() - 0.5) * ejectSpeed,
          (Math.random() - 0.2) * ejectSpeed,
          (Math.random() - 0.5) * ejectSpeed,
        );
      } else if (!released && swarm.free[i]) {
        this.#pin(i);
      }
    }
  }

  #pin(i) {
    const k = i * 3;
    this.swarm.pin(i, this.anchors[k], this.anchors[k + 1], this.anchors[k + 2]);
  }
}
