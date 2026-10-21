attribute float iReveal;

varying float vRim;
varying float vReveal;
varying float vDepth;

void main() {
  // Cap centre vertex has rim 0, outer vertices rim 1 → bright cell edges.
  vRim = length(position.xy);
  vReveal = iReveal;
  vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  vDepth = -mvPosition.z;
  gl_Position = projectionMatrix * mvPosition;
}
