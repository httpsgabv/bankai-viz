uniform vec3 uColor;
uniform vec3 uCore;
uniform float uOpacity;
uniform float uFogNear;
uniform float uFogFar;

varying float vAcross;
varying float vAlong;
varying float vDepth;

void main() {
  float across = abs(vAcross);
  float horns = pow(sin(3.14159265 * vAlong), 0.6);
  float alpha = (1.0 - across * across) * horns * uOpacity;
  alpha *= 1.0 - smoothstep(uFogNear, uFogFar, vDepth);

  // Hot, pale core along the leading edge, crimson towards the trailing edges.
  vec3 color = mix(uCore, uColor, smoothstep(0.0, 0.7, across));
  gl_FragColor = vec4(color, alpha);
  #include <colorspace_fragment>
}
