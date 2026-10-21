/** Cheap animated turbulence field (sum of travelling sine waves), offset per petal. */
export class FlowForce {
  strength = 1;
  frequency = 0.35;
  speed = 0.6;

  accumulate(swarm, i, out, context) {
    if (this.strength <= 0) return;
    const P = swarm.positions;
    const k = i * 3;
    const f = this.frequency;
    const t = context.time * this.speed;
    const s = swarm.seeds[i] * 6.2831;
    const x = P[k] * f;
    const y = P[k + 1] * f;
    const z = P[k + 2] * f;
    const g = this.strength;

    out[0] += (Math.sin(y * 1.3 + t + s) + Math.cos(z * 0.9 - t * 0.7)) * g;
    out[1] += (Math.sin(z * 1.1 + t * 0.8) + Math.cos(x * 1.4 + t * 0.5 + s)) * g;
    out[2] += (Math.sin(x * 0.8 - t * 0.6 + s) + Math.cos(y * 1.2 + t)) * g;
  }
}
