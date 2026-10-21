varying vec2 vUv;
varying vec3 vWorldPosition;
varying float vDepth;

void main() {
  vUv = uv;
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  vec4 mvPosition = viewMatrix * worldPosition;
  vDepth = -mvPosition.z;
  gl_Position = projectionMatrix * mvPosition;
}
