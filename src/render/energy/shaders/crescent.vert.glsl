attribute float aAcross;
attribute float aAlong;

varying float vAcross;
varying float vAlong;
varying float vDepth;

void main() {
  vAcross = aAcross;
  vAlong = aAlong;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vDepth = -mvPosition.z;
  gl_Position = projectionMatrix * mvPosition;
}
