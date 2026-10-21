uniform float uSize;
uniform float uViewportHeight;

attribute float aMix;
attribute float aGlow;
attribute float aAlpha;

varying float vMix;
varying float vGlow;
varying float vAlpha;
varying float vDepth;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vMix = aMix;
  vGlow = aGlow;
  vAlpha = aAlpha;
  vDepth = -mvPosition.z;
  float size = uSize * (1.0 + aGlow * 1.2);
  gl_PointSize = size * projectionMatrix[1][1] * uViewportHeight * 0.5 / max(0.1, vDepth);
  gl_Position = projectionMatrix * mvPosition;
}
