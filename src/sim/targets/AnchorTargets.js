/** Sends every petal back to its fixed anchor point (used when blades reform). */
export class AnchorTargets {
  constructor(anchors) {
    this.anchors = anchors;
  }

  target(i, out) {
    const k = i * 3;
    out[0] = this.anchors[k];
    out[1] = this.anchors[k + 1];
    out[2] = this.anchors[k + 2];
    return 1;
  }
}
