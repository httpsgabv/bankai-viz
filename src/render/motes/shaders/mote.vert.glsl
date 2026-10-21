uniform float uSize;
uniform float uViewportHeight;

attribute float aHeat;
attribute float aSeed;

varying float vHeat;
varying float vDepth;

void main() {
  vHeat = aHeat;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vDepth = -mvPosition.z;
  float size = uSize * (0.5 + fract(aSeed * 31.7)) * (1.0 + aHeat * 0.8);
  gl_PointSize = size * projectionMatrix[1][1] * uViewportHeight * 0.5 / max(0.1, vDepth);
  gl_Position = projectionMatrix * mvPosition;
}
