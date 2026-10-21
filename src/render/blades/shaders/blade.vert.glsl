attribute float aHeight;
attribute float aEdge;

#ifdef USE_INSTANCING
  attribute float iDissolve;
#else
  uniform float uDissolve;
#endif

varying float vHeight;
varying float vEdge;
varying float vDissolve;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vec4 transformed = vec4(position, 1.0);
  vec3 objectNormal = normal;

  #ifdef USE_INSTANCING
    transformed = instanceMatrix * transformed;
    objectNormal = mat3(instanceMatrix) * objectNormal;
    vDissolve = iDissolve;
  #else
    vDissolve = uDissolve;
  #endif

  vec4 mvPosition = modelViewMatrix * transformed;
  vViewPosition = mvPosition.xyz;
  vNormal = normalize(normalMatrix * objectNormal);
  vHeight = aHeight;
  vEdge = aEdge;
  gl_Position = projectionMatrix * mvPosition;
}
