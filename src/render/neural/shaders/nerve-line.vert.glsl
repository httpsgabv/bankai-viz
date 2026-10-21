attribute float aParalysis;

varying float vParalysis;
varying float vDepth;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vParalysis = aParalysis;
  vDepth = -mvPosition.z;
  gl_Position = projectionMatrix * mvPosition;
}
