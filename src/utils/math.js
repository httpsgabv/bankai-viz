export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const clamp01 = (value) => clamp(value, 0, 1);

export const lerp = (a, b, t) => a + (b - a) * t;

/** Frame-rate independent exponential smoothing towards a target. */
export const damp = (current, target, lambda, dt) => lerp(current, target, 1 - Math.exp(-lambda * dt));

export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export const easeOutCubic = (t) => 1 - (1 - t) ** 3;

/** Writes a uniformly distributed random unit vector into `out` at `offset`. */
export function randomUnitVector(out, offset = 0) {
  const z = Math.random() * 2 - 1;
  const theta = Math.random() * Math.PI * 2;
  const r = Math.sqrt(1 - z * z);
  out[offset] = r * Math.cos(theta);
  out[offset + 1] = r * Math.sin(theta);
  out[offset + 2] = z;
  return out;
}

/** Parameter t in [0, 1] of the point on segment a→b closest to p (all THREE.Vector3). */
export function closestOnSegment(p, a, b) {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const abz = b.z - a.z;
  const lengthSq = abx * abx + aby * aby + abz * abz;
  if (lengthSq < 1e-9) return 0;
  return clamp01(((p.x - a.x) * abx + (p.y - a.y) * aby + (p.z - a.z) * abz) / lengthSq);
}
