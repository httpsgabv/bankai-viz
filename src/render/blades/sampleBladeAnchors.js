import * as THREE from 'three';

/**
 * Scatters `count` anchor points over one or more blades (given as world matrices).
 * Each anchor gets a dissolve threshold so that tip anchors release first.
 */
export function sampleBladeAnchors(profile, matrices, count) {
  const anchors = new Float32Array(count * 3);
  const thresholds = new Float32Array(count);
  const bladeIndex = new Uint16Array(count);
  const point = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    const blade = i % matrices.length;
    const t = Math.random();
    const { spine, edge, thickness } = profile.sectionAt(t);
    point
      .set(spine + (edge - spine) * Math.random(), t * profile.length, (Math.random() - 0.5) * thickness)
      .applyMatrix4(matrices[blade]);

    anchors.set([point.x, point.y, point.z], i * 3);
    thresholds[i] = 0.002 + (1 - t) * 0.996;
    bladeIndex[i] = blade;
  }

  return { anchors, thresholds, bladeIndex };
}

/** Writes `local` anchor points transformed by `matrix` into `out` (for blades that move). */
export function transformAnchors(local, matrix, out) {
  const e = matrix.elements;
  for (let k = 0; k < local.length; k += 3) {
    const x = local[k];
    const y = local[k + 1];
    const z = local[k + 2];
    out[k] = e[0] * x + e[4] * y + e[8] * z + e[12];
    out[k + 1] = e[1] * x + e[5] * y + e[9] * z + e[13];
    out[k + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
  }
  return out;
}
