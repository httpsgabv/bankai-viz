import * as THREE from 'three';

/**
 * Premultiplied blending whose "glow" is chosen per fragment: shaders output
 * vec4(color * a, a * (1 - glow)). glow = 0 → normal transparency, glow = 1 → additive.
 * `color` must already be in output (sRGB) space — use linearToOutputTexel before premultiplying.
 */
export const premultipliedGlow = {
  transparent: true,
  depthWrite: false,
  blending: THREE.CustomBlending,
  blendEquation: THREE.AddEquation,
  blendSrc: THREE.OneFactor,
  blendDst: THREE.OneMinusSrcAlphaFactor,
};
