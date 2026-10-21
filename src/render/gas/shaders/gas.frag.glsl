uniform vec3 uColorCore;
uniform vec3 uColorEdge;
uniform float uHue;
uniform float uOpacity;
uniform float uGlow;
uniform float uFogNear;
uniform float uFogFar;

varying float vAlpha;
varying float vAge;
varying float vSeed;
varying float vDepth;

// Rotates a colour's hue (Rodrigues rotation around the grey axis).
vec3 hueShift(vec3 color, float angle) {
  const vec3 k = vec3(0.57735);
  float c = cos(angle);
  return color * c + cross(k, color) * sin(angle) + k * dot(k, color) * (1.0 - c);
}

void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  if (r >= 1.0) discard;

  float alpha = pow(1.0 - r, 1.8) * vAlpha * uOpacity;
  alpha *= 1.0 - smoothstep(uFogNear, uFogFar, vDepth);

  vec3 color = mix(uColorCore, uColorEdge, smoothstep(0.1, 0.9, vAge));
  color = max(hueShift(color, uHue + (vSeed - 0.5) * 0.35), 0.0);

  // Convert to output colour space *before* premultiplying, or faint puffs get over-brightened.
  vec3 outputColor = linearToOutputTexel(vec4(color, 1.0)).rgb;
  gl_FragColor = vec4(outputColor * alpha, alpha * (1.0 - uGlow));
}
