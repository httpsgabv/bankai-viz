uniform float uSize;
uniform float uViewportHeight;

attribute float aVisibility;
attribute float aAge;
attribute float aSeed;

varying float vAlpha;
varying float vAge;
varying float vSeed;
varying float vDepth;

void main() {
  vAlpha = aVisibility;
  vAge = aAge;
  vSeed = aSeed;

  if (aVisibility <= 0.0) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    return;
  }

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vDepth = -mvPosition.z;

  // Gas puffs swell as they age.
  float size = uSize * (0.55 + aAge * 1.6) * (0.7 + 0.6 * fract(aSeed * 53.1));
  gl_PointSize = size * projectionMatrix[1][1] * uViewportHeight * 0.5 / max(0.1, vDepth);
  gl_Position = projectionMatrix * mvPosition;
}
