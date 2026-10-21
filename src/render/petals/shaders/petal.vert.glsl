uniform float uTime;
uniform float uSize;
uniform float uSpin;

attribute float aTip;
attribute vec3 iOffset;
attribute float iSeed;
attribute float iVisibility;

varying float vTip;
varying float vSeed;
varying vec3 vNormal;
varying vec3 vViewPosition;

mat3 rotationAround(vec3 axis, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  float oc = 1.0 - c;
  return mat3(
    oc * axis.x * axis.x + c,          oc * axis.x * axis.y + axis.z * s, oc * axis.z * axis.x - axis.y * s,
    oc * axis.x * axis.y - axis.z * s, oc * axis.y * axis.y + c,          oc * axis.y * axis.z + axis.x * s,
    oc * axis.z * axis.x + axis.y * s, oc * axis.y * axis.z - axis.x * s, oc * axis.z * axis.z + c
  );
}

void main() {
  float phase = iSeed * 6.2831853;

  // Each petal tumbles around its own axis and flutters around its length.
  vec3 axis = normalize(vec3(sin(phase * 3.1), cos(phase * 1.7), sin(phase * 2.3) + 0.35));
  float rate = uSpin * (0.5 + fract(iSeed * 13.37));
  mat3 tumble = rotationAround(axis, uTime * rate + phase * 7.0);
  float flutter = sin(uTime * (2.0 + 3.0 * fract(iSeed * 7.13)) + phase) * 0.55;
  mat3 rotation = tumble * rotationAround(vec3(1.0, 0.0, 0.0), flutter);

  float scale = uSize * (0.7 + 0.6 * fract(iSeed * 91.7)) * iVisibility;
  vec3 transformed = rotation * (position * scale) + iOffset;

  vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
  vViewPosition = mvPosition.xyz;
  vNormal = normalize(normalMatrix * (rotation * normal));
  vTip = aTip;
  vSeed = iSeed;
  gl_Position = projectionMatrix * mvPosition;
}
